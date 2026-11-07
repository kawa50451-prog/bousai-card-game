(() => {
  'use strict';
  const html = document.documentElement;
  const motion = new URLSearchParams(location.search).get('motion');
  if (motion === 'on') html.dataset.motion = 'on';
  if (motion === 'lite') html.setAttribute('data-motion-lite', '');
  const scene = document.querySelector('.try-scene');
  if (!scene) return;
  const result = scene.querySelector('.try-result');
  const forecast = scene.querySelector('.try-forecast');
  const actions = scene.querySelector('.try-actions');
  const choices = scene.querySelector('.try-choices');
  const prompt = scene.querySelector('.try-prompt');
  const image = state => scene.querySelector(`.${state}-image`);
  const node = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  let data;
  const icon = name => {
    const img = node('img', 'try-icon');
    img.src = `assets/try/${name}.webp`;
    img.alt = '';
    return img;
  };
  // 同じ長さの2組を流し、継ぎ目でも速報の文が途切れないようにする。
  const ticker = scene.querySelector('.try-ticker-track');
  for (let copy = 0; copy < 2; copy++) {
    const group = node('span', 'try-ticker-group');
    for (let repeat = 0; repeat < 4; repeat++) {
      ['TSUNAMI WARNING', 'OSAKA BAY', 'EXPECTED BY DAWN', 'MOVE TO HIGHER GROUND'].forEach(word => group.append(node('span', '', word)));
    }
    ticker.append(group);
  }
  // HOME内でも、この区画が見えている間だけ帯を流す。
  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => scene.classList.toggle('try-in-view', entry.isIntersecting));
  });
  sceneObserver.observe(scene);
  const promptText = prompt.textContent;
  prompt.setAttribute('aria-label', promptText);
  prompt.replaceChildren(...[...promptText].map((char, i) => {
    const span = node('span', '', char);
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--char-delay', `${i * .035}s`);
    return span;
  }));
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      prompt.classList.add('try-prompt-visible');
      observer.disconnect();
    }
  });
  observer.observe(prompt);
  const sign = n => n === 0 ? '±0' : n < 0 ? `−${Math.abs(n)}` : `+${n}`;
  function select(choice) {
    const wasForecast = scene.dataset.state === 'forecast';
    const state = choice.verdict.toLowerCase();
    scene.classList.remove('try-arriving-not');
    // CSSの一回限りの演出を選択の都度開始する。描画ループは持たない。
    result.replaceChildren();
    const verdict = node('h2', 'try-verdict', choice.verdict);
    const hp = node('div', 'try-hp');
    hp.setAttribute('aria-label', `都市の体力 ${choice.hpAfter} / ${data.city.hp}`);
    const ticks = node('span', 'try-hp-ticks');
    ticks.setAttribute('aria-hidden', 'true');
    const count = data.city.hp / 5;
    for (let i = 0; i < count; i++) {
      const tick = node('span', i < choice.hpAfter / 5 ? 'try-tick' : 'try-tick try-tick-lost');
      tick.style.setProperty('--tick-delay', `${.35 + (count - 1 - i) * .065}s`);
      ticks.append(tick);
    }
    hp.append(icon('neon_city'), ticks, node('strong','',choice.hpAfter), node('small','',`/${data.city.hp}`));
    const breakdown = node('p','try-breakdown');
    const term = (name, label, value, inactive = false) => {
      const part = node('span', `try-term${inactive ? ' try-term-inactive' : ''}`);
      const picture = node('span', 'try-term-picture');
      picture.append(icon(name), node('span', 'try-term-label', label));
      part.append(picture, node('span', 'try-term-value', value));
      return part;
    };
    choice.mods.forEach((mod, i) => breakdown.append(term(
      i === 0 ? 'neon_disaster' : mod.label === '海岸' ? 'terrain_coastal' : 'neon_policy_shield',
      mod.label, i === 0 ? String(mod.delta) : sign(mod.delta), mod.delta === 0)));
    breakdown.append(term('neon_city', '回復', sign(choice.regen)));
    result.append(verdict, hp, breakdown);
    scene.dataset.state = state;
    if (wasForecast && state === 'not') scene.classList.add('try-arriving-not');
    forecast.hidden = true;
    prompt.hidden = true;
    result.hidden = false;
    actions.hidden = false;
    [...choices.children].forEach((button, i) => button.setAttribute('aria-pressed', String(data.choices[i] === choice)));
    ['forecast','ready','not'].forEach(s => image(s).setAttribute('aria-hidden', String(s !== state)));
  }
  scene.querySelector('.not-image').addEventListener('animationend', () => scene.classList.remove('try-arriving-not'));
  scene.querySelector('.try-reset').addEventListener('click', () => {
    scene.classList.remove('try-arriving-not');
    scene.dataset.state = 'forecast';
    result.hidden = true;
    result.replaceChildren();
    forecast.hidden = false;
    prompt.hidden = false;
    actions.hidden = true;
    [...choices.children].forEach(b => b.setAttribute('aria-pressed','false'));
    ['forecast','ready','not'].forEach(s => image(s).setAttribute('aria-hidden', String(s !== 'forecast')));
    choices.firstElementChild.focus({preventScroll:true});
  });
  async function load(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    return response.json();
  }
  Promise.all([load('assets/try/osaka_tsunami.json'),load('assets/try/osaka_overlays.json')]).then(([scenario, overlays]) => {
    data = scenario;
    forecast.querySelector('h1, h2').textContent = `翌朝、${data.city.name}に${data.disaster.name}`;
    const svg = scene.querySelector('.try-lines');
    svg.setAttribute('viewBox',overlays.viewBox.join(' '));
    ['seawall'].forEach(kind => overlays[kind].forEach((points, i) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',points.map(([x,y],j)=>`${j?'L':'M'}${x},${y}`).join(' '));
      path.setAttribute('pathLength','1');
      path.style.setProperty('--line-delay',`${i*1.2/overlays[kind].length}s`);
      path.style.setProperty('--line-duration',`${1.2/overlays[kind].length}s`);
      svg.querySelector(`.${kind}`).append(path);
    }));
    data.choices.forEach(choice => {
      const button = node('button','try-choice');
      button.type = 'button';
      button.dataset.choice = choice.id ?? 'none';
      button.setAttribute('aria-pressed','false');
      if (choice.id) {
        const face = node('span', 'site-card'); face.dataset.card = choice.id; button.append(face);
      } else {
        const empty = node('img','try-none');
        empty.src = 'assets/cards/back.webp';
        empty.alt = ''; empty.width = 200; empty.height = 300;
        button.append(empty);
      }
      button.append(node('span','try-name',choice.name));
      if (choice.cost !== null) {
        const cost = node('span','try-cost'); cost.append(node('span','','COST'),String(choice.cost)); button.append(cost);
      } else { const space = node('span','try-cost','\u00a0'); space.setAttribute('aria-hidden','true'); button.append(space); }
      button.addEventListener('click',()=>select(choice));
      choices.append(button);
    });
  }).catch(error => {
    const alert = scene.querySelector('.try-error');
    alert.textContent = '体験を読み込めませんでした。ページを再読み込みしてください。';
    alert.hidden = false;
    console.error(error);
  });
})();
