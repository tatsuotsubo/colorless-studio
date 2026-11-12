// js/visualiser-tab.js
// HP の Visualizer セクション：Launch で visualiser/index.html を iframe に読み込む。
// Close で iframe を空にして、音・カメラ・MIDI を確実に止める。
document.addEventListener('DOMContentLoaded', () => {
  const frame = document.getElementById('visFrame');
  // build.py が visualiser 本体の中身から作った版番号つきの URL（無ければ従来のもの）
  const SRC = (frame && frame.dataset.src) || 'visualiser/index.html?v=61';
  const cover = document.getElementById('visCover');
  const launch = document.getElementById('visLaunch');
  const coverPlay = document.getElementById('visCoverPlay');
  const closeBtn = document.getElementById('visClose');
  if (!frame || !cover) return;

  const coverVideo = cover.querySelector('video');

  const open = () => {
    if (!frame.getAttribute('src')) frame.src = SRC;
    frame.hidden = false;
    cover.hidden = true;
    coverVideo?.pause();
    if (launch) launch.hidden = true;
    if (closeBtn) closeBtn.hidden = false;
    document.getElementById('visualiser')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    frame.addEventListener('load', () => { try { frame.focus(); } catch (e) {} fitStart(); }, { once: true });
  };

  /* 中でスクロールさせず、visualizer の中身の高さに合わせて枠を伸ばす（同じサイトなので中身を測れる） */
  const stage = document.getElementById('visStage');
  let ro = null, timer = 0;
  const fit = () => {
    try {
      const d = frame.contentDocument;
      if (!d || !d.body) return;
      const cs = d.defaultView.getComputedStyle(d.body);
      const h = Math.ceil(d.body.scrollHeight + parseFloat(cs.marginTop || 0) + parseFloat(cs.marginBottom || 0));
      if (h > 200) frame.style.height = h + 'px';
    } catch (e) {}
  };
  const fitStart = () => {
    stage?.classList.add('is-running');
    fit();
    try {
      ro = new ResizeObserver(() => { cancelAnimationFrame(timer); timer = requestAnimationFrame(fit); });
      ro.observe(frame.contentDocument.body);
    } catch (e) {}
    window.addEventListener('resize', fit);
  };
  const fitStop = () => {
    ro?.disconnect(); ro = null;
    window.removeEventListener('resize', fit);
    stage?.classList.remove('is-running');
    frame.style.height = '';
  };

  const close = () => {
    fitStop();
    frame.removeAttribute('src');   // ページごと破棄 → 音も止まる
    frame.src = 'about:blank';
    frame.hidden = true;
    cover.hidden = false;
    coverVideo?.play().catch(() => {});
    if (launch) launch.hidden = false;
    if (closeBtn) closeBtn.hidden = true;
  };

  launch?.addEventListener('click', open);
  coverPlay?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
});
