# LangFlow MCP Setup dla Claude Code

## Dwa podejścia do MCP z Langflow

Ten projekt oferuje **dwa różne MCP servery** do pracy z Langflow:

### 1. **Langflow Management MCP** ⭐ (ZALECANY DLA CIEBIE)
**Cel:** Tworzenie i zarządzanie flows programatycznie

📖 **Szczegóły:** [README_MANAGEMENT.md](README_MANAGEMENT.md)

**Co robi:**
- Tworzy nowe flows z poziomu Claude Desktop
- Edytuje istniejące flows
- Listuje wszystkie flows
- Usuwa flows
- Dodaje komponenty do flows

**Kiedy używać:**
- Chcesz tworzyć nowe flows przez konwersację z Claude
- Potrzebujesz automatyzacji tworzenia flows
- Chcesz zarządzać flows bez wchodzenia do UI

**Przykład:**
```
User: Stwórz nowy flow do analizy sentymentu
Claude: [tworzy flow] ✅ Utworzony flow "Sentiment Analyzer"!
```

### 2. **Wbudowany Langflow MCP**
**Cel:** Używanie gotowych flows jako narzędzi

📖 **Szczegóły poniżej**

**Co robi:**
- Każdy flow staje się narzędziem dla Claude
- Claude automatycznie wywołuje odpowiednie flows podczas konwersacji

**Kiedy używać:**
- Masz gotowe flows w Langflow
- Chcesz aby Claude używał Twoich flows jako narzędzi
- Np. flow do wyszukiwania w dokumentacji

**Przykład:**
```
User: Wyszukaj w dokumentacji...
Claude: [automatycznie używa flow "search_docs"]
```

---

## Langflow Management MCP (Zalecany)

**→ Zobacz [README_MANAGEMENT.md](README_MANAGEMENT.md) dla pełnej dokumentacji**

### Quick Start

```bash
# 1. Zainstaluj zależności
pip install -r requirements.txt

# 2. Dodaj do Claude Desktop config
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Wklej:
```json
{
  "mcpServers": {
    "langflow-manager": {
      "command": "python3",
      "args": ["/Users/aras88/GitHub/LangFlow/langflow_mcp_server.py"],
      "env": {
        "LANGFLOW_API_KEY": "sk-LpN17IPEE-rhjYFOHXStcyWLIGLzpExnM_bRbk3EFDs",
        "LANGFLOW_BASE_URL": "https://kevin119-40173.wykr.es"
      }
    }
  }
}
```

```bash
# 3. Restart Claude Desktop
pkill -9 "Claude" && open -a Claude
```

Gotowe! Możesz teraz tworzyć flows przez konwersację.

---

## Wbudowany Langflow MCP (Do używania gotowych flows)

Langflow ma **wbudowaną obsługę MCP (Model Context Protocol)**. Każdy projekt w Langflow automatycznie działa jako MCP server, gdzie każdy flow staje się dostępnym narzędziem (tool) dla klientów MCP, takich jak Claude Desktop czy Cursor.

## Wymagania

1. **Instancja Langflow**: `https://kevin119-40173.wykr.es`
2. **API Key**: Przechowywany w pliku `.env`
3. **mcp-proxy**: Narzędzie do łączenia z MCP serverami przez SSE (Server-Sent Events)

## Konfiguracja Claude Desktop

### Krok 1: Zainstaluj mcp-proxy

```bash
# Zainstaluj uvx (jeśli jeszcze nie masz)
pip install uv

# mcp-proxy zostanie automatycznie zainstalowany przez uvx przy pierwszym użyciu
```

### Krok 2: Uzyskaj PROJECT_ID z Langflow

1. Zaloguj się do Langflow: https://kevin119-40173.wykr.es
2. Przejdź do strony **Projects**
3. Kliknij na zakładkę **MCP Server** w swoim projekcie
4. Skopiuj **PROJECT_ID** z wygenerowanego kodu JSON

### Krok 3: Wygeneruj API Key (jeśli jeszcze nie masz)

1. W Langflow przejdź do **Settings** → **API Keys**
2. Kliknij **Generate API Key**
3. Skopiuj wygenerowany klucz

### Krok 4: Skonfiguruj Claude Desktop

Edytuj plik konfiguracyjny Claude Desktop:

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

Dodaj następującą konfigurację (zastąp `YOUR_PROJECT_ID` i `YOUR_API_KEY`):

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
        "LANGFLOW_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**Jeśli masz już inne MCP servery skonfigurowane**, dodaj wpis "langflow" obok istniejących:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "langflow": {
      "command": "uvx",
      "args": [
        "mcp-proxy",
        "https://kevin119-40173.wykr.es/api/v1/mcp/project/YOUR_PROJECT_ID/sse"
      ],
      "env": {
        "LANGFLOW_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### Krok 5: Zrestartuj Claude Desktop

```bash
# macOS - zamknij i uruchom ponownie
pkill -9 "Claude" && open -a Claude

# Windows/Linux - zamknij i uruchom aplikację ponownie
```

## Jak używać MCP w Langflow

### Konfiguracja Flow jako narzędzia MCP

1. W Langflow, każdy flow który ma komponent **Chat Output** może być używany jako narzędzie MCP
2. Przejdź do **Projects** → **MCP Server**
3. Kliknij **Edit Tools**
4. Dla każdego flow ustaw:
   - **Tool name**: Jasna nazwa (np. "analyze_data", "search_documents")
   - **Tool description**: Szczegółowy opis co robi flow

**Przykład:**
- **Tool name**: `search_company_docs`
- **Description**: `Searches internal company documentation for relevant information about policies, procedures, and technical guides. Returns the most relevant excerpts.`

### Dobre praktyki dla nazw i opisów

- Używaj snake_case dla nazw narzędzi
- Opisy powinny wyjaśniać "co" robi narzędzie i "kiedy" go użyć
- MCP klienci (jak Claude) używają tych opisów do automatycznego wyboru odpowiednich narzędzi

## Testowanie połączenia

Po skonfigurowaniu, w Claude Desktop możesz przetestować połączenie:

```
Jakie narzędzia Langflow są dostępne?
```

Claude powinien pokazać listę dostępnych flows jako narzędzi.

## Troubleshooting

### Error: "uvx: command not found"

**Rozwiązanie:**
```bash
pip install uv
```

### Error: "Connection refused" lub "401 Unauthorized"

**Przyczyna**: Nieprawidłowy API key

**Rozwiązanie:**
1. Wygeneruj nowy API key w Langflow
2. Zaktualizuj konfigurację w `claude_desktop_config.json`
3. Zrestartuj Claude Desktop

### MCP Server nie pojawia się w Claude Desktop

**Przyczyna**: Błąd w składni JSON

**Rozwiązanie:**
1. Sprawdź poprawność JSON: https://jsonlint.com/
2. Upewnij się, że wszystkie nawiasy i przecinki są na miejscu
3. Zrestartuj Claude Desktop

### Flows nie są widoczne jako tools

**Przyczyna**: Flow nie ma komponentu Chat Output

**Rozwiązanie:**
1. Dodaj komponent **Chat Output** do flow
2. Ustaw nazwę i opis w zakładce **MCP Server** → **Edit Tools**

## Przykładowe użycie

Po skonfigurowaniu możesz korzystać z flows w conversacji z Claude:

```
User: Wyszukaj dokumentację na temat procesów HR
Claude: [Automatycznie wywołuje flow search_company_docs z Langflow]
Claude: Znalazłem następujące informacje o procesach HR...
```

## Dodatkowe zasoby

- [Oficjalna dokumentacja Langflow MCP](https://docs.langflow.org/mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Langflow API Reference](https://docs.langflow.org/api)

## Bezpieczeństwo

- **NIGDY** nie commituj pliku `.env` do repozytorium Git
- API key jest dodany do `.gitignore`
- Jeśli API key wycieknie, natychmiast wygeneruj nowy w Langflow

## Wsparcie

W razie problemów sprawdź:
1. Logi Claude Desktop (Help → View Logs)
2. Status instancji Langflow: https://kevin119-40173.wykr.es/health
3. Dokumentację Langflow: https://docs.langflow.org
