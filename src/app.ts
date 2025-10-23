// Carregar variáveis de ambiente PRIMEIRO
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger, { logInfo, logError } from './utils/logger';

// Importar rotas
import companyRoutes from './routes/company';
import profileRoutes from './routes/profile';
import searchRoutes from './routes/search';

// Criar aplicação Express
const app: Express = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: '*', // Em produção, especificar domínios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middlewares gerais
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Logging de requisições
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
    });
  });

  next();
});

// Rotas principais
app.use('/api/company', companyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'LinkedIn Search AI - API',
    version: '1.0.0',
    endpoints: {
      company: {
        search: 'POST /api/company/search',
        analyze: 'POST /api/company/analyze/:companyId',
        results: 'GET /api/company/results/:searchId',
        export: 'POST /api/company/export/:searchId',
      },
      profile: {
        search: 'POST /api/profile/search',
        filter: 'POST /api/profile/filter',
        results: 'GET /api/profile/results/:searchId',
        links: 'GET /api/profile/links/:searchId',
        export: 'POST /api/profile/export/:searchId',
      },
      search: {
        status: 'GET /api/search/status',
        history: 'GET /api/search/history',
        stats: 'GET /api/search/stats',
      },
    },
    documentation: 'https://github.com/your-repo/linkedin-search-ai',
  });
});

// Rota de health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Rota 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path,
  });
});

// Error handler global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logError('Erro não tratado na aplicação', err, {
    method: req.method,
    path: req.path,
    body: req.body,
  });

  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Erro interno do servidor',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// Iniciar servidor
const PORT = config.port;

if (require.main === module) {
  app.listen(PORT, () => {
    logInfo(`Servidor rodando na porta ${PORT}`, {
      port: PORT,
      nodeEnv: config.nodeEnv,
      apiEndpoint: `http://localhost:${PORT}`,
    });

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  LINKEDIN SEARCH AI - API SERVER     ║');
    console.log('╚═══════════════════════════════════════╝\n');
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📝 Ambiente: ${config.nodeEnv}`);
    console.log(`📊 API Docs: http://localhost:${PORT}/\n`);
    console.log('Endpoints disponíveis:');
    console.log('  - POST /api/company/search');
    console.log('  - POST /api/profile/search');
    console.log('  - GET  /api/search/status');
    console.log('  - GET  /api/search/history\n');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logInfo('SIGTERM recebido, encerrando servidor...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logInfo('SIGINT recebido, encerrando servidor...');
    process.exit(0);
  });

  // Tratamento de erros não capturados
  process.on('uncaughtException', (error: Error) => {
    logError('Exceção não capturada', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any) => {
    logError('Promise rejeitada não tratada', reason);
    process.exit(1);
  });
}

export default app;
