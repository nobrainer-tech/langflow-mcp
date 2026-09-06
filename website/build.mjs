import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { locales } from './locales.mjs';

const out = fileURLToPath(new URL('./public/', import.meta.url));
const origin = 'https://nobrainer.tech/langflow-mcp/';
const repo = 'https://github.com/nobrainer-tech/langflow-mcp';
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route = code => code === 'en' ? '' : `${code}/`;
const install = 'git clone https://github.com/nobrainer-tech/langflow-mcp.git\ncd langflow-mcp\nnpm ci\nnpm run build';
const codex = 'codex mcp add langflow \\\n  --env LANGFLOW_BASE_URL=http://localhost:7860 \\\n  --env LANGFLOW_API_KEY=YOUR_LANGFLOW_API_KEY \\\n  --env LANGFLOW_CONSOLIDATED_TOOLS=true \\\n  -- node "$PWD/dist/mcp/index.js"';
const claude = 'claude mcp add langflow \\\n  -e LANGFLOW_BASE_URL=http://localhost:7860 \\\n  -e LANGFLOW_API_KEY=YOUR_LANGFLOW_API_KEY \\\n  -e LANGFLOW_CONSOLIDATED_TOOLS=true \\\n  -- node "$PWD/dist/mcp/index.js"';
const icons = [
  '<rect x="3" y="3" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/><path d="M9 6h9v9M6 9v9h9"/>',
  '<path d="m8 4 13 8-13 8Z"/>',
  '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  '<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 7V3M9 13h.01M15 13h.01M8 17h8"/>'
];
const icon = (i) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[i]}</svg>`;

mkdirSync(out, {recursive:true});
for (const [code, t] of Object.entries(locales)) {
  const dir = out + route(code), prefix = code === 'en' ? './' : '../';
  mkdirSync(dir, {recursive:true});
  const canonical = origin + route(code);
  const codeBox = (id, value) => `<div class="code-box"><button class="copy" data-copy="${id}" data-done="${esc(t.copied)}" data-error="${esc(t.copyError)}">${esc(t.copy)}</button><pre><code id="${id}">${esc(value)}</code></pre></div>`;
  const alternatives = Object.entries(locales).map(([key, l])=>`<link rel="alternate" hreflang="${l.lang}" href="${origin+route(key)}">`).join('');
  const title = t.title.replace(t.accent, `<span>${esc(t.accent)}</span>`);
  const html = `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Langflow MCP | ${esc(t.title)} | NoBrainer.Tech</title><meta name="description" content="${esc(t.intro)}"><meta name="theme-color" content="#FAF9F6">
<link rel="canonical" href="${canonical}">${alternatives}<link rel="alternate" hreflang="x-default" href="${origin}">
<meta property="og:type" content="website"><meta property="og:title" content="Langflow MCP | ${esc(t.title)}"><meta property="og:description" content="${esc(t.intro)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="NoBrainer.Tech">
<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${prefix}styles.css"><script src="${prefix}app.js" defer></script>
</head><body>
<a class="skip" href="#main">${esc(t.skip)}</a>
<header><div class="shell header-inner"><a class="wordmark" aria-label="nobrainer.tech/langflow-mcp" href="${canonical}">nobrainer<span><i></i>tech</span><b class="product">/langflow-mcp</b></a>
<nav class="nav" aria-label="${esc(t.nav[0])}">${t.nav.slice(0,3).map((n,i)=>`<a href="#${['capabilities','how','install'][i]}">${esc(n)}</a>`).join('')}</nav>
<div class="preferences"><button id="theme" aria-label="${esc(t.night)}" title="${esc(t.night)}" data-day="${esc(t.day)}" data-night="${esc(t.night)}" aria-pressed="false">◐</button>
<details class="languages"><summary aria-label="${esc(t.language)}: ${esc(t.name)}">${code.toUpperCase()} <span aria-hidden="true">⌄</span></summary><nav aria-label="${esc(t.language)}">${Object.entries(locales).map(([k,l])=>`<a href="${prefix}${route(k)}" lang="${l.lang}" hreflang="${l.lang}"${k===code?' aria-current="page"':''}>${esc(l.name)}</a>`).join('')}</nav></details></div></div></header>
<main id="main">
<section class="hero shell"><div class="hero-copy"><p class="eyebrow">${esc(t.eyebrow)}</p><h1>${title}</h1><p class="intro">${esc(t.intro)}</p><div class="actions"><a class="button primary" href="#install">${esc(t.start)} <span aria-hidden="true">↗</span></a><a class="button" href="${repo}">${esc(t.source)}</a></div><div class="clients"><span>Codex</span><span>Claude Code</span><span>Claude Desktop</span><span>MCP</span></div></div>
<div class="connection"><div class="panel-label"><span>01 / MCP</span><span class="protocol">stdio · HTTP</span></div><h2>${esc(t.diagram)}</h2><div class="prompt">“${esc(t.prompt)}”</div><div class="nodes"><div class="node">${icon(5)}<div><small>01</small><strong>${esc(t.client)}</strong></div></div><div class="connector" aria-hidden="true">↓</div><div class="node middle">${icon(0)}<div><small>02</small><strong>${esc(t.bridge)}</strong><code>tools/call</code></div></div><div class="connector" aria-hidden="true">↓</div><div class="node">${icon(2)}<div><small>03</small><strong>${esc(t.backend)}</strong><code>REST API</code></div></div></div><p class="caption">${esc(t.diagramNote)}</p></div></section>
<div class="shell stats">${['236','29','MIT','1.12.0'].map((s,i)=>`<div><strong>${s}</strong><span>${esc(t.stats[i])}</span></div>`).join('')}</div>
<section class="shell section" id="capabilities"><div class="section-heading"><p class="eyebrow">01 / ${esc(t.nav[0])}</p><h2>${esc(t.capabilityTitle)}</h2><p>${esc(t.capabilityIntro)}</p></div><div class="cards">${t.cards.map(([heading,body],i)=>`<article class="card"><div class="card-top">${icon(i)}<span>0${i+1}</span></div><h3>${esc(heading)}</h3><p>${esc(body)}</p></article>`).join('')}</div></section>
<section class="shell section" id="how"><div class="section-heading"><p class="eyebrow">02 / ${esc(t.nav[1])}</p><h2>${esc(t.pathTitle)}</h2></div><ol class="steps">${t.steps.map(([h,b],i)=>`<li><span class="number">0${i+1}</span><h3>${esc(h)}</h3><p>${esc(b)}</p></li>`).join('')}</ol></section>
<section class="install section" id="install"><div class="shell"><div class="section-heading"><p class="eyebrow">03 / ${esc(t.nav[2])}</p><h2>${esc(t.installTitle)}</h2><p>${esc(t.installIntro)}</p></div><aside class="release">${esc(t.release)} <a href="https://www.npmjs.com/package/langflow-mcp-server">npm ↗</a></aside>
<h3>${esc(t.build)}</h3>${codeBox('source',install)}<h3>${esc(t.configure)}</h3><p>${esc(t.placeholder)}</p>
<div class="config-grid"><article><h4>Codex</h4>${codeBox('codex',codex)}</article><article><h4>Claude Code</h4>${codeBox('claude',claude)}</article></div><p id="copy-status" class="caption" role="status" aria-live="polite"></p>
<div class="remote"><div><h3>${esc(t.remoteTitle)}</h3><p>${esc(t.remote)}</p></div><a class="button" href="${repo}#remote-streamable-http">${esc(t.docs)} ↗</a></div></div></section>
<section class="shell section faq" id="faq"><div class="section-heading"><p class="eyebrow">04 / FAQ</p><h2>${esc(t.faqTitle)}</h2></div><div>${t.faqs.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>
<section class="shell closing"><div><h2>${esc(t.closing)}</h2><p>${esc(t.closingText)}</p></div><a class="button primary" href="${repo}">${esc(t.source)} ↗</a></section>
</main><footer class="shell"><p>${esc(t.footer)}</p><nav><a href="${repo}">GitHub</a><a href="https://www.npmjs.com/package/langflow-mcp-server">${esc(t.npm)}</a><a href="https://nobrainer.tech/flow/">NoBrainer.Tech Flow</a></nav></footer>
</body></html>`;
  if (/[—–]/u.test(html)) throw new Error(`Non-brand dash in ${code}`);
  writeFileSync(dir + 'index.html', html);
}
for (const asset of ['styles.css','app.js','favicon.svg']) copyFileSync(new URL(asset,import.meta.url),out+asset);
writeFileSync(out+'sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(locales).map(k=>`<url><loc>${origin+route(k)}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${Object.keys(locales).length} locales in ${out}`);
