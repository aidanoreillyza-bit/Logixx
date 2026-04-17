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
  }
  function closeDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    drawer.setAttribute('aria-hidden', 'true');
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
      document.querySelectorAll('.lx-faq__item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // 4. Scroll fade-in
  const fadeEls = document.querySelectorAll('.lx-fade-in');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    fadeEls.forEach(el => io.observe(el));
  }

  // 5. Qty buttons
  document.querySelectorAll('[data-qty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.lx-qty').querySelector('input[type="number"]');
      if (!input) return;
      const delta = btn.dataset.qty === '+' ? 1 : -1;
      input.value = Math.max(1, (parseInt(input.value) || 1) + delta);
    });
  });
});
