import { v4 as uuidv4 } from 'uuid';
import { Company } from '../models/Company';
import { Profile } from '../models/Profile';

/**
 * Serviço de dados mock para testes sem Apify
 */
export class MockDataService {
  /**
   * Gera empresas fake para testes
   */
  generateMockCompanies(count = 10, filters?: any): Company[] {
    const companies: Company[] = [];

    const segments = ['Tecnologia', 'Financeiro', 'Saúde', 'Educação', 'Varejo'];
    const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];

    for (let i = 1; i <= count; i++) {
      companies.push({
        id: uuidv4(),
        name: `Empresa ${filters?.segment || 'Tech'} ${i}`,
        linkedinUrl: `https://linkedin.com/company/empresa-${i}`,
        website: `https://empresa${i}.com.br`,
        industry: filters?.segment || segments[i % segments.length],
        companySize: this.getRandomSize(),
        headquarters: `${filters?.city || cities[i % cities.length]}, ${filters?.state || 'SP'}, ${filters?.country || 'Brasil'}`,
        description: `Empresa líder em ${filters?.segment || 'Tecnologia'} com soluções inovadoras`,
        specialties: ['Inovação', 'Tecnologia', 'Consultoria'],
        foundedYear: 2000 + (i % 20),
        country: filters?.country || 'Brasil',
        state: filters?.state || 'SP',
        city: filters?.city || cities[i % cities.length],
        segment: filters?.segment || segments[i % segments.length],
        hasOpenPositions: filters?.hasOpenPositions ?? (i % 2 === 0),
        createdAt: new Date(),
      });
    }

    return companies;
  }

  /**
   * Gera perfis fake para testes
   */
  generateMockProfiles(count = 10, filters?: any): Profile[] {
    const profiles: Profile[] = [];

    const positions = ['Desenvolvedor Python', 'Desenvolvedor Java', 'DevOps Engineer', 'Data Scientist', 'Product Manager'];
    const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
    const names = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza', 'Julia Ferreira', 'Lucas Almeida', 'Beatriz Lima', 'Rafael Pereira', 'Camila Rocha'];

    for (let i = 0; i < count; i++) {
      profiles.push({
        id: uuidv4(),
        fullName: names[i % names.length],
        linkedinUrl: `https://linkedin.com/in/usuario-${i}`,
        headline: filters?.position || positions[i % positions.length],
        location: `${filters?.city || cities[i % cities.length]}, ${filters?.state || 'SP'}`,
        profilePictureUrl: `https://avatar.example.com/${i}.jpg`,
        currentPosition: {
          title: filters?.position || positions[i % positions.length],
          company: `Empresa Tech ${i + 1}`,
          location: filters?.city || cities[i % cities.length],
          current: true,
        },
        skills: ['Python', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
        languages: [
          { name: 'Português', proficiency: 'Nativo' },
          { name: 'Inglês', proficiency: 'Avançado' },
        ],
        about: `Profissional experiente em ${filters?.position || 'Desenvolvimento'} com mais de ${3 + i} anos de experiência`,
        country: filters?.country || 'Brasil',
        state: filters?.state || 'SP',
        city: filters?.city || cities[i % cities.length],
        isOpenToWork: filters?.isOpenToWork === 'Sim' ? true : (i % 3 === 0),
        source: 'linkedin',
        createdAt: new Date(),
      });
    }

    return profiles;
  }

  private getRandomSize(): string {
    const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }
}

export default new MockDataService();
