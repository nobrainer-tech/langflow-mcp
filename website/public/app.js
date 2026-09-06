(() => {
  const root = document.documentElement;
  const theme = document.querySelector('#theme');
  function setTheme(mode) {
    root.dataset.theme = mode;
    theme.setAttribute('aria-pressed', String(mode === 'night'));
    const label = mode === 'night' ? theme.dataset.day : theme.dataset.night;
    theme.setAttribute('aria-label', label);
    theme.title = label;
    try { localStorage.setItem('langflow-mcp-theme', mode); } catch {}
  }
  let initial = matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
  try { initial = localStorage.getItem('langflow-mcp-theme') || initial; } catch {}
  setTheme(initial === 'night' ? 'night' : 'day');
  theme.addEventListener('click', () => setTheme(root.dataset.theme === 'night' ? 'day' : 'night'));
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const status = document.querySelector('#copy-status');
      try {
        await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).textContent);
        status.textContent = button.dataset.done;
      } catch { status.textContent = button.dataset.error; }
    });
  });
})();
