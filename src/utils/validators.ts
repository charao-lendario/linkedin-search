import Joi from 'joi';
import {
  CompanySearchRequest,
  CompanyAnalysisRequest,
  CompanyExportRequest,
} from '../models/Company';
import {
  ProfileSearchRequest,
  ProfileFilterRequest,
} from '../models/Profile';

// Schemas de validação para Company

export const companySearchSchema = Joi.object<CompanySearchRequest>({
  filters: Joi.object({
    country: Joi.string().min(2).max(100).optional(),
    state: Joi.string().min(2).max(100).optional(),
    city: Joi.string().min(2).max(100).optional(),
    segment: Joi.string().min(2).max(200).optional(),
    hasOpenPositions: Joi.boolean().optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
    companySize: Joi.string().optional(),
    industry: Joi.string().optional(),
  }).required(),
  includeDetailedInfo: Joi.boolean().optional().default(false),
  maxResults: Joi.number().integer().min(1).max(1000).optional().default(100),
});

export const companyAnalysisSchema = Joi.object<CompanyAnalysisRequest>({
  companyId: Joi.string().required(),
  includeDepartments: Joi.boolean().optional().default(true),
});

export const companyExportSchema = Joi.object<CompanyExportRequest>({
  searchId: Joi.string().required(),
  format: Joi.string().valid('excel', 'csv', 'json').required(),
  includeDetailedInfo: Joi.boolean().optional().default(true),
});

// Schemas de validação para Profile

export const profileSearchSchema = Joi.object<ProfileSearchRequest>({
  filters: Joi.object({
    position: Joi.string().min(2).max(200).optional(),
    country: Joi.string().min(2).max(100).optional(),
    state: Joi.string().min(2).max(100).optional(),
    city: Joi.string().min(2).max(100).optional(),
    isOpenToWork: Joi.string().valid('Sim', 'Não', 'Todos').optional(),
    keywords: Joi.array().items(Joi.string()).optional(),
    experienceLevel: Joi.string().optional(),
    industry: Joi.string().optional(),
    companies: Joi.array().items(Joi.string()).optional(),
  }).required(),
  jobRequirements: Joi.string().optional(),
  maxResults: Joi.number().integer().min(1).max(1000).optional().default(100),
  sources: Joi.array().items(Joi.string().valid('linkedin', 'catho', 'indeed', 'other')).optional(),
});

export const profileFilterSchema = Joi.object<ProfileFilterRequest>({
  searchId: Joi.string().required(),
  requirements: Joi.object({
    position: Joi.string().required(),
    description: Joi.string().optional(),
    requiredSkills: Joi.array().items(Joi.string()).optional(),
    preferredSkills: Joi.array().items(Joi.string()).optional(),
    experienceYears: Joi.number().integer().min(0).optional(),
    education: Joi.string().optional(),
    languages: Joi.array().items(Joi.string()).optional(),
    location: Joi.string().optional(),
    other: Joi.string().optional(),
  }).required(),
  minMatchScore: Joi.number().min(0).max(100).optional().default(60),
});

// Funções de validação

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

export function validateCompanySearch(data: any): ValidationResult<CompanySearchRequest> {
  const { error, value } = companySearchSchema.validate(data, { abortEarly: false });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
}

export function validateCompanyAnalysis(data: any): ValidationResult<CompanyAnalysisRequest> {
  const { error, value } = companyAnalysisSchema.validate(data, { abortEarly: false });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
}

export function validateCompanyExport(data: any): ValidationResult<CompanyExportRequest> {
  const { error, value } = companyExportSchema.validate(data, { abortEarly: false });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
}

export function validateProfileSearch(data: any): ValidationResult<ProfileSearchRequest> {
  const { error, value } = profileSearchSchema.validate(data, { abortEarly: false });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
}

export function validateProfileFilter(data: any): ValidationResult<ProfileFilterRequest> {
  const { error, value } = profileFilterSchema.validate(data, { abortEarly: false });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return {
    isValid: true,
    data: value,
  };
}

// Validadores customizados

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function normalizeLocation(location: string): string {
  return sanitizeString(location).toLowerCase();
}
