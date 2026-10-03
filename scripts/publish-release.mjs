import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const PACKAGE_NAME = 'langflow-mcp-server';
const REGISTRY = 'https://registry.npmjs.org';
const REQUEST_TIMEOUT_MS = 10_000;
const READBACK_ATTEMPTS = 3;
const READBACK_DELAY_MS = 1000;
const SOURCE_REPOSITORY = 'https://github.com/nobrainer-tech/langflow-mcp';
const PROVENANCE_TYPE = 'https://slsa.dev/provenance/v1';

async function verifyMetadata(metadata, version, sha, readRegistry) {
  if (metadata?.name !== PACKAGE_NAME) {
    throw new Error('npm metadata belongs to a different package');
  }
  if (metadata.version !== version) {
    throw new Error('npm metadata belongs to a different version');
  }
  if (metadata.gitHead !== sha) {
    throw new Error('npm version belongs to a different commit');
  }
  const provenanceUrl = `${REGISTRY}/-/npm/v1/attestations/${PACKAGE_NAME}@${version}`;
  if (metadata.dist?.attestations?.url !== provenanceUrl) {
    throw new Error('npm provenance metadata URL must match the exact public npm package/version endpoint');
  }
  const integrity = typeof metadata.dist.integrity === 'string'
    && /^sha512-([A-Za-z0-9+/]{86}==)$/.exec(metadata.dist.integrity);
  const digest = integrity && Buffer.from(integrity[1], 'base64');
  if (!digest || digest.length !== 64 || metadata.dist.integrity !== `sha512-${digest.toString('base64')}`) {
    throw new Error('npm tarball integrity is missing or invalid');
  }

  const response = await readRegistry(provenanceUrl);
  if (response.status !== 200) {
    throw new Error(`npm provenance attestation request returned HTTP ${response.status}`);
  }
  const attestations = response.data?.attestations;
  const provenance = Array.isArray(attestations)
    ? attestations.filter((item) => item?.predicateType === PROVENANCE_TYPE) : [];
  if (provenance.length !== 1) {
    throw new Error('npm SLSA v1 provenance is missing or ambiguous');
  }
  const envelope = provenance[0].bundle?.dsseEnvelope;
  let statement;
  try {
    if (envelope?.payloadType !== 'application/vnd.in-toto+json'
      || typeof envelope.payload !== 'string'
      || !Array.isArray(envelope.signatures) || envelope.signatures.length !== 1
      || typeof envelope.signatures[0]?.sig !== 'string' || !envelope.signatures[0].sig) {
      throw new Error();
    }
    const payload = Buffer.from(envelope.payload, 'base64');
    if (payload.toString('base64') !== envelope.payload) throw new Error();
    statement = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(payload));
  } catch {
    throw new Error('npm provenance envelope or statement is malformed');
  }
  const definition = statement?.predicate?.buildDefinition;
  if (statement?._type !== 'https://in-toto.io/Statement/v1'
    || statement.predicateType !== PROVENANCE_TYPE
    || definition?.buildType !== 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1') {
    throw new Error('npm provenance must be a GitHub SLSA v1 statement');
  }
  if (!Array.isArray(statement.subject) || statement.subject.length !== 1
    || statement.subject[0]?.name !== `pkg:npm/${PACKAGE_NAME}@${version}`) {
    throw new Error('npm provenance subject does not match the package/version');
  }
  if (statement.subject[0].digest?.sha512 !== digest.toString('hex')) {
    throw new Error('npm provenance subject digest does not match npm tarball integrity');
  }
  const dependencies = definition.resolvedDependencies;
  const source = Array.isArray(dependencies) && dependencies.length === 1 ? dependencies[0] : undefined;
  if (definition.externalParameters?.workflow?.repository !== SOURCE_REPOSITORY
    || typeof source?.uri !== 'string' || !source.uri.startsWith(`git+${SOURCE_REPOSITORY}@refs/`)) {
    throw new Error('npm provenance belongs to a different source repository');
  }
  if (source.digest?.gitCommit !== sha) {
    throw new Error('npm provenance belongs to a different resolved commit');
  }
}

export async function publishRelease({
  version = process.env.RELEASE_VERSION,
  cwd = process.cwd(),
  readFile = readFileSync,
  execFile = execFileSync,
  fetch = globalThis.fetch,
  sleep: wait = sleep,
} = {}) {
  if (typeof version !== 'string' || version.trim() !== version
    || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error('RELEASE_VERSION must be a stable version such as 4.13.0');
  }

  let pkg;
  let lock;
  try {
    pkg = JSON.parse(readFile(resolve(cwd, 'package.json'), 'utf8'));
    lock = JSON.parse(readFile(resolve(cwd, 'package-lock.json'), 'utf8'));
  } catch {
    throw new Error('Unable to read package.json and package-lock.json');
  }
  const lockRoot = lock?.packages?.[''];
  if ([pkg, lock, lockRoot].some((item) => item?.name !== PACKAGE_NAME || item?.version !== version)) {
    throw new Error('Package and lock names/versions must match langflow-mcp-server and RELEASE_VERSION');
  }

  let sha;
  try {
    sha = execFile('git', ['rev-parse', 'HEAD'], {
      cwd, encoding: 'utf8', stdio: 'pipe', shell: false, timeout: REQUEST_TIMEOUT_MS,
    }).trim();
  } catch {
    throw new Error('Unable to derive exact git HEAD');
  }
  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error('Unable to derive exact git HEAD');
  }

  const url = `${REGISTRY}/${PACKAGE_NAME}/${version}`;
  async function readRegistry(requestUrl) {
    try {
      const response = await fetch(requestUrl, {
        cache: 'no-store',
        redirect: 'error',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status !== 200) {
        await response.body?.cancel();
        return { status: response.status };
      }
      return { status: 200, data: await response.json() };
    } catch {
      throw new Error('npm registry request or JSON read failed');
    }
  }

  const existing = await readRegistry(url);
  if (existing.status === 200) {
    await verifyMetadata(existing.data, version, sha, readRegistry);
    return { version, sha, published: false };
  }
  if (existing.status !== 404) {
    throw new Error(`npm registry returned HTTP ${existing.status}`);
  }

  try {
    execFile('npm', ['publish', '--access', 'public', '--registry', REGISTRY], {
      cwd, stdio: 'pipe', shell: false, timeout: 120_000,
    });
  } catch (error) {
    const code = error.stderr?.toString().match(/npm error code (E[A-Z0-9_]+)/)?.[1];
    throw new Error(`npm publish failed${code ? ` (${code})` : ''}; verify the public registry before retrying`);
  }

  for (let attempt = 1; attempt <= READBACK_ATTEMPTS; attempt += 1) {
    const readback = await readRegistry(url);
    if (readback.status === 200) {
      await verifyMetadata(readback.data, version, sha, readRegistry);
      return { version, sha, published: true };
    }
    if (readback.status !== 404) {
      throw new Error(`npm registry returned HTTP ${readback.status}`);
    }
    if (attempt < READBACK_ATTEMPTS) await wait(READBACK_DELAY_MS);
  }
  throw new Error(`npm version is missing after ${READBACK_ATTEMPTS} readback attempts`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  publishRelease().then(({ version, sha, published }) => {
    console.log(`Verified ${PACKAGE_NAME}@${version}, commit ${sha}, with SLSA v1 subject/source bindings; signatures not verified (${published ? 'published' : 'already published'})`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
