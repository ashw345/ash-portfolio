(function () {
  'use strict';

  var STORAGE_KEY = 'ash-project-transition';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pending = readPending();
  var isFreshEntry = pending && Date.now() - pending.startedAt < 8000;
  var isNavigating = false;
  var progress = isFreshEntry ? 88 : 0;
  var frame = 0;

  cleanTransitionUrl();

  var overlay = document.createElement('div');
  overlay.className = 'page-transition';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML =
    '<div class="page-transition__count">00</div>' +
    '<div class="page-transition__copy">' +
      '<div class="page-transition__bar"><i class="page-transition__bar-fill"></i></div>' +
      '<span>ASH_STUDIO</span>' +
      '<span class="page-transition__destination">SELECTED WORK</span>' +
    '</div>';
  document.documentElement.appendChild(overlay);

  var count = overlay.querySelector('.page-transition__count');
  var bar = overlay.querySelector('.page-transition__bar-fill');
  var destination = overlay.querySelector('.page-transition__destination');

  function readPending() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function writePending(value) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      // Navigation still works when storage is unavailable.
    }
  }

  function clearPending() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Nothing else to clean up.
    }
  }

  function cleanTransitionUrl() {
    var cleanUrl = new URL(window.location.href);
    if (!cleanUrl.searchParams.has('_pt')) return;
    cleanUrl.searchParams.delete('_pt');
    window.history.replaceState(
      window.history.state,
      '',
      cleanUrl.pathname + cleanUrl.search + cleanUrl.hash
    );
  }

  function setProgress(value) {
    progress = Math.max(0, Math.min(100, value));
    count.textContent = String(Math.round(progress)).padStart(2, '0');
    bar.style.transform = 'scaleX(' + progress / 100 + ')';
  }

  function easeInOut(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function animateProgress(from, to, duration, onComplete) {
    window.cancelAnimationFrame(frame);
    var startedAt = performance.now();

    function tick(now) {
      var elapsed = Math.min((now - startedAt) / duration, 1);
      setProgress(from + (to - from) * easeInOut(elapsed));

      if (elapsed < 1) {
        frame = window.requestAnimationFrame(tick);
      } else if (onComplete) {
        onComplete();
      }
    }

    frame = window.requestAnimationFrame(tick);
  }

  function showOverlay(label) {
    if (label) destination.textContent = label;
    document.documentElement.classList.add('is-page-transitioning');
    overlay.classList.add('is-visible');
  }

  function hideOverlay() {
    overlay.classList.remove('is-visible');
    document.documentElement.classList.remove('is-page-transitioning');
    clearPending();
  }

  function finishEntry() {
    if (!isFreshEntry) return;
    isFreshEntry = false;
    animateProgress(progress, 100, reducedMotion ? 1 : 220, function () {
      window.setTimeout(hideOverlay, reducedMotion ? 0 : 40);
    });
  }

  if (isFreshEntry) {
    destination.textContent = pending.label || 'SELECTED WORK';
    setProgress(88);
    showOverlay();
    document.addEventListener('DOMContentLoaded', finishEntry, { once: true });
    window.setTimeout(finishEntry, 650);
  } else {
    clearPending();
    setProgress(0);
  }

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || isNavigating) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var target = event.target instanceof Element ? event.target.closest('a') : null;
    if (!target || target.target === '_blank' || target.hasAttribute('download')) return;

    var url = new URL(target.href, window.location.href);
    var page = url.pathname.split('/').pop() || 'index.html';
    var entersProject = /^project-[^/]+\.html$/.test(page);

    if (url.origin !== window.location.origin || !entersProject) return;
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (page === currentPage) return;

    event.preventDefault();
    isNavigating = true;

    var navigationUrl = new URL(url.href);
    navigationUrl.searchParams.set('_pt', Date.now().toString(36));

    var card = target.closest('article, .project-card');
    var cardTitle = card ? card.querySelector('h2, h3, .project-title') : null;
    var label = (cardTitle ? cardTitle.textContent : target.textContent || '').trim() || 'SELECTED WORK';
    writePending({ startedAt: Date.now(), label: label });
    setProgress(0);
    showOverlay(label);

    if (reducedMotion) {
      setProgress(88);
      window.setTimeout(function () {
        window.location.assign(navigationUrl.href);
      }, 120);
      return;
    }

    animateProgress(0, 88, 520, function () {
      window.location.assign(navigationUrl.href);
    });
  });

  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    isNavigating = false;
    setProgress(0);
    hideOverlay();
  });
})();
