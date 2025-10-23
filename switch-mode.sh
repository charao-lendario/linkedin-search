#!/bin/bash

# Script para alternar entre modo DEMO e REAL

MODE=$1

if [ -z "$MODE" ]; then
    echo "Uso: ./switch-mode.sh [demo|real]"
    echo ""
    echo "Exemplos:"
    echo "  ./switch-mode.sh demo   # Ativar modo DEMO (dados simulados)"
    echo "  ./switch-mode.sh real   # Ativar modo REAL (Apify)"
    exit 1
fi

case $MODE in
    demo|DEMO)
        echo "🎭 Ativando MODO DEMO (dados simulados)..."
        sed -i 's/USE_MOCK_DATA=false/USE_MOCK_DATA=true/' .env
        echo "✅ Modo DEMO ativado!"
        echo ""
        echo "Características:"
        echo "  ✓ Dados simulados"
        echo "  ✓ Gratuito"
        echo "  ✓ Não consome créditos Apify"
        echo "  ✓ Ideal para desenvolvimento"
        ;;
    real|REAL)
        echo "🌐 Ativando MODO REAL (Apify)..."
        sed -i 's/USE_MOCK_DATA=true/USE_MOCK_DATA=false/' .env
        echo "✅ Modo REAL ativado!"
        echo ""
        echo "⚠️  ATENÇÃO:"
        echo "  • Vai consumir créditos do Apify"
        echo "  • Dados reais do LinkedIn"
        echo "  • Verifique seus créditos em: https://console.apify.com/account/usage"
        echo ""
        echo "Recomendação: Comece com --max-results 10"
        ;;
    *)
        echo "❌ Modo inválido: $MODE"
        echo "Use 'demo' ou 'real'"
        exit 1
        ;;
esac

echo ""
echo "Modo atual no .env:"
grep "USE_MOCK_DATA" .env
echo ""
echo "Execute: npm run build"
