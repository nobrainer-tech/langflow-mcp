# Langflow MCP website

Outcome: publish a Signature-branded repository landing page at https://nobrainer.tech/langflow-mcp/ with EN, PL, DE, zh-Hans, ES and FR versions, as confirmed by the owner.
Scope: website/ only; static HTML generated from one template and locale data, shared CSS/JS, canonical/hreflang, day/night, installation instructions, repository links.
Untouched: existing site routes, MCP runtime, local AGENTS.md/CLAUDE.md changes and .codex/.
Proof: deterministic generation, locale/link/content checks, local HTTP preview, public HTTP and SHA-256 readback of every deployed asset.
Recovery: additive directory deployment; back up an existing destination before updating it.

- [x] Inspect live Flow reference, brand contract, repository and server access.
- [x] Build six complete localized pages and shared assets.
- [x] Validate six locale objects, local links, wordmark, commands and hreflang; local HTTP preview returned 200.
- [x] Deploy through staging into the new /langflow-mcp/ directory; all six public routes return HTTP 200 and all ten public files match local bytes.

Follow-up delegated to existing Flow website task: add ES and FR to /flow. Brand task received six-language guidance and full product-path wordmark requirement.
