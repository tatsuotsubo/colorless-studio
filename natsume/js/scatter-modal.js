document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     0) 参照取得（元データを先に確保する）
  ========================================================= */
  const source = document.getElementById("sushiSource");
  const modal = document.getElementById("imgModal");
  if (!source || !modal) return;

  // 元カード一覧（順番の確定データ）※sourceを消す前に作る！
  const items = Array.from(source.querySelectorAll(".scatter-card")).map((el) => ({
    title: el.dataset.title || "",
    desc: el.dataset.desc || "",
    soundcloud: el.dataset.soundcloud || "",
    artistImg: el.dataset.artistImg || "",
    imgSrc: el.querySelector("img") ? el.querySelector("img").src : "",
  }));

  /* =========================================================
     1) Sushi レーン生成（“見た目が二重”にならないように作る）
        - sourceはテンプレとして使い、表示用のtrackを新規生成
        - 各レーンは「1回だけ複製（=2セット）」→ 無限ループ前提
  ========================================================= */
  const viewport = source.parentElement; // .sushi-viewport
  const lanes = [
    { speed: 50, reverse: false },
    { speed: 50, reverse: true },
  ];

  // テンプレの中身（カード群）を取り出して使う
  const templateCards = Array.from(source.querySelectorAll(".scatter-card"));

  // テンプレ要素自体は消す（表示に使わない）
  source.remove();

  lanes.forEach((lane) => {
    const track = document.createElement("div");
    track.className = "sushi-track";
    if (lane.reverse) track.classList.add("reverse");
    track.style.animationDuration = lane.speed + "s";

    // 1周分：元カード
    templateCards.forEach((card) => {
      track.appendChild(card.cloneNode(true));
    });

    // ループ用：もう1周分（合計2セット）
    templateCards.forEach((card) => {
      track.appendChild(card.cloneNode(true));
    });

    // 開始位置ランダム（マイナス遅延で“途中から”開始）
    const delay = Math.random() * lane.speed;
    track.style.animationDelay = `-${delay}s`;

    viewport.appendChild(track);
  });

  /* =========================================================
     2) Modal（矢印 + 一覧）
  ========================================================= */
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const player = document.getElementById("modalPlayer");
  const artistImg = document.getElementById("modalArtistImg");

  const prevBtn = modal.querySelector(".img-modal__nav.prev");
  const nextBtn = modal.querySelector(".img-modal__nav.next");

  const thumbsBtn = modal.querySelector(".img-modal__thumbBtn");
  const thumbsWrap = modal.querySelector(".img-modal__thumbs");
  const thumbsGrid = document.getElementById("modalThumbs");

  let currentIndex = 0;

  const openByIndex = (idx) => {
    if (!items.length) return;
    currentIndex = (idx + items.length) % items.length;
    const d = items[currentIndex];

    if (modalImg) modalImg.src = d.imgSrc || "";
    if (modalTitle) modalTitle.textContent = d.title || "";
    if (modalDesc) modalDesc.textContent = d.desc || "";
    if (player) player.src = d.soundcloud || "";

    if (artistImg) {
      if (d.artistImg) {
        artistImg.src = d.artistImg;
        artistImg.style.display = "";
      } else {
        artistImg.src = "";
        artistImg.style.display = "none";
      }
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";

    buildThumbs();
    setActiveThumb(currentIndex);
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (modalImg) modalImg.src = "";
    if (player) player.src = "";
    if (artistImg) {
      artistImg.src = "";
      artistImg.style.display = "none";
    }

    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";

    if (thumbsWrap) thumbsWrap.classList.remove("is-open");
  };

  const findIndexFromCard = (card) => {
    const title = card.dataset.title || "";
    const imgSrc = card.querySelector("img") ? card.querySelector("img").src : "";

    let idx = -1;
    if (title) idx = items.findIndex((x) => x.title === title);
    if (idx === -1 && imgSrc) idx = items.findIndex((x) => x.imgSrc === imgSrc);

    return idx >= 0 ? idx : 0;
  };

  // カードクリック（寿司トラックは複製してるので “document” 委譲で拾う）
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".scatter-card");
    if (!card) return;

    e.preventDefault();
    openByIndex(findIndexFromCard(card));
  });

  // 矢印
  if (prevBtn) prevBtn.addEventListener("click", () => openByIndex(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => openByIndex(currentIndex + 1));

  // 閉じる
  modal.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  // キーボード
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") openByIndex(currentIndex - 1);
    if (e.key === "ArrowRight") openByIndex(currentIndex + 1);
  });

  /* ===== サムネ一覧 ===== */
  const buildThumbs = () => {
    if (!thumbsGrid || thumbsGrid.dataset.built || !items.length) return;
    thumbsGrid.dataset.built = "1";

    thumbsGrid.innerHTML = items
      .map(
        (x, i) => `
        <button class="img-modal__thumb" type="button" data-idx="${i}" aria-label="${x.title || "thumb"}">
          <img src="${x.imgSrc}" alt="">
        </button>
      `
      )
      .join("");
  };

  const setActiveThumb = (idx) => {
    if (!thumbsGrid) return;
    thumbsGrid.querySelectorAll(".img-modal__thumb").forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.idx) === idx);
    });
  };

  if (thumbsBtn && thumbsWrap) {
    thumbsBtn.addEventListener("click", () => {
      thumbsWrap.classList.toggle("is-open");
      buildThumbs();
      setActiveThumb(currentIndex);
    });
  }

  if (thumbsGrid) {
    thumbsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".img-modal__thumb");
      if (!btn) return;
      openByIndex(Number(btn.dataset.idx));
    });
  }

    // ✅ ヘッダーの「Gallery」クリックで、モーダルを開いて一覧表示
  document.addEventListener("click", (e) => {
    const g = e.target.closest('[data-open-gallery]');
    if (!g) return;

    e.preventDefault();

    // モーダルを開く → その中で buildThumbs() も呼ばれる
    openByIndex(0);

    // 一覧を強制で開く
    if (thumbsWrap) thumbsWrap.classList.add("is-open");
    setActiveThumb(currentIndex);
  });

  // ✅ "See all" ボタンで、モーダルを開いて一覧(サムネ)を表示
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-open-gallery]");
  if (!g) return;

  e.preventDefault();

  // モーダルを開く（中で buildThumbs & setActiveThumb される）
  openByIndex(0);

  // 一覧を強制で開く
  if (thumbsWrap) thumbsWrap.classList.add("is-open");
  setActiveThumb(currentIndex);
});
});

