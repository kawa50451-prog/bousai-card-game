(function(){
'use strict';
function init(){
const quiet=()=>document.documentElement.hasAttribute('data-motion-lite')||(matchMedia('(prefers-reduced-motion:reduce)').matches&&document.documentElement.dataset.motion!=='on');

// Motion Prompt #077, MIT License (c) 2026 Shohei Ohtaki.
// Adapted travel equation and cubic easeInOut from ref/077.txt and ref/lp.js.
const cities=[{"id": "nagoya", "en": "NAGOYA", "ja": "名古屋", "year": 1959, "event": "伊勢湾台風", "time": "9月26日 21:35", "zenith": "#071323", "horizon": "#20314a", "cut": "grid"}, {"id": "niigata", "en": "NIIGATA", "ja": "新潟", "year": 1964, "event": "新潟地震", "time": "6月16日 13:01", "zenith": "#354c61", "horizon": "#697a83", "cut": "fade"}, {"id": "kobe", "en": "KOBE", "ja": "神戸", "year": 1995, "event": "阪神・淡路大震災", "time": "1月17日 05:46", "zenith": "#060f21", "horizon": "#233950", "cut": "corner"}, {"id": "new_orleans", "en": "NEW ORLEANS", "ja": "ニューオーリンズ", "year": 2005, "event": "ハリケーン・カトリーナ", "time": "8月29日 朝・6時ごろ", "zenith": "#35434e", "horizon": "#677170", "cut": "grid2"}, {"id": "sendai", "en": "SENDAI", "ja": "仙台", "year": 2011, "event": "東日本大震災", "time": "3月11日 14:46", "zenith": "#35414d", "horizon": "#68727a", "cut": "triangles"}, {"id": "hiroshima", "en": "HIROSHIMA", "ja": "広島", "year": 2014, "event": "8月豪雨災害", "time": "8月20日 3〜4時", "zenith": "#070e18", "horizon": "#1b2935", "cut": "letters"}, {"id": "kumamoto", "en": "KUMAMOTO", "ja": "熊本", "year": 2016, "event": "熊本地震", "time": "4月16日 1:25", "zenith": "#080f20", "horizon": "#1b2b41", "cut": "corner2"}];
const root=document.getElementById('era-journey'), journey=document.querySelector('#era-journey'),track=root.querySelector('.track'),sky=document.querySelector('#era-sky'),year=document.querySelector('#era-year'),timeline=document.querySelector('#era-timeline'),currentCity=document.querySelector('#era-current-city');
const panels=[...root.querySelectorAll('article')], marks=[...document.querySelectorAll('#era-timeline button')];
const mq=matchMedia('(min-width:1024px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const supportsNative=CSS.supports('animation-timeline: view()')&&CSS.supports('animation-range: contain 0% contain 100%')&&!new URLSearchParams(location.search).has('fallback');
let native=supportsNative&&!quiet();
root.classList.add(native?'era-native':'era-fallback');window.skyMode=native?'css-scroll':'raf-fallback';
let travel=0,start=0,step=0,frame=0,countFrame=0,active=-1,displayed=cities[0].year;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const yearDigits=[...year.querySelectorAll('.digit')];
function renderYear(value){
 const text=String(Math.round(value)).padStart(4,'0');
 yearDigits.forEach((digit,i)=>{if(digit.textContent!==text[i])digit.textContent=text[i]});
 year.setAttribute('aria-label',text+'年');
}
function countTo(target,immediate=false){
 cancelAnimationFrame(countFrame);countFrame=0;
 const from=displayed,t0=performance.now();
 if(immediate||quiet()){displayed=target;renderYear(target);return}
 function tick(t){const p=clamp((t-t0)/900);displayed=from+(target-from)*ease(p);renderYear(displayed);if(p<1)countFrame=requestAnimationFrame(tick);else countFrame=0}
 countFrame=requestAnimationFrame(tick);
}
function mix(a,b,f){const x=a.match(/\w\w/g).map(x=>parseInt(x,16)),y=b.match(/\w\w/g).map(x=>parseInt(x,16));return 'rgb('+x.map((v,i)=>v+(y[i]-v)*f).join(',')+')'}
function update(immediate=false){
 frame=0;
 const bounds=journey.getBoundingClientRect();
 const sectionTop=document.getElementById('s04').getBoundingClientRect().top;
 root.classList.toggle('era-active',(mq.matches?bounds.top:sectionTop)<=1&&bounds.bottom>=innerHeight*.5);
 if(!mq.matches){
  // Include the heading on the first city screen, without hiding its controls.
  const entry=Math.max(0,bounds.top),bar=document.querySelector('.bottomBar').getBoundingClientRect();
  const top=innerHeight*.24+innerWidth*.64+122+entry;
  const size=top+108>bar.top-16?Math.min(108,(bar.left-innerWidth*.05-20)/2.24):108;
  root.style.setProperty('--era-entry-offset',entry+'px');
  root.style.setProperty('--era-year-size',Math.max(60,size)+'px');
  root.style.setProperty('--era-timeline-top',Math.max(98,entry+20)+'px');
 }
 root.style.setProperty('--era-clip-top',Math.max(0,bounds.top)+'px');
 root.style.setProperty('--era-clip-bottom',Math.max(0,innerHeight-bounds.bottom)+'px');
 const pos=mq.matches?clamp((scrollY-start)/travel)*6:Math.max(0,Math.min(6,(scrollY-start)/step));
 const p=pos/6;
 if(!native){
  if(mq.matches)track.style.transform=`translateX(${-p*travel}px)`;else track.style.removeProperty('transform');
  const i=Math.min(5,Math.floor(pos)),f=pos-i;
  for(const key of ['zenith','horizon'])sky.style.setProperty('--era-'+key,mix(cities[i][key],cities[i+1][key],f));
 }
 timeline.style.setProperty('--progress',(p*100)+'%');
 marks.forEach((mark,i)=>mark.classList.toggle('passed',i<=pos+0.0008));
 // The panel nearest the viewport center is current (switches at the midpoint between panels).
 const center=mq.matches?innerWidth/2:innerHeight/2;
 const distances=panels.map(panel=>{const r=panel.getBoundingClientRect();return Math.abs((mq.matches?(r.left+r.right):(r.top+r.bottom))/2-center)});
 const nearest=distances.indexOf(Math.min(...distances));
 const index=nearest;
 if(index!==active){const initial=active<0;active=index;currentCity.textContent=cities[index].ja;currentCity.style.left=(index/6*100)+'%';currentCity.dataset.edge=index===0?'first':index===6?'last':'';marks.forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});countTo(cities[index].year,immediate||initial)}
 else if(immediate)countTo(cities[index].year,true);
 window.skyState={p,pos,active,travel,start,step,mode:window.skyMode};
 // Facts live in the moving panels; the year lives in the pin. Reserve the
 // year's actual screen-space width even when a panel stops slightly off-center.
 if(mq.matches){
  const yearRight=year.getBoundingClientRect().right;
  panels.forEach((panel,i)=>{const fact=panel.querySelector('.fact');const x=panel.getBoundingClientRect().left+430;fact.style.setProperty('--fact-offset',(i===nearest?Math.max(0,yearRight+24-x):0)+'px')});
 }
}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>update())}
function measure(){
 start=journey.getBoundingClientRect().top+scrollY;step=panels[0].getBoundingClientRect().height;
 if(mq.matches){travel=track.getBoundingClientRect().width-innerWidth;journey.style.height=(innerHeight+travel)+'px'}else{journey.style.removeProperty('height');travel=0}
 root.style.setProperty('--travel',travel+'px');root.style.setProperty('--mobile-start',start+'px');root.style.setProperty('--mobile-end',(start+6*step)+'px');update();
}
function seek(position){
 scrollTo({top:start+clamp(position)*(mq.matches?travel:6*step),behavior:quiet()?'instant':'smooth'});
}
marks.forEach((button,i)=>button.addEventListener('click',e=>{
 e.stopPropagation();seek(i/6);history.replaceState(null,'','#era-'+cities[i].id);
}));
timeline.addEventListener('click',e=>{
 if(e.target.closest('button'))return;
 const rect=timeline.getBoundingClientRect();seek((e.clientX-rect.left)/rect.width);
});
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',scheduleMeasure,{passive:true});
addEventListener('scrollend',()=>update(true),{passive:true});
window.RonSite?.lenis?.on('scroll',schedule);
let resizeFrame=0;function scheduleMeasure(){if(!resizeFrame)resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;measure()})}
// Earlier sections can change height after updates and fonts arrive.
if('ResizeObserver' in window){const layoutObserver=new ResizeObserver(scheduleMeasure);layoutObserver.observe(document.querySelector('.pageScale'));}
reduced.addEventListener('change',()=>{
 native=supportsNative&&!quiet();
 root.classList.toggle('era-native',native);root.classList.toggle('era-fallback',!native);
 window.skyMode=native?'css-scroll':'raf-fallback';
 if(native){track.style.removeProperty('transform');for(const key of ['zenith','horizon'])sky.style.removeProperty('--era-'+key);}
 measure();if(quiet())countTo(cities[active].year,true);
});
measure();document.fonts.ready.then(()=>{measure();const index=cities.findIndex(c=>'#era-'+c.id===location.hash);if(index>=0)scrollTo(0,start+index*(mq.matches?travel/6:step))});

function loadImages(){root.querySelectorAll('[data-era-src]').forEach(image=>{const file=image.dataset.eraSrc;image.setAttribute('href','assets/v6/era/'+file+(innerWidth<=900?'_900':'')+'.webp');});}
if('IntersectionObserver' in window){const loader=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){loadImages();loader.disconnect();}},{rootMargin:'1200px'});loader.observe(journey);}else loadImages();
mq.addEventListener('change',loadImages);
const smallImages=matchMedia('(max-width:900px)');smallImages.addEventListener('change',()=>{if(root.querySelector('image[href]'))loadImages();});
addEventListener('pagehide',()=>{cancelAnimationFrame(frame);cancelAnimationFrame(countFrame);cancelAnimationFrame(resizeFrame);});
}
// Defer initialization as well as SVG image requests until the opening releases
// the page. Replays do not install a second observer or scroll listener.
function prepare(){
 if('IntersectionObserver' in window&&!location.hash.startsWith('#era-')){
  const nearby=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){nearby.disconnect();init();}},{rootMargin:'1200px'});
  nearby.observe(document.getElementById('s04'));
 }else init();
}
if(document.documentElement.classList.contains('hero-pending')||document.documentElement.classList.contains('opening-lock'))addEventListener('opening:finished',prepare,{once:true});else prepare();
})();
