/**
 * theme.js  — 三套主题系统
 *
 * light    : 白底黑字（默认）
 * dark     : 黑底白字
 * gradient : 弥散渐变浅底 + 鼠标推挤 blob
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────── Blob Engine */
  const BLOBS = [
    { ox: 0.20, oy: 0.25, color: [255, 182, 213] },  // 粉
    { ox: 0.72, oy: 0.18, color: [179, 212, 255] },  // 浅蓝
    { ox: 0.55, oy: 0.72, color: [183, 255, 218] },  // 薄荷
    { ox: 0.10, oy: 0.70, color: [255, 222, 173] },  // 暖橙
    { ox: 0.85, oy: 0.55, color: [220, 196, 255] },  // 淡紫
    { ox: 0.38, oy: 0.48, color: [255, 245, 180] },  // 柠檬
  ];

  const BLOB_RADIUS_FACTOR = 0.38;  // blob 半径 = min(W,H) * factor
  const PUSH_RADIUS_FACTOR = 0.22;  // 鼠标推力圆半径（归一化）
  const PUSH_FORCE         = 0.0018;
  const SPRING             = 0.025;
  const DAMPING            = 0.84;

  let canvas, ctx;
  let blobs = [];
  let mouse = { x: 0.5, y: 0.5 };
  let rafId = null;
  let running = false;

  function initBlobs() {
    blobs = BLOBS.map(b => ({
      x: b.ox, y: b.oy,
      ox: b.ox, oy: b.oy,
      vx: 0, vy: 0,
      color: b.color,
    }));
  }

  function startBlobs() {
    if (running) return;
    running = true;
    initBlobs();
    rafId = requestAnimationFrame(tick);
  }

  function stopBlobs() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function tick() {
    if (!running) return;
    update();
    draw();
    rafId = requestAnimationFrame(tick);
  }

  function update() {
    const W = canvas.width, H = canvas.height;
    const pushR = PUSH_RADIUS_FACTOR;

    blobs.forEach(b => {
      // Spring to origin
      b.vx += (b.ox - b.x) * SPRING;
      b.vy += (b.oy - b.y) * SPRING;

      // Mouse repulsion (normalized coords)
      const dx = b.x - mouse.x;
      const dy = b.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < pushR && dist > 0.001) {
        const strength = (1 - dist / pushR) * PUSH_FORCE;
        b.vx += (dx / dist) * strength;
        b.vy += (dy / dist) * strength;
      }

      // Blob-blob repulsion (keeps them spread)
      blobs.forEach(other => {
        if (other === b) return;
        const ex = b.x - other.x;
        const ey = b.y - other.y;
        const ed = Math.sqrt(ex * ex + ey * ey);
        const minD = 0.18;
        if (ed < minD && ed > 0.001) {
          const s = (1 - ed / minD) * 0.0006;
          b.vx += (ex / ed) * s;
          b.vy += (ey / ed) * s;
        }
      });

      b.vx *= DAMPING;
      b.vy *= DAMPING;
      b.x += b.vx;
      b.y += b.vy;

      // Soft wall bounce
      b.x = Math.max(0.05, Math.min(0.95, b.x));
      b.y = Math.max(0.05, Math.min(0.95, b.y));
    });
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const R = Math.min(W, H) * BLOB_RADIUS_FACTOR;

    blobs.forEach(b => {
      const cx = b.x * W;
      const cy = b.y * H;
      const [r, g, gl] = b.color;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grad.addColorStop(0,   `rgba(${r},${g},${gl},0.85)`);
      grad.addColorStop(0.5, `rgba(${r},${g},${gl},0.50)`);
      grad.addColorStop(1,   `rgba(${r},${g},${gl},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'theme-blob-canvas';
    document.body.prepend(canvas);
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
    });
  }

  /* ─────────────────────────────────────── Theme Apply */
  const THEMES = ['light', 'dark', 'gradient'];

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ash-theme', theme);

    // Update buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    if (theme === 'gradient') {
      ensureCanvas();
      startBlobs();
    } else {
      stopBlobs();
    }
  }

  /* ─────────────────────────────────────── Switcher UI */
  function buildSwitcher() {
    // 找到 nav-links，在最前面插入切换器
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const li = document.createElement('li');
    li.className = 'theme-switcher-li';

    const sw = document.createElement('div');
    sw.className = 'theme-switcher';

    const defs = [
      { theme: 'light',    label: '白底' },
      { theme: 'dark',     label: '黑底' },
      { theme: 'gradient', label: '渐变' },
    ];

    defs.forEach(d => {
      const btn = document.createElement('button');
      btn.className = `theme-btn theme-btn--${d.theme}`;
      btn.dataset.theme = d.theme;
      btn.title = d.label;
      btn.setAttribute('aria-label', d.label);
      btn.addEventListener('click', () => applyTheme(d.theme));
      sw.appendChild(btn);
    });

    li.appendChild(sw);

    // 插到 nav-dot 前面（或直接放第一个）
    const dot = navLinks.querySelector('.nav-dot')?.parentElement;
    if (dot) {
      navLinks.insertBefore(li, dot);
    } else {
      navLinks.prepend(li);
    }
  }

  /* ─────────────────────────────────────── Init */
  function init() {
    buildSwitcher();

    // 读取已存主题
    const saved = localStorage.getItem('ash-theme') || 'light';
    applyTheme(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
