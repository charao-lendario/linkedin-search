export type SearchType = 'company' | 'profile';

export interface BaseSearchFilters {
  country?: string;
  state?: string;
  city?: string;
  keywords?: string[];
}

export interface CompanyFilters extends BaseSearchFilters {
  segment?: string;
  hasOpenPositions?: boolean;
  companySize?: string;
  industry?: string;
}

export interface ProfileFilters extends BaseSearchFilters {
  position?: string;
  isOpenToWork?: 'Sim' | 'Não' | 'Todos';
  experienceLevel?: string;
  industry?: string;
  companies?: string[];
  skills?: string[];
}

export interface SearchFilters {
  type: SearchType;
  companyFilters?: CompanyFilters;
  profileFilters?: ProfileFilters;
}

export interface LocationFilter {
  country?: string;
  state?: string;
  city?: string;
}

export interface DateFilter {
  from?: Date;
  to?: Date;
}

export interface AdvancedFilters {
  location?: LocationFilter;
  dateRange?: DateFilter;
  excludeKeywords?: string[];
  includeKeywords?: string[];
  customFilters?: Record<string, any>;
}

// Validação de filtros
export function validateCompanyFilters(filters: CompanyFilters): string[] {
  const errors: string[] = [];

  if (filters.country && filters.country.length < 2) {
    errors.push('País deve ter pelo menos 2 caracteres');
  }

  if (filters.segment && filters.segment.length < 2) {
    errors.push('Segmento deve ter pelo menos 2 caracteres');
  }

  return errors;
}

export function validateProfileFilters(filters: ProfileFilters): string[] {
  const errors: string[] = [];

  if (filters.position && filters.position.length < 2) {
    errors.push('Cargo deve ter pelo menos 2 caracteres');
  }

  if (filters.country && filters.country.length < 2) {
    errors.push('País deve ter pelo menos 2 caracteres');
  }

  if (filters.isOpenToWork && !['Sim', 'Não', 'Todos'].includes(filters.isOpenToWork)) {
    errors.push('isOpenToWork deve ser "Sim", "Não" ou "Todos"');
  }

  return errors;
}

// Constantes de filtros comuns
export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10001+'
];

export const EXPERIENCE_LEVELS = [
  'Estágio',
  'Júnior',
  'Pleno',
  'Sênior',
  'Especialista',
  'Gerente',
  'Diretor',
  'C-Level'
];

export const COMMON_INDUSTRIES = [
  'Tecnologia',
  'Financeiro',
  'Saúde',
  'Educação',
  'Varejo',
  'Indústria',
  'Serviços',
  'Construção',
  'Agronegócio',
  'Energia',
  'Telecomunicações',
  'Consultoria',
  'Marketing',
  'Logística',
  'Turismo'
];
