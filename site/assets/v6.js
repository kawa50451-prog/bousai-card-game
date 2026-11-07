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

/* The opening owns playback; hero stays in its final state throughout handoff. */
(function(){
 'use strict';
 var html=document.documentElement;
 var buttons=document.querySelectorAll('[data-hero-variant]');
 function sync(){buttons.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.heroVariant===html.dataset.hero));});}
 sync();
 buttons.forEach(function(b){b.addEventListener('click',function(){
  html.dataset.hero=b.dataset.heroVariant;
  var url=new URL(location.href);url.searchParams.set('hero',html.dataset.hero);
  history.replaceState(null,'',url);sync();
 });});
 var replay=document.querySelector('[data-hero-replay]');
 if(replay) replay.addEventListener('click',function(){window.opening.start();});
})();

/* Arm only when motion is allowed; the bridge remains visible without JS. */
(function(){
 'use strict';
 var section=document.getElementById('s-about');
 if(!section || !('IntersectionObserver' in window)) return;
 var reduced=matchMedia('(prefers-reduced-motion:reduce)');
 if(document.documentElement.hasAttribute('data-motion-lite') || reduced.matches) return;
 section.classList.add('bridge-armed');
 var observer=new IntersectionObserver(function(entries){
  if(!entries.some(function(entry){return entry.isIntersecting;})) return;
  section.classList.add('bridge-in');observer.disconnect();
 },{threshold:.22});
 observer.observe(section);
 reduced.addEventListener('change',function(event){if(event.matches){section.classList.add('bridge-in');observer.disconnect();}});
})();
