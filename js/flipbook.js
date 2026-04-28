/**
 * Ansh Shah Portfolio - Flipbook JavaScript
 * StPageFlip integration for JPG-based portfolio pages.
 */

let pageFlip = null;
let totalFlipbookPages = 0;
const imageCache = new Map();

// Page flip sound - using MP3 file
let flipAudio = null;

function initAudio() {
  try {
    flipAudio = new Audio('Paper_Flip.mp3');
    flipAudio.preload = 'auto';
  } catch (e) {
    console.warn('Audio not supported');
  }
}

function playFlipSound() {
  if (!flipAudio) return;
  
  // Clone the audio to allow overlapping plays
  const sound = flipAudio.cloneNode();
  sound.volume = 0.7;
  
  // Skip first 0.5 sec and trim last 0.5 sec
  sound.currentTime = 0.5;
  
  sound.play().catch(e => console.warn('Audio play failed:', e));
  
  // Stop early to trim the last 0.5 seconds
  const checkEnd = setInterval(() => {
    if (sound.duration && sound.currentTime >= sound.duration - 0.5) {
      sound.pause();
      clearInterval(checkEnd);
    }
  }, 50);
}

const coverPage = 'assets/images/Cover_Page.jpg';
const endPage = 'assets/images/End_Page.jpg';
const spreadPages = [
  'assets/images/Page_2.jpg',
  'assets/images/Page_3.jpg',
  'assets/images/Page_4.jpg',
  'assets/images/Page_5.jpg',
  'assets/images/Page_6.jpg',
  'assets/images/Page_7.jpg',
  'assets/images/Page_8.jpg',
  'assets/images/Page_9.jpg',
  'assets/images/Page_10.jpg',
  'assets/images/Page_11.jpg',
  'assets/images/Page_12.jpg',
  'assets/images/Page_13.jpg',
  'assets/images/Page_14.jpg',
  'assets/images/Page_15.jpg',
  'assets/images/Page_16.jpg'
];

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('flipbook')) return;

  // Initialize audio for page flip sounds
  initAudio();

  await loadJpgPages();
});

async function loadJpgPages() {
  const flipbookEl = document.getElementById('flipbook');
  const totalPagesEl = document.getElementById('total-pages');
  const currentPageEl = document.getElementById('current-page');
  const pageSlider = document.getElementById('page-slider');
  const flipbookPages = buildFlipbookPages();
  const imageSources = [coverPage, ...spreadPages, endPage];
  totalFlipbookPages = flipbookPages.length;

  totalPagesEl.textContent = totalFlipbookPages;
  currentPageEl.textContent = '1';
  if (pageSlider) {
    pageSlider.max = totalFlipbookPages;
    pageSlider.value = '1';
  }

  try {
    await preloadImages(imageSources);
  } catch (error) {
    showErrorState('One or more portfolio images could not be decoded.');
    console.error('Portfolio preload error:', error);
    return;
  }

  flipbookPages.forEach((page, index) => {
    flipbookEl.appendChild(createPageElement(page, index));
  });

  initPageFlip();
}

function preloadImages(sources) {
  const uniqueSources = [...new Set(sources)];

  return Promise.all(uniqueSources.map((src) => new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if (image.decode) {
        image.decode().then(() => {
          imageCache.set(src, image);
          resolve();
        }).catch(() => {
          imageCache.set(src, image);
          resolve();
        });
      } else {
        imageCache.set(src, image);
        resolve();
      }
    };

    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  })));
}

function buildFlipbookPages() {
  const pages = [
    {
      src: coverPage,
      label: 'Cover page',
      position: 'single'
    }
  ];

  spreadPages.forEach((src, index) => {
    const spreadNumber = index + 2;

    pages.push({
      src,
      label: `Portfolio spread ${spreadNumber}, left page`,
      position: 'left'
    });

    pages.push({
      src,
      label: `Portfolio spread ${spreadNumber}, right page`,
      position: 'right'
    });
  });

  pages.push({
    src: endPage,
    label: 'End page',
    position: 'single'
  });

  return pages;
}

function createPageElement(page, index) {
  const pageEl = document.createElement('div');
  pageEl.className = `page page-${page.position}`;

  if (page.position === 'single') {
    pageEl.dataset.density = 'hard';
  }

  const pageSurface = document.createElement('div');
  pageSurface.className = 'page-surface';
  pageSurface.setAttribute('role', 'img');
  pageSurface.setAttribute('aria-label', page.label);
  pageSurface.dataset.position = page.position;

  const pageImage = createPageImage(page);
  pageSurface.append(pageImage);

  pageEl.append(pageSurface);

  return pageEl;
}

function createPageImage(page) {
  const cachedImage = imageCache.get(page.src);
  const pageImage = cachedImage ? cachedImage.cloneNode(false) : new Image();

  pageImage.className = `page-image page-image--${page.position}`;
  pageImage.alt = '';
  pageImage.decoding = 'sync';
  pageImage.loading = 'eager';
  pageImage.draggable = false;
  pageImage.src = page.src;

  return pageImage;
}

function initPageFlip() {
  const flipbookEl = document.getElementById('flipbook');

  if (!window.St || !window.St.PageFlip) {
    showErrorState('StPageFlip library failed to load.');
    return;
  }

  pageFlip = new St.PageFlip(flipbookEl, {
    width: 612,
    height: 792,
    size: 'stretch',
    minWidth: 280,
    maxWidth: 1000,
    minHeight: 420,
    maxHeight: 1350,
    showCover: true,
    drawShadow: true,
    flippingTime: 850,
    usePortrait: true,
    startZIndex: 0,
    autoSize: true,
    maxShadowOpacity: 0.1,
    mobileScrollSupport: true
  });

  pageFlip.loadFromHTML(document.querySelectorAll('.page'));

  pageFlip.on('flip', (event) => {
    updatePageUI(event.data);
  });

  pageFlip.on('changeOrientation', (event) => {
    syncFlipbookLayout(event.data);
  });

  setupControls();
  setupProgressSlider();
  setupKeyboardNav();
  hideLoadingState();
  syncFlipbookLayout(pageFlip.getOrientation());
  updatePageUI(0);
}

function setupControls() {
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (pageFlip) {
        playFlipSound();
        pageFlip.flipPrev();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (pageFlip) {
        playFlipSound();
        pageFlip.flipNext();
      }
    });
  }
}

function setupProgressSlider() {
  const pageSlider = document.getElementById('page-slider');

  if (!pageSlider) return;

  pageSlider.addEventListener('input', () => {
    updateProgressFill(Number(pageSlider.value) - 1);
  });

  pageSlider.addEventListener('change', () => {
    if (!pageFlip) return;

    const targetIndex = Number(pageSlider.value) - 1;

    if (typeof pageFlip.flip === 'function') {
      playFlipSound();
      pageFlip.flip(targetIndex);
    } else if (typeof pageFlip.turnToPage === 'function') {
      pageFlip.turnToPage(targetIndex);
      updatePageUI(targetIndex);
    }
  });
}

function updatePageUI(pageIndex) {
  const currentPage = Math.min(Math.max(pageIndex + 1, 1), totalFlipbookPages);
  const currentPageEl = document.getElementById('current-page');
  const pageSlider = document.getElementById('page-slider');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  currentPageEl.textContent = currentPage;
  if (pageSlider) pageSlider.value = currentPage;
  updateProgressFill(pageIndex);

  if (btnPrev) btnPrev.disabled = pageIndex <= 0;
  if (btnNext) btnNext.disabled = pageIndex >= totalFlipbookPages - 1;
}

function updateProgressFill(pageIndex) {
  const pageSlider = document.getElementById('page-slider');
  const progressPercent = document.getElementById('progress-percent');
  const progress = totalFlipbookPages > 1
    ? Math.round((pageIndex / (totalFlipbookPages - 1)) * 100)
    : 0;

  if (pageSlider) pageSlider.style.setProperty('--progress', `${progress}%`);
  if (progressPercent) progressPercent.textContent = `${progress}%`;
}

function setupKeyboardNav() {
  document.addEventListener('keydown', (event) => {
    if (!pageFlip) return;

    if (event.key === 'ArrowRight') {
      playFlipSound();
      pageFlip.flipNext();
    }

    if (event.key === 'ArrowLeft') {
      playFlipSound();
      pageFlip.flipPrev();
    }
  });
}

function showErrorState(message) {
  const loadingState = document.getElementById('loading-state');
  const flipbookWrapper = document.getElementById('flipbook-wrapper');

  if (loadingState) {
    loadingState.classList.remove('hidden');
    loadingState.innerHTML = `
      <p class="flipbook-error">
        Unable to load portfolio images.<br>
        <span>${message}</span>
      </p>
    `;
    return;
  }

  if (!flipbookWrapper) return;

  flipbookWrapper.innerHTML = `
    <p class="flipbook-error">
      Unable to load portfolio images.<br>
      <span>${message}</span>
    </p>
  `;
}

function hideLoadingState() {
  const loadingState = document.getElementById('loading-state');
  const stage = document.querySelector('.flipbook-stage');
  const progress = document.querySelector('.portfolio-progress');
  const hint = document.querySelector('.flipbook-hint');

  if (loadingState) loadingState.classList.add('hidden');
  if (stage) stage.classList.add('is-ready');
  if (progress) progress.classList.add('is-ready');
  if (hint) hint.classList.add('is-ready');
}

function syncFlipbookLayout(orientation) {
  const stage = document.querySelector('.flipbook-stage');
  const wrapper = document.getElementById('flipbook-wrapper');
  const progress = document.querySelector('.portfolio-progress');

  if (!stage || !wrapper || !progress) return;

  const isPortrait = orientation === 'portrait';
  stage.classList.toggle('is-portrait', isPortrait);
  wrapper.classList.toggle('is-portrait', isPortrait);
  progress.classList.toggle('is-portrait', isPortrait);
}

window.portfolioFlipbook = {
  flipNext: () => pageFlip && pageFlip.flipNext(),
  flipPrev: () => pageFlip && pageFlip.flipPrev(),
  getPage: () => pageFlip ? pageFlip.getCurrentPageIndex() : 0
};
