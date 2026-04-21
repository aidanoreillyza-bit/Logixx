/**
 * Tests for script.js
 *
 * Each test group re-loads the module via jest.isolateModules so the IIFE
 * binds event listeners against a freshly constructed DOM.
 */

'use strict';

/* ── global jsdom stubs ───────────────────────────────────────────────────── */

// jsdom does not implement scrollIntoView; stub it globally so script.js
// can call it without throwing.
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// jsdom does not implement window.scrollTo; stub it globally to suppress
// the "not implemented" console error emitted when the smooth-scroll
// handler fires outside of the Smooth anchor scroll test group (where it
// is already spied on per-test).
window.scrollTo = jest.fn();

/* ── shared HTML fixture ─────────────────────────────────────────────────── */

function buildDOM() {
  document.body.innerHTML = `
    <header id="site-header"></header>

    <button id="hamburger-btn" aria-expanded="false" aria-controls="mobile-drawer"></button>
    <div id="drawer-overlay" aria-hidden="true"></div>
    <nav id="mobile-drawer" aria-hidden="true">
      <button id="drawer-close-btn"></button>
      <a href="#why-us"   class="drawer-link">Why Us</a>
      <a href="#products" class="drawer-link">Products</a>
      <a href="#faq"      class="drawer-link">FAQ</a>
    </nav>

    <div class="faq-list">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-1">Q1</button>
      <div id="faq-1" hidden>A1</div>

      <button class="faq-question" aria-expanded="false" aria-controls="faq-2">Q2</button>
      <div id="faq-2" hidden>A2</div>

      <button class="faq-question" aria-expanded="false" aria-controls="faq-3">Q3</button>
      <div id="faq-3" hidden>A3</div>
    </div>

    <form id="subscribe-form" novalidate>
      <div class="form-group">
        <input id="email-input" type="email" />
      </div>
      <span id="email-error"></span>
      <div id="form-success" hidden></div>
      <button type="submit">
        <span class="btn-text">Subscribe</span>
        <span class="btn-loading" hidden>Loading…</span>
      </button>
      <p class="form-privacy">Privacy note</p>
    </form>

    <button class="add-to-cart" data-product="FertilBoost Pro">Add to Cart</button>
    <button class="add-to-cart" data-product="MaleVital Max">Add to Cart</button>
    <div id="cart-toast"></div>

    <!-- anchor targets for smooth scroll -->
    <section id="why-us"></section>
    <section id="products"></section>

    <a href="#why-us"  class="scroll-link">Go Why Us</a>
    <a href="#"        class="bare-hash">Bare hash</a>
    <a href="#nowhere" class="missing-target">Missing</a>
  `;
}

/** Load script.js in an isolated module scope (re-runs the IIFE). */
function loadScript() {
  jest.isolateModules(() => {
    require('../script.js');
  });
}

/* ── helper: fire a real DOM event ──────────────────────────────────────── */

function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function keydown(el, key, shiftKey = false) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. EMAIL VALIDATION  (exercised through the subscribe form)
   ═══════════════════════════════════════════════════════════════════════════ */

describe('Email validation via subscribe form', () => {
  beforeEach(() => {
    buildDOM();
    loadScript();
  });

  const invalidEmails = ['', '   ', 'notanemail', 'missing@', '@nodomain.com', 'no-at-sign'];

  invalidEmails.forEach((email) => {
    it(`rejects invalid email: "${email}"`, () => {
      const input = document.getElementById('email-input');
      const error = document.getElementById('email-error');
      input.value = email;

      document.getElementById('subscribe-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      expect(error.textContent).toBe('Please enter a valid email address.');
      expect(input.classList.contains('error')).toBe(true);
    });
  });

  const validEmails = ['user@example.com', 'a@b.io', 'name+tag@domain.co.uk'];

  validEmails.forEach((email) => {
    it(`accepts valid email: "${email}"`, () => {
      const input = document.getElementById('email-input');
      const error = document.getElementById('email-error');
      input.value = email;

      document.getElementById('subscribe-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      expect(error.textContent).toBe('');
      expect(input.classList.contains('error')).toBe(false);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   2. SUBSCRIBE FORM — loading & success states
   ═══════════════════════════════════════════════════════════════════════════ */

describe('Subscribe form submission flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    buildDOM();
    loadScript();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function submitWithEmail(email) {
    document.getElementById('email-input').value = email;
    document.getElementById('subscribe-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
  }

  it('shows loading state immediately on valid submission', () => {
    submitWithEmail('user@example.com');
    const btnText    = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const submitBtn  = document.querySelector('[type="submit"]');

    expect(btnText.hidden).toBe(true);
    expect(btnLoading.hidden).toBe(false);
    expect(submitBtn.disabled).toBe(true);
  });

  it('restores button and shows success message after timeout', () => {
    submitWithEmail('user@example.com');
    jest.runAllTimers();

    const btnText    = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const submitBtn  = document.querySelector('[type="submit"]');
    const success    = document.getElementById('form-success');

    expect(btnText.hidden).toBe(false);
    expect(btnLoading.hidden).toBe(true);
    expect(submitBtn.disabled).toBe(false);
    expect(success.hidden).toBe(false);
  });

  it('hides form-group elements after successful submission', () => {
    submitWithEmail('user@example.com');
    jest.runAllTimers();

    document.querySelectorAll('.form-group').forEach((g) => {
      expect(g.style.display).toBe('none');
    });
  });

  it('hides submit button after successful submission', () => {
    submitWithEmail('user@example.com');
    jest.runAllTimers();

    expect(document.querySelector('[type="submit"]').style.display).toBe('none');
  });

  it('hides privacy note after successful submission', () => {
    submitWithEmail('user@example.com');
    jest.runAllTimers();

    expect(document.querySelector('.form-privacy').style.display).toBe('none');
  });

  it('clears previous error before resubmitting', () => {
    const input = document.getElementById('email-input');
    const error = document.getElementById('email-error');

    // First invalid submit
    input.value = 'bad';
    document.getElementById('subscribe-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    expect(error.textContent).toBe('Please enter a valid email address.');

    // Second valid submit — error must be cleared
    input.value = 'valid@example.com';
    document.getElementById('subscribe-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    expect(error.textContent).toBe('');
    expect(input.classList.contains('error')).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   3. MOBILE DRAWER
   ═══════════════════════════════════════════════════════════════════════════ */

describe('Mobile drawer', () => {
  beforeEach(() => {
    buildDOM();
    loadScript();
  });

  function drawerIsOpen() {
    const d = document.getElementById('mobile-drawer');
    return (
      d.classList.contains('open') &&
      d.getAttribute('aria-hidden') === 'false' &&
      document.body.classList.contains('drawer-open') &&
      document.getElementById('hamburger-btn').getAttribute('aria-expanded') === 'true'
    );
  }

  function drawerIsClosed() {
    const d = document.getElementById('mobile-drawer');
    return (
      !d.classList.contains('open') &&
      d.getAttribute('aria-hidden') === 'true' &&
      !document.body.classList.contains('drawer-open') &&
      document.getElementById('hamburger-btn').getAttribute('aria-expanded') === 'false'
    );
  }

  it('starts closed', () => {
    expect(drawerIsClosed()).toBe(true);
  });

  it('opens when hamburger button is clicked', () => {
    click(document.getElementById('hamburger-btn'));
    expect(drawerIsOpen()).toBe(true);
  });

  it('closes when hamburger button is clicked again', () => {
    click(document.getElementById('hamburger-btn')); // open
    click(document.getElementById('hamburger-btn')); // close
    expect(drawerIsClosed()).toBe(true);
  });

  it('closes when overlay is clicked', () => {
    click(document.getElementById('hamburger-btn')); // open
    click(document.getElementById('drawer-overlay'));
    expect(drawerIsClosed()).toBe(true);
  });

  it('closes when close button is clicked', () => {
    click(document.getElementById('hamburger-btn')); // open
    click(document.getElementById('drawer-close-btn'));
    expect(drawerIsClosed()).toBe(true);
  });

  it('closes when a drawer link is clicked', () => {
    click(document.getElementById('hamburger-btn')); // open
    click(document.querySelector('.drawer-link'));
    expect(drawerIsClosed()).toBe(true);
  });

  it('closes on Escape key when drawer is open', () => {
    click(document.getElementById('hamburger-btn')); // open
    keydown(document, 'Escape');
    expect(drawerIsClosed()).toBe(true);
  });

  it('does not close on Escape when drawer is already closed', () => {
    keydown(document, 'Escape'); // no-op
    expect(drawerIsClosed()).toBe(true);
  });

  it('adds overlay open class when drawer opens', () => {
    click(document.getElementById('hamburger-btn'));
    expect(document.getElementById('drawer-overlay').classList.contains('open')).toBe(true);
  });

  it('removes overlay open class when drawer closes', () => {
    click(document.getElementById('hamburger-btn')); // open
    click(document.getElementById('drawer-close-btn'));
    expect(document.getElementById('drawer-overlay').classList.contains('open')).toBe(false);
  });

  it('sets hamburger is-active class when open', () => {
    click(document.getElementById('hamburger-btn'));
    expect(document.getElementById('hamburger-btn').classList.contains('is-active')).toBe(true);
  });

  it('removes hamburger is-active class when closed', () => {
    click(document.getElementById('hamburger-btn'));
    click(document.getElementById('hamburger-btn'));
    expect(document.getElementById('hamburger-btn').classList.contains('is-active')).toBe(false);
  });
});

/* ── Focus trap ─────────────────────────────────────────────────────────── */

describe('Mobile drawer focus trap', () => {
  beforeEach(() => {
    buildDOM();
    loadScript();
  });

  it('wraps focus from last to first element on Tab', () => {
    const drawer = document.getElementById('mobile-drawer');
    click(document.getElementById('hamburger-btn')); // open

    const focusable = drawer.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const lastEl = focusable[focusable.length - 1];
    lastEl.focus();

    const preventSpy = jest.fn();
    const firstFocusSpy = jest.spyOn(focusable[0], 'focus');

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true });
    Object.defineProperty(tabEvent, 'preventDefault', { value: preventSpy });
    lastEl.dispatchEvent(tabEvent);

    expect(firstFocusSpy).toHaveBeenCalled();
  });

  it('wraps focus from first to last element on Shift+Tab', () => {
    const drawer = document.getElementById('mobile-drawer');
    click(document.getElementById('hamburger-btn')); // open

    const focusable = drawer.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusable[0];
    firstEl.focus();

    const lastFocusSpy = jest.spyOn(focusable[focusable.length - 1], 'focus');

    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    Object.defineProperty(shiftTabEvent, 'preventDefault', { value: jest.fn() });
    firstEl.dispatchEvent(shiftTabEvent);

    expect(lastFocusSpy).toHaveBeenCalled();
  });

  it('does not trap focus when drawer is closed', () => {
    const drawer = document.getElementById('mobile-drawer');
    // drawer is closed by default

    const focusable = drawer.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const lastEl = focusable[focusable.length - 1];
    const firstFocusSpy = jest.spyOn(focusable[0], 'focus');

    lastEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true }));

    expect(firstFocusSpy).not.toHaveBeenCalled();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   4. STICKY HEADER
   ═══════════════════════════════════════════════════════════════════════════ */

describe('Sticky header scroll shadow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    buildDOM();
    loadScript();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('adds box-shadow when page is scrolled more than 10 px', () => {
    Object.defineProperty(window, 'scrollY', { value: 20, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(document.getElementById('site-header').style.boxShadow).toBe('0 2px 16px rgba(0,0,0,.12)');
  });

  it('removes box-shadow when page is at the top (scrollY ≤ 10)', () => {
    // First scroll down so shadow is set
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    // Advance past the 100 ms throttle window, then scroll back to top
    jest.advanceTimersByTime(150);

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(document.getElementById('site-header').style.boxShadow).toBe('');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   5. FAQ ACCORDION
   ═══════════════════════════════════════════════════════════════════════════ */

describe('FAQ accordion', () => {
  beforeEach(() => {
    buildDOM();
    loadScript();
  });

  function faqBtn(n) { return document.querySelectorAll('.faq-question')[n - 1]; }
  function faqAnswer(n) { return document.getElementById(`faq-${n}`); }

  it('opens the clicked FAQ item', () => {
    click(faqBtn(1));
    expect(faqBtn(1).getAttribute('aria-expanded')).toBe('true');
    expect(faqAnswer(1).hidden).toBe(false);
  });

  it('closes an open FAQ item when clicked again', () => {
    click(faqBtn(1)); // open
    click(faqBtn(1)); // close
    expect(faqBtn(1).getAttribute('aria-expanded')).toBe('false');
    expect(faqAnswer(1).hidden).toBe(true);
  });

  it('collapses other open items when a new one is opened', () => {
    click(faqBtn(1)); // open item 1
    click(faqBtn(2)); // open item 2 — item 1 should close

    expect(faqBtn(1).getAttribute('aria-expanded')).toBe('false');
    expect(faqAnswer(1).hidden).toBe(true);
    expect(faqBtn(2).getAttribute('aria-expanded')).toBe('true');
    expect(faqAnswer(2).hidden).toBe(false);
  });

  it('only one item is open at a time', () => {
    click(faqBtn(1));
    click(faqBtn(2));
    click(faqBtn(3));

    const openCount = document.querySelectorAll('.faq-question[aria-expanded="true"]').length;
    expect(openCount).toBe(1);
  });

  it('all items start closed', () => {
    document.querySelectorAll('.faq-question').forEach((btn) => {
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });
    document.querySelectorAll('[id^="faq-"]').forEach((answer) => {
      expect(answer.hidden).toBe(true);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   6. ADD TO CART — toast & button state
   ═══════════════════════════════════════════════════════════════════════════ */

describe('Add to cart', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    buildDOM();
    loadScript();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows cart toast with product name on click', () => {
    const btn   = document.querySelectorAll('.add-to-cart')[0];
    const toast = document.getElementById('cart-toast');

    click(btn);

    expect(toast.classList.contains('show')).toBe(true);
    expect(toast.textContent).toContain('FertilBoost Pro');
    expect(toast.textContent).toContain('added to cart');
  });

  it('shows correct product name for second cart button', () => {
    const btn   = document.querySelectorAll('.add-to-cart')[1];
    const toast = document.getElementById('cart-toast');

    click(btn);

    expect(toast.textContent).toContain('MaleVital Max');
  });

  it('changes button text to "✓ Added" and disables it', () => {
    const btn = document.querySelectorAll('.add-to-cart')[0];
    click(btn);

    expect(btn.textContent).toBe('✓ Added');
    expect(btn.disabled).toBe(true);
  });

  it('restores button text and re-enables it after timeout', () => {
    const btn = document.querySelectorAll('.add-to-cart')[0];
    const originalText = btn.textContent.trim();
    click(btn);

    jest.runAllTimers();

    expect(btn.textContent).toBe(originalText);
    expect(btn.disabled).toBe(false);
  });

  it('hides toast after 3 seconds', () => {
    const btn   = document.querySelectorAll('.add-to-cart')[0];
    const toast = document.getElementById('cart-toast');

    click(btn);
    jest.advanceTimersByTime(3000);

    expect(toast.classList.contains('show')).toBe(false);
  });

  it('toast contains a checkmark SVG', () => {
    const btn   = document.querySelectorAll('.add-to-cart')[0];
    const toast = document.getElementById('cart-toast');

    click(btn);

    expect(toast.querySelector('svg')).not.toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   7. SMOOTH ANCHOR SCROLL
   ═══════════════════════════════════════════════════════════════════════════ */

describe('Smooth anchor scroll', () => {
  let scrollToSpy;

  beforeEach(() => {
    buildDOM();
    scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    loadScript();
  });

  afterEach(() => {
    scrollToSpy.mockRestore();
  });

  it('calls window.scrollTo for a valid target anchor', () => {
    const anchor = document.querySelector('a[href="#why-us"].scroll-link');
    const event  = new MouseEvent('click', { bubbles: true, cancelable: true });

    anchor.dispatchEvent(event);

    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
  });

  it('prevents default and does NOT scroll for bare href="#"', () => {
    const anchor = document.querySelector('.bare-hash');
    const event  = new MouseEvent('click', { bubbles: true, cancelable: true });

    anchor.dispatchEvent(event);

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('prevents default and does NOT scroll when target element is missing', () => {
    const anchor = document.querySelector('.missing-target');
    const event  = new MouseEvent('click', { bubbles: true, cancelable: true });

    anchor.dispatchEvent(event);

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('passes the smooth behavior option', () => {
    const anchor = document.querySelector('a[href="#why-us"].scroll-link');
    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    const [scrollArgs] = scrollToSpy.mock.calls;
    expect(scrollArgs[0]).toHaveProperty('behavior', 'smooth');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   8. THROTTLE  (exercised through the sticky-header scroll handler)
   ═══════════════════════════════════════════════════════════════════════════ */

describe('Throttle (via scroll handler)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    buildDOM();
    loadScript();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('applies style on first scroll event', () => {
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    expect(document.getElementById('site-header').style.boxShadow).toBe('0 2px 16px rgba(0,0,0,.12)');
  });

  it('ignores rapid successive scroll events within throttle window', () => {
    const header = document.getElementById('site-header');

    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll')); // executed — sets shadow

    // Immediately set scrollY back to 0 and fire again (within 100 ms throttle)
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll')); // throttled — shadow should still be set

    expect(header.style.boxShadow).toBe('0 2px 16px rgba(0,0,0,.12)');
  });

  it('allows next scroll event after throttle interval elapses', () => {
    const header = document.getElementById('site-header');

    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll')); // sets shadow

    // Advance time past the 100 ms throttle
    jest.advanceTimersByTime(150);

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll')); // should execute — clears shadow

    expect(header.style.boxShadow).toBe('');
  });
});
