import { Request, Response } from 'express';
import companyService from '../services/companyService';
import profileService from '../services/profileService';
import excelService from '../services/excelService';
import { logInfo, logError } from '../utils/logger';

export class SearchController {
  /**
   * GET /api/search/status
   * Verificar status da aplicação
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = {
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          apify: 'connected',
          gemini: 'connected',
          infoSimples: 'connected',
        },
      };

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      logError('Erro ao verificar status', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * GET /api/search/history
   * Obter histórico de todas as buscas
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Requisição de histórico de buscas');

      const companySearches = await companyService.listSearches();
      const profileSearches = await profileService.listSearches();

      const history = {
        company: companySearches.map(s => ({
          id: s.id,
          type: 'company',
          filters: s.filters,
          totalResults: s.totalResults,
          status: s.status,
          createdAt: s.createdAt,
        })),
        profile: profileSearches.map(s => ({
          id: s.id,
          type: 'profile',
          filters: s.filters,
          totalResults: s.totalResults,
          status: s.status,
          createdAt: s.createdAt,
        })),
        total: companySearches.length + profileSearches.length,
      };

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      logError('Erro ao obter histórico', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * GET /api/search/exports
   * Listar arquivos exportados
   */
  async listExports(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Requisição de listagem de exportações');

      const files = await excelService.listExports();

      res.status(200).json({
        success: true,
        data: {
          totalFiles: files.length,
          files,
        },
      });
    } catch (error) {
      logError('Erro ao listar exportações', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * DELETE /api/search/export/:fileName
   * Deletar arquivo de exportação
   */
  async deleteExport(req: Request, res: Response): Promise<void> {
    try {
      const { fileName } = req.params;

      logInfo('Requisição de deleção de exportação', { fileName });

      const deleted = await excelService.deleteExport(fileName);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Arquivo não encontrado',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Arquivo deletado com sucesso',
        },
      });
    } catch (error) {
      logError('Erro ao deletar exportação', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * POST /api/search/clear-cache
   * Limpar cache de buscas
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.body;

      logInfo('Requisição de limpeza de cache', { type });

      if (type === 'company' || type === 'all') {
        companyService.clearAllCache();
      }

      if (type === 'profile' || type === 'all') {
        profileService.clearAllCache();
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Cache limpo com sucesso',
        },
      });
    } catch (error) {
      logError('Erro ao limpar cache', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * GET /api/search/stats
   * Obter estatísticas gerais
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Requisição de estatísticas');

      const companySearches = await companyService.listSearches();
      const profileSearches = await profileService.listSearches();
      const exports = await excelService.listExports();

      const stats = {
        searches: {
          total: companySearches.length + profileSearches.length,
          companies: companySearches.length,
          profiles: profileSearches.length,
        },
        results: {
          totalCompanies: companySearches.reduce((sum, s) => sum + s.totalResults, 0),
          totalProfiles: profileSearches.reduce((sum, s) => sum + s.totalResults, 0),
        },
        exports: {
          total: exports.length,
        },
        performance: {
          averageSearchTime: this.calculateAverageSearchTime(companySearches, profileSearches),
        },
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logError('Erro ao obter estatísticas', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * Calcula tempo médio de busca
   */
  private calculateAverageSearchTime(companySearches: any[], profileSearches: any[]): number {
    const allSearches = [...companySearches, ...profileSearches];

    if (allSearches.length === 0) return 0;

    const totalTime = allSearches.reduce((sum, search) => {
      return sum + (search.stats?.processingTimeMs || 0);
    }, 0);

    return Math.round(totalTime / allSearches.length);
  }
}

export default new SearchController();
