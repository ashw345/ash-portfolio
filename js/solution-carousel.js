/**
 * solution-carousel.js
 *
 * 1. Solution 轮播：section 级别侧箭头 + 拖拽滑动 + 底部指示点
 * 2. Screens 画廊：自动横向跑马灯，首尾相连无限循环
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

  /* ── Screens 画廊：自动横向跑马灯 ──────────────────────── */

  /* 移动速度（px / 秒）。想调快慢改这一个数就行。 */
  const SCREENS_SPEED = 50;

  function initScreensMarquee(el) {
    const track = el.querySelector('.pd-screens-track');
    if (!track) return;

    const originals = Array.prototype.slice.call(track.children);
    if (!originals.length) return;

    /* 无障碍：用户要求减少动态效果时不跑马灯，
       保留原来的横向滚动条让内容依然可及。 */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.classList.add('is-marquee');

    function layout() {
      /* 先撤掉上一轮的副本，回到原始那一组再重新测量 */
      track.style.animation = 'none';
      while (track.children.length > originals.length) {
        track.removeChild(track.lastChild);
      }

      /* 一组的位移 = 首图左边到尾图右边 + 一个 gap，
         这样第二组的首图正好接在第一组尾图后面，接缝看不出来。 */
      const first = originals[0];
      const last  = originals[originals.length - 1];
      const gap   = parseFloat(getComputedStyle(track).columnGap) || 0;
      const distance = (last.offsetLeft + last.offsetWidth) - first.offsetLeft + gap;
      if (!(distance > 0)) return;

      /* 位移走满一组时画面仍要铺满视口，否则右侧会露白 */
      const copies = Math.ceil(el.clientWidth / distance) + 1;
      for (let c = 1; c < copies; c++) {
        originals.forEach(node => {
          const clone = node.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        });
      }

      track.style.setProperty('--marquee-distance', distance + 'px');
      track.style.setProperty('--marquee-duration', (distance / SCREENS_SPEED) + 's');

      void track.offsetWidth; // 强制回流，让动画从头开始
      track.style.animation = '';
    }

    layout();

    /* 图片宽度是固定值，布局无需等加载；但断点变化会改宽度 */
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 200);
    }, { passive: true });
  }

  /* ── Boot ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pd-section--solution').forEach(initCarousel);
    document.querySelectorAll('.pd-screens-scroll').forEach(initScreensMarquee);
  });

})();
