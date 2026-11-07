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

/* Mobile 05: one screen at a time on a sliding, looping track; desktop keeps its grid. */
(function(){
 'use strict';
 var list=document.querySelector('#s05 .labList');if(!list)return;
 var items=Array.from(list.children),n=items.length,mobile=matchMedia('(max-width:600px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),pos=1,busy=false;
 function clone(el){var c=el.cloneNode(true);c.classList.add('lab-clone');c.setAttribute('aria-hidden','true');c.inert=true;c.tabIndex=-1;return c;}
 list.prepend(clone(items[n-1]));list.append(clone(items[0]));
 var host=document.createElement('div');host.className='lab-carousel';list.before(host);host.append(list);
 var controls=document.createElement('div');controls.className='lab-controls';
 controls.innerHTML='<button type="button" class="lab-arrow lab-prev" aria-label="前へ"></button><span class="lab-dots" aria-hidden="true">'+items.map(function(){return '<i></i>';}).join('')+'</span><button type="button" class="lab-arrow lab-next" aria-label="次へ"></button>';
 host.append(controls);var prev=controls.querySelector('.lab-prev'),next=controls.querySelector('.lab-next');
 function place(animate){
  if(!mobile.matches){list.style.transform='';list.style.transition='';items.forEach(function(it){it.inert=false;});return;}
  list.style.transition=animate&&!reduced.matches?'transform .5s var(--ease)':'none';
  list.style.transform='translate3d('+(-pos*100)+'%,0,0)';
  var cur=(pos-1+n)%n;
  items.forEach(function(it,i){it.inert=i!==cur;});
  controls.querySelectorAll('i').forEach(function(d,i){d.classList.toggle('is-current',i===cur);});
 }
 function settle(){busy=false;if(pos===0||pos===n+1){pos=pos===0?n:1;place(false);void list.offsetWidth;}}
 list.addEventListener('transitionend',function(e){if(e.target===list&&e.propertyName==='transform')settle();});
 function move(step){if(!mobile.matches||busy)return;pos+=step;busy=!reduced.matches;place(true);if(!busy)settle();setTimeout(function(){if(busy)settle();},700);}
 prev.addEventListener('click',function(){move(-1);});next.addEventListener('click',function(){move(1);});
 host.addEventListener('keydown',function(e){if(mobile.matches&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
 var start=null,swiped=false;
 list.addEventListener('touchstart',function(e){if(!mobile.matches||e.touches.length!==1)return;start={x:e.touches[0].clientX,y:e.touches[0].clientY};swiped=false;},{passive:true});
 list.addEventListener('touchend',function(e){if(!start)return;var dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){swiped=true;move(dx<0?1:-1);}},{passive:true});
 list.addEventListener('touchcancel',function(){start=null;},{passive:true});
 list.addEventListener('click',function(e){if(swiped){e.preventDefault();swiped=false;}},true);
 mobile.addEventListener('change',function(){place(false);});place(false);
})();
