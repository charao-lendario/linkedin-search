import { Company } from './Company';
import { Profile } from './Profile';
import { SearchType, SearchFilters } from './SearchFilters';

export interface SearchResult<T = Company | Profile> {
  id: string;
  type: SearchType;
  filters: SearchFilters;
  results: T[];
  totalResults: number;
  status: SearchStatus;

  // Metadados
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;

  // Cache
  cachedUntil?: Date;
  cacheKey?: string;

  // Estatísticas
  stats?: SearchStats;

  // Erros
  errors?: SearchError[];
}

export type SearchStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partial'
  | 'cached';

export interface SearchStats {
  totalFound: number;
  totalProcessed: number;
  totalFiltered: number;
  processingTimeMs: number;
  sources?: Record<string, number>;
  successRate?: number;
}

export interface SearchError {
  code: string;
  message: string;
  timestamp: Date;
  source?: string;
  details?: any;
}

export interface CompanySearchResult extends SearchResult<Company> {
  type: 'company';
  detailedAnalysisCount?: number;
  exportUrl?: string;
}

export interface ProfileSearchResult extends SearchResult<Profile> {
  type: 'profile';
  matchedProfiles?: number;
  averageMatchScore?: number;
  topProfiles?: Profile[];
}

export interface SearchCache {
  key: string;
  data: any;
  expiresAt: Date;
  createdAt: Date;
}

export interface SearchHistory {
  id: string;
  userId?: string;
  type: SearchType;
  filters: SearchFilters;
  resultCount: number;
  status: SearchStatus;
  createdAt: Date;
}

// Funções utilitárias
export function isSearchExpired(search: SearchResult): boolean {
  if (!search.cachedUntil) return true;
  return new Date() > search.cachedUntil;
}

export function calculateCacheExpiry(cacheDurationHours: number): Date {
  const now = new Date();
  return new Date(now.getTime() + cacheDurationHours * 60 * 60 * 1000);
}

export function generateCacheKey(type: SearchType, filters: any): string {
  const filterStr = JSON.stringify(filters);
  return `search:${type}:${Buffer.from(filterStr).toString('base64')}`;
}

export function isCompanySearchResult(result: SearchResult): result is CompanySearchResult {
  return result.type === 'company';
}

export function isProfileSearchResult(result: SearchResult): result is ProfileSearchResult {
  return result.type === 'profile';
}

export interface PaginatedSearchResult<T = Company | Profile> extends SearchResult<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SearchProgress {
  searchId: string;
  status: SearchStatus;
  progress: number; // 0-100
  currentStep?: string;
  message?: string;
  timestamp: Date;
}
