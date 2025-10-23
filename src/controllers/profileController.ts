import { Request, Response } from 'express';
import profileService from '../services/profileService';
import excelService from '../services/excelService';
import { validateProfileSearch, validateProfileFilter } from '../utils/validators';
import { logInfo, logError } from '../utils/logger';

export class ProfileController {
  /**
   * POST /api/profile/search
   * Iniciar busca de perfis
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Requisição de busca de perfis recebida', { body: req.body });

      // Validar request
      const validation = validateProfileSearch(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          errors: validation.errors,
        });
        return;
      }

      // Executar busca
      const result = await profileService.searchProfiles(validation.data!);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logError('Erro ao buscar perfis', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * POST /api/profile/filter
   * Aplicar filtros avançados com IA
   */
  async filter(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Requisição de filtragem de perfis recebida', { body: req.body });

      // Validar request
      const validation = validateProfileFilter(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          errors: validation.errors,
        });
        return;
      }

      // Executar filtragem
      const matchResults = await profileService.filterProfiles(validation.data!);

      res.status(200).json({
        success: true,
        data: {
          totalMatched: matchResults.length,
          matches: matchResults,
        },
      });
    } catch (error) {
      logError('Erro ao filtrar perfis', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * GET /api/profile/results/:searchId
   * Obter resultados da busca com links
   */
  async getResults(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;

      logInfo('Requisição de resultados de busca', { searchId });

      const result = await profileService.getSearchResult(searchId);

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'Busca não encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logError('Erro ao obter resultados', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * GET /api/profile/:profileId
   * Obter perfil específico
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;

      logInfo('Requisição de perfil específico', { profileId });

      const profile = await profileService.getProfileById(profileId);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Perfil não encontrado',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logError('Erro ao obter perfil', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * GET /api/profile/links/:searchId
   * Obter apenas os links dos perfis
   */
  async getLinks(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;

      logInfo('Requisição de links de perfis', { searchId });

      const links = await profileService.getProfileLinks(searchId);

      res.status(200).json({
        success: true,
        data: {
          totalLinks: links.length,
          links,
        },
      });
    } catch (error) {
      logError('Erro ao obter links', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * POST /api/profile/export/:searchId
   * Exportar resultados para Excel
   */
  async exportResults(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;

      logInfo('Requisição de exportação de perfis', { searchId });

      // Executar exportação
      const filePath = await excelService.exportProfileSearch(searchId);

      res.status(200).json({
        success: true,
        data: {
          filePath,
          message: 'Exportação concluída com sucesso',
        },
      });
    } catch (error) {
      logError('Erro ao exportar resultados', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * POST /api/profile/export-links/:searchId
   * Exportar apenas links para arquivo de texto
   */
  async exportLinks(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;

      logInfo('Requisição de exportação de links', { searchId });

      // Executar exportação
      const filePath = await excelService.exportProfileLinks(searchId);

      res.status(200).json({
        success: true,
        data: {
          filePath,
          message: 'Links exportados com sucesso',
        },
      });
    } catch (error) {
      logError('Erro ao exportar links', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * GET /api/profile/searches
   * Listar todas as buscas
   */
  async listSearches(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Requisição de listagem de buscas de perfis');

      const searches = await profileService.listSearches();

      res.status(200).json({
        success: true,
        data: searches,
      });
    } catch (error) {
      logError('Erro ao listar buscas', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
}

export default new ProfileController();
