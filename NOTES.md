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

カード面の再生成：リポジトリ直下で `node tools/build-site-cards.mjs`（別のゲームソースは第1引数にパス指定）。
ゲーム側のカード定義・面の文・行分け・CSSと、このリポジトリの `images/*/nt` を更新して再実行すると、`site/assets/card-face/` のデータ・画像・CSSが更新される。

## 2026-11-07 公開準備・OGP

- 公開8ページの head にページ別の title・description、拡張子なしの canonical、OGP、Twitter Card、アイコン、manifest、JSON-LD を追加。既存の noindex は維持。`site/privacy.html` は存在しないため対象外。sitemap は指定の8 URLのみ、lastmod は 2026-11-07。
- HOME の JSON-LD は WebSite・Organization・VideoGame、下層は表示上の HOME → 現在ページに対応する BreadcrumbList。`site/assets/site-data.js` にはゲームURLが存在しないため、全公開ページの PLAY リンクで共通の `https://toshibousai-cardgame.web.app/` を採用した。
- OGP は `site/assets/og/og-a.png` と `og-b.png`。全ページはAを参照。Bの切れ目は `site/assets/v6/opening.js` の `FX.angle:15` と同じ、水平から15度。光彩・白フラッシュなし。HTML・CSS・フォントとSIL OFLライセンスは `site/assets/og/src/` に保存。Bodoni Moda は Google Fonts の google/fonts リポジトリから取得。
- 画像の再生成：ルートで指定の `python -m http.server 8765 --bind 127.0.0.1` を起動し、別端末で `python site/assets/og/src/render.py`。原寸・600×315・300×157を並べた `.tmp_check/r11-og.png` も更新される。既存の Playwright・Pillow・Chromium を使用し、インストールやPC設定変更は行っていない。
- Bを採用するときは、ルートで次の1行を実行する。PowerShellでUTF-8を維持し、8ページの参照を一括で差し替える：

  `Get-ChildItem site/*.html,site/modes/*.html -File | ForEach-Object { $p=$_.FullName; $s=[IO.File]::ReadAllText($p); if($s.Contains('https://readyorlab.com/assets/og/og-a.png')) { [IO.File]::WriteAllText($p,$s.Replace('https://readyorlab.com/assets/og/og-a.png','https://readyorlab.com/assets/og/og-b.png'),[Text.UTF8Encoding]::new($false)) } }`

- noindex解除は、試作ページを外部から見えなくしたあとに本人が行う。以下の各ファイルの **6行目** にある `<meta name="robots" content="noindex, nofollow">` を1行削除する：`site/index.html`、`site/about.html`、`site/news.html`、`site/features.html`、`site/cards.html`、`site/contact.html`、`site/modes/versus.html`、`site/modes/co-op.html`。404・OGP制作HTML・試作ページの noindex は維持する。行番号は今回の追加後のもの。
- `robots.txt` の Disallow はクロール制御で、アクセス制限にはならない。`v5-proto`・`preview`・`try-proto`・`_cmp/` と旧転送ページ `v6.html` の外部非公開化は本人の作業。これらをsitemapへ追加しない。
- ルートに `wrangler.toml`・`wrangler.json`・`wrangler.jsonc` はない。設定ファイルの新規作成はしていない。公開時に Cloudflare 側の静的アセット設定 `assets.not_found_handling = "404-page"` を確認する。TOMLなら `[assets]` 内の `not_found_handling = "404-page"`。`site/404.html` を配信対象とし、存在しないURLのHTTPステータスが404になることを公開環境で確認する。Python簡易サーバーではCloudflareのルーティングは検証できない。
- 機械点検の再実行：`python site/assets/og/src/verify.py`。canonical・og:*・description等の有無と重複、descriptionの60〜120字、noindex維持、JSON-LDの `json.loads`、sitemap、manifest、PC幅1440pxとスマートフォン幅390pxのJSエラーを確認する。外部Google Fontsの読み込みは撮影環境のネットワーク制限があるため、既存ページのWebフォント表示は公開環境でも確認する。
- 今回の点検結果：8ページすべて正常。descriptionは順にHOME 89字、ABOUT 88字、NEWS 80字、FEATURES 92字、CARDS 91字、CONTACT 97字、VERSUS 97字、CO-OP 88字。JSON-LDのJSON解析・sitemap XML・manifest JSONも正常。8公開ページと404をPC・スマートフォンの2幅で開きスクロールしてJSエラー0件、HOMEの開幕演出を強制再生した15秒間も0件。OGPは2案とも1200×630、Bodoni Modaの実読み込みを確認し、原寸・600×315・300×157の比較画像で題字を目視確認した。commit・push・公開操作は行っていない。
