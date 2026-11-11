// js/release-slider.js
// リリースカード（.has-slides）の横スワイプ。
// スワイプ・トラックパッドの横スクロールは CSS の scroll-snap がそのまま担当し、
// ここでは「‹ ›」ボタン・上部ラベル（jacket / songs / samples）との同期だけを行う。
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.music-card-square.has-slides').forEach((card) => {
    const track = card.querySelector('.release-track');
    const slides = Array.from(card.querySelectorAll('.release-slide'));
    const segs = Array.from(card.querySelectorAll('.slide-seg'));
    const prev = card.querySelector('.slide-nav.prev');
    const next = card.querySelector('.slide-nav.next');
    if (!track || slides.length < 2) return;

    let current = 0;

    const goTo = (i) => {
      const idx = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[idx].offsetLeft, behavior: 'smooth' });
    };

    const update = () => {
      const w = track.clientWidth || 1;
      current = Math.round(track.scrollLeft / w);
      segs.forEach((b, i) => {
        const on = i === current;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (prev) prev.hidden = current <= 0;
      if (next) next.hidden = current >= slides.length - 1;
      card.classList.toggle('is-on-art', current === 0);
    };

    segs.forEach((b) => b.addEventListener('click', () => goTo(Number(b.dataset.slide))));
    prev?.addEventListener('click', () => goTo(current - 1));
    next?.addEventListener('click', () => goTo(current + 1));

    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });

    // 曲リスト内の縦スクロールを妨げないよう、矢印キーはカードにフォーカスがある時だけ
    card.addEventListener('keydown', (e) => {
      if (e.target.closest('.music-info')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    });

    window.addEventListener('resize', () => {
      track.scrollTo({ left: slides[current].offsetLeft });
    });

    update();
  });
});
