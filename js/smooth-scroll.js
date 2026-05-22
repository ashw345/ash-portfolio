/**
 * smooth-scroll.js  v5
 *
 * Project pages (.project-item exists):
 *   Snap targets = header top (scrollY=0) + each project divider + footer.
 *   One gesture → one snap step, locked for LOCK_MS afterward.
 *   Speed ≈ 0.6× v4 (FRICTION reduced from 0.16 → 0.10).
 *
 * Other pages: light exponential damping only.
 */
(function () {

  /* ── Tuning ──────────────────────────────────────────── */
  const NAV_H    = 70;   // px — matches --nav-h in CSS
  const FRICTION = 0.10; // RAF easing (lower = slower/smoother)
  const LOCK_MS  = 750;  // ms locked after each snap (covers slower animation)
  const DIR_MIN  = 4;    // |deltaY| threshold to fire navigation

  /* ── State ───────────────────────────────────────────── */
  const isProjectPage = !!document.querySelector('.project-item');

  let targetY  = window.scrollY;
  let currentY = window.scrollY;
  let rafId    = null;
  let locked   = false;
  let lockTimer = null;

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

  /**
   * Build the full list of snap scroll-positions:
   *   0 (header) → project dividers → footer
   * Each value is the scrollY that puts that landmark at the nav bottom.
   */
  function getSnapTargets() {
    const targets = [0]; // header / top of page

    // project item dividers
    document.querySelectorAll('.project-item').forEach(function (item) {
      const absTop = item.getBoundingClientRect().top + window.scrollY;
      targets.push(clamp(absTop - NAV_H));
    });

    // footer
    const footer = document.querySelector('.footer, footer');
    if (footer) {
      const absTop = footer.getBoundingClientRect().top + window.scrollY;
      targets.push(clamp(absTop - NAV_H));
    }

    // deduplicate & sort just in case
    return targets
      .filter(function (v, i, a) { return a.indexOf(v) === i; })
      .sort(function (a, b) { return a - b; });
  }

  /* ── Snap logic ──────────────────────────────────────── */
  function snap(dir) {
    const targets = getSnapTargets();
    const cur     = window.scrollY;

    let dest;
    if (dir > 0) {
      dest = targets.find(function (t) { return t > cur + 20; });
    } else {
      const prev = targets.filter(function (t) { return t < cur - 20; });
      dest = prev.length ? prev[prev.length - 1] : undefined;
    }

    if (dest !== undefined) {
      targetY = dest;
      startAnim();
    }
  }

  function lockNav() {
    locked = true;
    clearTimeout(lockTimer);
    lockTimer = setTimeout(function () { locked = false; }, LOCK_MS);
  }

  /* ── Wheel ───────────────────────────────────────────── */
  window.addEventListener('wheel', function (e) {
    e.preventDefault();

    if (isProjectPage) {
      if (locked) return;
      if (Math.abs(e.deltaY) < DIR_MIN) return;
      snap(e.deltaY > 0 ? 1 : -1);
      lockNav();
    } else {
      targetY = clamp(targetY + e.deltaY * 0.8);
      startAnim();
    }
  }, { passive: false });

  /* ── Touch ───────────────────────────────────────────── */
  var touchStartY = 0;

  window.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
    targetY  = window.scrollY;
    currentY = window.scrollY;
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (!isProjectPage) return;
    var dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 20 || locked) return;
    snap(dy > 0 ? 1 : -1);
    lockNav();
  }, { passive: true });

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
          window.location.href = href;
        });
      }

      var imgWrap = item.querySelector('.project-img-wrap');
      if (imgWrap) {
        imgWrap.addEventListener('click', function () {
          window.location.href = href;
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
