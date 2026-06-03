/**
 * Stackly Store - Core Application Logic (Light Theme Edition)
 * Implements Preloader, Header Transitions, Cart Manager, Flash Countdown, Grid Filtering, and Testimonial Slider.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initHeaderScroll();
  initCartManager();
  initCountdown();
  initArrivalsFilter();
  initTestimonialSlider();
  initMobileMenu();
});

/* ==========================================
   1. PRELOADER CONTROLLER
   ========================================== */
function initPreloader() {
  const preloader = document.getElementById('page-preloader');
  
  // Smoothly exit preloader once everything is loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.body.classList.add('loaded');
      document.body.classList.remove('preloader-active');
    }, 800); // 800ms of display time for unique self-building ring animation
  });
}

/* ==========================================
   2. SCROLL HEADER CONTROLLER
   ========================================== */
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  if (!header) return;

  // Toggle scrolled class based on scroll position
  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      // Don't remove scrolled class if we are on an inner page that forces it
      const isInnerPage = window.location.pathname.includes('about') ||
                          window.location.pathname.includes('services') ||
                          window.location.pathname.includes('contact') ||
                          window.location.pathname.includes('login');
      if (!isInnerPage) {
        header.classList.remove('scrolled');
      }
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Run initially
}

/* ==========================================
   3. CART DRAWER & OPERATION MANAGER
   ========================================== */
let cart = JSON.parse(localStorage.getItem('aether_cart')) || [];

function initCartManager() {
  const trigger = document.getElementById('cart-drawer-trigger');
  const closeBtn = document.getElementById('cart-drawer-close');
  const overlay = document.getElementById('cart-overlay');
  const panel = document.getElementById('cart-drawer-panel');
  const checkoutBtn = document.getElementById('checkout-action-btn');

  // Trigger Open
  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '404.html';
    });
  }

  // Trigger Close
  const closeCart = () => {
    panel.classList.remove('active');
    overlay.classList.remove('active');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', closeCart);

  // Bind global references for inline HTML onclick handlers
  window.addToCart = addToCart;
  window.updateQty = updateQty;
  window.removeCartItem = removeCartItem;

  // Initial render
  renderCart();

  // Checkout alert
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Your cart is empty. Explore our selections first.');
        return;
      }
      alert('Redirecting to secure quantum checkout gateway...');
      cart = [];
      saveCart();
      renderCart();
      closeCart();
    });
  }
}

// Add item to cart
function addToCart(name, price, img) {
  const existingItemIndex = cart.findIndex(item => item.name === name);
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].qty += 1;
  } else {
    cart.push({ name, price, img, qty: 1 });
  }

  saveCart();
  renderCart();
  
  // Visual Micro-Feedback: Pulse cart badge
  const badge = document.getElementById('cart-badge-count');
  if (badge) {
    badge.style.transform = 'scale(1.4)';
    badge.style.background = 'var(--color-secondary)';
    setTimeout(() => {
      badge.style.transform = 'scale(1)';
      badge.style.background = 'var(--color-accent)';
    }, 300);
  }

  // Auto-open cart drawer to show added item
  const panel = document.getElementById('cart-drawer-panel');
  const overlay = document.getElementById('cart-overlay');
  if (panel && overlay) {
    panel.classList.add('active');
    overlay.classList.add('active');
  }
}

// Update quantity
function updateQty(index, amount) {
  cart[index].qty += amount;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  renderCart();
}

// Remove item from cart
function removeCartItem(index) {
  const items = document.querySelectorAll('.cart-item');
  if (items[index]) {
    items[index].style.transform = 'translateX(100px)';
    items[index].style.opacity = '0';
    items[index].style.transition = 'all 0.3s ease-out';
  }

  setTimeout(() => {
    cart.splice(index, 1);
    saveCart();
    renderCart();
  }, 300);
}

// Save cart to LocalStorage
function saveCart() {
  localStorage.setItem('aether_cart', JSON.stringify(cart));
}

// Render HTML for the cart
function renderCart() {
  const badge = document.getElementById('cart-badge-count');
  const cartList = document.getElementById('cart-items-list');
  const totalPriceElem = document.getElementById('cart-total-price');
  const emptyPrompt = document.getElementById('cart-empty-prompt');

  if (!cartList || !totalPriceElem || !badge) return;

  // Update total badge count
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  badge.textContent = totalItems;

  // Clear list except empty template
  cartList.innerHTML = '';

  if (cart.length === 0) {
    cartList.appendChild(emptyPrompt);
    totalPriceElem.textContent = '$0.00';
    return;
  }

  // Calculate sum & render items
  let totalSum = 0;
  cart.forEach((item, index) => {
    totalSum += item.price * item.qty;

    const itemHTML = `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.img}" alt="${item.name}">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-ctrl">
            <div class="cart-qty">
              <span class="cart-qty-btn" onclick="updateQty(${index}, -1)"><i class="fa-solid fa-minus"></i></span>
              <span class="cart-qty-num">${item.qty}</span>
              <span class="cart-qty-btn" onclick="updateQty(${index}, 1)"><i class="fa-solid fa-plus"></i></span>
            </div>
            <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
          </div>
        </div>
        <span class="cart-item-remove" onclick="removeCartItem(${index})" aria-label="Remove item"><i class="fa-solid fa-trash-can"></i></span>
      </div>
    `;
    cartList.insertAdjacentHTML('beforeend', itemHTML);
  });

  totalPriceElem.textContent = `$${totalSum.toFixed(2)}`;
}

/* ==========================================
   4. FLASH SALES COUNTDOWN
   ========================================== */
function initCountdown() {
  const hrBox = document.getElementById('deal-hours');
  const minBox = document.getElementById('deal-minutes');
  const secBox = document.getElementById('deal-seconds');

  if (!hrBox || !minBox || !secBox) return;

  // Create countdown logic: Reset to 4 hours on load, ticking down.
  // Alternatively, count down to end of current day. Let's do end of day.
  const updateTimer = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const diff = endOfDay - now;
    if (diff <= 0) {
      hrBox.textContent = '00';
      minBox.textContent = '00';
      secBox.textContent = '00';
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    hrBox.textContent = hours.toString().padStart(2, '0');
    minBox.textContent = minutes.toString().padStart(2, '0');
    secBox.textContent = seconds.toString().padStart(2, '0');
  };

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================
   5. ARRIVALS FILTER NAVIGATION
   ========================================== */
function initArrivalsFilter() {
  const tabs = document.querySelectorAll('.filter-tab');
  if (tabs.length === 0) return;

  window.filterArrivals = (category) => {
    // Update active tab class
    tabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.id === `tab-${category}`) {
        tab.classList.add('active');
      }
    });

    // Handle filtering grid items with transitions
    const items = document.querySelectorAll('.arrival-item');
    items.forEach(item => {
      const itemCat = item.getAttribute('data-category');
      
      // Reset animations
      item.style.transform = 'scale(0.9)';
      item.style.opacity = '0';
      
      setTimeout(() => {
        if (category === 'all' || itemCat === category) {
          item.classList.remove('grid-item-hidden');
          setTimeout(() => {
            item.style.transform = 'scale(1)';
            item.style.opacity = '1';
          }, 50);
        } else {
          item.classList.add('grid-item-hidden');
        }
      }, 200);
    });
  };
}

/* ==========================================
   6. TESTIMONIAL SLIDER
   ========================================== */
function initTestimonialSlider() {
  const track = document.getElementById('testimonials-track');
  const prevBtn = document.getElementById('testi-prev');
  const nextBtn = document.getElementById('testi-next');

  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  
  const getVisibleCards = () => {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1200) return 2;
    return 3;
  };

  const getCardWidth = () => {
    const cards = document.querySelectorAll('.testimonial-card');
    if (cards.length === 0) return 0;
    return cards[0].offsetWidth + 30; // Card width + gap
  };

  const slide = () => {
    const cards = document.querySelectorAll('.testimonial-card');
    const totalCards = cards.length;
    const visibleCards = getVisibleCards();
    
    // Bounds check
    const maxIndex = totalCards - visibleCards;
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex > maxIndex) currentIndex = maxIndex;

    const translateAmt = currentIndex * getCardWidth();
    track.style.transform = `translateX(-${translateAmt}px)`;
  };

  nextBtn.addEventListener('click', () => {
    const visibleCards = getVisibleCards();
    const cards = document.querySelectorAll('.testimonial-card');
    if (currentIndex < cards.length - visibleCards) {
      currentIndex++;
      slide();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      slide();
    }
  });

  // Re-adjust slider on resize
  window.addEventListener('resize', slide);
}

/* ==========================================
   7. RESPONSIVE MOBILE MENU
   ========================================== */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  if (!toggle) return;

  // Dynamically insert mobile menu HTML if it doesn't exist
  let drawer = document.getElementById('mobile-menu-panel');
  let overlay = document.getElementById('mobile-menu-overlay');

  if (!drawer) {
    const mobileMenuHTML = `
      <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>
      <aside class="mobile-menu-drawer" id="mobile-menu-panel">
        <div class="mobile-menu-header">
          <div class="mobile-menu-logo">
            <img src="assets/images/stackly_logo.png" class="stackly-logo" alt="Stackly Logo">
          </div>
          <button class="mobile-menu-close-btn" id="mobile-menu-close" aria-label="Close mobile menu">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div class="mobile-search-area">
          <div class="nav-search">
            <input type="text" placeholder="Search premium essentials..." class="nav-search-input" id="mobile-search-input">
            <button class="nav-search-btn" id="mobile-search-submit" aria-label="Search button">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
        </div>

        <div class="mobile-links-container">
          <ul class="mobile-nav-links">
            <li><a href="index.html" class="mobile-nav-link" id="mobile-link-home"><i class="fa-solid fa-house"></i> Home</a></li>
            <li><a href="404.html" class="mobile-nav-link" id="mobile-link-about"><i class="fa-solid fa-circle-info"></i> About</a></li>
            <li><a href="404.html" class="mobile-nav-link" id="mobile-link-services"><i class="fa-solid fa-gears"></i> Services</a></li>
            <li><a href="404.html" class="mobile-nav-link" id="mobile-link-contact"><i class="fa-solid fa-envelope"></i> Contact</a></li>
          </ul>
        </div>
        
        <div class="mobile-actions-area">
          <a href="404.html" class="btn-login" id="mobile-login-btn">
            <i class="fa-regular fa-user"></i> Login
          </a>
        </div>

        <div class="mobile-menu-footer">
          <div class="mobile-menu-socials">
            <a href="404.html" class="social-link" aria-label="Stackly on Twitter"><i class="fa-brands fa-twitter"></i></a>
            <a href="404.html" class="social-link" aria-label="Stackly on Discord"><i class="fa-brands fa-discord"></i></a>
            <a href="404.html" class="social-link" aria-label="Stackly on Github"><i class="fa-brands fa-github"></i></a>
          </div>
          <p>&copy; 2026 STACKLY Inc.</p>
        </div>
      </aside>
    `;
    document.body.insertAdjacentHTML('beforeend', mobileMenuHTML);
    drawer = document.getElementById('mobile-menu-panel');
    overlay = document.getElementById('mobile-menu-overlay');
  }

  const closeBtn = document.getElementById('mobile-menu-close');

  // Synchronize active navigation link highlight on mobile
  const desktopActiveLink = document.querySelector('.nav-links .nav-link.active');
  if (desktopActiveLink) {
    const activeHref = desktopActiveLink.getAttribute('href');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      const linkHref = link.getAttribute('href');
      if (linkHref === activeHref || (activeHref === 'index.html' && linkHref === '')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Toggle Drawer Open
  toggle.addEventListener('click', () => {
    drawer.classList.add('active');
    overlay.classList.add('active');
  });

  // Toggle Drawer Close
  const closeDrawer = () => {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  // Sync Search queries typed inside mobile drawer to standard desktop search inputs
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchSubmit = document.getElementById('mobile-search-submit');
  const desktopSearchInput = document.getElementById('search-input');

  if (mobileSearchInput && desktopSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      desktopSearchInput.value = e.target.value;
    });
  }

  if (mobileSearchSubmit && mobileSearchInput) {
    mobileSearchSubmit.addEventListener('click', () => {
      if (mobileSearchInput.value.trim() !== '') {
        alert(`Searching for: ${mobileSearchInput.value}`);
        closeDrawer();
      }
    });
    mobileSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && mobileSearchInput.value.trim() !== '') {
        alert(`Searching for: ${mobileSearchInput.value}`);
        closeDrawer();
      }
    });
  }
}