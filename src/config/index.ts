import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

interface Config {
  // API Keys
  geminiApiKey: string;
  apifyApiKey: string;
  infoSimplesApiToken: string;

  // Server
  port: number;
  nodeEnv: string;
  useMockData: boolean;

  // Database
  databaseUrl: string;
  databasePath: string;

  // Paths
  excelExportPath: string;
  logFilePath: string;

  // Cache
  cacheDuration: number;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // Logging
  logLevel: string;

  // Apify Actors
  apifyActors: {
    linkedinCompanySearch: string;
    linkedinPeopleSearch: string;
    linkedinJobSearch: string;
  };

  // InfoSimples API
  infoSimplesBaseUrl: string;
}

const config: Config = {
  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  apifyApiKey: process.env.APIFY_API_KEY || '',
  infoSimplesApiToken: process.env.INFOSIMPLES_API_TOKEN || '',

  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  useMockData: process.env.USE_MOCK_DATA === 'true',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'sqlite:./data/searches.db',
  databasePath: path.resolve(process.cwd(), 'data', 'searches.db'),

  // Paths
  excelExportPath: path.resolve(process.cwd(), process.env.EXCEL_EXPORT_PATH || './exports/'),
  logFilePath: path.resolve(process.cwd(), process.env.LOG_FILE_PATH || './logs/'),

  // Cache
  cacheDuration: parseInt(process.env.CACHE_DURATION || '6', 10),

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Apify Actors (IDs comuns de actors do Apify)
  apifyActors: {
    linkedinCompanySearch: 'apify/linkedin-company-scraper',
    linkedinPeopleSearch: 'apify/linkedin-profile-scraper',
    linkedinJobSearch: 'apify/linkedin-jobs-scraper',
  },

  // InfoSimples API
  infoSimplesBaseUrl: 'https://api.infosimples.com',
};

// Validar configurações críticas
function validateConfig(): void {
  const errors: string[] = [];

  if (!config.geminiApiKey) {
    errors.push('GEMINI_API_KEY não configurada');
  }

  if (!config.apifyApiKey) {
    errors.push('APIFY_API_KEY não configurada');
  }

  if (!config.infoSimplesApiToken) {
    errors.push('INFOSIMPLES_API_TOKEN não configurado');
  }

  if (errors.length > 0) {
    console.error('Erros de configuração:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nVerifique o arquivo .env');

    if (config.nodeEnv === 'production') {
      throw new Error('Configuração inválida em produção');
    }
  }
}

// Não validar ao carregar para permitir que dotenv seja configurado primeiro
// validateConfig() será chamado manualmente quando necessário

export default config;
export { validateConfig };
