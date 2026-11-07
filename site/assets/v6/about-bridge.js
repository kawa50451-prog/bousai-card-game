/* Shared bridge entrance and a single, visible-only clock for each learning track. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var lite = new URLSearchParams(location.search).get('motion') === 'lite';
  if (lite) root.setAttribute('data-motion-lite', '');
  function still() { return lite || reduced.matches; }
  // Keep a requested static view static when following the detail link.
  if (lite) document.querySelectorAll('a[href="about.html"]').forEach(function (link) {
    link.href = 'about.html?motion=lite';
  });
  document.querySelectorAll('.learning-loop:not([data-learning-cycle]) svg').forEach(function (svg) {
    function resizeBrokenTrack() {
      var width = svg.clientWidth, height = svg.clientHeight;
      if (!width || !height) return;
      var left = width / 6, right = width * 5 / 6;
      var top = height * 24 / 104, bottom = height * 80 / 104, radius = (bottom - top) / 2;
      var before = width * 260 / 600, after = width * 340 / 600;
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      svg.querySelector('path').setAttribute('d', 'M' + before + ' ' + top + 'H' + left +
        'A' + radius + ' ' + radius + ' 0 0 0 ' + left + ' ' + bottom + 'H' + right +
        'A' + radius + ' ' + radius + ' 0 0 0 ' + right + ' ' + top + 'H' + after);
      var dot = svg.querySelector('.cycle-dot');
      dot.setAttribute('cx', before); dot.setAttribute('cy', top);
    }
    resizeBrokenTrack();
    if ('ResizeObserver' in window) new ResizeObserver(resizeBrokenTrack).observe(svg);
  });
  document.querySelectorAll('[data-learning-cycle]').forEach(function (host) {
    var path = host.querySelector('path');
    var dot = host.querySelector('.cycle-dot');
    if (!path || !dot) return;
    var svg = path.ownerSVGElement;
    var length = path.getTotalLength(), stationWidth = 200;
    var buttons = Array.from(host.querySelectorAll('.cycle-steps button'));
    var images = Array.from(host.querySelectorAll('.bridge-phone img'));
    var labels = Array.from(host.querySelectorAll('.loop-labels span'));
    var stops = [0, 200 / length, 400 / length];
    var progress = 0, active = -1, visible = false, hovered = false, focused = false;
    var resumeAt = 0, frame = 0, previous = 0, entered = false;
    if (host.classList.contains('about-experience') && !still() && 'IntersectionObserver' in window) {
      host.classList.add('bridge-armed');
    }
    function paint() {
      var point = path.getPointAtLength(progress * length);
      dot.setAttribute('cx', point.x);
      dot.setAttribute('cy', point.y);
      // The return leg passes the same three stations in reverse order.
      var index = point.x < stationWidth ? 0 : point.x < stationWidth * 2 ? 1 : 2;
      if (index === active) return;
      active = index;
      buttons.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === active)); });
      images.forEach(function (img, i) { img.classList.toggle('is-active', i === active); });
      labels.forEach(function (label, i) { label.style.color = i === active ? '#fff' : '#ffffff8c'; });
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    function allowed() { return visible && !document.hidden && !still() && !hovered && !focused; }
    function tick(time) {
      frame = 0;
      if (!allowed()) { previous = 0; return; }
      if (previous && time >= resumeAt) progress = (progress + (time - Math.max(previous, resumeAt)) / 7600) % 1;
      previous = time;
      paint();
      frame = requestAnimationFrame(tick);
    }
    function start() { if (allowed() && !frame) frame = requestAnimationFrame(tick); }
    function select(index) { progress = stops[index]; paint(); resumeAt = performance.now() + 3000; previous = 0; }
    buttons.forEach(function (button, index) {
      button.addEventListener('pointerenter', function (event) {
        if (still() || event.pointerType !== 'mouse') return;
        hovered = true; stop(); select(index);
      });
      button.addEventListener('click', function () { select(index); start(); });
      button.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        var next = (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
        buttons[next].focus(); select(next);
      });
    });
    var controls = host.querySelector('.learning-cycle');
    if (controls) {
      controls.addEventListener('pointerenter', function (event) { if (!still() && event.pointerType === 'mouse') { hovered = true; stop(); } });
      controls.addEventListener('pointerleave', function () { hovered = false; resumeAt = performance.now() + 3000; start(); });
      controls.addEventListener('focusin', function (event) {
        focused = event.target.matches(':focus-visible');
        if (focused) stop();
      });
      controls.addEventListener('focusout', function (event) {
        if (controls.contains(event.relatedTarget)) return;
        focused = false; resumeAt = performance.now() + 3000; start();
      });
    }
    function motionChanged() {
      host.classList.add('bridge-in'); stop();
      if (!still()) start();
    }
    reduced.addEventListener('change', motionChanged);
    document.addEventListener('visibilitychange', function () { stop(); start(); });
    function resizeTrack() {
      var width = svg.clientWidth, height = svg.clientHeight;
      if (!width || !height) return;
      var left = width / 6, right = width * 5 / 6;
      var top = height * 24 / 104, bottom = height * 80 / 104;
      var radius = (bottom - top) / 2;
      // Use rendered pixels so the dot stays round and its speed is constant on corners too.
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      path.setAttribute('d', 'M' + left + ' ' + top + 'H' + right +
        'A' + radius + ' ' + radius + ' 0 0 1 ' + right + ' ' + bottom +
        'H' + left + 'A' + radius + ' ' + radius + ' 0 0 1 ' + left + ' ' + top + 'Z');
      length = path.getTotalLength(); stationWidth = width / 3;
      stops = [0, stationWidth / length, stationWidth * 2 / length];
      paint();
    }
    resizeTrack();
    if ('ResizeObserver' in window) new ResizeObserver(resizeTrack).observe(svg);
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !entered) { host.classList.add('bridge-in'); entered = true; }
        if (visible) start(); else stop();
      }, {threshold: 0.12});
      observer.observe(host);
    } else { visible = true; host.classList.add('bridge-in'); start(); }
  });
})();
