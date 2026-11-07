const RON_UPDATES = [
  {id:'site-open', date:'2026-11-07', text:'Ready or Not|公式ホームページを開設', body:[
    'Ready or Not の公式ホームページを開設しました。',
    'ゲームの狙い、対戦と協力の2つのモード、カードと都市の一覧を、このサイトでまとめて見られます。ゲームはブラウザでそのまま遊べます。',
    'ご相談やお問い合わせは、CONTACT のメールへお寄せください。'
  ]},
  {id:'deck-build', date:'2026-11-05', text:'デッキ構築と|ドラフトを追加', body:[
    '対戦モードで、自分で組んだデッキを使って戦えるようになりました。',
    {list:['デッキは24枚です。','カードは「攻める」「守る」「自由」の3つの枠に分かれます。攻める枠と守る枠は6〜18枚、自由枠は0〜6枚まで入れられます。','同じカードは3枚までです。']},
    '試合の初めには、山札の上から4枚を開けて初期手札にします。',
    '山札が尽きても試合は続きます。決着がつかないまま終わったときは、都市のHPの合計が多い方の勝ちです。'
  ]}
];

(() => {
  const plain=t=>t.replaceAll('|','');
  const phrases=(el,t)=>{el.replaceChildren(...t.split('|').map(p=>{const s=document.createElement('span');s.style.display='inline-block';s.textContent=p;return s;}));};
  const updates = [...RON_UPDATES].sort((a, b) => b.date.localeCompare(a.date));
  const row = document.querySelector('.v6-update');
  if (row && updates.length) {
    const latest = updates[0];
    const date = row.querySelector('time');
    date.dateTime = latest.date;
    date.textContent = latest.date;
    row.querySelector('span').textContent = plain(latest.text);
    row.href = 'news.html?id='+latest.id;
  }
  const article=updates.find(update=>update.id===new URLSearchParams(location.search).get('id'));
  const timeline=document.querySelector('.news-timeline');
  if(article&&timeline){
    const content=document.createElement('article');content.className='news-article';
    const time=document.createElement('time');time.dateTime=article.date;time.textContent=article.date.replaceAll('-','.');
    const heading=document.createElement('h2');heading.className='jpAccent sub-jp-heading';phrases(heading,article.text);
    content.append(time,heading);
    article.body.forEach(part=>{
      const node=document.createElement(typeof part==='string'?'p':'ul');
      if(typeof part==='string')node.textContent=part;
      else part.list.forEach(text=>{const li=document.createElement('li');li.textContent=text;node.append(li);});
      content.append(node);
    });
    const back=document.createElement('a');back.className='news-back';back.href='news.html';back.textContent='お知らせ一覧へ戻る';content.append(back);
    timeline.replaceChildren(content);timeline.setAttribute('aria-label',plain(article.text));
    document.title=plain(article.text)+' | NEWS | Ready or Not';
    document.querySelector('meta[name="description"]').content=article.body[0];
  }
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  document.querySelectorAll('.news-list').forEach(list => {
    const limit = Number(list.dataset.newsLimit) || updates.length;
    updates.slice(0, limit).forEach(update => {
      const item = document.createElement('a');
      item.className = 'news-row';
      item.href = 'news.html?id='+update.id;
      const body = document.createElement('div');
      const time = document.createElement('time');
      time.dateTime = update.date;
      const day = new Date(update.date + 'T00:00:00Z').getUTCDay();
      time.textContent = update.date.replaceAll('-', '.') + ' [' + weekdays[day] + ']';
      const title = document.createElement('p');
      title.className = 'news-row-title';
      phrases(title,update.text);
      const arrow = document.createElement('span');
      arrow.className = 'news-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '›';
      body.append(time, title);
      item.append(body, arrow);
      list.append(item);
    });
  });
})();
