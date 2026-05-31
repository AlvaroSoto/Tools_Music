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
    
    // Inline styles as fallback in case ui.css is cached by the browser
    nav.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; height: 50px; background: var(--tm-panel); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2); width: 100%; box-sizing: border-box;';

    // Build the inner HTML
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('Tools_Music/');
    const backHref = isIndex ? '#' : './index.html';
    const backDisplay = isIndex ? 'none' : 'flex';

    nav.innerHTML = \`
      <div style="display:flex;align-items:center;gap:15px;">
        <a href="\${backHref}" style="display:\${backDisplay}; font-size:14px; background:var(--tm-panel-2); padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); color: var(--tm-text); text-decoration: none; font-family: 'Space Mono', monospace;">
          <i class="ti ti-arrow-left"></i> Menú
        </a>
        <a href="./index.html" style="color: var(--tm-text); text-decoration: none; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px;">TOOLS_MUSIC</a>
      </div>
      <div class="tm-nav-actions">
        <button id="tm-theme-btn" class="tm-btn" style="padding:6px; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.07); border: 0.5px solid rgba(255,255,255,0.18); color: var(--tm-text); cursor: pointer;">
          <i id="tm-theme-icon" class="ti ti-sun" style="font-size:16px;"></i>
        </button>
      </div>
    \`;

    document.body.insertBefore(nav, document.body.firstChild);
    
    // Fallback for body padding
    document.body.style.paddingTop = '74px';
    // Ensure body is column if it's flex, so it doesn't align side-by-side
    if (window.getComputedStyle(document.body).display === 'flex') {
        document.body.style.flexDirection = 'column';
        document.body.style.alignItems = 'center';
    }

    // Setup event listeners
    document.getElementById('tm-theme-btn').addEventListener('click', toggleTheme);
    updateThemeIcon(initialTheme);
  });
})();
