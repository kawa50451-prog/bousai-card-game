/* ══════════════════════════════════════════════════════════════
   Ready or Not 公式サイト ── 共通スクリプト（site.js）
   design/official_site_spec.md §10〜§13 準拠。

   2026-08-12：site/v5-proto.html（LP）から複数ページ共通の初期化処理を
   切り出した。担うのは、起動演出（ローディングタイトル）・慣性スクロール
   （Lenis）・スクロール出現の非対応ブラウザ向けフォールバック（reveal/
   headRule への IntersectionObserver）・カスタムカーソル（照準レティクル）・
   下部固定バーの出現（スクロール量に応じた --barP）。
   地の軌跡（LPだけのスクロール連動グラデーション）・カードマーキー・
   軌道セレクタは各ページの固有スクリプトが担当し続ける。それらが
   window.RonSite.addScrollHandler() を使って、この共通スクリプトが管理する
   単一の rAF バッチ処理へ相乗りできるようにしてある（rAFループを増やさない）。

   ⚠️ 本ファイルは v5-proto.html に元々あったロジックをページ非依存の形に
   移しただけであり、挙動を変えていない。 ══════════════════════════════════ */

window.RonSite = (function(){
  'use strict';

  /* OS側で「アニメーションを表示する」を切っていると全演出が縮退する（§5.3）。
     開発機がその設定だと動きを一度も確認できないため、URLに ?motion=on を
     付けたときだけ縮退を無効化する検証用の逃げ道を用意する。本番へは持ち込まない。 */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
               && !/[?&]motion=on(&|$)/.test(location.search);

  /* ── 起動演出：4幕ローディング（§20.1。§12.4を置き換え） ──
     html.intro-lock は各ページ<head>の同期スクリプトが最初の描画より前に
     付けている（今回は演出を出す）。4幕の視覚進行そのものは site.css の
     animation-delay だけで完結し、JSのクラス切り替えには依存しない
     （§20.1「演出が失敗してもページが操作不能にならないこと」を、JSが
     一切実行できないケースでも成立させるため）。ここが担うのは、
     幕2終了後にインクの<svg>を実際にDOMから外すこと（CSS側にも同じ目的の
     display:none落としを二重で持たせてある。site.css の .loadInk
     参照）と、演出が完了したタイミングでオーバーレイのDOMノードを
     片付けることだけである。prefers-reduced-motion は <style> の @media で
     すでにCSSだけで無効化済みだが、JS側でも二重に見て早期リターンする。 */
  (function initIntro(){
    var overlay = document.getElementById('loadOverlay');
    var html = document.documentElement;
    if (!overlay) return;
    if (reduce || !html.classList.contains('intro-lock')) {
      html.classList.remove('intro-lock');
      return;
    }

    var ACT2_END_MS = 4350;   /* 幕1(0.75s)+幕2(動画2.10s)。2026-08-16に幕0（0→100のゲージ）を
                                 前へ挿したぶん、CSSの遅延と揃えて +500ms している */
    var TOTAL_MS = 8300;      /* ローディング4幕（.loadOverlayが3.95〜4.40秒で消える）に、
                                 00i ファーストビュー（v5-proto.html の .fvIntro。
                                 4.40秒起点で幕1[0.4s]+幕2[1.6s]+幕3[2.0s]＝4.0秒）を
                                 直列でつないだ合計（4.40+4.00=8.40秒）。
                                 ⚠️ intro-lock はこの値+200ms で剥がされる。剥がれた瞬間に
                                 html.intro-lock 配下のアニメーションが打ち切られて既定値
                                 （＝各要素の最終状態）へ飛ぶため、.fvIntro の演出が終わる
                                 8.40秒より前に剥がしてはいけない。
                                 ⚠️ .fvIntro 側の --fvFlipCount/--fvFlipMs（幕2の長さ）を
                                 変更した場合、この値も合わせて手動で計算し直すこと
                                 （自動連動ではない）。
                                 スクロール固定自体は CSS の introUnlockPrimary が4.4秒で
                                 解除するので、ここを伸ばしても操作の開始は待たせない。 */
    var INK_START_MS = 2250;   /* 幕1が明けた瞬間。CSSの .loadInkVid の遅延と同じ値 */
    var done = false;

    /* 検証用（?introfreeze=1）：CSS側は animation-play-state:paused で止まるが、
       JSのタイマーは動き続けるため、放っておくと4.2秒後にオーバーレイごと
       DOMから消えて観察できなくなる。停止指定のときは後片付けもしない。
       本番の挙動には影響しない。 */
    var frozen = document.documentElement.hasAttribute('data-introfreeze');

    /* ── 幕0：0→100 のダイヤル（2026-08-16 追加） ──
       進捗の出どころは CSS の --n ただ1つ。ここはその値を読んで桁を組み替える
       だけの装飾であり、進行そのものは持たない。JSが動かなければ
       site.css の counter() フォールバックがそのまま出る。
       ⚠️ 序盤は1桁が13msごとに変わる（1.30秒で100段）。1回ずつ律儀に
          260msのアニメーションを掛けると要素が数十枚積み上がって破綻する。
          直前のロールから90ms未満なら文字を差し替えるだけにし、間隔が
          空いたときだけ「上から降りてくる」動きを出す。--n の緩急
          （cubic-bezier(.16,.84,.30,1)）で終盤ほど間隔が空くため、
          結果として最後の数字だけがダイヤルらしく落ちてくる。 */
    try {
      var gauge = overlay.querySelector('.loadGauge');
      var numEl = overlay.querySelector('.loadNum');
      var probe = gauge ? parseInt(getComputedStyle(gauge).getPropertyValue('--n'), 10) : NaN;
      if (gauge && numEl && !isNaN(probe)) {
        html.classList.add('has-loaddial');
        var DIAL_EASE = 'cubic-bezier(.22,1,.28,1)';
        var DIAL_MS = 260;
        var slots = [];
        for (var si = 0; si < 3; si++) {
          var d = document.createElement('span');
          d.className = 'loadDigit';
          var it0 = document.createElement('i');
          d.appendChild(it0);
          numEl.appendChild(d);
          /* ⚠️ 生きている数字は node に持つ。firstChild を当てにしないこと。
             退場アニメーション中の古いノードが先頭に残っている瞬間があり、
             そこへ書き込むと「消える側」を更新してしまって桁が化ける
             （実測で 100 のはずが 1059 と出た）。 */
          slots.push({ el: d, node: it0, cur: null, at: 0 });
        }
        var rollDigit = function(slot, ch, now){
          slot.cur = ch;
          if (now - slot.at < 90 || !slot.node.animate) {   /* 速すぎる区間は差し替えのみ */
            slot.node.textContent = ch; slot.at = now; return;
          }
          slot.at = now;
          var old = slot.node;
          var next = document.createElement('i');
          next.textContent = ch;
          slot.el.appendChild(next);
          slot.node = next;
          try {
            next.animate([{ transform:'translateY(-108%)', opacity:0 },
                          { transform:'translateY(0)',     opacity:1 }],
                         { duration:DIAL_MS, easing:DIAL_EASE, fill:'both' });
            var a = old.animate([{ transform:'translateY(0)',    opacity:1 },
                                 { transform:'translateY(108%)', opacity:0 }],
                                { duration:DIAL_MS, easing:DIAL_EASE, fill:'both' });
            var drop = function(){ if (old.parentNode) old.parentNode.removeChild(old); };
            a.onfinish = drop;
            /* ⚠️ onfinish だけに頼らない。タブが隠れる・アニメーションが止まる等で
               発火しないと、送り出した数字が桁の箱に積み上がったまま残る
               （実測中に6枚積み上がるのを確認した）。時間でも必ず片付ける。 */
            setTimeout(drop, DIAL_MS + 120);
          } catch (e) { if (old.parentNode) old.parentNode.removeChild(old); }
        };
        var dialDeadline = performance.now() + 6000;   /* 保険：読めない値で回り続けさせない */
        (function tickDial(now){
          if (frozen) return;
          now = now || performance.now();
          var v = parseInt(getComputedStyle(gauge).getPropertyValue('--n'), 10);
          if (isNaN(v)) v = 0;
          v = Math.max(0, Math.min(100, v));
          var txt = String(v);
          while (txt.length < 3) txt = ' ' + txt;       /* 3桁ぶんの箱に右詰め */
          for (var i = 0; i < 3; i++) {
            var ch = txt.charAt(i) === ' ' ? '' : txt.charAt(i);
            if (slots[i].cur !== ch) rollDigit(slots[i], ch, now);
          }
          if (v >= 100 || now > dialDeadline) return;   /* 100に着いたら止める */
          requestAnimationFrame(tickDial);
        })(performance.now());
      }
    } catch (e) { /* ダイヤルが組めなくても counter() の表示と進行は生きている */ }

    /* 幕2のインク動画を、幕1が明けるのと同時に頭から1回だけ流す。
       ⚠️ 緩急は素材そのものに焼き込んである（site.css の .loadInkVid 参照）。
          playbackRate や currentTime を触ると、シークが毎フレーム走って
          iPhoneで引っかかる。ここでは play() しか呼ばない。
       autoplay属性は付けない。付けると読み込み完了と同時に走り出し、
       幕1のクレジットが出ている間に消化されてしまうため。
       再生が拒否されても（自動再生ポリシー等）、暗転→ロゴ→退場はCSSだけで
       進むのでローディングは最後まで完了する。 */
    try {
      var inkVid = overlay.querySelector('.loadInkVid');
      if (inkVid) {
        inkVid.muted = true;              /* 属性に加えて実体でも立てる */
        setTimeout(function(){
          var r = inkVid.play();
          if (r && r.catch) r.catch(function(){ /* 再生不可でも進行は止めない */ });
        }, INK_START_MS);
      }
    } catch (e) { /* 動画が無くても4幕の進行そのものには影響しない */ }

    function finish(){
      if (done || frozen) return;
      done = true;
      try { overlay.classList.add('is-leaving'); } catch (e) {}
      html.classList.remove('intro-lock');
      setTimeout(function(){ if (overlay.parentNode) overlay.remove(); }, 320);
    }

    try {
      /* §20.1「SVGフィルタは幕2の0.8秒だけに限定し、終わったら要素ごと
         外すこと」。CSS側の display:none 落とし（1.32s）は非対応・JS停止
         時の保険なので、ここでは実体をDOMから物理的に取り除く。 */
      setTimeout(function(){
        if (frozen) return;
        var ink = overlay.querySelector('.loadInk');
        if (ink && ink.parentNode) ink.parentNode.removeChild(ink);
      }, ACT2_END_MS + 40);
    } catch (e) { /* 除去に失敗しても表示・CSS側の失効タイマーには影響しない */ }

    setTimeout(finish, TOTAL_MS + 200);
  })();

  /* ── 慣性スクロール：Lenis（§12.3） ──
     wrapper/content オプションは渡さず既定（window / documentElement）のまま
     使うため、Lenisはtransformで動く仮想スクロールにならず、地の軌跡や
     animation-timeline:view() のリベールはこのあとも従来どおり発火し続ける。
     CDN読み込みに失敗した場合は window.Lenis が存在しないため、何もせず
     素のネイティブスクロールへ自然にフォールバックする。
     lenisInstance は下のハンバーガーメニュー（今回新設）が、メニューを開いて
     いる間だけ .stop()/.start() するために使う（背景スクロールロックの
     二重化。html.menu-open{overflow:hidden} だけでも止まるが、Lenisは
     ネイティブscrollを直接動かす実装のため、念のため両方止める）。 */
  var lenisInstance = null;
  if (!reduce && window.Lenis) {
    try {
      var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1 });
      lenisInstance = lenis;
      (function lenisRaf(time){
        lenis.raf(time);
        requestAnimationFrame(lenisRaf);
      })(performance.now());

      var KEY_SCROLL = { Space:1, PageUp:1, PageDown:1, ArrowUp:1, ArrowDown:1, Home:1, End:1 };
      function resyncLenis(){
        requestAnimationFrame(function(){
          lenis.scrollTo(window.scrollY, { immediate: true });
        });
      }
      window.addEventListener('keydown', function(e){
        if (KEY_SCROLL[e.code]) resyncLenis();
      }, { passive: true });
      document.addEventListener('focusin', function(){
        requestAnimationFrame(resyncLenis);
      }, true);
    } catch (e) { /* Lenis生成に失敗してもネイティブスクロールのまま動作する */ }
  }

  /* ── スクロール出現（§11.3-1）の非対応ブラウザ向けフォールバック ──
     animation-timeline:view() 対応ブラウザは CSS の @supports 分岐だけで
     完結するのでここでは何もしない。非対応（Firefox stable 等）だけ、
     IntersectionObserver を張り、閾値に達した要素へ .is-in を足す。 */
  var supportsScrollTimeline = !!(window.CSS && CSS.supports &&
    CSS.supports('animation-timeline', 'view()'));
  if (!supportsScrollTimeline) {
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal, .headRule'));
    if (reduce || !('IntersectionObserver' in window)) {
      revealEls.forEach(function(el){ el.classList.add('is-in'); });
    } else {
      var revealIO = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: .15, rootMargin: '0px 0px -10% 0px' });
      revealEls.forEach(function(el){ revealIO.observe(el); });
    }
  }

  /* ── カスタムカーソル：照準レティクル（§10.8.3-7） ──
     地の部分では出さない。押せる要素にホバーしたときだけ現れて拡大する。
     PC限定（hover:hover かつ pointer:fine）。タッチ環境では要素そのものを
     作らない。🚫 cursor:none にしない。ネイティブは残したまま重ねる。
     追従は lerp で遅延させる。reduced-motion では lerp を止め、ポインタへ
     即座に位置を合わせる。 */
  var reticleMQ = window.matchMedia('(hover:hover) and (pointer:fine)');
  if (reticleMQ.matches) {
    var reticle = document.createElement('div');
    reticle.className = 'cursorReticle';
    reticle.setAttribute('aria-hidden', 'true');
    document.body.appendChild(reticle);

    var RETICLE_SEL = 'a, button, .orbitNode, .modeShotWrap';
    var rtX = -100, rtY = -100, tgX = -100, tgY = -100;

    function paintReticle(){
      reticle.style.translate = rtX.toFixed(1) + 'px ' + rtY.toFixed(1) + 'px';
    }

    /* 2026-08-16：区画によってカーソルの見た目が変わるという指摘への対処。
       ポインタが一度でも動いたら常時表示にする（.is-live）。初回だけは
       lerp の初期位置（-100,-100）から画面内へ飛ぶ軌跡が見えないよう、
       表示を有効にする前に現在位置へワープさせる。 */
    var reticleLive = false;
    window.addEventListener('pointermove', function(e){
      tgX = e.clientX; tgY = e.clientY;
      if (!reticleLive) { reticleLive = true; rtX = tgX; rtY = tgY; paintReticle(); reticle.classList.add('is-live'); }
      if (reduce) { rtX = tgX; rtY = tgY; paintReticle(); }
    }, { passive:true });
    /* ウィンドウの外へ出たら消す（画面の隅に取り残さない）。戻れば次の
       pointermove で再表示される。 */
    document.addEventListener('pointerleave', function(){ reticle.classList.remove('is-live'); });
    window.addEventListener('blur', function(){ reticle.classList.remove('is-live'); });

    document.addEventListener('pointerover', function(e){
      if (e.target.closest && e.target.closest(RETICLE_SEL)) {
        reticle.classList.add('is-active');
      }
    });
    document.addEventListener('pointerout', function(e){
      if (!(e.target.closest && e.target.closest(RETICLE_SEL))) return;
      var to = e.relatedTarget;
      if (!to || !(to.closest && to.closest(RETICLE_SEL))) {
        reticle.classList.remove('is-active');
      }
    });

    /* 押下で色が変わる（§20.3）。拡大（is-active）とは独立した信号として
       is-pressed を持たせる。ポインタが要素の外で離れた・キャンセルされた・
       タブが非アクティブになった場合も必ず解除する（押しっぱなし状態の
       固定化を防ぐ）。 */
    document.addEventListener('pointerdown', function(e){
      if (e.target.closest && e.target.closest(RETICLE_SEL)) {
        reticle.classList.add('is-pressed');
      }
    }, { passive:true });
    function releasePress(){ reticle.classList.remove('is-pressed'); }
    document.addEventListener('pointerup', releasePress, { passive:true });
    document.addEventListener('pointercancel', releasePress, { passive:true });
    window.addEventListener('blur', releasePress);

    if (!reduce) {
      (function loopReticle(){
        rtX += (tgX - rtX) * .18;
        rtY += (tgY - rtY) * .18;
        paintReticle();
        requestAnimationFrame(loopReticle);
      })();
    }
  }

  /* ── スクロールの単一 rAF バッチ処理 ＋ 下部固定バーの出現（§13.2） ──
     ページ固有スクリプト（LPの地の軌跡など）は addScrollHandler() で
     ここに登録することで、独自の scroll リスナーを増やさずに済む。
     登録時に1回即時実行するため、スクロールが起きる前の初期状態も正しく
     描画される（従来 paintGround();paintBar(); を起動直後に呼んでいたのと同じ）。 */
  var root = document.documentElement;
  var scrollHandlers = [];

  function addScrollHandler(fn){
    if (typeof fn !== 'function') return;
    scrollHandlers.push(fn);
    fn();
  }

  function paintBar(){
    var p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * .5)));
    root.style.setProperty('--barP', p.toFixed(3));
  }

  var ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      for (var i = 0; i < scrollHandlers.length; i++) scrollHandlers[i]();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll, { passive:true });

  addScrollHandler(paintBar);

  /* ── ハンバーガーメニュー（今回新設） ──
     下部固定バーをPLAY専用に縮めた分、ページ移動（HOME/VERSUS/CO-OP/
     FEATURES/CARDS/CONTACT）はここへ集約した。6ページ共通のマークアップ
     （#navToggle・#navMenu・#navScrim・.pageScale）を前提に動く。
     開く動き：html.menu-open を先に付けてページ本体（.pageScale）を縮め
     始め、少し遅れて html.menu-visible を付けて一覧を弾みのある動きで
     出す（「奥へ少し縮んでから一覧が現れる」の指示どおり）。
     閉じる動き：その逆順（一覧が先に退場し、遅れてページが元へ戻る）。
     prefers-reduced-motion では遅延・トランジションともゼロにして
     瞬時に開閉する（§10.0.1 段階2・段階3＝キーボードのみで完結・情報が
     欠けないこと、の両方を満たす）。 */
  (function initNavMenu(){
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('navMenu');
    var scrim = document.getElementById('navScrim');
    if (!toggle || !menu) return;

    var html = document.documentElement;
    var isOpen = false;
    var openTimer = null, closeTimer = null;
    var OPEN_DELAY = reduce ? 0 : 160;    /* ページが縮み始めてから一覧が出るまでの遅れ */
    var CLOSE_STAGGER = reduce ? 0 : 260; /* 一覧の退場トランジション（site.cssで.35s）が
                                              視覚的に収まるのを待ってからページを戻す */

    function focusables(){
      return Array.prototype.slice.call(
        menu.querySelectorAll('a[href], button:not([disabled])')
      );
    }

    function onKeydown(e){
      if (e.key === 'Escape' || e.key === 'Esc'){
        e.preventDefault();
        close();
        toggle.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      var els = focusables();
      if (!els.length) return;
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }

    function open(){
      if (isOpen) return;
      isOpen = true;
      clearTimeout(closeTimer);
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'メニューを閉じる');
      html.classList.add('menu-open');
      if (lenisInstance && lenisInstance.stop) { try { lenisInstance.stop(); } catch (e) {} }
      document.addEventListener('keydown', onKeydown, true);
      /* ⚠️ フォーカス移動は menu-visible と同時（OPEN_DELAY後）に行う。
         .navMenu には .navMenu:focus-within を可視化条件に持たせてあり
         （JS未実行時の縮退用）、ここで即座に .focus() すると縮み演出より
         先にパネルが見えてしまい「奥へ縮んでから一覧が現れる」順序が壊れる。 */
      openTimer = setTimeout(function(){
        html.classList.add('menu-visible');
        var first = focusables()[0];
        if (first) first.focus();
      }, OPEN_DELAY);
    }

    function close(){
      if (!isOpen) return;
      isOpen = false;
      clearTimeout(openTimer);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'メニューを開く');
      document.removeEventListener('keydown', onKeydown, true);
      /* ⚠️ .navMenu:focus-within（JS未実行時の縮退用フォールバック）が
         退場モーションを妨げないよう、menu-visible を外す前にフォーカスを
         トリガー（ハンバーガー）へ戻す。フォーカスが既に外にある場合
         （scrim クリック等）は何もしない。 */
      if (menu.contains(document.activeElement)) { try { toggle.focus(); } catch (e) {} }
      html.classList.remove('menu-visible');
      closeTimer = setTimeout(function(){
        html.classList.remove('menu-open');
        if (lenisInstance && lenisInstance.start) { try { lenisInstance.start(); } catch (e) {} }
      }, CLOSE_STAGGER);
    }

    toggle.addEventListener('click', function(){ isOpen ? close() : open(); });
    if (scrim) scrim.addEventListener('click', close);
    Array.prototype.forEach.call(menu.querySelectorAll('a'), function(a){
      a.addEventListener('click', function(){ close(); });
    });
  })();

  return { reduce: reduce, addScrollHandler: addScrollHandler, lenis: lenisInstance };
})();
