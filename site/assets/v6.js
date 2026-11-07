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
        reduced.matches) return;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio >= .15) entry.target.classList.add('deck-in');
        else if (!entry.isIntersecting) entry.target.classList.remove('deck-in');
      });
    }, {threshold:[0,.15]});
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

/* Mobile 05: one complete screen at a time; desktop keeps its grid. */
(function(){
 'use strict';
 var list=document.querySelector('#s05 .labList');if(!list)return;
 var items=Array.from(list.children),mobile=matchMedia('(max-width:600px)'),index=0;
 var host=document.createElement('div');host.className='lab-carousel';list.before(host);host.append(list);
 var controls=document.createElement('div');controls.className='lab-controls';
 controls.innerHTML='<button type="button" class="lab-prev" aria-label="前へ">←</button><span class="lab-dots" aria-hidden="true">'+items.map(function(){return '<i></i>';}).join('')+'</span><button type="button" class="lab-next" aria-label="次へ">→</button>';
 host.append(controls);var prev=controls.querySelector('.lab-prev'),next=controls.querySelector('.lab-next');
 function paint(){
  items.forEach(function(item,i){item.hidden=mobile.matches&&i!==index;item.inert=mobile.matches&&i!==index;});
  prev.disabled=index===0;next.disabled=index===items.length-1;
  controls.querySelectorAll('i').forEach(function(dot,i){dot.classList.toggle('is-current',i===index);});
 }
 function move(step){index=Math.max(0,Math.min(items.length-1,index+step));paint();}
 prev.addEventListener('click',function(){move(-1);});next.addEventListener('click',function(){move(1);});
 host.addEventListener('keydown',function(e){if(mobile.matches&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
 var start=null,swiped=false;
 list.addEventListener('touchstart',function(e){if(!mobile.matches||e.touches.length!==1)return;start={x:e.touches[0].clientX,y:e.touches[0].clientY};swiped=false;},{passive:true});
 list.addEventListener('touchend',function(e){if(!start)return;var dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){swiped=true;move(dx<0?1:-1);}},{passive:true});
 list.addEventListener('touchcancel',function(){start=null;},{passive:true});
 list.addEventListener('click',function(e){if(swiped){e.preventDefault();swiped=false;}},true);
 mobile.addEventListener('change',paint);paint();
})();
