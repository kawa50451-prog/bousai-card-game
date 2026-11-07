const RON_UPDATES = [
  {date:'2026-11-07', text:'Ready or Not 公式ホームページを開設'},
  {date:'2026-11-05', text:'デッキ構築とドラフトを追加'}
];

(() => {
  const updates = [...RON_UPDATES].sort((a, b) => b.date.localeCompare(a.date));
  const row = document.querySelector('.v6-update');
  if (row && updates.length) {
    const latest = updates[0];
    const date = row.querySelector('time');
    date.dateTime = latest.date;
    date.textContent = latest.date;
    row.querySelector('span').textContent = latest.text;
  }
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  document.querySelectorAll('.news-list').forEach(list => {
    const limit = Number(list.dataset.newsLimit) || updates.length;
    updates.slice(0, limit).forEach(update => {
      let url;
      try {
        if (update.url) {
          const candidate = new URL(update.url, location.href);
          if (['http:', 'https:'].includes(candidate.protocol)) url = candidate;
        }
      } catch (_) { /* An invalid URL leaves an ordinary news row. */ }
      const item = document.createElement(url ? 'a' : 'div');
      item.className = 'news-row';
      if (url) {
        item.href = url.href;
        if (url.origin !== location.origin) {
          item.target = '_blank';
          item.rel = 'noopener noreferrer';
        }
      }
      const body = document.createElement('div');
      const time = document.createElement('time');
      time.dateTime = update.date;
      const day = new Date(update.date + 'T00:00:00Z').getUTCDay();
      time.textContent = update.date.replaceAll('-', '.') + ' [' + weekdays[day] + ']';
      const title = document.createElement('p');
      title.className = 'news-row-title';
      title.textContent = update.text;
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
