/* =====================================================================
   108 Palms — REDESIGN OVERLAY (v4) JS
   FIXED: counters jen 1x pri loadu, logo persist na route change,
   tilt cards, footer enhancement, vse robust pro React rerenders.
   ===================================================================== */
(function() {
  'use strict';
  const isDesktop = window.matchMedia('(min-width: 901px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // v13.1: LIGHT CZ detection — html lang OR specific nav links (NO body.textContent scan)
  function isCzActive() {
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.startsWith('cs') || lang.startsWith('cz')) return true;
    // Quick check on nav: hledame "Galerie" misto "Gallery"
    const navItems = document.querySelectorAll('nav a, header a, [role="navigation"] a');
    for (const a of navItems) {
      const t = (a.textContent || '').trim();
      if (t === 'Galerie' || t === 'Ubytování' || t === 'Lokalita') return true;
      if (t === 'Gallery' || t === 'Accommodation' || t === 'Location') return false;
    }
    return false;
  }
  window.__c108IsCz = isCzActive;

  // === 1. PARTICLES (gold dots) ===
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

  // === 2. CUSTOM CURSOR + TRAIL ===
  function setupCursor() {
    if (!isDesktop) return;
    if (document.querySelector('.c108-cursor')) return;
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

    function bindHover() {
      document.querySelectorAll('a, button, summary, input, select, [role="button"], [class*="card"], img').forEach(el => {
        if (el.dataset.c108CursorBound) return;
        el.dataset.c108CursorBound = '1';
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
      });
    }
    bindHover();
    // v13.3: VYPNUTO body MutationObserver - cursor hover bind jen jednou
  }

  // === 3. SECTION INDICATOR vpravo ===
  function setupSectionIndicator() {
    if (!isDesktop) return;
    if (document.querySelector('.c108-section-indicator')) return;
    // v12: Per Tomáš PDF — odstraněno beaches/location/arrival (nebyly), zůstávají Home/Gallery/Accommodation/FAQ
    const sections = ['gallery', 'accommodation', 'faq'];
    const cz = isCzActive();
    const labelMap = cz
      ? { top: 'Domů', gallery: 'Galerie', accommodation: 'Ubytování', faq: 'FAQ' }
      : { top: 'Home', gallery: 'Gallery', accommodation: 'Accommodation', faq: 'FAQ' };
    const items = [{id: 'top', label: labelMap.top}, ...sections.map(s => ({id: s, label: labelMap[s]}))];
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

  // === 4. WORD STAGGER na H1 ===
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

  // === 5. NUMBER COUNTERS — JEN 1x při LOAD (ne pri scroll, ne na re-render) ===
  function applyCountersOnce() {
    if (window.__c108CountersDone) return;
    // Wait do React doplni do DOM cisla — try opakovane
    let attempts = 0;
    const tryRun = () => {
      attempts++;
      const targets = [
        { value: '8.9', decimals: 1, suffix: '' },
        { value: '285', decimals: 0, suffix: '' },
        { value: '11', decimals: 0, suffix: '' },
        { value: '50', decimals: 0, suffix: '' },
      ];
      let foundAny = false;
      const allText = [...document.querySelectorAll('div, span, p, strong, em')]
        .filter(el => el.children.length === 0 && el.textContent.trim().length < 20);

      targets.forEach(t => {
        allText.forEach(el => {
          const txt = el.textContent.trim();
          // Match: "8.9", "8.9 / 10", "11 units", "50 m", "285 reviews"
          if (txt === t.value || txt.startsWith(t.value + ' ') || txt.startsWith(t.value + '/')) {
            if (el.dataset.c108Done) return;
            el.dataset.c108Done = '1';
            foundAny = true;
            const original = el.textContent;
            el.innerHTML = el.innerHTML.replace(t.value, `<span class="c108-counting" data-target-val="${t.value}" data-decimals="${t.decimals}">0</span>`);
          }
        });
      });
      if (foundAny || attempts > 12) {
        window.__c108CountersDone = true;
        // Animate all c108-counting elements once (1.4s)
        document.querySelectorAll('.c108-counting').forEach(span => {
          if (span.dataset.c108Anim) return;
          span.dataset.c108Anim = '1';
          const target = parseFloat(span.dataset.targetVal);
          const decimals = parseInt(span.dataset.decimals || '0', 10);
          const dur = 1400;
          const start = performance.now();
          const tick = t => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 4);
            span.textContent = (target * eased).toFixed(decimals);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      } else {
        setTimeout(tryRun, 400);
      }
    };
    tryRun();
  }

  // === 6. IMAGE REVEAL v Accommodation ===
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
    acc.querySelectorAll('.c108-reveal-img:not(.is-visible)').forEach(img => obs.observe(img));
  }

  // === 7. ACCOMMODATION CARDS — Apple-style hover (čistě CSS, žádný mousemove) ===
  function applyTiltCards() {
    const acc = document.getElementById('accommodation');
    if (!acc) return;
    const cards = acc.querySelectorAll('article, [class*="card"]:not([class*="cards"])');
    cards.forEach(card => {
      if (card.dataset.c108Tilt) return;
      card.dataset.c108Tilt = '1';
      card.classList.add('c108-tilt', 'c108-shine');
      // Žádný JS handler — vše čistě v CSS :hover (Apple-style translateY+scale+shadow)
    });
  }

  // === 8. HERO VIDEO — replace src + cinematic zoom + start time s ptakem ===
  function setupHeroVideo() {
    const video = document.querySelector('video');
    if (!video) return;
    if (video.dataset.c108Done) return;
    video.dataset.c108Done = '1';
    const newSrc = '/assets/videos/hero.mp4';
    fetch(newSrc, { method: 'HEAD' }).then(r => {
      if (r.ok) {
        video.querySelectorAll('source').forEach(s => s.remove());
        const src = document.createElement('source');
        src.src = newSrc;
        src.type = 'video/mp4';
        video.appendChild(src);
        video.load();
        // Start od 1.5s pro lepší časování ptáka
        video.addEventListener('loadedmetadata', () => {
          if (video.duration > 3) video.currentTime = 1.5;
          video.play().catch(() => {});
        }, { once: true });
      }
    }).catch(() => {});
    video.classList.add('c108-hero-zoom');
  }

  // === 9. LOGO SWAP — theme-adaptive + persistuje na route change + KAŽDÉ logo na webu ===
  function isLogoImg(img) {
    const src = (img.src || img.getAttribute('src') || '').toLowerCase();
    const alt = (img.alt || '').toLowerCase();
    return src.includes('/branding/') || src.includes('logo-') ||
           src.includes('logo-transparent') || src.includes('logo-108palms') ||
           alt.includes('108') || alt.includes('palms beach');
  }
  function applyLogos() {
    const isDark = document.documentElement.classList.contains('dark') ||
                   document.documentElement.dataset.theme === 'dark' ||
                   !document.documentElement.classList.contains('light');
    const navSrc    = isDark ? '/branding/logo-nav-dark.png'    : '/branding/logo-nav-light.png';
    const footerSrc = isDark ? '/branding/logo-footer-dark.png' : '/branding/logo-footer-light.png';

    // PROJET KAŽDÝ <img> na stránce — pokud je to logo, vyměnit
    document.querySelectorAll('img').forEach(img => {
      if (!isLogoImg(img)) return;
      // Najít kontext: footer? header/nav? hero?
      const inFooter = img.closest('footer') || (img.closest('[class*="footer"]') !== null);
      const targetSrc = inFooter ? footerSrc : navSrc;
      const absoluteTarget = window.location.origin + targetSrc;
      if (img.src !== absoluteTarget) {
        img.src = targetSrc;
      }
      // Sizing - jen 1× per element
      if (!img.dataset.c108LogoSized) {
        img.dataset.c108LogoSized = '1';
        if (!inFooter) {
          img.style.maxHeight = '64px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
        }
      }
    });
  }
  function setupLogoSwap() {
    applyLogos();
    new MutationObserver(applyLogos).observe(document.documentElement, {
      attributes: true, attributeFilter: ['class', 'data-theme']
    });
  }

  // === 10. FAQ KATEGORIE chips ===
  function setupFaqCategories() {
    const faq = document.getElementById('faq');
    if (!faq) return;
    if (faq.querySelector('.c108-faq-cats')) return;
    const items = faq.querySelectorAll('[data-slot="accordion-item"], details, [class*="accordion-item"], button[aria-expanded]');
    if (items.length === 0) return;

    function categoryFor(text) {
      const t = text.toLowerCase();
      if (/book|deposit|cancel|payment|date/.test(t)) return 'booking';
      if (/transfer|airport|arrival|check-in|late/.test(t)) return 'arrival';
      if (/excursion|tour|temple|pigeon|island|nilaveli|trinco|local|monsoon|weather|time/.test(t)) return 'local';
      return 'stay';
    }
    items.forEach(item => {
      if (item.dataset.c108Cat) return;
      item.dataset.c108Cat = categoryFor(item.textContent || '');
    });
    const firstItem = items[0];
    if (!firstItem || !firstItem.parentElement) return;
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'c108-faq-cats';
    chipsWrap.setAttribute('role', 'tablist');
    [['all','All'],['booking','Booking'],['stay','Stay'],['arrival','Arrival'],['local','Local']].forEach(([id, label], i) => {
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

  // === 11. FOOTER — palms + extra panel ===
  function enhanceFooter() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    if (footer.querySelector('.c108-palm-deco')) return;
    footer.style.position = 'relative';
    footer.style.overflow = 'hidden';

    // v10: Palma 1:1 ze 108 Palms loga — VEČERNÍ V-tvar palmovité větve
    // (jako 2 listy palmy z brand mark-only loga: vertikální spine + listy směřují UPWARD a OUTWARD)
    const palmSvg = `<svg viewBox="0 0 200 280" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <g stroke="var(--c108-sand-gold)" stroke-width="2.6" stroke-linecap="round" fill="none">
        <!-- Centrální spine (vertikální kmen) -->
        <path d="M100 280 L100 60"/>
        <!-- LEVÝ list palmy: větve směřují UP-LEFT z centrálního spine, postupně se zkracují -->
        <line x1="100" y1="80"  x2="40"  y2="48"/>
        <line x1="100" y1="100" x2="32"  y2="78"/>
        <line x1="100" y1="120" x2="26"  y2="110"/>
        <line x1="100" y1="140" x2="22"  y2="142"/>
        <line x1="100" y1="160" x2="26"  y2="174"/>
        <line x1="100" y1="180" x2="34"  y2="204"/>
        <line x1="100" y1="200" x2="46"  y2="232"/>
        <line x1="100" y1="220" x2="60"  y2="252"/>
        <!-- PRAVÝ list palmy: zrcadleno -->
        <line x1="100" y1="80"  x2="160" y2="48"/>
        <line x1="100" y1="100" x2="168" y2="78"/>
        <line x1="100" y1="120" x2="174" y2="110"/>
        <line x1="100" y1="140" x2="178" y2="142"/>
        <line x1="100" y1="160" x2="174" y2="174"/>
        <line x1="100" y1="180" x2="166" y2="204"/>
        <line x1="100" y1="200" x2="154" y2="232"/>
        <line x1="100" y1="220" x2="140" y2="252"/>
        <!-- Vrcholový "zip" — drobné krátké větve nahoře jako v logu -->
        <line x1="100" y1="64" x2="86"  y2="50"/>
        <line x1="100" y1="64" x2="114" y2="50"/>
      </g>
    </svg>`;
    const left = document.createElement('div');
    left.className = 'c108-palm-deco left';
    left.innerHTML = palmSvg;
    footer.appendChild(left);
    const right = document.createElement('div');
    right.className = 'c108-palm-deco right';
    right.innerHTML = palmSvg;
    footer.appendChild(right);

    // v11: ODSTRANEN c108-footer-extra panel (proboural reviews layout - "108 palms stay and discovery..." text)
    // React footer ma vlastni dobry layout, jen palmy decoration na strane staci.
  }

  // v11: HIDE "WHAT GUESTS NOTICE FIRST" sekci
  function hideWhatGuestsNotice() {
    const heads = [...document.querySelectorAll('p, h2, h3, h4, [class*="eyebrow"], [class*="kicker"]')];
    for (const h of heads) {
      const txt = (h.textContent || '').trim().toLowerCase();
      if (txt === 'what guests notice first' || txt === 'co si hosté všimnou jako prvního' || txt === 'co si hosté všimnou jako první' || txt === 'co si hosté všimnou nejdřív') {
        // walk up to find the panel container (3-5 levels)
        let el = h;
        for (let i = 0; i < 8 && el; i++) {
          el = el.parentElement;
          if (!el) break;
          const cs = (typeof el.className === 'string') ? el.className : '';
          if (cs.includes('rounded') || cs.includes('panel') || cs.includes('lg:') || cs.includes('hidden')) {
            el.setAttribute('data-c108-hide-section', 'what-guests');
            return;
          }
        }
        // fallback
        const wrap = h.closest('[class*="rounded"]') || h.closest('section') || h.parentElement;
        if (wrap) wrap.setAttribute('data-c108-hide-section', 'what-guests');
      }
    }
  }

  // v11: SHIMMER on Reservation button hover — find a/button with text "Reservation"/"Rezervace"
  function applyReservationShimmer() {
    const els = [...document.querySelectorAll('a, button')];
    els.forEach(el => {
      if (el.dataset.c108ShimmerBtn) return;
      const txt = (el.textContent || '').trim();
      if (/^reservation$|^rezervace$|^plan your stay$|^naplánovat pobyt$/i.test(txt)) {
        el.classList.add('c108-shimmer-btn');
        el.dataset.c108ShimmerBtn = '1';
      }
    });
  }

  // v11: STAT CARDS (8.9/10, 11 units, 50 m) — fade-in load animation + heading
  function enhanceStatCards() {
    // v13.2: GUARD — runs maximalne 1× total
    if (document.body.dataset.c108StatsDone === '1') return;
    // Find the 3 stat cards by their content (8.9 / 10, 11 units, 50 m)
    const allCards = [...document.querySelectorAll('div, article')]
      .filter(d => {
        const t = (d.textContent || '').trim();
        // matches "8.9 / 10" OR "11 units" OR "50 m"
        return /^(8[.,]9\s*\/\s*10|11\s*units|50\s*m)/i.test(t) && t.length < 80;
      });
    if (allCards.length < 3) return;
    document.body.dataset.c108StatsDone = '1';
    // Identify common parent container (the cards row)
    const parents = allCards.map(c => c.parentElement);
    const commonParent = parents[0]; // assumption: same parent for all 3
    if (!commonParent || commonParent.dataset.c108StatsEnhanced) return;
    commonParent.dataset.c108StatsEnhanced = '1';

    const isCz = (document.documentElement.lang || '').toLowerCase().startsWith('cs');
    // Add heading above the row
    if (!commonParent.previousElementSibling?.classList?.contains('c108-stat-heading')) {
      const heading = document.createElement('div');
      heading.className = 'c108-stat-heading';
      heading.textContent = isCz ? 'Co rezort dělá rezortem' : 'What makes the resort';
      commonParent.parentElement?.insertBefore(heading, commonParent);
      // observe heading
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in-view')), {threshold: 0.15})
        .observe(heading);
    }
    // mark cards + observe
    allCards.slice(0, 3).forEach((card, i) => {
      card.setAttribute('data-c108-stat-card', '1');
      card.setAttribute('data-delay', String(i));
    });
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
      }
    }), {threshold: 0.18}).observe(commonParent);
    // also stagger via the cards
    allCards.slice(0, 3).forEach(card => {
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in-view')), {threshold: 0.2})
        .observe(card);
    });
  }

  // === 12. FAVICON ===
  function updateFavicon() {
    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) {
      fav = document.createElement('link');
      fav.rel = 'icon';
      document.head.appendChild(fav);
    }
    fetch('/branding/favicon-256.png', { method: 'HEAD' }).then(r => {
      if (r.ok) {
        fav.type = 'image/png';
        fav.href = '/branding/favicon-256.png';
      }
    }).catch(() => {});
  }

  // === Route change handler (SPA) — re-apply logo + favicon + footer + reviews ===
  function setupRouteWatch() {
    const onRouteChange = () => {
      setTimeout(() => {
        applyLogos();
        updateFavicon();
        applyWordStagger();
        applyImageReveal();
        applyTiltCards();
        setupFaqCategories();
        enhanceFooter();
        enhanceReviews();
        // Counters NEJSOU re-runned (vyrouna jen 1x)
      }, 200);
    };
    window.addEventListener('popstate', onRouteChange);
    // Monkey-patch pushState/replaceState
    const _push = history.pushState;
    history.pushState = function(...args) {
      const r = _push.apply(this, args);
      onRouteChange();
      return r;
    };
    const _replace = history.replaceState;
    history.replaceState = function(...args) {
      const r = _replace.apply(this, args);
      onRouteChange();
      return r;
    };
  }

  // === v10: BRAND PRELOADER (text intro → real LOGO IMAGE z brand packu) ===
  function setupPreloader() {
    if (sessionStorage.getItem('c108-preloaded') === '1') return;  // Jen 1× za session
    if (document.querySelector('.c108-preloader')) return;
    sessionStorage.setItem('c108-preloaded', '1');
    document.body.classList.add('c108-preloaded');
    const isLight = document.documentElement.classList.contains('light')
                    || document.documentElement.dataset.theme === 'light';
    // Real logo image z brand packu (mark-only varianta s 108+palmou)
    const logoSrc = isLight
      ? '/branding/preloader-mark-green.png'
      : '/branding/preloader-mark-cream.png';
    const pre = document.createElement('div');
    pre.className = 'c108-preloader';
    pre.setAttribute('aria-hidden', 'true');
    pre.innerHTML = `
      <div class="c108-preloader-inner">
        <div class="c108-preloader-text"><span>108 Palms · Beach Resort</span></div>
        <img class="c108-preloader-logo" src="${logoSrc}" alt="108 Palms Beach Resort" />
        <div class="c108-preloader-line"></div>
        <div class="c108-preloader-tag">Sampalthivu · Sri Lanka</div>
      </div>
    `;
    document.body.appendChild(pre);
    setTimeout(() => {
      document.body.classList.remove('c108-preloaded');
      setTimeout(() => pre.remove(), 800);
    }, 4400);
  }

  // === v9: STICKY BOOKING PILL ("NAPLÁNOVAT POBYT" uprostřed dole) ===
  function setupStickyBooking() {
    if (document.querySelector('.c108-sticky-booking')) return;
    const a = document.createElement('a');
    a.className = 'c108-sticky-booking';
    a.href = '/reservation';
    a.innerHTML = `<span class="label">Plan your stay</span><span class="arrow">→</span>`;
    document.body.appendChild(a);
    function onScroll() {
      const visible = window.scrollY > window.innerHeight * 0.6;
      a.classList.toggle('visible', visible);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // v13.1: ROBUST CZ detection - ONLY html.lang attribute (NO body subtree, would freeze page)
    const updateLabel = () => {
      a.querySelector('.label').textContent = isCzActive() ? 'Naplánovat pobyt' : 'Plan your stay';
    };
    updateLabel();
    // Pomaly retry kazdych 5s (prvni 30s) - lehky scan
    let tries = 0;
    const id = setInterval(() => { updateLabel(); if (++tries > 6) clearInterval(id); }, 5000);
    new MutationObserver(updateLabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-theme'] });
  }

  // === v9.5 marquee — REMOVED v10 per Tomáš PDF (no benefits ticker) ===
  function setupMarquee() { /* disabled */ }

  // === v10: PULL QUOTE — 10/10 quote VŽDY NAD 3 review cards (jako vlastní block PŘED reviews section) ===
  function enhanceReviews() {
    const headingNodes = [...document.querySelectorAll('h2, h3, [class*="kicker"]')];
    const reviewsHeading = headingNodes.find(h => /review|recenz/i.test(h.textContent));
    if (!reviewsHeading) return;
    const reviewsSection = reviewsHeading.closest('section') || reviewsHeading.parentElement?.parentElement;
    if (!reviewsSection) return;
    // Pokud už existuje pull quote ve stránce — neopakovat
    if (document.querySelector('.c108-pull-quote')) return;

    const isCz = (document.documentElement.lang || '').toLowerCase().startsWith('cs') ||
                 (document.documentElement.lang || '').toLowerCase().startsWith('cz');
    const pull = document.createElement('div');
    pull.className = 'c108-pull-quote';
    // 10/10 review (delší/ideální dle Tomáše) — Inka quote s rating 10/10
    pull.innerHTML = isCz ? `
      <blockquote>Úžasný resort na překrásném místě. Pláž se nachází hned pár metrů od ubytování a personál se o vás stará jako byste byli rodina.</blockquote>
      <div class="source"><strong>Inka</strong> · Booking.com · <span class="c108-rating10">10 / 10</span></div>
    ` : `
      <blockquote>Amazing resort in a beautiful place. The beach is only a few metres away and the staff take care of you as if you were family.</blockquote>
      <div class="source"><strong>Inka</strong> · Booking.com · <span class="c108-rating10">10 / 10</span></div>
    `;
    // KLÍČ: vložit jako sourozence PŘED reviews section (NE dovnitř!)
    // Tím nerozbiju React grid layout pro 3 review cards.
    reviewsSection.parentElement?.insertBefore(pull, reviewsSection);
  }

  // === v9.6: SCROLL PROGRESS BAR (zlatá linka nahoře) ===
  function setupScrollProgress() {
    if (document.querySelector('.c108-scroll-progress')) return;
    const bar = document.createElement('div');
    bar.className = 'c108-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    function onScroll() {
      const h = document.documentElement;
      const max = (h.scrollHeight - h.clientHeight) || 1;
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }

  // === v9.6: STICKY PINNED EDITORIAL (image left sticky, text scrolls right) ===
  function setupPinnedEditorial() {
    if (document.querySelector('.c108-editorial-wrap')) return;
    const acc = document.getElementById('accommodation');
    if (!acc) return;
    const isCz = isCzActive();

    const content = isCz ? {
      blocks: [
        { eb: 'Lokalita',  h: 'Vlastní pláž. Vlastní rytmus.',     p: 'Padesát metrů od vil začíná soukromý úsek pláže. Žádné lehátka v řadách, žádný animátor s mikrofonem. Jen palmy, písek a tichý rytmus východního pobřeží.' },
        { eb: 'Ubytování', h: 'Jedenáct vil. Žádný hotel.',        p: 'Místo standardních hotelových pater máme jedenáct vil a apartmánů — vlastní terasa, klimatizace, postel s nebesy, tikové dřevo. Hosté přilétají kvůli klidu, ne lobby.' },
        { eb: 'Služby',    h: 'Daňa vás zná jménem.',              p: 'Hosté nás opakovaně chválí za přístup, který se nepodobá spíš návštěvě v rodině než pobytu v hotelu. Snídaně se ladí podle vašich chutí, transfer z letiště zařídíme, výlety na Pigeon Island doporučí lokální průvodce. Žádné anonymní recepční schránky.' }
      ]
    } : {
      blocks: [
        { eb: 'Location',     h: 'A private beach. Your own rhythm.',           p: 'Fifty metres from the villas, the private stretch of beach begins. No rows of loungers, no entertainer with a microphone. Just palms, sand and the quiet rhythm of the east coast.' },
        { eb: 'Accommodation', h: 'Eleven villas. No hotel floors.',            p: 'Instead of standard hotel storeys we have eleven villas and apartments — private terrace, air conditioning, canopy bed, teak wood. Guests arrive for the calm, not the lobby.' },
        { eb: 'Service',      h: 'Dana knows you by name.',                     p: 'Guests repeatedly praise the kind of welcome that feels closer to a family visit than a hotel stay. Breakfast is tuned to your taste, airport transfers arranged, Pigeon Island trips suggested by a local guide. No anonymous reception inboxes.' }
      ]
    };

    // v13: WRAP — separates near-black background from layout
    const wrap = document.createElement('div');
    wrap.className = 'c108-editorial-wrap';
    const section = document.createElement('section');
    section.className = 'c108-pinned-editorial';
    section.innerHTML = `
      <div class="c108-pinned-media">
        <img src="/gallery/16-lounger-in-palms.jpg" alt="" loading="lazy" />
      </div>
      <div class="c108-pinned-text">
        ${content.blocks.map(b => `
          <article class="c108-pinned-block reveal">
            <span class="c108-pinned-eyebrow">${b.eb}</span>
            <h3>${b.h}</h3>
            <p>${b.p}</p>
          </article>
        `).join('')}
      </div>
    `;
    wrap.appendChild(section);
    acc.parentElement?.insertBefore(wrap, acc);

    // v13: Reveal on scroll - per Tomáš spec (threshold 0.15, unobserve)
    const blockObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          en.target.classList.add('in');
          blockObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    section.querySelectorAll('.c108-pinned-block, .reveal').forEach(b => blockObs.observe(b));

    // v13.3: VYPNUTO overflow strip — vyplo MutationObserver i tak by smyclo.
    // Sticky funguje tam kde primy parent nema overflow:hidden — coz je nas wrap.
  }

  // === v9.7: GALLERY LIGHTBOX (click-to-zoom fullscreen) ===
  function setupLightbox() {
    let images = [];
    let currentIdx = 0;

    // Build lightbox once
    if (!document.querySelector('.c108-lightbox')) {
      const lb = document.createElement('div');
      lb.className = 'c108-lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-hidden', 'true');
      lb.innerHTML = `
        <button class="c108-lightbox-prev" aria-label="Previous">←</button>
        <img class="c108-lightbox-img" alt="" />
        <button class="c108-lightbox-next" aria-label="Next">→</button>
        <button class="c108-lightbox-close" aria-label="Close">×</button>
        <div class="c108-lightbox-counter"></div>
      `;
      document.body.appendChild(lb);

      const imgEl = lb.querySelector('.c108-lightbox-img');
      const counter = lb.querySelector('.c108-lightbox-counter');
      const show = idx => {
        if (!images.length) return;
        currentIdx = (idx + images.length) % images.length;
        imgEl.src = images[currentIdx];
        counter.textContent = `${currentIdx + 1} / ${images.length}`;
      };
      const open = idx => {
        show(idx);
        lb.classList.add('is-open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      };
      const close = () => {
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      };
      lb.querySelector('.c108-lightbox-close').addEventListener('click', close);
      lb.querySelector('.c108-lightbox-prev').addEventListener('click', () => show(currentIdx - 1));
      lb.querySelector('.c108-lightbox-next').addEventListener('click', () => show(currentIdx + 1));
      lb.addEventListener('click', e => { if (e.target === lb) close(); });
      document.addEventListener('keydown', e => {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(currentIdx - 1);
        else if (e.key === 'ArrowRight') show(currentIdx + 1);
      });
      window.__c108Lightbox = { open, close };
    }

    // Bind to gallery images
    function rescan() {
      const candidates = [...document.querySelectorAll('img')].filter(img => {
        const src = img.currentSrc || img.src || '';
        return /\/gallery\//.test(src) || /\/rooms-v2\//.test(src);
      });
      images = [...new Set(candidates.map(i => i.currentSrc || i.src))].filter(Boolean);
      candidates.forEach(img => {
        if (img.dataset.c108LbBound) return;
        img.dataset.c108LbBound = '1';
        img.classList.add('c108-lightbox-trigger');
        img.addEventListener('click', e => {
          // Don't intercept inside React carousel controls (let arrows work)
          if (e.target.closest('button, a')) return;
          const idx = images.indexOf(img.currentSrc || img.src);
          window.__c108Lightbox?.open(idx >= 0 ? idx : 0);
        });
      });
    }
    rescan();
    // v13.3: VYPNUTO MutationObserver - lightbox bound jen jednou, React rerender ho neuhlidame
  }

  // === v9.7 time chip + v9.8 WhatsApp — REMOVED v10 per Tomáš PDF ===
  function setupTimeChip() { /* disabled */ }
  function setupWhatsApp() { /* disabled */ }

  // === v10: HIDE REACT RESERVATION POPUP ("Keep direct booking in view") ===
  // Robust: !important + intervalove retries po React rerenderech
  function hideReservationPopup() {
    let any = false;
    [...document.querySelectorAll('h3')].forEach(h => {
      const txt = (h.textContent || '').toLowerCase();
      if (!(txt.includes('keep direct booking') || txt.includes('naplánujte si pobyt'))) return;
      let el = h;
      for (let i = 0; i < 8 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        const cs = (typeof el.className === 'string') ? el.className : '';
        if (cs.includes('fixed') || cs.includes('bottom-5')) {
          el.style.setProperty('display', 'none', 'important');
          el.setAttribute('data-c108-hidden', '1');
          any = true;
          return;
        }
      }
      // fallback
      const wrap = h.closest('[class*="fixed"]') || h.closest('div');
      if (wrap) {
        wrap.style.setProperty('display', 'none', 'important');
        wrap.setAttribute('data-c108-hidden', '1');
        any = true;
      }
    });
    return any;
  }
  // Retry kazdych 500ms po dobu 5s aby chytil React mount
  function startReservationPopupKiller() {
    let tries = 0;
    const id = setInterval(() => {
      hideReservationPopup();
      if (++tries > 12) clearInterval(id);
    }, 500);
  }

  // === v9.8: HERO SCROLL CUE ===
  function setupScrollCue() {
    if (document.querySelector('.c108-scroll-cue')) return;
    const hero = document.querySelector('section, [class*="hero"], header')?.querySelector('video, [class*="hero"]')?.closest('section')
              || document.querySelector('section');
    if (!hero) return;
    if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
    const isCz = (document.documentElement.lang || '').toLowerCase().startsWith('cs');
    const cue = document.createElement('div');
    cue.className = 'c108-scroll-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML = `<span>${isCz ? 'Scroll' : 'Scroll'}</span><span class="line"></span>`;
    hero.appendChild(cue);
    function onScroll() {
      cue.classList.toggle('is-hidden', window.scrollY > 80);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // === v9.8: WAVE SVG DIVIDER (between hero and pinned editorial) ===
  function setupWaveDivider() {
    if (document.querySelector('.c108-wave-divider')) return;
    const ed = document.querySelector('.c108-editorial-wrap') || document.querySelector('.c108-pinned-editorial');
    if (!ed) return;
    const wave = document.createElement('div');
    wave.className = 'c108-wave-divider';
    wave.setAttribute('aria-hidden', 'true');
    wave.innerHTML = `
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C240,5 480,55 720,30 C960,5 1200,55 1440,30 L1440,60 L0,60 Z" />
      </svg>
    `;
    ed.parentElement?.insertBefore(wave, ed);
  }

  // === v9.8: SKIP TO CONTENT LINK (a11y) ===
  function setupSkipLink() {
    if (document.querySelector('.c108-skip-link')) return;
    const isCz = (document.documentElement.lang || '').toLowerCase().startsWith('cs');
    const a = document.createElement('a');
    a.className = 'c108-skip-link';
    a.href = '#accommodation';
    a.textContent = isCz ? 'Přejít na obsah' : 'Skip to content';
    document.body.insertBefore(a, document.body.firstChild);
  }

  // === INIT ===
  function init() {
    setupPreloader();
    spawnParticles();
    setupCursor();
    setupSectionIndicator();
    setupScrollProgress();
    applyWordStagger();
    applyCountersOnce();
    applyImageReveal();
    applyTiltCards();
    setupHeroVideo();
    setupLogoSwap();
    setupFaqCategories();
    enhanceFooter();
    enhanceReviews();
    setupSkipLink();
    setupPinnedEditorial();
    setupWaveDivider();
    // setupMarquee — REMOVED v10
    setupScrollCue();
    setupStickyBooking();
    setupLightbox();
    // setupTimeChip + setupWhatsApp — REMOVED v10
    hideReservationPopup();
    startReservationPopupKiller();
    hideWhatGuestsNotice();
    applyReservationShimmer();
    enhanceStatCards();
    updateFavicon();
    setupRouteWatch();
    // v13.3: VYPNUTO MutationObserver na body — zpusobovalo freeze.
    // Re-apply jen pri navigaci pres setupRouteWatch + retry intervalovy popup killer.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
