document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     0) 元データ取得
  ========================================================= */
  const source = document.getElementById("sushiSource");
  const modal = document.getElementById("imgModal");
  if (!source || !modal) return;

  const items = Array.from(source.querySelectorAll(".scatter-card")).map((el) => ({
    title: el.dataset.title || "",
    desc: el.dataset.desc || "",
    soundcloud: el.dataset.soundcloud || "",
    artistImg: el.dataset.artistImg || "",
    imgSrc: el.querySelector("img") ? el.querySelector("img").src : "",
  }));

  /* =========================================================
     1) 寿司トラック生成
  ========================================================= */
  const viewport = source.parentElement;

  const lanes = [
    { speed: 50, reverse: false },
    { speed: 50, reverse: true },
  ];

  const templateCards = Array.from(source.querySelectorAll(".scatter-card"));
  source.remove();

  lanes.forEach((lane) => {
    const track = document.createElement("div");
    track.className = "sushi-track";
    if (lane.reverse) track.classList.add("reverse");
    track.style.animationDuration = lane.speed + "s";

    templateCards.forEach((card) => track.appendChild(card.cloneNode(true)));
    templateCards.forEach((card) => track.appendChild(card.cloneNode(true)));

    const delay = Math.random() * lane.speed;
    track.style.animationDelay = `-${delay}s`;

    viewport.appendChild(track);
  });

  /* =========================================================
     2) Modal
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

  /* =========================
     モーダル表示
  ========================= */
  const openByIndex = (idx) => {
    if (!items.length) return;

    currentIndex = (idx + items.length) % items.length;
    const d = items[currentIndex];

    modal.classList.remove("is-gallery-only"); // ← 詳細モード

    if (modalImg) modalImg.src = d.imgSrc || "";
    if (modalTitle) modalTitle.textContent = d.title || "";
    if (modalDesc) modalDesc.textContent = d.desc || "";
    if (player) player.src = d.soundcloud || "";

    if (artistImg) {
      if (d.artistImg) {
        artistImg.src = d.artistImg;
        artistImg.style.display = "";
      } else {
        artistImg.style.display = "none";
      }
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    buildThumbs();
    setActiveThumb(currentIndex);
  };

  const closeModal = () => {
    modal.classList.remove("is-open", "is-gallery-only");
    modal.setAttribute("aria-hidden", "true");

    if (modalImg) modalImg.src = "";
    if (player) player.src = "";

    document.body.style.overflow = "";
    thumbsWrap?.classList.remove("is-open");
  };

  /* =========================
     カード→index
  ========================= */
  const findIndexFromCard = (card) => {
    const title = card.dataset.title || "";
    const imgSrc = card.querySelector("img")?.src || "";

    let idx = items.findIndex((x) => x.title === title);
    if (idx === -1) idx = items.findIndex((x) => x.imgSrc === imgSrc);

    return idx >= 0 ? idx : 0;
  };

  /* =========================
     カードクリック
  ========================= */
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".scatter-card");
    if (!card) return;

    e.preventDefault();
    openByIndex(findIndexFromCard(card));
  });

  /* =========================
     ナビ
  ========================= */
  prevBtn?.addEventListener("click", () => openByIndex(currentIndex - 1));
  nextBtn?.addEventListener("click", () => openByIndex(currentIndex + 1));

  /* =========================
     閉じる
  ========================= */
  modal.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") openByIndex(currentIndex - 1);
    if (e.key === "ArrowRight") openByIndex(currentIndex + 1);
  });

  /* =========================
     サムネ一覧
  ========================= */
  const buildThumbs = () => {
    if (!thumbsGrid || thumbsGrid.dataset.built) return;

    thumbsGrid.dataset.built = "1";
    thumbsGrid.innerHTML = items
      .map(
        (x, i) => `
        <button class="img-modal__thumb" data-idx="${i}">
          <img src="${x.imgSrc}">
        </button>
      `
      )
      .join("");
  };

  const setActiveThumb = (idx) => {
    thumbsGrid?.querySelectorAll(".img-modal__thumb").forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.idx) === idx);
    });
  };

  /* =========================
     サムネクリック → 詳細表示
  ========================= */
  thumbsGrid?.addEventListener("click", (e) => {
    const btn = e.target.closest(".img-modal__thumb");
    if (!btn) return;

    const idx = Number(btn.dataset.idx);

    modal.classList.remove("is-gallery-only");
    thumbsWrap?.classList.remove("is-open");

    openByIndex(idx);
  });

  /* =========================
     サムネボタン（トグル）
  ========================= */
  thumbsBtn?.addEventListener("click", () => {
    thumbsWrap?.classList.toggle("is-open");
    buildThumbs();
    setActiveThumb(currentIndex);
  });

  /* =========================
     See all / Galleryクリック
  ========================= */
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-open-gallery]");
    if (!g) return;

    e.preventDefault();

    openByIndex(0);

    // 一覧だけ表示モード
    modal.classList.add("is-gallery-only");
    thumbsWrap?.classList.add("is-open");
  });
});