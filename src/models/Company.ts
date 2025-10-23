export interface Company {
  id: string;
  name: string;
  linkedinUrl?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  headquarters?: string;
  description?: string;
  specialties?: string[];
  foundedYear?: number;

  // Filtros de busca
  country?: string;
  state?: string;
  city?: string;
  segment?: string;
  hasOpenPositions?: boolean;

  // Informações detalhadas (obtidas via IA)
  detailedInfo?: CompanyDetailedInfo;

  // Metadados
  searchId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CompanyDetailedInfo {
  // Informações de contato
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    fullAddress?: string;
  };

  phone?: string[];
  email?: string[];

  // Departamentos/Áreas
  departments?: Department[];

  // Informações adicionais
  employeeCount?: number;
  revenue?: string;
  cnpj?: string;
  legalName?: string;

  // Fonte da informação
  source?: string;
  analyzedAt?: Date;
}

export interface Department {
  name: string;
  description?: string;
  headCount?: number;
  contact?: {
    email?: string;
    phone?: string;
  };
}

export interface CompanySearchFilters {
  country?: string;
  state?: string;
  city?: string;
  segment?: string;
  hasOpenPositions?: boolean;
  keywords?: string[];
  companySize?: string;
  industry?: string;
}

export interface CompanySearchRequest {
  filters: CompanySearchFilters;
  includeDetailedInfo?: boolean;
  maxResults?: number;
}

export interface CompanyAnalysisRequest {
  companyId: string;
  includeDepartments?: boolean;
}

export type CompanyExportFormat = 'excel' | 'csv' | 'json';

export interface CompanyExportRequest {
  searchId: string;
  format: CompanyExportFormat;
  includeDetailedInfo?: boolean;
}
