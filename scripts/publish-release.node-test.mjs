import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { publishRelease } from './publish-release.mjs';

const VERSION = '4.13.0';
const SHA = 'a'.repeat(40);
const REGISTRY = 'https://registry.npmjs.org';
const REGISTRY_URL = `${REGISTRY}/langflow-mcp-server/${VERSION}`;

function metadata(overrides = {}) {
  return {
    name: 'langflow-mcp-server',
    version: VERSION,
    gitHead: SHA,
    dist: { attestations: { url: `${REGISTRY}/-/npm/v1/attestations/langflow-mcp-server@${VERSION}` } },
    ...overrides,
  };
}

function response(status, body = metadata()) {
  return new Response(JSON.stringify(body), { status });
}

function fixture(responses, overrides = {}) {
  const files = {
    'package.json': { name: 'langflow-mcp-server', version: VERSION },
    'package-lock.json': {
      name: 'langflow-mcp-server',
      version: VERSION,
      packages: { '': { name: 'langflow-mcp-server', version: VERSION } },
    },
  };
  const commands = [];
  const requests = [];
  const waits = [];
  const options = {
    version: VERSION,
    cwd: resolve('/release-fixture'),
    readFile(path, encoding) {
      assert.equal(encoding, 'utf8');
      assert.equal(path, resolve(options.cwd, basename(path)));
      assert.ok(Object.hasOwn(files, basename(path)));
      return JSON.stringify(files[basename(path)]);
    },
    execFile(command, args, settings) {
      commands.push({ command, args, settings });
      assert.equal(settings.cwd, options.cwd);
      assert.equal(settings.shell, false);
      assert.equal(settings.stdio, 'pipe');
      assert.ok(settings.timeout > 0 && settings.timeout <= 120_000);
      if (command === 'git') {
        assert.deepEqual(args, ['rev-parse', 'HEAD']);
        assert.equal(settings.encoding, 'utf8');
        return `${SHA}\n`;
      }
      assert.equal(command, 'npm');
      assert.deepEqual(args, ['publish', '--access', 'public', '--registry', REGISTRY]);
    },
    async fetch(url, settings) {
      requests.push({ url, settings });
      assert.equal(url, REGISTRY_URL);
      assert.equal(settings.cache, 'no-store');
      assert.equal(settings.redirect, 'error');
      assert.equal(settings.headers['Cache-Control'], 'no-cache');
      assert.ok(settings.signal instanceof AbortSignal);
      assert.equal(settings.signal.aborted, false);
      assert.ok(responses.length, 'Unexpected registry retry');
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next;
    },
    async sleep(ms) {
      waits.push(ms);
    },
    ...overrides,
  };
  return {
    options, files, commands, requests, waits,
    publishCount: () => commands.filter(({ command }) => command === 'npm').length,
  };
}

test('publishes an absent version once, then verifies a fresh public readback', async () => {
  const run = fixture([response(404), response(200)]);
  assert.deepEqual(await publishRelease(run.options), { version: VERSION, sha: SHA, published: true });
  assert.equal(run.publishCount(), 1);
  assert.equal(run.requests.length, 2);
  assert.notEqual(run.requests[0].settings.signal, run.requests[1].settings.signal);
  assert.deepEqual(run.waits, []);
});

test('a correct already-published release is idempotent on a workflow retry', async () => {
  const run = fixture([response(200), response(200)]);
  assert.deepEqual(await publishRelease(run.options), { version: VERSION, sha: SHA, published: false });
  assert.deepEqual(await publishRelease(run.options), { version: VERSION, sha: SHA, published: false });
  assert.equal(run.publishCount(), 0);
  assert.equal(run.requests.length, 2);
  assert.deepEqual(run.waits, []);
});

test('retries only post-publish 404 propagation, without publishing again', async () => {
  const run = fixture([response(404), response(404), response(404), response(200)]);
  assert.equal((await publishRelease(run.options)).published, true);
  assert.equal(run.publishCount(), 1);
  assert.equal(run.requests.length, 4);
  assert.deepEqual(run.waits, [1000, 1000]);
});

test('fails after three post-publish readbacks still return 404', async () => {
  const run = fixture([response(404), response(404), response(404), response(404)]);
  await assert.rejects(publishRelease(run.options), /missing after 3 readback attempts/);
  assert.equal(run.publishCount(), 1);
  assert.equal(run.requests.length, 4);
  assert.deepEqual(run.waits, [1000, 1000]);
});

for (const [label, body, error] of [
  ['different commit', metadata({ gitHead: 'b'.repeat(40) }), /different commit/],
  ['missing commit', metadata({ gitHead: undefined }), /different commit/],
  ['different version', metadata({ version: '4.12.0' }), /different version/],
  ['different package', metadata({ name: 'another-package' }), /different package/],
  ['missing provenance', metadata({ dist: {} }), /provenance/],
  ['empty provenance URL', metadata({ dist: { attestations: { url: '' } } }), /provenance/],
  ['non-string provenance URL', metadata({ dist: { attestations: { url: true } } }), /provenance/],
  ['invalid provenance URL', metadata({ dist: { attestations: { url: 'invalid' } } }), /provenance/],
  ['insecure provenance URL', metadata({ dist: { attestations: { url: 'http://example.org' } } }), /provenance/],
  ['null metadata', null, /different package/],
]) {
  test(`rejects an existing version with ${label} without publishing`, async () => {
    const run = fixture([response(200, body)]);
    await assert.rejects(publishRelease(run.options), error);
    assert.equal(run.publishCount(), 0);
    assert.equal(run.requests.length, 1);
    assert.deepEqual(run.waits, []);
  });
}

for (const status of [201, 302, 401, 403, 429, 500]) {
  test(`registry HTTP ${status} fails closed before publication`, async () => {
    const run = fixture([response(status)]);
    await assert.rejects(publishRelease(run.options), new RegExp(`HTTP ${status}`));
    assert.equal(run.publishCount(), 0);
    assert.equal(run.requests.length, 1);
    assert.deepEqual(run.waits, []);
  });
}

test('network and timeout errors fail closed and do not expose raw error data', async () => {
  for (const error of [new Error('private-auth-data'), new DOMException('private-auth-data', 'TimeoutError')]) {
    const run = fixture([error]);
    await assert.rejects(publishRelease(run.options), { message: 'npm registry request or JSON read failed' });
    assert.equal(run.publishCount(), 0);
    assert.equal(run.requests.length, 1);
  }
});

test('invalid registry JSON fails closed before publication', async () => {
  const run = fixture([new Response('private-auth-data', { status: 200 })]);
  await assert.rejects(publishRelease(run.options), { message: 'npm registry request or JSON read failed' });
  assert.equal(run.publishCount(), 0);
});

test('publish failure is sanitized and never retried or reported as success', async () => {
  const run = fixture([response(404)]);
  const execFile = run.options.execFile;
  run.options.execFile = (...args) => {
    const result = execFile(...args);
    if (args[0] === 'npm') throw new Error('private-auth-data');
    return result;
  };
  await assert.rejects(publishRelease(run.options), { message: 'npm publish failed; verify the public registry before retrying' });
  assert.equal(run.publishCount(), 1);
  assert.equal(run.requests.length, 1);
  assert.deepEqual(run.waits, []);
});

test('publish failure reports only the npm error code, not raw credential-bearing output', async () => {
  const run = fixture([response(404)]);
  const execFile = run.options.execFile;
  run.options.execFile = (...args) => {
    const result = execFile(...args);
    if (args[0] === 'npm') {
      const error = new Error('private-auth-data');
      error.stderr = Buffer.from('npm error code E404\nprivate-auth-data');
      throw error;
    }
    return result;
  };
  await assert.rejects(publishRelease(run.options), {
    message: 'npm publish failed (E404); verify the public registry before retrying',
  });
  assert.equal(run.publishCount(), 1);
});

for (const [label, readback, error] of [
  ['wrong commit', response(200, metadata({ gitHead: 'b'.repeat(40) })), /different commit/],
  ['wrong version', response(200, metadata({ version: '4.12.0' })), /different version/],
  ['missing provenance', response(200, metadata({ dist: {} })), /provenance/],
  ['HTTP failure', response(500), /HTTP 500/],
  ['network error', new Error('private-auth-data'), /registry request or JSON read failed/],
  ['invalid JSON', new Response('private-auth-data', { status: 200 }), /registry request or JSON read failed/],
]) {
  test(`publication succeeds but ${label} in readback still fails without retries`, async () => {
    const run = fixture([response(404), readback]);
    await assert.rejects(publishRelease(run.options), error);
    assert.equal(run.publishCount(), 1);
    assert.equal(run.requests.length, 2);
    assert.deepEqual(run.waits, []);
  });
}

test('rejects missing or noncanonical stable RELEASE_VERSION before any side effect', async () => {
  for (const version of ['', 'v4.13.0', '04.13.0', '4.13', '4.13.0-beta.1', '4.13.0\n', '4.13.0; echo secret']) {
    const run = fixture([], { version });
    await assert.rejects(publishRelease(run.options), /RELEASE_VERSION/);
    assert.equal(run.commands.length, 0);
    assert.equal(run.requests.length, 0);
  }
});

for (const [file, label, mutate] of [
  ['package.json', 'wrong name', (pkg) => { pkg.name = 'another-package'; }],
  ['package.json', 'wrong version', (pkg) => { pkg.version = '4.12.0'; }],
  ['package-lock.json', 'wrong name', (lock) => { lock.name = 'another-package'; }],
  ['package-lock.json', 'wrong version', (lock) => { lock.version = '4.12.0'; }],
  ['package-lock.json', 'wrong root name', (lock) => { lock.packages[''].name = 'another-package'; }],
  ['package-lock.json', 'wrong root version', (lock) => { lock.packages[''].version = '4.12.0'; }],
  ['package-lock.json', 'missing root', (lock) => { delete lock.packages; }],
]) {
  test(`rejects ${file} with ${label}`, async () => {
    const run = fixture([]);
    mutate(run.files[file]);
    await assert.rejects(publishRelease(run.options), /Package and lock/);
    assert.equal(run.commands.length, 0);
    assert.equal(run.requests.length, 0);
  });
}

test('unreadable or invalid local JSON fails before git, network, or npm', async () => {
  for (const readFile of [() => { throw new Error('private-auth-data'); }, () => 'invalid-json']) {
    const run = fixture([], { readFile });
    await assert.rejects(publishRelease(run.options), { message: 'Unable to read package.json and package-lock.json' });
    assert.equal(run.commands.length, 0);
    assert.equal(run.requests.length, 0);
  }
});

test('missing or invalid exact git HEAD fails before registry or publication', async () => {
  for (const execFile of [() => { throw new Error('private-auth-data'); }, () => 'short-sha']) {
    const run = fixture([], { execFile });
    await assert.rejects(publishRelease(run.options), /exact git HEAD/);
    assert.equal(run.requests.length, 0);
    assert.equal(run.publishCount(), 0);
  }
});

test('CLI reads RELEASE_VERSION and exits nonzero on invalid input without publishing', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./publish-release.mjs', import.meta.url))], {
    encoding: 'utf8',
    env: { ...process.env, RELEASE_VERSION: '' },
    timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /RELEASE_VERSION must be a stable version/);
});
