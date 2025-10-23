import path from 'path';
import { Company, CompanyExportRequest } from '../models/Company';
import { Profile } from '../models/Profile';
import { CompanySearchResult, ProfileSearchResult } from '../models/SearchResult';
import { exportCompaniesToExcel, exportProfilesToExcel } from '../utils/excelGenerator';
import companyService from './companyService';
import profileService from './profileService';
import { logInfo, logError, logExport } from '../utils/logger';

export class ExcelService {
  /**
   * Exporta resultado de busca de empresas para Excel
   */
  async exportCompanySearch(request: CompanyExportRequest): Promise<string> {
    try {
      logInfo('Iniciando exportação de empresas', request);

      // Obter resultado da busca
      const searchResult = await companyService.getSearchResult(request.searchId);

      if (!searchResult) {
        throw new Error(`Busca não encontrada: ${request.searchId}`);
      }

      const companies = searchResult.results as Company[];

      if (companies.length === 0) {
        throw new Error('Nenhuma empresa encontrada para exportar');
      }

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `empresas_${request.searchId}_${timestamp}.xlsx`;

      // Exportar para Excel
      const filePath = await exportCompaniesToExcel(
        companies,
        fileName,
        request.includeDetailedInfo !== false
      );

      logExport(request.searchId, request.format, filePath);

      return filePath;
    } catch (error) {
      logError('Erro ao exportar empresas', error, { searchId: request.searchId });
      throw error;
    }
  }

  /**
   * Exporta resultado de busca de perfis para Excel
   */
  async exportProfileSearch(searchId: string): Promise<string> {
    try {
      logInfo('Iniciando exportação de perfis', { searchId });

      // Obter resultado da busca
      const searchResult = await profileService.getSearchResult(searchId);

      if (!searchResult) {
        throw new Error(`Busca não encontrada: ${searchId}`);
      }

      const profiles = searchResult.results as Profile[];

      if (profiles.length === 0) {
        throw new Error('Nenhum perfil encontrado para exportar');
      }

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `perfis_${searchId}_${timestamp}.xlsx`;

      // Exportar para Excel
      const filePath = await exportProfilesToExcel(profiles, fileName);

      logExport(searchId, 'excel', filePath);

      return filePath;
    } catch (error) {
      logError('Erro ao exportar perfis', error, { searchId });
      throw error;
    }
  }

  /**
   * Exporta empresas específicas para Excel
   */
  async exportCompanies(companies: Company[], fileName?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const defaultFileName = `empresas_export_${timestamp}.xlsx`;

      const filePath = await exportCompaniesToExcel(
        companies,
        fileName || defaultFileName,
        true
      );

      logInfo('Empresas exportadas', { totalCompanies: companies.length, filePath });

      return filePath;
    } catch (error) {
      logError('Erro ao exportar empresas', error);
      throw error;
    }
  }

  /**
   * Exporta perfis específicos para Excel
   */
  async exportProfiles(profiles: Profile[], fileName?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const defaultFileName = `perfis_export_${timestamp}.xlsx`;

      const filePath = await exportProfilesToExcel(
        profiles,
        fileName || defaultFileName
      );

      logInfo('Perfis exportados', { totalProfiles: profiles.length, filePath });

      return filePath;
    } catch (error) {
      logError('Erro ao exportar perfis', error);
      throw error;
    }
  }

  /**
   * Exporta links de perfis para arquivo de texto
   */
  async exportProfileLinks(searchId: string): Promise<string> {
    try {
      logInfo('Exportando links de perfis', { searchId });

      const links = await profileService.getProfileLinks(searchId);

      if (links.length === 0) {
        throw new Error('Nenhum link de perfil encontrado');
      }

      // Gerar arquivo de texto com links
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `perfis_links_${searchId}_${timestamp}.txt`;
      const filePath = path.join(process.cwd(), 'exports', fileName);

      const fs = require('fs').promises;
      await fs.writeFile(filePath, links.join('\n'), 'utf-8');

      logInfo('Links de perfis exportados', { totalLinks: links.length, filePath });

      return filePath;
    } catch (error) {
      logError('Erro ao exportar links de perfis', error, { searchId });
      throw error;
    }
  }

  /**
   * Lista todos os arquivos exportados
   */
  async listExports(): Promise<string[]> {
    try {
      const fs = require('fs').promises;
      const exportsDir = path.join(process.cwd(), 'exports');

      const files = await fs.readdir(exportsDir);

      return files.filter((file: string) =>
        file.endsWith('.xlsx') || file.endsWith('.txt') || file.endsWith('.csv')
      );
    } catch (error) {
      logError('Erro ao listar exportações', error);
      return [];
    }
  }

  /**
   * Deleta arquivo de exportação
   */
  async deleteExport(fileName: string): Promise<boolean> {
    try {
      const fs = require('fs').promises;
      const filePath = path.join(process.cwd(), 'exports', fileName);

      await fs.unlink(filePath);

      logInfo('Arquivo de exportação deletado', { fileName });

      return true;
    } catch (error) {
      logError('Erro ao deletar exportação', error, { fileName });
      return false;
    }
  }
}

// Exportar instância singleton
export default new ExcelService();
