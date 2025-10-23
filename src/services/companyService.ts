import { v4 as uuidv4 } from 'uuid';
import {
  Company,
  CompanySearchFilters,
  CompanySearchRequest,
  CompanyAnalysisRequest,
  CompanyDetailedInfo,
} from '../models/Company';
import {
  CompanySearchResult,
  SearchStatus,
  calculateCacheExpiry,
  generateCacheKey,
} from '../models/SearchResult';
import apifyService from './apifyService';
import geminiService from './geminiService';
import infoSimplesService from './infoSimplesService';
import config from '../config';
import { logInfo, logError, logSearchStart, logSearchComplete, logSearchError } from '../utils/logger';

// Armazenamento em memória (em produção, usar banco de dados)
const searchCache = new Map<string, CompanySearchResult>();
const companyCache = new Map<string, Company>();

export class CompanyService {
  /**
   * Realiza busca de empresas
   */
  async searchCompanies(request: CompanySearchRequest): Promise<CompanySearchResult> {
    const searchId = uuidv4();
    const startTime = Date.now();

    logSearchStart(searchId, 'company', request.filters);

    try {
      // Verificar cache
      const cacheKey = generateCacheKey('company', request.filters);
      const cachedResult = searchCache.get(cacheKey);

      if (cachedResult && cachedResult.cachedUntil && new Date() < cachedResult.cachedUntil) {
        logInfo('Resultado encontrado em cache', { searchId, cacheKey });
        return cachedResult;
      }

      // Buscar no Apify/LinkedIn
      const companies = await apifyService.searchCompanies(
        request.filters,
        request.maxResults || 100
      );

      // Se solicitado, enriquecer com informações detalhadas
      if (request.includeDetailedInfo) {
        await this.enrichCompaniesWithDetails(companies);
      }

      // Se solicitado, verificar vagas abertas
      if (request.filters.hasOpenPositions) {
        await this.filterCompaniesByOpenPositions(companies);
      }

      // Salvar empresas no cache
      companies.forEach(company => {
        companyCache.set(company.id, company);
      });

      // Criar resultado
      const result: CompanySearchResult = {
        id: searchId,
        type: 'company',
        filters: { type: 'company', companyFilters: request.filters },
        results: companies,
        totalResults: companies.length,
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date(),
        cachedUntil: calculateCacheExpiry(config.cacheDuration),
        cacheKey,
        stats: {
          totalFound: companies.length,
          totalProcessed: companies.length,
          totalFiltered: companies.length,
          processingTimeMs: Date.now() - startTime,
        },
        detailedAnalysisCount: request.includeDetailedInfo ? companies.length : 0,
      };

      // Salvar no cache
      searchCache.set(cacheKey, result);
      searchCache.set(searchId, result);

      const duration = Date.now() - startTime;
      logSearchComplete(searchId, companies.length, duration);

      return result;
    } catch (error) {
      logSearchError(searchId, error);

      const errorResult: CompanySearchResult = {
        id: searchId,
        type: 'company',
        filters: { type: 'company', companyFilters: request.filters },
        results: [],
        totalResults: 0,
        status: 'failed',
        createdAt: new Date(),
        errors: [
          {
            code: 'SEARCH_ERROR',
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date(),
          },
        ],
      };

      return errorResult;
    }
  }

  /**
   * Analisa uma empresa específica em detalhes
   */
  async analyzeCompany(request: CompanyAnalysisRequest): Promise<Company> {
    try {
      const company = companyCache.get(request.companyId);

      if (!company) {
        throw new Error(`Empresa não encontrada: ${request.companyId}`);
      }

      logInfo('Analisando empresa em detalhes', {
        companyId: request.companyId,
        companyName: company.name,
      });

      let detailedInfo: CompanyDetailedInfo | undefined;

      // Tentar obter informações via InfoSimples primeiro (para empresas brasileiras)
      if (company.country?.toLowerCase() === 'brasil' || company.country?.toLowerCase() === 'brazil') {
        const infoSimplesData = await infoSimplesService.searchCompanyByName(company.name);
        detailedInfo = infoSimplesData || undefined;
      }

      // Se não encontrou ou não é Brasil, usar Gemini AI
      if (!detailedInfo) {
        detailedInfo = await geminiService.analyzeCompany(company, request.includeDepartments);
      }

      // Atualizar empresa com informações detalhadas
      company.detailedInfo = detailedInfo;
      company.updatedAt = new Date();

      // Atualizar cache
      companyCache.set(company.id, company);

      logInfo('Empresa analisada com sucesso', { companyId: company.id });

      return company;
    } catch (error) {
      logError('Erro ao analisar empresa', error, { companyId: request.companyId });
      throw error;
    }
  }

  /**
   * Obtém resultado de busca por ID
   */
  async getSearchResult(searchId: string): Promise<CompanySearchResult | null> {
    const result = searchCache.get(searchId);
    return result || null;
  }

  /**
   * Obtém empresa por ID
   */
  async getCompanyById(companyId: string): Promise<Company | null> {
    const company = companyCache.get(companyId);
    return company || null;
  }

  /**
   * Lista todas as buscas armazenadas
   */
  async listSearches(): Promise<CompanySearchResult[]> {
    return Array.from(searchCache.values());
  }

  /**
   * Enriquece empresas com informações detalhadas
   */
  private async enrichCompaniesWithDetails(companies: Company[]): Promise<void> {
    const promises = companies.map(async (company) => {
      try {
        // Tentar InfoSimples primeiro para empresas brasileiras
        if (company.country?.toLowerCase() === 'brasil' || company.country?.toLowerCase() === 'brazil') {
          const infoSimplesData = await infoSimplesService.searchCompanyByName(company.name);
          if (infoSimplesData) {
            company.detailedInfo = infoSimplesData;
            return;
          }
        }

        // Fallback para Gemini AI
        const geminiData = await geminiService.analyzeCompany(company, true);
        company.detailedInfo = geminiData;
      } catch (error) {
        logError('Erro ao enriquecer empresa', error, { companyName: company.name });
        // Continuar mesmo com erro
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Filtra empresas por vagas abertas
   */
  private async filterCompaniesByOpenPositions(companies: Company[]): Promise<Company[]> {
    const companiesWithJobs: Company[] = [];

    for (const company of companies) {
      try {
        if (company.linkedinUrl) {
          const jobs = await apifyService.searchCompanyJobs(company.linkedinUrl);

          if (jobs && jobs.length > 0) {
            company.hasOpenPositions = true;
            companiesWithJobs.push(company);
          } else {
            company.hasOpenPositions = false;
          }
        }
      } catch (error) {
        logError('Erro ao verificar vagas da empresa', error, { companyName: company.name });
        // Manter empresa na lista mesmo com erro
        companiesWithJobs.push(company);
      }
    }

    // Atualizar array original
    companies.length = 0;
    companies.push(...companiesWithJobs);

    return companies;
  }

  /**
   * Limpa cache expirado
   */
  clearExpiredCache(): void {
    const now = new Date();
    let cleared = 0;

    for (const [key, result] of searchCache.entries()) {
      if (result.cachedUntil && now > result.cachedUntil) {
        searchCache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      logInfo('Cache expirado limpo', { itemsCleared: cleared });
    }
  }

  /**
   * Limpa todo o cache
   */
  clearAllCache(): void {
    searchCache.clear();
    companyCache.clear();
    logInfo('Todo o cache foi limpo');
  }
}

// Exportar instância singleton
export default new CompanyService();
