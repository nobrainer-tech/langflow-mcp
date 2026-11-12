# langflow-mcp

`langflow-mcp-server` (npm, MIT) lets Claude Code, Codex, Claude Desktop, Cursor and any MCP client build, run and administer Langflow flows: 236 typed Langflow API operations plus `get_api_schema` and the guarded `request_api` for any other endpoint, over stdio or Streamable HTTP.

## Who it serves and what success means

- **User:** a developer or team that runs Langflow and drives it from a coding agent. They need the agent to work with the Langflow version they run, without breaking when Langflow updates, and without filling the agent's context.
- **Commercial role:** the package is free. Its job for NoBrainer.Tech is trust and reach among AI engineers. The README section "From the makers" leads them to NoBrainer.Tech Flow and the paid AI Engineering path. Keep that section and its `utm_campaign=langflow-mcp` links.
- **Numbers, reported separately with their source:**
  - npm downloads per week: api.npmjs.org. There were 1,302 on 2026-11-05..11.
  - GitHub stars: there were 10 on 2026-11-12.
  - Visits to nobrainer.tech/flow with `utm_campaign=langflow-mcp`: GA4.
- **What wins users here:**
  - Support for a new Langflow release within a day. For example, 1.13.2 shipped on 2026-11-10 and `4.13.4` supported it on 2026-11-11.
  - Releases that never break an install.
  - A small default context (discovery mode advertises 3 tools).
  - Evidence a user can check: tests, npm provenance, a PR that states what was not verified.
- **Priority:** a broken install, a contract break, an outdated Langflow target or a credential leak comes before any new feature.
- **README:** its first screen is the storefront. Write every README sentence for that user: the result first, with proof next to each claim.

## Ownership

You are the owner and long-term maintainer of this codebase, and its design is up to you. Before you report, review the diff, not your own summary.

The public contract is: MCP tool names and input schemas, resource URIs, environment variables, CLI behavior and documented responses. Engineering rule 1 below applies to internal code only. Change the public contract only with the owner's approval and the matching version bump.

## Commands

```bash
npm ci
npm run build                                   # tsc to dist/; the smoke test needs it
npm run typecheck
npx vitest run [path]                           # unit, contract and wire tests in src/__tests__
node scripts/smoke-package.mjs                  # packs the tarball; stdio and HTTP x 3 tool modes
node --test scripts/publish-release.node-test.mjs
npm audit
node .github/scripts/check-langflow-release.mjs # supported vs latest Langflow
npm run dev:http                                # HTTP server with reload (MCP_MODE=http)
```

## Architecture

- `src/mcp/index.ts`: the entry point.
  - `MCP_MODE=stdio|http` picks the transport.
  - `LANGFLOW_TOOL_MODE=discovery|standard|consolidated` picks the tool surface (`src/mcp/discovery.ts`, default `discovery`).
- `src/mcp/server.ts`: the standard and discovery modes. One `switch` maps each tool name to a client call. Tools hidden by `getAvailableTools()` are refused before dispatch.
- `src/mcp/tools.ts`: the 238 tool definitions.
- `src/mcp/validation.ts`: zod schemas for those tools.
- `src/mcp/discovery.ts`: `search_tools`, `get_tool_schema` and `call_tool`.
- `src/mcp/server-consolidated.ts`, `tools-consolidated.ts` and `validation-consolidated.ts`: 29 grouped tools plus the 2 API tools, dispatched by `action`.
- `src/mcp/http.ts`: Streamable HTTP. Each session moves through `reserved -> open -> closing` in `setSessionPhase` only. It enforces the request and stream limits, bearer auth and the origin allow-list.
- `src/services/langflow-client.ts`: the axios client for `/api/v1` and `/api/v2`.
  - It has a lifetime abort signal, aborted on shutdown.
  - `handleError` sanitizes every error.
- `src/services/api-access.ts`: `get_api_schema` (it reads `/openapi.json`) and `request_api` (with path, header and redirect guards).
- `src/utils/logger.ts`: writes to stderr.
- `src/utils/timeout.ts`: the effective `LANGFLOW_TIMEOUT`.

## How to change things

- **A tool:**
  1. Add the client method in `langflow-client.ts`.
  2. Add the definition in `tools.ts`, the zod schema in `validation.ts` and the `case` in `server.ts`. Tool names and cases stay one to one (238 = 238).
  3. Add the matching action in the three consolidated files.
  4. Test the request shape on the wire (a local `node:http` server, as in `src/__tests__/services/*-wire.test.ts`) or with `axios-mock-adapter`.
- **A Langflow upgrade:**
  1. Compare `vOLD...vNEW` in `langflow-ai/langflow` against the endpoints the client calls.
  2. Update the README "API Compatibility" paragraph. Keep the phrase `targets Langflow API version **X.Y.Z**`, because the weekly API watch parses it.
  3. Update the `package.json` description and the version fixtures in `scripts/smoke-package.mjs`, `src/__tests__/mcp/discovery.test.ts` and `src/__tests__/services/api-access.test.ts`.
  4. Bump the version.
- **Stdout belongs to the stdio JSON-RPC stream.** Log through `logger` only. A `console.log` in `src/` breaks stdio clients.
- **Errors and logs never carry credentials.** Send errors through `handleError`, which replaces streams with `[stream]` and redacts known secret keys. A stream error once leaked the `x-api-key` header; it was fixed in 4.13.3.

## Releases

- **Versioning:** npm `4.<langflow_minor>.<patch>` targets Langflow `1.<langflow_minor>.x`.
- **Publishing:** publish only by pushing a `v*` tag that matches `package.json` on `master`. The tag runs `.github/workflows/publish.yml`, which uses npm trusted publishing, has no npm token and waits up to 10 minutes for registry readback. Never move a tag.
- **Recovery:** re-run the failed job on the same tag. Do not publish again.
- **Afterwards, verify:** `npm view langflow-mcp-server@X version gitHead dist.attestations.provenance.predicateType`, then `dist-tags.latest`, the GitHub Release and CI on `master`.
- **API watch:** `.github/workflows/langflow-api-watch.yml` runs every Monday. It opens one issue per new Langflow release with the workflow `GITHUB_TOKEN`.
- **Codex:** `AGENTS.md` serves Codex sessions. Keep its release facts in line with this file.

## Approvals

These need no approval:
- work branches and pushing them;
- PRs;
- issues;
- review replies;
- re-running a failed CI or publish job on the same tag.

Ask the owner before you:
- merge to `master` (branch protection requires a review, so a merge needs an admin override);
- push a `v*` tag (it publishes to npm);
- change the public contract above;
- delete a remote branch or tag that is not your own merged work branch.

<!-- ENG-RULES:START -->
## Engineering rules

The waste in AI-written code is not wrong code — it is too much code. Left alone,
an agent pulls in three dependencies and five layers of abstraction for something
the standard library does in ten lines; asked to fix it, it writes two hundred
more. These rules exist to stop that before the first line is written: don't
write what needn't be written, reuse what can be reused, don't complicate what
can stay simple.

1. **Do not preserve backward compatibility.** Delete what is obsolete. No
   compatibility layers, no migrations, no leftover fallbacks.
2. **Choose the simplest implementation that meets the current requirement.**
   No pre-emptive abstraction, no configuration layer nobody asked for.
3. **Grow the system in layers.** Get a minimal end-to-end version working
   first, then add on top of it. Never tear down something that works for the
   sake of unfinished complexity.
4. **Keep components modular and concerns separated.**
5. **Prefer mature, maintained libraries.** Do not rewrite one yourself without
   a clear reason.
6. **Check what the project's existing dependencies already do** before adding a
   package or writing your own. Do not assume a library lacks a capability —
   read its docs and types first.
7. **Make architectural decisions for the long term.** Do not accept a "this way
   for now, we'll swap it later" stopgap.
8. **Look at how mature products solve the same problem.** Use proven patterns
   instead of inventing from zero.

**Exception to rule 1 — anything holding state or money.** A service on a cron
touching a live account, a repo mid-migration, an API with external consumers:
there, deleting an "obsolete" path is an incident, not a cleanup. Rule 1 applies
only behind a test that covers the path being removed.
<!-- ENG-RULES:END -->
