import { Router } from 'express';
import companyController from '../controllers/companyController';

const router = Router();

/**
 * POST /api/company/search
 * Iniciar busca de empresas
 */
router.post('/search', (req, res) => companyController.search(req, res));

/**
 * POST /api/company/analyze/:companyId
 * Analisar empresa específica
 */
router.post('/analyze/:companyId', (req, res) => companyController.analyze(req, res));

/**
 * GET /api/company/results/:searchId
 * Obter resultados da busca
 */
router.get('/results/:searchId', (req, res) => companyController.getResults(req, res));

/**
 * GET /api/company/:companyId
 * Obter empresa específica por ID
 */
router.get('/:companyId', (req, res) => companyController.getById(req, res));

/**
 * POST /api/company/export/:searchId
 * Exportar resultados para Excel
 */
router.post('/export/:searchId', (req, res) => companyController.exportResults(req, res));

/**
 * GET /api/company/searches
 * Listar todas as buscas de empresas
 */
router.get('/searches', (req, res) => companyController.listSearches(req, res));

export default router;
