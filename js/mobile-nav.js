(function () {
  'use strict';

  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-menu-toggle');
  var links = document.querySelector('.nav-links');
  if (!nav || !toggle || !links) return;

  function isOpen() {
    return nav.classList.contains('is-menu-open');
  }

  function updateLabel() {
    var zh = document.documentElement.lang !== 'en';
    toggle.setAttribute('aria-label', isOpen()
      ? (zh ? '关闭导航' : 'Close navigation')
      : (zh ? '打开导航' : 'Open navigation'));
  }

  function setOpen(open) {
    nav.classList.toggle('is-menu-open', open);
    document.body.classList.toggle('nav-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    updateLabel();
  }

  toggle.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  links.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 768 && isOpen()) setOpen(false);
  });

  new MutationObserver(updateLabel).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });

  updateLabel();
})();
