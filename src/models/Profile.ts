export interface Profile {
  id: string;
  fullName: string;
  linkedinUrl: string;
  headline?: string;
  location?: string;
  profilePictureUrl?: string;

  // Informações profissionais
  currentPosition?: Position;
  experience?: Position[];
  education?: Education[];
  skills?: string[];
  languages?: Language[];

  // Filtros de busca
  country?: string;
  state?: string;
  city?: string;
  isOpenToWork?: boolean;
  desiredPosition?: string;

  // Informações adicionais
  about?: string;
  connectionDegree?: number;
  connections?: number;

  // Score de match (calculado pela IA)
  matchScore?: number;
  matchReasons?: string[];

  // Metadados
  searchId?: string;
  source?: ProfileSource;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Position {
  title: string;
  company: string;
  companyLinkedinUrl?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  duration?: string;
}

export interface Education {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

export interface Language {
  name: string;
  proficiency?: string;
}

export type ProfileSource = 'linkedin' | 'catho' | 'indeed' | 'other';

export interface ProfileSearchFilters {
  position?: string;
  country?: string;
  state?: string;
  city?: string;
  isOpenToWork?: 'Sim' | 'Não' | 'Todos';
  keywords?: string[];
  experienceLevel?: string;
  industry?: string;
  companies?: string[];
}

export interface ProfileSearchRequest {
  filters: ProfileSearchFilters;
  jobRequirements?: string;
  maxResults?: number;
  sources?: ProfileSource[];
}

export interface JobRequirements {
  position: string;
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  experienceYears?: number;
  education?: string;
  languages?: string[];
  location?: string;
  other?: string;
}

export interface ProfileFilterRequest {
  searchId: string;
  requirements: JobRequirements;
  minMatchScore?: number;
}

export interface ProfileMatchResult {
  profile: Profile;
  score: number;
  reasons: string[];
  missingSkills?: string[];
  strengths?: string[];
}
