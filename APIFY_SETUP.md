# Configuração do Apify

Este documento explica como configurar a aplicação para usar os **actors reais do Apify** ao invés dos dados simulados.

## Actors Configurados

A aplicação usa os seguintes actors do Apify:

| Funcionalidade | Actor ID | Link |
|---|---|---|
| **Buscar Empresas** | `od6RadQV98FOARtrp` | https://console.apify.com/actors/od6RadQV98FOARtrp |
| **Buscar Perfis** | `2SyF0bVxmgGr8IVCZ` | https://console.apify.com/actors/2SyF0bVxmgGr8IVCZ |
| **Buscar Vagas** | `BHzefUZlZRKWxkTck` | https://console.apify.com/actors/BHzefUZlZRKWxkTck |

## Como Ativar o Modo Real

### 1. Verificar sua API Key

Certifique-se que sua chave do Apify está no arquivo `.env`:

```env
APIFY_API_KEY=sua_chave_apify_aqui
```

A chave deve começar com `apify_api_` seguido de caracteres alfanuméricos.

### 2. Desativar o Modo DEMO

Edite o arquivo `.env` e mude:

```env
# De:
USE_MOCK_DATA=true

# Para:
USE_MOCK_DATA=false
```

### 3. Recompilar

```bash
npm run build
```

### 4. Testar

```bash
# Buscar empresas reais
npm run search:company -- --pais "Brasil" --estado "SP" --segmento "Tecnologia"

# Buscar perfis reais
npm run search:profile -- --cargo "Desenvolvedor Python" --pais "Brasil"
```

## Importante

⚠️ **Atenção:** Os actors do Apify são **pagos** e consomem créditos da sua conta!

- Cada execução consome créditos
- Verifique seu plano no Apify Console
- Comece com buscas pequenas (`--max-results 10`)
- Use o modo DEMO para desenvolvimento

## Verificar Créditos

Acesse: https://console.apify.com/account/usage

## Estrutura dos Dados Retornados

### Company Actor (`od6RadQV98FOARtrp`)

**Input esperado:**
```json
{
  "searchUrls": ["https://www.linkedin.com/search/results/companies/?keywords=Tecnologia&location=Brasil"],
  "maxResults": 100,
  "proxyConfiguration": {
    "useApifyProxy": true
  }
}
```

**Output:**
- `name` - Nome da empresa
- `url` / `linkedInUrl` - URL do LinkedIn
- `website` - Site da empresa
- `industry` - Setor/Indústria
- `companySize` / `staffCount` - Tamanho
- `headquarters` / `location` - Sede
- `description` / `tagline` - Descrição

### People Actor (`2SyF0bVxmgGr8IVCZ`)

**Input esperado:**
```json
{
  "searchUrls": ["https://www.linkedin.com/search/results/people/?keywords=Desenvolvedor Python&location=Brasil"],
  "maxResults": 100,
  "proxyConfiguration": {
    "useApifyProxy": true
  }
}
```

**Output:**
- `name` / `fullName` - Nome completo
- `url` / `profileUrl` - URL do perfil
- `headline` / `title` - Cargo atual
- `location` - Localização
- `positions` - Experiências
- `schools` - Educação
- `skills` - Habilidades

### Jobs Actor (`BHzefUZlZRKWxkTck`)

**Input esperado:**
```json
{
  "searchUrls": ["https://www.linkedin.com/jobs/search/?keywords=Python&location=Brasil"],
  "maxResults": 50
}
```

**Output:**
- Vagas abertas no LinkedIn
- Usado para verificar se empresas têm vagas

## Custos Estimados

| Operação | Créditos Aprox. | Observação |
|---|---|---|
| Buscar 100 empresas | 0.5 - 2 | Varia com complexidade |
| Buscar 100 perfis | 1 - 3 | Varia com detalhes |
| Buscar vagas | 0.3 - 1 | Por empresa |

**Recomendação:** Comece com `maxResults: 10` para testar!

## Troubleshooting

### Erro: "Access denied"

- Verifique se sua API key está correta
- Confirme que os actors estão disponíveis no seu plano
- Acesse os links dos actors e veja se consegue rodá-los manualmente

### Erro: "Actor not found"

- Os IDs estão corretos no `src/config/index.ts`
- Verifique se você tem acesso aos actors

### Resultados vazios

- Ajuste os parâmetros de busca
- Tente URLs mais simples
- Verifique os logs para ver a query gerada

## Alternando Entre Modos

### Modo DEMO (Desenvolvimento)
```env
USE_MOCK_DATA=true
```
- ✅ Gratuito
- ✅ Rápido
- ✅ Não consome créditos
- ❌ Dados falsos

### Modo REAL (Produção)
```env
USE_MOCK_DATA=false
```
- ✅ Dados reais do LinkedIn
- ✅ Análise IA com Gemini
- ✅ Dados InfoSimples para empresas BR
- ❌ Consome créditos Apify

## Links Úteis

- [Apify Console](https://console.apify.com)
- [Documentação Apify](https://docs.apify.com)
- [Preços Apify](https://apify.com/pricing)
- [Minha Conta](https://console.apify.com/account)
