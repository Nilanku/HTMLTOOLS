/*!
 * Toolyard — tool-kit.js
 * Shared, tested helpers for tool pages: performance guards, safe output,
 * clipboard, downloads, file reading, encoding and background workers.
 * Exposes a single global: window.TK
 *
 * Performance & memory rules baked in here:
 *  - debounce(): process after the user pauses typing, not on every keystroke
 *  - autoRun(): size guard — very large input switches to manual "Run" mode
 *  - setOutput(): large results are previewed (DOM stays fast); copy/download use the full text
 *  - download(): object URLs are revoked right after use (no memory leak)
 *  - runWorker(): heavy/untrusted work runs off the main thread with a hard timeout
 *  - All text output uses textContent/value — never innerHTML with user data (XSS-safe)
 */
(function () {
  'use strict';

  var TK = {};

  /** getElementById shortcut */
  TK.$ = function (id) { return document.getElementById(id); };

  /** Escape text for safe insertion into HTML strings */
  TK.escape = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /** Run fn only after `ms` without new calls (typing pause) */
  TK.debounce = function (fn, ms) {
    var t = null;
    function d() {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { t = null; fn.apply(self, args); }, ms);
    }
    d.cancel = function () { clearTimeout(t); t = null; };
    return d;
  };

  /** Human readable byte size */
  TK.formatBytes = function (n) {
    if (!n) return '0 B';
    var u = ['B', 'KB', 'MB', 'GB'], i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), u.length - 1);
    return (n / Math.pow(1024, i)).toFixed(i ? (n / Math.pow(1024, i) < 10 ? 2 : 1) : 0) + ' ' + u[i];
  };
  TK.formatNumber = function (n) { return Number(n).toLocaleString(); };

  /* ------------------------------------------------------------------ *
   * TEXT <-> BYTES (UTF-8 correct, emoji safe)
   * ------------------------------------------------------------------ */
  var enc = new TextEncoder();
  TK.utf8Bytes = function (str) { return enc.encode(str); };
  TK.byteLength = function (str) { return enc.encode(str).length; };

  /** Decode bytes as UTF-8. Returns {ok, text}. ok=false if bytes are not valid UTF-8 (binary data). */
  TK.bytesToText = function (bytes, label) {
    try {
      return { ok: true, text: new TextDecoder(label || 'utf-8', { fatal: true }).decode(bytes) };
    } catch (e) {
      return { ok: false, text: new TextDecoder(label || 'utf-8').decode(bytes) };
    }
  };

  /** Uint8Array -> Base64 (chunked: no call-stack overflow on large data) */
  TK.bytesToBase64 = function (bytes) {
    var CHUNK = 0x8000 * 3, parts = [];   // multiple of 3 so chunks concatenate without padding
    for (var i = 0; i < bytes.length; i += CHUNK) {
      var sub = bytes.subarray(i, i + CHUNK), bin = '';
      for (var j = 0; j < sub.length; j += 0x8000) {
        bin += String.fromCharCode.apply(null, sub.subarray(j, j + 0x8000));
      }
      parts.push(btoa(bin));
    }
    return parts.join('');
  };

  /**
   * Base64 / Base64URL -> Uint8Array.
   * Accepts whitespace, line breaks, missing padding, URL-safe alphabet and data: URI prefixes.
   * Throws Error with a helpful message (and .position) on invalid input.
   */
  TK.base64ToBytes = function (input) {
    var s = String(input).trim();
    var m = s.match(/^data:([^;,]*)(;[^,]*)?,/i);
    if (m) s = s.slice(m[0].length);
    s = s.replace(/\s+/g, '');
    var bad = s.search(/[^A-Za-z0-9+/\-_=]/);
    if (bad >= 0) {
      var err = new Error('Invalid character "' + s[bad] + '" at position ' + (bad + 1) + '. Base64 only uses A–Z, a–z, 0–9, +, / (or - and _ for URL-safe) and = padding.');
      err.position = bad; throw err;
    }
    var firstPad = s.indexOf('=');
    if (firstPad >= 0 && /[^=]/.test(s.slice(firstPad))) {
      var e2 = new Error('Padding "=" can only appear at the end of Base64 data (found at position ' + (firstPad + 1) + ').');
      e2.position = firstPad; throw e2;
    }
    s = s.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    if (s.length % 4 === 1) throw new Error('Invalid Base64 length — the data looks truncated (one character too many or missing).');
    while (s.length % 4) s += '=';
    var out = new Uint8Array(Math.floor(s.length * 3 / 4) - (s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0));
    var CHUNK = 0x10000, o = 0;   // multiple of 4
    for (var i = 0; i < s.length; i += CHUNK) {
      var bin = atob(s.slice(i, i + CHUNK));
      for (var k = 0; k < bin.length; k++) out[o++] = bin.charCodeAt(k);
    }
    return out;
  };

  /** Detect common binary file types from magic bytes */
  TK.sniffMime = function (b) {
    function at(sig, off) { off = off || 0; for (var i = 0; i < sig.length; i++) if (b[off + i] !== sig[i]) return false; return true; }
    if (b.length < 4) return null;
    if (at([0x89, 0x50, 0x4E, 0x47])) return { mime: 'image/png', ext: 'png', label: 'PNG image' };
    if (at([0xFF, 0xD8, 0xFF])) return { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG image' };
    if (at([0x47, 0x49, 0x46, 0x38])) return { mime: 'image/gif', ext: 'gif', label: 'GIF image' };
    if (at([0x52, 0x49, 0x46, 0x46]) && at([0x57, 0x45, 0x42, 0x50], 8)) return { mime: 'image/webp', ext: 'webp', label: 'WebP image' };
    if (at([0x42, 0x4D])) return { mime: 'image/bmp', ext: 'bmp', label: 'BMP image' };
    if (at([0x00, 0x00, 0x01, 0x00])) return { mime: 'image/x-icon', ext: 'ico', label: 'ICO icon' };
    if (at([0x25, 0x50, 0x44, 0x46])) return { mime: 'application/pdf', ext: 'pdf', label: 'PDF document' };
    if (at([0x50, 0x4B, 0x03, 0x04])) return { mime: 'application/zip', ext: 'zip', label: 'ZIP archive (or DOCX/XLSX)' };
    if (at([0x1F, 0x8B])) return { mime: 'application/gzip', ext: 'gz', label: 'GZIP archive' };
    if (at([0x77, 0x4F, 0x46, 0x32]) || at([0x77, 0x4F, 0x46, 0x46])) return { mime: 'font/woff2', ext: 'woff2', label: 'WOFF font' };
    if (at([0x49, 0x44, 0x33]) || at([0xFF, 0xFB])) return { mime: 'audio/mpeg', ext: 'mp3', label: 'MP3 audio' };
    if (at([0x66, 0x74, 0x79, 0x70], 4)) return { mime: 'video/mp4', ext: 'mp4', label: 'MP4 video' };
    return null;
  };

  /* ------------------------------------------------------------------ *
   * OUTPUT, STATUS, CLIPBOARD, DOWNLOAD
   * ------------------------------------------------------------------ */
  var PREVIEW_LIMIT = 500000; // chars rendered into the DOM; full text kept for copy/download

  /**
   * Put text into an output <textarea>/<pre>. Very large text is previewed (truncated)
   * so the page never freezes; the full value is kept on el._full for copy/download.
   * Returns true if truncated.
   */
  TK.setOutput = function (el, text, opts) {
    opts = opts || {};
    text = text == null ? '' : String(text);
    el._full = text;
    var truncated = text.length > PREVIEW_LIMIT;
    var shown = truncated ? text.slice(0, PREVIEW_LIMIT) : text;
    if ('value' in el && el.tagName !== 'PRE' && el.tagName !== 'DIV') el.value = shown; else el.textContent = shown;
    el.classList.toggle('is-empty', !text);
    var note = opts.noteEl;
    if (note) {
      note.hidden = !truncated;
      if (truncated) note.textContent = 'Large output (' + TK.formatNumber(text.length) + ' characters) — showing the first ' +
        TK.formatNumber(PREVIEW_LIMIT) + '. Copy and Download include the full result.';
    }
    return truncated;
  };
  /** Full value of an output element (even if the preview was truncated) */
  TK.getOutput = function (el) { return el._full != null ? el._full : ('value' in el ? el.value : el.textContent); };

  /** Show a status message. type: 'ok' | 'error' | 'warn' | 'info'. Empty msg hides it. */
  TK.status = function (el, msg, type) {
    if (!el) return;
    el.hidden = !msg;
    el.className = 'ty-alert' + (type ? ' ty-alert-' + type : '');
    el.textContent = msg || '';
  };

  /** Brief button feedback ("Copied!") without stacking timers */
  function flash(btn, label) {
    if (!btn) return;
    if (!btn._orig) btn._orig = btn.textContent;
    clearTimeout(btn._t);
    btn.textContent = label;
    btn._t = setTimeout(function () { btn.textContent = btn._orig; btn._t = null; }, 1400);
  }
  TK.flash = flash;

  /** Copy text to clipboard (with fallback for older browsers / insecure contexts) */
  TK.copy = function (text, btn) {
    if (!text) { flash(btn, 'Nothing to copy'); return Promise.resolve(false); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();   // remove the temporary node so it can be garbage-collected
      flash(btn, ok ? 'Copied!' : 'Copy failed');
      return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { flash(btn, 'Copied!'); return true; }, fallback);
    }
    return Promise.resolve(fallback());
  };

  /** Download text or bytes as a file. The object URL is revoked immediately after the click. */
  TK.download = function (data, filename, mime, btn) {
    if (data == null || data.length === 0) { flash(btn, 'Nothing to download'); return; }
    var blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename || 'download.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    flash(btn, 'Downloaded');
  };

  /**
   * Manage a single preview object URL (e.g. an <img> preview) — the previous URL is
   * always revoked before a new one is created, so previews never leak memory.
   */
  TK.objectUrlSlot = function () {
    var url = null;
    return {
      set: function (blob) { this.clear(); url = URL.createObjectURL(blob); return url; },
      clear: function () { if (url) { URL.revokeObjectURL(url); url = null; } }
    };
  };

  /** Read a File as 'text' | 'arrayBuffer' | 'dataURL' → Promise */
  TK.readFile = function (file, as) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); r.onload = r.onerror = null; };
      r.onerror = function () { reject(r.error || new Error('Could not read file')); r.onload = r.onerror = null; };
      if (as === 'arrayBuffer') r.readAsArrayBuffer(file);
      else if (as === 'dataURL') r.readAsDataURL(file);
      else r.readAsText(file);
    });
  };

  /**
   * Wire a drop zone + file input. onFile(file) is called once per chosen file.
   * opts.maxBytes rejects files that are too large (onError(msg)).
   */
  TK.fileDrop = function (zone, input, onFile, opts) {
    opts = opts || {};
    function take(file) {
      if (!file) return;
      if (opts.maxBytes && file.size > opts.maxBytes) {
        (opts.onError || alert)('“' + file.name + '” is ' + TK.formatBytes(file.size) + '. The maximum is ' + TK.formatBytes(opts.maxBytes) + ' to keep your browser responsive.');
        return;
      }
      onFile(file);
    }
    if (input) input.addEventListener('change', function () { take(input.files[0]); input.value = ''; });
    if (zone) {
      ['dragenter', 'dragover'].forEach(function (ev) {
        zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('is-drag'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('is-drag'); });
      });
      zone.addEventListener('drop', function (e) { take(e.dataTransfer.files[0]); });
    }
  };

  /* ------------------------------------------------------------------ *
   * AUTO-RUN WITH SIZE GUARD
   * ------------------------------------------------------------------ */
  /**
   * Live processing that stays fast:
   *  - runs `run()` after a typing pause (default 250 ms)
   *  - if input is larger than maxAuto chars, live mode pauses and `onLarge(true)` is called
   *    so the page can show "Large input — click Run". Call the returned trigger() to force a run.
   * opts: { input, run, delay, maxAuto, onLarge, also: [elements whose 'change' should re-run] }
   */
  TK.autoRun = function (opts) {
    var delay = opts.delay == null ? 250 : opts.delay, max = opts.maxAuto || 1000000, large = false;
    var deb = TK.debounce(function () { opts.run(); }, delay);
    function check() {
      var isLarge = opts.input.value.length > max;
      if (isLarge !== large) { large = isLarge; if (opts.onLarge) opts.onLarge(large); }
      if (!large) deb();
    }
    opts.input.addEventListener('input', check);
    (opts.also || []).forEach(function (el) { el.addEventListener('change', function () { large ? null : deb(); }); });
    return {
      trigger: function () { deb.cancel(); opts.run(); },
      check: check,
      isLarge: function () { return large; }
    };
  };

  /* ------------------------------------------------------------------ *
   * BACKGROUND WORKER WITH TIMEOUT
   * ------------------------------------------------------------------ */
  /**
   * Run a pure function in a Web Worker so heavy or untrusted work can't freeze the page.
   * fn must be self-contained (no outer variables): function (data) { return result; }  (may return a Promise)
   * Resolves with the result, rejects on error or timeout (the worker is terminated either way).
   */
  TK.runWorker = function (fn, data, timeoutMs) {
    return new Promise(function (resolve, reject) {
      // fn may return a value or a Promise (async work such as crypto.subtle)
      var src = 'self.onmessage=function(e){var fail=function(err){self.postMessage({ok:false,e:String(err&&err.message||err)});};' +
        'try{Promise.resolve((' + fn.toString() + ')(e.data)).then(function(r){self.postMessage({ok:true,r:r});},fail);}catch(err){fail(err);}};';
      var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      var w = new Worker(url), done = false;
      URL.revokeObjectURL(url);
      var timer = setTimeout(function () { finish(); reject(new Error('timeout')); }, timeoutMs || 3000);
      function finish() { if (done) return; done = true; clearTimeout(timer); w.terminate(); }
      w.onmessage = function (e) { finish(); e.data.ok ? resolve(e.data.r) : reject(new Error(e.data.e)); };
      w.onerror = function (e) { finish(); reject(new Error(e.message || 'Worker error')); };
      w.postMessage(data);
    });
  };

  /* ------------------------------------------------------------------ *
   * PAGE HELPERS
   * ------------------------------------------------------------------ */
  /** FAQ accordion (one open at a time) for tool pages */
  TK.initFaq = function (root) {
    root = root || document;
    root.querySelectorAll('.faq-item > button').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var item = btn.parentElement, open = !item.classList.contains('open');
        root.querySelectorAll('.faq-item.open').forEach(function (i) {
          i.classList.remove('open'); i.querySelector('button').setAttribute('aria-expanded', 'false');
        });
        if (open) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  };

  /** Segmented control: <div class="ty-seg"><button data-value="a">… ; calls onChange(value) */
  TK.segmented = function (el, onChange) {
    var btns = el.querySelectorAll('button[data-value]');
    function set(v, silent) {
      btns.forEach(function (b) { var on = b.getAttribute('data-value') === v; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
      el.setAttribute('data-value', v);
      if (!silent && onChange) onChange(v);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-value')); }); });
    var init = el.querySelector('button.active') || btns[0];
    if (init) set(init.getAttribute('data-value'), true);
    return { set: set, get: function () { return el.getAttribute('data-value'); } };
  };

  window.TK = TK;
})();
