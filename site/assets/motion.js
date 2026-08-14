/* ══════════════════════════════════════════════════════════════
   Ready or Not 公式サイト ── 共通モーション基盤 v4 (motion.js)
   design/official_site_spec.md §6.7 / design/site_motion_research.md 準拠。
   外部ライブラリ・CDN不使用。index.html だけがこのファイルを読む。

   実装の絶対原則：
   1. JSがやってよいのは「クラスを付ける／属性を変える／CSSカスタム
      プロパティに数値を入れる」の3つだけ。transformを毎フレーム書かない
   2. requestAnimationFrame のスクロールループは作らない
      （このファイルに rAF は一切登場しない。動きはすべてCSS側）
   3. イージングは --e の1本に統一する（CSS側の責務）
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* =================================================================
     L1: 起動演出（T1）。カードが降る。
     枚数・大きさ・角度・落下順を毎回変える。乱数はJS、動きはCSS
     （keyframes ron-fall）。大きさは「大1枚・中最大3枚・残り小」の
     帯に配分してからシャッフルし、毎回ばらけるが偏らないようにする。
     localStorage で24時間に1回。8秒の保険タイマーで必ず解除する。
     ================================================================= */
  var CARD_POOL = [
    'agreement', 'bousai_cho', 'compound', 'dam', 'drill', 'earthquake',
    'evacuation', 'flood', 'hazard_map', 'landslide', 'pollution',
    'quake_wall', 'rolling_stock', 'rumor', 'terror', 'tsunami', 'typhoon', 'wildfire'
  ];
  var INTRO_KEY = 'ron_intro_ts';
  var INTRO_TTL = 24 * 60 * 60 * 1000;

  function finishIntro() {
    body.classList.add('ron-ready');
    try { doc.dispatchEvent(new CustomEvent('ron:intro-done')); }
    catch (e) { var ev = doc.createEvent('Event'); ev.initEvent('ron:intro-done', true, true); doc.dispatchEvent(ev); }
  }

  function buildSizeBands(total) {
    var lg = 1;
    var md = Math.min(3, Math.max(1, Math.round(total * 0.22)));
    var sm = total - lg - md;
    var bands = [];
    for (var i = 0; i < lg; i++) bands.push('lg');
    for (i = 0; i < md; i++) bands.push('md');
    for (i = 0; i < sm; i++) bands.push('sm');
    return shuffle(bands);
  }

  function buildXBins(total) {
    var bins = [];
    var span = 88 / total; /* 6%〜94% の範囲に均等配分してから個々にジッターを掛ける */
    for (var i = 0; i < total; i++) {
      var center = 6 + span * (i + 0.5);
      bins.push(center + rand(-Math.floor(span * 0.3), Math.floor(span * 0.3)));
    }
    return shuffle(bins);
  }

  function runIntro() {
    if (reduceMotion) { finishIntro(); return; }
    var last = 0;
    try { last = parseInt(localStorage.getItem(INTRO_KEY) || '0', 10) || 0; } catch (e) { last = 0; }
    if (Date.now() - last < INTRO_TTL) { finishIntro(); return; }
    try { localStorage.setItem(INTRO_KEY, String(Date.now())); } catch (e) { /* private mode等は無視して毎回表示 */ }

    /* 枚数を増やし、落下の時間差を詰める。まばらだと画面がほとんど黒いまま
       時間だけが過ぎ、演出ではなく待ち時間になる。 */
    var total = rand(16, 22);
    var sizes = buildSizeBands(total);
    var xbins = buildXBins(total);
    var order = shuffle(Array.from({ length: total }, function (_, i) { return i; }));

    var ov = doc.createElement('div');
    ov.className = 'ron-l1';
    var maxEndMs = 0;
    for (var i = 0; i < total; i++) {
      var fc = doc.createElement('div');
      fc.className = 'fc size-' + sizes[i];
      var w = sizes[i] === 'lg' ? rand(118, 146) : sizes[i] === 'md' ? rand(76, 96) : rand(42, 58);
      var dur = 1.0 + Math.random() * 0.5;
      var delay = order[i] * 0.045 + Math.random() * 0.05;
      fc.style.setProperty('--w', w + 'px');
      fc.style.setProperty('--x', xbins[i].toFixed(2) + '%');
      fc.style.setProperty('--rot', rand(-24, 24) + 'deg');
      fc.style.setProperty('--dur', dur.toFixed(2) + 's');
      fc.style.setProperty('--delay', delay.toFixed(2) + 's');
      var img = doc.createElement('img');
      img.src = 'assets/cards/' + CARD_POOL[rand(0, CARD_POOL.length - 1)] + '.webp';
      img.alt = '';
      fc.appendChild(img);
      ov.appendChild(fc);
      maxEndMs = Math.max(maxEndMs, (delay + dur) * 1000);
    }
    var mark = doc.createElement('div');
    mark.className = 'l1mark';
    mark.innerHTML = 'READY<span>OR NOT</span>';
    ov.appendChild(mark);
    body.appendChild(ov);
    root.classList.add('ron-l1-lock');

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      ov.classList.add('out');
      setTimeout(function () {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        root.classList.remove('ron-l1-lock');
        finishIntro();
      }, 420);
    }
    setTimeout(finish, Math.min(maxEndMs + 260, 7400));
    setTimeout(finish, 8000); /* 保険タイマー：何があっても8秒で必ず解除する */
  }

  /* =================================================================
     M1: 見出し・リード文の行単位カスケード（★最重要）。
     [data-lines] の中身を文字ごとに一時span化 → 各spanのrect.topで
     行をグルーピング → Range#surroundContents で
     <span class="ln"><span class="ln-i">…</span></span> に組み替える。
     文字単位で分けるのは「行の折返し位置を検出するため」だけであり、
     アニメーション自体は行（.ln-i）単位でまとめて動く
     （同じ行の文字は同時に立ち上がり、行が変わるときだけ遅れる＝T3）。

     ⚠️ リサイズ方針：初回計算のみで、リサイズ時の再計算はしない。
     理由：本サイトはビジコン会場PC・実機での閲覧が主用途であり、
     セッション中の頻繁な幅変更は想定しない。またリサイズのたびに
     再計算すると、すでに見せた行がテキストごと組み直され、閲覧中の
     文章が一瞬崩れる／再度隠れるという破綻の方が実害が大きいと判断した。
     再計算しなくても実テキストは通常のブロック要素として存在するため、
     文字が失われることはなく、行の区切り位置の見た目がずれるだけに留まる
     （<b>等の入れ子タグが行境界をまたいだ場合は下のtry/catchで
     プレーンテキストに復元してフォールバックする）。
     ================================================================= */
  function buildLines(el) {
    if (el.__ronLinesBuilt) return;
    el.__ronLinesBuilt = true;

    (function wrapChars(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      for (var i = 0; i < kids.length; i++) {
        var n = kids[i];
        if (n.nodeType === 3) {
          var text = n.textContent;
          if (!text) continue;
          var frag = doc.createDocumentFragment();
          var chs = Array.from(text);
          for (var c = 0; c < chs.length; c++) {
            var ch = chs[c];
            if (/\s/.test(ch)) { frag.appendChild(doc.createTextNode(ch)); continue; }
            var s = doc.createElement('span');
            s.className = 'mc';
            s.textContent = ch;
            frag.appendChild(s);
          }
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          wrapChars(n);
        }
      }
    })(el);

    var chars = Array.prototype.slice.call(el.querySelectorAll('.mc'));
    if (!chars.length) return;
    var elTop = el.getBoundingClientRect().top;
    var lineOf = [];
    var lastTop = null, line = -1;
    for (var i = 0; i < chars.length; i++) {
      var top = Math.round(chars[i].getBoundingClientRect().top - elTop);
      if (lastTop === null || Math.abs(top - lastTop) > 2) { line++; lastTop = top; }
      lineOf.push(line);
    }
    var lineCount = line + 1;

    try {
      var idx = 0;
      for (var L = 0; L < lineCount; L++) {
        var start = idx;
        while (idx < chars.length && lineOf[idx] === L) idx++;
        var end = idx - 1;
        var range = doc.createRange();
        range.setStartBefore(chars[start]);
        range.setEndAfter(chars[end]);
        var lnI = doc.createElement('span');
        lnI.className = 'ln-i';
        range.surroundContents(lnI);
        var ln = doc.createElement('span');
        ln.className = 'ln';
        ln.style.setProperty('--l', String(L));
        lnI.parentNode.insertBefore(ln, lnI);
        ln.appendChild(lnI);
      }
      el.dataset.ronLineCount = String(lineCount);
    } catch (e) {
      /* <b>等の入れ子タグが行境界をまたいだ（surroundContentsは要素の
         部分選択を許さない）。プレーンテキストに戻し、単純フェードへ
         フォールバックする。 */
      el.textContent = el.textContent;
      delete el.dataset.ronLineCount;
    }
  }

  function buildAllLines() {
    if (reduceMotion) return;
    var targets = doc.querySelectorAll('[data-lines]');
    for (var i = 0; i < targets.length; i++) buildLines(targets[i]);
  }

  function revealLines(el) {
    var lc = parseInt(el.dataset.ronLineCount || '0', 10);
    if (!lc) return;
    var ms = 700 + lc * 60 + 100;
    setTimeout(function () {
      var lns = el.querySelectorAll('.ln');
      for (var i = 0; i < lns.length; i++) lns[i].style.overflow = 'visible';
    }, ms);
  }

  /* =================================================================
     M2: ヒーローの READY OR NOT だけを文字単位に分解する。
     既存の子要素（.l2 等）は保持したまま再帰的に分解する。
     縮退時（prefers-reduced-motion）は分解しない。
     ================================================================= */
  function splitKinetic() {
    if (reduceMotion) return;
    var counter = { n: 0 };
    function walk(el) {
      var nodes = Array.prototype.slice.call(el.childNodes);
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.nodeType === 3) {
          var text = node.textContent;
          if (!text) continue;
          var frag = doc.createDocumentFragment();
          var tokens = text.split(/(\s+)/);
          for (var t = 0; t < tokens.length; t++) {
            var tok = tokens[t];
            if (!tok) continue;
            if (/^\s+$/.test(tok)) { frag.appendChild(doc.createTextNode(tok)); continue; }
            var word = doc.createElement('span');
            word.className = 'wd';
            var chars = Array.from(tok);
            for (var j = 0; j < chars.length; j++) {
              var span = doc.createElement('span');
              span.className = 'ch';
              span.style.setProperty('--i', String(counter.n++));
              span.textContent = chars[j];
              word.appendChild(span);
            }
            frag.appendChild(word);
          }
          el.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          walk(node);
        }
      }
    }
    var targets = doc.querySelectorAll('[data-kinetic]');
    for (var k = 0; k < targets.length; k++) walk(targets[k]);
  }

  /* =================================================================
     M3: 奥行きカルーセル（★最重要）。カードと都市の見せ方をこれに統一する。
     見た目はすべて motion.css の [data-position="N"] が担い、
     ここでは data-position の数字を回すだけ。ページ側（index.html）は
     RON_COLORS 等のデータから .cItem を並べたコンテナを作り、
     window.RonMotion.mountCarousel(el, opts) を呼んで有効化する。
     ================================================================= */
  function mountCarousel(el, opts) {
    opts = opts || {};
    var items = Array.prototype.slice.call(el.querySelectorAll(':scope > .cItem'));
    var n = items.length;
    if (!n) return { destroy: function () {}, jumpTo: function () {} };
    var maxVisible = 5;
    var current = 0;

    function apply() {
      for (var i = 0; i < n; i++) {
        var rel = (i - current + n) % n;
        items[i].setAttribute('data-position', rel < maxVisible ? String(rel) : 'hidden');
      }
      if (typeof opts.onChange === 'function') opts.onChange(current, items[current]);
    }
    apply();

    var timer = null;
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    function startAuto() {
      if (reduceMotion || n < 2) return;
      stopAuto();
      timer = setInterval(function () {
        if (!doc.body.contains(el)) { stopAuto(); return; }
        current = (current + 1) % n;
        apply();
      }, opts.interval || 2800);
    }

    el.addEventListener('click', function (e) {
      var it = e.target.closest ? e.target.closest('.cItem') : null;
      if (!it) return;
      var idx = items.indexOf(it);
      if (idx < 0) return;
      current = idx;
      apply();
      startAuto(); /* クリック直後にすぐ自動送りが割り込まないよう仕切り直す */
    });
    if (opts.pauseOnHover !== false && window.matchMedia('(hover:hover)').matches) {
      el.addEventListener('pointerenter', stopAuto);
      el.addEventListener('pointerleave', startAuto);
    }
    startAuto();

    return {
      destroy: function () { stopAuto(); },
      jumpTo: function (idx) { current = ((idx % n) + n) % n; apply(); startAuto(); }
    };
  }

  /* =================================================================
     M5: 実機画面のコマ送り。[data-flip] の中の .flipImg を
     is-current の付け替えだけで一定間隔ごとにパラパラ動かす
     （動画・GIFは使わない）。
     ================================================================= */
  function initFlipbooks() {
    var els = doc.querySelectorAll('[data-flip]');
    for (var e = 0; e < els.length; e++) {
      (function (el) {
        var imgs = Array.prototype.slice.call(el.querySelectorAll('.flipImg'));
        if (!imgs.length) return;
        imgs[0].classList.add('is-current');
        if (reduceMotion) return;
        var idx = 0;
        setInterval(function () {
          if (!doc.body.contains(el)) return;
          imgs[idx].classList.remove('is-current');
          idx = (idx + 1) % imgs.length;
          imgs[idx].classList.add('is-current');
        }, 360);
      })(els[e]);
    }
  }

  /* =================================================================
     M6: ヒーローの窓開き。intro完了イベントで一度だけ .open を付ける。
     以降スクロールに連動させない（rAFを使わない）。
     ================================================================= */
  function initWindows() {
    var els = doc.querySelectorAll('[data-window]');
    if (!els.length) return;
    doc.addEventListener('ron:intro-done', function () {
      for (var i = 0; i < els.length; i++) els[i].classList.add('open');
    }, { once: true });
  }

  /* =================================================================
     M7: ハンバーガーメニュー。aria-expanded / aria-hidden を切り替え、
     遷移中はボタンを disabled にして連打で壊れないようにする。
     閉じるときは .open を即座に外すが、CSS側の visibility 遅延
     （motion.css参照）が退出アニメーションを最後まで見せてから
     操作不能にする＝「クラス除去を遅らせる」と同じ効果を持たせる。
     ================================================================= */
  function initMenu() {
    var btn = doc.getElementById('menuBtn');
    var drawer = doc.getElementById('menuDrawer');
    if (!btn || !drawer) return;
    var busy = false;

    function setOpen(open) {
      if (busy) return;
      busy = true;
      btn.disabled = true;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      drawer.classList.toggle('open', open);
      setTimeout(function () { busy = false; btn.disabled = false; }, 400);
    }

    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setOpen(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  }

  /* =================================================================
     汎用出現オブザーバ：[data-reveal] / [data-orbit] / [data-lines] を
     まとめて監視し、可視化されたら .in を付けて監視を外す。
     M1（行の組み替え）は既に buildAllLines() で完了している前提で、
     ここでは .in を付けるだけ（動きはCSSのtransition-delayが担う）。
     ================================================================= */
  function startRevealObserver() {
    var targets = Array.prototype.slice.call(doc.querySelectorAll('[data-reveal],[data-orbit],[data-lines]'));
    if (!targets.length) return;
    function reveal(el) {
      el.classList.add('in');
      if (el.hasAttribute('data-lines')) revealLines(el);
    }
    if (!('IntersectionObserver' in window) || reduceMotion) {
      targets.forEach(reveal);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: .18 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* =================================================================
     M8の土台：ヒーローとCTAにだけ .ron-field を出す固定レイヤを生成する。
     ================================================================= */
  function mountField() {
    var field = doc.createElement('div');
    field.className = 'ron-field';
    body.insertBefore(field, body.firstChild);
    return field;
  }

  /* =================================================================
     節ごとの状態制御（時間の表現・左レール・M8のon/off）を1つの
     IntersectionObserver にまとめる。連続値(--gp)は使わず、
     「今いちばん見えている節はどれか」だけを扱う（§6.7.1原則2）。
     ================================================================= */
  function initPhaseController(field) {
    var secs = Array.prototype.slice.call(doc.querySelectorAll('[data-sec]'));
    if (!secs.length) return;
    var ids = secs.map(function (s) { return s.id; });
    var railLinks = Array.prototype.slice.call(doc.querySelectorAll('.rail a[data-target]'));

    function apply(id) {
      root.setAttribute('data-phase', id);
      var idx = ids.indexOf(id);
      var step = ids.length > 1 ? idx / (ids.length - 1) : 0;
      root.style.setProperty('--step', String(Math.round(step * 1000) / 1000));
      railLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-target') === id); });
      if (field) {
        if (id === 's00') { field.setAttribute('data-phase', 'hero'); field.classList.add('on'); }
        else if (id === 's05') { field.setAttribute('data-phase', 'cta'); field.classList.add('on'); }
        else { field.classList.remove('on'); }
      }
    }

    if (!('IntersectionObserver' in window)) { apply(ids[0]); return; }
    var io = new IntersectionObserver(function (entries) {
      var best = null, bestRatio = 0;
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= bestRatio) {
          bestRatio = entry.intersectionRatio; best = entry.target;
        }
      });
      if (best) apply(best.id);
    }, { threshold: [0.3, 0.5, 0.7] });
    secs.forEach(function (s) { io.observe(s); });
    apply(ids[0]);
  }

  /* ---------------------------------------------------------------
     起動
     --------------------------------------------------------------- */
  splitKinetic();
  var field = mountField();
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(buildAllLines).catch(buildAllLines);
  } else {
    buildAllLines();
  }
  startRevealObserver();
  initFlipbooks();
  initWindows();
  initMenu();
  initPhaseController(field);
  runIntro();

  window.RonMotion = { mountCarousel: mountCarousel };
})();
