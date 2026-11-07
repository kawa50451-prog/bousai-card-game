/* 03 only: observe mobile entries, with no scroll handler or frame loop. */
(function () {
  'use strict';
  var section = document.getElementById('s03');
  if (!section || !('IntersectionObserver' in window)) return;
  var html = document.documentElement;
  var mobile = matchMedia('(max-width:900px)');
  var reduced = matchMedia('(prefers-reduced-motion:reduce)');
  var observer;
  function setup() {
    if (observer) observer.disconnect();
    section.classList.remove('deck-reveal');
    if (!mobile.matches || html.hasAttribute('data-motion-lite') ||
        (reduced.matches && html.dataset.motion !== 'on')) return;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('deck-in');
        observer.unobserve(entry.target);
      });
    }, {threshold:0.12});
    section.querySelectorAll('.deck-step').forEach(function (step) {
      step.classList.remove('deck-in');
      observer.observe(step);
    });
    section.classList.add('deck-reveal');
  }
  setup();
  mobile.addEventListener('change', setup);
  reduced.addEventListener('change', setup);
})();
