// js/release-v3.js
// New Release 一覧：フィルター（All / album / sample pack ...）と、
// ジャケを左右にスワイプして曲リストを表示するスライダー。
// 曲リストのスライドが表示された時だけ波形・音声を読み込む（scatter-modal.js の initWavesIn を利用）。
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

  /* ---------- スライダー ---------- */
  document.querySelectorAll('#music .rel.has-slides').forEach((card) => {
    const track = card.querySelector('.rel-slides');
    const slides = [...track.children];
    const tabs = [...card.querySelectorAll('.rel-tab')];
    const prev = card.querySelector('.rel-arrow--prev');
    const next = card.querySelector('.rel-arrow--next');
    let cur = 0;

    const go = (i) => {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
    };

    const update = () => {
      const w = track.clientWidth || 1;
      const i = Math.round(track.scrollLeft / w);
      if (i === cur && track.dataset.ready) return;
      track.dataset.ready = '1';
      cur = i;
      tabs.forEach((t, k) => t.classList.toggle('is-active', k === i));
      prev.disabled = i <= 0;
      next.disabled = i >= slides.length - 1;
      if (i > 0 && typeof window.initWavesIn === 'function') {
        requestAnimationFrame(() => window.initWavesIn(slides[i]));
      }
    };

    // スクロール中は随時、止まった後にもう一度（スナップ後の位置を確実に拾う）
    let raf = 0, timer = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
      clearTimeout(timer);
      timer = setTimeout(update, 150);
    }, { passive: true });
    track.addEventListener('scrollend', update);

    tabs.forEach((t) => t.addEventListener('click', () => go(+t.dataset.i)));
    prev.addEventListener('click', () => go(cur - 1));
    next.addEventListener('click', () => go(cur + 1));
    update();
  });
});
