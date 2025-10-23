import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import config from '../config';
import { logInfo, logError, logApiCall } from '../utils/logger';
import { Company, CompanyDetailedInfo } from '../models/Company';
import { Profile, JobRequirements, ProfileMatchResult } from '../models/Profile';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    // Usando Gemini 2.5-flash conforme especificado
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Analisa uma empresa e busca informações detalhadas
   */
  async analyzeCompany(company: Company, includeDepartments = true): Promise<CompanyDetailedInfo> {
    const startTime = Date.now();

    try {
      const prompt = this.buildCompanyAnalysisPrompt(company, includeDepartments);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const detailedInfo = this.parseCompanyAnalysisResponse(text);

      const duration = Date.now() - startTime;
      logApiCall('Gemini', 'analyzeCompany', duration);
      logInfo('Empresa analisada com sucesso', { companyName: company.name, duration });

      return detailedInfo;
    } catch (error) {
      logError('Erro ao analisar empresa com Gemini', error, { companyName: company.name });
      throw error;
    }
  }

  /**
   * Filtra perfis com base nos requisitos da vaga
   */
  async filterProfilesByRequirements(
    profiles: Profile[],
    requirements: JobRequirements,
    minScore = 60
  ): Promise<ProfileMatchResult[]> {
    const startTime = Date.now();

    try {
      const prompt = this.buildProfileFilterPrompt(profiles, requirements);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const matchResults = this.parseProfileFilterResponse(text, profiles);

      // Filtrar por score mínimo
      const filteredResults = matchResults.filter(r => r.score >= minScore);

      // Ordenar por score decrescente
      filteredResults.sort((a, b) => b.score - a.score);

      const duration = Date.now() - startTime;
      logApiCall('Gemini', 'filterProfiles', duration);
      logInfo('Perfis filtrados com sucesso', {
        totalProfiles: profiles.length,
        matchedProfiles: filteredResults.length,
        duration,
      });

      return filteredResults;
    } catch (error) {
      logError('Erro ao filtrar perfis com Gemini', error);
      throw error;
    }
  }

  /**
   * Extrai requisitos estruturados de uma descrição de vaga
   */
  async extractJobRequirements(jobDescription: string): Promise<JobRequirements> {
    const startTime = Date.now();

    try {
      const prompt = this.buildJobRequirementsExtractionPrompt(jobDescription);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const requirements = this.parseJobRequirementsResponse(text);

      const duration = Date.now() - startTime;
      logApiCall('Gemini', 'extractJobRequirements', duration);

      return requirements;
    } catch (error) {
      logError('Erro ao extrair requisitos da vaga', error);
      throw error;
    }
  }

  /**
   * Constrói prompt para análise de empresa
   */
  private buildCompanyAnalysisPrompt(company: Company, includeDepartments: boolean): string {
    return `
Você é um assistente especializado em pesquisa empresarial. Sua tarefa é analisar e enriquecer informações sobre a seguinte empresa:

Nome: ${company.name}
LinkedIn: ${company.linkedinUrl || 'N/A'}
Website: ${company.website || 'N/A'}
Segmento: ${company.industry || company.segment || 'N/A'}
Localização: ${company.city || ''}, ${company.state || ''}, ${company.country || ''}

Por favor, retorne as seguintes informações em formato JSON:

{
  "address": {
    "street": "Nome da rua",
    "number": "Número",
    "complement": "Complemento",
    "neighborhood": "Bairro",
    "city": "Cidade",
    "state": "Estado",
    "zipCode": "CEP",
    "country": "País",
    "fullAddress": "Endereço completo"
  },
  "phone": ["Telefone1", "Telefone2"],
  "email": ["email1@empresa.com", "email2@empresa.com"],
  "cnpj": "CNPJ da empresa",
  "legalName": "Razão Social",
  "employeeCount": 1000,
  ${includeDepartments ? `"departments": [
    {
      "name": "Nome do departamento",
      "description": "Descrição",
      "headCount": 50
    }
  ],` : ''}
  "source": "Fonte da informação"
}

Importante:
- Retorne apenas o JSON, sem texto adicional
- Se não encontrar alguma informação, use null
- Seja preciso e baseie-se em informações públicas disponíveis
- Para departamentos, liste os principais (RH, TI, Vendas, Marketing, etc.)
`;
  }

  /**
   * Constrói prompt para filtragem de perfis
   */
  private buildProfileFilterPrompt(profiles: Profile[], requirements: JobRequirements): string {
    const profilesSummary = profiles.map((p, idx) => `
Perfil ${idx + 1}:
- Nome: ${p.fullName}
- Cargo: ${p.headline || p.currentPosition?.title || 'N/A'}
- Empresa: ${p.currentPosition?.company || 'N/A'}
- Skills: ${p.skills?.join(', ') || 'N/A'}
- Localização: ${p.location || 'N/A'}
- Aberto a trabalho: ${p.isOpenToWork ? 'Sim' : 'Não'}
`).join('\n---\n');

    return `
Você é um especialista em recrutamento. Analise os seguintes perfis e avalie o match com os requisitos da vaga:

REQUISITOS DA VAGA:
- Cargo: ${requirements.position}
- Descrição: ${requirements.description || 'N/A'}
- Skills Obrigatórias: ${requirements.requiredSkills?.join(', ') || 'N/A'}
- Skills Desejáveis: ${requirements.preferredSkills?.join(', ') || 'N/A'}
- Anos de Experiência: ${requirements.experienceYears || 'N/A'}
- Formação: ${requirements.education || 'N/A'}
- Idiomas: ${requirements.languages?.join(', ') || 'N/A'}
- Localização: ${requirements.location || 'N/A'}

PERFIS:
${profilesSummary}

Para cada perfil, retorne um JSON array com o seguinte formato:
[
  {
    "profileIndex": 1,
    "score": 85,
    "reasons": ["Motivo 1", "Motivo 2"],
    "missingSkills": ["Skill 1", "Skill 2"],
    "strengths": ["Força 1", "Força 2"]
  }
]

Score deve ser de 0 a 100.
Retorne apenas o JSON array, sem texto adicional.
`;
  }

  /**
   * Constrói prompt para extração de requisitos
   */
  private buildJobRequirementsExtractionPrompt(jobDescription: string): string {
    return `
Você é um especialista em análise de descrições de vagas. Extraia as informações estruturadas da seguinte descrição:

${jobDescription}

Retorne um JSON com o seguinte formato:
{
  "position": "Título do cargo",
  "description": "Descrição resumida",
  "requiredSkills": ["Skill1", "Skill2"],
  "preferredSkills": ["Skill1", "Skill2"],
  "experienceYears": 3,
  "education": "Formação necessária",
  "languages": ["Português", "Inglês"],
  "location": "Localização",
  "other": "Outras informações relevantes"
}

Retorne apenas o JSON, sem texto adicional.
`;
  }

  /**
   * Parseia resposta de análise de empresa
   */
  private parseCompanyAnalysisResponse(response: string): CompanyDetailedInfo {
    try {
      // Extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        address: parsed.address || undefined,
        phone: parsed.phone || undefined,
        email: parsed.email || undefined,
        departments: parsed.departments || undefined,
        employeeCount: parsed.employeeCount || undefined,
        cnpj: parsed.cnpj || undefined,
        legalName: parsed.legalName || undefined,
        source: parsed.source || 'Gemini AI',
        analyzedAt: new Date(),
      };
    } catch (error) {
      logError('Erro ao parsear resposta de análise de empresa', error);
      return {
        source: 'Gemini AI',
        analyzedAt: new Date(),
      };
    }
  }

  /**
   * Parseia resposta de filtragem de perfis
   */
  private parseProfileFilterResponse(response: string, profiles: Profile[]): ProfileMatchResult[] {
    try {
      // Extrair JSON array da resposta
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON array válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.map((item: any) => {
        const profile = profiles[item.profileIndex - 1];
        return {
          profile,
          score: item.score || 0,
          reasons: item.reasons || [],
          missingSkills: item.missingSkills || [],
          strengths: item.strengths || [],
        };
      });
    } catch (error) {
      logError('Erro ao parsear resposta de filtragem de perfis', error);
      // Retornar todos os perfis com score 50 como fallback
      return profiles.map(profile => ({
        profile,
        score: 50,
        reasons: ['Análise automática indisponível'],
        missingSkills: [],
        strengths: [],
      }));
    }
  }

  /**
   * Parseia resposta de extração de requisitos
   */
  private parseJobRequirementsResponse(response: string): JobRequirements {
    try {
      // Extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logError('Erro ao parsear resposta de requisitos', error);
      return {
        position: 'Não especificado',
      };
    }
  }
}

// Exportar instância singleton
export default new GeminiService();
