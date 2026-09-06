# Goal: all open PRs and issues

GOAL_ID: `01a027f4-bbcf-71c0-831e-6a439fc45bc6`
STATUS: ACTIVE
OWNER: MAIN
CHECKOUT: `/Volumes/1TB/MacMini/Github/langflow-mcp`

## Scope revision - 2026-09-06

Bieżący odczyt GitHub potwierdził, że `langflow-ai/langflow` ma już stabilne wydanie `v1.12.0` z 2026-09-01. Wcześniejszy audyt zakończony na `1.11.5` nie spełnia już kryterium najnowszego stabilnego API. Zakres obejmuje teraz audyt różnicy `1.11.5 -> 1.12.0`, ewentualną aktualizację pakietu do `4.12.x` oraz ponowną weryfikację release readiness.

## API audit - 2026-09-06

- Stable upstream release: Langflow `v1.12.0`, published `2026-09-01`.
- Static route comparison of the API source found 261 route decorators in `1.11.5` and 283 in `1.12.0`; 22 new route keys and none removed.
- New client-relevant capabilities: `/healthz`, headless `/agentic/assist/run`, `/models/provider-descriptors`, project `PUT /projects/{project_id}`, model-provider policy, catalog policy, and policy bundle endpoints.
- Existing assistant contract gained optional `history_limit`; existing workflow/A2A/public-build requests remain shape-compatible, while upstream security changes tighten server-side authorization and sanitization.
- `agentic/mcp` transport changes are Langflow-hosted MCP transport behavior, not a REST client method for this package.
- Target implementation: add the new client methods, validation, standard tools, consolidated governance/agentic actions, contract tests, API/version docs, and package bump to `4.12.0` targeting Langflow `1.12.0`.
- Sources: `https://github.com/langflow-ai/langflow/releases/tag/v1.12.0` and the `v1.12.0` source tree under `src/backend/base/langflow/api` plus `src/lfx/src/lfx`.

## Frozen implementation scope

- `src/types/index.ts`: request/response types for the new contracts and the public-flow capability response.
- `src/services/langflow-client.ts`: exact Langflow paths, verbs, query parameters, base URL overrides, and SSE response handling.
- `src/mcp/validation.ts`, `src/mcp/validation-consolidated.ts`: bounded request validation for all new actions.
- `src/mcp/tools.ts`, `src/mcp/server.ts`: 16 new standard tools and dispatch.
- `src/mcp/tools-consolidated.ts`, `src/mcp/server-consolidated.ts`: one governance meta-tool plus related system, model, project, and agentic actions.
- Existing contract/security tests plus new `langflow-client-112.test.ts` and `server-112-tools.test.ts`.
- `README.md`, `RELEASING.md`, `package.json`, `package-lock.json`: API/version/release metadata.
- Protected: `AGENTS.md`, `CLAUDE.md`, `.codex/`, credentials, and unrelated local state.

## Outcome

Doprowadzić publiczne repozytorium `nobrainer-tech/langflow-mcp` do zweryfikowanego, uporządkowanego stanu przez obsłużenie każdego otwartego PR-a i issue oraz potwierdzenie zgodności z najnowszym stabilnym Langflow API.

## Non-goals

- Nie mergować automatycznie każdej pozycji bez oceny wpływu, jakości i zakresu.
- Nie publikować npm, nie zmieniać sekretów ani poświadczeń i nie wykonywać innych nieodwracalnych operacji bez osobnej bramki właściciela.
- Nie usuwać ani nie nadpisywać lokalnych, niepowiązanych zmian, w tym `.codex/`.
- Nie zamykać zasadnych zgłoszeń tylko po to, żeby wyzerować listę.

## Expected files (PUBLIC_SURFACE)

- Bieżący stan GitHub: otwarte PR-y, issues, komentarze, checki i ewentualne konflikty.
- Kod, testy, konfiguracja CI/release i dokumentacja tylko w zakresie potwierdzonych zmian.
- `README.md`, `RELEASING.md` i informacje o wersji API, jeśli audyt wykaże drift.
- Tracker i raport decyzji w tym pliku.

## Proof

- Każdy otwarty PR i issue ma odczytaną decyzję: merge, poprawka, zamknięcie z uzasadnieniem albo jawny blocker.
- Dla zmian kodu: testy właściwe dla zakresu, typecheck/build oraz CI i review GitHub.
- Dla merge: odczyt zdalnego SHA i potwierdzenie, że wymagane wątki review są zamknięte.
- Dla API: aktualny primary-source release Langflow oraz lokalne porównanie kontraktów.
- Dla release: osobno potwierdzona gotowość i jawna bramka publikacji npm.

## Untouched

- Poświadczenia, sekrety, konta, dane produkcyjne i niepowiązane repozytoria.
- Nieśledzone `.codex/` oraz cudze lokalne zmiany.
- PR-y/issues poza repozytorium `nobrainer-tech/langflow-mcp`.

## Minimum solution

1. Zainwentaryzować wszystkie otwarte PR-y i issues oraz aktualny stan checkoutu.
2. Dla każdej pozycji przeczytać diff, kontekst, checki i historię; oddzielić działanie od szumu i ryzyka.
3. Wdrożyć tylko uzasadnione poprawki przez osobne gałęzie/PR-y, odpowiedzieć na review i zweryfikować merge.
4. Nieakcyjne, zduplikowane lub zablokowane pozycje opisać i zamknąć tylko z dowodem i adekwatnym uzasadnieniem.
5. Zrobić końcowy audyt API, release i stanu zdalnego.

## Test decision

EXISTING - używać istniejącego zestawu testów, typecheck/build, checków CI i odczytu GitHub; nowe testy tylko gdy konkretna zmiana ujawni niepokryty kontrakt.

## Done clean

Cel można zamknąć dopiero, gdy nie pozostanie nieobsłużony otwarty PR ani issue w tym repozytorium, każdy wyjątek będzie miał właściciela, blocker, dowód i następną akcję, a wynik API/release będzie rozdzielał lokalną gotowość od publikacji zewnętrznej.

## Progress

- [x] Cel utworzony w host-native goal store.
- [x] Tracker zapisany w repozytorium.
- [x] Wstępna inwentaryzacja: PR #155, #156, #157 oraz issue #104.
- [x] Ocena i merge PR #155, #156, #157 po review i zielonych checkach.
- [x] Audyt Langflow `1.11.5 -> 1.12.0`; wykryto nowe kontrakty wymagające implementacji.
- [x] Implementacja wsparcia Langflow `1.12.0` w kliencie, walidacji i obu trybach MCP; lokalne testy przechodzą.
- [x] Issue #104 obsłużone: skomentowane i zamknięte jako `not planned` jako oferta marketingowa poza zakresem inżynieryjnym.
- [ ] Końcowa weryfikacja API, CI, merge i release readiness.

### Dependency PR evidence

- PR #155 merged as `9704e1b`; axios `1.19.0 -> 1.20.0`; CI green.
- PR #157 merged as `5530058`; fast-uri `3.1.5 -> 3.1.7`; high advisory removed; CI green.
- PR #156 merged as `c1940be`; `@types/node` `26.2.0 -> 26.4.0`; CI green.
- Lockfile security follow-up: `qs` was updated to `6.16.0` with its required transitive helpers in the release branch; isolated npm audit now reports zero vulnerabilities.

## Detailed-ledger decision

YES - cel przekracza jedną sesję, obejmuje wiele niezależnych pozycji i może zawierać zewnętrzne bramki merge/release. Ten plik jest kanonicznym trackerem postępu; nie ma jeszcze potrzeby tworzenia workerów.
