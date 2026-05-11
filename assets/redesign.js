/* =====================================================================
   108 Palms — REDESIGN OVERLAY (JS)
   Aplikuje visual efekty + brand styling na existující React app.
   Žádné změny v existující struktuře — jen DOM dodatky.
   ===================================================================== */
(function() {
  'use strict';
  const isDesktop = window.matchMedia('(min-width: 901px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =========================
  // 1. PARTICLES (gold dots driftujících přes pozadí)
  // =========================
  function spawnParticles() {
    if (reduceMotion) return;
    if (document.querySelector('.c108-particles')) return;
    const wrap = document.createElement('div');
    wrap.className = 'c108-particles';
    wrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'c108-particle';
      const size = 1 + Math.random() * 4;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.animationDuration = (16 + Math.random() * 26) + 's';
      p.style.animationDelay = -Math.random() * 30 + 's';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
  }

  // =========================
  // 2. CUSTOM CURSOR + TRAIL (no Reserve badge)
  // =========================
  function setupCursor() {
    if (!isDesktop) return;
    const cursor = document.createElement('div');
    cursor.className = 'c108-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    const trail = document.createElement('div');
    trail.className = 'c108-cursor-trail';
    trail.setAttribute('aria-hidden', 'true');
    document.body.appendChild(trail);
    document.body.appendChild(cursor);

    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', e => {
      cx = e.clientX; cy = e.clientY;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
    });
    function tick() {
      tx += (cx - tx) * 0.18;
      ty += (cy - ty) * 0.18;
      trail.style.left = tx + 'px';
      trail.style.top = ty + 'px';
      requestAnimationFrame(tick);
    }
    tick();

    // Hover enlarge na všech interaktivních prvcích
    function bindHover() {
      document.querySelectorAll('a, button, summary, input, select, [role="button"], [class*="card"], img').forEach(el => {
        if (el.dataset.c108CursorBound) return;
        el.dataset.c108CursorBound = '1';
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
      });
    }
    bindHover();
    // Re-bind na DOM změny
    new MutationObserver(bindHover).observe(document.body, { childList: true, subtree: true });
  }

  // =========================
  // 3. SECTION INDICATOR vpravo
  // =========================
  function setupSectionIndicator() {
    if (!isDesktop) return;
    const sections = ['gallery', 'accommodation', 'location', 'faq'];
    // Prefix: "top" indicator (scroll to body top)
    const items = [{id: 'top', label: 'Home'}, ...sections.map(s => ({id: s, label: s.charAt(0).toUpperCase() + s.slice(1)}))];

    const nav = document.createElement('nav');
    nav.className = 'c108-section-indicator';
    nav.setAttribute('aria-label', 'Page sections');
    items.forEach((it, i) => {
      const a = document.createElement('a');
      a.href = it.id === 'top' ? '#' : '#' + it.id;
      a.dataset.section = it.id;
      a.dataset.label = it.label;
      if (i === 0) a.classList.add('active');
      a.addEventListener('click', e => {
        if (it.id === 'top') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
      nav.appendChild(a);
    });
    document.body.appendChild(nav);

    // Active na základě viditelnosti sekce
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          nav.querySelectorAll('a').forEach(a => a.classList.remove('active'));
          nav.querySelector(`a[data-section="${en.target.id}"]`)?.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  // =========================
  // 4. WORD STAGGER na H1 ("108 Palms Beach Resort")
  // =========================
  function applyWordStagger() {
    const h1 = document.querySelector('h1');
    if (!h1 || h1.dataset.c108Stagger) return;
    const text = h1.textContent.trim();
    if (!/108\s*Palms/i.test(text)) return;
    h1.dataset.c108Stagger = '1';
    const words = text.split(/\s+/);
    h1.innerHTML = words.map((w, i) =>
      `<span class="c108-word" style="animation-delay:${0.05 + i * 0.13}s">${w}</span>`
    ).join(' ');
  }

  // =========================
  // 5. NUMBER COUNTERS (8.9 / 285 / 11 / 50)
  // =========================
  const COUNTER_TARGETS = ['8.9', '285', '11', '50'];
  function applyCounters() {
    // Najít všechny elementy obsahující čísla z targetů
    const allText = [...document.querySelectorAll('div, span, p')].filter(el => el.children.length === 0);
    allText.forEach(el => {
      const txt = el.textContent.trim();
      COUNTER_TARGETS.forEach(target => {
        if (txt === target || txt === target + ' / 10' || txt === target + ' units' || txt === target + ' m') {
          if (el.dataset.c108Counter) return;
          el.dataset.c108Counter = target;
          // Replace number with span
          el.innerHTML = el.innerHTML.replace(target, `<span class="c108-counting" data-target="${target}">0</span>`);
        }
      });
    });

    // Observe scroll-into-view a animuj
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const span = en.target;
          const target = parseFloat(span.dataset.target);
          const decimal = (span.dataset.target.includes('.')) ? 1 : 0;
          const dur = 1200;
          const start = performance.now();
          const tick = t => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 4);
            span.textContent = (target * eased).toFixed(decimal);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.unobserve(span);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.c108-counting').forEach(s => obs.observe(s));
  }

  // =========================
  // 6. IMAGE REVEAL v Accommodation (clip-path)
  // =========================
  function applyImageReveal() {
    const acc = document.getElementById('accommodation');
    if (!acc) return;
    acc.querySelectorAll('img').forEach(img => {
      if (img.dataset.c108Reveal) return;
      img.dataset.c108Reveal = '1';
      img.classList.add('c108-reveal-img');
    });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    acc.querySelectorAll('.c108-reveal-img').forEach(img => obs.observe(img));
  }

  // =========================
  // 7. HERO VIDEO — replace src + cinematic zoom
  // =========================
  function setupHeroVideo() {
    const video = document.querySelector('video');
    if (!video) return;
    // Replace src s naším HD videem (pokud je nahráno do assets/videos/hero.mp4)
    const newSrc = './assets/videos/hero.mp4';
    // Check existence
    fetch(newSrc, { method: 'HEAD' }).then(r => {
      if (r.ok) {
        // Remove old sources
        video.querySelectorAll('source').forEach(s => s.remove());
        // Add new source
        const src = document.createElement('source');
        src.src = newSrc;
        src.type = 'video/mp4';
        video.appendChild(src);
        video.load();
        video.play().catch(() => {});
      }
    }).catch(() => {});
    // Apply cinematic zoom class (vždy, na existující src)
    video.classList.add('c108-hero-zoom');
  }

  // =========================
  // 8. LOGO SWAP (theme-adaptive)
  // =========================
  function setupLogoSwap() {
    function applyLogos() {
      const isDark = document.documentElement.classList.contains('dark') ||
                     document.documentElement.dataset.theme === 'dark';
      const navLogos = document.querySelectorAll('header img, nav img');
      const newSrc = isDark
        ? './assets/logos/logo-nav-dark.png'
        : './assets/logos/logo-nav-light.png';
      navLogos.forEach(img => {
        if (img.src.includes('logo-transparent') || img.src.includes('logo-108palms') ||
            img.alt.toLowerCase().includes('108')) {
          // Only swap pokud existuje override
          fetch(newSrc, { method: 'HEAD' }).then(r => {
            if (r.ok) img.src = newSrc;
          }).catch(() => {});
        }
      });
    }
    applyLogos();
    // Re-apply when theme changes
    new MutationObserver(applyLogos).observe(document.documentElement, {
      attributes: true, attributeFilter: ['class', 'data-theme']
    });
  }

  // =========================
  // 9. FAQ KATEGORIE chips
  // =========================
  function setupFaqCategories() {
    const faq = document.getElementById('faq');
    if (!faq) return;
    if (faq.querySelector('.c108-faq-cats')) return;

    // Map otázek na kategorie podle keywordů
    const items = faq.querySelectorAll('[data-slot="accordion-item"], details, [class*="accordion-item"], button[aria-expanded]');
    function categoryFor(text) {
      const t = text.toLowerCase();
      if (/book|deposit|cancel|payment|date/.test(t)) return 'booking';
      if (/transfer|airport|arrival|check-in|late/.test(t)) return 'arrival';
      if (/excursion|tour|temple|pigeon|island|nilaveli|trinco|local|monsoon|weather|time/.test(t)) return 'local';
      return 'stay';
    }

    // Tag every item s kategorií
    items.forEach(item => {
      if (item.dataset.c108Cat) return;
      const text = item.textContent || '';
      item.dataset.c108Cat = categoryFor(text);
    });

    // Find best place to insert chips — před první otázkou
    const firstItem = items[0];
    if (!firstItem) return;
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'c108-faq-cats';
    chipsWrap.setAttribute('role', 'tablist');
    const cats = [
      ['all', 'All'], ['booking', 'Booking'], ['stay', 'Stay'],
      ['arrival', 'Arrival'], ['local', 'Local']
    ];
    cats.forEach(([id, label], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.c108CatFilter = id;
      b.textContent = label;
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => {
        chipsWrap.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        items.forEach(it => {
          const show = id === 'all' || it.dataset.c108Cat === id;
          it.style.display = show ? '' : 'none';
        });
      });
      chipsWrap.appendChild(b);
    });
    firstItem.parentElement.insertBefore(chipsWrap, firstItem);
  }

  // =========================
  // 10. FOOTER PALM SWAY
  // =========================
  function addFooterPalms() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    if (footer.querySelector('.c108-palm-deco')) return;
    const palmSvg = `<svg viewBox="0 0 100 200" aria-hidden="true">
      <g stroke="var(--c108-sand-gold)" stroke-width="1.5" fill="none">
        <path d="M50 200 L50 60"/>
        <path d="M50 60 Q30 50 10 30"/>
        <path d="M50 60 Q70 50 90 30"/>
        <path d="M50 65 Q35 60 15 50"/>
        <path d="M50 65 Q65 60 85 50"/>
        <path d="M50 70 Q35 80 20 75"/>
        <path d="M50 70 Q65 80 80 75"/>
      </g>
    </svg>`;
    footer.style.position = 'relative';
    footer.style.overflow = 'hidden';
    const left = document.createElement('div');
    left.className = 'c108-palm-deco left';
    left.innerHTML = palmSvg;
    footer.appendChild(left);
    const right = document.createElement('div');
    right.className = 'c108-palm-deco right';
    right.innerHTML = palmSvg;
    footer.appendChild(right);
  }

  // =========================
  // 11. FAVICON UPDATE
  // =========================
  function updateFavicon() {
    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) {
      fav = document.createElement('link');
      fav.rel = 'icon';
      document.head.appendChild(fav);
    }
    fetch('./assets/logos/favicon-256.png', { method: 'HEAD' }).then(r => {
      if (r.ok) {
        fav.type = 'image/png';
        fav.href = './assets/logos/favicon-256.png';
      }
    }).catch(() => {});
  }

  // =========================
  // INIT
  // =========================
  function init() {
    spawnParticles();
    setupCursor();
    setupSectionIndicator();
    applyWordStagger();
    applyCounters();
    applyImageReveal();
    setupHeroVideo();
    setupLogoSwap();
    setupFaqCategories();
    addFooterPalms();
    updateFavicon();
    // Re-apply (React re-renders) — debounced
    let timer;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        applyWordStagger();
        applyCounters();
        applyImageReveal();
        setupFaqCategories();
      }, 300);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
