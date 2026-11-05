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

/* v6 hero: finite Web Animations only, no animation frame loop. */
(function () {
  'use strict';
  var html = document.documentElement;
  var hero = document.getElementById('s00');
  if (!hero) return;
  var reduced = matchMedia('(prefers-reduced-motion:reduce)');
  var animations = [];
  var buttons = document.querySelectorAll('[data-hero-variant]');
  function quiet() {
    return html.hasAttribute('data-motion-lite') ||
      (reduced.matches && html.dataset.motion !== 'on');
  }
  function settle() {
    animations.forEach(function (a) { a.cancel(); });
    animations = [];
    html.classList.remove('hero-pending');
    html.classList.remove('intro-lock');
  }
  function animate(selector, frames, options) {
    var element = hero.querySelector(selector);
    var a = element.animate(frames, Object.assign({fill:'backwards'}, options));
    animations.push(a);
  }
  function syncButtons() {
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.heroVariant === html.dataset.hero));
    });
  }
  function play() {
    settle();
    if (quiet() || !hero.animate) return;
    animate('.hero-caption', [
      {opacity:0,letterSpacing:'.4em',transform:'scale(1)',offset:0},
      {opacity:1,letterSpacing:'.4em',transform:'scale(1)',offset:.22},
      {opacity:1,letterSpacing:'.4em',transform:'scale(1)',offset:.57},
      {opacity:0,letterSpacing:'.95em',transform:'scale(1.12)',offset:1}
    ], {duration:1120});
    animate('.hero-black', [{opacity:.94},{opacity:0}], {duration:1100,delay:650});
    if (html.dataset.hero === 'a') {
      animate('.hero-title', [
        {opacity:0,offset:0},{opacity:.8,offset:.14},{opacity:.15,offset:.26},
        {opacity:1,offset:.5},{opacity:.32,offset:.63},{opacity:1,offset:1}
      ], {duration:1000,delay:1200});
      animate('.hero-fill', [{opacity:0},{opacity:1}], {duration:550,delay:1850});
      animate('.hero-rim', [{opacity:1},{opacity:1,offset:.79},{opacity:0}], {duration:2650});
    } else {
      animate('.hero-title', [{opacity:0},{opacity:1}], {duration:850,delay:1200,easing:'ease-out'});
    }
    ['.tagline','.cta'].forEach(function (selector) {
      animate(selector, [{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],
        {duration:800,delay:2250,easing:'ease-out'});
    });
  }
  syncButtons();
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      html.dataset.hero = b.dataset.heroVariant;
      var url = new URL(location.href);
      url.searchParams.set('hero', html.dataset.hero);
      history.replaceState(null, '', url);
      syncButtons();
      play();
    });
  });
  document.querySelector('[data-hero-replay]').addEventListener('click', play);
  reduced.addEventListener('change', function () { if (quiet()) settle(); });
  // The final state is the CSS default, including when scripting is unavailable.
  // Bound the font wait so a blocked font service cannot leave the hero hidden.
  var pending = html.classList.contains('hero-pending');
  if (pending) {
    Promise.race([document.fonts.ready, new Promise(function (resolve) { setTimeout(resolve, 1500); })])
      .then(function () { if (html.classList.contains('hero-pending')) play(); });
  }
  window.addEventListener('pagehide', settle);
})();
