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
    frame.addEventListener('load', () => { try { frame.focus(); } catch (e) {} }, { once: true });
  };

  const close = () => {
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
