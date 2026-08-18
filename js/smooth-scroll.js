/**
 * smooth-scroll.js  v6
 *
 * Top-level pages use the browser's native, free scrolling.
 * Project detail pages keep light exponential damping.
 */
(function () {

  /* ── Tuning ──────────────────────────────────────────── */
  const FRICTION = 0.10; // RAF easing (lower = slower/smoother)

  /* ── State ───────────────────────────────────────────── */
  const isTopLevelPage = !document.querySelector('.pd-hero');

  let targetY  = window.scrollY;
  let currentY = window.scrollY;
  let rafId    = null;

  /* ── RAF loop ────────────────────────────────────────── */
  function animate() {
    const diff = targetY - currentY;
    if (Math.abs(diff) < 0.5) {
      currentY = targetY;
      window.scrollTo(0, currentY);
      rafId = null;
      return;
    }
    currentY += diff * FRICTION;
    window.scrollTo(0, currentY);
    rafId = requestAnimationFrame(animate);
  }

  function startAnim() {
    if (!rafId) {
      currentY = window.scrollY;
      rafId = requestAnimationFrame(animate);
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function clamp(y) {
    return Math.max(0, Math.min(y, document.body.scrollHeight - window.innerHeight));
  }

  /* ── 嵌套可滚动容器 ──────────────────────────────────
     详情页的整页阻尼会 preventDefault 掉所有 wheel 事件，
     这会连带吃掉页面内部可滚动容器（比如 SlashVibe 的流程图
     取景框）的滚动。指针停在这类容器里、且它在该方向上还没到底时，
     直接把事件交还给浏览器，让容器自己滚。
     滚到尽头再落回整页阻尼，不会把人困在框里。 */
  function innerScrollable(node, deltaY) {
    while (node && node.nodeType === 1 && node !== document.body && node !== document.documentElement) {
      var st = window.getComputedStyle(node);
      var oy = st.overflowY;
      if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
        var atTop    = node.scrollTop <= 0;
        var atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
        if (!(deltaY < 0 && atTop) && !(deltaY > 0 && atBottom)) return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  /* ── Wheel ───────────────────────────────────────────── */
  window.addEventListener('wheel', function (e) {
    if (isTopLevelPage) return;
    if (innerScrollable(e.target, e.deltaY)) return;   // 交给容器自己滚
    e.preventDefault();
    targetY = clamp(targetY + e.deltaY * 0.8);
    startAnim();
  }, { passive: false });

  /* ── Logo → scroll to top ───────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var logo = document.querySelector('.nav-logo');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.addEventListener('click', function () {
        targetY = 0;
        startAnim();
      });
    }

    /* ── Project title & image → navigate to detail page ── */
    document.querySelectorAll('.project-item').forEach(function (item) {
      var link = item.querySelector('.project-link');
      if (!link) return;
      var href = link.getAttribute('href');

      var title = item.querySelector('.project-title');
      if (title) {
        title.addEventListener('click', function () {
          link.click();
        });
      }

      var imgWrap = item.querySelector('.project-img-wrap');
      if (imgWrap && imgWrap.tagName !== 'A') {
        imgWrap.addEventListener('click', function () {
          link.click();
        });
      }

      /* ── Centered letter-spacing hover ── */
      if (title) {
        title.addEventListener('mouseenter', function () {
          var before = title.getBoundingClientRect().width;
          title.style.letterSpacing = '0.06em';
          var after = title.getBoundingClientRect().width;
          var shift = (after - before) / 2;
          title.style.transform = 'translateX(-' + shift + 'px)';
          title.classList.add('is-hovered');
        });
        title.addEventListener('mouseleave', function () {
          title.style.letterSpacing = '';
          title.style.transform = '';
          title.classList.remove('is-hovered');
        });
      }
    });
  });

  /* ── Nav scroll opacity ──────────────────────────────── */
  (function () {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    function updateNavState() {
      if (window.scrollY > 20) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
    }
    window.addEventListener('scroll', updateNavState, { passive: true });
    updateNavState();
  })();

})();
