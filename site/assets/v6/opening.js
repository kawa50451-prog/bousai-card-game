/* Adopted opening2 mix. Timings, cuts and easing are kept from the approved prototype. */
(function(){
'use strict';
const html=document.documentElement, overlay=document.getElementById('opening');
const query=new URLSearchParams(location.search), media=matchMedia('(prefers-reduced-motion:reduce)');
const forced=query.has('opening')&&(query.get('opening')===''||query.get('opening')==='1');
const quiet=()=>!forced&&(html.hasAttribute('data-motion-lite')||(media.matches&&html.dataset.motion!=='on'));
let current=null,prepared=null,loadingTimer=0,watchdog=0,previousFocus=null,run=0;
const imageURL=file=>'assets/v6/era/'+file+(innerWidth<=900?'_900':'')+'.webp';
// Keep the portal viewport bounded: scaling the SVG itself allocates enormous
// mask surfaces and invalidates every descendant via an inherited custom property.
function unlock(){
 html.classList.remove('opening-lock','hero-pending','intro-lock');
 document.querySelector('.pageScale').inert=false;
 document.querySelectorAll('.siteLogo,#navToggle,.bottomBar').forEach(el=>el.inert=false);
}
function finish(){
 run++;
 clearTimeout(loadingTimer);clearTimeout(watchdog);
 if(current)current.dispose();current=null;
 if(prepared)prepared.dispose();prepared=null;
 overlay.hidden=true;overlay.classList.remove('ready');overlay.style.opacity='';overlay.remove();
 document.getElementById('loadOverlay')?.remove();
 unlock();
 dispatchEvent(new Event('opening:finished'));
 if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 previousFocus=null;
}
function build(){


// All times are seconds. Only the number readout uses a finite requestAnimationFrame loop.
const CFG={duration:8.15,entry:2.35,release:4.75,quiet:5.85,title:6.05,tagline:7.65,zoom:innerWidth<=600?650:220,decodeBudget:1600};
const EVENTS=[
 {year:1959,name:'伊勢湾台風',file:'nagoya',start:2.350,end:3.050,cut:'nagoya'},
 {year:1964,name:'新潟地震',file:'niigata',start:3.050,end:3.750,cut:'niigata'},
 {year:1995,name:'阪神・淡路大震災',file:'kobe',start:3.750,end:3.970,cut:'kobe'},
 {year:2005,name:'ハリケーン・カトリーナ',file:'new_orleans',start:3.970,end:4.190,cut:'orleans'},
 {year:2011,name:'東日本大震災',file:'sendai',start:4.190,end:4.390,cut:'sendai'},
 {year:2014,name:'8月豪雨災害',file:'hiroshima',start:4.390,end:4.570,cut:'hiroshima'},
 {year:2016,name:'熊本地震',file:'kumamoto',start:4.570,end:4.750,cut:'kumamoto'}
];
const $=id=>document.getElementById(id), stage=$('opening'), animations=[], rows=[], images=[], portals=[];
const ease=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
const clamp=p=>Math.min(1,Math.max(0,p));
const YEAR=new Date().getFullYear();
const countSpan=i=>i<2?.18:.055;
const landing=i=>i===0?EVENTS[i].start:EVENTS[i].start+countSpan(i);
// Image-space polygons: source dimensions 1536 x 1024; grid gutters are 30px.
function cuts(kind){
 const rect=(x1,y1,x2,y2)=>`polygon(${x1/15.36}% ${y1/10.24}%,${x2/15.36}% ${y1/10.24}%,${x2/15.36}% ${y2/10.24}%,${x1/15.36}% ${y2/10.24}%)`;
 if(kind==='nagoya'||kind==='orleans'){
  const xs=kind==='nagoya'?[[0,385],[415,605],[635,1536]]:[[0,465],[495,1065],[1095,1536]], ys=kind==='nagoya'?[[0,80],[110,1024]]:[[0,870],[900,1024]];
  return ys.flatMap(y=>xs.map(x=>rect(x[0],y[0],x[1],y[1])));
 }
 if(kind==='kobe')return ['polygon(10% 0,100% 0,100% 100%,0 100%,0 16%)'];
 if(kind==='kumamoto')return ['polygon(0 0,100% 0,100% 76%,84% 100%,0 100%)'];
 if(kind==='sendai'){
  const m1=430/1536,m2=(430-1024)/1536,d1=15*Math.hypot(1,m1),d2=15*Math.hypot(1,m2),x=(1024-d2-d1)/(m1-m2),y=m1*x+d1;
  const poly=pts=>'polygon('+pts.map(([x,y])=>(x/15.36)+'% '+(y/10.24)+'%').join(',')+')';
  return [poly([[d1/m1,0],[1536,0],[1536,430-d1]]),poly([[0,d1],[x,y],[0,1024-d2]]),poly([[d2/-m2,1024],[1536,430+d2],[1536,1024]])];
 }
 return ['polygon(0 0,100% 0,100% 100%,0 100%)'];
}
function anim(el,points){
 if(points.at(-1)[0]<CFG.duration)points.push([CFG.duration,{...points.at(-1)[1]}]);
 const frames=points.map(([time,values,easing])=>({offset:time/CFG.duration,...values,...(easing?{easing}:{})}));
 const a=el.animate(frames,{duration:CFG.duration*1000,fill:'both'});a.pause();animations.push(a);return a;
}
function visibility(el,a,b,fade=0){anim(el,[[0,{opacity:0,visibility:'hidden'}],[Math.max(0,a-.0001),{opacity:0,visibility:'hidden'}],[a,{opacity:1,visibility:'visible'}],[Math.max(a,b-fade),{opacity:1,visibility:'visible'}],[b,{opacity:0,visibility:'hidden'}],[CFG.duration,{opacity:0,visibility:'hidden'}]]);}
function fragments(container,e,start,end,finish){
 const mobile=matchMedia('(max-width:600px)').matches;
 for(let depth=0;depth<3;depth++){
  const moving=document.createElement('div');moving.className='depth-motion';container.append(moving);
  const layer=document.createElement('div');layer.className='layer';layer.dataset.depth=depth;moving.append(layer);
  const z=[-100,35,170][depth], blur=[0,1.2,8][depth], dir=depth===1?-1:1;
  const motion=(x,y,d,scale)=>`translate3d(${x}px,${y}px,${d}px) scale(${scale})`;
  const y=mobile?[-30,-150,155][depth]:[0,-24,40][depth];
  const x=[0,-80,110][depth];
  layer.style.filter=`blur(${blur}px)`;
  const first={transform:motion(x,y,z,1)};
  const last={transform:motion(x+dir*depth*34,y+depth*19,z+depth*38,1+depth*.015)};
  const points=[[0,first],[start,first],[end,last]];
  if(finish>end){points.push([finish,{transform:motion(0,80,-650,.65)}]);anim(layer,[[0,{filter:`blur(${blur}px)`}],[end,{filter:`blur(${blur}px)`}],[finish,{filter:`blur(${blur+2}px)`}]]);}
  anim(moving,points);
  cuts(e.cut).forEach(polygon=>{
   const im=new Image();im.src=imageURL(e.file);im.className='piece';im.style.clipPath=polygon;im.alt='';im.onerror=()=>{im.style.visibility='hidden';};images.push(im);layer.append(im);
   if(e.cut==='niigata')im.style.maskImage='linear-gradient(90deg,transparent,#000 16%),linear-gradient(0deg,transparent,#000 28%)',im.style.maskComposite='intersect';
  });
 }
}
// Shared motion is deliberately the original zoom curve and 0.45s entry duration.
const FX={ease:'cubic-bezier(.72,0,.88,.5)',angle:15,shift:10,gap:3,imageZoom:1.15,outerBrightness:.65,innerBrightness:1.3};

let portalId=0;
const NS='http://www.w3.org/2000/svg';
function svgNode(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.append(n);return n;}
function makeTransition(host,source,next,index,start,end,intro=null){
 const W=innerWidth,H=innerHeight,f=intro?.f??Math.min(W*(W<=600?.32:.30),W<=600?Infinity:380);
 const cy=intro?H/2:H*(W<=600?.44:.43),old= index<0?'':String(EVENTS[index].year);
 const letters=intro?.letters??[...old].map((text,j)=>({text,x:W/2+(j-1.5)*.63*f,y:cy+.405*f}));
 const root=svgNode('svg',{viewBox:`0 0 ${W} ${H}`,width:W,height:H,'aria-hidden':'true'});root.classList.add('transition');root.dataset.city=next.file;root.dataset.sourceYear=old;
 if(!intro&&end-start>.15){
  const gate=document.createElement('div');gate.className='transition-shell';gate.style.cssText='position:absolute;inset:0;z-index:4;pointer-events:none';host.append(gate);gate.append(root);
  anim(gate,[[0,{clipPath:'inset(15.1%)'}],[end-.15,{clipPath:'inset(15.1%)'}],[end,{clipPath:'inset(0%)'}]]);
 }else host.append(root);
 const defs=svgNode('defs',{},root),id='window-'+portalId++;
 const group=svgNode('g',{id},defs);
 for(const letter of letters){const t=svgNode('text',{x:letter.x,y:letter.y,'text-anchor':'middle','font-family':intro?'Shippori Mincho B1':'Anton','font-weight':intro?800:400,'font-size':f,fill:'white'},group);t.textContent=letter.text;}
 const prep=intro?1.6:Math.max(landing(index),start-.1);
 const visibleStart=intro?1.600001:prep;
 visibility(root,visibleStart,end);
 if(source)anim(source,[[0,{opacity:1}],[visibleStart,{opacity:1}],[visibleStart+.000001,{opacity:0}],[end,{opacity:0}]]);
 if(!intro){
  // Bound the aperture to the viewport; rasterize the transformed text directly
  // so the digit edges stay sharp without allocating an enormous SVG surface.
  const canvas=document.createElement('canvas'),density=devicePixelRatio||1;canvas.width=Math.ceil(W*density);canvas.height=Math.ceil(H*density);canvas.style.cssText='width:100%;height:100%';
  canvas.className='transition';canvas.setAttribute('aria-hidden','true');
  root.replaceWith(canvas);visibility(canvas,visibleStart,end);
  const ctx=canvas.getContext('2d');ctx.scale(density,density);
  function stamp(scale,target=ctx){
   target.save();target.translate(cx,py);target.scale(scale,scale);target.translate(-cx,-py);
   target.fillStyle='white';target.font=`400 ${f}px Anton`;target.textAlign='center';
   for(const letter of letters)target.fillText(letter.text,letter.x,letter.y);
   target.restore();
  }
  const picture=images.find(im=>im.src.endsWith('/'+next.file+(innerWidth<=900?'_900':'')+'.webp'))||new Image();
  if(!picture.src)picture.src=imageURL(next.file);
  images.push(picture);
  const cx=letters[1].x+(old[1]==='0'?-.135:.131)*f;
  const py=cy+(old[1]==='0'?-.229:-.038)*f;
  let coveredAt=Infinity;
  function measureCoverage(){
   // Once the viewport fits inside the entered stroke, the exact clip is full.
   // Test conservative, fully opaque pixels once, instead of rasterizing huge text.
   const mask=document.createElement('canvas');mask.width=W;mask.height=H;
   const maskContext=mask.getContext('2d',{willReadFrequently:true});stamp(1,maskContext);
   const data=maskContext.getImageData(0,0,W,H).data;
   for(const scale of [8,16,32,64,128,256,512,1024]){
    const left=Math.max(0,Math.floor(cx-cx/scale)-1),right=Math.min(W,Math.ceil(cx+(W-cx)/scale)+1);
    const top=Math.max(0,Math.floor(py-py/scale)-1),bottom=Math.min(H,Math.ceil(py+(H-py)/scale)+1);
    let covered=true;
    for(let y=top;covered&&y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*W+x)*4+3]!==255){covered=false;break;}
    if(covered){coveredAt=scale;break;}
   }
  }
  if(document.fonts.status==='loaded')measureCoverage();else document.fonts.ready.then(measureCoverage);
  const view=document.createElement('div');view.className='current-view';
  view.style.cssText=`position:absolute;inset:0;transform-origin:${cx}px ${py}px;contain:paint`;
  anim(view,[[0,{willChange:'auto'}],[prep-.0001,{willChange:'auto'}],[prep,{willChange:'transform'}],[end-.0001,{willChange:'transform'}],[end,{willChange:'auto'}]]);
  const oldInk=document.createElement('div');oldInk.style.cssText='position:absolute;inset:0';
  anim(oldInk,[[0,{willChange:'auto'}],[prep-.0001,{willChange:'auto'}],[prep,{willChange:'transform'}],[end-.0001,{willChange:'transform'}],[end,{willChange:'auto'}]]);
  host.prepend(view);view.append(oldInk);oldInk.append(host.querySelector('.fragments'),host.querySelector('.shade'));
  anim(view,[[0,{transform:'scale(1)'}],[start,{transform:'scale(1)'},FX.ease],[end-.00001,{transform:`scale(${CFG.zoom})`}]]);
  anim(oldInk,[[0,{filter:'brightness(1)'}],[prep,{filter:'brightness(1)'}],[start,{filter:`brightness(${FX.outerBrightness})`}],[end,{filter:`brightness(${FX.outerBrightness})`}]]);
  // Match the original cubic-bezier(.72,0,.88,.5), including very short entries.
  function zoomEase(x){
   let lo=0,hi=1,u=x;
   for(let i=0;i<16;i++){u=(lo+hi)/2;const v=3*(1-u)*(1-u)*u*.72+3*(1-u)*u*u*.88+u*u*u;if(v<x)lo=u;else hi=u;}
   return 1.5*(1-u)*u*u+u*u*u;
  }
  let last=-1;
  portals.push(t=>{
   if(t<visibleStart||t>=end){last=-1;return;}
   if(t===last)return;last=t;
   const p=clamp((t-start)/(end-start)),scale=1+(CFG.zoom-1)*zoomEase(p);
   ctx.clearRect(0,0,W,H);
   const white=1-clamp((t-prep)/(start-prep));
   // The next city stays in screen space; only its digit-shaped aperture expands.
   if(picture.complete&&picture.naturalWidth){
    const ratio=Math.max(W/picture.naturalWidth,H/picture.naturalHeight);
    const w=picture.naturalWidth*ratio,h=picture.naturalHeight*ratio;
    if(scale<coveredAt){stamp(scale);ctx.globalCompositeOperation='source-in';}
    ctx.drawImage(picture,(W-w)/2,(H-h)/2,w,h);
    ctx.globalCompositeOperation='source-over';
   }
   if(white>0){ctx.globalAlpha=white;stamp(scale);ctx.globalAlpha=1;}
  });
  anim(canvas,[[0,{filter:`brightness(${FX.innerBrightness})`}],[start,{filter:`brightness(${FX.innerBrightness})`}],[end,{filter:'brightness(1)'}]]);
 }else{
  const tangent=Math.tan(FX.angle*Math.PI/180),normal=Math.hypot(1,tangent);
  const reach=(H/2+W/2*tangent+40)/normal;
  const image=svgNode('image',{href:imageURL(next.file),width:W,height:H,preserveAspectRatio:'xMidYMid slice'},root);
  image.style.transformOrigin='50% 50%';
  anim(image,[[0,{transform:'scale(1)'}],[start,{transform:'scale(1)'},FX.ease],[end,{transform:`scale(${FX.imageZoom})`}]]);
  for(const side of [-1,1]){
   const clipId=id+'-'+side,clip=svgNode('clipPath',{id:clipId,clipPathUnits:'userSpaceOnUse'},defs);
   const y0=cy+W/2*tangent,y1=cy-W/2*tangent;
   const polygon=side<0?`${-W},${-H*2} ${W*2},${-H*2} ${W*2},${cy-W*1.5*tangent} ${-W},${cy+W*1.5*tangent}`:`${-W},${cy+W*1.5*tangent} ${W*2},${cy-W*1.5*tangent} ${W*2},${H*3} ${-W},${H*3}`;
   svgNode('polygon',{points:polygon},clip);
   const panel=svgNode('g',{'clip-path':`url(#${clipId})`},root);
   svgNode('rect',{x:-W,y:-H,width:W*3,height:H*3,fill:'#00244f'},panel);
   svgNode('use',{href:'#'+id},panel);
   const move=d=>`translate(${side*d*tangent/normal}px,${side*d/normal}px)`;
   anim(panel,[[0,{transform:move(0)}],[prep,{transform:move(0)}],[start,{transform:`translate(${side*FX.shift}px,${side*(FX.gap/2+FX.shift*tangent)}px)`},FX.ease],[end-.00001,{transform:move(reach)}]]);
  }
 }
 return root;
}
for(let i=0;i<EVENTS.length;i++){
 const e=EVENTS[i],next=EVENTS[i+1];
 const scene=document.createElement('section');scene.className='scene';
 scene.innerHTML='<div class="camera"><div class="fragments"></div><div class="shade"></div><div class="year"><span class="digit"></span><span class="digit"></span><span class="digit"></span><span class="digit"></span></div><div class="disaster"></div></div>';
 $('opening-scenes').append(scene);const camera=scene.querySelector('.camera'), year=scene.querySelector('.year');
 scene.querySelector('.disaster').textContent=e.name;
 const row={digits:[...year.querySelectorAll('.digit')],name:scene.querySelector('.disaster'),event:e};rows.push(row);
 // The readout stays in screen space; only image layers move through depth.
 fragments(scene.querySelector('.fragments'),e,e.start,e.end,i===6?4.95:e.end);
 if(next)makeTransition(camera,year,next,i, next.start,landing(i+1));
 visibility(scene,landing(i),next?landing(i+1):4.95,i===6?.2:0);
}
// Keep the original eight font glyphs and spread.
for(const c of '防災カードゲーム'){
 const span=document.createElement('span');span.textContent=c;$('opening-introType').append(span);
}
const chars=[...$('opening-introType').children];
chars.forEach((el,i)=>anim(el,[[0,{transform:'translateX(0px)'}],[.5,{transform:'translateX(0px)'},'cubic-bezier(.16,1,.3,1)'],[1.6,{transform:`translateX(${(i-3.5)*.9}em)`}]]));
anim($('opening-intro'),[[0,{transform:'scale(3.15)',opacity:1},'cubic-bezier(.08,.78,.12,1)'],[.5,{transform:'scale(1)',opacity:1}],[1.6,{transform:'scale(1)',opacity:1}],[1.60001,{opacity:0}]]);
function introMetrics(){
 const f=parseFloat(getComputedStyle($('opening-introType')).fontSize);
 const letters=chars.map((el,i)=>({text:el.textContent,x:innerWidth/2+(i-3.5)*1.9*f,y:innerHeight/2+.38*f}));
 makeTransition(stage,null,EVENTS[0],-1,1.9,CFG.entry,{f,letters});
}
const timeline=$('opening-timeline');EVENTS.forEach((e,i)=>{const point=document.createElement('i');point.style.left=(i/6*100)+'%';timeline.append(point);anim(point,[[0,{opacity:0}],[e.start-.0001,{opacity:0}],[e.start,{opacity:1}],[4.75,{opacity:1}],[4.95,{opacity:0}]]);});
anim(timeline,[[0,{opacity:0,transform:'scaleX(.06)'}],[2.3499,{opacity:0,transform:'scaleX(.06)'}],[2.35,{opacity:.7,transform:'scaleX(.06)'}],[3.05,{opacity:1,transform:'scaleX(1)'}],[6.05,{opacity:1,transform:'translateY(0) scaleX(1)'},'cubic-bezier(.2,.7,.2,1)'],[6.65,{opacity:1,transform:`translateY(${matchMedia('(max-width:600px)').matches?'-19vh':'-15vh'}) scaleX(.67)`}]]);
anim($('opening-current'),[[0,{left:'0%',opacity:0}],[2.35,{left:'0%',opacity:1}],...EVENTS.slice(1).map((e,i)=>[e.start,{left:((i+1)/6*100)+'%',opacity:1}]),[4.93,{left:'100%',opacity:1}],[4.95,{left:'100%',opacity:0}]]);
anim($('opening-title'),[[0,{opacity:0,transform:'scale(1.14)'}],[6.05,{opacity:0,transform:'scale(1.14)'},'cubic-bezier(.12,.7,.15,1)'],[6.17,{opacity:1,transform:'scale(1.045)'},'cubic-bezier(.12,.7,.15,1)'],[6.65,{opacity:1,transform:'scale(1)'}]]);
anim($('opening-tagline'),[[0,{opacity:0,transform:'translateY(8px)'}],[7.65,{opacity:0,transform:'translateY(8px)'},'cubic-bezier(.2,.7,.2,1)'],[8.0,{opacity:1,transform:'translateY(0)'}]]);
const finalYear=document.createElement('div');finalYear.id='opening-finalYear';finalYear.className='year';finalYear.setAttribute('aria-hidden','true');finalYear.innerHTML='<span class="digit"></span>'.repeat(4);stage.insertBefore(finalYear,timeline);visibility(finalYear,4.75,5.85,.02);
function setDigits(elements,n){String(n).padStart(4,'0').split('').forEach((c,i)=>{if(elements[i].textContent!==c)elements[i].textContent=c;});}
function numbers(t){
 // Keep one shared count visible while the old scene holds until the landing.
 let i=0;while(i+1<EVENTS.length&&t>=EVENTS[i+1].start)i++;
 const e=EVENTS[i],prev=i?EVENTS[i-1].year:e.year;
 const arrived=t>=landing(i),p=clamp((t-e.start)/countSpan(i));
 // Rounding must not show the destination year before its synchronized landing.
 const value=arrived?e.year:Math.min(e.year-1,Math.round(prev+(e.year-prev)*ease(p)));
 rows.forEach(({digits,name},j)=>{
  setDigits(digits,value);
  name.style.opacity=t>=landing(j)&&t<(EVENTS[j+1]?.start??4.75)?'1':'0';
 });
 setDigits([...finalYear.children],Math.round(2016+(YEAR-2016)*ease(clamp((t-4.75)/.18))));
}

let raf=0,timer=0,endTimer=0,fadeTimer=0,started=0,finished=false,fade=null;
introMetrics();
function tick(){const t=(performance.now()-started)/1000;numbers(t);portals.forEach(draw=>draw(t));if(t<5.85&&!finished)raf=requestAnimationFrame(tick);else raf=0;}
function seek(t){animations.forEach(a=>{a.pause();a.currentTime=clamp(t/CFG.duration)*CFG.duration*1000;});numbers(t);portals.forEach(draw=>draw(t));stage.dataset.time=t;}
function dispose(){finished=true;clearTimeout(timer);clearTimeout(endTimer);clearTimeout(fadeTimer);cancelAnimationFrame(raf);raf=0;animations.forEach(a=>a.cancel());fade?.cancel();}
function play(){
 seek(0);started=performance.now();const origin=document.timeline.currentTime;
 animations.forEach(a=>{a.play();a.startTime=origin;});
 timer=setTimeout(()=>{if(!finished)tick();},2350);
 // Clear the opening text on opaque ground before revealing the hero.
 fadeTimer=setTimeout(()=>{
  for(const id of ['opening-title','opening-tagline'])animations.push($(id).animate([{opacity:1},{opacity:0}],{duration:350,fill:'forwards'}));
  fade=stage.animate([{opacity:1},{opacity:0}],{delay:350,duration:250,fill:'forwards'});
 },8600);
 endTimer=setTimeout(finish,9200);
}
return {play,seek,dispose,get pendingNumberFrame(){return raf;},animations,events:EVENTS,year:YEAR};
}
const template=overlay.innerHTML;
async function start(){
 const ticket=++run;
 clearTimeout(loadingTimer);clearTimeout(watchdog);if(current)current.dispose();
 if(quiet()){finish();return;}
 try{localStorage.setItem('ronOpeningLast',String(Date.now()));}catch(e){}
 previousFocus=document.activeElement;
 scrollTo({top:0,behavior:'instant'});
 html.classList.add('opening-lock');html.classList.remove('hero-pending');
 document.querySelector('.pageScale').inert=true;
 document.querySelectorAll('.siteLogo,#navToggle,.bottomBar').forEach(el=>el.inert=true);
 if(!prepared)overlay.innerHTML=template;
 overlay.hidden=false;overlay.style.opacity='';document.body.append(overlay);
 watchdog=setTimeout(finish,12000);
 try{
  if(window.openingDecoded)await window.openingDecoded;
  if(ticket!==run)return;
  current=prepared||build();prepared=null;overlay.classList.add('ready');
  document.getElementById('opening-skip').addEventListener('click',finish);
  overlay.setAttribute('tabindex','-1');overlay.focus({preventScroll:true});
  if(query.has('t')&&Number.isFinite(Number(query.get('t'))))current.seek(Math.max(0,Math.min(8.15,Number(query.get('t')))));
  else current.play();
 }catch(error){finish();console.error(error);}
}
window.opening={start,finish,get ready(){return !!current;},get pendingNumberFrame(){return current?.pendingNumberFrame||0;},get animations(){return current?.animations||[];},seek(t){current?.seek(t);}};
document.addEventListener('keydown',e=>{
 if(overlay.hidden)return;
 if(e.key==='Escape'){e.preventDefault();finish();}
 else if([' ','PageUp','PageDown','ArrowUp','ArrowDown','Home','End'].includes(e.key))e.preventDefault();
});
function blockScroll(e){if(html.classList.contains('opening-lock')){e.preventDefault();e.stopPropagation();}}
document.addEventListener('wheel',blockScroll,{passive:false,capture:true});
document.addEventListener('touchmove',blockScroll,{passive:false,capture:true});
media.addEventListener('change',()=>{if(quiet())finish();});
addEventListener('pagehide',finish);
if(html.classList.contains('hero-pending')&&!quiet()){
 // Construct paused scenes during the existing loading interval, rather than
 // forcing their layout on the frame where playback begins.
 const prepareRun=run;
 (window.requestIdleCallback||setTimeout)(()=>{
  if(run!==prepareRun||current||quiet()||!html.classList.contains('hero-pending'))return;
  try{overlay.hidden=false;prepared=build();}catch(error){finish();console.error(error);}
 });
 const load=document.getElementById('loadOverlay');
 const fade=load?.getAnimations().find(a=>a.animationName==='loadOverlayOut');
 // Use the loading animation's own clock, including its 4.45s delay.
 if(fade)loadingTimer=setTimeout(start,Math.max(0,fade.effect.getTiming().delay+100-(fade.currentTime||0)));
 else loadingTimer=setTimeout(start,0);
}else finish();
})();
