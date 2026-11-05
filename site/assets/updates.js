const RON_UPDATES = [
  {date:'2026-11-05', text:'デッキ構築とドラフトを追加'}
];

(() => {
  const row = document.querySelector('.v6-update');
  if (!row || !RON_UPDATES.length) return;
  const latest = RON_UPDATES[0];
  const date = row.querySelector('time');
  date.dateTime = latest.date;
  date.textContent = latest.date;
  row.querySelector('span').textContent = latest.text;
})();
