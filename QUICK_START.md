# Quick Start - Langflow MCP dla Claude Desktop

## TL;DR

Langflow ma **wbudowany MCP server**. Każdy flow w Twoim projekcie automatycznie staje się narzędziem dostępnym w Claude Desktop.

## Co musisz zrobić (3 kroki):

### 1. Zainstaluj uvx (jeśli nie masz)
```bash
pip install uv
```

### 2. Uzyskaj PROJECT_ID

1. Otwórz: https://kevin119-40173.wykr.es
2. Zaloguj się
3. Idź do **Projects** → **MCP Server** tab
4. Skopiuj **PROJECT_ID** z JSON snippet

### 3. Dodaj do Claude Desktop config

**macOS:**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Wklej (zamień YOUR_PROJECT_ID):**
```json
{
  "mcpServers": {
    "langflow": {
      "command": "uvx",
      "args": [
        "mcp-proxy",
        "https://kevin119-40173.wykr.es/api/v1/mcp/project/YOUR_PROJECT_ID/sse"
      ],
      "env": {
        "LANGFLOW_API_KEY": "sk-LpN17IPEE-rhjYFOHXStcyWLIGLzpExnM_bRbk3EFDs"
      }
    }
  }
}
```

**Zrestartuj Claude Desktop:**
```bash
pkill -9 "Claude" && open -a Claude
```

## Gotowe!

Twoje flows z Langflow są teraz dostępne jako narzędzia w Claude Desktop.

## Jak używać?

Po prostu rozmawiaj z Claude normalnie. Claude automatycznie wybierze odpowiednie narzędzie gdy będzie potrzebne.

**Przykład:**
- Ty: "Przeanalizuj ten dokument..."
- Claude: [automatycznie użyje odpowiedniego flow z Langflow]

## Konfiguracja flows jako tools

W Langflow:
1. Każdy flow musi mieć komponent **Chat Output**
2. Ustaw nazwę i opis w **Projects** → **MCP Server** → **Edit Tools**
3. Używaj jasnych nazw i szczegółowych opisów

## Potrzebujesz pomocy?

Zobacz pełną dokumentację w `README.md`
