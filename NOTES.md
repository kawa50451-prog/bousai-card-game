# NOTES（公式サイト bousai-card-game の運用メモ）

## お知らせ（NEWS）の書き方
- お知らせは `site/assets/updates.js` の `RON_UPDATES` の1か所だけに書く。HOME 上部の帯（最新1件）、HOME の NEWS 欄（3件）、`site/news.html`（全件）は、どれもここから読む。
- 新しい順に、先頭へ1行足す：`{date:'YYYY-MM-DD', text:'題名', url:'（任意）'}`。url があれば行がリンクになる。
- **ゲーム（toshibousai）に新しい機能をリリースしたら、ここに1行足して push する。**
