import { Company, CompanyDetailedInfo } from '../models/Company';
import geminiService from '../services/geminiService';
import infoSimplesService from '../services/infoSimplesService';
import { logInfo, logError } from '../utils/logger';

/**
 * Agente especializado em análise e enriquecimento de dados de empresas
 */
export class CompanyAnalysisAgent {
  /**
   * Analisa e enriquece informações de uma empresa
   */
  async analyze(company: Company, options: AnalysisOptions = {}): Promise<CompanyDetailedInfo> {
    try {
      logInfo('Agente iniciando análise de empresa', {
        companyName: company.name,
        options,
      });

      const {
        includeDepartments = true,
        useInfoSimples = true,
        useGemini = true,
      } = options;

      let detailedInfo: CompanyDetailedInfo | null = null;

      // Estratégia 1: Tentar InfoSimples primeiro (empresas brasileiras)
      if (useInfoSimples && this.isBrazilianCompany(company)) {
        detailedInfo = await this.analyzeWithInfoSimples(company);
      }

      // Estratégia 2: Se não encontrou ou não é brasileira, usar Gemini AI
      if (!detailedInfo && useGemini) {
        detailedInfo = await this.analyzeWithGemini(company, includeDepartments);
      }

      // Se mesmo assim não conseguiu, retornar informações básicas
      if (!detailedInfo) {
        detailedInfo = this.createBasicInfo(company);
      }

      logInfo('Análise de empresa concluída', {
        companyName: company.name,
        hasAddress: !!detailedInfo.address,
        hasContact: !!(detailedInfo.phone || detailedInfo.email),
        hasDepartments: !!detailedInfo.departments,
      });

      return detailedInfo;
    } catch (error) {
      logError('Erro no agente de análise de empresa', error, { companyName: company.name });
      return this.createBasicInfo(company);
    }
  }

  /**
   * Analisa múltiplas empresas em lote
   */
  async analyzeBatch(companies: Company[], options: AnalysisOptions = {}): Promise<Map<string, CompanyDetailedInfo>> {
    const results = new Map<string, CompanyDetailedInfo>();

    logInfo('Agente iniciando análise em lote', { totalCompanies: companies.length });

    // Processar em paralelo com limite de concorrência
    const batchSize = 5;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(company => this.analyze(company, options))
      );

      batchResults.forEach((result, index) => {
        const company = batch[index];
        if (result.status === 'fulfilled') {
          results.set(company.id, result.value);
        } else {
          logError('Erro ao analisar empresa em lote', result.reason, { companyName: company.name });
          results.set(company.id, this.createBasicInfo(company));
        }
      });

      // Pequeno delay entre lotes para evitar rate limiting
      if (i + batchSize < companies.length) {
        await this.sleep(1000);
      }
    }

    logInfo('Análise em lote concluída', { totalProcessed: results.size });

    return results;
  }

  /**
   * Verifica se é empresa brasileira
   */
  private isBrazilianCompany(company: Company): boolean {
    const brazilKeywords = ['brasil', 'brazil', 'br'];
    const country = company.country?.toLowerCase() || '';
    return brazilKeywords.some(keyword => country.includes(keyword));
  }

  /**
   * Analisa empresa usando InfoSimples
   */
  private async analyzeWithInfoSimples(company: Company): Promise<CompanyDetailedInfo | null> {
    try {
      logInfo('Tentando análise via InfoSimples', { companyName: company.name });

      const info = await infoSimplesService.searchCompanyByName(company.name);

      if (info) {
        logInfo('Informações obtidas via InfoSimples', { companyName: company.name });
        return info;
      }

      return null;
    } catch (error) {
      logError('Erro ao analisar com InfoSimples', error, { companyName: company.name });
      return null;
    }
  }

  /**
   * Analisa empresa usando Gemini AI
   */
  private async analyzeWithGemini(company: Company, includeDepartments: boolean): Promise<CompanyDetailedInfo | null> {
    try {
      logInfo('Tentando análise via Gemini AI', { companyName: company.name });

      const info = await geminiService.analyzeCompany(company, includeDepartments);

      if (info) {
        logInfo('Informações obtidas via Gemini AI', { companyName: company.name });
        return info;
      }

      return null;
    } catch (error) {
      logError('Erro ao analisar com Gemini', error, { companyName: company.name });
      return null;
    }
  }

  /**
   * Cria informações básicas a partir dos dados existentes
   */
  private createBasicInfo(company: Company): CompanyDetailedInfo {
    return {
      address: company.headquarters ? {
        fullAddress: company.headquarters,
        city: company.city,
        state: company.state,
        country: company.country,
      } : undefined,
      source: 'Dados originais',
      analyzedAt: new Date(),
    };
  }

  /**
   * Aguarda um tempo em ms
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export interface AnalysisOptions {
  includeDepartments?: boolean;
  useInfoSimples?: boolean;
  useGemini?: boolean;
}

// Exportar instância singleton
export default new CompanyAnalysisAgent();
