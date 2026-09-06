# Product website

Use nobrainer-tech-brand and keep the linked header identity `nobrainer.tech/langflow-mcp` visible on mobile and desktop. Product suffixes are part of the wordmark, following the owner's /flow reference.

Maintain six complete languages: English, Polish, German, simplified Chinese, Spanish and French. Generate all public pages with `node website/build.mjs`; never patch generated HTML directly.

Deploy only website/public/ into the langflow-mcp/ directory of the existing host. Do not overwrite sibling product routes. Keep npm release claims separate from repository version claims.
