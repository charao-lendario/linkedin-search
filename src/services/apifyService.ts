import { ApifyClient } from 'apify-client';
import config from '../config';
import { logInfo, logError, logApiCall } from '../utils/logger';
import { Company, CompanySearchFilters } from '../models/Company';
import { Profile, ProfileSearchFilters } from '../models/Profile';
import { v4 as uuidv4 } from 'uuid';
import mockDataService from './mockDataService';

export class ApifyService {
  private client: ApifyClient;

  constructor() {
    this.client = new ApifyClient({
      token: config.apifyApiKey,
    });
  }

  /**
   * Busca empresas no LinkedIn via Apify
   */
  async searchCompanies(filters: CompanySearchFilters, maxResults = 100): Promise<Company[]> {
    const startTime = Date.now();

    try {
      // Se modo demo ativado, retornar dados fake
      if (config.useMockData) {
        logInfo('🎭 MODO DEMO: Usando dados simulados', { filters, maxResults });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
        const mockCompanies = mockDataService.generateMockCompanies(maxResults, filters);
        logInfo('MODO DEMO: Empresas geradas', { total: mockCompanies.length });
        return mockCompanies;
      }

      logInfo('Iniciando busca de empresas no LinkedIn', { filters, maxResults });

      // Construir query de busca
      const searchQuery = this.buildCompanySearchQuery(filters);

      // Input para o Apify Actor
      const input = {
        searchUrls: [searchQuery],
        maxResults,
        proxyConfiguration: {
          useApifyProxy: true,
        },
      };

      // Executar actor
      const run = await this.client.actor(config.apifyActors.linkedinCompanySearch).call(input);

      // Obter resultados
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      // Mapear para o modelo Company
      const companies = items.map(item => this.mapApifyCompanyToModel(item, filters));

      const duration = Date.now() - startTime;
      logApiCall('Apify', 'searchCompanies', duration);
      logInfo('Busca de empresas concluída', { totalFound: companies.length, duration });

      return companies;
    } catch (error) {
      logError('Erro ao buscar empresas no Apify', error, { filters });
      throw error;
    }
  }

  /**
   * Busca perfis no LinkedIn via Apify
   */
  async searchProfiles(filters: ProfileSearchFilters, maxResults = 100): Promise<Profile[]> {
    const startTime = Date.now();

    try {
      // Se modo demo ativado, retornar dados fake
      if (config.useMockData) {
        logInfo('🎭 MODO DEMO: Usando dados simulados', { filters, maxResults });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
        const mockProfiles = mockDataService.generateMockProfiles(maxResults, filters);
        logInfo('MODO DEMO: Perfis gerados', { total: mockProfiles.length });
        return mockProfiles;
      }

      logInfo('Iniciando busca de perfis no LinkedIn', { filters, maxResults });

      // Construir query de busca
      const searchQuery = this.buildProfileSearchQuery(filters);

      // Input para o Apify Actor
      const input = {
        searchUrls: [searchQuery],
        maxResults,
        proxyConfiguration: {
          useApifyProxy: true,
        },
      };

      // Executar actor
      const run = await this.client.actor(config.apifyActors.linkedinPeopleSearch).call(input);

      // Obter resultados
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      // Mapear para o modelo Profile
      const profiles = items.map(item => this.mapApifyProfileToModel(item, filters));

      const duration = Date.now() - startTime;
      logApiCall('Apify', 'searchProfiles', duration);
      logInfo('Busca de perfis concluída', { totalFound: profiles.length, duration });

      return profiles;
    } catch (error) {
      logError('Erro ao buscar perfis no Apify', error, { filters });
      throw error;
    }
  }

  /**
   * Busca vagas abertas de uma empresa
   */
  async searchCompanyJobs(companyLinkedinUrl: string): Promise<any[]> {
    const startTime = Date.now();

    try {
      const input = {
        searchUrls: [companyLinkedinUrl],
        maxResults: 50,
      };

      const run = await this.client.actor(config.apifyActors.linkedinJobSearch).call(input);
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      const duration = Date.now() - startTime;
      logApiCall('Apify', 'searchCompanyJobs', duration);

      return items;
    } catch (error) {
      logError('Erro ao buscar vagas da empresa', error);
      return [];
    }
  }

  /**
   * Constrói URL de busca para empresas
   */
  private buildCompanySearchQuery(filters: CompanySearchFilters): string {
    const params = new URLSearchParams();

    // Keywords principais
    const keywords: string[] = [];

    if (filters.segment) {
      keywords.push(filters.segment);
    }

    if (filters.industry) {
      keywords.push(filters.industry);
    }

    if (filters.keywords && filters.keywords.length > 0) {
      keywords.push(...filters.keywords);
    }

    if (keywords.length > 0) {
      params.append('keywords', keywords.join(' '));
    }

    // Localização
    if (filters.country || filters.state || filters.city) {
      const location = [filters.city, filters.state, filters.country]
        .filter(Boolean)
        .join(', ');
      params.append('location', location);
    }

    // Tamanho da empresa
    if (filters.companySize) {
      params.append('companySize', filters.companySize);
    }

    return `https://www.linkedin.com/search/results/companies/?${params.toString()}`;
  }

  /**
   * Constrói URL de busca para perfis
   */
  private buildProfileSearchQuery(filters: ProfileSearchFilters): string {
    const params = new URLSearchParams();

    // Keywords principais
    const keywords: string[] = [];

    if (filters.position) {
      keywords.push(filters.position);
    }

    if (filters.keywords && filters.keywords.length > 0) {
      keywords.push(...filters.keywords);
    }

    if (keywords.length > 0) {
      params.append('keywords', keywords.join(' '));
    }

    // Localização
    if (filters.country || filters.state || filters.city) {
      const location = [filters.city, filters.state, filters.country]
        .filter(Boolean)
        .join(', ');
      params.append('location', location);
    }

    // Open to work
    if (filters.isOpenToWork === 'Sim') {
      params.append('openToWork', 'true');
    }

    // Nível de experiência
    if (filters.experienceLevel) {
      params.append('experience', filters.experienceLevel);
    }

    // Indústria
    if (filters.industry) {
      params.append('industry', filters.industry);
    }

    return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
  }

  /**
   * Mapeia resultado do Apify para modelo Company
   */
  private mapApifyCompanyToModel(item: any, filters: CompanySearchFilters): Company {
    return {
      id: uuidv4(),
      name: item.name || item.companyName || '',
      linkedinUrl: item.url || item.linkedInUrl || '',
      website: item.website || '',
      industry: item.industry || filters.segment || '',
      companySize: item.companySize || item.staffCount || '',
      headquarters: item.headquarters || item.location || '',
      description: item.description || item.tagline || '',
      specialties: item.specialties || [],
      foundedYear: item.foundedYear || undefined,
      country: filters.country,
      state: filters.state,
      city: filters.city,
      segment: filters.segment,
      hasOpenPositions: filters.hasOpenPositions,
      createdAt: new Date(),
    };
  }

  /**
   * Mapeia resultado do Apify para modelo Profile
   */
  private mapApifyProfileToModel(item: any, filters: ProfileSearchFilters): Profile {
    return {
      id: uuidv4(),
      fullName: item.name || item.fullName || '',
      linkedinUrl: item.url || item.profileUrl || '',
      headline: item.headline || item.title || '',
      location: item.location || '',
      profilePictureUrl: item.profilePicture || item.photo || '',
      currentPosition: item.positions && item.positions.length > 0 ? {
        title: item.positions[0].title || '',
        company: item.positions[0].companyName || '',
        companyLinkedinUrl: item.positions[0].companyUrl || '',
        location: item.positions[0].location || '',
        startDate: item.positions[0].start || '',
        endDate: item.positions[0].end || '',
        current: item.positions[0].current || false,
        description: item.positions[0].description || '',
      } : undefined,
      experience: item.positions?.map((pos: any) => ({
        title: pos.title || '',
        company: pos.companyName || '',
        companyLinkedinUrl: pos.companyUrl || '',
        location: pos.location || '',
        startDate: pos.start || '',
        endDate: pos.end || '',
        current: pos.current || false,
        description: pos.description || '',
      })) || [],
      education: item.schools?.map((school: any) => ({
        school: school.schoolName || '',
        degree: school.degreeName || '',
        fieldOfStudy: school.fieldOfStudy || '',
        startDate: school.start || '',
        endDate: school.end || '',
      })) || [],
      skills: item.skills || [],
      languages: item.languages?.map((lang: any) => ({
        name: lang.name || lang,
        proficiency: lang.proficiency || '',
      })) || [],
      about: item.about || item.summary || '',
      connectionDegree: item.connectionDegree || undefined,
      connections: item.connectionsCount || undefined,
      country: filters.country,
      state: filters.state,
      city: filters.city,
      desiredPosition: filters.position,
      source: 'linkedin',
      createdAt: new Date(),
    };
  }
}

// Exportar instância singleton
export default new ApifyService();
