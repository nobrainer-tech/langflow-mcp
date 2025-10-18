#!/bin/bash

# Setup script dla Langflow MCP w Claude Desktop
# Autor: Claude Code

set -e

echo "🚀 Langflow MCP Setup dla Claude Desktop"
echo "=========================================="
echo ""

# Sprawdź czy uvx jest zainstalowany
if ! command -v uvx &> /dev/null; then
    echo "⚠️  uvx nie jest zainstalowany"
    echo "📦 Instaluję uv..."
    pip install uv
    echo "✅ uv zainstalowany"
else
    echo "✅ uvx już zainstalowany"
fi

echo ""
echo "📋 Aby dokończyć konfigurację:"
echo ""
echo "1. Uzyskaj PROJECT_ID:"
echo "   - Otwórz: https://kevin119-40173.wykr.es"
echo "   - Zaloguj się"
echo "   - Przejdź do Projects → MCP Server"
echo "   - Skopiuj PROJECT_ID"
echo ""
echo "2. Wpisz PROJECT_ID poniżej (lub naciśnij Ctrl+C aby przerwać):"
read -p "PROJECT_ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ PROJECT_ID nie może być pusty"
    exit 1
fi

# Ścieżka do pliku konfiguracyjnego Claude Desktop
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
else
    echo "❌ Nieobsługiwany system operacyjny"
    exit 1
fi

# Utwórz katalog jeśli nie istnieje
mkdir -p "$(dirname "$CONFIG_PATH")"

# Przygotuj konfigurację
MCP_CONFIG=$(cat <<EOF
{
  "mcpServers": {
    "langflow": {
      "command": "uvx",
      "args": [
        "mcp-proxy",
        "https://kevin119-40173.wykr.es/api/v1/mcp/project/$PROJECT_ID/sse"
      ],
      "env": {
        "LANGFLOW_API_KEY": "sk-LpN17IPEE-rhjYFOHXStcyWLIGLzpExnM_bRbk3EFDs"
      }
    }
  }
}
EOF
)

# Sprawdź czy plik konfiguracyjny już istnieje
if [ -f "$CONFIG_PATH" ]; then
    echo ""
    echo "⚠️  Plik konfiguracyjny już istnieje: $CONFIG_PATH"
    echo ""
    read -p "Czy chcesz go nadpisać? (t/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Tt]$ ]]; then
        echo ""
        echo "📝 Musisz ręcznie dodać następującą konfigurację do pliku:"
        echo "$CONFIG_PATH"
        echo ""
        echo "$MCP_CONFIG"
        echo ""
        exit 0
    fi
fi

# Zapisz konfigurację
echo "$MCP_CONFIG" > "$CONFIG_PATH"

echo ""
echo "✅ Konfiguracja zapisana w: $CONFIG_PATH"
echo ""
echo "🔄 Teraz zrestartuj Claude Desktop:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   pkill -9 'Claude' && open -a Claude"
else
    echo "   Zamknij i uruchom ponownie aplikację Claude Desktop"
fi
echo ""
echo "🎉 Setup zakończony! Twoje Langflow flows są teraz dostępne w Claude Desktop."
echo ""
