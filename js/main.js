/* ═══════════════════════════════════════════════════════════════
   main.js — Interactions principales
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ────────────────────────────────────────
  // Menu mobile toggle
  // ────────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');

  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      const isOpen = navList.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Ferme le menu mobile au click sur un lien
    navList.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (navList.classList.contains('is-open')) {
          navList.classList.remove('is-open');
          navToggle.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', false);
          document.body.style.overflow = '';
        }
      });
    });
  }

  // ────────────────────────────────────────
  // FAQ Accordion
  // ────────────────────────────────────────
  document.querySelectorAll('.faq-item').forEach(function (item) {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    const toggle = function () {
      const isOpen = item.classList.toggle('is-open');
      question.setAttribute('aria-expanded', isOpen);
    };

    question.addEventListener('click', toggle);
    question.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  // ────────────────────────────────────────
  // Smooth scroll + offset header
  // ────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '#main') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
      const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });

  // ────────────────────────────────────────
  // Active nav link on scroll
  // ────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  if ('IntersectionObserver' in window && sections.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -60% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  }

  // ────────────────────────────────────────
  // Cookie consent (RGPD) — bandeau injecté dynamiquement
  // ────────────────────────────────────────
  const COOKIE_KEY = 'atlinker-cookie-consent';
  const consent = localStorage.getItem(COOKIE_KEY);

  if (consent === 'accepted') {
    window.atlinkerCookieConsent = 'accepted';
    enableAnalytics();
  } else if (consent !== 'refused') {
    // Pas de choix encore : on injecte le bandeau
    injectCookieBanner();
  }

  function injectCookieBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentement cookies');
    banner.innerHTML = ''
      + '<p>🍪 Nous utilisons des cookies pour mesurer l\'audience de ce site et améliorer votre expérience. '
      + '<a href="/confidentialite">En savoir plus</a></p>'
      + '<div class="cookie-banner-actions">'
      + '<button class="btn-refuse" type="button">Refuser</button>'
      + '<button class="btn-accept" type="button">Tout accepter</button>'
      + '</div>';
    document.body.appendChild(banner);

    banner.querySelector('.btn-accept').addEventListener('click', function () {
      localStorage.setItem(COOKIE_KEY, 'accepted');
      window.atlinkerCookieConsent = 'accepted';
      banner.remove();
      enableAnalytics();
    });

    banner.querySelector('.btn-refuse').addEventListener('click', function () {
      localStorage.setItem(COOKIE_KEY, 'refused');
      window.atlinkerCookieConsent = 'refused';
      banner.remove();
    });
  }

  function enableAnalytics() {
    // Met à jour Google Consent Mode v2 si gtag est chargé en mode "denied" par défaut
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied' // pas d'ads cookies, juste analytics
      });
    }
  }

  // Helper : envoie un event GA4 SEULEMENT si consent accepté
  function gtagIfConsent() {
    if (window.atlinkerCookieConsent !== 'accepted') return;
    if (typeof gtag !== 'function') return;
    gtag.apply(null, arguments);
  }
  window.gtagIfConsent = gtagIfConsent;

  // ────────────────────────────────────────
  // Track phone clicks (pour GA4)
  // ────────────────────────────────────────
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener('click', function () {
      gtagIfConsent('event', 'phone_click', {
        phone_number: link.getAttribute('href').replace('tel:', '')
      });
    });
  });

  // ────────────────────────────────────────
  // Track outbound clicks
  // ────────────────────────────────────────
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href.includes(window.location.hostname)) {
      link.addEventListener('click', function () {
        gtagIfConsent('event', 'outbound_click', { url: href });
      });
    }
  });

  // ────────────────────────────────────────
  // Scroll depth tracking (25%, 50%, 75%, 100%)
  // ────────────────────────────────────────
  const depthsTracked = { 25: false, 50: false, 75: false, 100: false };
  const trackScrollDepth = function () {
    const scrollPercent = Math.round(
      ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100
    );
    [25, 50, 75, 100].forEach(function (threshold) {
      if (scrollPercent >= threshold && !depthsTracked[threshold]) {
        depthsTracked[threshold] = true;
        gtagIfConsent('event', 'scroll_depth', { depth: threshold });
      }
    });
  };
  let scrollTimeout;
  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(trackScrollDepth, 200);
  }, { passive: true });

  // ────────────────────────────────────────
  // Engaged session (> 1 min sur page)
  // ────────────────────────────────────────
  setTimeout(function () {
    gtagIfConsent('event', 'engaged_session', { duration: 60 });
  }, 60000);
})();
