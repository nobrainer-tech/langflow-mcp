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

function verifyMetadata(metadata, version, sha) {
  if (metadata?.name !== PACKAGE_NAME) {
    throw new Error('npm metadata belongs to a different package');
  }
  if (metadata.version !== version) {
    throw new Error('npm metadata belongs to a different version');
  }
  if (metadata.gitHead !== sha) {
    throw new Error('npm version belongs to a different commit');
  }
  const provenance = metadata.dist?.attestations?.url;
  let url;
  try {
    if (typeof provenance !== 'string' || provenance.trim() !== provenance) throw new Error();
    url = new URL(provenance);
  } catch {
    throw new Error('npm provenance metadata URL is missing or invalid');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('npm provenance metadata URL is missing or invalid');
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
  async function readRegistry() {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        redirect: 'error',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status !== 200) {
        await response.body?.cancel();
        return { status: response.status };
      }
      return { status: 200, metadata: await response.json() };
    } catch {
      throw new Error('npm registry request or JSON read failed');
    }
  }

  const existing = await readRegistry();
  if (existing.status === 200) {
    verifyMetadata(existing.metadata, version, sha);
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
    const readback = await readRegistry();
    if (readback.status === 200) {
      verifyMetadata(readback.metadata, version, sha);
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
    console.log(`Verified ${PACKAGE_NAME}@${version}, commit ${sha}, with provenance metadata (${published ? 'published' : 'already published'})`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
