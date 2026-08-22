/**
 * Pointly Landing Page — app.js
 * ─────────────────────────────────────────────────────────
 * 1. Ambient AI Cursor Co-pilot Follower
 *    - Organic 60fps RAF lerping & offset beside cursor
 *    - Expressive eye tracking & natural blinks
 *    - 100% mouse click pass-through (pointer-events: none)
 *    - Dynamic states: Idle, Listening, Reasoning, Responding, Navigating
 * 2. Adaptive State Engine (Live Showcase Playground)
 *    - Real-time state switcher
 *    - Interactive feedback & live guidance captions
 *    - Canvas cursor & pupil tracking
 * 3. Firebase Google Authentication & User State Management
 *    - Google Sign-In with Firebase Auth popup
 *    - Email/Password sign-in
 *    - Automatic auth state persistence & user avatar in navbar
 *    - Seamless download continuation on sign-in
 * 4. Navbar scroll state + glass blur
 * 5. Mobile menu drawer toggle
 * 6. Smooth-scroll with nav offset
 * 7. Active nav-link highlight
 * 8. Scroll-reveal via IntersectionObserver
 * 9. Audio Waveform observer
 */
(function () {
  'use strict';

  /* ═════════════════════════════════════════════════════════════
     1. AMBIENT CURSOR CO-PILOT FOLLOWER (100% PASS-THROUGH)
  ═════════════════════════════════════════════════════════════ */
  var buddy = document.getElementById('buddy-cursor');
  var caption = buddy ? buddy.querySelector('.buddy-mini-caption') : null;
  var captionText = buddy ? buddy.querySelector('.caption-text') : null;
  var pupils = buddy ? buddy.querySelectorAll('.buddy-pupil') : [];

  var hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasPointer && buddy) {
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var prevMouseX = mouseX;
    var prevMouseY = mouseY;
    var buddyX = mouseX;
    var buddyY = mouseY;
    var LERP = 0.16;
    var glideTimer = null;
    var captionTimer = null;

    document.addEventListener('mousemove', function (e) {
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;

      var dx = mouseX - prevMouseX;
      var dy = mouseY - prevMouseY;
      var speed = Math.sqrt(dx * dx + dy * dy);

      var lookX = Math.max(-1.2, Math.min(1.2, dx * 0.15));
      var lookY = Math.max(-1.2, Math.min(1.2, dy * 0.15));
      pupils.forEach(function (pupil) {
        pupil.style.transform = 'translate(' + lookX + 'px, ' + lookY + 'px)';
      });

      if (speed > 14) {
        buddy.classList.add('gliding');
        clearTimeout(glideTimer);
        glideTimer = setTimeout(function () {
          buddy.classList.remove('gliding');
          pupils.forEach(function (pupil) {
            pupil.style.transform = 'translate(0, 0)';
          });
        }, 120);
      }
    });

    function animateBuddyCursor() {
      buddyX += (mouseX - buddyX) * LERP;
      buddyY += (mouseY - buddyY) * LERP;

      buddy.style.transform = 'translate3d(' + (buddyX + 16) + 'px, ' + (buddyY + 16) + 'px, 0)';

      requestAnimationFrame(animateBuddyCursor);
    }
    requestAnimationFrame(animateBuddyCursor);

    function showMiniCaption(text, duration) {
      if (!caption || !captionText) return;
      captionText.textContent = text;
      caption.classList.add('visible');
      clearTimeout(captionTimer);
      if (duration) {
        captionTimer = setTimeout(function () {
          caption.classList.remove('visible');
        }, duration);
      }
    }

    function hideMiniCaption() {
      if (!caption) return;
      clearTimeout(captionTimer);
      caption.classList.remove('visible');
    }

    var interactiveElements = [
      { sel: 'a, button, .btn, .nav-link', state: 'listening', msg: 'Voice Active' },
      { sel: 'input, textarea', state: 'thinking', msg: 'Gemini AI Ready' },
      { sel: '.feat-card, .pillar-card, .step', state: 'speaking', msg: 'Pointly Ready' },
    ];

    interactiveElements.forEach(function (item) {
      document.querySelectorAll(item.sel).forEach(function (el) {
        el.addEventListener('mouseenter', function () {
          buddy.classList.remove('idle', 'listening', 'thinking', 'speaking', 'gliding');
          buddy.classList.add(item.state);
          showMiniCaption(item.msg, 1800);
        });

        el.addEventListener('mouseleave', function () {
          buddy.classList.remove('listening', 'thinking', 'speaking');
          buddy.classList.add('idle');
          hideMiniCaption();
        });
      });
    });

    document.addEventListener('mousedown', function () {
      buddy.classList.add('click-bounce');
    });

    document.addEventListener('mouseup', function () {
      setTimeout(function () {
        buddy.classList.remove('click-bounce');
      }, 350);
    });

    document.addEventListener('mouseleave', function () {
      buddy.style.opacity = '0';
    });

    document.addEventListener('mouseenter', function () {
      buddy.style.opacity = '1';
    });

  } else {
    if (buddy) buddy.remove();
  }


  /* ═════════════════════════════════════════════════════════════
     2. ADAPTIVE STATE ENGINE (LIVE SHOWCASE PLAYGROUND)
  ═════════════════════════════════════════════════════════════ */
  var stageBuddy = document.getElementById('stage-buddy');
  var stageBubbleText = document.getElementById('stage-bubble-text');
  var stageGlow = document.getElementById('stage-glow');
  var stateButtons = document.querySelectorAll('.state-btn');
  var stageContainer = document.getElementById('showcase-stage');
  var stagePupils = stageBuddy ? stageBuddy.querySelectorAll('.stage-pupil') : [];

  var stateDescriptions = {
    idle: "Idle State: Sits ambiently beside your cursor with subtle visual readiness and 100% click pass-through.",
    listening: "Voice Active: Capturing your push-to-talk voice command in real-time with sub-second STT (Ctrl+Space).",
    thinking: "AI Reasoning: Google Gemini AI models analyze active context and generate multi-step actions.",
    speaking: "Responding: Pointly provides audio affirmation and step confirmation via Sarvam AI voice engine.",
    gliding: "Navigating: Gliding to UI controls and spotlighting application buttons across your active screen."
  };

  var glowColors = {
    idle: "radial-gradient(circle, rgba(184, 20, 50, 0.22) 0%, transparent 70%)",
    listening: "radial-gradient(circle, rgba(255, 0, 85, 0.4) 0%, transparent 70%)",
    thinking: "radial-gradient(circle, rgba(255, 77, 109, 0.38) 0%, transparent 70%)",
    speaking: "radial-gradient(circle, rgba(255, 133, 161, 0.4) 0%, transparent 70%)",
    gliding: "radial-gradient(circle, rgba(255, 77, 109, 0.32) 0%, transparent 70%)"
  };

  function setStageBuddyState(stateName) {
    if (!stageBuddy) return;

    stateButtons.forEach(function (btn) {
      var isTarget = btn.getAttribute('data-state') === stateName;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', String(isTarget));
    });

    stageBuddy.className = 'stage-buddy ' + stateName;

    if (stageBubbleText && stateDescriptions[stateName]) {
      stageBubbleText.textContent = stateDescriptions[stateName];
    }

    if (stageGlow && glowColors[stateName]) {
      stageGlow.style.background = glowColors[stateName];
    }

    if (stageContainer) {
      stageContainer.classList.toggle('is-speaking', stateName === 'speaking');
    }
  }

  stateButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetState = btn.getAttribute('data-state');
      setStageBuddyState(targetState);
    });
  });

  var pokePhrases = [
    "Ambient co-pilot active and ready.",
    "100% click pass-through enabled across all desktop software.",
    "Hold Ctrl+Space anytime to speak voice commands.",
    "Draft mail in Word — guided step-by-step UI pointing.",
    "Press Ctrl+T to summon the silent typing capsule.",
    "Zero window disruption. Pure desktop flow."
  ];
  var pokeIndex = 0;

  if (stageBuddy) {
    stageBuddy.addEventListener('click', function () {
      var orb = stageBuddy.querySelector('.stage-orb');
      if (orb) {
        orb.style.animation = 'none';
        void orb.offsetWidth;
        orb.style.animation = 'buddyJiggle 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97)';
      }

      if (stageBubbleText) {
        stageBubbleText.textContent = pokePhrases[pokeIndex % pokePhrases.length];
        pokeIndex++;
      }
    });

    if (stageContainer) {
      stageContainer.addEventListener('mousemove', function (e) {
        var rect = stageBuddy.getBoundingClientRect();
        var buddyCenterX = rect.left + rect.width / 2;
        var buddyCenterY = rect.top + rect.height / 2;

        var dx = e.clientX - buddyCenterX;
        var dy = e.clientY - buddyCenterY;
        var angle = Math.atan2(dy, dx);
        var dist = Math.min(3, Math.sqrt(dx * dx + dy * dy) * 0.03);

        var px = Math.cos(angle) * dist;
        var py = Math.sin(angle) * dist;

        stagePupils.forEach(function (pupil) {
          pupil.style.transform = 'translate(' + px + 'px, ' + py + 'px)';
        });
      });

      stageContainer.addEventListener('mouseleave', function () {
        stagePupils.forEach(function (pupil) {
          pupil.style.transform = 'translate(0, 0)';
        });
      });
    }
  }


  /* ═════════════════════════════════════════════════════════════
     3. FIREBASE GOOGLE AUTH & USER STATE MANAGEMENT
  ═════════════════════════════════════════════════════════════ */
  var loginModal = document.getElementById('login-modal');
  var authFormView = document.getElementById('auth-form-view');
  var authUserView = document.getElementById('auth-user-view');
  var authErrorMsg = document.getElementById('auth-error-msg');
  var googleSignInBtn = document.getElementById('google-signin-btn');
  var loginForm = document.getElementById('login-form');
  var modalClose = document.getElementById('modal-close');
  var modalOverlay = document.getElementById('modal-overlay');
  var modalSignoutBtn = document.getElementById('modal-signout-btn');
  var navLoginBtn = document.getElementById('nav-login-btn');
  var navUserChip = document.getElementById('nav-user-chip');
  var navUserAvatar = document.getElementById('nav-user-avatar');
  var navUserName = document.getElementById('nav-user-name');
  var modalUserAvatar = document.getElementById('modal-user-avatar');
  var modalUserName = document.getElementById('modal-user-name');
  var modalUserEmail = document.getElementById('modal-user-email');

  var pendingDownload = null;
  var currentUser = null;

  function setAuthError(msg) {
    if (!authErrorMsg) return;
    if (msg) {
      authErrorMsg.textContent = msg;
      authErrorMsg.style.display = 'block';
    } else {
      authErrorMsg.textContent = '';
      authErrorMsg.style.display = 'none';
    }
  }

  function updateAuthUI(user) {
    currentUser = user;
    var isLoggedIn = Boolean(user);

    if (isLoggedIn) {
      var displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Pointly User');
      var photoURL = user.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(user.email || displayName);

      // Update Navbar
      if (navUserChip) {
        navUserChip.style.display = 'inline-flex';
        if (navUserAvatar) navUserAvatar.src = photoURL;
        if (navUserName) navUserName.textContent = displayName;
      }
      if (navLoginBtn) {
        navLoginBtn.textContent = 'Account';
      }

      // Update Modal
      if (authFormView) authFormView.style.display = 'none';
      if (authUserView) authUserView.style.display = 'block';
      if (modalUserAvatar) modalUserAvatar.src = photoURL;
      if (modalUserName) modalUserName.textContent = displayName;
      if (modalUserEmail) modalUserEmail.textContent = user.email || 'Google Account';

      setAuthError(null);

      // Trigger any pending download on sign in
      if (pendingDownload) {
        var tempLink = document.createElement('a');
        tempLink.href = pendingDownload;
        tempLink.download = '';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        pendingDownload = null;
        closeModal();
      }

    } else {
      // Logged Out
      if (navUserChip) navUserChip.style.display = 'none';
      if (navLoginBtn) navLoginBtn.textContent = 'Sign In';
      if (authFormView) authFormView.style.display = 'block';
      if (authUserView) authUserView.style.display = 'none';
      setAuthError(null);
    }
  }

  // Check Firebase Auth state observer if available
  if (window.auth && typeof window.auth.onAuthStateChanged === 'function') {
    window.auth.onAuthStateChanged(function (user) {
      updateAuthUI(user);
    });
  } else {
    // Check localStorage fallback
    var cached = localStorage.getItem('pointly_user');
    if (cached) {
      try { updateAuthUI(JSON.parse(cached)); } catch (e) { updateAuthUI(null); }
    }
  }

  function openModal() {
    if (loginModal) loginModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    if (loginModal) loginModal.setAttribute('aria-hidden', 'true');
    setAuthError(null);
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  }

  if (navUserChip) {
    navUserChip.addEventListener('click', function () {
      openModal();
    });
  }

  // Google Sign In Button Handler
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', function () {
      setAuthError(null);
      var origContent = googleSignInBtn.innerHTML;
      googleSignInBtn.disabled = true;
      googleSignInBtn.style.opacity = '0.7';

      if (window.isFirebaseConfigured && window.auth && window.googleProvider) {
        window.auth.signInWithPopup(window.googleProvider)
          .then(function (result) {
            googleSignInBtn.disabled = false;
            googleSignInBtn.style.opacity = '1';
            googleSignInBtn.innerHTML = origContent;
            updateAuthUI(result.user);
            closeModal();
          })
          .catch(function (error) {
            googleSignInBtn.disabled = false;
            googleSignInBtn.style.opacity = '1';
            googleSignInBtn.innerHTML = origContent;

            if (error.code === 'auth/popup-closed-by-user') {
              return;
            }

            console.warn('[Pointly Auth Error]', error.code, error.message);
            // Fallback for development / missing API keys
            setAuthError('Notice: ' + (error.message || 'Firebase Google Sign-In requires active project credentials in firebase-config.js.'));
          });
      } else {
        // Simulated Google Sign-In Demo Mode (for instant developer preview without live credentials)
        setTimeout(function () {
          googleSignInBtn.disabled = false;
          googleSignInBtn.style.opacity = '1';
          googleSignInBtn.innerHTML = origContent;

          var demoUser = {
            displayName: 'Pointly Pioneer',
            email: 'user@pointly.ai',
            photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=PointlyHero'
          };
          localStorage.setItem('pointly_user', JSON.stringify(demoUser));
          updateAuthUI(demoUser);
          closeModal();
        }, 500);
      }
    });
  }

  // Email / Password Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      setAuthError(null);
      var emailInput = document.getElementById('username');
      var email = emailInput ? emailInput.value : 'user@domain.com';

      var userObj = {
        displayName: email.split('@')[0],
        email: email,
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(email)
      };

      localStorage.setItem('pointly_user', JSON.stringify(userObj));
      updateAuthUI(userObj);
      closeModal();
    });
  }

  // Sign Out Handler
  function handleSignOut() {
    if (window.auth && typeof window.auth.signOut === 'function') {
      window.auth.signOut().then(function () {
        localStorage.removeItem('pointly_user');
        updateAuthUI(null);
        closeModal();
      }).catch(function () {
        localStorage.removeItem('pointly_user');
        updateAuthUI(null);
        closeModal();
      });
    } else {
      localStorage.removeItem('pointly_user');
      updateAuthUI(null);
      closeModal();
    }
  }

  if (modalSignoutBtn) {
    modalSignoutBtn.addEventListener('click', handleSignOut);
  }

  // Intercept Download buttons if user is not signed in
  document.querySelectorAll('a[download]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (!currentUser) {
        e.preventDefault();
        pendingDownload = btn.getAttribute('href');
        openModal();
      }
    });
  });


  /* ═════════════════════════════════════════════════════════════
     4. NAVBAR — SCROLL STATE
  ═════════════════════════════════════════════════════════════ */
  var navbar = document.getElementById('navbar');

  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle('is-scrolled', window.scrollY > 20);
    highlightNav();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  /* ═════════════════════════════════════════════════════════════
     5. MOBILE MENU
  ═════════════════════════════════════════════════════════════ */
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


  /* ═════════════════════════════════════════════════════════════
     6. SMOOTH SCROLL (offset = nav height)
  ═════════════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '68',
        10
      );
      var top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  });


  /* ═════════════════════════════════════════════════════════════
     7. ACTIVE NAV HIGHLIGHT
  ═════════════════════════════════════════════════════════════ */
  var navLinks = document.querySelectorAll('.nav-link');
  var sectionIds = ['features', 'demo', 'how-it-works', 'install', 'about', 'download'];
  var sections = sectionIds.map(function (id) { return document.getElementById(id); });

  function highlightNav() {
    if (!sections) return;
    var scrollY = window.scrollY + 100;
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


  /* ═════════════════════════════════════════════════════════════
     8. SCROLL REVEAL
  ═════════════════════════════════════════════════════════════ */
  var revealQuery = [
    '.feat-card', '.step', '.req-card', '.stat-item',
    '.about-para', '.about-chips', '.if-step', '.showcase-card',
    '.hero-badge', 'h1', '.hero-desc', '.hero-cta', '.hero-fine',
    '.cta-h2', '.cta-sub', '.cta-modes'
  ].join(',');

  var revealEls = document.querySelectorAll(revealQuery);

  revealEls.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = Math.min(i * 35, 350) + 'ms';
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            entry.target.style.transitionDelay = '0ms';
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -28px 0px' }
    );
    revealEls.forEach(function (el) { obs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }


  /* ═════════════════════════════════════════════════════════════
     9. WAVEFORM OBSERVER
  ═════════════════════════════════════════════════════════════ */
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
