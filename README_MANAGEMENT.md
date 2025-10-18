# Langflow Management MCP Server

## Opis

Ten MCP server umożliwia **tworzenie i zarządzanie flows w Langflow** bezpośrednio z Claude Desktop. Możesz tworzyć nowe flows, edytować istniejące, dodawać komponenty i wiele więcej - wszystko przez konwersację z Claude.

## Czym różni się od standardowego MCP?

| Funkcja | Standardowy Langflow MCP | Ten MCP Server |
|---------|-------------------------|----------------|
| **Cel** | Używanie gotowych flows jako narzędzi | **Tworzenie i zarządzanie flows** |
| **Przypadek użycia** | Claude wywołuje Twoje flows podczas konwersacji | Claude **tworzy** nowe flows na Twoje polecenie |
| **Przykład** | "Wyszukaj w dokumentacji" → Claude używa flow | "Stwórz flow do analizy danych" → Claude **tworzy nowy flow** |

## Instalacja

### 1. Zainstaluj wymagane pakiety

```bash
cd /Users/aras88/GitHub/LangFlow
pip install -r requirements.txt
```

### 2. Skonfiguruj zmienne środowiskowe

Plik `.env` już zawiera:
```bash
LANGFLOW_API_KEY=sk-LpN17IPEE-rhjYFOHXStcyWLIGLzpExnM_bRbk3EFDs
LANGFLOW_BASE_URL=https://kevin119-40173.wykr.es
```

### 3. Dodaj do Claude Desktop

**macOS:**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Dodaj następującą konfigurację:

```json
{
  "mcpServers": {
    "langflow-manager": {
      "command": "python3",
      "args": [
        "/Users/aras88/GitHub/LangFlow/langflow_mcp_server.py"
      ],
      "env": {
        "LANGFLOW_API_KEY": "sk-LpN17IPEE-rhjYFOHXStcyWLIGLzpExnM_bRbk3EFDs",
        "LANGFLOW_BASE_URL": "https://kevin119-40173.wykr.es"
      }
    }
  }
}
```

**Jeśli masz już inne MCP servery**, dodaj obok:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "langflow-manager": {
      "command": "python3",
      "args": [
        "/Users/aras88/GitHub/LangFlow/langflow_mcp_server.py"
      ],
      "env": {
        "LANGFLOW_API_KEY": "sk-LpN17IPEE-rhjYFOHXStcyWLIGLzpExnM_bRbk3EFDs",
        "LANGFLOW_BASE_URL": "https://kevin119-40173.wykr.es"
      }
    }
  }
}
```

### 4. Zrestartuj Claude Desktop

```bash
pkill -9 "Claude" && open -a Claude
```

## Dostępne narzędzia

MCP server oferuje następujące narzędzia:

### 1. `create_flow`
Tworzy nowy flow w Langflow.

**Przykład użycia w Claude Desktop:**
```
Stwórz nowy flow o nazwie "Customer Support Bot" z opisem "Automatyczny bot do obsługi klienta"
```

**Parametry:**
- `name` (wymagane): Nazwa flow
- `description`: Opis flow
- `folder_id`: ID folderu
- `data`: Pełna struktura flow (nodes + edges)

### 2. `list_flows`
Wyświetla listę wszystkich flows.

**Przykład:**
```
Pokaż mi wszystkie moje flows
```

**Parametry:**
- `folder_id`: Filtruj po folderze
- `limit`: Maksymalna liczba wyników (domyślnie 50)

### 3. `get_flow`
Pobiera szczegóły konkretnego flow.

**Przykład:**
```
Pokaż szczegóły flow o ID xxx-xxx-xxx
```

**Parametry:**
- `flow_id` (wymagane): ID flow

### 4. `update_flow`
Aktualizuje istniejący flow.

**Przykład:**
```
Zmień nazwę flow xxx-xxx-xxx na "New Name" i włącz MCP
```

**Parametry:**
- `flow_id` (wymagane): ID flow
- `name`: Nowa nazwa
- `description`: Nowy opis
- `data`: Nowe dane flow
- `mcp_enabled`: Włącz/wyłącz jako narzędzie MCP

### 5. `delete_flow`
Usuwa flow.

**Przykład:**
```
Usuń flow o ID xxx-xxx-xxx
```

**Parametry:**
- `flow_id` (wymagane): ID flow

### 6. `get_components_list`
Wyświetla listę dostępnych komponentów.

**Przykład:**
```
Jakie komponenty są dostępne w Langflow?
```

### 7. `create_simple_chat_flow`
Helper do szybkiego stworzenia pustego flow.

**Przykład:**
```
Stwórz prosty chat flow o nazwie "FAQ Bot"
```

**Parametry:**
- `name` (wymagane): Nazwa flow
- `description`: Opis

## Przykładowe scenariusze

### Scenariusz 1: Tworzenie nowego flow

```
User: Stwórz nowy flow do analizy sentymentu komentarzy klientów

Claude: [wywołuje create_flow]
Claude: ✅ Utworzyłem nowy flow "Customer Sentiment Analysis"!
ID: abc-123-def
URL: https://kevin119-40173.wykr.es/flow/abc-123-def

Możesz teraz edytować ten flow w UI i dodać komponenty.
```

### Scenariusz 2: Listowanie flows

```
User: Pokaż mi wszystkie moje flows

Claude: [wywołuje list_flows]
Claude: 📋 Masz następujące flows:

1. Customer Support Bot (ID: xxx-xxx)
   - Opis: Automatyczny bot do obsługi klienta
   - MCP Enabled: ✓

2. Data Analyzer (ID: yyy-yyy)
   - Opis: Analiza danych sprzedażowych
   - MCP Enabled: ✗

3. ...
```

### Scenariusz 3: Aktualizacja flow

```
User: Włącz MCP dla flow "Data Analyzer"

Claude: Najpierw znajdę ID tego flow...
[wywołuje list_flows]
Claude: Znalazłem flow "Data Analyzer" (ID: yyy-yyy)
[wywołuje update_flow z mcp_enabled=true]
Claude: ✅ Flow zaktualizowany! MCP jest teraz włączony.
```

## Struktura Flow Data

Kiedy tworzysz lub aktualizujesz flow, możesz podać obiekt `data` zawierający:

```python
{
  "nodes": [
    {
      "id": "ChatInput-1",
      "type": "ChatInput",
      "position": {"x": 100, "y": 100},
      "data": {
        # Konfiguracja komponentu
      }
    },
    {
      "id": "OpenAI-1",
      "type": "OpenAIModel",
      "position": {"x": 300, "y": 100},
      "data": {
        # Konfiguracja modelu
      }
    },
    {
      "id": "ChatOutput-1",
      "type": "ChatOutput",
      "position": {"x": 500, "y": 100},
      "data": {}
    }
  ],
  "edges": [
    {
      "source": "ChatInput-1",
      "target": "OpenAI-1",
      "sourceHandle": "output",
      "targetHandle": "input"
    },
    {
      "source": "OpenAI-1",
      "target": "ChatOutput-1",
      "sourceHandle": "output",
      "targetHandle": "input"
    }
  ]
}
```

**Uwaga:** Najprostszym sposobem jest:
1. Stwórz pusty flow przez MCP
2. Edytuj go w Langflow UI
3. Lub skopiuj strukturę `data` z istniejącego flow (`get_flow`) i zmodyfikuj

## Troubleshooting

### Error: "LANGFLOW_API_KEY nie jest ustawiony"

**Rozwiązanie:**
Upewnij się, że plik `.env` zawiera:
```bash
LANGFLOW_API_KEY=sk-LpN17IPEE-rhjYFOHXStcyWLIGLzpExnM_bRbk3EFDs
LANGFLOW_BASE_URL=https://kevin119-40173.wykr.es
```

### Error: "ModuleNotFoundError: No module named 'mcp'"

**Rozwiązanie:**
```bash
pip install -r requirements.txt
```

### MCP server nie pojawia się w Claude Desktop

**Rozwiązanie:**
1. Sprawdź składnię JSON w `claude_desktop_config.json`
2. Upewnij się, że ścieżka do `langflow_mcp_server.py` jest poprawna
3. Zrestartuj Claude Desktop

### Błąd 401 Unauthorized

**Rozwiązanie:**
API key jest nieprawidłowy. Wygeneruj nowy w Langflow:
1. https://kevin119-40173.wykr.es/settings/api-keys
2. Zaktualizuj `.env`

## Zaawansowane użycie

### Tworzenie flow z komponentami programatycznie

Możesz użyć Claude do wygenerowania pełnej struktury flow:

```
User: Stwórz flow z komponentami ChatInput, OpenAI (model gpt-4) i ChatOutput.
Nazwij go "GPT-4 Assistant".

Claude: [generuje odpowiednią strukturę data]
[wywołuje create_flow z pełnymi danymi]
Claude: ✅ Flow "GPT-4 Assistant" utworzony ze wszystkimi komponentami!
```

### Klonowanie flows

```
User: Skopiuj flow "Customer Support Bot" jako "VIP Support Bot"

Claude: [wywołuje get_flow dla "Customer Support Bot"]
[wywołuje create_flow z tą samą strukturą ale nową nazwą]
Claude: ✅ Flow sklonowany pomyślnie!
```

## Dodatkowe zasoby

- [Langflow API Documentation](https://docs.langflow.org/api)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Twoja instancja Langflow](https://kevin119-40173.wykr.es)
