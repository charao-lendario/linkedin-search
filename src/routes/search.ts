import { Router } from 'express';
import searchController from '../controllers/searchController';

const router = Router();

/**
 * GET /api/search/status
 * Verificar status da aplicação
 */
router.get('/status', (req, res) => searchController.getStatus(req, res));

/**
 * GET /api/search/history
 * Obter histórico de todas as buscas
 */
router.get('/history', (req, res) => searchController.getHistory(req, res));

/**
 * GET /api/search/exports
 * Listar arquivos exportados
 */
router.get('/exports', (req, res) => searchController.listExports(req, res));

/**
 * DELETE /api/search/export/:fileName
 * Deletar arquivo de exportação
 */
router.delete('/export/:fileName', (req, res) => searchController.deleteExport(req, res));

/**
 * POST /api/search/clear-cache
 * Limpar cache de buscas
 */
router.post('/clear-cache', (req, res) => searchController.clearCache(req, res));

/**
 * GET /api/search/stats
 * Obter estatísticas gerais
 */
router.get('/stats', (req, res) => searchController.getStats(req, res));

export default router;
