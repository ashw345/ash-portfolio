/**
 * smooth-scroll.js  v5
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

  /* ── Wheel ───────────────────────────────────────────── */
  window.addEventListener('wheel', function (e) {
    if (isTopLevelPage) return;
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
