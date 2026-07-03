/**
 * dot-grid-fixed.js
 * ─────────────────────────────────────────────────────────────
 * 仅会员等级页（project-member-level.html）使用的变体。
 * 与共享版 dot-grid.js 的区别：
 *  • 点状网【固定在视口】（配合 #dot-canvas { position: fixed }），
 *    滚动时点位不动 → 长页面也不会卡（canvas 只有一屏大小）。
 *  • 网格只覆盖视口高度，鼠标用 clientX/Y（不加 scrollY）。
 * 其余波浪 / 推开 / 弹簧逻辑与共享版一致。
 * ─────────────────────────────────────────────────────────────
 */

class DotGrid {
  constructor() {
    this.canvas = document.getElementById('dot-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    /* ── 配置 ─────────────────────────────────────────────── */
    this.SPACING    = 28;
    this.DOT_R      = 1.5;

    // 推开：钟形位移场（中心≈0，外环最强，长尾跟随）
    //   disp = MAX_DISP · (1 - exp(-d/SOFT_R)) · exp(-d/FAR_R)
    //   ① 中心几乎不推 → 无空洞
    //   ② d≈200px 处达到峰值 (~55px) → 强烈可见
    //   ③ FAR_R 极大 → 全屏长尾跟随
    this.MAX_DISP   = 72;    // 推力幅度（远超波动振幅，明显区别于自然波动）
    this.SOFT_R     = 75;    // 中心软化半径（越大中心越不动）
    this.FAR_R      = 1200;  // 远场衰减长度

    // 临界阻尼弹簧 DECAY ≈ 2√SPRING_K
    this.SPRING_K   = 18;
    this.DECAY      = 8.5;

    // 颜色：深色背景用白点，浅色背景用黑点
    // 检测：
    //  ① project-detail.css 已加载 且 非 theme-gradient → 详情页深色
    //  ② body 有 theme-dark-page 类 → 一级页深色（独立开发 / 摄影 等）
    // 仅当页面确实是深色背景时用白点；theme-light / theme-gradient / 默认 = 白底 → 黑点
    const isDark = document.body.classList.contains('theme-dark')
                || document.body.classList.contains('theme-dark-page');
    // 支持 canvas data-dot-color="r,g,b" 自定义颜色
    this.DOT_RGB    = this.canvas.dataset.dotColor
                    || (isDark ? '255,255,255' : '0,0,0');
    this.BASE_A     = isDark ? 0.07 : 0.047;
    this.HOVER_A    = 0;
    // 支持 canvas data-dot-shape="cross" 自定义形状
    this.DOT_SHAPE  = this.canvas.dataset.dotShape || 'circle';

    // 闲置波浪：三频叠加，大振幅，明显可见
    this.W_SPEED    = 1.05;
    this.W_FREQ     = 0.10;
    this.W_AMP_Y    = 5.0;   // 整体 Y 振幅倍率
    this.W_AMP_X    = 4.3;   // 整体 X 振幅倍率

    /* ── 状态 ─────────────────────────────────────────────── */
    this.dots        = [];
    this.time        = 0;
    this.mouse       = { x: -9999, y: -9999 };
    this.mouseOnPage = false;
    this.lastFrame   = performance.now();
    this.dpr         = Math.min(window.devicePixelRatio || 1, 2);

    // 暴露给外部（像素猫读取最近点位置）
    this.nearestDot  = null;   // {x, y} in document space, or null
    window.dotGrid   = this;

    this.resize();
    this.bindEvents();
    this.tick();
  }

  /* ── 尺寸 & 网格 ──────────────────────────────────────── */
  // v7: canvas 固定在视口（position: fixed），点位钉在屏幕背景上，不随页面滚动
  resize() {
    const dpr = this.dpr;
    const w   = window.innerWidth;
    const vh  = window.innerHeight;

    // 画布 backing store = 视口大小（不随文档高度膨胀 → 高页面也不卡）
    this.canvas.width  = Math.round(w * dpr);
    this.canvas.height = Math.round(vh * dpr);
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = vh + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.lw = w;
    this.lh = vh;
    this.buildGrid();
  }

  buildGrid() {
    this.dots = [];
    const cols = Math.ceil(this.lw / this.SPACING) + 2;
    const rows = Math.ceil(this.lh / this.SPACING) + 2;  // 仅视口高度
    const half = this.SPACING * 0.5;
    for (let r = 0; r < rows; r++) {
      // 蜂巢错位：每隔一行水平偏移半格，破掉行列对齐 → 不再有十字射线
      const offsetX = (r & 1) * half;
      for (let c = 0; c < cols; c++) {
        const ox = c * this.SPACING + offsetX;
        const oy = r * this.SPACING;
        this.dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0, c, r });
      }
    }
  }

  /* ── 事件 ─────────────────────────────────────────────── */
  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      // 视口坐标（不加 scrollY，因为点位固定在视口）
      this.mouse.x     = e.clientX;
      this.mouse.y     = e.clientY;
      this.mouseOnPage = true;
    });

    document.addEventListener('mouseleave', () => { this.mouseOnPage = false; });
    document.addEventListener('mouseenter', () => { this.mouseOnPage = true;  });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.resize(), 150);
    });
    // 不再监听 scroll：点位固定在视口，滚动与网格无关
  }

  /* ── 主循环 ───────────────────────────────────────────── */
  tick() {
    const now = performance.now();
    const dt  = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.time += dt;

    const dampFactor = Math.exp(-this.DECAY * dt);

    const { ctx, dots, time, lw, lh } = this;
    const { DOT_R, MAX_DISP, SOFT_R, FAR_R, SPRING_K, BASE_A, HOVER_A } = this;
    const invSoft = 1 / SOFT_R;
    const invFar  = 1 / FAR_R;
    const mx     = this.mouse.x;
    const my     = this.mouse.y;
    const active = this.mouseOnPage;

    // canvas 固定视口大小，清空整个视口
    ctx.clearRect(0, 0, lw, lh);

    for (const d of dots) {

      /* ── 1. 三频叠加海浪（始终运行，振幅提升） ─────────────
         Y 方向三波叠加，总最大振幅约 ±7px
         X 方向两波叠加，约 ±3.5px
         speed=0.40 让运动明显可见
      ── */
      const s  = time * this.W_SPEED;
      const f  = this.W_FREQ;
      const c_ = d.c;
      const r_ = d.r;

      const wyRaw = (Math.sin(s * 1.00 + c_ * f        + r_ * 0.08) * 3.5
                  +  Math.sin(s * 0.65 - c_ * f * 0.70 + r_ * 0.13) * 2.0
                  +  Math.sin(s * 0.42 + c_ * f * 0.50 - r_ * 0.10) * 1.2) * this.W_AMP_Y;

      const wxRaw = (Math.cos(s * 0.85 + r_ * f        - c_ * 0.05) * 2.2
                  +  Math.cos(s * 0.50 - r_ * f * 0.80 + c_ * 0.07) * 1.3) * this.W_AMP_X;

      /* ── 2. 推开（无空洞）：温柔指数位移场 ─────────────────
         disp = MAX_DISP · exp(-dist / FALLOFF_R)
         近处只推 ~30px，点之间互相错开像揉面团/液化的感觉，
         不会形成清晰的空白圆。远场长尾使整屏轻微跟随。
      ── */
      let repelX = 0;
      let repelY = 0;
      let alpha  = BASE_A;

      if (active) {
        const dx   = d.ox - mx;
        const dy   = d.oy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.5) {
          // 钟形：中心趋近 0，外环最强
          const t1   = 1 - Math.exp(-dist * invSoft); // 中心软化
          const t2   = Math.exp(-dist * invFar);      // 远场长尾
          const disp = MAX_DISP * t1 * t2;
          const inv  = 1 / dist;

          repelX = dx * inv * disp;
          repelY = dy * inv * disp;
          alpha  = BASE_A + (t1 * t2) * HOVER_A;      // HOVER_A=0 时无影响
        }
      }

      const targetX = d.ox + wxRaw + repelX;
      const targetY = d.oy + wyRaw + repelY;

      /* ── 3. 临界阻尼弹簧 → 平滑、不振荡 ─────────────────── */
      d.vx += (targetX - d.x) * SPRING_K * dt;
      d.vy += (targetY - d.y) * SPRING_K * dt;

      d.vx *= dampFactor;
      d.vy *= dampFactor;
      d.x  += d.vx * dt;
      d.y  += d.vy * dt;

      /* ── 4. 绘制（视口坐标，直接画） ─────────────────────── */
      {
        const clampedA = Math.min(alpha, 0.19).toFixed(3);
        ctx.fillStyle = `rgba(${this.DOT_RGB},${clampedA})`;
        if (this.DOT_SHAPE === 'cross') {
          // 四角星（sparkle）：贝塞尔曲线内凹弧面
          const r = DOT_R * 3.2;   // 臂长
          const q = r * 0.18;      // 内凹控制点偏移（越小越尖细）
          const x = d.x, y = d.y;
          ctx.beginPath();
          ctx.moveTo(x,     y - r);
          ctx.bezierCurveTo(x + q, y - q,  x + q, y - q,  x + r, y    );
          ctx.bezierCurveTo(x + q, y + q,  x + q, y + q,  x,     y + r);
          ctx.bezierCurveTo(x - q, y + q,  x - q, y + q,  x - r, y    );
          ctx.bezierCurveTo(x - q, y - q,  x - q, y - q,  x,     y - r);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(d.x, d.y, DOT_R, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(() => this.tick());
  }
}

window.addEventListener('DOMContentLoaded', () => new DotGrid());
