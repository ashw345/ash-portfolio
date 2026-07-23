/**
 * about-wordmark.js
 * 联系页开场标题里的内联交互字标：把 "ASH" 渲染成点阵，自动沿笔画书写路径扫过。
 * 白底（浅色）配色，高度对齐标题文字，宽度按文字自适应。
 */
(function () {
  'use strict';

  const canvas = document.getElementById('about-wordmark');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const TEXT = canvas.dataset.text || 'Ash.W';
  const TAU = Math.PI * 2;

  // 白底翻转配色：比初版整体加深约 20%，让点阵字标更清楚。
  const DOT = {
    rest:  { r: 0.09, fill: 'rgba(86,86,86,0.74)' },
    ring:  { r: 0.26, stroke: 'rgba(128,128,128,0.84)', lw: 0.05 },
    mid:   { r: 0.11, fill: 'rgba(84,84,84,0.96)' },
    solid: { r: 0.23, fill: 'rgba(76,76,76,1)' }
  };

  const WRITE = {
    duration: 16.2,
    pause: 0.45,
    fade: 0.9,
    ease: 0.38,
    radius: 8.5,
    decay: 3.0
  };

  const dpr = window.devicePixelRatio || 1;

  let cell = 4;
  const grid = { cols: 0, rows: 0, ox: 0, oy: 0 };
  let points = [];
  let glyphs = [];
  let writePath = [];
  const state = new Map();

  const ptr = { x: -1e6, y: -1e6, active: false };
  const smooth = { x: 0, y: 0, init: false };
  const vel = { x: 0, y: 0 };
  let lastMoveT = 0;

  const off = document.createElement('canvas');
  const offCtx = off.getContext('2d', { willReadFrequently: true });

  let cssW = 0, cssH = 0, fontPx = 0, glyphAsc = 0;

  // 宽度驱动：canvas 宽度由 flex 填满剩余空间，字号放大到填满该宽度。
  // 高度紧贴字形（用实际字形上下边界），配合 flex align-items:center 与左侧文字上下居中。
  function layout() {
    const w = canvas.clientWidth;
    if (!w) return;
    cssW = w;
    // 用 100px 基准测一次宽度，反推填满 w 所需的字号
    offCtx.font = `800 100px "Helvetica Neue", Arial, sans-serif`;
    const wPer100 = offCtx.measureText(TEXT).width || 1;
    fontPx = (w * 0.995) / (wPer100 / 100);
    offCtx.font = `800 ${fontPx}px "Helvetica Neue", Arial, sans-serif`;
    const m = offCtx.measureText(TEXT);
    const asc = m.actualBoundingBoxAscent || fontPx * 0.72;
    const desc = m.actualBoundingBoxDescent || fontPx * 0.02;
    glyphAsc = asc;
    cssH = Math.ceil(asc + desc + 2);         // 紧贴字形
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPoints();
  }

  function buildPoints() {
    const w = cssW, h = cssH;
    if (!w || !h) return;
    cell = Math.max(3, Math.round(h * 0.03));

    off.width = Math.max(1, Math.ceil(w));
    off.height = Math.max(1, Math.ceil(h));
    offCtx.fillStyle = '#000';
    offCtx.fillRect(0, 0, off.width, off.height);
    offCtx.fillStyle = '#fff';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'alphabetic';
    offCtx.font = `800 ${fontPx}px "Helvetica Neue", Arial, sans-serif`;
    offCtx.fillText(TEXT, w / 2, glyphAsc + 1); // 字形紧贴画布上下边，整体在画布内居中

    const data = offCtx.getImageData(0, 0, off.width, off.height).data;
    const cols = Math.floor(off.width / cell);
    const rows = Math.floor(off.height / cell);
    const pts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = Math.floor((c + 0.5) * cell);
        const py = Math.floor((r + 0.5) * cell);
        if (data[(py * off.width + px) * 4] > 80) pts.push({ c, r });
      }
    }
    const gw = cols * cell, gh = rows * cell;
    grid.cols = cols; grid.rows = rows;
    grid.ox = (w - gw) / 2; grid.oy = (h - gh) / 2;
    points = pts;
    glyphs = splitGlyphs(pts, cols, rows);
    writePath = buildWritePath(glyphs);
    state.clear();
  }

  function splitGlyphs(pts, cols, rows) {
    const counts = new Array(cols).fill(0);
    pts.forEach(({ c }) => { counts[c]++; });

    const clusters = [];
    let start = -1;
    for (let c = 0; c <= cols; c++) {
      const hasInk = c < cols && counts[c] > 0;
      if (hasInk && start < 0) start = c;
      if ((!hasInk || c === cols) && start >= 0) {
        clusters.push({ start, end: c - 1 });
        start = -1;
      }
    }

    return clusters.map((cluster) => {
      let minC = cluster.end, maxC = cluster.start, minR = rows, maxR = 0;
      pts.forEach(({ c, r }) => {
        if (c < cluster.start || c > cluster.end) return;
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
      });
      return { minC, maxC, minR, maxR };
    }).filter((g) => g.maxC >= g.minC && g.maxR >= g.minR);
  }

  function buildWritePath(clusters) {
    if (clusters.length < 3) return [];
    const [a, s, h] = clusters;
    const path = [];

    function p(g, x, y, strength = 1) {
      return {
        x: grid.ox + (g.minC + (g.maxC - g.minC) * x + 0.5) * cell,
        y: grid.oy + (g.minR + (g.maxR - g.minR) * y + 0.5) * cell,
        strength
      };
    }
    function travelTo(target, steps) {
      if (!path.length) {
        path.push(target);
        return;
      }
      const prev = path[path.length - 1];
      const distance = Math.hypot(target.x - prev.x, target.y - prev.y);
      const n = Math.max(1, steps || Math.round(distance / (cell * 1.7)));
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        path.push({
          x: prev.x + (target.x - prev.x) * t,
          y: prev.y + (target.y - prev.y) * t,
          strength: 0.72
        });
      }
    }
    function travelOutsideTo(target) {
      if (!path.length) {
        path.push(target);
        return;
      }
      const prev = path[path.length - 1];
      const outsideY = -cell * 10;
      const waypoints = [
        { x: prev.x, y: outsideY, strength: 0.42 },
        { x: target.x, y: outsideY, strength: 0.42 },
        target
      ];
      let from = prev;
      waypoints.forEach((to) => {
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const n = Math.max(10, Math.round(distance / (cell * 1.15)));
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          path.push({
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
            strength: to.strength
          });
        }
        from = to;
      });
    }
    function line(g, x1, y1, x2, y2, steps, options = {}) {
      if (!options.skipTravel) travelTo(p(g, x1, y1, 0.72));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        path.push(p(g, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t));
      }
    }
    function curve(g, anchors, steps, options = {}) {
      if (!options.skipTravel) travelTo(p(g, anchors[0][0], anchors[0][1], 0.72));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const scaled = t * (anchors.length - 1);
        const idx = Math.min(anchors.length - 2, Math.floor(scaled));
        const local = scaled - idx;
        const a0 = anchors[idx], a1 = anchors[idx + 1];
        path.push(p(
          g,
          a0[0] + (a1[0] - a0[0]) * local,
          a0[1] + (a1[1] - a0[1]) * local
        ));
      }
    }

    // A: draw the two diagonals, then ride back up the right diagonal to draw the bar.
    line(a, 0.08, 0.95, 0.50, 0.02, 46);
    line(a, 0.50, 0.02, 0.94, 0.95, 46);
    line(a, 0.94, 0.95, 0.72, 0.57, 22);
    line(a, 0.72, 0.57, 0.30, 0.57, 26);

    // S: lift out above the wordmark before entering the next letter.
    travelOutsideTo(p(s, 0.88, 0.11, 0.42));
    curve(s, [
      [0.88, 0.11],
      [0.25, 0.08],
      [0.11, 0.35],
      [0.28, 0.50],
      [0.78, 0.50],
      [0.91, 0.72],
      [0.64, 0.93],
      [0.12, 0.88]
    ], 112, { skipTravel: true });

    // H: lift out above the wordmark, then left vertical, return to the crossbar, and finish on the right vertical.
    travelOutsideTo(p(h, 0.10, 0.06, 0.42));
    line(h, 0.10, 0.06, 0.10, 0.94, 44, { skipTravel: true });
    line(h, 0.10, 0.94, 0.10, 0.50, 24);
    line(h, 0.10, 0.50, 0.90, 0.50, 42);
    line(h, 0.90, 0.50, 0.90, 0.06, 24);
    line(h, 0.90, 0.06, 0.90, 0.94, 44);

    return path;
  }

  function getWritePoint(t) {
    if (!writePath.length) return null;
    const total = WRITE.duration + WRITE.pause;
    const cycle = ((t / 1000) % total);
    if (cycle > WRITE.duration) return null;
    const linearProgress = cycle / WRITE.duration;
    const easedProgress = 0.5 - Math.cos(linearProgress * Math.PI) * 0.5;
    const progress = linearProgress + (easedProgress - linearProgress) * WRITE.ease;
    const scaled = progress * (writePath.length - 1);
    const idx = Math.min(writePath.length - 2, Math.floor(scaled));
    const local = scaled - idx;
    const p0 = writePath[idx], p1 = writePath[idx + 1];
    const fadeIn = Math.min(1, cycle / WRITE.fade);
    const fadeOut = Math.min(1, (WRITE.duration - cycle) / WRITE.fade);
    const cycleStrength = Math.max(0, Math.min(fadeIn, fadeOut));
    return {
      x: p0.x + (p1.x - p0.x) * local,
      y: p0.y + (p1.y - p0.y) * local,
      strength: (p0.strength + (p1.strength - p0.strength) * local) * cycleStrength
    };
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    if (ptr.active && lastMoveT > 0) {
      const dt = Math.max(0.001, (now - lastMoveT) / 1000);
      vel.x = 0.82 * vel.x + 0.18 * ((x - ptr.x) / dt);
      vel.y = 0.82 * vel.y + 0.18 * ((y - ptr.y) / dt);
    }
    if (!(ptr.active && smooth.init)) { smooth.x = x; smooth.y = y; smooth.init = true; }
    lastMoveT = now;
    ptr.x = x; ptr.y = y; ptr.active = true;
  }
  function onLeave() { ptr.active = false; }

  let raf = 0, prevT = null;
  function frame(t) {
    const dt = prevT == null ? 0 : Math.min(0.1, (t - prevT) / 1000);
    prevT = t;

    const sinceMove = lastMoveT > 0 ? (t - lastMoveT) / 1000 : 999;
    if (!ptr.active || sinceMove > 0.04) {
      const decay = Math.exp(-3 * dt);
      vel.x *= decay; vel.y *= decay;
    }
    if (ptr.active && smooth.init) {
      const e = 1 - Math.exp(-7 * dt);
      smooth.x += (ptr.x - smooth.x) * e;
      smooth.y += (ptr.y - smooth.y) * e;
    }

    ctx.clearRect(0, 0, cssW, cssH);

    const speed = Math.hypot(vel.x, vel.y);
    const auto = getWritePoint(t);
    const source = ptr.active && smooth.init ? smooth : auto;
    const sourceActive = !!source;
    const b = (ptr.active && smooth.init ? Math.min(10, 3 + 0.012 * speed) : WRITE.radius) * cell;
    const denom = 2 * b * b;
    const cutoff = (3 * b) * (3 * b);
    const decayPerFrame = dt / WRITE.decay;

    for (const { c, r } of points) {
      const px = grid.ox + (c + 0.5) * cell;
      const py = grid.oy + (r + 0.5) * cell;
      const key = c + ',' + r;
      let st = state.get(key);
      if (!st) { st = { influence: 0 }; state.set(key, st); }

      st.influence = Math.max(0, st.influence - decayPerFrame);
      if (sourceActive) {
        const dx = px - source.x, dy = py - source.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= cutoff) {
          const sourceStrength = source.strength == null ? 1 : source.strength;
          const inf = Math.exp(-d2 / denom) * sourceStrength;
          if (inf > st.influence) st.influence = inf;
        }
      }

      const v = st.influence;
      if (v >= 0.7) {
        ctx.fillStyle = DOT.solid.fill;
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.85, DOT.solid.r * cell), 0, TAU); ctx.fill();
      } else if (v >= 0.35) {
        ctx.fillStyle = DOT.mid.fill;
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.6, DOT.mid.r * cell), 0, TAU); ctx.fill();
      } else if (v >= 0.12) {
        ctx.strokeStyle = DOT.ring.stroke;
        ctx.lineWidth = Math.max(0.4, DOT.ring.lw * cell);
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.7, DOT.ring.r * cell), 0, TAU); ctx.stroke();
      } else {
        ctx.fillStyle = DOT.rest.fill;
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.55, DOT.rest.r * cell), 0, TAU); ctx.fill();
      }
    }

    raf = requestAnimationFrame(frame);
  }

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', onLeave);
  if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(canvas);
  // 字体加载完成后重新排版，避免用后备字体测量导致宽度不准
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  layout();
  raf = requestAnimationFrame(frame);
})();
