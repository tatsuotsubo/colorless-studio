// js/release-v3.js
// New Release 一覧：フィルター（All / album / sample pack ...）と、
// 曲リスト（<details>）を開いた時だけ波形・音声を読み込む処理。
document.addEventListener('DOMContentLoaded', () => {
  /* ---------- フィルター ---------- */
  const chips = document.querySelectorAll('#music .chip');
  const items = document.querySelectorAll('#music .rel');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => c.classList.toggle('is-active', c === chip));
      items.forEach((it) => {
        it.classList.toggle('is-hidden', !(f === 'all' || it.dataset.kind === f));
      });
    });
  });

  /* ---------- 曲リスト：開いた時に波形を初期化（scatter-modal.js の initWavesIn を利用） ---------- */
  document.querySelectorAll('#music .rel-tracks').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open || typeof window.initWavesIn !== 'function') return;
      // 表示されて幅が決まってから描く
      requestAnimationFrame(() => window.initWavesIn(d));
    });
  });
});
