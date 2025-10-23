import { Profile, JobRequirements, ProfileMatchResult } from '../models/Profile';
import geminiService from '../services/geminiService';
import { logInfo, logError } from '../utils/logger';

/**
 * Agente especializado em filtragem e matching de perfis com requisitos de vaga
 */
export class ProfileFilterAgent {
  /**
   * Filtra perfis com base nos requisitos da vaga
   */
  async filterByRequirements(
    profiles: Profile[],
    requirements: JobRequirements,
    options: FilterOptions = {}
  ): Promise<ProfileMatchResult[]> {
    try {
      const { minScore = 60, maxResults, useAI = true } = options;

      logInfo('Agente iniciando filtragem de perfis', {
        totalProfiles: profiles.length,
        minScore,
        maxResults,
        useAI,
      });

      let matchResults: ProfileMatchResult[] = [];

      if (useAI && profiles.length > 0) {
        // Usar Gemini AI para matching inteligente
        matchResults = await this.filterWithAI(profiles, requirements);
      } else {
        // Fallback: matching baseado em regras
        matchResults = this.filterWithRules(profiles, requirements);
      }

      // Filtrar por score mínimo
      matchResults = matchResults.filter(result => result.score >= minScore);

      // Ordenar por score decrescente
      matchResults.sort((a, b) => b.score - a.score);

      // Limitar resultados se especificado
      if (maxResults && maxResults > 0) {
        matchResults = matchResults.slice(0, maxResults);
      }

      logInfo('Filtragem de perfis concluída', {
        totalFiltered: matchResults.length,
        averageScore: this.calculateAverageScore(matchResults),
      });

      return matchResults;
    } catch (error) {
      logError('Erro no agente de filtragem de perfis', error);
      return [];
    }
  }

  /**
   * Filtragem usando Gemini AI
   */
  private async filterWithAI(
    profiles: Profile[],
    requirements: JobRequirements
  ): Promise<ProfileMatchResult[]> {
    try {
      logInfo('Usando Gemini AI para filtragem', { totalProfiles: profiles.length });

      const results = await geminiService.filterProfilesByRequirements(profiles, requirements);

      logInfo('Filtragem AI concluída', { matchedProfiles: results.length });

      return results;
    } catch (error) {
      logError('Erro ao filtrar com AI, usando fallback', error);
      return this.filterWithRules(profiles, requirements);
    }
  }

  /**
   * Filtragem baseada em regras (fallback)
   */
  private filterWithRules(
    profiles: Profile[],
    requirements: JobRequirements
  ): ProfileMatchResult[] {
    logInfo('Usando filtragem baseada em regras', { totalProfiles: profiles.length });

    return profiles.map(profile => {
      const score = this.calculateMatchScore(profile, requirements);
      const reasons = this.identifyMatchReasons(profile, requirements);
      const missingSkills = this.identifyMissingSkills(profile, requirements);
      const strengths = this.identifyStrengths(profile, requirements);

      return {
        profile,
        score,
        reasons,
        missingSkills,
        strengths,
      };
    });
  }

  /**
   * Calcula score de match (0-100) baseado em regras
   */
  private calculateMatchScore(profile: Profile, requirements: JobRequirements): number {
    let score = 0;
    let maxScore = 0;

    // Cargo/Posição (peso 25)
    maxScore += 25;
    if (requirements.position && profile.headline) {
      const positionMatch = this.calculateTextSimilarity(
        profile.headline.toLowerCase(),
        requirements.position.toLowerCase()
      );
      score += positionMatch * 25;
    }

    // Skills Obrigatórias (peso 35)
    maxScore += 35;
    if (requirements.requiredSkills && requirements.requiredSkills.length > 0) {
      const skillsMatch = this.calculateSkillsMatch(
        profile.skills || [],
        requirements.requiredSkills
      );
      score += skillsMatch * 35;
    }

    // Skills Desejáveis (peso 15)
    maxScore += 15;
    if (requirements.preferredSkills && requirements.preferredSkills.length > 0) {
      const skillsMatch = this.calculateSkillsMatch(
        profile.skills || [],
        requirements.preferredSkills
      );
      score += skillsMatch * 15;
    }

    // Localização (peso 10)
    maxScore += 10;
    if (requirements.location) {
      const locationMatch = this.checkLocationMatch(profile, requirements.location);
      score += locationMatch ? 10 : 0;
    }

    // Idiomas (peso 10)
    maxScore += 10;
    if (requirements.languages && requirements.languages.length > 0) {
      const languagesMatch = this.calculateLanguagesMatch(
        profile.languages || [],
        requirements.languages
      );
      score += languagesMatch * 10;
    }

    // Aberto a trabalho (peso 5)
    maxScore += 5;
    if (profile.isOpenToWork) {
      score += 5;
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calcula similaridade entre textos (0-1)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);

    let matches = 0;
    words2.forEach(word => {
      if (words1.some(w => w.includes(word) || word.includes(w))) {
        matches++;
      }
    });

    return words2.length > 0 ? matches / words2.length : 0;
  }

  /**
   * Calcula match de skills (0-1)
   */
  private calculateSkillsMatch(profileSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 1;

    const normalizedProfileSkills = profileSkills.map(s => s.toLowerCase());
    let matches = 0;

    requiredSkills.forEach(reqSkill => {
      const reqSkillLower = reqSkill.toLowerCase();
      if (normalizedProfileSkills.some(ps => ps.includes(reqSkillLower) || reqSkillLower.includes(ps))) {
        matches++;
      }
    });

    return matches / requiredSkills.length;
  }

  /**
   * Verifica match de localização
   */
  private checkLocationMatch(profile: Profile, requiredLocation: string): boolean {
    const location = (profile.location || '').toLowerCase();
    const required = requiredLocation.toLowerCase();

    return location.includes(required) || required.includes(location);
  }

  /**
   * Calcula match de idiomas (0-1)
   */
  private calculateLanguagesMatch(profileLanguages: any[], requiredLanguages: string[]): number {
    if (requiredLanguages.length === 0) return 1;

    const profileLangNames = profileLanguages.map(l =>
      typeof l === 'string' ? l.toLowerCase() : l.name.toLowerCase()
    );

    let matches = 0;
    requiredLanguages.forEach(reqLang => {
      if (profileLangNames.includes(reqLang.toLowerCase())) {
        matches++;
      }
    });

    return matches / requiredLanguages.length;
  }

  /**
   * Identifica razões do match
   */
  private identifyMatchReasons(profile: Profile, requirements: JobRequirements): string[] {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const reasons: string[] = [];

    if (requirements.position && profile.headline?.toLowerCase().includes(requirements.position.toLowerCase())) {
      reasons.push(`Cargo compatível: ${profile.headline}`);
    }

    if (profile.isOpenToWork) {
      reasons.push('Aberto a novas oportunidades');
    }

    if (requirements.requiredSkills) {
      const matchedSkills = (profile.skills || []).filter(skill =>
        requirements.requiredSkills?.some(req => skill.toLowerCase().includes(req.toLowerCase()))
      );

      if (matchedSkills.length > 0) {
        reasons.push(`Skills compatíveis: ${matchedSkills.slice(0, 3).join(', ')}`);
      }
    }

    return reasons;
  }

  /**
   * Identifica skills faltantes
   */
  private identifyMissingSkills(profile: Profile, requirements: JobRequirements): string[] {
    if (!requirements.requiredSkills) return [];

    const profileSkills = (profile.skills || []).map(s => s.toLowerCase());

    return requirements.requiredSkills.filter(reqSkill => {
      const reqSkillLower = reqSkill.toLowerCase();
      return !profileSkills.some(ps => ps.includes(reqSkillLower) || reqSkillLower.includes(ps));
    });
  }

  /**
   * Identifica pontos fortes
   */
  private identifyStrengths(profile: Profile, requirements: JobRequirements): string[] {
    const strengths: string[] = [];

    if (profile.experience && profile.experience.length > 3) {
      strengths.push('Experiência profissional diversificada');
    }

    if (profile.education && profile.education.length > 0) {
      strengths.push(`Formação: ${profile.education[0].degree || profile.education[0].school}`);
    }

    if (profile.languages && profile.languages.length > 2) {
      strengths.push(`Multilíngue: ${profile.languages.map(l => l.name).join(', ')}`);
    }

    return strengths;
  }

  /**
   * Calcula score médio
   */
  private calculateAverageScore(results: ProfileMatchResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / results.length);
  }
}

export interface FilterOptions {
  minScore?: number;
  maxResults?: number;
  useAI?: boolean;
}

// Exportar instância singleton
export default new ProfileFilterAgent();
