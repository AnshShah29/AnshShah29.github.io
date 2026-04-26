/**
 * Ansh Shah Portfolio - Main JavaScript
 * Page load animations and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize staggered animations for hero elements
  initHeroAnimations();
  
  // Initialize smooth scroll for navigation
  initSmoothScroll();
  
  // Add scroll-based nav background
  initNavScroll();
});

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
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.style.background = 'rgba(245, 242, 237, 0.95)';
      nav.style.backdropFilter = 'blur(10px)';
    } else {
      nav.style.background = 'var(--bg)';
      nav.style.backdropFilter = 'none';
    }
  });
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