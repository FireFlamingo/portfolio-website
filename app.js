/* Amogh Toshniwal — portfolio interactions (flattened, vanilla JS, no framework).
   Loaded with `defer`, so the DOM is fully parsed when this runs. */
(function () {
  'use strict';

  // Always open at the top on (re)load; strip any leftover #hash.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);

  // ── Element refs ────────────────────────────────────────────────
  var root        = document.getElementById('top');
  var canvas      = document.getElementById('flux');
  var progressEl  = document.getElementById('progress');
  var workWrap    = document.getElementById('work');
  var track       = document.getElementById('proj-track');
  var projProgress= document.getElementById('proj-progress');
  var projCount   = document.getElementById('proj-count');
  var awardsWrap  = document.getElementById('awards');
  var socialRow   = document.getElementById('social-row');
  var discWrap    = document.getElementById('arsenal');
  var discRow1    = document.getElementById('disc-row-1');
  var discRow2    = document.getElementById('disc-row-2');

  // ── State ───────────────────────────────────────────────────────
  var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
  var smoothY = 0, revealList = [], wipeList = [], heroEl = null;
  var projExtra = 0, awardsPage = -1, t0 = 0, st = false;
  var ctx = null, W = 0, H = 0, raf = 0;
  var socialEls = [], socialDone = false, discExtra = 1;
  var awardLeftEls = [], awardRightEls = [], awardCountEl = null;
  var menuOverlay = null, menuBtn = null, menuOpen = false;

  // ── Canvas (flux background) ────────────────────────────────────
  function initCanvas() { if (!canvas) return; ctx = canvas.getContext('2d'); sizeCanvas(); }
  function sizeCanvas() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawFlux(c, t) {
    var lines = 30, step = 13, mx = mouse.x, my = mouse.y, active = mouse.active;
    for (var li = 0; li < lines; li++) {
      var baseY = (li / (lines - 1)) * (H + 120) - 60;
      c.beginPath();
      var first = true;
      for (var x = -20; x <= W + 20; x += step) {
        var w1 = Math.sin(x * 0.006 + t * 0.48 + li * 0.52) * 11;
        var w2 = Math.sin(x * 0.014 - t * 0.31 + li * 0.88) * 6;
        var y = baseY + w1 + w2;
        if (active) {
          var dx = x - mx, dy = baseY - my;
          y -= Math.exp(-(dx * dx + dy * dy) / (155 * 155)) * 36;
        }
        first ? c.moveTo(x, y) : c.lineTo(x, y);
        first = false;
      }
      var prox = 0;
      if (active) { var d = Math.abs(baseY - my); if (d < 130) prox = 1 - d / 130; }
      c.lineWidth = 1;
      c.strokeStyle = prox > 0
        ? 'rgba(141,206,224,' + (0.055 + prox * 0.26) + ')'
        : 'rgba(233,236,239,0.042)';
      c.stroke();
    }
  }

  // ── Hero parallax + fade ────────────────────────────────────────
  function tickHero() {
    if (!heroEl) return;
    var sy = smoothY, vh = window.innerHeight;
    var fade = Math.max(0, 1 - sy / (vh * 1.6));
    heroEl.style.transform = 'translateY(' + (sy * 0.28) + 'px)';
    heroEl.style.opacity = String(fade.toFixed(3));
  }

  // ── Horizontal projects ─────────────────────────────────────────
  function setupHorizontal() {
    if (!workWrap || !track) return;
    var extra = Math.max(0, track.scrollWidth - window.innerWidth);
    projExtra = extra;
    workWrap.style.height = (window.innerHeight + extra) + 'px';
  }
  function tickHorizontal() {
    if (window.innerWidth <= 860) return;
    if (!workWrap || !track || !projExtra) return;
    var rect = workWrap.getBoundingClientRect();
    var scrolled = Math.max(0, Math.min(projExtra, -rect.top));
    track.style.transform = 'translateX(' + (-scrolled) + 'px)';
    var prog = scrolled / projExtra;
    if (projProgress) projProgress.style.width = (prog * 100).toFixed(2) + '%';
    if (projCount) {
      var introW = window.innerWidth * 0.36;
      if (scrolled < introW) { projCount.textContent = '01 / 02'; }
      else {
        var projW = window.innerWidth * 0.70;
        var idx = Math.min(2, Math.floor((scrolled - introW) / projW) + 1);
        projCount.textContent = '0' + idx + ' / 02';
      }
    }
  }

  // ── Reveals ─────────────────────────────────────────────────────
  function setupReveal() {
    if (!root) return;
    heroEl = root.querySelector('[data-hero-content]');
    revealList = Array.prototype.slice.call(root.querySelectorAll('[data-reveal]')).map(function (el) {
      el.style.willChange = 'opacity, transform'; return { el: el, done: false };
    });
    wipeList = Array.prototype.slice.call(root.querySelectorAll('[data-wipe]')).map(function (el) {
      el.style.willChange = 'transform'; return { el: el, done: false };
    });
  }
  function tickReveal() {
    var vh = window.innerHeight, trigger = vh * 0.87, i, r, w, top, parent;
    for (i = 0; i < revealList.length; i++) {
      r = revealList[i]; if (r.done) continue;
      top = r.el.getBoundingClientRect().top;
      if (top < -vh) { r.el.style.opacity = '1'; r.el.style.transform = 'none'; r.done = true; continue; }
      if (top < trigger) { r.el.style.opacity = '1'; r.el.style.transform = 'translateY(0)'; r.done = true; }
    }
    for (i = 0; i < wipeList.length; i++) {
      w = wipeList[i]; if (w.done) continue;
      parent = w.el.parentElement; if (!parent) continue;
      if (parent.getBoundingClientRect().top < trigger) { w.el.style.transform = 'translateY(0)'; w.done = true; }
    }
  }

  // ── Awards split-screen ─────────────────────────────────────────
  function setupAwards() {
    if (!root || !awardsWrap) return;
    awardsWrap.style.height = (window.innerHeight * 5) + 'px';
    awardLeftEls = Array.prototype.slice.call(root.querySelectorAll('[data-award-left]'))
      .sort(function (a, b) { return +a.dataset.awardLeft - +b.dataset.awardLeft; });
    awardRightEls = Array.prototype.slice.call(root.querySelectorAll('[data-award-right]'))
      .sort(function (a, b) { return +a.dataset.awardRight - +b.dataset.awardRight; });
    awardCountEl = root.querySelector('[data-award-count]');
    awardsPage = 0;
    updateAwardsDisplay(true);
  }
  function updateAwardsDisplay(immediate) {
    var p = awardsPage, ease = 'cubic-bezier(.77,0,.18,1)';
    function applyTransforms() {
      awardLeftEls.forEach(function (el, i) {
        el.style.transform = i < p ? 'translateY(-100%)' : i === p ? 'translateY(0)' : 'translateY(100%)';
        el.style.zIndex = i === p ? '3' : (Math.abs(i - p) === 1 ? '2' : '1');
      });
      awardRightEls.forEach(function (el, i) {
        el.style.transform = i < p ? 'translateY(100%)' : i === p ? 'translateY(0)' : 'translateY(-100%)';
        el.style.zIndex = i === p ? '3' : (Math.abs(i - p) === 1 ? '2' : '1');
      });
    }
    if (immediate) {
      awardLeftEls.forEach(function (el) { el.style.transition = 'none'; });
      awardRightEls.forEach(function (el) { el.style.transition = 'none'; });
      applyTransforms();
    } else {
      awardLeftEls.forEach(function (el) { el.style.transition = 'transform 800ms ' + ease; });
      awardRightEls.forEach(function (el) { el.style.transition = 'transform 800ms ' + ease; });
      requestAnimationFrame(applyTransforms);
    }
    if (awardCountEl) awardCountEl.textContent = '0' + (p + 1) + ' / 04';
  }
  function tickAwards() {
    if (window.innerWidth <= 860) return;
    if (!awardsWrap || !awardLeftEls.length) return;
    var rect = awardsWrap.getBoundingClientRect();
    if (rect.top > 0 || rect.bottom < window.innerHeight) return;
    var scrolled = Math.max(0, -rect.top);
    var newPage = Math.min(3, Math.floor(scrolled / window.innerHeight));
    if (newPage !== awardsPage) { awardsPage = newPage; updateAwardsDisplay(false); }
  }

  // ── Social icons convergence (reveal-based) ─────────────────────
  function setupSocial() {
    if (!root) return;
    socialEls = Array.prototype.slice.call(root.querySelectorAll('[data-social-icon]'));
    var c = (socialEls.length - 1) / 2;
    socialEls.forEach(function (el, i) {
      var d = i - c;
      el.style.willChange = 'transform, opacity';
      el.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1), opacity .9s ease';
      el.style.transitionDelay = (Math.abs(d) * 70) + 'ms';
      el.style.transform = 'translate(' + (d * 90) + 'px,' + (-Math.abs(d) * 30) + 'px) rotate(' + (d * 42) + 'deg) scale(0.7)';
      el.style.opacity = '0';
    });
    socialDone = false;
  }
  function tickSocial() {
    if (socialDone || !socialEls.length || !socialRow) return;
    if (socialRow.getBoundingClientRect().top < window.innerHeight * 0.82) {
      socialEls.forEach(function (el) { el.style.transform = 'none'; el.style.opacity = '1'; });
      socialDone = true;
    }
  }

  // ── Disciplines double marquee ──────────────────────────────────
  function setupDisc() { discExtra = Math.max(1, window.innerHeight); }
  function tickDisc() {
    if (window.innerWidth <= 860) return;
    if (!discWrap || !discRow1 || !discRow2) return;
    var rect = discWrap.getBoundingClientRect();
    var extra = discExtra || window.innerHeight;
    var scrolled = Math.max(0, Math.min(extra, -rect.top));
    var p = scrolled / extra;
    var travel = window.innerWidth * 0.9;
    discRow1.style.transform = 'translateX(' + (-p * travel).toFixed(1) + 'px)';
    discRow2.style.transform = 'translateX(' + (-travel + p * travel).toFixed(1) + 'px)';
  }

  // ── Anchor navigation ───────────────────────────────────────────
  function onNavClick(e) {
    if (!root) return;
    var href = e.currentTarget.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    var id = href.slice(1);
    closeMenu();
    if (id === 'top') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.replaceState(null, '', location.pathname + location.search);
      return;
    }
    var target = root.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id));
    if (!target) return;
    e.preventDefault();
    var y = Math.round(target.getBoundingClientRect().top + window.scrollY);
    window.scrollTo({ top: y, behavior: 'smooth' });
    history.replaceState(null, '', '#' + id);
  }
  function bindNav() {
    if (!root) return;
    root.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', onNavClick); });
  }

  // ── Menu ────────────────────────────────────────────────────────
  function setupMenu() {
    if (!root) return;
    menuOverlay = root.querySelector('[data-menu-overlay]');
    menuBtn = root.querySelector('[data-menu-toggle]');
    menuOpen = false;
    if (menuBtn) menuBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', function (e) {
      if (!menuOpen) return;
      if (menuOverlay && menuOverlay.contains(e.target)) return;
      if (menuBtn && menuBtn.contains(e.target)) return;
      closeMenu();
    });
  }
  function toggleMenu() { menuOpen ? closeMenu() : openMenu(); }
  function openMenu() {
    if (!menuOverlay) return;
    menuOpen = true; menuOverlay.classList.add('open');
    if (menuBtn) { menuBtn.classList.add('open'); menuBtn.setAttribute('aria-expanded', 'true'); }
  }
  function closeMenu() {
    if (!menuOverlay || !menuOpen) return;
    menuOpen = false; menuOverlay.classList.remove('open');
    if (menuBtn) { menuBtn.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  }

  // ── Scroll: progress bar (+ nav active, if any) ─────────────────
  function onScroll() {
    if (st) return; st = true;
    requestAnimationFrame(function () {
      st = false;
      if (!root) return;
      var ih = window.innerHeight;
      var docH = document.documentElement.scrollHeight;
      var p = Math.max(0, Math.min(1, window.scrollY / (docH - ih)));
      if (progressEl) progressEl.style.transform = 'scaleX(' + p + ')';
      var secs = root.querySelectorAll('[data-section]'); var cur = null; var probe = ih * 0.38;
      secs.forEach(function (s2) { if (s2.getBoundingClientRect().top <= probe) cur = s2.getAttribute('data-section'); });
      root.querySelectorAll('[data-nav]').forEach(function (l) {
        var on = l.getAttribute('data-nav') === cur;
        l.style.color = on ? 'var(--acc)' : 'var(--ink2)';
        l.style.opacity = on ? '1' : '0.5';
      });
    });
  }

  // ── Input ───────────────────────────────────────────────────────
  function onMove(e) {
    mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.active = true;
    if (mouse.x < -9000) { mouse.x = e.clientX; mouse.y = e.clientY; }
  }
  function onLeave(e) { if (!e.relatedTarget) mouse.active = false; }
  function onResize() { sizeCanvas(); setupHorizontal(); setupAwards(); setupDisc(); }

  // ── Main loop ───────────────────────────────────────────────────
  function loop(now) {
    var t = (now - t0) / 1000;
    var delta = window.scrollY - smoothY;
    if (Math.abs(delta) > window.innerHeight * 2.5) smoothY = window.scrollY;
    else smoothY += delta * 0.08;
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    if (ctx) { try { ctx.clearRect(0, 0, W, H); drawFlux(ctx, t); } catch (e) {} }
    tickHero();
    tickHorizontal();
    tickAwards();
    tickSocial();
    tickDisc();
    tickReveal();
    raf = requestAnimationFrame(loop);
  }

  // ── Init ────────────────────────────────────────────────────────
  function init() {
    t0 = performance.now();
    initCanvas();
    // Award photos: hide broken images gracefully (no inline onerror → CSP-safe).
    if (root) root.querySelectorAll('#awards img').forEach(function (img) {
      img.addEventListener('error', function () { img.style.display = 'none'; });
    });
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseout', onLeave, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(function () {
      setupReveal(); tickReveal();
      setupHorizontal(); setupAwards(); setupDisc(); setupSocial();
      bindNav(); setupMenu(); onScroll();
    });
    setTimeout(setupHorizontal, 400);
    setTimeout(setupHorizontal, 1400);
    raf = requestAnimationFrame(loop);
  }

  init();
})();
