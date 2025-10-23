import ExcelJS from 'exceljs';
import path from 'path';
import { Company, CompanyDetailedInfo } from '../models/Company';
import { Profile } from '../models/Profile';
import config from '../config';
import { logInfo, logError } from './logger';

export interface ExcelGenerationOptions {
  fileName: string;
  sheetName: string;
  includeDetailedInfo?: boolean;
}

export class ExcelGenerator {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Gera Excel com resultados de empresas
   */
  async generateCompanyExcel(
    companies: Company[],
    options: ExcelGenerationOptions
  ): Promise<string> {
    try {
      const worksheet = this.workbook.addWorksheet(options.sheetName || 'Empresas');

      // Definir colunas básicas
      const columns: Partial<ExcelJS.Column>[] = [
        { header: 'Nome', key: 'name', width: 30 },
        { header: 'LinkedIn', key: 'linkedinUrl', width: 40 },
        { header: 'Website', key: 'website', width: 30 },
        { header: 'Segmento', key: 'industry', width: 25 },
        { header: 'Tamanho', key: 'companySize', width: 15 },
        { header: 'Sede', key: 'headquarters', width: 25 },
        { header: 'País', key: 'country', width: 15 },
        { header: 'Estado', key: 'state', width: 15 },
        { header: 'Cidade', key: 'city', width: 20 },
        { header: 'Vagas Abertas', key: 'hasOpenPositions', width: 15 },
      ];

      // Adicionar colunas de informações detalhadas se solicitado
      if (options.includeDetailedInfo) {
        columns.push(
          { header: 'Endereço Completo', key: 'fullAddress', width: 50 },
          { header: 'Telefone', key: 'phone', width: 20 },
          { header: 'E-mail', key: 'email', width: 30 },
          { header: 'CNPJ', key: 'cnpj', width: 20 },
          { header: 'Razão Social', key: 'legalName', width: 35 },
          { header: 'Departamentos', key: 'departments', width: 40 }
        );
      }

      worksheet.columns = columns;

      // Estilizar cabeçalho
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

      // Adicionar dados
      companies.forEach((company) => {
        const rowData: any = {
          name: company.name,
          linkedinUrl: company.linkedinUrl || '',
          website: company.website || '',
          industry: company.industry || company.segment || '',
          companySize: company.companySize || '',
          headquarters: company.headquarters || '',
          country: company.country || '',
          state: company.state || '',
          city: company.city || '',
          hasOpenPositions: company.hasOpenPositions ? 'Sim' : 'Não',
        };

        if (options.includeDetailedInfo && company.detailedInfo) {
          const info = company.detailedInfo;
          rowData.fullAddress = info.address?.fullAddress || this.formatAddress(info.address);
          rowData.phone = info.phone?.join(', ') || '';
          rowData.email = info.email?.join(', ') || '';
          rowData.cnpj = info.cnpj || '';
          rowData.legalName = info.legalName || '';
          rowData.departments = info.departments?.map(d => d.name).join(', ') || '';
        }

        worksheet.addRow(rowData);
      });

      // Aplicar auto-filtro
      worksheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + columns.length)}1`,
      };

      // Congelar primeira linha
      worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

      // Salvar arquivo
      const fileName = options.fileName.endsWith('.xlsx')
        ? options.fileName
        : `${options.fileName}.xlsx`;
      const filePath = path.join(config.excelExportPath, fileName);

      await this.workbook.xlsx.writeFile(filePath);

      logInfo('Excel de empresas gerado', { filePath, totalCompanies: companies.length });

      return filePath;
    } catch (error) {
      logError('Erro ao gerar Excel de empresas', error);
      throw error;
    }
  }

  /**
   * Gera Excel com resultados de perfis
   */
  async generateProfileExcel(
    profiles: Profile[],
    options: ExcelGenerationOptions
  ): Promise<string> {
    try {
      const worksheet = this.workbook.addWorksheet(options.sheetName || 'Perfis');

      // Definir colunas
      const columns: Partial<ExcelJS.Column>[] = [
        { header: 'Nome', key: 'fullName', width: 30 },
        { header: 'LinkedIn', key: 'linkedinUrl', width: 40 },
        { header: 'Cargo Atual', key: 'headline', width: 35 },
        { header: 'Empresa Atual', key: 'currentCompany', width: 30 },
        { header: 'Localização', key: 'location', width: 25 },
        { header: 'Aberto a Trabalho', key: 'isOpenToWork', width: 18 },
        { header: 'Match Score', key: 'matchScore', width: 15 },
        { header: 'Principais Skills', key: 'skills', width: 40 },
        { header: 'Idiomas', key: 'languages', width: 25 },
        { header: 'Fonte', key: 'source', width: 12 },
      ];

      worksheet.columns = columns;

      // Estilizar cabeçalho
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };
      worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

      // Adicionar dados
      profiles.forEach((profile) => {
        const rowData: any = {
          fullName: profile.fullName,
          linkedinUrl: profile.linkedinUrl,
          headline: profile.headline || profile.currentPosition?.title || '',
          currentCompany: profile.currentPosition?.company || '',
          location: profile.location || `${profile.city || ''}, ${profile.state || ''}`.trim(),
          isOpenToWork: profile.isOpenToWork ? 'Sim' : 'Não',
          matchScore: profile.matchScore ? `${profile.matchScore}%` : '',
          skills: profile.skills?.slice(0, 10).join(', ') || '',
          languages: profile.languages?.map(l => l.name).join(', ') || '',
          source: profile.source || 'linkedin',
        };

        worksheet.addRow(rowData);
      });

      // Aplicar auto-filtro
      worksheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + columns.length)}1`,
      };

      // Congelar primeira linha
      worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

      // Salvar arquivo
      const fileName = options.fileName.endsWith('.xlsx')
        ? options.fileName
        : `${options.fileName}.xlsx`;
      const filePath = path.join(config.excelExportPath, fileName);

      await this.workbook.xlsx.writeFile(filePath);

      logInfo('Excel de perfis gerado', { filePath, totalProfiles: profiles.length });

      return filePath;
    } catch (error) {
      logError('Erro ao gerar Excel de perfis', error);
      throw error;
    }
  }

  /**
   * Formata endereço para string
   */
  private formatAddress(address?: CompanyDetailedInfo['address']): string {
    if (!address) return '';

    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }
}

/**
 * Função utilitária para geração rápida de Excel de empresas
 */
export async function exportCompaniesToExcel(
  companies: Company[],
  fileName: string,
  includeDetailedInfo = true
): Promise<string> {
  const generator = new ExcelGenerator();
  return generator.generateCompanyExcel(companies, {
    fileName,
    sheetName: 'Empresas Encontradas',
    includeDetailedInfo,
  });
}

/**
 * Função utilitária para geração rápida de Excel de perfis
 */
export async function exportProfilesToExcel(
  profiles: Profile[],
  fileName: string
): Promise<string> {
  const generator = new ExcelGenerator();
  return generator.generateProfileExcel(profiles, {
    fileName,
    sheetName: 'Perfis Encontrados',
  });
}
