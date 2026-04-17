/**
 * LogixX Fertility — script.js
 * Mobile drawer, FAQ accordion, form handling, and UI interactions
 */

(function () {
  'use strict';

  /* ============================================================
     UTILITIES
     ============================================================ */

  /** Throttle: limit how often fn runs (e.g. scroll events) */
  function throttle(fn, delay) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  /** Simple email regex validation */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }

  /* ============================================================
     MOBILE DRAWER
     ============================================================ */

  var hamburgerBtn  = document.getElementById('hamburger-btn');
  var mobileDrawer  = document.getElementById('mobile-drawer');
  var drawerOverlay = document.getElementById('drawer-overlay');
  var drawerCloseBtn = document.getElementById('drawer-close-btn');
  var drawerLinks   = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
    document.body.classList.add('drawer-open');
    hamburgerBtn.classList.add('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    drawerOverlay.setAttribute('aria-hidden', 'false');
    // Shift focus into drawer for accessibility
    if (drawerCloseBtn) drawerCloseBtn.focus();
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    document.body.classList.remove('drawer-open');
    hamburgerBtn.classList.remove('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    drawerOverlay.setAttribute('aria-hidden', 'true');
    hamburgerBtn.focus();
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () {
      if (mobileDrawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  // Close on any drawer nav link click
  drawerLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeDrawer();
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Trap focus inside open drawer (Tab cycling)
  if (mobileDrawer) {
    mobileDrawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !mobileDrawer.classList.contains('open')) return;
      var focusable = mobileDrawer.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ============================================================
     STICKY HEADER — add/remove shadow based on scroll
     ============================================================ */

  var siteHeader = document.getElementById('site-header');

  if (siteHeader) {
    var onScroll = throttle(function () {
      if (window.scrollY > 10) {
        siteHeader.style.boxShadow = '0 2px 16px rgba(0,0,0,.12)';
      } else {
        siteHeader.style.boxShadow = '';
      }
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */

  var faqQuestions = document.querySelectorAll('.faq-question');

  function openFaqItem(btn) {
    var answerId = btn.getAttribute('aria-controls');
    var answer   = document.getElementById(answerId);
    if (!answer) return;
    btn.setAttribute('aria-expanded', 'true');
    answer.hidden = false;
  }

  function closeFaqItem(btn) {
    var answerId = btn.getAttribute('aria-controls');
    var answer   = document.getElementById(answerId);
    if (!answer) return;
    btn.setAttribute('aria-expanded', 'false');
    answer.hidden = true;
  }

  faqQuestions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all other open items first
      faqQuestions.forEach(function (otherBtn) {
        if (otherBtn !== btn) {
          closeFaqItem(otherBtn);
        }
      });

      if (isOpen) {
        closeFaqItem(btn);
      } else {
        openFaqItem(btn);
      }
    });
  });

  /* ============================================================
     EMAIL SUBSCRIBE FORM
     ============================================================ */

  var subscribeForm = document.getElementById('subscribe-form');
  var emailInput    = document.getElementById('email-input');
  var emailError    = document.getElementById('email-error');
  var formSuccess   = document.getElementById('form-success');

  if (subscribeForm) {
    subscribeForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var email = emailInput ? emailInput.value : '';

      // Clear previous errors / success
      if (emailError) emailError.textContent = '';
      if (emailInput) emailInput.classList.remove('error');

      // Validate
      if (!email || !isValidEmail(email)) {
        if (emailError) emailError.textContent = 'Please enter a valid email address.';
        if (emailInput) {
          emailInput.classList.add('error');
          emailInput.focus();
        }
        return;
      }

      // Show loading state
      var btnText    = subscribeForm.querySelector('.btn-text');
      var btnLoading = subscribeForm.querySelector('.btn-loading');
      var submitBtn  = subscribeForm.querySelector('[type="submit"]');

      if (btnText)    btnText.hidden    = true;
      if (btnLoading) btnLoading.hidden = false;
      if (submitBtn)  submitBtn.disabled = true;

      // Simulate async submission (replace with real API call)
      setTimeout(function () {
        if (btnText)    btnText.hidden    = false;
        if (btnLoading) btnLoading.hidden = true;
        if (submitBtn)  submitBtn.disabled = false;

        // Show success message and hide the form fields
        if (formSuccess) {
          formSuccess.hidden = false;
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        subscribeForm.querySelectorAll('.form-group').forEach(function (g) {
          g.style.display = 'none';
        });
        if (submitBtn) submitBtn.style.display = 'none';

        var privacyNote = subscribeForm.querySelector('.form-privacy');
        if (privacyNote) privacyNote.style.display = 'none';
      }, 1200);
    });
  }

  /* ============================================================
     ADD TO CART — toast notification
     ============================================================ */

  var addToCartBtns = document.querySelectorAll('.add-to-cart');
  var cartToast     = document.getElementById('cart-toast');
  var toastTimer    = null;

  function showToast(message) {
    if (!cartToast) return;
    // Build toast content safely without innerHTML to prevent XSS
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('aria-hidden', 'true');
    var polyline = document.createElementNS(svgNS, 'polyline');
    polyline.setAttribute('points', '20 6 9 17 4 12');
    svg.appendChild(polyline);
    var textNode = document.createTextNode(' ' + message);
    cartToast.textContent = '';
    cartToast.appendChild(svg);
    cartToast.appendChild(textNode);
    cartToast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      cartToast.classList.remove('show');
    }, 3000);
  }

  addToCartBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var productName = btn.getAttribute('data-product') || 'Item';
      var variantId   = btn.getAttribute('data-variant-id');
      var originalText = btn.textContent;
      btn.disabled = true;

      if (!variantId) {
        // Static / demo mode — no Shopify variant ID available
        btn.textContent = '✓ Added';
        showToast(productName + ' added to cart!');
        setTimeout(function () {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 1500);
        return;
      }

      // POST to Shopify AJAX Cart API
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: parseInt(variantId, 10), quantity: 1 }] })
      })
        .then(function (response) {
          if (!response.ok) {
            return response.json().then(function (err) { throw err; });
          }
          return response.json();
        })
        .then(function () {
          btn.textContent = '✓ Added';
          showToast(productName + ' added to cart!');
          setTimeout(function () {
            btn.textContent = originalText;
            btn.disabled = false;
          }, 1500);
        })
        .catch(function () {
          showToast("Couldn't add to cart. Please try again.");
          btn.textContent = originalText;
          btn.disabled = false;
        });
    });
  });

  /* ============================================================
     SMOOTH ANCHOR SCROLL — account for sticky header height
     ============================================================ */

  var headerHeight = siteHeader ? siteHeader.offsetHeight : 72;

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      var target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
      var targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });

})();
