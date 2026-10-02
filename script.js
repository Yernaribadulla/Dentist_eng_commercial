/* DENTARA — alternative concept "Plumb line" — behaviour layer */
(() => {
  'use strict';
  const doc = document;
  const html = doc.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Theme: persisted, respects system preference, brief transition class
  --------------------------------------------------------------------- */
  const themeToggles = doc.querySelectorAll('[data-theme-toggle]');
  function setTheme(next, { animate = true } = {}) {
    if (animate && !reduceMotion) {
      html.classList.add('theme-anim');
      window.setTimeout(() => html.classList.remove('theme-anim'), 400);
    }
    html.dataset.theme = next;
    try { localStorage.setItem('dentara-theme', next); } catch (e) {}
    themeToggles.forEach(btn => btn.setAttribute('aria-label', next === 'dark' ? 'Enable light theme' : 'Enable dark theme'));
  }
  themeToggles.forEach(btn => btn.addEventListener('click', () => {
    setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark');
  }));
  // Keep in sync with system changes only if the user never chose explicitly.
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', e => {
    let stored = null;
    try { stored = localStorage.getItem('dentara-theme'); } catch (err) {}
    if (stored !== 'dark' && stored !== 'light') setTheme(e.matches ? 'dark' : 'light', { animate: false });
  });
  themeToggles.forEach(btn => btn.setAttribute('aria-label', html.dataset.theme === 'dark' ? 'Enable light theme' : 'Enable dark theme'));

  /* ---------------------------------------------------------------------
     Mobile menu
  --------------------------------------------------------------------- */
  const menuBtn = doc.querySelector('.menu-btn');
  const menu = doc.getElementById('menu');
  let lastFocused = null;
  function openMenu() {
    lastFocused = doc.activeElement;
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('open'));
    menuBtn.setAttribute('aria-expanded', 'true');
    doc.body.classList.add('menu-open');
    menu.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--k', i));
    const first = menu.querySelector('a');
    first?.focus();
  }
  function closeMenu({ restoreFocus = true } = {}) {
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    doc.body.classList.remove('menu-open');
    window.setTimeout(() => { menu.hidden = true; }, reduceMotion ? 0 : 700);
    if (restoreFocus) (lastFocused || menuBtn).focus();
  }
  menuBtn?.addEventListener('click', () => (menu.classList.contains('open') ? closeMenu() : openMenu()));
  menu?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu({ restoreFocus: false }); });
  menu?.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key !== 'Tab') return;
    const items = [...menu.querySelectorAll('a, button')];
    const i = items.indexOf(doc.activeElement);
    if (e.shiftKey && i === 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });

  /* ---------------------------------------------------------------------
     Smooth in-page navigation + active-section indication
  --------------------------------------------------------------------- */
  doc.querySelectorAll('a[data-nav], a[data-anchor]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      const target = doc.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  const navLinks = [...doc.querySelectorAll('[data-nav]')];
  const navSections = navLinks
    .map(a => doc.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  const topbar = doc.querySelector('.topbar');

  const setActive = id => {
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
  };
  if ('IntersectionObserver' in window && navSections.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    navSections.forEach(s => sectionObserver.observe(s));
  }
  const onScroll = () => topbar?.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------------------------------------------------------------
     Scroll-reveal (IntersectionObserver, one-shot) + staggered children
  --------------------------------------------------------------------- */
  html.classList.add('js');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealables = doc.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(el => io.observe(el));

    doc.querySelectorAll('[data-stagger]').forEach(group => {
      [...group.children].forEach((child, i) => {
        const target = child.hasAttribute('data-reveal') ? child : child.querySelector('[data-reveal]');
        if (target) target.style.setProperty('--d', `${Math.min(i, 8) * 90}ms`);
      });
    });
  } else {
    doc.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  /* ---------------------------------------------------------------------
     Animated metric counters (count once, on view)
  --------------------------------------------------------------------- */
  const counters = doc.querySelectorAll('[data-count]');
  function animateCount(el) {
    const target = Number(el.dataset.count);
    const numEl = el.querySelector('.num');
    if (!numEl || reduceMotion) { if (numEl) numEl.textContent = target.toLocaleString('ru-RU'); return; }
    const duration = 1100;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      numEl.textContent = Math.round(target * eased).toLocaleString('ru-RU');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && counters.length) {
    const cIo = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => cIo.observe(el));
  }

  /* ---------------------------------------------------------------------
     Hero image parallax (rAF-throttled, transform only — no layout cost)
  --------------------------------------------------------------------- */
  const parallaxEl = doc.querySelector('[data-parallax]');
  if (parallaxEl && !reduceMotion) {
    let ticking = false;
    function updateParallax() {
      const r = parallaxEl.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const progress = 1 - Math.min(1, Math.max(0, r.top / vh));
      const shift = (progress - 0.5) * 26; // px
      parallaxEl.style.setProperty('--py', `${shift.toFixed(1)}px`);
      ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); } }, { passive: true });
    updateParallax();
  }

  /* ---------------------------------------------------------------------
     About gallery — slats
  --------------------------------------------------------------------- */
  const slats = doc.querySelectorAll('.slat');
  slats.forEach(btn => btn.addEventListener('click', () => {
    slats.forEach(s => { s.classList.remove('is-active'); s.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');
  }));

  /* ---------------------------------------------------------------------
     Services accordion (single-open) + FAQ accordion (multi-open)
  --------------------------------------------------------------------- */
  function wireAccordion(items, { singleOpen }) {
    items.forEach(item => {
      const btn = item.querySelector('button[aria-expanded]');
      btn?.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        if (singleOpen) {
          items.forEach(other => {
            if (other === item) return;
            other.classList.remove('is-open');
            other.querySelector('button[aria-expanded]')?.setAttribute('aria-expanded', 'false');
          });
        }
        item.classList.toggle('is-open', !isOpen);
        btn.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }
  wireAccordion(doc.querySelectorAll('.svc'), { singleOpen: true });
  wireAccordion(doc.querySelectorAll('.faq-item'), { singleOpen: false });

  /* ---------------------------------------------------------------------
     Before / after compare — pointer events, zero-latency drag
  --------------------------------------------------------------------- */
  const compare = doc.querySelector('[data-compare]');
  if (compare) {
    const input = compare.querySelector('.cmp-input');
    const before = compare.querySelector('.layer-before');
    const handle = compare.querySelector('.handle');
    let raf = null;
    let dragging = false;

    function paint(pos) {
      compare.style.setProperty('--pos', pos);
    }
    function setPos(pos, { commit = true } = {}) {
      pos = Math.min(100, Math.max(0, pos));
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => paint(pos));
      if (commit) input.value = String(pos);
    }
    function posFromClientX(x) {
      const r = compare.getBoundingClientRect();
      return ((x - r.left) / r.width) * 100;
    }
    function pointerDown(e) {
      dragging = true;
      compare.classList.add('is-dragging');
      compare.setPointerCapture?.(e.pointerId);
      setPos(posFromClientX(e.clientX));
      input.focus({ preventScroll: true });
    }
    function pointerMove(e) {
      if (!dragging) return;
      setPos(posFromClientX(e.clientX));
    }
    function pointerUp(e) {
      if (!dragging) return;
      dragging = false;
      compare.classList.remove('is-dragging');
      compare.releasePointerCapture?.(e.pointerId);
    }
    compare.addEventListener('pointerdown', pointerDown);
    compare.addEventListener('pointermove', pointerMove);
    compare.addEventListener('pointerup', pointerUp);
    compare.addEventListener('pointercancel', pointerUp);
    // Tap on the left/right third nudges the slider — handy for quick taps on mobile.
    compare.addEventListener('click', e => {
      if (dragging) return;
      const pct = posFromClientX(e.clientX);
      const current = Number(input.value);
      const nudge = pct < current ? -14 : 14;
      compare.classList.add('is-animating');
      setPos(current + nudge);
      window.setTimeout(() => compare.classList.remove('is-animating'), 320);
    });
    input.addEventListener('input', () => setPos(Number(input.value), { commit: false }));
    paint(input.value);
  }

  /* ---------------------------------------------------------------------
     Direction data → cards + drawer content (kept identical in substance
     to the source project: same three directions, same items, no invented
     doctors, licences or claims)
  --------------------------------------------------------------------- */
  const DIRECTIONS = [
    {
      tag: 'ORTHODONTICS', title: 'Bite planning',
      summary: 'Bite correction and orthodontic treatment planning.',
      items: ['Bite planning', 'Digital diagnostics', 'Orthodontic treatment', 'Individual treatment plan'],
    },
    {
      tag: 'SURGERY', title: 'Surgical support',
      summary: 'Implantology and surgical support for treatment.',
      items: ['Implantology', 'Surgical support', 'Implant preparation', 'Recovery'],
    },
    {
      tag: 'AESTHETICS', title: 'Digital smile',
      summary: 'Aesthetic procedures and digital smile planning.',
      items: ['Smile design', 'Digital planning', 'Aesthetic restoration', 'Result preview'],
    },
  ];
  const dirGlyphs = [
    '<svg class="dir-glyph" viewBox="0 0 72 72" aria-hidden="true"><path d="M20 50c0-16 6-30 16-30s16 14 16 30" /><path d="M20 50h32" /></svg>',
    '<svg class="dir-glyph" viewBox="0 0 72 72" aria-hidden="true"><path d="M36 14v20M36 34l-9 24M36 34l9 24" /><circle cx="36" cy="34" r="5" /></svg>',
    '<svg class="dir-glyph" viewBox="0 0 72 72" aria-hidden="true"><path d="M18 40c6 10 30 10 36 0" /><path d="M24 30c2-6 6-9 12-9s10 3 12 9" /></svg>',
  ];
  const dirGrid = doc.querySelector('.dir-grid');
  if (dirGrid) {
    dirGrid.innerHTML = DIRECTIONS.map((d, i) => `
      <button class="dir" type="button" data-direction="${i}" aria-haspopup="dialog">
        <span class="dir-top"><span class="dir-n">0${i + 1}</span>${dirGlyphs[i]}</span>
        <span class="dir-body">
          <span class="dir-tag">${d.tag}</span>
          <span class="dir-title">${d.title}</span>
          <span class="dir-sum">${d.summary}</span>
          <span class="dir-cta">Open direction <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></span>
        </span>
      </button>`).join('');
  }

  /* ---------------------------------------------------------------------
     Modal machinery shared by the direction drawer and the booking drawer.
     Scroll position is preserved purely by NOT touching document scroll:
     no `position:fixed` on body, no scrollTo. `overflow:hidden` on <html>
     via .modal-open keeps the page from scrolling behind the drawer
     without moving it, and the drawer itself scrolls independently.
  --------------------------------------------------------------------- */
  const openLayers = [];
  function trapFocus(e, modal) {
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const i = items.indexOf(doc.activeElement);
    if (e.shiftKey && (i === 0 || i === -1)) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  }
  function openLayer(layer) {
    const modal = layer.querySelector('.modal');
    layer.dataset.returnFocus = 'pending';
    layer.__lastFocused = doc.activeElement;
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => layer.classList.add('open'));
    doc.body.classList.add('modal-open');
    modal.focus({ preventScroll: true });
    const onKey = e => {
      if (e.key === 'Escape') { closeLayer(layer); return; }
      trapFocus(e, modal);
    };
    layer.__onKey = onKey;
    doc.addEventListener('keydown', onKey);
    openLayers.push(layer);
  }
  function closeLayer(layer) {
    layer.classList.remove('open');
    layer.setAttribute('aria-hidden', 'true');
    doc.removeEventListener('keydown', layer.__onKey);
    window.setTimeout(() => { layer.hidden = true; }, reduceMotion ? 0 : 550);
    const idx = openLayers.indexOf(layer);
    if (idx >= 0) openLayers.splice(idx, 1);
    if (!openLayers.length) doc.body.classList.remove('modal-open');
    (layer.__lastFocused || doc.body).focus?.({ preventScroll: true });
  }
  doc.querySelectorAll('.modal-layer').forEach(layer => {
    layer.hidden = true;
    layer.addEventListener('mousedown', e => { if (e.target === layer) closeLayer(layer); });
    layer.querySelector('.x')?.addEventListener('click', () => closeLayer(layer));
  });

  /* ---------------------------------------------------------------------
     Direction drawer content
  --------------------------------------------------------------------- */
  const doctorModal = doc.getElementById('doctor-modal');
  if (doctorModal && dirGrid) {
    dirGrid.addEventListener('click', e => {
      const card = e.target.closest('[data-direction]');
      if (!card) return;
      const d = DIRECTIONS[Number(card.dataset.direction)];
      doctorModal.querySelector('.modal-eyebrow').textContent = `${d.tag} / DIRECTION`;
      doctorModal.querySelector('#direction-title').textContent = d.title;
      doctorModal.querySelector('.bio').textContent = d.summary;
      doctorModal.querySelector('.bio-list').innerHTML = d.items.map(t => `<li>${t}</li>`).join('');
      doctorModal.querySelector('.fact-focus').textContent = d.tag[0] + d.tag.slice(1).toLowerCase();
      openLayer(doctorModal);
    });
  }

  /* ---------------------------------------------------------------------
     Booking drawer — 3 steps, no scroll jump, focus preserved
  --------------------------------------------------------------------- */
  const bookingModal = doc.getElementById('booking-modal');
  const bookingBody = bookingModal?.querySelector('.booking-body');
  const bookingStepLabel = bookingModal?.querySelector('.booking-step');
  const bookingProgress = bookingModal?.querySelector('.booking-progress i');
  const bookingBack = bookingModal?.querySelector('.back');
  const TOPICS = ['Consultation', 'Implantology', 'Orthodontics', 'Smile design', 'Preventive care'];
  const booking = { topic: null, name: '', phone: '' };

  function renderStep(step, dir = 1) {
    if (!bookingBody) return;
    bookingBody.style.setProperty('--dir', String(dir));
    bookingBody.classList.remove('step-in');
    void bookingBody.offsetWidth;
    bookingBody.classList.add('step-in');
    bookingStepLabel.innerHTML = `<b>0${step}</b> / 03`;
    bookingProgress.style.width = `${step * 33.33}%`;
    bookingBack.style.visibility = step === 1 ? 'hidden' : 'visible';

    if (step === 1) {
      bookingBody.innerHTML = `
        <h2>What are you<span class="soft"> interested in?</span></h2>
        <div class="choice-list">${TOPICS.map(t => `<button class="choice" type="button" data-topic="${t}">${t} <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></button>`).join('')}</div>`;
    } else if (step === 2) {
      bookingBody.innerHTML = `
        <h2>Almost<span class="soft"> ready.</span></h2>
        <p class="summary">Direction: ${booking.topic}</p>
        <label class="field">Your name
          <input type="text" name="name" autocomplete="name" placeholder="First and last name" value="${booking.name}">
        </label>
        <label class="field">Phone
          <input type="tel" name="phone" autocomplete="tel" placeholder="+7 700 000 00 00" value="${booking.phone}">
          <span class="field-error" aria-live="polite"></span>
        </label>
        <button class="btn confirm" type="button">Confirm booking <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></button>`;
    } else if (step === 3) {
      bookingBody.innerHTML = `
        <h2>Request<span class="soft"> received.</span></h2>
        <p class="summary">We will contact you within 15 minutes to confirm a convenient time.</p>
        <dl class="facts" style="margin-top:8px">
        <div><dt>Direction</dt><dd>${booking.topic}</dd></div>
          <div><dt>Contact</dt><dd>${booking.name || '—'}, ${booking.phone || '—'}</dd></div>
        </dl>`;
    }
  }
  function goToStep(step, dir) { booking.step = step; renderStep(step, dir); }

  bookingBody?.addEventListener('click', e => {
    const topicBtn = e.target.closest('[data-topic]');
    if (topicBtn) { booking.topic = topicBtn.dataset.topic; goToStep(2, 1); return; }
    if (e.target.closest('.confirm')) {
      const nameInput = bookingBody.querySelector('input[name="name"]');
      const phoneInput = bookingBody.querySelector('input[name="phone"]');
      const errorEl = bookingBody.querySelector('.field-error');
      const phoneOk = /\d{5,}/.test(phoneInput.value.replace(/\D/g, ''));
      booking.name = nameInput.value.trim();
      booking.phone = phoneInput.value.trim();
      if (!phoneOk) {
        phoneInput.setAttribute('aria-invalid', 'true');
        errorEl.textContent = 'Please enter a phone number so we can contact you.';
        phoneInput.focus();
        return;
      }
      phoneInput.removeAttribute('aria-invalid');
      goToStep(3, 1);
      showToast('Request received — we will contact you within 15 minutes.');
    }
  });
  bookingBack?.addEventListener('click', () => {
    if (booking.step > 1) goToStep(booking.step - 1, -1);
  });
  doc.querySelectorAll('[data-book]').forEach(btn => btn.addEventListener('click', () => {
    booking.topic = null; booking.name = ''; booking.phone = '';
    goToStep(1, 1);
    if (bookingModal) openLayer(bookingModal);
  }));

  /* ---------------------------------------------------------------------
     Toast
  --------------------------------------------------------------------- */
  const toastEl = doc.querySelector('.toast');
  let toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.innerHTML = `<svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>${message}</span>`;
    toastEl.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 4200);
  }

  /* ---------------------------------------------------------------------
     Smile preview — illustrative SVG only, mood swatches
  --------------------------------------------------------------------- */
  const MOODS = [
    { name: 'Natural', label: 'Natural', tooth: '#efe6d8', tint: '#e7e1d6' },
    { name: 'Bright', label: 'Bright', tooth: '#fbf7ee', tint: '#eef1ee' },
    { name: 'Warm', label: 'Warm', tooth: '#f2e3c9', tint: '#f0e6d2' },
  ];
  const swatchWrap = doc.querySelector('.swatches');
  const smileSvg = doc.querySelector('.smile-svg');
  const smilePreview = doc.querySelector('.smile-preview');
  const smileModeLabel = doc.querySelector('.smile-mode');
  function teethPath() {
    let out = '';
    const n = 8, w = 56, gap = 4, total = n * w + (n - 1) * gap, startX = (600 - total) / 2;
    for (let i = 0; i < n; i++) {
      const x = startX + i * (w + gap);
      const h = 78 - Math.abs(i - (n - 1) / 2) * 6;
      out += `<rect class="tooth" x="${x}" y="${150 - h / 2}" width="${w}" height="${h}" rx="14" style="transform-origin:${x + w / 2}px ${150}px"/>`;
    }
    return out;
  }
  function renderSmile(moodIndex) {
    if (!smileSvg) return;
    const mood = MOODS[moodIndex];
    smileSvg.style.setProperty('--tooth', mood.tooth);
    smilePreview?.style.setProperty('--tint', mood.tint);
    if (smileModeLabel) smileModeLabel.textContent = mood.label;
    smileSvg.innerHTML = `
      <path class="mouth" d="M40 150c60 90 460 90 520 0-60 130-460 130-520 0Z"/>
      ${teethPath()}`;
  }
  if (swatchWrap) {
    swatchWrap.innerHTML = MOODS.map((m, i) => `
      <button class="sw" type="button" data-mood="${i}" style="--c:${m.tooth}" aria-pressed="${i === 0}">
        <i aria-hidden="true"></i>${m.label}
      </button>`).join('');
    swatchWrap.addEventListener('click', e => {
      const btn = e.target.closest('[data-mood]');
      if (!btn) return;
      swatchWrap.querySelectorAll('.sw').forEach(s => s.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      renderSmile(Number(btn.dataset.mood));
    });
    renderSmile(0);
  }

  /* ---------------------------------------------------------------------
     Technology scan panel — trigger its own reveal state once in view
  --------------------------------------------------------------------- */
  const scanEl = doc.querySelector('.scan');
  if (scanEl && 'IntersectionObserver' in window) {
    const scanIo = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        scanEl.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    scanIo.observe(scanEl);
  } else {
    scanEl?.classList.add('is-in');
  }
})();


