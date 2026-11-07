/* Same horizontal particles as site.css; no animation frame loop. */
(()=>{'use strict';const body=document.querySelector('.sub-page');if(!body)return;
if(!body.querySelector('.bgField')){const field=document.createElement('div');field.className='bgField';field.setAttribute('aria-hidden','true');for(let i=0;i<18;i++){const dot=document.createElement('i');dot.className='bgDot bgDot--'+['a','b','c'][i%3];dot.style.cssText='--y:'+((i*37+9)%100)+'%;--x:'+((i*43+11)%100)+'%;animation-delay:-'+((i*17+8)%58)+'s';field.append(dot);}body.prepend(field);}
document.addEventListener('visibilitychange',()=>body.querySelectorAll('.bgDot').forEach(dot=>dot.style.animationPlayState=document.hidden?'paused':''));})();

(() => {
 'use strict';
 const panel=document.querySelector('#feature-panel');
 if(panel){
   const nodes=[...document.querySelectorAll('[data-feature]')];
   function select(node,scroll){
     const feature=RON_FEATURES.find(f=>f.id===node.dataset.feature);
     nodes.forEach(n=>n.setAttribute('aria-pressed',String(n===node)));
     panel.classList.toggle('is-create',feature.create);
     panel.querySelector('.feature-en').textContent=feature.id.toUpperCase();
     panel.querySelector('h3').textContent=feature.name;
     panel.querySelectorAll('.feature-copy p span').forEach((line,i)=>line.textContent=feature.lines[i]);
     const img=panel.querySelector('img');img.src=feature.shot;img.alt=feature.name+'の実機画面';
     if(scroll && matchMedia('(max-width:600px)').matches)panel.scrollIntoView({behavior:document.documentElement.hasAttribute('data-motion-lite')||matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
   }
   nodes.forEach((node,i)=>{node.addEventListener('click',()=>select(node,true));node.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?nodes.length-1:(i+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+nodes.length)%nodes.length;nodes[next].focus();select(nodes[next],false);});});
 }
 const contact=document.querySelector('[data-contact-link]');
 if(contact && typeof RON_SITE!=='undefined' && RON_SITE.contactUrl){
   const url=new URL(RON_SITE.contactUrl,location.href);
   if(['https:','http:','mailto:'].includes(url.protocol)){contact.href=url.href;contact.hidden=false;}
 }
 const timeline=document.querySelector('.news-timeline .news-list');
 if(timeline){
   const years=new Map();
   [...timeline.querySelectorAll('.news-row')].forEach(row=>{
     const year=row.querySelector('time').dateTime.slice(0,4);
     if(!years.has(year)){
       const group=document.createElement('section');group.className='news-year';
       const heading=document.createElement('h2');heading.textContent=year;
       const rows=document.createElement('div');rows.className='news-year-rows';
       group.append(heading,rows);timeline.append(group);years.set(year,rows);
     }
     years.get(year).append(row);
   });
 }
 const library=document.querySelector('#card-panel');
 if(!library)return;
 const tabs=[...document.querySelectorAll('[data-card-tab]')];
 const dialog=document.querySelector('.card-dialog'),zoom=dialog.querySelector('.zoom-content');
 let returnFocus;
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function openCard(c,trigger){
   returnFocus=trigger;
   zoom.innerHTML='<span class="site-card">'+RonCardFace.html(c.id,true)+'</span><div><h2 id="card-dialog-title">'+esc(c.name)+'</h2><p>'+esc(c.description)+'</p><div class="card-mode-toggle" aria-label="効果文のモード"><button type="button" data-mode="vs" aria-pressed="true">対戦</button><button type="button" data-mode="co" aria-pressed="false">協力</button></div></div>';
   zoom.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{zoom.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));zoom.querySelector('.site-card').innerHTML=RonCardFace.html(c.id,button.dataset.mode==='vs');}));
   dialog.showModal();
 }
 dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));
 RonCardFace.ready.then(data=>{
   function tile(c){
     const button=document.createElement('button');button.type='button';button.className='library-card';button.setAttribute('aria-label',c.name+'を拡大する');
     const label=esc(c.name).replace('ニューオーリンズ','ニュー<wbr>オーリンズ');
     button.innerHTML='<span class="site-card">'+RonCardFace.html(c.id,true)+'</span><span>'+label+'</span>';button.addEventListener('click',()=>openCard(c,button));return button;
   }
   function render(kind){
     library.replaceChildren();library.setAttribute('aria-labelledby','tab-'+kind);
     tabs.forEach(tab=>{const active=tab.dataset.cardTab===kind;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
     const cards=data.cards.filter(c=>c.kind===kind);
     if(kind==='city'){
       const grid=document.createElement('div');grid.className='terrain-grid';
       [['coast','海岸','津波・洪水の追加被害に注意。'],['inland','内陸','地震の追加被害に注意。'],['mountain','山間','土砂崩れの追加被害に注意。']].forEach(([id,name,desc])=>{
         const column=document.createElement('section');column.className='terrain-column';column.innerHTML='<h3>'+name+'</h3><p>'+desc+'</p>';
         const list=document.createElement('div');list.className='terrain-cards';cards.filter(c=>c.terrain===id).forEach(c=>list.append(tile(c)));column.append(list);grid.append(column);
       });library.append(grid);
     }else{
       const lead=document.createElement('p');lead.className='card-kind-lead';lead.textContent={disaster:'いつ来るか誰にも分からない。順番も規模も選べない。',jinzai:'脅威は自然だけではない。人がつくる災害もある。',policy:'事前に置いて備えるシールドと、その場で使う即時。限られた予算で、備えを選ぶ。'}[kind];library.append(lead);
       const grid=document.createElement('div');grid.className='card-tiles';cards.forEach(c=>grid.append(tile(c)));library.append(grid);
     }
   }
   tabs.forEach((tab,i)=>{
     tab.addEventListener('click',()=>render(tab.dataset.cardTab));
     tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const n=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].focus();render(tabs[n].dataset.cardTab);});
   });render('city');
 }).catch(error=>{library.textContent='カードを読み込めませんでした。ページを再読み込みしてください。';console.error(error);});
})();
