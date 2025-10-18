# Przykłady użycia Langflow MCP

## Przegląd

Po skonfigurowaniu MCP, Claude Desktop może automatycznie wywoływać Twoje flows z Langflow jako narzędzia podczas konwersacji.

## Jak to działa?

1. **Tworzysz flow w Langflow** z komponentem Chat Output
2. **Nadajesz mu nazwę i opis** w zakładce MCP Server
3. **Claude automatycznie wybiera** odpowiedni flow na podstawie kontekstu konwersacji

## Przykładowe scenariusze

### Przykład 1: Wyszukiwanie dokumentacji

**Flow w Langflow:**
- Nazwa: `search_documentation`
- Opis: "Searches internal documentation for information about company policies, procedures, and technical guides"
- Komponenty: Vector Store + Chat Output

**Użycie w Claude Desktop:**
```
User: Jaka jest nasza polityka urlopowa?
Claude: [automatycznie wywołuje flow search_documentation]
Claude: Zgodnie z dokumentacją, polityka urlopowa obejmuje...
```

### Przykład 2: Analiza danych

**Flow w Langflow:**
- Nazwa: `analyze_sales_data`
- Opis: "Analyzes sales data and provides insights on trends, patterns, and anomalies"
- Komponenty: Data Loader + Python + Chart Generator + Chat Output

**Użycie w Claude Desktop:**
```
User: Przeanalizuj sprzedaż z ostatniego kwartału
Claude: [automatycznie wywołuje flow analyze_sales_data]
Claude: Oto analiza sprzedaży Q4:
- Wzrost o 15% w porównaniu do Q3
- Najlepszy produkt: X
- [wykres]
```

### Przykład 3: Generowanie raportów

**Flow w Langflow:**
- Nazwa: `generate_weekly_report`
- Opis: "Generates comprehensive weekly reports with metrics, highlights, and action items"
- Komponenty: Database Query + Template + PDF Generator + Chat Output

**Użycie w Claude Desktop:**
```
User: Wygeneruj raport tygodniowy
Claude: [automatycznie wywołuje flow generate_weekly_report]
Claude: Raport tygodniowy został wygenerowany. Oto kluczowe punkty:
1. Metryki...
2. Najważniejsze wydarzenia...
```

### Przykład 4: Chatbot z kontekstem

**Flow w Langflow:**
- Nazwa: `customer_support_bot`
- Opis: "Answers customer questions using company knowledge base and previous conversations"
- Komponenty: RAG (Retrieval-Augmented Generation) + Memory + Chat Output

**Użycie w Claude Desktop:**
```
User: Klient pyta o status zamówienia #12345
Claude: [automatycznie wywołuje flow customer_support_bot]
Claude: Zamówienie #12345 jest obecnie w trakcie pakowania...
```

### Przykład 5: Tłumaczenie i lokalizacja

**Flow w Langflow:**
- Nazwa: `translate_content`
- Opis: "Translates content to multiple languages while preserving context and tone"
- Komponenty: Translation API + Context Analyzer + Chat Output

**Użycie w Claude Desktop:**
```
User: Przetłumacz tę treść na angielski i niemiecki
Claude: [automatycznie wywołuje flow translate_content]
Claude: Oto tłumaczenia:
English: ...
Deutsch: ...
```

## Dobre praktyki

### 1. Jasne nazwy narzędzi

❌ **Źle:**
```
nazwa: "flow1"
opis: "robi rzeczy"
```

✅ **Dobrze:**
```
nazwa: "search_customer_tickets"
opis: "Searches customer support tickets by keywords, date range, or ticket status. Returns relevant tickets with summaries."
```

### 2. Szczegółowe opisy

Opisy powinny odpowiadać na pytania:
- **Co** robi narzędzie?
- **Kiedy** powinno być użyte?
- **Jakie** dane zwraca?

**Przykład:**
```
nazwa: "analyze_code_quality"
opis: "Analyzes code quality metrics including complexity, test coverage, and potential bugs. Use this when reviewing code changes or assessing technical debt. Returns detailed report with recommendations."
```

### 3. Komponent Chat Output jest wymagany

Każdy flow używany jako narzędzie MCP **MUSI** mieć komponent Chat Output. To on zwraca wynik do Claude.

### 4. Testowanie flows

Przed użyciem w MCP, przetestuj flow w Langflow UI aby upewnić się, że działa poprawnie.

## Testowanie MCP w Claude Desktop

Po skonfigurowaniu możesz przetestować połączenie:

```
User: Jakie narzędzia Langflow są dostępne?
Claude: Dostępne są następujące narzędzia z Langflow:
1. search_documentation - Wyszukiwanie w dokumentacji
2. analyze_sales_data - Analiza danych sprzedażowych
3. ...
```

Lub przetestuj konkretne narzędzie:

```
User: Czy możesz użyć narzędzia search_documentation do znalezienia informacji o procesie onboardingu?
Claude: [wywołuje flow i zwraca wynik]
```

## Debugowanie

### Sprawdzanie logów Claude Desktop

**macOS:**
```bash
# Logi Claude Desktop
tail -f ~/Library/Logs/Claude/mcp*.log
```

### Testowanie flow bezpośrednio

Zamiast przez Claude Desktop, możesz przetestować flow bezpośrednio w Langflow:
1. Otwórz flow w Langflow UI
2. Kliknij "Run"
3. Sprawdź output

### MCP Inspector

Langflow oferuje MCP Inspector do debugowania:
1. W Langflow przejdź do **Projects** → **MCP Server**
2. Kliknij **Use MCP Inspector**
3. Testujflows interaktywnie

## Zaawansowane przypadki użycia

### Łączenie wielu flows

Claude może automatycznie łączyć wyniki z różnych flows:

```
User: Znajdź wszystkie otwarte zgłoszenia klientów z ostatniego tygodnia i wygeneruj raport
Claude:
1. [wywołuje flow: search_customer_tickets]
2. [wywołuje flow: generate_weekly_report z wynikami z kroku 1]
Claude: Oto raport z otwartymi zgłoszeniami...
```

### Flows z parametrami

Claude automatycznie przekazuje kontekst jako parametry:

```
User: Wyszukaj dokumentację dla frameworka "React"
Claude: [wywołuje search_documentation z parametrem query="React"]
```

## Pytania i odpowiedzi

**Q: Czy muszę ręcznie wywoływać flows?**
A: Nie! Claude automatycznie wybiera i wywołuje odpowiednie flows na podstawie kontekstu.

**Q: Ile flows mogę mieć?**
A: Bez limitu. Wszystkie flows z komponentem Chat Output w projekcie są dostępne.

**Q: Czy mogę mieć wiele projektów jako MCP servery?**
A: Tak! Dodaj osobny wpis dla każdego projektu w konfiguracji Claude Desktop.

**Q: Jak zaktualizować flow?**
A: Po zmianie flow w Langflow, zmiany są automatycznie dostępne. Nie trzeba restartować Claude Desktop.

## Dodatkowe zasoby

- [Langflow Documentation](https://docs.langflow.org)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Twoja instancja Langflow](https://kevin119-40173.wykr.es)
