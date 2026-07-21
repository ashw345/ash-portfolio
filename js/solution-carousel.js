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
    const slides    = Array.from(section.querySelectorAll('.pd-carousel-slide'));
    const prevBtns  = section.querySelectorAll('.pd-carousel-prev');
    const nextBtns  = section.querySelectorAll('.pd-carousel-next');
    const counter   = section.querySelector('.pd-carousel-counter');
    const dots      = section.querySelectorAll('.pd-carousel-dot');

    if (!track || slides.length === 0) return;

    const total = slides.length;

    /* ── 无限循环：首尾各克隆一张，真实首张落在 pos = 1 ── */
    let pos = 0;       // 轨道位置（含克隆张）
    let current = 0;   // 真实索引 0..total-1
    if (total > 1) {
      const firstClone = slides[0].cloneNode(true);
      const lastClone  = slides[total - 1].cloneNode(true);
      firstClone.setAttribute('aria-hidden', 'true');
      lastClone.setAttribute('aria-hidden', 'true');
      track.appendChild(firstClone);
      track.insertBefore(lastClone, slides[0]);
      pos = 1;
    }

    function applyTransform(animate) {
      track.style.transition = animate === false
        ? 'none'
        : 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
      track.style.transform = `translateX(-${pos * 100}%)`;
    }

    function syncUI() {
      if (counter) {
        counter.textContent =
          String(current + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
      }
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
      // 无限循环：两端永远可继续
      prevBtns.forEach(b => b.classList.remove('is-disabled'));
      nextBtns.forEach(b => b.classList.remove('is-disabled'));
    }

    // 若当前停在克隆张上，先无动画跳回对应真实张，避免快速点击越界
    function normalizeClone() {
      if (pos === total + 1) { pos = 1;     applyTransform(false); void track.offsetWidth; }
      else if (pos === 0)    { pos = total; applyTransform(false); void track.offsetWidth; }
    }

    function move(targetPos) {
      if (total <= 1) return;
      pos = targetPos;
      current = ((pos - 1) % total + total) % total;
      applyTransform(true);
      syncUI();
      startAuto(); // 每次切换后重新计时
    }
    function next() { normalizeClone(); move(pos + 1); }
    function prev() { normalizeClone(); move(pos - 1); }

    function goTo(i) {
      if (total <= 1) return;
      current = Math.max(0, Math.min(i, total - 1));
      pos = current + 1;
      applyTransform(true);
      syncUI();
      startAuto();
    }

    /* 滑到克隆张后，无动画地跳回对应的真实张，实现无缝循环 */
    track.addEventListener('transitionend', (e) => {
      if (e.target !== track) return;
      if (pos === total + 1) {        // 停在「首张克隆」（最后一张之后）
        pos = 1;
        applyTransform(false);
      } else if (pos === 0) {         // 停在「末张克隆」（第一张之前）
        pos = total;
        applyTransform(false);
      }
    });

    prevBtns.forEach(b => b.addEventListener('click', prev));
    nextBtns.forEach(b => b.addEventListener('click', next));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    /* ── 自动播放：每 5s 前进一张，循环；悬停整个区域暂停 ── */
    const AUTO_MS = 5000;
    let autoTimer = null;
    let paused    = false;
    function startAuto() { stopAuto(); if (total > 1 && !paused && !section.matches(':hover')) autoTimer = setInterval(next, AUTO_MS); }
    function stopAuto()  { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
    function pauseAuto() { paused = true; stopAuto(); }
    function resumeAuto() { paused = false; startAuto(); }
    section.addEventListener('mouseenter', pauseAuto);
    section.addEventListener('mouseleave', resumeAuto);
    section.addEventListener('pointerenter', pauseAuto);
    section.addEventListener('pointerleave', resumeAuto);
    section.addEventListener('touchstart', pauseAuto, { passive: true });

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
      if (Math.abs(diff) > 56) (diff > 0 ? next() : prev());
    }

    carousel.addEventListener('mousedown',  e => dragStart(e.clientX));
    carousel.addEventListener('mousemove',  e => dragMove(e.clientX));
    carousel.addEventListener('mouseup',    e => dragEnd(e.clientX));
    carousel.addEventListener('mouseleave', e => { if (dragStartX !== null) dragEnd(e.clientX); });
    carousel.addEventListener('touchstart', e => dragStart(e.touches[0].clientX),      { passive: true });
    carousel.addEventListener('touchmove',  e => dragMove(e.touches[0].clientX),       { passive: true });
    carousel.addEventListener('touchend',   e => dragEnd(e.changedTouches[0].clientX), { passive: true });
    carousel.addEventListener('click', e => { if (dragged) e.preventDefault(); }, true);

    applyTransform(false);
    syncUI();
    startAuto();
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
