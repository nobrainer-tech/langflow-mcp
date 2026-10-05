import assert from 'node:assert/strict';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { once } from 'node:events';
import { access, mkdtemp, readFile, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const root = fileURLToPath(new URL('../', import.meta.url));
const REQUEST_TIMEOUT_MS = 5_000;
const COMMAND_TIMEOUT_MS = 120_000;
const fixtureApiKey = 'package-smoke-fixture-api-key';
const fixtureHttpToken = 'package-smoke-fixture-http-token';
const versionFixture = { version: '1.12.4' };
const auditFilters = {
  actor_type: 'api_key',
  actor_id: '22345678-1234-4234-a234-123456789012',
  action: 'flow:write',
  result: 'owner_override',
  event: ['mutation', 'authorization_decision'],
  exclude_event: ['read', 'legacy event'],
  exclude_action: ['flow:read', 'share:create & role=editor'],
};
const auditFixture = {
  items: [{ actor_type: auditFilters.actor_type, actor_id: auditFilters.actor_id }],
  total: 1,
};
const queryFixtures = [
  {
    path: '/api/v1/models/enabled_providers',
    args: { providers: ['OpenAI', 'Provider & scope=configure + 日本語'], purpose: 'use' },
    standard: 'list_enabled_providers', consolidated: 'enabled_providers', tool: 'model',
  },
  {
    path: '/api/v1/models/enabled_models',
    args: { model_names: ['model-a', 'model & name=other + 日本語'], purpose: 'configure' },
    standard: 'list_enabled_models', consolidated: 'enabled_models', tool: 'model',
  },
  {
    path: '/api/v1/store/components/',
    args: { tags: ['rag', 'tag & category=private + 日本語'], search: 'chat & name=x' },
    standard: 'list_store_components', consolidated: 'list_store', tool: 'store',
  },
];
const interrupted = new AbortController();
const onInterrupt = () => interrupted.abort(new Error('Package smoke interrupted'));
process.once('SIGINT', onInterrupt);
process.once('SIGTERM', onInterrupt);

// Keep local credentials, proxy settings, NODE_OPTIONS and npm configuration out.
const baseEnv = Object.fromEntries(['PATH', 'SystemRoot', 'COMSPEC', 'PATHEXT']
  .filter((key) => process.env[key] !== undefined)
  .map((key) => [key, process.env[key]]));

async function deadline(promise, label, timeout = REQUEST_TIMEOUT_MS) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeout}ms`)), timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function stopChild(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  const stopped = once(child, 'close');
  child.kill('SIGTERM');
  try {
    await deadline(stopped, 'CLI shutdown', 2_000);
  } catch {
    child.kill('SIGKILL');
    await deadline(stopped, 'CLI forced shutdown', 2_000);
  }
}

function toolData(result) {
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, 'text');
  return JSON.parse(result.content[0].text);
}

async function main() {
  let tempDir;
  let mock;
  let mockFailure;
  const calls = { version: 0, audit: 0, listFilters: 0 };
  try {
    tempDir = await mkdtemp(join(tmpdir(), 'langflow-mcp-smoke-'));
    tempDir = await realpath(tempDir);
    console.log(`Smoke temp directory: ${tempDir}`);
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    const npmEnv = {
      ...baseEnv,
      NPM_CONFIG_CACHE: join(tempDir, 'npm-cache'),
      NPM_CONFIG_USERCONFIG: join(tempDir, 'user.npmrc'),
      NPM_CONFIG_GLOBALCONFIG: join(tempDir, 'global.npmrc'),
      NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org',
      NPM_CONFIG_UPDATE_NOTIFIER: 'false',
      NPM_CONFIG_FETCH_RETRIES: '0',
      NPM_CONFIG_FETCH_TIMEOUT: '15000',
    };
    const commandOptions = {
      cwd: root, env: npmEnv, timeout: COMMAND_TIMEOUT_MS, killSignal: 'SIGKILL',
      maxBuffer: 2 * 1024 * 1024, signal: interrupted.signal,
    };
    const packed = await execFile('npm', [
      'pack', '--json', '--pack-destination', tempDir, '--ignore-scripts',
    ], commandOptions);
    const packs = JSON.parse(packed.stdout);
    assert.equal(packs.length, 1, 'npm pack must produce exactly one tarball');
    const [pack] = packs;
    assert.equal(pack.name, pkg.name);
    assert.equal(pack.version, pkg.version);
    assert.equal(basename(pack.filename), pack.filename, 'Tarball must stay inside the smoke directory');
    assert.ok(pack.filename.endsWith('.tgz'));
    await execFile('npm', [
      'install', '--prefix', tempDir, '--ignore-scripts', '--omit=dev', '--no-audit', '--no-fund',
      join(tempDir, pack.filename),
    ], { ...commandOptions, cwd: tempDir });

    const packageRoot = join(tempDir, 'node_modules', pkg.name);
    const installed = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
    assert.equal(installed.name, pkg.name);
    assert.equal(installed.version, pkg.version);
    const cli = await realpath(join(tempDir, 'node_modules', '.bin', 'langflow-mcp-server'));
    assert.equal(cli, resolve(packageRoot, installed.bin['langflow-mcp-server']));
    // Resolve SDK clients from the installed tarball's dependency tree too.
    const require = createRequire(join(packageRoot, 'package.json'));
    const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
    const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

    mock = createServer((request, response) => {
      response.setHeader('Content-Type', 'application/json');
      try {
        assert.equal(request.method, 'GET');
        assert.equal(request.headers['x-api-key'], fixtureApiKey);
        const url = new URL(request.url, 'http://127.0.0.1');
        if (url.pathname === '/api/v1/version') {
          assert.equal(url.search, '');
          calls.version += 1;
          response.end(JSON.stringify(versionFixture));
        } else if (queryFixtures.some(fixture => fixture.path === url.pathname)) {
          const fixture = queryFixtures.find(fixture => fixture.path === url.pathname);
          assert.ok([...url.searchParams.keys()].every(key => !/[\[\]]/.test(key)),
            'List filters must use repeated keys, never bracket suffixes');
          assert.deepEqual([...new Set(url.searchParams.keys())].sort(), Object.keys(fixture.args).sort());
          for (const [key, value] of Object.entries(fixture.args)) {
            assert.deepEqual(url.searchParams.getAll(key), Array.isArray(value) ? value : [value], key);
          }
          calls.listFilters += 1;
          response.end(JSON.stringify({ filters: fixture.args }));
        } else {
          assert.equal(url.pathname, '/api/v1/authz/audit');
          assert.ok([...url.searchParams.keys()].every((key) => !/[\[\]]/.test(key)),
            'Audit filters must use repeated keys, never bracket suffixes');
          assert.deepEqual([...new Set(url.searchParams.keys())].sort(), Object.keys(auditFilters).sort());
          for (const [key, value] of Object.entries(auditFilters)) {
            assert.deepEqual(url.searchParams.getAll(key), Array.isArray(value) ? value : [value], key);
          }
          calls.audit += 1;
          response.end(JSON.stringify(auditFixture));
        }
      } catch (error) {
        mockFailure ??= error;
        response.statusCode = 500;
        response.end(JSON.stringify({ error: error.message }));
      }
    });
    mock.listen(0, '127.0.0.1');
    await deadline(once(mock, 'listening'), 'Mock Langflow startup');
    const mockUrl = `http://127.0.0.1:${mock.address().port}`;

    async function smoke(mode, consolidated) {
      const label = `${mode}/${consolidated ? 'consolidated' : 'standard'}`;
      const client = new Client({ name: 'package-smoke', version: pkg.version });
      const options = { timeout: REQUEST_TIMEOUT_MS, maxTotalTimeout: REQUEST_TIMEOUT_MS,
        signal: interrupted.signal };
      const env = {
        ...baseEnv,
        MCP_MODE: mode, LANGFLOW_CONSOLIDATED_TOOLS: String(consolidated),
        LANGFLOW_BASE_URL: mockUrl, LANGFLOW_API_KEY: fixtureApiKey,
        LANGFLOW_TIMEOUT: String(REQUEST_TIMEOUT_MS), ENABLE_DEPRECATED_TOOLS: 'true',
        HOST: '127.0.0.1', PORT: '0', AUTH_TOKEN: fixtureHttpToken, LOG_LEVEL: 'info',
      };
      let child;
      let transport;
      let diagnostics = '';
      const capture = (chunk) => { diagnostics = (diagnostics + chunk).slice(-4_000); };
      try {
        interrupted.signal.throwIfAborted();
        if (mode === 'stdio') {
          transport = new StdioClientTransport({ command: process.execPath, args: [cli],
            cwd: tempDir, env, stderr: 'pipe' });
          transport.stderr.on('data', capture);
        } else {
          child = spawn(process.execPath, [cli], { cwd: tempDir, env,
            stdio: ['ignore', 'ignore', 'pipe'] });
          const url = await deadline(new Promise((resolveUrl, reject) => {
            child.once('error', reject);
            child.once('exit', (code, signal) => reject(new Error(`CLI exited: ${code ?? signal}`)));
            child.stderr.on('data', (chunk) => {
              capture(chunk);
              const match = diagnostics.match(/Streamable HTTP at (127\.0\.0\.1:\d+\/mcp)/);
              if (match) resolveUrl(new URL(`http://${match[1]}`));
            });
          }), `${label} startup`);
          assert.notEqual(url.port, '0');
          transport = new StreamableHTTPClientTransport(url, {
            requestInit: { headers: { Authorization: `Bearer ${fixtureHttpToken}` }, redirect: 'error' },
            reconnectionOptions: { initialReconnectionDelay: 100, maxReconnectionDelay: 100,
              reconnectionDelayGrowFactor: 1, maxRetries: 0 },
          });
        }
        await deadline(client.connect(transport, options), `${label} handshake`);
        assert.equal(client.getServerVersion()?.name, 'langflow-mcp');
        assert.equal(client.getServerVersion()?.version, pkg.version, 'Handshake must report the package version');
        const { tools, nextCursor } = await client.listTools({}, options);
        assert.equal(nextCursor, undefined, 'Expected the complete tool list');
        assert.equal(tools.length, consolidated ? 29 : 236, 'Tool count must match README');
        assert.equal(new Set(tools.map((tool) => tool.name)).size, tools.length);
        await client.ping(options);
        const versionResult = await client.callTool(consolidated
          ? { name: 'system', arguments: { action: 'version' } }
          : { name: 'get_version', arguments: {} }, undefined, options);
        assert.ifError(mockFailure);
        assert.deepEqual(toolData(versionResult), versionFixture);
        const { action, ...filters } = auditFilters;
        const auditResult = await client.callTool(consolidated
          ? { name: 'authz', arguments: { action: 'audit', audit_action: action, ...filters } }
          : { name: 'get_authz_audit', arguments: auditFilters }, undefined, options);
        assert.ifError(mockFailure);
        assert.deepEqual(toolData(auditResult), auditFixture);
        for (const fixture of queryFixtures) {
          const result = await client.callTool(consolidated
            ? { name: fixture.tool, arguments: { action: fixture.consolidated, ...fixture.args } }
            : { name: fixture.standard, arguments: fixture.args }, undefined, options);
          assert.ifError(mockFailure);
          assert.deepEqual(toolData(result), { filters: fixture.args });
        }
        if (mode === 'http') {
          await deadline(transport.terminateSession(), `${label} session termination`);
        }
        console.log(`${label}: ${tools.length} tools, package ${pkg.version}, ping, Langflow 1.12.4, audit and list filters OK`);
      } catch (error) {
        throw new Error(`${label}: ${error.message}\n${diagnostics}`);
      } finally {
        try {
          await deadline(client.close(), `${label} client close`);
        } finally {
          try {
            await deadline(transport?.close(), `${label} transport close`);
          } finally {
            await stopChild(child);
          }
        }
      }
    }

    for (const mode of ['stdio', 'http']) {
      for (const consolidated of [false, true]) await smoke(mode, consolidated);
    }
    assert.ifError(mockFailure);
    assert.deepEqual(calls, { version: 4, audit: 4, listFilters: 12 });
  } finally {
    try {
      if (mock?.listening) {
        const closed = new Promise((resolveClose, reject) => mock.close((error) => error ? reject(error) : resolveClose()));
        mock.closeAllConnections();
        await deadline(closed, 'Mock Langflow shutdown');
      }
    } finally {
      if (tempDir) {
        await execFile('rm', ['-rf', '--', tempDir], {
          cwd: root, env: baseEnv, timeout: 30_000, killSignal: 'SIGKILL',
        });
        await assert.rejects(access(tempDir), { code: 'ENOENT' });
        console.log(`Removed smoke temp directory: ${tempDir}`);
      }
    }
  }
  console.log('Packaged MCP smoke passed (4 transport/mode combinations).');
}

main().catch((error) => {
  console.error(error.message.slice(-8_000));
  process.exitCode = 1;
}).finally(() => {
  process.removeListener('SIGINT', onInterrupt);
  process.removeListener('SIGTERM', onInterrupt);
});
