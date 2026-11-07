(function(){
 'use strict';
 var reduce=matchMedia('(prefers-reduced-motion: reduce)'),lite=new URLSearchParams(location.search).get('motion')==='lite';
 function still(){return lite||reduce.matches;}
 var map=document.getElementById('about-map'),goal=document.getElementById('about-goal');
 if(!map)return;
 var details={
  hazard:['ハザードマップ','身近な地域の危険を確かめる','判断の結果を試す場は別に必要'],
  know:['知る','何が起きるかを知る','受け身で、忘れやすい'],
  body:['体で覚える','身を守る手順を体で覚える','手順をなぞるだけになりやすい'],
  talk:['話し合って判断する','HUG では避難所を運営する判断。クロスロードでは正解のないジレンマを考え、話し合う','HUG には準備と進行役が要る。クロスロードでは選んだ結果が返ってこない']
 };
 var groups=Array.from(map.querySelectorAll('[data-map-group]'));
 function select(key){
  groups.forEach(function(g){g.setAttribute('aria-pressed',String(g.dataset.mapGroup===key));});
  var title=document.getElementById('map-detail-title'),content=document.getElementById('map-detail-content');
  title.textContent=key==='ron'?'Ready or Not':details[key][0];content.replaceChildren();
  if(key==='ron'){var p=document.createElement('p');p.className='map-detail-lead';['選ぶ・結果・やり直しを、','簡単に繰り返せる'].forEach(function(text){var span=document.createElement('span');span.textContent=text;p.append(span);});content.append(p);return;}
  var dl=document.createElement('dl');['得意なこと','まだ届いていないこと'].forEach(function(label,i){var dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=details[key][i+1];dl.append(dt,dd);});content.append(dl);
 }
 groups.forEach(function(g){g.addEventListener('click',function(){select(g.dataset.mapGroup);});g.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')select(g.dataset.mapGroup);});g.addEventListener('focus',function(){select(g.dataset.mapGroup);});g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g.dataset.mapGroup);}});});
 // Scroll determines placement, never a timer: the empty quarter fills last.
 var cycle=document.querySelector('.cycle-game'),valley=document.getElementById('about-valley'),pending=0;
 function progress(node){var r=node.getBoundingClientRect();return Math.max(0,Math.min(1,(innerHeight-r.top)/(Math.min(innerHeight,r.height)*.9)));}
 function paint(){pending=0;var staticMode=still();if(valley){var vr=valley.getBoundingClientRect(),v=staticMode?1:Math.max(0,Math.min(1,-vr.top/(vr.height-innerHeight*.68)));valley.style.setProperty('--bridge',v);valley.classList.toggle('bridge-visible',v>.4);}map.classList.toggle('map-armed',!staticMode);var p=progress(map);groups.forEach(function(g,i){g.classList.toggle('is-placed',staticMode||p>(i+1)*.18);});
  if(cycle){var r=cycle.getBoundingClientRect(),step=staticMode?3:Math.min(3,Math.floor(progress(cycle)*4));cycle.dataset.step=step;cycle.classList.toggle('is-running',!staticMode&&!document.hidden&&step===3&&r.top<innerHeight&&r.bottom>0);}
 }
 function schedule(){if(!pending)pending=requestAnimationFrame(paint);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);document.addEventListener('visibilitychange',schedule);reduce.addEventListener('change',schedule);paint();
})();
