(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const menuButton = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      mobileMenu.hidden = open;
    });
    $$('#mobile-menu a').forEach(link => link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
    }));
  }

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -20px' }) : null;
  $$('.reveal').forEach(el => revealObserver ? revealObserver.observe(el) : el.classList.add('visible'));

  const header = $('.site-header');
  const progress = $('.scroll-progress span');
  const dragon = $('#dragon-flight');
  const lineBg = $('.cinematic-lines');
  const glowA = $('.page-glow-a');
  const glowB = $('.page-glow-b');
  let ticking = false;

  const updateScrollFx = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, y / max));
    if (progress) progress.style.transform = `scaleX(${p})`;
    if (header) header.classList.toggle('scrolled', y > 20);

    if (!prefersReduced) {
      if (glowA) glowA.style.transform = `translate3d(0, ${Math.min(180, y * .08)}px, 0)`;
      if (glowB) glowB.style.transform = `translate3d(0, ${Math.max(-130, -y * .035)}px, 0)`;
      if (lineBg) lineBg.style.setProperty('--line-shift', `${(y * .07) % 80}px`);
      if (dragon && window.innerWidth > 600) {
        const start = .12, end = .54;
        const dp = Math.min(1, Math.max(0, (p - start) / (end - start)));
        const x = -560 + dp * (window.innerWidth + 700);
        const bob = Math.sin(dp * Math.PI * 3) * 36;
        const rot = -9 + Math.sin(dp * Math.PI * 2) * 7;
        const opacity = dp <= 0 || dp >= 1 ? 0 : Math.min(1, Math.min(dp * 6, (1 - dp) * 6));
        dragon.style.transform = `translate3d(${x}px, ${bob}px, 0) rotate(${rot}deg) scale(${.92 + dp * .14})`;
        dragon.style.opacity = opacity.toFixed(2);
      } else if (dragon) {
        dragon.style.opacity = '0';
      }
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollFx);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollFx, { passive: true });
  updateScrollFx();

  const sections = $$('main section[id]');
  const navLinks = $$('.desktop-nav a[href^="#"]');
  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-35% 0px -50% 0px' });
    sections.forEach(s => sectionObserver.observe(s));
  }

  const pointerGlow = $('.pointer-glow');
  if (pointerGlow && !prefersReduced && window.matchMedia('(hover:hover)').matches) {
    window.addEventListener('pointermove', e => {
      pointerGlow.style.opacity = '1';
      pointerGlow.style.left = `${e.clientX}px`;
      pointerGlow.style.top = `${e.clientY}px`;
    }, { passive: true });
    window.addEventListener('pointerleave', () => { pointerGlow.style.opacity = '0'; });
  }

  if (!prefersReduced && window.matchMedia('(hover:hover)').matches) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -8;
        const ry = ((e.clientX - r.left) / r.width - .5) * 9;
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });

    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * .08;
        const y = (e.clientY - (r.top + r.height / 2)) * .08;
        btn.style.transform = `translate(${x}px, ${y - 2}px)`;
      });
      btn.addEventListener('pointerleave', () => btn.style.transform = '');
    });
  }

  const canvas = $('#starfield');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d', { alpha: true });
    let stars = [];
    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(120, Math.max(45, Math.floor((w * h) / 18000)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + .2,
        a: Math.random() * .45 + .08,
        v: Math.random() * .08 + .02
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += s.v;
        if (s.y > h + 2) {
          s.y = -2;
          s.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(210,220,255,${s.a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    resize();
    draw();
    window.addEventListener('resize', resize, { passive: true });
  }

  const banner = $('#cookie-banner');
  const cookieAccept = $('#cookie-accept');
  const cookieEssential = $('#cookie-essential');
  const cookieOpen = $('#open-cookie-settings');
  const key = 'orbital_cookie_preference_v1';
  const showCookie = () => { if (banner) banner.hidden = false; };
  const saveCookie = value => {
    try { localStorage.setItem(key, value); } catch (_) {}
    if (banner) banner.hidden = true;
  };
  try {
    if (!localStorage.getItem(key)) setTimeout(showCookie, 700);
  } catch (_) {
    setTimeout(showCookie, 700);
  }
  cookieAccept?.addEventListener('click', () => saveCookie('acknowledged'));
  cookieEssential?.addEventListener('click', () => saveCookie('essential'));
  cookieOpen?.addEventListener('click', showCookie);
})();