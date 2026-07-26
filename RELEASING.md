# Releasing

## Versioning

The npm package version tracks the supported Langflow API version:
npm `4.<langflow_minor>.<patch>` targets Langflow API `1.<langflow_minor>.x`.
Langflow API 1.11.0 is therefore covered by `langflow-mcp-server@4.11.x`.

## Cutting a release

1. Land the changes on `master` (version already bumped in `package.json`).
2. Push the matching tag:

   ```bash
   git tag v4.11.0
   git push origin v4.11.0
   ```

`.github/workflows/publish.yml` runs on every `v*` tag: install, test, build,
publish to npm, then create the GitHub Release. No manual npm step, no
credentials to enter.

## npm authentication: trusted publishing (OIDC)

The workflow holds **no npm token**. It authenticates with npm through GitHub's
OIDC provider: GitHub Actions mints a short-lived id-token, npm verifies it
against a trusted publisher registered on the package, and the publish proceeds.
Nothing to rotate, nothing that expires, and no one-time password is ever
requested — which is why token-based publishing failed with `EOTP` under 2FA.

Workflow-side requirements (already in place):

- `permissions: id-token: write` on the publish job
- npm CLI >= 11.5.1 (`npm install -g npm@11.18.0`)
- Node.js >= 22.14.0 (`node-version: '22.x'`)
- `npm publish --access public` with no `NODE_AUTH_TOKEN`
  (`--provenance` is implicit for trusted publishing)

### One-time npm-side configuration

Done once per package by an npm account with write access, at
https://www.npmjs.com/package/langflow-mcp-server/access -> **Trusted Publisher**:

| Field | Value |
| --- | --- |
| Publisher | GitHub Actions |
| Organization or user | `nobrainer-tech` |
| Repository | `langflow-mcp` |
| Workflow filename | `publish.yml` |
| Environment name | *(empty)* |
| Permissions | `Allow npm publish` |

All four identity fields must match the repository exactly. npm compares them
against the OIDC token claims, so a single wrong character — a truncated
organization name, a renamed workflow file, a stray environment — makes npm
reject the publish even though the workflow itself is correct.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `npm error code EOTP` | Publishing with a token instead of OIDC; the account enforces 2FA on writes. Confirm the workflow does not set `NODE_AUTH_TOKEN`. |
| npm rejects the OIDC token | Trusted publisher fields do not match the repository, or the tag was pushed to a fork. |
| `EPUBLISHCONFLICT` | That version already exists on npm; bump `package.json` and tag again. |
| Publish step skipped entirely | The tag does not start with `v`. |
