/**
 * Pointly Landing Page — app.js
 * ─────────────────────────────
 * 1. Custom magnetic cursor (dot + ring, RAF-driven)
 * 2. Navbar scroll state + glass blur
 * 3. Mobile menu toggle
 * 4. Smooth-scroll with nav-height offset
 * 5. Active nav-link highlight
 * 6. Scroll-reveal via IntersectionObserver
 * 7. Download click logging
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     1. CUSTOM CURSOR — magnetic dot + trailing ring
  ══════════════════════════════════════════════════ */
  var buddy = document.getElementById('buddy-cursor');
  var hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasPointer && buddy) {
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var buddyX = mouseX;
    var buddyY = mouseY;
    var LERP = 0.14;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Simulate states based on mouse speed (Gliding state)
      document.body.classList.add('is-gliding');
      clearTimeout(buddy.glideTimeout);
      buddy.glideTimeout = setTimeout(function() {
        document.body.classList.remove('is-gliding');
      }, 100);
    });

    function animateCursor () {
      buddyX += (mouseX - buddyX) * LERP;
      buddyY += (mouseY - buddyY) * LERP;
      
      // Offset by 20px so it floats beside the cursor (as requested)
      buddy.style.left = (buddyX + 20) + 'px';
      buddy.style.top  = (buddyY + 20) + 'px';

      requestAnimationFrame(animateCursor);
    }
    requestAnimationFrame(animateCursor);

    /* ── Hover states on interactive elements ── */
    var interactiveSelectors = [
      'a', 'button', '.feat-card', '.step',
      '.req-card', '.if-step', '.chip',
      '.cta-mode-tag', '.nav-link', '.nav-logo',
    ].join(',');

    document.querySelectorAll(interactiveSelectors).forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        document.body.classList.add('cursor--hover');
        // Extra class for anchors/buttons
        if (el.tagName === 'A' || el.tagName === 'BUTTON') {
          document.body.classList.add('cursor--link');
        }
      });
      el.addEventListener('mouseleave', function () {
        document.body.classList.remove('cursor--hover', 'cursor--link');
      });
    });

    /* ── Click feedback ── */
    document.addEventListener('mousedown', function () {
      document.body.classList.add('cursor--click');
    });
    document.addEventListener('mouseup', function () {
      document.body.classList.remove('cursor--click');
    });

    /* ── Hide when mouse leaves window ── */
    document.addEventListener('mouseleave', function () {
      buddy.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      buddy.style.opacity = '1';
    });
  } else {
    if (buddy) buddy.remove();
  }


  /* ══════════════════════════════════════════════════
     2. NAVBAR — scroll state
  ══════════════════════════════════════════════════ */
  var navbar = document.getElementById('navbar');

  function onScroll () {
    if (!navbar) return;
    navbar.classList.toggle('is-scrolled', window.scrollY > 20);
    highlightNav();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  /* ══════════════════════════════════════════════════
     3. MOBILE MENU
  ══════════════════════════════════════════════════ */
  var toggle = document.getElementById('nav-toggle');
  var drawer = document.getElementById('nav-drawer');

  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      drawer.setAttribute('aria-hidden', String(open));
      drawer.classList.toggle('is-open', !open);
    });

    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        drawer.classList.remove('is-open');
      });
    });
  }


  /* ══════════════════════════════════════════════════
     4. SMOOTH SCROLL (offset = nav height)
  ══════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '64',
        10
      );
      var top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  });


  /* ══════════════════════════════════════════════════
     5. ACTIVE NAV HIGHLIGHT
  ══════════════════════════════════════════════════ */
  var navLinks  = document.querySelectorAll('.nav-link');
  var sectionIds = ['features', 'how-it-works', 'install', 'about', 'download'];
  var sections   = sectionIds.map(function (id) { return document.getElementById(id); });

  function highlightNav () {
    if (!sections) return;
    var scrollY = window.scrollY + 90;
    var current = '';
    sections.forEach(function (sec) {
      if (sec && scrollY >= sec.offsetTop) current = sec.id;
    });
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href');
      if (id) {
        id = id.replace('#', '');
        a.classList.toggle('is-active', id === current);
      }
    });
  }


  /* ══════════════════════════════════════════════════
     6. SCROLL REVEAL
  ══════════════════════════════════════════════════ */
  var revealQuery = [
    '.feat-card', '.step', '.req-card', '.stat-item',
    '.about-para', '.about-chips', '.if-step',
    '.hero-badge', 'h1', '.hero-desc', '.hero-cta', '.hero-fine',
    '.cta-h2', '.cta-sub', '.cta-modes',
  ].join(',');

  var revealEls = document.querySelectorAll(revealQuery);

  revealEls.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = Math.min(i * 40, 380) + 'ms';
  });

  new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          // once visible, clear delay so it doesn't re-delay on scroll back
          entry.target.style.transitionDelay = '0ms';
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
  ).observe
    ? (function () {
        var obs = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) {
                e.target.classList.add('in');
                e.target.style.transitionDelay = '0ms';
              }
            });
          },
          { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
        );
        revealEls.forEach(function (el) { obs.observe(el); });
      })()
    : revealEls.forEach(function (el) { el.classList.add('in'); }); // fallback


  /* ══════════════════════════════════════════════════
     7. DOWNLOAD & LOGIN LOGIC
  ══════════════════════════════════════════════════ */
  var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  var loginModal = document.getElementById('login-modal');
  var loginForm = document.getElementById('login-form');
  var modalClose = document.getElementById('modal-close');
  var modalOverlay = document.getElementById('modal-overlay');
  var navLoginBtn = document.getElementById('nav-login-btn');
  var pendingDownload = null;

  function updateLoginState() {
    if (navLoginBtn) {
      navLoginBtn.textContent = isLoggedIn ? 'Logout' : 'Login';
    }
  }
  updateLoginState();

  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (isLoggedIn) {
        isLoggedIn = false;
        localStorage.setItem('isLoggedIn', 'false');
        updateLoginState();
        alert('You have been logged out.');
      } else {
        openModal();
      }
    });
  }

  function openModal() {
    if (loginModal) loginModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    if (loginModal) loginModal.setAttribute('aria-hidden', 'true');
    pendingDownload = null;
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      isLoggedIn = true;
      localStorage.setItem('isLoggedIn', 'true');
      updateLoginState();
      closeModal();
      
      if (pendingDownload) {
        var tempLink = document.createElement('a');
        tempLink.href = pendingDownload;
        tempLink.download = '';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        pendingDownload = null;
      }
    });
  }

  document.querySelectorAll('a[download]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      console.info('[Pointly] Download clicked');
      if (!isLoggedIn) {
        e.preventDefault();
        pendingDownload = btn.getAttribute('href');
        openModal();
      }
    });
  });

  /* ══════════════════════════════════════════════════
     8. WAVEFORM — pause animation when off-screen
  ══════════════════════════════════════════════════ */
  var waveform = document.querySelector('.waveform');
  if (waveform && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        waveform.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
        waveform.querySelectorAll('span').forEach(function (s) {
          s.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
        });
      });
    }, { threshold: 0.2 }).observe(waveform);
  }

})();
