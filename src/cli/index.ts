#!/usr/bin/env node

// Carregar variáveis de ambiente PRIMEIRO
import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import readline from 'readline';
import { runCompanyCommand } from './commands/searchCompany';
import { runProfileCommand } from './commands/searchProfile';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function interactiveMode(): Promise<void> {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  LINKEDIN SEARCH AI - CLI             ║');
  console.log('║  Busca Inteligente com Gemini & Apify ║');
  console.log('╚═══════════════════════════════════════╝\n');

  const typeAnswer = await question('Selecione o tipo de busca:\n  1) EMPRESA\n  2) PERFIL\n\nEscolha (1 ou 2): ');

  rl.close();

  if (typeAnswer === '1') {
    console.log('\n→ Iniciando busca de EMPRESAS...\n');
    await runCompanyCommand([]);
  } else if (typeAnswer === '2') {
    console.log('\n→ Iniciando busca de PERFIS...\n');
    await runProfileCommand([]);
  } else {
    console.log('\n❌ Opção inválida. Use 1 ou 2.\n');
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('linkedin-search-ai')
    .description('CLI para busca inteligente no LinkedIn usando Gemini AI e Apify')
    .version('1.0.0');

  program
    .command('company')
    .description('Buscar empresas')
    .allowUnknownOption()
    .action(async () => {
      const args = process.argv.slice(3);
      await runCompanyCommand(args);
    });

  program
    .command('profile')
    .description('Buscar perfis')
    .allowUnknownOption()
    .action(async () => {
      const args = process.argv.slice(3);
      await runProfileCommand(args);
    });

  program
    .command('interactive')
    .alias('i')
    .description('Modo interativo')
    .action(interactiveMode);

  // Se não houver comandos, rodar modo interativo
  if (process.argv.length <= 2) {
    await interactiveMode();
  } else {
    await program.parseAsync(process.argv);
  }
}

// Executar CLI
main().catch(error => {
  console.error('\n❌ Erro fatal:', error.message);
  process.exit(1);
});
