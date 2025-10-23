import winston from 'winston';
import path from 'path';
import config from '../config';

// Definir níveis de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Cores para cada nível
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Formato customizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // Error log file
  new winston.transports.File({
    filename: path.join(config.logFilePath, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Combined log file
  new winston.transports.File({
    filename: path.join(config.logFilePath, 'combined.log'),
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Criar logger
const logger = winston.createLogger({
  level: config.logLevel,
  levels,
  transports,
  exitOnError: false,
});

// Stream para Morgan (Express logging)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Funções auxiliares
export const logError = (message: string, error?: any, metadata?: any) => {
  logger.error(message, {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    ...metadata,
  });
};

export const logInfo = (message: string, metadata?: any) => {
  logger.info(message, metadata);
};

export const logWarn = (message: string, metadata?: any) => {
  logger.warn(message, metadata);
};

export const logDebug = (message: string, metadata?: any) => {
  logger.debug(message, metadata);
};

export const logHttp = (message: string, metadata?: any) => {
  logger.http(message, metadata);
};

// Logs específicos para o domínio da aplicação
export const logSearchStart = (searchId: string, type: string, filters: any) => {
  logger.info('Busca iniciada', {
    searchId,
    type,
    filters,
    event: 'search_start',
  });
};

export const logSearchComplete = (searchId: string, resultCount: number, duration: number) => {
  logger.info('Busca concluída', {
    searchId,
    resultCount,
    durationMs: duration,
    event: 'search_complete',
  });
};

export const logSearchError = (searchId: string, error: any) => {
  logError('Erro na busca', error, {
    searchId,
    event: 'search_error',
  });
};

export const logApiCall = (service: string, endpoint: string, duration?: number) => {
  logger.http('Chamada API', {
    service,
    endpoint,
    durationMs: duration,
    event: 'api_call',
  });
};

export const logExport = (searchId: string, format: string, filePath: string) => {
  logger.info('Exportação realizada', {
    searchId,
    format,
    filePath,
    event: 'export',
  });
};

export default logger;
