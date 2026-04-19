document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll
  const hdr = document.querySelector('.lx-hdr');
  if (hdr) {
    const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 2. Mobile drawer
  const burger = document.querySelector('.lx-hdr__burger');
  const drawer = document.querySelector('.lx-drawer');
  const overlay = document.querySelector('.lx-overlay');
  const drawerClose = document.querySelector('.lx-drawer__close');

  function openDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    drawer.setAttribute('aria-hidden', 'false');
    if (burger) burger.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    drawer.setAttribute('aria-hidden', 'true');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger) burger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  // 3. FAQ accordion
  document.querySelectorAll('.lx-faq__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.lx-faq__item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.lx-faq__item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.lx-faq__q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // 4. Scroll fade-in
  function initFadeIn(root) {
    const fadeEls = (root || document).querySelectorAll('.lx-fade-in:not(.visible)');
    if (!fadeEls.length) return;
    // In the Shopify theme editor reveal immediately so sections are never invisible
    if (window.Shopify && window.Shopify.designMode) {
      fadeEls.forEach(el => el.classList.add('visible'));
      return;
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px 60px 0px' });
      fadeEls.forEach(el => io.observe(el));
    } else {
      fadeEls.forEach(el => el.classList.add('visible'));
    }
  }
  initFadeIn();

  // Re-run when the theme editor loads/reorders a section
  document.addEventListener('shopify:section:load', e => initFadeIn(e.target));
  document.addEventListener('shopify:section:reorder', () => initFadeIn());

  // 5. Qty buttons
  document.querySelectorAll('[data-qty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.lx-qty').querySelector('input[type="number"]');
      if (!input) return;
      const delta = btn.dataset.qty === '+' ? 1 : -1;
      input.value = Math.max(1, (parseInt(input.value) || 1) + delta);
    });
  });

  // 6. Collection filter / sort / grid-list toggle
  const collGrid  = document.getElementById('lx-coll-grid');
  const collEmpty = document.getElementById('lx-coll-empty');

  if (collGrid) {
    const collCards = Array.from(collGrid.querySelectorAll('.lx-coll-card, .lx-pcard'));
    let activeFilter = 'all';

    /* ── helpers ── */
    function showCard(card) {
      card.hidden = false;
      // allow browser to paint the element before transitioning in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          card.classList.remove('lx-coll-card--hiding');
        });
      });
    }

    function hideCard(card) {
      card.classList.add('lx-coll-card--hiding');
      const onEnd = () => {
        card.removeEventListener('transitionend', onEnd);
        // only fully hide if still meant to be hidden
        if (card.classList.contains('lx-coll-card--hiding')) {
          card.hidden = true;
        }
      };
      card.addEventListener('transitionend', onEnd);
    }

    function applyFilter() {
      let visible = 0;
      collCards.forEach(card => {
        const cat  = (card.dataset.category || '').toLowerCase();
        const show = activeFilter === 'all' || cat.indexOf(activeFilter) !== -1;
        if (show) {
          showCard(card);
          visible++;
        } else {
          hideCard(card);
        }
      });
      if (collEmpty) collEmpty.hidden = visible > 0;
    }

    /* ── filter buttons ── */
    document.querySelectorAll('.lx-coll-bar__filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.lx-coll-bar__filter').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeFilter = btn.dataset.filter || 'all';
        applyFilter();
      });
    });

    /* ── sort dropdown ── */
    const collSort = document.getElementById('lx-coll-sort');
    if (collSort) {
      collSort.addEventListener('change', () => {
        const val   = collSort.value;
        const items = Array.from(collGrid.querySelectorAll('.lx-coll-card:not([hidden]), .lx-pcard:not([hidden])'));
        items.sort((a, b) => {
          if (val === 'price-asc')  return Number(a.dataset.price) - Number(b.dataset.price);
          if (val === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price);
          if (val === 'title-asc')  return (a.dataset.title || '').localeCompare(b.dataset.title || '');
          return 0;
        });
        items.forEach(item => collGrid.appendChild(item));
      });
    }

    /* ── grid / list toggle ── */
    const btnViewGrid = document.getElementById('lx-view-grid');
    const btnViewList = document.getElementById('lx-view-list');

    if (btnViewGrid) {
      btnViewGrid.addEventListener('click', () => {
        collGrid.classList.remove('lx-pgrid--list', 'is-list');
        btnViewGrid.classList.add('is-active');
        if (btnViewList) btnViewList.classList.remove('is-active');
      });
    }
    if (btnViewList) {
      btnViewList.addEventListener('click', () => {
        collGrid.classList.add('lx-pgrid--list', 'is-list');
        btnViewList.classList.add('is-active');
        if (btnViewGrid) btnViewGrid.classList.remove('is-active');
      });
    }
  }
});
