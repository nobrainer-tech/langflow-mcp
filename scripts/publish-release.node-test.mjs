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
const ATTESTATION_URL = `${REGISTRY}/-/npm/v1/attestations/langflow-mcp-server@${VERSION}`;
const REPOSITORY = 'https://github.com/nobrainer-tech/langflow-mcp';
const PROVENANCE_TYPE = 'https://slsa.dev/provenance/v1';
const DIGEST = '6a0359cd8435f0c474c0aa77126835ab941b702f025e2818a776770af07449ac7d19ef5a178715cb2b921bee526c0092ad950a4ef3235542d6884d51240dfcc2';
const INTEGRITY = `sha512-${Buffer.from(DIGEST, 'hex').toString('base64')}`;

function metadata(overrides = {}) {
  return {
    name: 'langflow-mcp-server',
    version: VERSION,
    gitHead: SHA,
    dist: { integrity: INTEGRITY, attestations: { url: ATTESTATION_URL } },
    ...overrides,
  };
}

function provenanceStatement() {
  return {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [{ name: `pkg:npm/langflow-mcp-server@${VERSION}`, digest: { sha512: DIGEST } }],
    predicateType: PROVENANCE_TYPE,
    predicate: {
      buildDefinition: {
        buildType: 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1',
        externalParameters: {
          workflow: { ref: `refs/tags/v${VERSION}`, repository: REPOSITORY, path: '.github/workflows/publish.yml' },
        },
        resolvedDependencies: [{ uri: `git+${REPOSITORY}@refs/tags/v${VERSION}`, digest: { gitCommit: SHA } }],
      },
    },
  };
}

function attestation(statement, mediaType = 'application/vnd.dev.sigstore.bundle.v0.3+json') {
  return {
    predicateType: statement.predicateType,
    bundle: {
      mediaType,
      dsseEnvelope: {
        payload: Buffer.from(JSON.stringify(statement)).toString('base64'),
        payloadType: 'application/vnd.in-toto+json',
        signatures: [{ sig: Buffer.from('semantic-test-fixture').toString('base64'), keyid: '' }],
      },
    },
  };
}

// Shape observed at https://registry.npmjs.org/-/npm/v1/attestations/@npmcli%2fpackage-json@8.0.0.
// Subjects/source are adapted; these fixtures do not exercise signature verification.
function attestationBundle(statement = provenanceStatement()) {
  return {
    attestations: [
      attestation({
        _type: 'https://in-toto.io/Statement/v0.1',
        subject: statement.subject,
        predicateType: 'https://github.com/npm/attestation/tree/main/specs/publish/v0.1',
        predicate: { name: 'langflow-mcp-server', version: VERSION, registry: REGISTRY },
      }, 'application/vnd.dev.sigstore.bundle+json;version=0.2'),
      attestation(statement),
    ],
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
      assert.ok([REGISTRY_URL, ATTESTATION_URL].includes(url), 'Unexpected registry URL');
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
  const run = fixture([response(404), response(200), response(200, attestationBundle())]);
  assert.deepEqual(await publishRelease(run.options), { version: VERSION, sha: SHA, published: true });
  assert.equal(run.publishCount(), 1);
  assert.deepEqual(run.requests.map(({ url }) => url), [REGISTRY_URL, REGISTRY_URL, ATTESTATION_URL]);
  assert.equal(new Set(run.requests.map(({ settings }) => settings.signal)).size, 3);
  assert.deepEqual(run.waits, []);
});

test('a correct already-published release is idempotent on a workflow retry', async () => {
  const run = fixture([
    response(200), response(200, attestationBundle()),
    response(200), response(200, attestationBundle()),
  ]);
  assert.deepEqual(await publishRelease(run.options), { version: VERSION, sha: SHA, published: false });
  assert.deepEqual(await publishRelease(run.options), { version: VERSION, sha: SHA, published: false });
  assert.equal(run.publishCount(), 0);
  assert.deepEqual(run.requests.map(({ url }) => url), [REGISTRY_URL, ATTESTATION_URL, REGISTRY_URL, ATTESTATION_URL]);
  assert.deepEqual(run.waits, []);
});

test('retries only post-publish 404 propagation, without publishing again', async () => {
  const run = fixture([response(404), response(404), response(404), response(200), response(200, attestationBundle())]);
  assert.equal((await publishRelease(run.options)).published, true);
  assert.equal(run.publishCount(), 1);
  assert.equal(run.requests.length, 5);
  assert.equal(run.requests[4].url, ATTESTATION_URL);
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

for (const published of [false, true]) {
  const phase = published ? 'post-publish' : 'existing version';
  const initial = () => published ? [response(404)] : [];

  for (const url of [
    'https://example.org/attestation',
    'https://127.0.0.1/attestation',
    ATTESTATION_URL.replace('registry.npmjs.org', 'registry.npmjs.org.evil.example'),
    ATTESTATION_URL.replace('https:', 'http:'),
    ATTESTATION_URL.replace('registry.npmjs.org', 'user@registry.npmjs.org'),
    ATTESTATION_URL.replace('registry.npmjs.org', 'registry.npmjs.org:444'),
    ATTESTATION_URL.replace(VERSION, '4.12.0'),
    ATTESTATION_URL.replace('langflow-mcp-server@', 'another-package@'),
    `${ATTESTATION_URL}?redirect=elsewhere`,
    `${ATTESTATION_URL}#fragment`,
  ]) {
    test(`${phase} rejects nonauthoritative attestation URL ${url} before fetching it`, async () => {
      const body = metadata();
      body.dist.attestations.url = url;
      const run = fixture([...initial(), response(200, body)]);
      await assert.rejects(publishRelease(run.options), /provenance.*URL/);
      assert.equal(run.publishCount(), Number(published));
      assert.equal(run.requests.length, published ? 2 : 1);
      assert.deepEqual(run.waits, []);
    });
  }

  for (const integrity of [undefined, true, '', 'sha256-digest', 'sha512-AAAA', `${INTEGRITY} extra`, `${INTEGRITY}\n`, INTEGRITY.replace('wg==', 'wh==')]) {
    test(`${phase} rejects missing or malformed tarball SRI ${integrity}`, async () => {
      const body = metadata();
      body.dist.integrity = integrity;
      const run = fixture([...initial(), response(200, body)]);
      await assert.rejects(publishRelease(run.options), /integrity/);
      assert.equal(run.publishCount(), Number(published));
      assert.equal(run.requests.length, published ? 2 : 1);
      assert.deepEqual(run.waits, []);
    });
  }

  for (const [label, mutate, error] of [
    ['missing statement type', (s) => { delete s._type; }, /SLSA v1/],
    ['old statement type', (s) => { s._type = 'https://in-toto.io/Statement/v0.1'; }, /SLSA v1/],
    ['old predicate type', (s) => { s.predicateType = 'https://slsa.dev/provenance/v0.2'; }, /SLSA v1/],
    ['wrong build type', (s) => { s.predicate.buildDefinition.buildType = 'unknown'; }, /SLSA v1/],
    ['missing subject', (s) => { delete s.subject; }, /subject/],
    ['empty subject', (s) => { s.subject = []; }, /subject/],
    ['multiple subjects', (s) => { s.subject.push(s.subject[0]); }, /subject/],
    ['wrong subject package', (s) => { s.subject[0].name = `pkg:npm/another-package@${VERSION}`; }, /subject/],
    ['wrong subject version', (s) => { s.subject[0].name = 'pkg:npm/langflow-mcp-server@4.12.0'; }, /subject/],
    ['missing subject digest', (s) => { delete s.subject[0].digest; }, /digest/],
    ['wrong subject digest', (s) => { s.subject[0].digest.sha512 = 'b'.repeat(128); }, /digest/],
    ['wrong workflow repository', (s) => { s.predicate.buildDefinition.externalParameters.workflow.repository = 'https://github.com/other/langflow-mcp'; }, /repository/],
    ['wrong resolved repository', (s) => { s.predicate.buildDefinition.resolvedDependencies[0].uri = `git+${REPOSITORY}-other@refs/tags/v${VERSION}`; }, /repository/],
    ['missing resolved source', (s) => { delete s.predicate.buildDefinition.resolvedDependencies; }, /repository/],
    ['multiple resolved sources', (s) => { s.predicate.buildDefinition.resolvedDependencies.push(s.predicate.buildDefinition.resolvedDependencies[0]); }, /repository/],
    ['missing resolved commit', (s) => { delete s.predicate.buildDefinition.resolvedDependencies[0].digest; }, /resolved commit/],
    ['wrong resolved commit', (s) => { s.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = 'b'.repeat(40); }, /resolved commit/],
  ]) {
    test(`${phase} rejects provenance with ${label}`, async () => {
      const statement = provenanceStatement();
      mutate(statement);
      const bundle = attestationBundle(statement);
      bundle.attestations[1].predicateType = PROVENANCE_TYPE;
      const run = fixture([...initial(), response(200), response(200, bundle)]);
      await assert.rejects(publishRelease(run.options), error);
      assert.equal(run.publishCount(), Number(published));
      assert.equal(run.requests.length, published ? 3 : 2);
      assert.deepEqual(run.waits, []);
    });
  }

  for (const [label, mutate] of [
    ['missing attestations', (b) => { delete b.attestations; }],
    ['non-array attestations', (b) => { b.attestations = {}; }],
    ['publish attestation only', (b) => { b.attestations.pop(); }],
    ['duplicate provenance', (b) => { b.attestations.push(b.attestations[1]); }],
    ['missing envelope', (b) => { delete b.attestations[1].bundle.dsseEnvelope; }],
    ['wrong payload type', (b) => { b.attestations[1].bundle.dsseEnvelope.payloadType = 'text/plain'; }],
    ['missing signatures', (b) => { delete b.attestations[1].bundle.dsseEnvelope.signatures; }],
    ['empty signature', (b) => { b.attestations[1].bundle.dsseEnvelope.signatures[0].sig = ''; }],
    ['missing payload', (b) => { delete b.attestations[1].bundle.dsseEnvelope.payload; }],
    ['non-string payload', (b) => { b.attestations[1].bundle.dsseEnvelope.payload = true; }],
    ['invalid base64 payload', (b) => { b.attestations[1].bundle.dsseEnvelope.payload += '!'; }],
    ['invalid JSON payload', (b) => { b.attestations[1].bundle.dsseEnvelope.payload = Buffer.from('private-auth-data').toString('base64'); }],
    ['null statement', (b) => { b.attestations[1].bundle.dsseEnvelope.payload = Buffer.from('null').toString('base64'); }],
  ]) {
    test(`${phase} fails closed on ${label}`, async () => {
      const bundle = attestationBundle();
      mutate(bundle);
      const run = fixture([...initial(), response(200), response(200, bundle)]);
      await assert.rejects(publishRelease(run.options), /npm.*provenance/);
      assert.equal(run.publishCount(), Number(published));
      assert.equal(run.requests.length, published ? 3 : 2);
      assert.deepEqual(run.waits, []);
    });
  }

  for (const [label, result, error] of [
    ...[201, 302, 404, 401, 403, 429, 500].map((status) => [`HTTP ${status}`, () => response(status), new RegExp(`HTTP ${status}`)]),
    ['network failure', () => new Error('private-auth-data'), /registry request or JSON read failed/],
    ['timeout', () => new DOMException('private-auth-data', 'TimeoutError'), /registry request or JSON read failed/],
    ['invalid bundle JSON', () => new Response('private-auth-data', { status: 200 }), /registry request or JSON read failed/],
    ['null bundle', () => response(200, null), /provenance/],
  ]) {
    test(`${phase} attestation ${label} fails without retry or additional publication`, async () => {
      const run = fixture([...initial(), response(200), result()]);
      await assert.rejects(publishRelease(run.options), error);
      assert.equal(run.publishCount(), Number(published));
      assert.equal(run.requests.length, published ? 3 : 2);
      assert.deepEqual(run.waits, []);
    });
  }
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
