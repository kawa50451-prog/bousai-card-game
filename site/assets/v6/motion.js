/* Motion contract. Runs in head to establish the arrival curtain before first paint. */
(function(){
 'use strict';
 const root=document.documentElement,query=new URLSearchParams(location.search);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const lite=query.get('motion')==='lite';
 const still=()=>lite||reduced.matches;
 if(lite)root.setAttribute('data-motion-lite','');
 function preference(){root.toggleAttribute('data-motion-still',still());if(still())clearCurtain();}
 let safety=0,departing=false,arrival=null,navigateTimer=0;
 const key='ronMotionArrival';
 const homePath=p=>/\/(?:(?:index|v6)(?:\.html)?)?$/.test(p);
 const aboutPath=p=>/\/about(?:\.html)?$/.test(p);
 const pagePath=p=>homePath(p)||/\/(?:about|news|features|cards|contact|404|modes\/(?:versus|co-op)|assets\/v6\/sub\/privacy)(?:\.html)?\/?$/.test(p);
 function clearCurtain(){
  clearTimeout(safety);root.classList.remove('motion-covered','motion-arriving','motion-leaving');departing=false;
 }
 function insure(){clearTimeout(safety);safety=setTimeout(clearCurtain,2000);}
 try{
  arrival=JSON.parse(sessionStorage.getItem(key));sessionStorage.removeItem(key);
  if(!arrival||arrival.url!==location.href||Date.now()-arrival.time>10000)arrival=null;
 }catch(e){}
 preference();
 if(arrival&&arrival.kind==='curtain'&&!still()){
  root.classList.add('motion-covered','motion-arriving');insure();
 }
 function reveal(){
  if(!root.classList.contains('motion-arriving'))return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   root.classList.remove('motion-arriving');
   // Commit opaque state with transitions enabled before revealing.
   getComputedStyle(root,'::after').opacity;
   root.classList.remove('motion-covered');
   setTimeout(clearCurtain,400);
  }));
 }
 addEventListener('pageshow',e=>{
  if(e.persisted){clearTimeout(navigateTimer);clearCurtain();try{sessionStorage.removeItem(key);}catch(e){}}
  else reveal();
 });
 // All internal page arrivals use the navy curtain.
 function skipTransition(transition){
  if(!transition)return;
  // A deliberately skipped VT rejects ready; consume that expected rejection.
  transition.ready.catch(()=>{});transition.skipTransition();
 }
 addEventListener('pageswap',e=>skipTransition(e.viewTransition));
 addEventListener('pagereveal',e=>skipTransition(e.viewTransition));
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');
  if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.hasAttribute('download')||(a.target&&a.target!=='_self')||still())return;
  const url=new URL(a.href,location.href);
  if(url.origin!==location.origin||!pagePath(url.pathname)||!pagePath(location.pathname)||
    (url.pathname===location.pathname&&url.search===location.search))return;
  if(departing){e.preventDefault();return;}
  // Carrying state in the URL is the fallback when storage is unavailable.
  let stored=false;
  try{sessionStorage.setItem(key,JSON.stringify({url:url.href,kind:'curtain',time:Date.now()}));stored=true;}catch(err){}
  e.preventDefault();departing=true;
  if(!stored)url.searchParams.set('_ronCurtain',String(Date.now()));
  root.classList.add('motion-leaving');getComputedStyle(root,'::after').opacity;
  root.classList.add('motion-covered');insure();
  let moved=false;
  function move(){if(moved)return;moved=true;clearTimeout(navigateTimer);location.assign(url.href);}
  function ended(event){if(event.target===root&&event.pseudoElement==='::after'&&event.propertyName==='opacity'){root.removeEventListener('transitionend',ended);move();}}
  root.addEventListener('transitionend',ended);
  navigateTimer=setTimeout(()=>{root.removeEventListener('transitionend',ended);move();},180);
 });
 if(query.has('_ronCurtain')){
  const stamp=Number(query.get('_ronCurtain'));
  if(!still()&&Date.now()-stamp<10000){root.classList.add('motion-covered','motion-arriving');insure();}
  const clean=new URL(location.href);clean.searchParams.delete('_ronCurtain');history.replaceState(history.state,'',clean);
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const players=[];
  if(lite)document.querySelectorAll('a[href]').forEach(a=>{
   const url=new URL(a.href,location.href);
   if(url.origin===location.origin&&pagePath(url.pathname)){url.searchParams.set('motion','lite');a.href=url.href;}
  });
  function roll(node){
   const text=node.textContent;
   const box=document.createElement('span');box.className='motion-roll';
   const current=document.createElement('span');current.className='motion-current';current.textContent=text;
   const next=current.cloneNode(true);next.className='motion-next';next.setAttribute('aria-hidden','true');
   box.append(current,next);node.replaceWith(box);return box;
  }
  // Wrap only text nodes: arrows, images, accessible labels and link hit areas stay intact.
  document.querySelectorAll('.v6-text-link,.news-more,.navMenuLabel,.news-row-title,.about-main a,.ctaMain,.closeCta,.barPlay,.try-actions a,.try-reset,[data-hero-replay],[data-hero-variant]').forEach(host=>{
   if(host.querySelector('.motion-roll'))return;
   const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
   const nodes=[];while(walker.nextNode())if(walker.currentNode.textContent.trim()&&!walker.currentNode.parentElement.closest('[aria-hidden="true"]'))nodes.push(walker.currentNode);
   nodes.forEach(roll);
  });
  document.querySelectorAll('.barPlay,.ctaMain,.closeCta').forEach(button=>{
   const box=button.querySelector('.motion-roll');if(!box)return;
   const lines=[...box.children];
   button.classList.add('motion-play');button.setAttribute('aria-label','PLAY（ブラウザで遊ぶ）');box.setAttribute('aria-hidden','true');
   const words=['PLAY','ブラウザで遊ぶ'];
   let timer=0,visible=false,hover=false,focused=false,index=0,phase='wait',pos=4;
   function paint(text,jp){lines.forEach(line=>{line.textContent=text;line.classList.toggle('motion-jp',jp);});}
   function stop(reset){clearTimeout(timer);timer=0;if(reset){index=0;phase='wait';pos=4;paint(words[0],false);}}
   function active(){return visible&&!hover&&!focused&&!still()&&!document.hidden;}
   function schedule(delay){clearTimeout(timer);if(active())timer=setTimeout(tick,delay);}
   function tick(){
    timer=0;if(!active())return;
    if(phase==='wait'){phase='erase';pos=words[index].length;schedule(75);return;}
    if(phase==='erase'){
     pos--;paint(words[index].slice(0,pos),index===1);
     if(pos===0){index=1-index;phase='type';schedule(100);}else schedule(75);
    }else{
     pos++;paint(words[index].slice(0,pos),index===1);
     if(pos===words[index].length){phase='wait';schedule(3500);}else schedule(100);
    }
   }
   function resume(){if(!timer)schedule(phase==='wait'?3500:phase==='erase'?75:100);}
   function measure(){
    // Both scripts use the existing Japanese face; match its cap height to the English line.
    box.style.setProperty('--play-jp-size',button.matches('.ctaMain')?'1em':'.72em');
    const probe=document.createElement('span');probe.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none';
    box.append(probe);let width=0;
    words.forEach((word,i)=>{probe.textContent=word;probe.className=i?'motion-jp':'';width=Math.max(width,probe.getBoundingClientRect().width);});
    box.style.setProperty('--play-width',Math.ceil(width)+'px');probe.remove();
   }
   paint('PLAY',false);measure();document.fonts.ready.then(measure);
   button.addEventListener('pointerenter',()=>{hover=true;stop(false);});
   button.addEventListener('pointerleave',()=>{hover=false;resume();});
   button.addEventListener('focus',()=>{focused=true;stop(false);});
   button.addEventListener('blur',()=>{focused=false;resume();});
   const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else stop(true);});observer.observe(button);
   players.push({reset:()=>{stop(true);resume();},pause:()=>{if(document.hidden)stop(false);else resume();},measure});
  });
  reduced.addEventListener('change',()=>{preference();players.forEach(p=>p.reset());});
  document.addEventListener('visibilitychange',()=>players.forEach(p=>p.pause()));
  addEventListener('resize',()=>players.forEach(p=>p.measure()));
  addEventListener('pageshow',e=>{if(e.persisted)players.forEach(p=>p.reset());});
 });
})();
