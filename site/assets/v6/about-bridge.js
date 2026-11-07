/* Scroll-driven road: one coalesced frame per scroll, no idle clock. */
(function(){
 'use strict';
 var root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 var lite=new URLSearchParams(location.search).get('motion')==='lite';
 if(lite)root.setAttribute('data-motion-lite','');
 var section=document.getElementById('s-about'),road=section&&section.querySelector('.card-road');
 if(lite)document.querySelectorAll('a[href="about.html"]').forEach(function(a){a.href='about.html?motion=lite';});
 if(!road)return;
 var cards=Array.from(road.querySelectorAll('.road-span')),frame=0;
 var native=CSS.supports('animation-timeline: view()') && 'registerProperty' in CSS;
 function still(){return lite||reduced.matches;}
 function paint(){
  frame=0;section.classList.toggle('road-scroll',!still());
  section.classList.toggle('road-native',native&&!still());
  road.dataset.driver=native&&!still()?'css':'raf';
  if(native&&!still()){cards.forEach(function(c){c.style.removeProperty('--drop');c.style.removeProperty('--placed');});return;}
  var rect=section.getBoundingClientRect(),count=innerWidth<=600?4:6;
  var progress=still()?1:Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height-innerHeight)));
  road.dataset.progress=progress.toFixed(3);
  cards.forEach(function(card,i){
   var drop=Math.max(0,Math.min(1,progress*count-i));
   card.style.setProperty('--drop',drop);
   card.style.setProperty('--placed',Math.max(0,(drop-.8)*5));
  });
  road.style.setProperty('--road-action',.4+.6*Math.max(0,(progress-.85)/.15));
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
 if(!native)addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduced.addEventListener('change',schedule);
 // Arrive on ABOUT with the completed road as the shared transition surface.
 document.querySelectorAll('.about-copy a[href^="about.html"]').forEach(function(a){a.addEventListener('click',function(){section.classList.remove('road-native');cards.forEach(function(c){c.style.setProperty('--drop',1);c.style.setProperty('--placed',1);});road.style.setProperty('--road-action',1);});});
 addEventListener('pageshow',schedule);paint();
})();
