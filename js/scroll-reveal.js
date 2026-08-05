/**
 * scroll-reveal.js  v1
 *
 * Project list entrance choreography:
 *   1. the divider rule draws in from the left
 *   2. the image frame wipes open while the artwork settles from a slight zoom
 *   3. the copy staggers up, line by line
 * Plus a light differential parallax — image column and text column drift
 * at slightly different rates, so the row feels layered rather than flat.
 *
 * The `has-reveal` class is added only when the effects will actually run,
 * so the hidden start states in CSS never apply to no-JS or reduced-motion
 * visitors — they simply see the finished layout.
 */
(function () {

  var items = document.querySelectorAll('.projects .project-item');
  if (!items.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('has-reveal');

  /* ── Reveal ──────────────────────────────────────────── */
  function reveal(item) {
    if (item.classList.contains('is-revealed')) return;
    item.classList.add('is-revealed');
    io.unobserve(item);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, {
    threshold: 0.16,
    /* start a touch after the row's edge clears the fold */
    rootMargin: '0px 0px -8% 0px'
  });

  Array.prototype.forEach.call(items, function (item) { io.observe(item); });

  /* Safety net: the rows start hidden, so anything that stops the observer
     from delivering would leave the list blank. This sweep re-checks by hand,
     which also covers rows already past the fold on a restored scroll position. */
  function sweep() {
    var vh = window.innerHeight;
    Array.prototype.forEach.call(items, function (item) {
      if (item.classList.contains('is-revealed')) return;
      var rect = item.getBoundingClientRect();
      if (rect.top < vh * 0.92 && rect.bottom > 0) reveal(item);
    });
  }

  setTimeout(sweep, 1200);

  /* ── Differential parallax ───────────────────────────── */
  /* Stacked layouts have no side-by-side relationship to play against. */
  var wide = window.matchMedia('(min-width: 701px)');

  var layers = [];
  var ticking = false;

  function buildLayers() {
    layers = [];

    if (!wide.matches) {
      Array.prototype.forEach.call(items, function (item) {
        var wrap = item.querySelector('.project-img-wrap');
        var info = item.querySelector('.project-info');
        if (wrap) wrap.style.transform = '';
        if (info) info.style.transform = '';
      });
      return;
    }

    Array.prototype.forEach.call(items, function (item) {
      var wrap = item.querySelector('.project-img-wrap');
      var info = item.querySelector('.project-info');
      /* opposite signs: the columns converge as the row crosses centre */
      if (wrap) layers.push({ el: wrap, range: 24 });
      if (info) layers.push({ el: info, range: -10 });
    });
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;

    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var rect = layer.el.getBoundingClientRect();

      /* skip anything comfortably outside the fold */
      if (rect.bottom < -200 || rect.top > vh + 200) continue;

      var centre = rect.top + rect.height / 2;
      var progress = (centre - vh / 2) / (vh / 2 + rect.height / 2);
      if (progress < -1) progress = -1;
      else if (progress > 1) progress = 1;

      layer.el.style.transform =
        'translate3d(0,' + (progress * layer.range).toFixed(2) + 'px,0)';
    }
  }

  function onScroll() {
    sweep();
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  buildLayers();
  update();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    buildLayers();
    update();
  }, { passive: true });

})();
