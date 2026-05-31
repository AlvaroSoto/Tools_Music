(function() {
  'use strict';

  // 1. Theme Management
  const THEME_KEY = 'tm_theme';
  const getSavedTheme = () => localStorage.getItem(THEME_KEY) || 'dark';
  
  const applyTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

  const toggleTheme = () => {
    const current = getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    updateThemeIcon(next);
  };

  const updateThemeIcon = (theme) => {
    const icon = document.getElementById('tm-theme-icon');
    if (icon) {
      icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
    }
  };

  // Apply initial theme immediately to prevent flashing
  const initialTheme = getSavedTheme();
  applyTheme(initialTheme);

  // 2. Navbar Injection
  document.addEventListener('DOMContentLoaded', () => {
    // Only inject if not already injected
    if (document.getElementById('tm-global-nav')) return;

    const nav = document.createElement('nav');
    nav.id = 'tm-global-nav';
    nav.className = 'tm-global-nav';

    // Build the inner HTML
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    const backHref = isIndex ? '#' : './index.html';
    const backDisplay = isIndex ? 'none' : 'flex';

    nav.innerHTML = `
      <div style="display:flex;align-items:center;gap:15px;">
        <a href="${backHref}" style="display:${backDisplay}; font-size:14px; background:var(--tm-panel-2); padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">
          <i class="ti ti-arrow-left"></i> Menú
        </a>
        <a href="./index.html">TOOLS_MUSIC</a>
      </div>
      <div class="tm-nav-actions">
        <button id="tm-theme-btn" class="tm-btn" style="padding:6px; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
          <i id="tm-theme-icon" class="ti ti-sun" style="font-size:16px;"></i>
        </button>
      </div>
    `;

    document.body.insertBefore(nav, document.body.firstChild);

    // Setup event listeners
    document.getElementById('tm-theme-btn').addEventListener('click', toggleTheme);
    updateThemeIcon(initialTheme);
  });
})();
