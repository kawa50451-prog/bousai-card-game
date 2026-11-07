# NOTES（公式サイト bousai-card-game の運用メモ）

## お知らせ（NEWS）の書き方
- お知らせは `site/assets/updates.js` の `RON_UPDATES` の1か所だけに書く。HOME 上部の帯（最新1件）、HOME の NEWS 欄（3件）、`site/news.html`（全件）は、どれもここから読む。
- 新しい順に、先頭へ1行足す：`{date:'YYYY-MM-DD', text:'題名', url:'（任意）'}`。url があれば行がリンクになる。
- **ゲーム（toshibousai）に新しい機能をリリースしたら、ここに1行足して push する。**

## 公開先
- 公式サイト：`https://readyorlab.com/`（Cloudflare Workers の静的公開。Worker 名 `readyorlab`。main への push で `site/` をそのまま公開。HOME は `site/index.html`。workers.dev の住所は無効化済み）
- `site/v6.html` は旧URL用の転送ページ。HOME を直すときは `site/index.html` を編集する
- ゲームの GitHub Pages 版（`kawa50451-prog.github.io/bousai-card-game/game_online.html`）は従来どおり GitHub Pages。独自ドメインは付けない（開発者モードの判定・保存データ・Firebase の許可ドメインが住所に依存するため）
- DNS は Cloudflare（readyorlab.com）
