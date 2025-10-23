import { Request, Response } from 'express';
import companyService from '../services/companyService';
import excelService from '../services/excelService';
import { validateCompanySearch, validateCompanyAnalysis, validateCompanyExport } from '../utils/validators';
import { logInfo, logError } from '../utils/logger';

export class CompanyController {
  /**
   * POST /api/company/search
   * Iniciar busca de empresas
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Requisição de busca de empresas recebida', { body: req.body });

      // Validar request
      const validation = validateCompanySearch(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          errors: validation.errors,
        });
        return;
      }

      // Executar busca
      const result = await companyService.searchCompanies(validation.data!);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logError('Erro ao buscar empresas', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * POST /api/company/analyze/:companyId
   * Analisar empresa específica
   */
  async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      logInfo('Requisição de análise de empresa recebida', { companyId, body: req.body });

      // Validar request
      const validation = validateCompanyAnalysis({
        companyId,
        ...req.body,
      });

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          errors: validation.errors,
        });
        return;
      }

      // Executar análise
      const company = await companyService.analyzeCompany(validation.data!);

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      logError('Erro ao analisar empresa', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * GET /api/company/results/:searchId
   * Obter resultados da busca
   */
  async getResults(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;

      logInfo('Requisição de resultados de busca', { searchId });

      const result = await companyService.getSearchResult(searchId);

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
   * GET /api/company/:companyId
   * Obter empresa específica
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      logInfo('Requisição de empresa específica', { companyId });

      const company = await companyService.getCompanyById(companyId);

      if (!company) {
        res.status(404).json({
          success: false,
          error: 'Empresa não encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: company,
      });
    } catch (error) {
      logError('Erro ao obter empresa', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * POST /api/company/export/:searchId
   * Exportar resultados para Excel
   */
  async exportResults(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;

      logInfo('Requisição de exportação', { searchId, body: req.body });

      // Validar request
      const validation = validateCompanyExport({
        searchId,
        format: 'excel',
        ...req.body,
      });

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          errors: validation.errors,
        });
        return;
      }

      // Executar exportação
      const filePath = await excelService.exportCompanySearch(validation.data!);

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
   * GET /api/company/searches
   * Listar todas as buscas
   */
  async listSearches(req: Request, res: Response): Promise<void> {
    try {
      logInfo('Requisição de listagem de buscas');

      const searches = await companyService.listSearches();

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

export default new CompanyController();
