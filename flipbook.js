/**
 * Ansh Shah Portfolio - Flipbook JavaScript
 * PDF.js + StPageFlip integration for interactive portfolio
 */

// Configure PDF.js worker
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global pageFlip instance
let pageFlip = null;

/**
 * Initialize the flipbook when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Only run on portfolio page
  if (!document.getElementById('flipbook')) return;
  
  loadPDF();
});

/**
 * Load PDF and render as flipbook
 */
async function loadPDF() {
  const loadingState = document.getElementById('loading-state');
  const flipbookWrapper = document.getElementById('flipbook-wrapper');
  const flipbookEl = document.getElementById('flipbook');
  
  try {
    // Load the PDF
    const pdfPath = 'assets/portfolio.pdf';
    const pdf = await pdfjsLib.getDocument(pdfPath).promise;
    const totalPages = pdf.numPages;
    
    // Update total pages counter
    document.getElementById('total-pages').textContent = totalPages;
    
    // Render each PDF page to canvas, then to image
    const pages = [];
    
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const ctx = canvas.getContext('2d');
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
      
      pages.push(canvas.toDataURL('image/jpeg', 0.85));
    }
    
    // Inject pages into DOM
    pages.forEach((src, idx) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'page';
      
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Portfolio page ${idx + 1}`;
      img.loading = 'lazy';
      
      pageEl.appendChild(img);
      flipbookEl.appendChild(pageEl);
    });
    
    // Hide loading state
    loadingState.classList.add('hidden');
    flipbookWrapper.classList.remove('hidden');
    
    // Initialize StPageFlip
    initPageFlip();
    
  } catch (error) {
    console.error('Error loading PDF:', error);
    showErrorState(error);
  }
}

/**
 * Initialize StPageFlip library
 */
function initPageFlip() {
  const flipbookEl = document.getElementById('flipbook');
  
  // Create page flip instance
  pageFlip = new St.PageFlip(flipbookEl, {
    width: 550,
    height: 733,
    size: 'stretch',
    minWidth: 315,
    maxWidth: 1000,
    minHeight: 420,
    maxHeight: 1350,
    showCover: true,
    drawShadow: true,
    flippingTime: 700,
    usePortrait: false,
    startZIndex: 0,
    autoSize: true,
    maxShadowOpacity: 0.4,
    mobileScrollSupport: true
  });
  
  // Load pages from HTML
  pageFlip.loadFromHTML(document.querySelectorAll('.page'));
  
  // Update page counter on flip
  pageFlip.on('flip', (e) => {
    document.getElementById('current-page').textContent = e.data + 1;
  });
  
  // Setup navigation controls
  setupControls();
  
  // Setup keyboard navigation
  setupKeyboardNav();
}

/**
 * Setup button controls
 */
function setupControls() {
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  
  if (btnPrev && btnNext) {
    btnPrev.addEventListener('click', () => {
      if (pageFlip) pageFlip.flipPrev();
    });
    
    btnNext.addEventListener('click', () => {
      if (pageFlip) pageFlip.flipNext();
    });
  }
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (!pageFlip) return;
    
    if (e.key === 'ArrowRight') {
      pageFlip.flipNext();
    } else if (e.key === 'ArrowLeft') {
      pageFlip.flipPrev();
    }
  });
}

/**
 * Show error state if PDF fails to load
 */
function showErrorState(error) {
  const loadingState = document.getElementById('loading-state');
  const flipbookWrapper = document.getElementById('flipbook-wrapper');
  
  loadingState.innerHTML = `
    <p style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.1em; margin-top: 1.5rem; opacity: 0.6;">
      Unable to load portfolio PDF.<br>
      <span style="font-size: 10px; opacity: 0.5;">Please ensure portfolio.pdf exists in the assets folder.</span>
    </p>
  `;
  
  console.error('PDF Load Error:', error);
}

// Export for potential external use
window.portfolioFlipbook = {
  flipNext: () => pageFlip && pageFlip.flipNext(),
  flipPrev: () => pageFlip && pageFlip.flipPrev(),
  getPage: () => pageFlip ? pageFlip.getCurrentPageIndex() : 0
};