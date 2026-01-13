// js/logo-scroll.js
document.addEventListener('DOMContentLoaded', () => {
  const heroLogo = document.querySelector('.logo-image');   // 中央ロゴ
  const headerLogo = document.querySelector('.header-logo'); // ヘッダーロゴ

  if (!heroLogo || !headerLogo) return;

  const maxScroll = 300;      // ロゴ移動が完了するスクロール量
  let currentProgress = 0;    // 現在の進捗（慣性用）
  let targetProgress = 0;
  let ticking = false;

  // なめらかなイージング
  const ease = t => t * t * (3 - 2 * t);

  function update() {
    // スクロール量 → 目標進捗
    targetProgress = Math.min(window.scrollY / maxScroll, 1);

    // 慣性をつけて追従
    currentProgress += (targetProgress - currentProgress) * 0.1;

    const p = ease(currentProgress);

    /* ===== ロゴ位置計算 ===== */

    // 開始位置（画面中央）
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;

    // 目標位置（ヘッダーロゴ中心）
    const headerRect = headerLogo.getBoundingClientRect();
    const targetX = headerRect.left + headerRect.width / 2;
    const targetY = headerRect.top + headerRect.height / 2;

    // 補間
    const x = startX + (targetX - startX) * p;
    const y = startY + (targetY - startY) * p;

    // 縮小
    const scale = 1 - p * 0.75;

    heroLogo.style.transform = `
      translate(-50%, -50%)
      translate(${x - startX}px, ${y - startY}px)
      scale(${scale})
    `;

    /* ===== 中央ロゴの表示制御 ===== */
    heroLogo.style.opacity = Math.max(0, 1 - p * 1.2);

    /* ===== ヘッダーロゴの遅延フェードイン ===== */

    const headerStart = 0.55; // 出現開始（遅め）
    const headerEnd   = 0.75; // 完全表示

    let headerOpacity = 0;

    if (p <= headerStart) {
      headerOpacity = 0;
    } else if (p >= headerEnd) {
      headerOpacity = 1;
    } else {
      headerOpacity = (p - headerStart) / (headerEnd - headerStart);
    }

    headerLogo.style.opacity = headerOpacity;

    /* ===== アニメーション継続判定 ===== */
    if (Math.abs(targetProgress - currentProgress) > 0.001) {
      requestAnimationFrame(update);
    } else {
      ticking = false;
    }
  }

  // スクロール時に更新開始
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }

    // ヘッダーロゴクリックでトップへ戻る
    headerLogo.style.cursor = 'pointer';

    headerLogo.addEventListener('click', () => {
       if (window.scrollY > 10) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  });
});
