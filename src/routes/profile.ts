import { Router } from 'express';
import profileController from '../controllers/profileController';

const router = Router();

/**
 * POST /api/profile/search
 * Iniciar busca de perfis
 */
router.post('/search', (req, res) => profileController.search(req, res));

/**
 * POST /api/profile/filter
 * Aplicar filtros avançados com IA
 */
router.post('/filter', (req, res) => profileController.filter(req, res));

/**
 * GET /api/profile/results/:searchId
 * Obter resultados da busca
 */
router.get('/results/:searchId', (req, res) => profileController.getResults(req, res));

/**
 * GET /api/profile/:profileId
 * Obter perfil específico por ID
 */
router.get('/:profileId', (req, res) => profileController.getById(req, res));

/**
 * GET /api/profile/links/:searchId
 * Obter apenas links dos perfis
 */
router.get('/links/:searchId', (req, res) => profileController.getLinks(req, res));

/**
 * POST /api/profile/export/:searchId
 * Exportar resultados para Excel
 */
router.post('/export/:searchId', (req, res) => profileController.exportResults(req, res));

/**
 * POST /api/profile/export-links/:searchId
 * Exportar apenas links para arquivo de texto
 */
router.post('/export-links/:searchId', (req, res) => profileController.exportLinks(req, res));

/**
 * GET /api/profile/searches
 * Listar todas as buscas de perfis
 */
router.get('/searches', (req, res) => profileController.listSearches(req, res));

export default router;
