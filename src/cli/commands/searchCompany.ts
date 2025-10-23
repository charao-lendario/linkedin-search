import { Command } from 'commander';
import readline from 'readline';
import companyService from '../../services/companyService';
import excelService from '../../services/excelService';
import { CompanySearchRequest } from '../../models/Company';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function interactiveCompanySearch(): Promise<void> {
  console.log('\n=== BUSCA DE EMPRESAS NO LINKEDIN ===\n');

  try {
    // Coletar filtros interativamente
    const country = await question('País (ex: Brasil): ');
    const state = await question('Estado (ex: SP): ');
    const city = await question('Cidade (ex: São Paulo): ');
    const segment = await question('Segmento/Ramo (ex: Tecnologia): ');
    const hasOpenPositionsStr = await question('Vagas Abertas? (Sim/Não): ');
    const includeDetailedStr = await question('Deseja informações detalhadas da empresa? (Sim/Não): ');

    const hasOpenPositions = hasOpenPositionsStr.toLowerCase() === 'sim';
    const includeDetailedInfo = includeDetailedStr.toLowerCase() === 'sim';

    // Construir request
    const request: CompanySearchRequest = {
      filters: {
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        segment: segment || undefined,
        hasOpenPositions: hasOpenPositions || undefined,
      },
      includeDetailedInfo,
      maxResults: 100,
    };

    console.log('\n🔍 Iniciando busca de empresas...\n');

    // Executar busca
    const result = await companyService.searchCompanies(request);

    if (result.status === 'completed') {
      console.log(`✅ Busca concluída!`);
      console.log(`📊 Total de empresas encontradas: ${result.totalResults}`);
      console.log(`🆔 ID da busca: ${result.id}\n`);

      // Mostrar algumas empresas
      if (result.results.length > 0) {
        console.log('--- Primeiras empresas encontradas ---');
        result.results.slice(0, 5).forEach((company, idx) => {
          console.log(`${idx + 1}. ${company.name}`);
          console.log(`   Segmento: ${company.industry || company.segment || 'N/A'}`);
          console.log(`   Localização: ${company.city || ''}, ${company.state || ''}`);
          console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
          console.log('');
        });
      }

      // Perguntar sobre exportação
      const exportStr = await question('Deseja exportar para Excel? (Sim/Não): ');

      if (exportStr.toLowerCase() === 'sim') {
        console.log('\n📄 Gerando arquivo Excel...');

        const filePath = await excelService.exportCompanySearch({
          searchId: result.id,
          format: 'excel',
          includeDetailedInfo,
        });

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

async function searchCompanyWithArgs(options: any): Promise<void> {
  try {
    const request: CompanySearchRequest = {
      filters: {
        country: options.pais,
        state: options.estado,
        city: options.cidade,
        segment: options.segmento,
        hasOpenPositions: options.vagasAbertas === 'Sim',
      },
      includeDetailedInfo: options.detailed || false,
      maxResults: parseInt(options.maxResults || '100'),
    };

    console.log('🔍 Buscando empresas...');

    const result = await companyService.searchCompanies(request);

    if (result.status === 'completed') {
      console.log(`✅ ${result.totalResults} empresas encontradas`);
      console.log(`ID da busca: ${result.id}`);

      if (options.export) {
        const filePath = await excelService.exportCompanySearch({
          searchId: result.id,
          format: 'excel',
          includeDetailedInfo: options.detailed,
        });
        console.log(`Exportado para: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function analyzeCompany(companyId: string, options: any): Promise<void> {
  try {
    console.log(`🔍 Analisando empresa ${companyId}...`);

    const company = await companyService.analyzeCompany({
      companyId,
      includeDepartments: options.detailed !== false,
    });

    console.log(`\n✅ Análise concluída para: ${company.name}`);
    console.log('\n--- Informações Detalhadas ---');

    if (company.detailedInfo?.address) {
      console.log(`\nEndereço: ${company.detailedInfo.address.fullAddress || 'N/A'}`);
    }

    if (company.detailedInfo?.phone) {
      console.log(`Telefone: ${company.detailedInfo.phone.join(', ')}`);
    }

    if (company.detailedInfo?.email) {
      console.log(`Email: ${company.detailedInfo.email.join(', ')}`);
    }

    if (company.detailedInfo?.departments) {
      console.log('\nDepartamentos:');
      company.detailedInfo.departments.forEach(dept => {
        console.log(`  - ${dept.name}`);
      });
    }
  } catch (error) {
    console.error('Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export async function runCompanyCommand(args: string[]): Promise<void> {
  const program = new Command();

  program
    .name('search:company')
    .description('Buscar empresas no LinkedIn')
    .option('--pais <pais>', 'País')
    .option('--estado <estado>', 'Estado')
    .option('--cidade <cidade>', 'Cidade')
    .option('--segmento <segmento>', 'Segmento/Ramo')
    .option('--vagas-abertas <sim|nao>', 'Filtrar por vagas abertas')
    .option('--detailed', 'Incluir informações detalhadas')
    .option('--max-results <number>', 'Máximo de resultados', '100')
    .option('--export', 'Exportar automaticamente')
    .action(searchCompanyWithArgs);

  program
    .command('analyze')
    .description('Analisar empresa específica')
    .requiredOption('--company-id <id>', 'ID da empresa')
    .option('--detailed', 'Incluir departamentos')
    .action((options) => analyzeCompany(options.companyId, options));

  // Se não houver argumentos, rodar modo interativo
  if (args.length === 0) {
    await interactiveCompanySearch();
  } else {
    await program.parseAsync(['node', 'search:company', ...args]);
  }
}

export default runCompanyCommand;
