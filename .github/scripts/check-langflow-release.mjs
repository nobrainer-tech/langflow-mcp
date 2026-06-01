import fs from 'node:fs';

function parseSemver(version) {
  const parts = version.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid semver: ${version}`);
  }
  return parts;
}

function compareSemver(a, b) {
  const aa = parseSemver(a);
  const bb = parseSemver(b);
  for (let i = 0; i < 3; i += 1) {
    if (aa[i] > bb[i]) return 1;
    if (aa[i] < bb[i]) return -1;
  }
  return 0;
}

function sanitizeTag(tagName) {
  const normalized = tagName.trim().replace(/^v/i, '');
  const match = normalized.match(/\d+\.\d+\.\d+/);
  if (!match) {
    throw new Error(`Could not parse release tag: ${tagName}`);
  }
  return match[0];
}

function getSupportedVersionFromReadme() {
  const readme = fs.readFileSync('README.md', 'utf8');
  const match = readme.match(/supports Langflow API version \*\*([0-9]+\.[0-9]+\.[0-9]+)\*\*/i);
  if (!match) {
    throw new Error('Could not find supported Langflow API version in README.md');
  }
  return match[1];
}

function setOutput(key, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  fs.appendFileSync(outputFile, `${key}=${value}\n`);
}

async function fetchLatestLangflowRelease() {
  const response = await fetch('https://api.github.com/repos/langflow-ai/langflow/releases/latest', {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'langflow-mcp-api-watch'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch latest Langflow release: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.tag_name) {
    throw new Error('Latest Langflow release has no tag_name');
  }

  return sanitizeTag(json.tag_name);
}

async function openPrExists(repoOwner, repoName, branchName, githubToken) {
  if (!githubToken) return false;

  const params = new URLSearchParams({
    state: 'open',
    head: `${repoOwner}:${branchName}`
  });

  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/pulls?${params.toString()}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'langflow-mcp-api-watch'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to check existing PRs: ${response.status} ${response.statusText}`);
  }

  const pulls = await response.json();
  return Array.isArray(pulls) && pulls.length > 0;
}

async function main() {
  const supportedVersion = getSupportedVersionFromReadme();
  const latestVersion = await fetchLatestLangflowRelease();
  const hasUpdate = compareSemver(latestVersion, supportedVersion) === 1;

  const repository = process.env.GITHUB_REPOSITORY || '';
  const [repoOwner, repoName] = repository.split('/');
  const upgradeBranch = `ra/langflow-api-upgrade-v${latestVersion}`;

  let prAlreadyOpen = false;
  if (hasUpdate && repoOwner && repoName) {
    prAlreadyOpen = await openPrExists(
      repoOwner,
      repoName,
      upgradeBranch,
      process.env.GITHUB_TOKEN || ''
    );
  }

  setOutput('supported_version', supportedVersion);
  setOutput('latest_version', latestVersion);
  setOutput('has_update', String(hasUpdate));
  setOutput('upgrade_branch', upgradeBranch);
  setOutput('pr_already_open', String(prAlreadyOpen));

  console.log(`supported_version=${supportedVersion}`);
  console.log(`latest_version=${latestVersion}`);
  console.log(`has_update=${hasUpdate}`);
  console.log(`upgrade_branch=${upgradeBranch}`);
  console.log(`pr_already_open=${prAlreadyOpen}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
