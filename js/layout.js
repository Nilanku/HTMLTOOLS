/**
 * layout.js - Reusable Header, Nav, Search, and Footer for Toolyard
 */
export function initLayout(activeCategory = 'HTML & Web') {
  // 1. Inject Reusable Header
  const headerContainer = document.getElementById('site-header');
  if (headerContainer) {
    headerContainer.innerHTML = `
      <header class="site">
        <div class="wrap nav-row">
          <a href="/" class="logo"><span class="logo-mark">&gt;_</span>Tool<span class="accent">yard</span></a>
          <nav class="main-nav" id="mainNav">
            <div class="nav-item">
              <button type="button">Tools <span class="chev"></span></button>
              <div class="mega">
                <a href="/categories/html-web/"><span class="cat-name">HTML &amp; Web</span><span class="cat-sub">10 formatters, converters &amp; extractors</span></a>
                <a href="/categories/json-data/"><span class="cat-name">JSON &amp; Data</span><span class="cat-sub">Format, validate, minify data</span></a>
                <a href="/#other-cats"><span class="cat-name">CSS</span><span class="cat-sub">Generate &amp; optimize styles</span></a>
                <a href="/#other-cats"><span class="cat-name">Text</span><span class="cat-sub">Clean, count, transform copy</span></a>
                <a href="/#other-cats"><span class="cat-name">Images</span><span class="cat-sub">Resize, compress, convert</span></a>
                <a href="/#other-cats"><span class="cat-name">Files</span><span class="cat-sub">Common document formats</span></a>
              </div>
            </div>
            <div class="nav-item">
              <button type="button">Converters <span class="chev"></span></button>
              <div class="mega">
                <a href="/tools/html-to-markdown/"><span class="cat-name">HTML to Markdown</span><span class="cat-sub">Convert markup to Markdown</span></a>
                <a href="/tools/html-to-jsx/"><span class="cat-name">HTML to JSX</span><span class="cat-sub">Convert HTML to React JSX</span></a>
                <a href="/tools/html-to-text/"><span class="cat-name">HTML to Text</span><span class="cat-sub">Extract readable plain text</span></a>
                <a href="/tools/html-to-css/"><span class="cat-name">HTML to CSS</span><span class="cat-sub">Extract classes, IDs &amp; styles</span></a>
                <a href="/tools/html-entity-encoder/"><span class="cat-name">HTML Entity Encoder</span><span class="cat-sub">Encode &amp; decode entities</span></a>
              </div>
            </div>
            <div class="nav-item">
              <button type="button">Generators <span class="chev"></span></button>
              <div class="mega">
                <a href="/tools/html-table-generator/"><span class="cat-name">HTML Table Generator</span><span class="cat-sub">Visual table builder</span></a>
                <a href="/#other-cats"><span class="cat-name">CSS Generators</span><span class="cat-sub">Gradients, shadows, grids</span></a>
                <a href="/#other-cats"><span class="cat-name">SEO Generators</span><span class="cat-sub">Meta tags &amp; sitemaps</span></a>
                <a href="/#other-cats"><span class="cat-name">Developer Generators</span><span class="cat-sub">IDs, tokens, placeholders</span></a>
                <a href="/#other-cats"><span class="cat-name">General Generators</span><span class="cat-sub">Everyday utilities</span></a>
              </div>
            </div>
            <div class="nav-item">
              <button type="button">Developer <span class="chev"></span></button>
              <div class="mega">
                <a href="/tools/html-formatter/"><span class="cat-name">HTML Formatter</span><span class="cat-sub">Clean indentation &amp; tags</span></a>
                <a href="/tools/html-minifier/"><span class="cat-name">HTML Minifier</span><span class="cat-sub">Collapse whitespace &amp; comments</span></a>
                <a href="/tools/json-formatter/"><span class="cat-name">JSON Formatter</span><span class="cat-sub">Validate &amp; format JSON</span></a>
                <a href="/tools/json-minifier/"><span class="cat-name">JSON Minifier</span><span class="cat-sub">Compress JSON structures</span></a>
                <a href="/tools/html-link-extractor/"><span class="cat-name">HTML Link Extractor</span><span class="cat-sub">Extract anchor tags &amp; URLs</span></a>
                <a href="/tools/html-image-extractor/"><span class="cat-name">HTML Image Extractor</span><span class="cat-sub">Extract images &amp; alt text</span></a>
              </div>
            </div>
            <div class="nav-item">
              <button type="button">SEO <span class="chev"></span></button>
              <div class="mega">
                <a href="/tools/html-link-extractor/"><span class="cat-name">Link Audit</span><span class="cat-sub">Extract internal &amp; external links</span></a>
                <a href="/tools/html-image-extractor/"><span class="cat-name">Image Alt Audit</span><span class="cat-sub">Find missing alt attributes</span></a>
                <a href="/#other-cats"><span class="cat-name">Meta Tools</span><span class="cat-sub">Titles, descriptions, tags</span></a>
                <a href="/#other-cats"><span class="cat-name">Social Preview Tools</span><span class="cat-sub">OG &amp; card previews</span></a>
                <a href="/#other-cats"><span class="cat-name">Sitemaps</span><span class="cat-sub">URL mapping &amp; verification</span></a>
              </div>
            </div>
          </nav>

          <div class="nav-right">
            <button class="icon-btn" aria-label="Search tools" id="globalSearchTrigger">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button class="icon-btn" id="themeToggle" aria-label="Toggle dark mode">
              <svg class="sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <svg class="moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <button class="icon-btn mobile-toggle" id="mobileNavToggle" aria-label="Open mobile menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Reusable Mobile Navigation Drawer -->
      <div class="mobile-nav-drawer" id="mobileNavDrawer">
        <div class="mobile-nav-head">
          <a href="/" class="logo"><span class="logo-mark">&gt;_</span>Tool<span class="accent">yard</span></a>
          <button class="icon-btn" id="closeMobileDrawer" aria-label="Close menu">✕</button>
        </div>
        <div class="mobile-nav-links">
          <div class="mobile-nav-group-title">HTML &amp; Web Tools</div>
          <a href="/tools/html-formatter/">HTML Formatter</a>
          <a href="/tools/html-minifier/">HTML Minifier</a>
          <a href="/tools/html-to-markdown/">HTML to Markdown</a>
          <a href="/tools/html-to-text/">HTML to Plain Text</a>
          <a href="/tools/html-to-jsx/">HTML to JSX</a>
          <a href="/tools/html-to-css/">HTML to CSS Extractor</a>
          <a href="/tools/html-link-extractor/">HTML Link Extractor</a>
          <a href="/tools/html-image-extractor/">HTML Image Extractor</a>
          <a href="/tools/html-table-generator/">HTML Table Generator</a>
          <a href="/tools/html-entity-encoder/">HTML Entity Encoder / Decoder</a>
          <div class="mobile-nav-group-title">JSON &amp; Data Tools</div>
          <a href="/tools/json-formatter/">JSON Formatter</a>
          <a href="/tools/json-minifier/">JSON Minifier</a>
          <div class="mobile-nav-group-title">Categories</div>
          <a href="/categories/html-web/">HTML &amp; Web (10 tools)</a>
          <a href="/categories/json-data/">JSON &amp; Data (2 tools)</a>
        </div>
      </div>
    `;
  }

  // 2. Inject Reusable Footer
  const footerContainer = document.getElementById('site-footer');
  if (footerContainer) {
    footerContainer.innerHTML = `
      <footer>
        <div class="wrap">
          <div class="foot-grid">
            <div class="foot-brand">
              <a href="/" class="logo"><span class="logo-mark">&gt;_</span>Tool<span class="accent">yard</span></a>
              <p>Free, fast, and private browser-based utilities for developers and creators. No server processing, zero trackers.</p>
            </div>
            <div class="foot-col">
              <h4>HTML &amp; Web</h4>
              <a href="/tools/html-formatter/">HTML Formatter</a>
              <a href="/tools/html-minifier/">HTML Minifier</a>
              <a href="/tools/html-link-extractor/">Link Extractor</a>
              <a href="/tools/html-image-extractor/">Image Extractor</a>
              <a href="/tools/html-table-generator/">Table Generator</a>
              <a href="/tools/html-entity-encoder/">Entity Encoder</a>
            </div>
            <div class="foot-col">
              <h4>Converters</h4>
              <a href="/tools/html-to-markdown/">HTML to Markdown</a>
              <a href="/tools/html-to-jsx/">HTML to JSX</a>
              <a href="/tools/html-to-text/">HTML to Text</a>
              <a href="/tools/html-to-css/">HTML to CSS</a>
              <a href="/categories/html-web/">All HTML Tools</a>
            </div>
            <div class="foot-col">
              <h4>JSON &amp; Data</h4>
              <a href="/tools/json-formatter/">JSON Formatter</a>
              <a href="/tools/json-minifier/">JSON Minifier</a>
              <a href="/categories/json-data/">JSON Category</a>
            </div>
            <div class="foot-col">
              <h4>Toolyard</h4>
              <a href="/#categories">Categories</a>
              <a href="/#about">About</a>
              <a href="/#faq">FAQ</a>
            </div>
          </div>
          <div class="foot-bottom">
            <span>© 2026 Toolyard. All rights reserved. 100% Client-Side Privacy.</span>
            <span>Space Grotesk · Inter · IBM Plex Mono</span>
          </div>
        </div>
      </footer>
    `;
  }

  // 3. Theme toggle setup
  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('toolyard-theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('toolyard-theme', next);
    });
  }

  // 4. Mobile Drawer toggling
  const mobileToggle = document.getElementById('mobileNavToggle');
  const closeDrawer = document.getElementById('closeMobileDrawer');
  const drawer = document.getElementById('mobileNavDrawer');
  if (mobileToggle && drawer) {
    mobileToggle.addEventListener('click', () => drawer.classList.add('open'));
  }
  if (closeDrawer && drawer) {
    closeDrawer.addEventListener('click', () => drawer.classList.remove('open'));
  }

  // 5. FAQ Accordion handler
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}