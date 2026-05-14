/**
 * Ansh Shah Portfolio - Main JavaScript
 * Page load animations and interactions
 */
document.addEventListener('DOMContentLoaded', () => {
  // Inject shared reveal styles and animate key text across pages
  ensureTextRevealStyles();
  initTextReveal();

  // Ensure muted autoplay previews start reliably across browsers.
  initAutoplayVideos();

  // Initialize staggered animations for hero elements
  initHeroAnimations();
  
  // Initialize smooth scroll for navigation
  initSmoothScroll();
  
  // Add scroll-based nav background
  initNavScroll();
  
  // Initialize hamburger menu for mobile
  initMobileMenu();
});

function initAutoplayVideos() {
  const autoplayVideos = document.querySelectorAll('video[autoplay]');

  if (!autoplayVideos.length) return;

  const replaceWithFallbackImage = (video) => {
    const fallbackSrc = video.dataset.fallbackImage;

    if (!fallbackSrc || video.dataset.fallbackApplied === 'true') return;

    const fallbackImage = document.createElement('img');
    fallbackImage.src = fallbackSrc;
    fallbackImage.alt = video.getAttribute('aria-label') || '';
    fallbackImage.loading = 'eager';
    fallbackImage.decoding = 'async';
    video.dataset.fallbackApplied = 'true';
    video.replaceWith(fallbackImage);
  };

  const tryPlay = (video) => {
    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        if (error && error.name === 'NotSupportedError') {
          replaceWithFallbackImage(video);
        }
      });
    }
  };

  autoplayVideos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.playsInline = true;

    if (video.hasAttribute('loop')) {
      video.loop = true;
    }

    video.addEventListener('error', () => replaceWithFallbackImage(video), { once: true });

    if (video.readyState >= 2) {
      tryPlay(video);
    } else {
      video.addEventListener('loadeddata', () => tryPlay(video), { once: true });
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;

    autoplayVideos.forEach((video) => {
      if (video.paused) {
        tryPlay(video);
      }
    });
  });
}

/**
 * Inject shared text reveal styles so all pages, including index.html,
 * can use the same motion language without duplicating CSS.
 */
function ensureTextRevealStyles() {
  if (document.getElementById('text-reveal-styles')) return;

  const style = document.createElement('style');
  style.id = 'text-reveal-styles';
  style.textContent = `
    .text-reveal {
      opacity: 0;
      transform: translate3d(0, 22px, 0);
      will-change: opacity, transform;
      transition:
        opacity var(--reveal-duration, 1.1s) cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0s),
        transform var(--reveal-duration, 1.1s) cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0s);
    }

    .text-reveal[data-reveal-direction="left"] {
      transform: translate3d(-26px, 0, 0);
    }

    .text-reveal[data-reveal-direction="right"] {
      transform: translate3d(26px, 0, 0);
    }

    .text-reveal[data-reveal-direction="soft"] {
      transform: translate3d(0, 14px, 0);
    }

    .text-reveal.is-visible,
    .text-reveal.is-visible[data-reveal-direction="left"],
    .text-reveal.is-visible[data-reveal-direction="right"],
    .text-reveal.is-visible[data-reveal-direction="soft"] {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }

    @media (prefers-reduced-motion: reduce) {
      .text-reveal {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

/**
 * Reveal text blocks as they enter the viewport with light staggered timing.
 */
function initTextReveal() {
  const prefersCompactReveal = window.matchMedia('(max-width: 768px)').matches;
  const revealGroups = [
    { selector: '.intro-left h1, .resume-intro h1', step: 0.08, direction: 'left' },
    { selector: '.flipbook-header', step: 0.08, direction: 'left', duration: 0.5 },
    { selector: '.intro-left p, .marketing-hero-copy .marketing-eyebrow, .marketing-hero-copy h1, .marketing-hero-copy p', step: 0.08, direction: 'left' },
    { selector: '.intro-actions, .marketing-actions, .resume-intro p', step: 0.08, direction: 'right' },
    { selector: '#work .project-tile .tile-label', step: 0.06, direction: 'soft' },
    { selector: '#loading-state p, .progress-meta, .flipbook-hint', step: 0.08, direction: 'right' },
    { selector: '.marketing-note, .marketing-scope', step: 0.08, direction: 'right' },
    { selector: '.marketing-showcase-head > div', step: 0.08, direction: 'left' },
    { selector: '.marketing-showcase-head > p', step: 0.08, direction: 'right' },
    { selector: '.marketing-tile-label', step: 0.06, direction: 'left' },
    { selector: '.marketing-service-card', step: 0.06, direction: 'right' },
    { selector: '.site-footer__brand', step: 0.05, direction: 'left' },
    { selector: '.site-footer__nav', step: 0.05, direction: 'soft' },
    { selector: '.site-footer__meta', step: 0.05, direction: 'right' },
    { selector: 'footer p, .footer-dark p', step: 0.05, direction: 'soft' }
  ];

  const seen = new Set();
  const revealItems = [];

  revealGroups.forEach((group) => {
    const elements = document.querySelectorAll(group.selector);

    elements.forEach((element, index) => {
      if (seen.has(element)) return;

      seen.add(element);
      element.classList.add('text-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index, 6) * (group.step || 0.06)}s`);
      element.style.setProperty('--reveal-duration', `${group.duration || 1.1}s`);

      if (group.direction) {
        element.dataset.revealDirection = group.direction;
      }

      revealItems.push(element);
    });
  });

  if (!revealItems.length) return;

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const revealIfInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top <= viewportHeight * (prefersCompactReveal ? 0.96 : 0.88);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: prefersCompactReveal ? 0.04 : 0.14,
    rootMargin: prefersCompactReveal ? '0px 0px -2% 0px' : '0px 0px -8% 0px'
  });

  revealItems.forEach((item) => {
    if (revealIfInViewport(item)) {
      item.classList.add('is-visible');
      return;
    }

    observer.observe(item);
  });
}

/**
 * Initialize hamburger menu toggle
 */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (!hamburger || !mobileMenu) return;
  
  hamburger.addEventListener('click', () => {
    const isActive = hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isActive);
    mobileMenu.setAttribute('aria-hidden', !isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
  });
  
  // Close menu when clicking a link
  const mobileLinks = mobileMenu.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });
}

/**
 * Initialize hero section fade-up animations
 */
function initHeroAnimations() {
  // Elements already have CSS animations with delays
  // This function can add additional JS-based interactions if needed
  
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    // Add subtle parallax effect on scroll
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const visual = document.querySelector('.hero-visual');
      if (visual && scrolled < 500) {
        visual.style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    });
  }
}

/**
 * Initialize smooth scroll for anchor links
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Add background to nav on scroll
 */
function initNavScroll() {
  const nav = document.querySelector('.sticky-nav');
  if (!nav) return;

  const updateNav = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
}

/**
 * Project card hover effects
 */
function initProjectCards() {
  const cards = document.querySelectorAll('.project-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.zIndex = '10';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.zIndex = '1';
    });
  });
}

// Run project card initialization
initProjectCards();

