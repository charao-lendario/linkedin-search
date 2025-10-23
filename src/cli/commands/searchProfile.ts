import { Command } from 'commander';
import readline from 'readline';
import profileService from '../../services/profileService';
import excelService from '../../services/excelService';
import { ProfileSearchRequest, JobRequirements } from '../../models/Profile';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function interactiveProfileSearch(): Promise<void> {
  console.log('\n=== BUSCA DE PERFIS NO LINKEDIN ===\n');

  try {
    // Coletar filtros interativamente
    const position = await question('Cargo/Posição (ex: Desenvolvedor Python): ');
    const country = await question('País (ex: Brasil): ');
    const state = await question('Estado (ex: SP): ');
    const city = await question('Cidade (opcional): ');
    const isOpenToWorkStr = await question('Procurando Emprego? (Sim/Não/Todos): ');

    // Perguntar sobre requisitos da vaga
    const useRequirementsStr = await question('Deseja filtrar por requisitos da vaga? (Sim/Não): ');

    let jobRequirements: string | undefined;

    if (useRequirementsStr.toLowerCase() === 'sim') {
      console.log('\n--- Requisitos da Vaga ---');
      const reqPosition = await question('Cargo: ');
      const reqSkills = await question('Skills Obrigatórias (separadas por vírgula): ');
      const reqExperience = await question('Anos de experiência mínima: ');

      // Construir requisitos
      const requirements: JobRequirements = {
        position: reqPosition || position,
        requiredSkills: reqSkills.split(',').map(s => s.trim()).filter(Boolean),
        experienceYears: reqExperience ? parseInt(reqExperience) : undefined,
      };

      jobRequirements = JSON.stringify(requirements);
    }

    // Construir request
    const request: ProfileSearchRequest = {
      filters: {
        position: position || undefined,
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        isOpenToWork: isOpenToWorkStr as any,
      },
      jobRequirements,
      maxResults: 100,
    };

    console.log('\n🔍 Iniciando busca de perfis...\n');

    // Executar busca
    const result = await profileService.searchProfiles(request);

    if (result.status === 'completed') {
      console.log(`✅ Busca concluída!`);
      console.log(`📊 Total de perfis encontrados: ${result.totalResults}`);
      console.log(`🆔 ID da busca: ${result.id}\n`);

      // Mostrar alguns perfis
      if (result.results.length > 0) {
        console.log('--- Primeiros perfis encontrados ---');
        result.results.slice(0, 5).forEach((profile, idx) => {
          console.log(`${idx + 1}. ${profile.fullName}`);
          console.log(`   Cargo: ${profile.headline || 'N/A'}`);
          console.log(`   Localização: ${profile.location || 'N/A'}`);
          console.log(`   LinkedIn: ${profile.linkedinUrl}`);

          if (profile.matchScore) {
            console.log(`   Match Score: ${profile.matchScore}%`);
          }

          console.log('');
        });
      }

      // Perguntar sobre exportação
      const exportTypeStr = await question('Deseja exportar? (Excel/Links/Não): ');

      if (exportTypeStr.toLowerCase() === 'excel') {
        console.log('\n📄 Gerando arquivo Excel...');

        const filePath = await excelService.exportProfileSearch(result.id);

        console.log(`✅ Arquivo gerado: ${filePath}\n`);
      } else if (exportTypeStr.toLowerCase() === 'links') {
        console.log('\n📄 Gerando arquivo de links...');

        const filePath = await excelService.exportProfileLinks(result.id);

        console.log(`✅ Arquivo gerado: ${filePath}\n`);
      }
    } else {
      console.log('❌ Erro na busca:', result.errors);
    }

    rl.close();
  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : error);
    rl.close();
    process.exit(1);
  }
}

async function searchProfileWithArgs(options: any): Promise<void> {
  try {
    const request: ProfileSearchRequest = {
      filters: {
        position: options.cargo,
        country: options.pais,
        state: options.estado,
        city: options.cidade,
        isOpenToWork: options.procurandoEmprego,
      },
      maxResults: parseInt(options.maxResults || '100'),
    };

    console.log('🔍 Buscando perfis...');

    const result = await profileService.searchProfiles(request);

    if (result.status === 'completed') {
      console.log(`✅ ${result.totalResults} perfis encontrados`);
      console.log(`ID da busca: ${result.id}`);

      if (options.export) {
        const filePath = await excelService.exportProfileSearch(result.id);
        console.log(`Exportado para: ${filePath}`);
      }

      if (options.exportLinks) {
        const filePath = await excelService.exportProfileLinks(result.id);
        console.log(`Links exportados para: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function filterProfiles(searchId: string, options: any): Promise<void> {
  try {
    console.log(`🔍 Filtrando perfis da busca ${searchId}...`);

    let requirements: JobRequirements;

    if (options.requisitos) {
      // Carregar requisitos de arquivo
      const fs = require('fs').promises;
      const requirementsText = await fs.readFile(options.requisitos, 'utf-8');
      requirements = JSON.parse(requirementsText);
    } else {
      // Requisitos básicos via CLI
      requirements = {
        position: options.cargo || 'Desenvolvedor',
        requiredSkills: options.skills?.split(',').map((s: string) => s.trim()) || [],
      };
    }

    const matchResults = await profileService.filterProfiles({
      searchId,
      requirements,
      minMatchScore: parseInt(options.minScore || '60'),
    });

    console.log(`\n✅ ${matchResults.length} perfis com match acima de ${options.minScore || 60}%`);

    matchResults.slice(0, 10).forEach((match, idx) => {
      console.log(`\n${idx + 1}. ${match.profile.fullName} - Score: ${match.score}%`);
      console.log(`   Razões: ${match.reasons.join(', ')}`);

      if (match.missingSkills && match.missingSkills.length > 0) {
        console.log(`   Skills faltantes: ${match.missingSkills.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export async function runProfileCommand(args: string[]): Promise<void> {
  const program = new Command();

  program
    .name('search:profile')
    .description('Buscar perfis no LinkedIn')
    .option('--cargo <cargo>', 'Cargo/Posição')
    .option('--pais <pais>', 'País')
    .option('--estado <estado>', 'Estado')
    .option('--cidade <cidade>', 'Cidade')
    .option('--procurando-emprego <sim|nao|todos>', 'Procurando emprego')
    .option('--max-results <number>', 'Máximo de resultados', '100')
    .option('--export', 'Exportar automaticamente para Excel')
    .option('--export-links', 'Exportar apenas links')
    .action(searchProfileWithArgs);

  program
    .command('filter')
    .description('Filtrar perfis por requisitos')
    .requiredOption('--search-id <id>', 'ID da busca')
    .option('--requisitos <arquivo>', 'Arquivo JSON com requisitos')
    .option('--cargo <cargo>', 'Cargo desejado')
    .option('--skills <skills>', 'Skills separadas por vírgula')
    .option('--min-score <number>', 'Score mínimo', '60')
    .action((options) => filterProfiles(options.searchId, options));

  // Se não houver argumentos, rodar modo interativo
  if (args.length === 0) {
    await interactiveProfileSearch();
  } else {
    await program.parseAsync(['node', 'search:profile', ...args]);
  }
}

export default runProfileCommand;
