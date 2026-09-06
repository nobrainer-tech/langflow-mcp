# Product website

Use nobrainer-tech-brand and keep the linked header identity `nobrainer.tech/langflow-mcp` visible on mobile and desktop. Product suffixes are part of the wordmark, following the owner's /flow reference.

Match the live /flow wordmark: 21px, weight 750, tracking -1px, baseline-aligned domain and suffix; suffix inherits typography and uses ink. Never underline the wordmark on hover or focus. On narrow screens wrap header controls rather than shrinking or hiding the product suffix.

Maintain six complete languages: English, Polish, German, simplified Chinese, Spanish and French. Generate all public pages with `node website/build.mjs`; never patch generated HTML directly.

Deploy only website/public/ into the langflow-mcp/ directory of the existing host. Do not overwrite sibling product routes. Keep npm release claims separate from repository version claims.
