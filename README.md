# LinkedIn Search AI

Backend completo em Node.js com TypeScript para busca inteligente de empresas e perfis no LinkedIn usando Gemini AI 2.5-flash e Apify.

## Características

- **Busca de Empresas**: Encontre empresas com filtros avançados (país, estado, cidade, segmento, vagas abertas)
- **Busca de Perfis**: Encontre candidatos/profissionais com matching inteligente
- **Análise IA**: Enriquecimento de dados usando Gemini AI e InfoSimples API
- **Exportação**: Geração automática de relatórios em Excel
- **CLI Interativo**: Interface de linha de comando amigável
- **API REST**: Endpoints completos para integração frontend
- **Cache Inteligente**: Sistema de cache com expiração de 6 horas
- **TypeScript Strict Mode**: Código type-safe e robusto

## Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Gemini AI 2.5-flash** - Análise inteligente
- **Apify** - Scraping do LinkedIn
- **InfoSimples API** - Dados de empresas brasileiras
- **ExcelJS** - Geração de planilhas
- **Winston** - Logging estruturado
- **Joi** - Validação de dados

## Instalação

### 1. Clonar o repositório

```bash
git clone <repository-url>
cd linkedin-search
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

O arquivo `.env` já está configurado com as chaves de API fornecidas.

**IMPORTANTE:** Por padrão, a aplicação roda em **MODO DEMO** com dados simulados.

Para usar os actors **reais do Apify** e obter dados verdadeiros do LinkedIn:
- Veja o guia completo em: `APIFY_SETUP.md`
- Execute: `./switch-mode.sh real` (ou edite `.env` e mude `USE_MOCK_DATA=false`)

### 4. Compilar TypeScript

```bash
npm run build
```

## Uso

### Modo CLI Interativo

```bash
npm run search
```

O CLI apresentará um menu interativo para escolher entre busca de EMPRESA ou PERFIL.

### CLI - Busca de Empresas

**Modo Interativo:**
```bash
npm run search:company
```

**Com argumentos:**
```bash
npm run search:company -- --pais "Brasil" --estado "SP" --cidade "São Paulo" --segmento "Tecnologia" --vagas-abertas "Sim" --detailed --export
```

### CLI - Busca de Perfis

**Modo Interativo:**
```bash
npm run search:profile
```

**Com argumentos:**
```bash
npm run search:profile -- --cargo "Desenvolvedor Python" --pais "Brasil" --estado "SP" --procurando-emprego "Sim" --export
```

### Servidor API

```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## API Endpoints

### Empresas

- `POST /api/company/search` - Buscar empresas
- `POST /api/company/analyze/:companyId` - Analisar empresa
- `GET /api/company/results/:searchId` - Obter resultados
- `POST /api/company/export/:searchId` - Exportar para Excel

### Perfis

- `POST /api/profile/search` - Buscar perfis
- `POST /api/profile/filter` - Filtrar com IA
- `GET /api/profile/results/:searchId` - Obter resultados
- `GET /api/profile/links/:searchId` - Obter apenas links
- `POST /api/profile/export/:searchId` - Exportar para Excel

### Geral

- `GET /api/search/status` - Status da aplicação
- `GET /api/search/history` - Histórico de buscas
- `GET /api/search/stats` - Estatísticas
- `POST /api/search/clear-cache` - Limpar cache

## Estrutura do Projeto

```
linkedin-search-ai/
├── src/
│   ├── agents/              # Agentes IA
│   ├── cli/                 # Interface CLI
│   ├── config/              # Configurações
│   ├── controllers/         # Controllers da API
│   ├── models/              # Modelos de dados
│   ├── routes/              # Rotas da API
│   ├── services/            # Serviços (Gemini, Apify, InfoSimples)
│   ├── utils/               # Utilitários
│   └── app.ts               # Servidor Express
├── data/                    # Dados e cache
├── exports/                 # Arquivos exportados
├── logs/                    # Logs da aplicação
└── package.json
```

## Scripts Disponíveis

```bash
npm run dev              # Modo desenvolvimento
npm run build           # Compilar TypeScript
npm start              # Servidor em produção
npm run search         # CLI interativo
npm run search:company # Buscar empresas
npm run search:profile # Buscar perfis
```

## Modos de Operação

### 🎭 Modo DEMO (Padrão)
Usa dados simulados para testes sem consumir créditos do Apify.

```bash
./switch-mode.sh demo
npm run build
npm run search:company -- --pais "Brasil" --segmento "Tecnologia"
```

**Vantagens:**
- ✅ Gratuito
- ✅ Rápido
- ✅ Ideal para desenvolvimento
- ✅ Testa toda a aplicação (CLI, API, Excel)

### 🌐 Modo REAL
Usa os actors reais do Apify para buscar dados verdadeiros do LinkedIn.

```bash
./switch-mode.sh real
npm run build
npm run search:company -- --pais "Brasil" --segmento "Tecnologia"
```

**Atenção:**
- ⚠️ Consome créditos do Apify
- ⚠️ Comece com `--max-results 10`
- ⚠️ Veja custos em: https://console.apify.com/account/usage

**Actors Configurados:**
- LinkedIn Company Scraper: `od6RadQV98FOARtrp`
- LinkedIn People Scraper: `2SyF0bVxmgGr8IVCZ`
- LinkedIn Jobs Scraper: `BHzefUZlZRKWxkTck`

Para mais detalhes, veja `APIFY_SETUP.md`

## Licença

MIT