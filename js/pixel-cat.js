/**
 * pixel-cat.js  v4
 *
 * 一只小猫，坐在屏幕右下角
 *
 * 行为：
 *   - 页面加载 → 自动从屏幕右下角出现（渐进渐出）
 *   - IDLE：坐着，什么都不做
 *   - HELD：左键按住拖走，超过 1.5s 进入挣扎，强制松手
 *   - STRUGGLE：挣扎 1/2 交替，结束后下落
 *   - FALLING：下落到地面后回到 IDLE
 *   - 右键猫 → 弹窗"小咪一边玩去"
 *       😺咪！ → 猫消失，禁用召唤直到刷新
 *       😾呜嗷！ → 关弹窗
 */
(function () {

  /* ── 配置 ────────────────────────────────────────── */
  const CAT_SIZE          = 48;
  const HOLD_THRESHOLD    = 1500;
  const STRUGGLE_FRAME_MS = 200;
  const GRAVITY           = 0.8;
  const SAFE_MARGIN       = 16;

  const SPRITES = {
    sitting:   { color: '#FF6B6B', label: '坐' },
    held:      { color: '#A78BFA', label: '被拎' },
    struggle1: { color: '#FFD93D', label: '挣1' },
    struggle2: { color: '#FB923C', label: '挣2' },
    falling:   { color: '#4ECDC4', label: '掉' }
  };

  /* ── 全局 ────────────────────────────────────────── */
  let disabled = false;            // 用户选了"咪！"之后置 true，刷新页面才能重置
  let cat      = null;

  /* ── 工具 ────────────────────────────────────────── */
  function groundY()    { return window.innerHeight - CAT_SIZE - SAFE_MARGIN; }
  function leftBound()  { return SAFE_MARGIN; }
  function rightBound() { return window.innerWidth - CAT_SIZE - SAFE_MARGIN; }
  function topBound()   { return SAFE_MARGIN; }

  /* ── 创建唯一一只猫 ─────────────────────────────── */
  function spawnCat() {
    if (disabled || cat) return;

    const c = {
      el: null, labelEl: null,
      state: 'falling',
      x: 0, y: 0,
      visualYOffset: 0,
      vy: 0,
      direction: 1,
      frameIndex: 0,
      currentSprite: 'lying',
      fallRaf: null,
      followTimer: null,
      jumpTimer: null,
      jumpEndTimer: null,
      isJumping: false,
      holdTimer: null,
      struggleTimer: null,
      moveListener: null,
      upListener: null,
      contextListener: null
    };

    const el = document.createElement('div');
    el.className = 'pixel-cat';
    el.style.cssText = `
      position: fixed;
      width: ${CAT_SIZE}px;
      height: ${CAT_SIZE}px;
      z-index: 150;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #111;
      user-select: none;
      pointer-events: auto;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      image-rendering: pixelated;
      transition: none;
    `;
    const lbl = document.createElement('span');
    lbl.style.pointerEvents = 'none';
    el.appendChild(lbl);
    document.body.appendChild(el);

    c.el = el;
    c.labelEl = lbl;
    el.addEventListener('mousedown',  (e) => onGrab(c, e));
    el.addEventListener('contextmenu', (e) => onRightClick(c, e));

    cat = c;

    // 从屏幕右下角生成（初始位置在地面以下）
    c.x = window.innerWidth - CAT_SIZE - SAFE_MARGIN;
    c.y = groundY() + 80;
    setSprite(c, 'sitting');
    setPos(c, c.x, c.y);
    startEntrance(c);
  }

  function removeCat(c) {
    cancelAllTimers(c);
    if (c.moveListener) document.removeEventListener('mousemove', c.moveListener);
    if (c.upListener)   document.removeEventListener('mouseup',   c.upListener);
    if (c.el && c.el.parentNode) c.el.remove();
    if (cat === c) cat = null;
  }

  function cancelAllTimers(c) {
    cancelAnimationFrame(c.fallRaf);  c.fallRaf = null;
    clearInterval(c.followTimer);     c.followTimer = null;
    clearTimeout(c.jumpTimer);        c.jumpTimer = null;
    clearTimeout(c.jumpEndTimer);     c.jumpEndTimer = null;
    clearTimeout(c.holdTimer);        c.holdTimer = null;
    clearInterval(c.struggleTimer);   c.struggleTimer = null;
  }

  /* ── Sprite / 位置 ──────────────────────────────── */
  function setSprite(c, name) {
    const s = SPRITES[name];
    c.el.style.background = s.color;
    c.labelEl.textContent = s.label;
    c.el.style.transform  = c.direction === -1 ? 'scaleX(-1)' : 'scaleX(1)';
    c.currentSprite = name;
  }
  function setPos(c, nx, ny) {
    c.x = nx; c.y = ny;
    c.el.style.left = nx + 'px';
    c.el.style.top  = (ny + c.visualYOffset) + 'px';
  }
  function refreshPos(c) {
    c.el.style.left = c.x + 'px';
    c.el.style.top  = (c.y + c.visualYOffset) + 'px';
  }

  /* ── 出场动画（从底部上升 + 回弹） ────────────── */
  function startEntrance(c) {
    c.state = 'entrance';

    setTimeout(() => {
      if (!c.el || c.state !== 'entrance') return;

      const startY = groundY() + 80;      // 屏幕底部以下
      const peakY  = groundY() - 8;       // 上升超调目标
      const finalY = groundY();           // 落地位置
      const dur1   = 350;                 // 上升阶段 ms
      const dur2   = 240;                 // 回弹阶段 ms

      function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
      function easeOut(t)   { return 1 - Math.pow(1 - t, 2); }

      const t0 = performance.now();
      function phase1(now) {
        if (!c.el || c.state !== 'entrance') return;
        const t = Math.min((now - t0) / dur1, 1);
        setPos(c, c.x, startY + (peakY - startY) * easeInOut(t));
        if (t < 1) { requestAnimationFrame(phase1); return; }
        // 进入回弹阶段
        const t1 = performance.now();
        requestAnimationFrame(function phase2(now2) {
          if (!c.el || c.state !== 'entrance') return;
          const t2 = Math.min((now2 - t1) / dur2, 1);
          setPos(c, c.x, peakY + (finalY - peakY) * easeOut(t2));
          if (t2 < 1) { requestAnimationFrame(phase2); return; }
          setPos(c, c.x, finalY);
          c.state = 'idle';
        });
      }

      requestAnimationFrame(phase1);
    }, 500);
  }

  /* ── 下落动画 ────────────────────────────────────── */
  function fallStep(c) {
    if (c.state !== 'falling') return;
    setSprite(c, 'falling');

    // 分阶段加速：开始慢 → 中间正常 → 后面快
    if (c.vy < 4) {
      c.vy += GRAVITY * 0.4;  // 开始：加速度减弱
    } else if (c.vy < 12) {
      c.vy += GRAVITY;        // 中间：保持现在的速度
    } else {
      c.vy += GRAVITY * 1.6;  // 后面：加速度增强
    }

    let ny = c.y + c.vy;
    if (ny >= groundY()) {
      setPos(c, c.x, groundY());
      c.state = 'idle';
      setSprite(c, 'sitting');
      return;
    }
    setPos(c, c.x, ny);
    c.fallRaf = requestAnimationFrame(() => fallStep(c));
  }


  /* ── 拎起 ────────────────────────────────────────── */
  function onGrab(c, e) {
    if (e.button !== 0) return; // 只响应左键
    e.preventDefault();
    e.stopPropagation();
    cancelAllTimers(c);
    c.state = 'held';
    c.visualYOffset = 0;
    c.isJumping = false;
    window.catHeld = true;
    setSprite(c, 'held');
    c.el.style.cursor = 'grabbing';

    const rect = c.el.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;

    c.moveListener = (ev) => {
      if (!c.el) return;
      if (c.state !== 'held' && c.state !== 'struggle') return;
      setPos(c, ev.clientX - offX, ev.clientY - offY);
    };
    c.upListener = () => {
      document.removeEventListener('mousemove', c.moveListener);
      document.removeEventListener('mouseup',   c.upListener);
      c.moveListener = null; c.upListener = null;
      clearTimeout(c.holdTimer);
      clearInterval(c.struggleTimer);
      window.catHeld = false;
      if (c.el) c.el.style.cursor = 'grab';
      // 松手后下落，然后回到 idle
      c.state = 'falling';
      c.vy = 0;
      fallStep(c);
    };
    document.addEventListener('mousemove', c.moveListener);
    document.addEventListener('mouseup',   c.upListener);

    c.holdTimer = setTimeout(() => startStruggle(c), HOLD_THRESHOLD);
  }
  function startStruggle(c) {
    c.state = 'struggle';
    const frames = ['struggle1','struggle2','struggle1','struggle2'];
    let i = 0;
    c.struggleTimer = setInterval(() => {
      if (i >= frames.length) {
        clearInterval(c.struggleTimer);
        // 挣扎完成，强制松手 → 下落
        document.removeEventListener('mousemove', c.moveListener);
        document.removeEventListener('mouseup', c.upListener);
        c.moveListener = null; c.upListener = null;
        window.catHeld = false;
        if (c.el) c.el.style.cursor = 'grab';
        c.state = 'falling';
        c.vy = 0;
        fallStep(c);
        return;
      }
      setSprite(c, frames[i]);
      i++;
    }, STRUGGLE_FRAME_MS);
  }

  /* ── 右键 → 弹窗 ────────────────────────────────── */
  function onRightClick(c, e) {
    e.preventDefault();
    e.stopPropagation();
    showDismissPopup(c);
  }

  function showDismissPopup(c) {
    // 防止重复
    const existing = document.getElementById('cat-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'cat-popup';
    popup.style.cssText = `
      position: fixed;
      z-index: 300;
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 12px;
      padding: 12px 14px;
      font-family: -apple-system, 'PingFang SC', sans-serif;
      font-size: 13px;
      color: #111;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      user-select: none;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      min-width: 200px;
    `;
    const msg = document.createElement('div');
    msg.textContent = '小咪一边玩去';
    msg.style.cssText = 'text-align:center; padding: 2px 0 4px;';
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 8px; justify-content: center;';

    const btnDismiss = document.createElement('button');
    btnDismiss.textContent = '😺 咪！';
    const btnKeep = document.createElement('button');
    btnKeep.textContent = '😾 呜嗷！';
    [btnDismiss, btnKeep].forEach(b => {
      b.style.cssText = `
        flex: 1;
        background: rgba(0,0,0,0.05);
        border: none;
        border-radius: 8px;
        padding: 8px 10px;
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        transition: background .15s;
        white-space: nowrap;
      `;
      b.onmouseenter = () => b.style.background = 'rgba(0,0,0,0.10)';
      b.onmouseleave = () => b.style.background = 'rgba(0,0,0,0.05)';
    });

    popup.appendChild(msg);
    popup.appendChild(btnRow);
    btnRow.appendChild(btnDismiss);
    btnRow.appendChild(btnKeep);
    document.body.appendChild(popup);

    // 定位到猫上方
    const catRect = c.el.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    let px = catRect.left + catRect.width / 2 - popupRect.width / 2;
    let py = catRect.top - popupRect.height - 10;
    // 防止超出屏幕
    px = Math.max(8, Math.min(px, window.innerWidth - popupRect.width - 8));
    if (py < 8) py = catRect.bottom + 10;
    popup.style.left = px + 'px';
    popup.style.top  = py + 'px';

    function closePopup() {
      popup.remove();
      document.removeEventListener('mousedown', outsideClick, true);
    }
    function outsideClick(ev) {
      if (!popup.contains(ev.target)) closePopup();
    }
    setTimeout(() => document.addEventListener('mousedown', outsideClick, true), 0);

    btnDismiss.addEventListener('click', (ev) => {
      ev.stopPropagation();
      disabled = true;
      window.catDisabled = true;
      removeCat(c);
      closePopup();
    });
    btnKeep.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closePopup();
    });
  }

  /* ── 视口变化 ────────────────────────────────────── */
  window.addEventListener('resize', () => {
    if (!cat) return;
    let nx = Math.max(leftBound(),  Math.min(cat.x, rightBound()));
    let ny = Math.max(0,            Math.min(cat.y, groundY()));
    setPos(cat, nx, ny);
  });

  /* ── 启动 ────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', spawnCat);

})();
