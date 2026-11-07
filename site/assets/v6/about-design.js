(function(){
 'use strict';
 var reduce=matchMedia('(prefers-reduced-motion: reduce)'),lite=new URLSearchParams(location.search).get('motion')==='lite';
 function still(){return lite||reduce.matches;}
 var map=document.getElementById('about-map'),goal=document.getElementById('about-goal');
 if(!map)return;
 var details={
  know:['知る','何が起きるかを知る','受け身で、忘れやすい'],
  body:['体で覚える','身を守る手順を体で覚える','手順をなぞるだけになりやすい'],
  talk:['話し合って判断する','HUG では避難所を運営する判断。クロスロードでは正解のないジレンマを考え、話し合う','HUG には準備と進行役が要る。クロスロードでは選んだ結果が返ってこない']
 };
 var groups=Array.from(map.querySelectorAll('[data-map-group]'));
 function select(key){
  groups.forEach(function(g){g.setAttribute('aria-pressed',String(g.dataset.mapGroup===key));});
  var title=document.getElementById('map-detail-title'),content=document.getElementById('map-detail-content');
  title.textContent=key==='ron'?'Ready or Not':details[key][0];content.replaceChildren();
  if(key==='ron'){var p=document.createElement('p');p.className='map-detail-lead';['選ぶ・結果・','やり直しが、','数分で回る'].forEach(function(text){var span=document.createElement('span');span.textContent=text;p.append(span);});content.append(p);return;}
  var dl=document.createElement('dl');['得意なこと','まだ届いていないこと'].forEach(function(label,i){var dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=details[key][i+1];dl.append(dt,dd);});content.append(dl);
 }
 groups.forEach(function(g){g.addEventListener('click',function(){select(g.dataset.mapGroup);});g.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')select(g.dataset.mapGroup);});g.addEventListener('focus',function(){select(g.dataset.mapGroup);});g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g.dataset.mapGroup);}});});
 if(!still())map.classList.add('map-armed');
 if('IntersectionObserver'in window){var reveal=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');reveal.unobserve(e.target);}});},{threshold:.25});reveal.observe(map);reveal.observe(goal);}else{map.classList.add('is-in');goal.classList.add('is-in');}
 // The v5 ellipse math: scale and opacity follow depth; transforms keep cards upright.
 var orbits=Array.from(document.querySelectorAll('.about-orbit')).map(function(host){return{host:host,stage:host.querySelector('.about-orbit-stage'),cards:Array.from(host.querySelectorAll('.orbit-card')),stations:Array.from(host.querySelectorAll('.orbit-station')),visible:false,elapsed:0};});
 var frame=0,prev=0;
 function paint(o){
  var broken=o.host.classList.contains('orbit-broken'),phase=broken?Math.min(o.elapsed/2600,1):o.elapsed/9000;
  o.cards.forEach(function(card,i){
   var degrees=broken?-160+phase*120:-160+(phase+i/3)*360,a=degrees*Math.PI/180,t=-8*Math.PI/180;
   var ex=240*Math.cos(a),ey=105*Math.sin(a),w=o.stage.clientWidth,h=o.stage.clientHeight;
   var x=(300+ex*Math.cos(t)-ey*Math.sin(t))/600*w,y=(175+ex*Math.sin(t)+ey*Math.cos(t))/350*h,d=(Math.sin(a)+1)/2;
   card.style.transform='translate('+x.toFixed(2)+'px,'+y.toFixed(2)+'px) translate(-50%,-50%) scale('+(.65+.35*d).toFixed(3)+')';
   card.style.opacity=String(broken ? .85-.6*phase : .55+.45*d);card.style.zIndex=String(Math.round(10+d*10));
  });
  o.stations.forEach(function(station,i){
   var target=[-160,-40,80][i],a=target*Math.PI/180,t=-8*Math.PI/180;
   var x=300+240*Math.cos(a)*Math.cos(t)-105*Math.sin(a)*Math.sin(t);
   var y=175+240*Math.cos(a)*Math.sin(t)+105*Math.sin(a)*Math.cos(t);
   station.style.left=(x/6)+'%';station.style.top=(y/3.5)+'%';
   if(!station.querySelector('span')){var label=document.createElement('span');label.textContent=station.textContent;station.replaceChildren(label);}
   station.dataset.side=i===0?'left':i===1?'top':'bottom';
   var active=o.cards.some(function(card,j){var angle=(-160+(phase+j/3)*360)%360;var delta=((angle-target)%360+540)%360-180;return Math.abs(delta)<26;});station.classList.toggle('is-active',!broken&&active);});
 }
 function allowed(){return !still()&&!document.hidden&&orbits.some(function(o){return o.visible&&(!o.host.classList.contains('orbit-broken')||o.elapsed<2600);});}
 function tick(now){frame=0;if(!allowed()){prev=0;return;}var dt=prev?Math.min(now-prev,80):0;prev=now;orbits.forEach(function(o){if(o.visible){o.elapsed+=dt;paint(o);}});frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;prev=0;orbits.forEach(paint);if(allowed())frame=requestAnimationFrame(tick);}
 if('IntersectionObserver'in window){var orbitObserver=new IntersectionObserver(function(entries){entries.forEach(function(e){orbits.find(function(o){return o.host===e.target;}).visible=e.isIntersecting;});sync();});orbits.forEach(function(o){orbitObserver.observe(o.host);});}else orbits.forEach(function(o){o.visible=true;});
 document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);window.addEventListener('resize',sync);
 orbits.forEach(function(o){if(still()&&o.host.classList.contains('orbit-broken'))o.elapsed=2600;paint(o);});sync();
 var stack=document.querySelector('.about-screen-stack'),screens=Array.from(stack.querySelectorAll('figure')),scrollFrame=0;
 function screensPaint(){scrollFrame=0;var rect=stack.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));screens.forEach(function(screen,i){var active=still()?i===2:progress>i*.16+.15;screen.style.setProperty('--screen-y',active?'-18px':'20px');screen.style.zIndex=String(active?i+4:3-i);});}
 window.addEventListener('scroll',function(){if(!scrollFrame)scrollFrame=requestAnimationFrame(screensPaint);},{passive:true});window.addEventListener('resize',screensPaint);screensPaint();
})();
