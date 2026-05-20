/**
 * solution-carousel.js
 *
 * 1. Solution 轮播：section 级别侧箭头 + 拖拽滑动 + 底部指示点
 * 2. Screens 画廊：仅按钮导航（无 wheel/trackpad 滚动），拖拽 + 进度条
 */
(function () {
  'use strict';

  /* ── Solution Carousel ────────────────────────────────── */
  function initCarousel(section) {
    const carousel  = section.querySelector('.pd-carousel');
    const track     = section.querySelector('.pd-carousel-track');
    const slides    = section.querySelectorAll('.pd-carousel-slide');
    const prevBtns  = section.querySelectorAll('.pd-carousel-prev');
    const nextBtns  = section.querySelectorAll('.pd-carousel-next');
    const counter   = section.querySelector('.pd-carousel-counter');
    const dots      = section.querySelectorAll('.pd-carousel-dot');

    if (!track || slides.length === 0) return;

    let current = 0;
    const total = slides.length;

    function update(animate) {
      track.style.transition = animate === false
        ? 'none'
        : 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
      track.style.transform = `translateX(-${current * 100}%)`;

      if (counter) {
        counter.textContent =
          String(current + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
      }
      prevBtns.forEach(b => b.classList.toggle('is-disabled', current === 0));
      nextBtns.forEach(b => b.classList.toggle('is-disabled', current === total - 1));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    }

    function goTo(i) {
      current = Math.max(0, Math.min(i, total - 1));
      update();
    }

    prevBtns.forEach(b => b.addEventListener('click', () => goTo(current - 1)));
    nextBtns.forEach(b => b.addEventListener('click', () => goTo(current + 1)));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    /* ── Drag / swipe ──────────────────────────────────── */
    let dragStartX = null;
    let dragged    = false;

    function dragStart(clientX) { dragStartX = clientX; dragged = false; carousel.classList.add('is-grabbing'); }
    function dragMove(clientX)  { if (dragStartX !== null && Math.abs(clientX - dragStartX) > 6) dragged = true; }
    function dragEnd(clientX) {
      if (dragStartX === null) return;
      carousel.classList.remove('is-grabbing');
      const diff = dragStartX - clientX;
      dragStartX = null;
      if (Math.abs(diff) > 56) goTo(current + (diff > 0 ? 1 : -1));
    }

    carousel.addEventListener('mousedown',  e => dragStart(e.clientX));
    carousel.addEventListener('mousemove',  e => dragMove(e.clientX));
    carousel.addEventListener('mouseup',    e => dragEnd(e.clientX));
    carousel.addEventListener('mouseleave', e => { if (dragStartX !== null) dragEnd(e.clientX); });
    carousel.addEventListener('touchstart', e => dragStart(e.touches[0].clientX),      { passive: true });
    carousel.addEventListener('touchmove',  e => dragMove(e.touches[0].clientX),       { passive: true });
    carousel.addEventListener('touchend',   e => dragEnd(e.changedTouches[0].clientX), { passive: true });
    carousel.addEventListener('click', e => { if (dragged) e.preventDefault(); }, true);

    update(false);
  }

  /* ── Screens 画廊（仅按钮导航） ──────────────────────── */
  function initScreensScroll(el) {
    const section     = el.closest('.pd-section--screens');
    const progressBar = section ? section.querySelector('.pd-screens-progress-bar') : null;
    const prevBtns    = section ? section.querySelectorAll('.pd-screens-btn--prev') : [];
    const nextBtns    = section ? section.querySelectorAll('.pd-screens-btn--next') : [];

    const STEP = 292 + 24; // 一张图宽度 + gap

    /* 进度条 & 按钮状态 */
    function updateUI() {
      if (progressBar) {
        const max = el.scrollWidth - el.clientWidth;
        const val = max > 0 ? Math.min(el.scrollLeft / max, 1) : 0;
        progressBar.style.transform = `scaleX(${val})`;
      }
      const atStart = el.scrollLeft <= 1;
      const atEnd   = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      prevBtns.forEach(b => b.classList.toggle('is-disabled', atStart));
      nextBtns.forEach(b => b.classList.toggle('is-disabled', atEnd));
    }

    el.addEventListener('scroll', updateUI, { passive: true });
    requestAnimationFrame(updateUI);

    /* 按钮导航 */
    prevBtns.forEach(b => b.addEventListener('click', () => {
      el.scrollBy({ left: -STEP * 3, behavior: 'smooth' });
    }));
    nextBtns.forEach(b => b.addEventListener('click', () => {
      el.scrollBy({ left:  STEP * 3, behavior: 'smooth' });
    }));
  }

  /* ── Boot ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pd-section--solution').forEach(initCarousel);
    document.querySelectorAll('.pd-screens-scroll').forEach(initScreensScroll);
  });

})();
