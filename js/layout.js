/*!
 * Toolyard — layout.js
 * Reusable site chrome for every page: header + mega menus, mobile drawer, search,
 * breadcrumbs (+ JSON-LD), footer, dark mode, and category-page rendering.
 *
 * Requires /js/tools-data.js to be loaded first. Load both in <head> (no defer):
 *   <script src="/js/tools-data.js"></script>
 *   <script src="/js/layout.js"></script>
 *
 * Page placeholders (each is replaced by the real markup):
 *   <div id="site-header"></div>       header + mobile drawer + search dialog
 *   <div id="site-breadcrumbs"></div>  breadcrumb bar (tool & category pages)
 *   <div id="site-footer"></div>       footer
 *
 * Page identity (optional – falls back to URL matching):
 *   <body data-tool="html-formatter">  or  <body data-category="css">
 */
(function () {
  'use strict';

  var D = window.TOOLYARD_DATA;
  if (!D) { console.error('[Toolyard] tools-data.js must be loaded before layout.js'); return; }

  /* ------------------------------------------------------------------ *
   * 1. THEME — applied immediately (before paint) to avoid a flash
   * ------------------------------------------------------------------ */
  var THEME_KEY = 'toolyard-theme';
  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function preferredTheme() {
    var s = storedTheme();
    if (s === 'dark' || s === 'light') return s;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }
  document.documentElement.setAttribute('data-theme', preferredTheme());

  /* ------------------------------------------------------------------ *
   * 2. DATA HELPERS
   * ------------------------------------------------------------------ */
  var toolById = {}, catBySlug = {};
  D.tools.forEach(function (t) { toolById[t.id] = t; });
  D.categories.forEach(function (c) { catBySlug[c.slug] = c; });

  function toolsIn(slug) {
    return (D.categoryTools[slug] || []).map(function (id) { return toolById[id]; }).filter(Boolean);
  }
  function liveFirst(list) {
    return list.filter(isLive).concat(list.filter(function (t) { return !isLive(t); }));
  }
  function isLive(t) { return t && t.status === 'live'; }
  function catUrl(slug) { return '/categories/' + slug + '/'; }
  /** Live tools link to the tool; coming-soon tools link to their card on the category page. */
  function toolHref(t) { return isLive(t) ? t.url : catUrl(t.cat) + '#' + t.id; }
  function counts(slug) {
    var list = toolsIn(slug), live = list.filter(isLive).length;
    return { total: list.length, live: live, soon: list.length - live };
  }
  function totals() {
    var live = D.tools.filter(isLive).length;
    return { total: D.tools.length, live: live, soon: D.tools.length - live };
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function soonPill() { return '<span class="ty-soon">Soon</span>'; }
  function countLabel(slug) {
    var c = counts(slug);
    if (!c.live) return c.total + ' tools · coming soon';
    return c.live + ' live' + (c.soon ? ' · ' + c.soon + ' coming soon' : '');
  }

  /* ------------------------------------------------------------------ *
   * 3. CURRENT PAGE DETECTION
   * ------------------------------------------------------------------ */
  function normPath(p) {
    return (p || '/').replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  }
  function currentPage() {
    var b = document.body, path = normPath(location.pathname);
    var tid = b && b.getAttribute('data-tool');
    if (tid && toolById[tid]) return { type: 'tool', tool: toolById[tid], cat: catBySlug[toolById[tid].cat] };
    var cs = b && b.getAttribute('data-category');
    if (cs && catBySlug[cs]) return { type: 'category', cat: catBySlug[cs] };
    for (var i = 0; i < D.tools.length; i++) {
      if (normPath(D.tools[i].url) === path) return { type: 'tool', tool: D.tools[i], cat: catBySlug[D.tools[i].cat] };
    }
    var m = path.match(/^\/categories\/([a-z0-9-]+)$/);
    if (m && catBySlug[m[1]]) return { type: 'category', cat: catBySlug[m[1]] };
    return { type: path === '/' ? 'home' : 'other' };
  }

  /* ------------------------------------------------------------------ *
   * 4. MARKUP BUILDERS
   * ------------------------------------------------------------------ */
  var ICONS = {
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    moon: '<svg class="ty-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sun: '<svg class="ty-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
  };
  var LOGO = '<a href="/" class="logo" aria-label="Toolyard home"><span class="logo-mark">&gt;_</span><span class="ty-wordmark">Tool<span class="accent">yard</span></span></a>';

  function megaToolLink(t) {
    return '<a href="' + toolHref(t) + '"' + (isLive(t) ? '' : ' class="is-soon"') + '>' +
      '<span class="cat-name">' + esc(t.name) + (isLive(t) ? '' : soonPill()) + '</span>' +
      '<span class="cat-sub">' + esc(t.desc) + '</span></a>';
  }

  function buildMega(item) {
    if (item.type === 'categories') {
      return '<div class="mega ty-mega-cats">' + D.categories.map(function (c) {
        return '<a href="' + catUrl(c.slug) + '"><span class="ty-cat-ico">' + esc(c.icon) + '</span>' +
          '<span><span class="cat-name">' + esc(c.name) + '</span><span class="cat-sub">' + esc(countLabel(c.slug)) + '</span></span></a>';
      }).join('') +
      '<div class="ty-mega-foot"><a href="/#all-tools">Browse all ' + totals().total + ' tools →</a></div></div>';
    }
    var list, foot;
    if (item.type === 'category') {
      var all = liveFirst(toolsIn(item.cat));
      list = all.slice(0, item.limit || 12);
      foot = '<a href="' + catUrl(item.cat) + '">View all ' + all.length + ' ' + esc(catBySlug[item.cat].name) + ' tools →</a>';
    } else {
      list = liveFirst((item.tools || []).map(function (id) { return toolById[id]; }).filter(Boolean));
      foot = (item.footer || []).map(function (f) {
        return '<a href="' + catUrl(f.cat) + '">All ' + esc(catBySlug[f.cat].name) + ' tools →</a>';
      }).join('');
    }
    return '<div class="mega ty-mega-tools">' + list.map(megaToolLink).join('') +
      '<div class="ty-mega-foot">' + foot + '</div></div>';
  }

  function buildHeader() {
    var nav = D.nav.map(function (item, i) {
      return '<div class="nav-item"><button type="button" aria-expanded="false" aria-haspopup="true" id="tyNav' + i + '">' +
        esc(item.label) + ' <span class="chev"></span></button>' + buildMega(item) + '</div>';
    }).join('');

    var drawerCats = D.categories.map(function (c) {
      var list = liveFirst(toolsIn(c.slug));
      return '<details class="ty-drawer-group"><summary><span class="ty-cat-ico">' + esc(c.icon) + '</span>' + esc(c.name) +
        '<span class="ty-drawer-count">' + counts(c.slug).live + '/' + list.length + '</span></summary>' +
        '<div class="ty-drawer-links">' +
        '<a href="' + catUrl(c.slug) + '" class="ty-drawer-all">Open ' + esc(c.name) + ' category →</a>' +
        list.map(function (t) {
          return '<a href="' + toolHref(t) + '"' + (isLive(t) ? '' : ' class="is-soon"') + '>' + esc(t.name) + (isLive(t) ? '' : soonPill()) + '</a>';
        }).join('') + '</div></details>';
    }).join('');

    return '' +
      '<header class="site" id="siteHeader">' +
        '<div class="wrap nav-row">' + LOGO +
          '<nav class="main-nav" id="mainNav" aria-label="Main navigation">' + nav + '</nav>' +
          '<div class="nav-right">' +
            '<button type="button" class="icon-btn ty-search-trigger" data-ty-search aria-label="Search tools">' + ICONS.search +
              '<span class="ty-search-label">Search tools</span><kbd>Ctrl K</kbd></button>' +
            '<button type="button" class="icon-btn" id="themeToggle" aria-label="Toggle dark mode">' + ICONS.moon + ICONS.sun + '</button>' +
            '<button type="button" class="icon-btn mobile-toggle" id="mobileNavToggle" aria-label="Open menu" aria-controls="mobileNavDrawer" aria-expanded="false">' + ICONS.menu + '</button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div class="mobile-nav-drawer" id="mobileNavDrawer" aria-label="Mobile navigation">' +
        '<div class="mobile-nav-head">' + LOGO +
          '<button type="button" class="icon-btn" id="closeMobileDrawer" aria-label="Close menu">✕</button></div>' +
        '<button type="button" class="ty-drawer-search" data-ty-search>' + ICONS.search + ' Search ' + totals().total + ' tools…</button>' +
        '<div class="mobile-nav-links">' +
          '<div class="mobile-nav-group-title">Categories</div>' + drawerCats +
          '<div class="mobile-nav-group-title">Toolyard</div>' +
          '<a href="/">Home</a><a href="/#all-tools">All tools</a><a href="/#faq">FAQ</a>' +
        '</div>' +
      '</div>' +
      '<div class="ty-search" id="tySearch" hidden>' +
        '<div class="ty-search-backdrop" data-ty-close></div>' +
        '<div class="ty-search-panel" role="dialog" aria-modal="true" aria-label="Search tools">' +
          '<div class="ty-search-field">' + ICONS.search +
            '<input id="tySearchInput" type="text" autocomplete="off" spellcheck="false" placeholder="Search ' + totals().total + ' tools… e.g. “json formatter”" aria-label="Search tools">' +
            '<button type="button" class="ty-esc" data-ty-close aria-label="Close search">Esc</button></div>' +
          '<div class="ty-search-results" id="tySearchResults" role="listbox"></div>' +
          '<div class="ty-search-hint"><span>↑↓ navigate</span><span>↵ open</span><span>' + totals().live + ' live · ' + totals().soon + ' coming soon</span></div>' +
        '</div>' +
      '</div>';
  }

  function buildBreadcrumbs(page) {
    var items = [{ name: 'Home', url: '/' }];
    if (page.cat) items.push({ name: page.cat.name, url: catUrl(page.cat.slug) });
    if (page.type === 'tool') items.push({ name: page.tool.name, url: page.tool.url });
    var html = items.map(function (it, i) {
      var last = i === items.length - 1;
      return (i ? '<li class="sep" aria-hidden="true">/</li>' : '') +
        (last ? '<li><span class="current" aria-current="page">' + esc(it.name) + '</span></li>'
              : '<li><a href="' + it.url + '">' + esc(it.name) + '</a></li>');
    }).join('');

    // Structured data for Google
    var ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: items.map(function (it, i) {
        return { '@type': 'ListItem', position: i + 1, name: it.name, item: location.origin + it.url };
      })
    });
    document.head.appendChild(ld);

    return '<nav class="breadcrumb-bar" aria-label="Breadcrumb"><div class="wrap"><ol class="breadcrumbs">' + html + '</ol></div></nav>';
  }

  function buildFooter() {
    var t = totals();
    var popular = D.tools.filter(function (x) { return isLive(x) && x.popular; });
    D.tools.forEach(function (x) { if (popular.length < 6 && isLive(x) && popular.indexOf(x) < 0) popular.push(x); });
    var converters = D.tools.filter(function (x) { return isLive(x) && x.badge === 'Converter' && popular.indexOf(x) < 0; }).slice(0, 6);
    function links(list) { return list.map(function (x) { return '<a href="' + x.url + '">' + esc(x.name) + '</a>'; }).join(''); }

    return '<footer class="site-footer"><div class="wrap"><div class="foot-grid">' +
      '<div class="foot-brand">' + LOGO.replace('class="accent"', 'class="accent" style="color:var(--amber);"') +
        '<p>A free developer &amp; web utility toolkit. Format, convert, validate and generate code — everything runs in your browser, nothing is uploaded.</p></div>' +
      '<div class="foot-col"><h4>Categories</h4>' + D.categories.map(function (c) {
        return '<a href="' + catUrl(c.slug) + '">' + esc(c.name) + '</a>';
      }).join('') + '</div>' +
      '<div class="foot-col"><h4>Popular tools</h4>' + links(popular.slice(0, 6)) + '</div>' +
      '<div class="foot-col"><h4>Converters</h4>' + links(converters) + '</div>' +
      '<div class="foot-col"><h4>Toolyard</h4>' +
        '<a href="/">Home</a><a href="/#all-tools">All tools</a><a href="/#categories">Browse categories</a><a href="/#faq">FAQ</a>' +
        '<button type="button" class="ty-foot-search" data-ty-search>Search tools</button></div>' +
      '</div><div class="foot-bottom">' +
        '<span>© ' + new Date().getFullYear() + ' Toolyard. All tools run client-side.</span>' +
        '<span class="mono">' + t.live + ' live tools · ' + t.soon + ' coming soon · 100% private</span>' +
      '</div></div></footer>';
  }

  function replacePlaceholder(id, html) {
    var el = document.getElementById(id);
    if (!el) return false;
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    el.replaceWith(tpl.content);
    return true;
  }

  /* ------------------------------------------------------------------ *
   * 5. SEARCH (shared by header dialog, homepage hero, etc.)
   * ------------------------------------------------------------------ */
  function searchTools(q, limit) {
    q = (q || '').toLowerCase().trim();
    limit = limit || 10;
    if (!q) return liveFirst(D.tools.filter(function (t) { return t.popular; })).concat(D.tools.filter(isLive)).filter(function (t, i, a) { return a.indexOf(t) === i; }).slice(0, limit);
    var words = q.split(/\s+/);
    var scored = [];
    D.tools.forEach(function (t) {
      var name = t.name.toLowerCase(), hay = (name + ' ' + t.desc + ' ' + t.badge + ' ' + catBySlug[t.cat].name + ' ' + t.id.replace(/-/g, ' ')).toLowerCase();
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        if (hay.indexOf(words[i]) < 0) return;
        if (name.indexOf(words[i]) === 0) score += 6;
        else if (name.indexOf(' ' + words[i]) >= 0) score += 4;
        else if (name.indexOf(words[i]) >= 0) score += 3;
        else score += 1;
      }
      if (name === q) score += 20;
      if (isLive(t)) score += 2.5;
      scored.push({ t: t, s: score });
    });
    scored.sort(function (a, b) { return b.s - a.s || a.t.name.localeCompare(b.t.name); });
    return scored.slice(0, limit).map(function (x) { return x.t; });
  }

  /**
   * Wire an <input> to a results container.
   * opts.onOpen(): called when results show (optional) ; opts.limit
   */
  function bindSearch(input, results, opts) {
    opts = opts || {};
    var active = -1, current = [];
    function render() {
      current = searchTools(input.value, opts.limit || 10);
      active = current.length ? 0 : -1;
      if (!current.length) {
        results.innerHTML = '<div class="ty-sr-empty">No tools match “' + esc(input.value) + '”. Try “json”, “css”, “seo” or “base64”.</div>';
      } else {
        results.innerHTML = (input.value.trim() ? '' : '<div class="ty-sr-label">Popular tools</div>') + current.map(function (t, i) {
          return '<a class="ty-sr-item' + (i === 0 ? ' active' : '') + (isLive(t) ? '' : ' is-soon') + '" role="option" href="' + toolHref(t) + '" data-i="' + i + '">' +
            '<span class="ty-sr-main"><span class="ty-sr-name">' + esc(t.name) + '</span><span class="ty-sr-desc">' + esc(t.desc) + '</span></span>' +
            '<span class="ty-sr-meta">' + esc(catBySlug[t.cat].name) + (isLive(t) ? '' : soonPill()) + '</span></a>';
        }).join('');
      }
      results.classList.add('open');
      if (opts.onOpen) opts.onOpen();
    }
    function setActive(i) {
      var items = results.querySelectorAll('.ty-sr-item');
      if (!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach(function (el, k) { el.classList.toggle('active', k === active); });
      items[active].scrollIntoView({ block: 'nearest' });
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (!results.classList.contains('open')) render();
        if (current[active]) location.href = toolHref(current[active]);
      }
    });
    results.addEventListener('mousemove', function (e) {
      var item = e.target.closest('.ty-sr-item');
      if (item) setActive(+item.getAttribute('data-i'));
    });
    return { render: render, go: function () { if (!current.length) render(); if (current[active]) location.href = toolHref(current[active]); } };
  }

  function openSearch(prefill) {
    var dlg = document.getElementById('tySearch'), input = document.getElementById('tySearchInput');
    if (!dlg) return;
    closeMenus(); closeDrawer();
    dlg.hidden = false;
    document.documentElement.classList.add('ty-no-scroll');
    if (typeof prefill === 'string') input.value = prefill;
    input.focus(); input.select();
    input.dispatchEvent(new Event('input'));
  }
  function closeSearch() {
    var dlg = document.getElementById('tySearch');
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true;
    document.documentElement.classList.remove('ty-no-scroll');
  }

  /* ------------------------------------------------------------------ *
   * 6. INTERACTIONS (menus, drawer, theme, keyboard)
   * ------------------------------------------------------------------ */
  function closeMenus(except) {
    document.querySelectorAll('#mainNav .nav-item.open').forEach(function (it) {
      if (it === except) return;
      it.classList.remove('open');
      var b = it.querySelector('button'); if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function closeDrawer() {
    var d = document.getElementById('mobileNavDrawer');
    if (d && d.classList.contains('open')) {
      d.classList.remove('open');
      document.documentElement.classList.remove('ty-no-scroll');
      var t = document.getElementById('mobileNavToggle'); if (t) t.setAttribute('aria-expanded', 'false');
    }
  }
  /** keep a mega menu inside the viewport */
  function fitMega(item) {
    var mega = item.querySelector('.mega');
    if (!mega) return;
    mega.style.left = ''; mega.style.transform = '';
    var r = mega.getBoundingClientRect(), pad = 12;
    if (r.right > window.innerWidth - pad) {
      mega.style.transform = 'translateX(calc(-50% - ' + Math.ceil(r.right - window.innerWidth + pad) + 'px))';
    } else if (r.left < pad) {
      mega.style.transform = 'translateX(calc(-50% + ' + Math.ceil(pad - r.left) + 'px))';
    }
  }

  function bindChrome() {
    var nav = document.getElementById('mainNav');
    if (nav) {
      nav.querySelectorAll('.nav-item > button').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var item = btn.parentElement, open = !item.classList.contains('open');
          closeMenus(item);
          item.classList.toggle('open', open);
          btn.setAttribute('aria-expanded', String(open));
          if (open) fitMega(item);
        });
      });
    }
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#mainNav .nav-item')) closeMenus();
      var trig = e.target.closest('[data-ty-search]');
      if (trig) { e.preventDefault(); openSearch(); }
      if (e.target.closest('[data-ty-close]')) closeSearch();
    });

    var theme = document.getElementById('themeToggle');
    if (theme) theme.addEventListener('click', function () {
      setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    var drawer = document.getElementById('mobileNavDrawer'),
        openBtn = document.getElementById('mobileNavToggle'),
        closeBtn = document.getElementById('closeMobileDrawer');
    if (drawer && openBtn) openBtn.addEventListener('click', function () {
      drawer.classList.add('open');
      document.documentElement.classList.add('ty-no-scroll');
      openBtn.setAttribute('aria-expanded', 'true');
      var cur = currentPage();
      if (cur.cat) {
        drawer.querySelectorAll('.ty-drawer-group').forEach(function (g) {
          if (g.querySelector('a[href="' + catUrl(cur.cat.slug) + '"]')) g.open = true;
        });
      }
    });
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (drawer) drawer.addEventListener('click', function (e) { if (e.target.closest('a')) closeDrawer(); });

    var si = document.getElementById('tySearchInput'), sr = document.getElementById('tySearchResults');
    if (si && sr) bindSearch(si, sr, { limit: 12 });

    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openSearch(); }
      else if (e.key === '/' && !typing) { e.preventDefault(); openSearch(); }
      else if (e.key === 'Escape') { closeSearch(); closeMenus(); closeDrawer(); }
    });

    // Highlight the current section in the nav
    var cur = currentPage();
    if (cur.cat && nav) {
      D.nav.forEach(function (item, i) {
        var match = (item.type === 'category' && item.cat === cur.cat.slug) ||
                    (item.type === 'tools' && (item.footer || []).some(function (f) { return f.cat === cur.cat.slug; }));
        if (match) { var b = document.getElementById('tyNav' + i); if (b) b.classList.add('is-current'); }
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * 7. CATEGORY PAGE RENDERER
   *    Needs: <body data-category="slug"> and <div id="categoryTools"></div>
   * ------------------------------------------------------------------ */
  function toolCard(t, opts) {
    opts = opts || {};
    var showCat = opts.showCat ? '<span class="cat-pill">' + esc(catBySlug[t.cat].name) + '</span>' : '';
    if (isLive(t)) {
      return '<a class="tool-card" id="' + t.id + '" href="' + t.url + '" data-status="live">' +
        '<div class="top-row"><span class="badge">' + esc(t.badge) + '</span><span class="status-pill status-live">Live</span></div>' +
        '<h3>' + esc(t.name) + '</h3><p>' + esc(t.desc) + '</p>' + showCat +
        '<span class="open">Open tool →</span></a>';
    }
    return '<div class="tool-card is-soon" id="' + t.id + '" data-status="soon" aria-disabled="true">' +
      '<div class="top-row"><span class="badge">' + esc(t.badge) + '</span><span class="status-pill status-soon">Coming soon</span></div>' +
      '<h3>' + esc(t.name) + '</h3><p>' + esc(t.desc) + '</p>' + showCat +
      '<span class="open ty-soon-label">Coming soon</span></div>';
  }

  function renderCategoryPage(page) {
    var mount = document.getElementById('categoryTools');
    if (!mount || !page.cat) return;
    var slug = page.cat.slug, list = toolsIn(slug), c = counts(slug);

    document.querySelectorAll('[data-ty-count]').forEach(function (el) {
      var k = el.getAttribute('data-ty-count');
      if (k in c) el.textContent = c[k];
    });

    mount.innerHTML = liveFirst(list).map(function (t) { return toolCard(t); }).join('');

    var filter = document.getElementById('categoryFilter'), chips = document.querySelectorAll('[data-ty-filter]'),
        empty = document.getElementById('categoryEmpty'), mode = 'all';
    function apply() {
      var q = filter ? filter.value.toLowerCase().trim() : '', shown = 0;
      mount.querySelectorAll('.tool-card').forEach(function (card) {
        var text = card.textContent.toLowerCase();
        var ok = (!q || text.indexOf(q) >= 0) && (mode === 'all' || card.getAttribute('data-status') === mode);
        card.hidden = !ok; if (ok) shown++;
      });
      if (empty) {
        empty.hidden = shown > 0;
        empty.textContent = (mode === 'live' && !q && !c.live)
          ? 'No live tools in ' + page.cat.name + ' yet — all ' + c.total + ' are coming soon. Check back shortly!'
          : 'No tools match your filter.';
      }
    }
    if (filter) filter.addEventListener('input', apply);
    chips.forEach(function (chip) {
      var k = chip.getAttribute('data-ty-filter');
      var n = k === 'all' ? c.total : k === 'live' ? c.live : c.soon;
      var cnt = chip.querySelector('.n'); if (cnt) cnt.textContent = n;
      chip.addEventListener('click', function () {
        mode = k;
        chips.forEach(function (x) { x.classList.toggle('active', x === chip); x.setAttribute('aria-pressed', String(x === chip)); });
        apply();
      });
    });

    var others = document.getElementById('otherCategories');
    if (others) {
      others.innerHTML = D.categories.filter(function (x) { return x.slug !== slug; }).map(function (x) {
        return '<a class="qc-item" href="' + catUrl(x.slug) + '"><span class="ico">' + esc(x.icon) + '</span>' + esc(x.name) +
          '<span class="ty-qc-count">' + counts(x.slug).total + '</span></a>';
      }).join('');
    }

    // Jump to a tool card from /categories/x/#tool-id
    function focusHash() {
      var id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      var card = document.getElementById(id);
      if (!card || !mount.contains(card)) return;
      mount.querySelectorAll('.is-target').forEach(function (x) { x.classList.remove('is-target'); });
      card.hidden = false;
      card.classList.add('is-target');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    focusHash();
    window.addEventListener('hashchange', focusHash);
  }

  /* ------------------------------------------------------------------ *
   * 8. BOOT
   * ------------------------------------------------------------------ */
  function init() {
    var page = currentPage();
    replacePlaceholder('site-header', buildHeader());
    if (page.type === 'tool' || page.type === 'category') replacePlaceholder('site-breadcrumbs', buildBreadcrumbs(page));
    else replacePlaceholder('site-breadcrumbs', '');
    replacePlaceholder('site-footer', buildFooter());
    bindChrome();
    initWorkspaces();
    if (page.type === 'category') renderCategoryPage(page);
    document.documentElement.classList.add('ty-ready');
  }

  /* ---------------------------------------------------------------------
     Workspace: Wrap toggles for editor boxes (.tool-grid.ty-ed)
     - Default: wrap on. data-wrap="off" on a box makes it default to off.
     - The user's choice is remembered per tool and per box (localStorage).
     - Only changes how text is displayed — never the text itself.
     --------------------------------------------------------------------- */
  function initWorkspaces() {
    var grids = document.querySelectorAll('.tool-workspace .tool-grid.ty-ed');
    if (!grids.length) return;
    var tool = document.body.getAttribute('data-tool') || normPath(location.pathname);
    function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function save(key, v) { try { localStorage.setItem(key, v); } catch (e) { /* private mode */ } }

    function headerActions(head) {
      var acts = null, kids = head.children;
      for (var i = 0; i < kids.length; i++) if (kids[i].classList.contains('actions')) { acts = kids[i]; break; }
      if (acts) return acts;
      acts = document.createElement('div');
      acts.className = 'actions';
      // keep any badge/hint that sat on the right side of the header next to the new button
      var extras = [];
      for (var j = 0; j < kids.length; j++) if (!kids[j].classList.contains('title') && kids[j].tagName === 'SPAN') extras.push(kids[j]);
      extras.forEach(function (x) { acts.appendChild(x); });
      head.appendChild(acts);
      return acts;
    }

    function addToggle(box, head, idx) {
      if (!head || box.getAttribute('data-ty-wrap-ready')) return;
      box.setAttribute('data-ty-wrap-ready', '1');
      var key = 'ty-wrap:' + tool + ':' + (box.id || ('box' + idx));
      var stored = load(key);
      var on = stored === null ? box.getAttribute('data-wrap') !== 'off' : stored === '1';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-ghost ty-wrap-btn';
      btn.textContent = 'Wrap';
      if (box.id) btn.setAttribute('aria-controls', box.id);
      function apply() {
        box.classList.toggle('ty-nowrap', !on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.title = on ? 'Long lines wrap — click to scroll sideways instead' : 'Long lines scroll sideways — click to wrap them';
      }
      btn.addEventListener('click', function () { on = !on; apply(); save(key, on ? '1' : '0'); });
      apply();
      var acts = headerActions(head), firstBtn = null;
      for (var k = 0; k < acts.children.length; k++) { var ch = acts.children[k]; if (ch.tagName === 'BUTTON' || ch.tagName === 'A' || ch.tagName === 'LABEL') { firstBtn = ch; break; } }
      acts.insertBefore(btn, firstBtn);   // after any label/badge, before the other buttons
      // hide the toggle while its box is hidden (e.g. Base64 file mode)
      btn.hidden = box.hidden;
      if (window.MutationObserver) new MutationObserver(function () { btn.hidden = box.hidden; }).observe(box, { attributes: true, attributeFilter: ['hidden'] });
    }

    var idx = 0;
    Array.prototype.forEach.call(grids, function (grid) {
      Array.prototype.forEach.call(grid.children, function (pane) {
        if (!pane.classList.contains('tool-pane')) return;
        var head = null;
        Array.prototype.forEach.call(pane.children, function (c) {
          if (c.classList.contains('tool-pane-header')) { if (!head) head = c; return; }
          if (c.matches('textarea.tool-textarea, .tool-output-box')) addToggle(c, head, idx++);
          // result boxes that aren't form fields: focusable so the keyboard can scroll them
          if (c.matches('.tool-output-box, .table-container, .ty-scroll, .ty-jres') && !c.hasAttribute('tabindex')) {
            c.setAttribute('tabindex', '0');
            c.setAttribute('data-ty-scroll', '');
            if (!c.hasAttribute('aria-label') && head) {
              var t = head.querySelector('.title');
              c.setAttribute('aria-label', ((t ? t.textContent : head.textContent) || 'Output').trim());
            }
          }
        });
      });
    });
  }

  // Public API (used by the homepage and future tool pages)
  window.Toolyard = {
    data: D,
    tool: function (id) { return toolById[id]; },
    category: function (slug) { return catBySlug[slug]; },
    toolsIn: toolsIn,
    liveFirst: liveFirst,
    isLive: isLive,
    toolHref: toolHref,
    catUrl: catUrl,
    counts: counts,
    totals: totals,
    countLabel: countLabel,
    toolCard: toolCard,
    escape: esc,
    search: searchTools,
    bindSearch: bindSearch,
    openSearch: openSearch,
    setTheme: setTheme
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
