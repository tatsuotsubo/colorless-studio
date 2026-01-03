document.addEventListener('DOMContentLoaded', () => {
/* =========================
   汎用 Slider
========================= */

document.querySelectorAll('[data-slider]').forEach(initSlider);

function initSlider(root) {
  const track   = root.querySelector('.artist-track');
  const items   = root.querySelectorAll('.artist-item');
  const prevBtn = root.querySelector('.prev');
  const nextBtn = root.querySelector('.next');
  const slider  = root.querySelector('.artist-slider');

  let index = 1;
  let isMoving = false;
  const total = items.length;

  const GAP = 40;
  const INTERVAL = 3000;
  const AUTO_RESTART_DELAY = 5000;

  let slideWidth = 0;
  let centerOffset = 0;
  let autoSlide = null;
  let restartTimer = null;

  /* =========================
     サイズ計算
  ========================= */
  function calcSize() {
    slideWidth = items[0].offsetWidth + GAP;
    centerOffset = (slider.offsetWidth - items[0].offsetWidth) / 2;
  }

  /* =========================
     active 管理
  ========================= */
  function updateActive() {
    items.forEach(item => item.classList.remove('is-active'));

  // clone はスキップ
    if (!items[index].classList.contains('clone')) {
        items[index].classList.add('is-active');
    }
  }

  /* =========================
     移動
  ========================= */
  function moveSlide() {
    if (isMoving) return;
    isMoving = true;

    track.style.transition = 'transform 0.6s ease';
    track.style.transform =
      `translateX(${-(index * slideWidth) + centerOffset}px)`;
  }

  /* =========================
     自動スライド
  ========================= */
  function startAuto() {
    if (autoSlide) return;

    autoSlide = setInterval(() => {
      index++;
      moveSlide();
    }, INTERVAL);
  }

  function stopAuto() {
    clearInterval(autoSlide);
    autoSlide = null;
  }

  /* =========================
     手動操作
  ========================= */
  function manualControl(callback) {
    stopAuto();
    clearTimeout(restartTimer);

    callback();

    restartTimer = setTimeout(startAuto, AUTO_RESTART_DELAY);
  }

  /* =========================
     初期化
  ========================= */
  function init() {
    calcSize();

    track.style.transform =
      `translateX(${-(index * slideWidth) + centerOffset}px)`;

    updateActive();
    startAuto();
  }

  /* =========================
     イベント
  ========================= */
  nextBtn?.addEventListener('click', () => {
    manualControl(() => {
      index++;
      moveSlide();
    });
  });

  prevBtn?.addEventListener('click', () => {
    manualControl(() => {
      index--;
      moveSlide();
    });
  });

  track.addEventListener('transitionend', () => {
    if (items[index].classList.contains('clone')) {
      track.style.transition = 'none';

      if (index === total - 1) index = 1;
      if (index === 0) index = total - 2;

      track.style.transform =
        `translateX(${-(index * slideWidth) + centerOffset}px)`;
    }

    updateActive();
    isMoving = false;
  });

  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', startAuto);

  window.addEventListener('resize', () => {
    calcSize();
    track.style.transition = 'none';
    track.style.transform =
      `translateX(${-(index * slideWidth) + centerOffset}px)`;
  });

  init();
}
});