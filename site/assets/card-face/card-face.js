/* Shared website adapter for the game's percentage / cqw card layout. */
(() => {
  'use strict';
  const base = new URL('./', document.currentScript.src);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data, byId;
  function html(id, versus = false) {
    const c = byId.get(id);
    if (!c) throw new Error('Unknown card: '+id);
    const L = data.layout[c.layout], f = versus ? c.vs : c.co;
    const pct = v => (v*100).toFixed(2)+'%';
    const el = (cls, pos, text) => {
      const p = Array.isArray(pos) ? {at:pos} : pos;
      return `<span class="cface-t ${cls}" style="left:${pct(p.at[0])};top:${pct(p.at[1])}${p.fs?';font-size:'+p.fs+'cqw':''}${p.ls?';letter-spacing:'+p.ls:''}">${esc(text)}</span>`;
    };
    const fs = Math.min(data.nameFs, Math.floor(data.nameMaxWidth / ([...c.name].length*1.04)*20)/20);
    const [x,y,r,b] = L.fxRect;
    return `<span class="cface cface-ready" data-cface="${esc(id)}" role="img" aria-label="${esc(c.name+'・'+c.typeLabel)}" style="--sh:${L.sh[0]};--sh2:${L.sh[1]};--fx:${L.fx}"><img class="cface-art" src="${new URL((c.kind==='city'?'cities/':'cards/')+id+'.webp',base)}" alt="" draggable="false">`
      + el('cface-nm cface-sh',{at:L.name,fs},c.name)+el('cface-ty cface-sh',L.type,c.typeLabel)
      + (L.cost?el('cface-cl',L.costLabel,'コスト')+el('cface-cn cface-num',L.cost,c.cost):'')
      + (L.pow?el('cface-pl cface-sh',L.powLabel,'威力')+el('cface-pn cface-num cface-sh',L.pow,c.power):'')
      + (L.hp?el('cface-hp cface-num cface-sh',L.hp,'HP '+c.hp):'')
      + `<span class="cface-fxbox" style="left:${pct(x)};top:${pct(y)};width:${pct(r-x)};height:${pct(b-y)}"><span class="cface-fx ${L.fxDark?'cface-fx-dark':'cface-sh'}${f.pr?' cface-fx-pr':''}" style="font-size:${f.fs}cqw">${f.lines.map(l=>l?'<span class="cface-l">'+esc(l)+'</span>':'<span class="cface-gap"></span>').join('')}</span></span></span>`;
  }
  function mount(root = document) {
    root.querySelectorAll('[data-card]:not([data-card-mounted])').forEach(host => {
      host.dataset.cardMounted = '1';
      host.innerHTML = html(host.dataset.card, host.dataset.versus === 'true');
    });
  }
  const domReady = document.readyState === 'loading' ? new Promise(resolve => document.addEventListener('DOMContentLoaded',resolve,{once:true})) : Promise.resolve();
  const ready = Promise.all([fetch(new URL('cards.json',base)).then(r => {if(!r.ok)throw new Error('Card data '+r.status);return r.json();}), domReady]).then(([value]) => {
    data=value;byId=new Map(data.cards.map(c=>[c.id,c]));mount();
    new MutationObserver(mutations=>{if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1 && (n.matches('[data-card]:not([data-card-mounted])') || n.querySelector('[data-card]:not([data-card-mounted])')))))mount();}).observe(document.body,{childList:true,subtree:true});
    return data;
  });
  window.RonCardFace = {ready, html, mount};
})();
