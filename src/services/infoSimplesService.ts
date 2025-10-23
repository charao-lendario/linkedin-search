import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { logInfo, logError, logApiCall } from '../utils/logger';
import { CompanyDetailedInfo } from '../models/Company';

interface InfoSimplesResponse {
  status: string;
  code: number;
  data?: any;
  message?: string;
}

export class InfoSimplesService {
  private client: AxiosInstance;
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = config.infoSimplesBaseUrl;
    this.token = config.infoSimplesApiToken;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Busca informações de empresa por CNPJ
   */
  async getCompanyByCNPJ(cnpj: string): Promise<CompanyDetailedInfo | null> {
    const startTime = Date.now();

    try {
      const cleanCNPJ = cnpj.replace(/\D/g, '');

      logInfo('Buscando empresa por CNPJ', { cnpj: cleanCNPJ });

      const response = await this.client.get<InfoSimplesResponse>(
        `/api/v2/consulta-cnpj/${cleanCNPJ}`,
        {
          params: {
            token: this.token,
          },
        }
      );

      const duration = Date.now() - startTime;
      logApiCall('InfoSimples', 'getCompanyByCNPJ', duration);

      if (response.data.status === 'success' && response.data.data) {
        return this.mapInfoSimplesResponse(response.data.data);
      }

      logInfo('Empresa não encontrada no InfoSimples', { cnpj: cleanCNPJ });
      return null;
    } catch (error) {
      logError('Erro ao buscar empresa no InfoSimples', error, { cnpj });
      return null;
    }
  }

  /**
   * Busca informações de empresa por nome/razão social
   */
  async searchCompanyByName(name: string): Promise<CompanyDetailedInfo | null> {
    const startTime = Date.now();

    try {
      logInfo('Buscando empresa por nome', { name });

      const response = await this.client.get<InfoSimplesResponse>(
        '/api/v2/consulta-receita-federal',
        {
          params: {
            token: this.token,
            nome: name,
          },
        }
      );

      const duration = Date.now() - startTime;
      logApiCall('InfoSimples', 'searchCompanyByName', duration);

      if (response.data.status === 'success' && response.data.data) {
        // Se retornar múltiplos resultados, pegar o primeiro
        const companyData = Array.isArray(response.data.data)
          ? response.data.data[0]
          : response.data.data;

        if (companyData) {
          return this.mapInfoSimplesResponse(companyData);
        }
      }

      logInfo('Empresa não encontrada no InfoSimples', { name });
      return null;
    } catch (error) {
      logError('Erro ao buscar empresa no InfoSimples', error, { name });
      return null;
    }
  }

  /**
   * Mapeia resposta do InfoSimples para CompanyDetailedInfo
   */
  private mapInfoSimplesResponse(data: any): CompanyDetailedInfo {
    return {
      cnpj: data.cnpj || undefined,
      legalName: data.razao_social || data.nome_empresarial || undefined,

      address: {
        street: data.logradouro || data.endereco?.logradouro || undefined,
        number: data.numero || data.endereco?.numero || undefined,
        complement: data.complemento || data.endereco?.complemento || undefined,
        neighborhood: data.bairro || data.endereco?.bairro || undefined,
        city: data.municipio || data.endereco?.municipio || undefined,
        state: data.uf || data.endereco?.uf || undefined,
        zipCode: data.cep || data.endereco?.cep || undefined,
        country: 'Brasil',
        fullAddress: this.buildFullAddress(data),
      },

      phone: this.extractPhones(data),
      email: this.extractEmails(data),

      employeeCount: data.quantidade_funcionarios || undefined,
      revenue: data.capital_social || undefined,

      source: 'InfoSimples API',
      analyzedAt: new Date(),
    };
  }

  /**
   * Constrói endereço completo
   */
  private buildFullAddress(data: any): string {
    const parts: string[] = [];

    if (data.logradouro) parts.push(data.logradouro);
    if (data.numero) parts.push(data.numero);
    if (data.complemento) parts.push(data.complemento);
    if (data.bairro) parts.push(data.bairro);
    if (data.municipio && data.uf) {
      parts.push(`${data.municipio} - ${data.uf}`);
    } else if (data.municipio) {
      parts.push(data.municipio);
    }
    if (data.cep) parts.push(`CEP ${data.cep}`);

    return parts.join(', ');
  }

  /**
   * Extrai telefones dos dados
   */
  private extractPhones(data: any): string[] | undefined {
    const phones: string[] = [];

    if (data.telefone) {
      phones.push(data.telefone);
    }

    if (data.telefone_1) {
      phones.push(data.telefone_1);
    }

    if (data.telefone_2) {
      phones.push(data.telefone_2);
    }

    if (data.celular) {
      phones.push(data.celular);
    }

    return phones.length > 0 ? phones : undefined;
  }

  /**
   * Extrai emails dos dados
   */
  private extractEmails(data: any): string[] | undefined {
    const emails: string[] = [];

    if (data.email) {
      emails.push(data.email);
    }

    if (data.email_empresa) {
      emails.push(data.email_empresa);
    }

    return emails.length > 0 ? emails : undefined;
  }

  /**
   * Valida CNPJ
   */
  isValidCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) {
      return false;
    }

    // Validação básica de CNPJ
    if (/^(\d)\1+$/.test(cleanCNPJ)) {
      return false;
    }

    return true;
  }

  /**
   * Formata CNPJ
   */
  formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) {
      return cnpj;
    }

    return cleanCNPJ.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }
}

// Exportar instância singleton
export default new InfoSimplesService();
