/**
 * blob-bg.js
 *
 * 弥散渐变背景 —— 仅在 body.theme-gradient 页面运行。
 *
 * 设计：
 *  - 纯白底
 *  - 屏幕中心一个浅蓝色弥散大球（非圆形，由多个 lobe 叠加组成）
 *  - 鼠标移动时整个球做轻微视差位移
 *  - 球内部 lobe 缓慢漂移产生有机感
 *  - 全屏胶片噪点叠加（SVG feTurbulence）
 */
(function () {

  if (!document.body.classList.contains('theme-gradient')) return;

  /* ── 球的形状定义 ──────────────────────────────────
     每个 lobe 是一个相对于球中心的偏移 + 半径 + 透明度。
     多个 lobe 叠加 + canvas blur(80px) 后会融合成一个有机不规则形状。
     ──────────────────────────────────────────────── */
  /* 一个球，浅蓝 */
  const BALLS = [
    {
      color: { r: 201, g: 221, b: 241 },           // 浅蓝（20%更浅）
      startX: 0.50, startY: 0.50,
      lobes: [
        { dx:  0.00, dy:  0.00, r: 0.87, a: 0.425 },
        { dx:  0.09, dy: -0.07, r: 0.60, a: 0.325 },
        { dx: -0.11, dy:  0.04, r: 0.63, a: 0.31  },
        { dx:  0.05, dy:  0.13, r: 0.50, a: 0.28  },
        { dx: -0.06, dy: -0.12, r: 0.45, a: 0.25  },
      ],
    },
  ];

  /* ── 物理参数（鼠标推开，粘性，无归位）───────────
     鼠标进入 PUSH_RADIUS 范围时，把球朝鼠标的反方向推。
     高阻尼让球缓慢加速、缓慢停止（ease-in/out）。
     没有任何归位力 → 球停在被推到的位置。
     ──────────────────────────────────────────────── */
  const PUSH_RADIUS  = 1.10;    // 鼠标作用范围（归一化）→ 覆盖整屏，一次移动可同时推两球
  const PUSH_FORCE   = 0.0009;  // 推力强度（半）
  const VEL_SCALE    = 0.5;     // 速度应用到位置时的缩放（更慢）
  const DAMPING      = 0.955;   // 阻尼
  const POS_MIN      = 0.10;    // 球中心边界（保留 10% 边距，防止球被推出屏幕）
  const POS_MAX      = 0.90;
  const DRIFT_AMP    = 0.005;
  const DRIFT_FREQ   = 0.00018;

  /* ── 噪点参数（SVG feTurbulence 实时滤镜方案）─── */
  const GRAIN_FREQ    = 0.85;
  const GRAIN_OCTAVES = 3;
  const GRAIN_OPACITY = 0.55;
  const GRAIN_BLEND   = 'soft-light';

  /* ── State ──────────────────────────────────────── */
  let canvas, ctx;
  let mouse = { x: 0.5, y: 0.5 };
  let balls = [];                      // 运行时球状态
  let rafId = null;
  let startTime = performance.now();
  let grainDiv;

  /* ─────────────────────────── Grain ──────────────── */
  function initGrain() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';
    svg.innerHTML = `
      <defs>
        <filter id="grain-filter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="${GRAIN_FREQ}"
            numOctaves="${GRAIN_OCTAVES}"
            stitchTiles="stitch"
            result="noise">
            <animate
              attributeName="baseFrequency"
              values="${GRAIN_FREQ};${GRAIN_FREQ + 0.05};${GRAIN_FREQ - 0.03};${GRAIN_FREQ}"
              dur="8s"
              repeatCount="indefinite"/>
          </feTurbulence>
          <feColorMatrix
            in="noise"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.85 0"/>
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.3" intercept="-0.15"/>
            <feFuncG type="linear" slope="1.3" intercept="-0.15"/>
            <feFuncB type="linear" slope="1.3" intercept="-0.15"/>
          </feComponentTransfer>
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);

    grainDiv = document.createElement('div');
    grainDiv.id = 'grain-overlay';
    grainDiv.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9998;
      pointer-events: none;
      filter: url(#grain-filter);
      opacity: ${GRAIN_OPACITY};
      mix-blend-mode: ${GRAIN_BLEND};
    `;
    document.body.appendChild(grainDiv);
  }

  /* ─────────────────────────── Init ───────────────── */
  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'blob-canvas';
    document.body.prepend(canvas);
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
    });

    // 实例化所有球
    balls = BALLS.map((b, i) => ({
      color: b.color,
      lobes: b.lobes,
      pos: { x: b.startX, y: b.startY },
      vel: { x: 0, y: 0 },
      phase: i * 2.3,                  // 每个球的漂移相位错开
    }));

    requestAnimationFrame(() => canvas.classList.add('ready'));
    initGrain();
    rafId = requestAnimationFrame(tick);
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /* ─────────────────────────── Loop ───────────────── */
  function tick(now) {
    balls.forEach(ball => {
      /* 鼠标推力（反方向） */
      const dx = ball.pos.x - mouse.x;
      const dy = ball.pos.y - mouse.y;
      const d  = Math.sqrt(dx * dx + dy * dy);

      if (d < PUSH_RADIUS && d > 0.0001) {
        const strength = (1 - d / PUSH_RADIUS) * PUSH_FORCE;
        ball.vel.x += (dx / d) * strength;
        ball.vel.y += (dy / d) * strength;
      }

      /* 阻尼 + 积分 */
      ball.vel.x *= DAMPING;
      ball.vel.y *= DAMPING;
      ball.pos.x += ball.vel.x * VEL_SCALE;
      ball.pos.y += ball.vel.y * VEL_SCALE;

      /* 边界硬约束 */
      if (ball.pos.x < POS_MIN) { ball.pos.x = POS_MIN; ball.vel.x = 0; }
      if (ball.pos.x > POS_MAX) { ball.pos.x = POS_MAX; ball.vel.x = 0; }
      if (ball.pos.y < POS_MIN) { ball.pos.y = POS_MIN; ball.vel.y = 0; }
      if (ball.pos.y > POS_MAX) { ball.pos.y = POS_MAX; ball.vel.y = 0; }
    });

    draw(now);
    rafId = requestAnimationFrame(tick);
  }

  function draw(now) {
    const W = canvas.width;
    const H = canvas.height;
    const elapsed = now - startTime;
    const minDim = Math.min(W, H);

    ctx.clearRect(0, 0, W, H);

    balls.forEach(ball => {
      const baseX = ball.pos.x * W;
      const baseY = ball.pos.y * H;
      const c     = ball.color;

      ball.lobes.forEach((lobe, i) => {
        const phase = ball.phase + i * 1.7;
        const driftX = Math.sin(elapsed * DRIFT_FREQ + phase) * DRIFT_AMP;
        const driftY = Math.cos(elapsed * DRIFT_FREQ * 0.8 + phase) * DRIFT_AMP;

        const cx = baseX + (lobe.dx + driftX) * minDim;
        const cy = baseY + (lobe.dy + driftY) * minDim;
        const R  = lobe.r * minDim;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        grad.addColorStop(0,    `rgba(${c.r},${c.g},${c.b},${lobe.a})`);
        grad.addColorStop(0.35, `rgba(${c.r},${c.g},${c.b},${lobe.a * 0.85})`);
        grad.addColorStop(0.7,  `rgba(${c.r},${c.g},${c.b},${lobe.a * 0.35})`);
        grad.addColorStop(1,    `rgba(${c.r},${c.g},${c.b},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  /* ─────────────────────────── Start ──────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
