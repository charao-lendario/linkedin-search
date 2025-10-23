import { v4 as uuidv4 } from 'uuid';
import {
  Profile,
  ProfileSearchFilters,
  ProfileSearchRequest,
  ProfileFilterRequest,
  JobRequirements,
  ProfileMatchResult,
} from '../models/Profile';
import {
  ProfileSearchResult,
  calculateCacheExpiry,
  generateCacheKey,
} from '../models/SearchResult';
import apifyService from './apifyService';
import geminiService from './geminiService';
import config from '../config';
import { logInfo, logError, logSearchStart, logSearchComplete, logSearchError } from '../utils/logger';

// Armazenamento em memória (em produção, usar banco de dados)
const searchCache = new Map<string, ProfileSearchResult>();
const profileCache = new Map<string, Profile>();

export class ProfileService {
  /**
   * Realiza busca de perfis
   */
  async searchProfiles(request: ProfileSearchRequest): Promise<ProfileSearchResult> {
    const searchId = uuidv4();
    const startTime = Date.now();

    logSearchStart(searchId, 'profile', request.filters);

    try {
      // Verificar cache
      const cacheKey = generateCacheKey('profile', request.filters);
      const cachedResult = searchCache.get(cacheKey);

      if (cachedResult && cachedResult.cachedUntil && new Date() < cachedResult.cachedUntil) {
        logInfo('Resultado encontrado em cache', { searchId, cacheKey });
        return cachedResult;
      }

      // Buscar no LinkedIn via Apify
      let profiles = await apifyService.searchProfiles(
        request.filters,
        request.maxResults || 100
      );

      // Se fornecidos requisitos da vaga, filtrar e ordenar por match
      let matchedProfiles: ProfileMatchResult[] = [];
      if (request.jobRequirements) {
        const requirements = await this.parseJobRequirements(request.jobRequirements);
        matchedProfiles = await geminiService.filterProfilesByRequirements(profiles, requirements);

        // Atualizar profiles com score
        profiles = matchedProfiles.map(match => {
          const profile = match.profile;
          profile.matchScore = match.score;
          profile.matchReasons = match.reasons;
          return profile;
        });
      }

      // Filtrar por "Aberto a trabalho" se especificado
      if (request.filters.isOpenToWork === 'Sim') {
        profiles = profiles.filter(p => p.isOpenToWork === true);
      } else if (request.filters.isOpenToWork === 'Não') {
        profiles = profiles.filter(p => p.isOpenToWork === false);
      }

      // Salvar perfis no cache
      profiles.forEach(profile => {
        profile.searchId = searchId;
        profileCache.set(profile.id, profile);
      });

      // Calcular estatísticas
      const matchScores = profiles
        .map(p => p.matchScore)
        .filter((score): score is number => score !== undefined);

      const averageMatchScore = matchScores.length > 0
        ? matchScores.reduce((a, b) => a + b, 0) / matchScores.length
        : undefined;

      const topProfiles = profiles
        .filter(p => p.matchScore !== undefined)
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 10);

      // Criar resultado
      const result: ProfileSearchResult = {
        id: searchId,
        type: 'profile',
        filters: { type: 'profile', profileFilters: request.filters },
        results: profiles,
        totalResults: profiles.length,
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date(),
        cachedUntil: calculateCacheExpiry(config.cacheDuration),
        cacheKey,
        stats: {
          totalFound: profiles.length,
          totalProcessed: profiles.length,
          totalFiltered: profiles.length,
          processingTimeMs: Date.now() - startTime,
        },
        matchedProfiles: matchScores.length,
        averageMatchScore,
        topProfiles: topProfiles.length > 0 ? topProfiles : undefined,
      };

      // Salvar no cache
      searchCache.set(cacheKey, result);
      searchCache.set(searchId, result);

      const duration = Date.now() - startTime;
      logSearchComplete(searchId, profiles.length, duration);

      return result;
    } catch (error) {
      logSearchError(searchId, error);

      const errorResult: ProfileSearchResult = {
        id: searchId,
        type: 'profile',
        filters: { type: 'profile', profileFilters: request.filters },
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
   * Filtra perfis existentes com base em requisitos
   */
  async filterProfiles(request: ProfileFilterRequest): Promise<ProfileMatchResult[]> {
    try {
      const searchResult = searchCache.get(request.searchId);

      if (!searchResult) {
        throw new Error(`Busca não encontrada: ${request.searchId}`);
      }

      const profiles = searchResult.results as Profile[];

      logInfo('Filtrando perfis por requisitos', {
        searchId: request.searchId,
        totalProfiles: profiles.length,
      });

      const matchResults = await geminiService.filterProfilesByRequirements(
        profiles,
        request.requirements,
        request.minMatchScore || 60
      );

      logInfo('Filtragem de perfis concluída', {
        searchId: request.searchId,
        matchedProfiles: matchResults.length,
      });

      return matchResults;
    } catch (error) {
      logError('Erro ao filtrar perfis', error, { searchId: request.searchId });
      throw error;
    }
  }

  /**
   * Obtém resultado de busca por ID
   */
  async getSearchResult(searchId: string): Promise<ProfileSearchResult | null> {
    const result = searchCache.get(searchId);
    return result || null;
  }

  /**
   * Obtém perfil por ID
   */
  async getProfileById(profileId: string): Promise<Profile | null> {
    const profile = profileCache.get(profileId);
    return profile || null;
  }

  /**
   * Lista todas as buscas armazenadas
   */
  async listSearches(): Promise<ProfileSearchResult[]> {
    return Array.from(searchCache.values());
  }

  /**
   * Extrai links de perfis de um resultado de busca
   */
  async getProfileLinks(searchId: string): Promise<string[]> {
    const result = searchCache.get(searchId);

    if (!result) {
      throw new Error(`Busca não encontrada: ${searchId}`);
    }

    const profiles = result.results as Profile[];
    return profiles.map(p => p.linkedinUrl).filter(Boolean);
  }

  /**
   * Parseia requisitos da vaga (string ou objeto)
   */
  private async parseJobRequirements(requirements: string | JobRequirements): Promise<JobRequirements> {
    if (typeof requirements === 'string') {
      // Usar Gemini para extrair requisitos estruturados
      return await geminiService.extractJobRequirements(requirements);
    }

    return requirements as JobRequirements;
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
    profileCache.clear();
    logInfo('Todo o cache foi limpo');
  }
}

// Exportar instância singleton
export default new ProfileService();
