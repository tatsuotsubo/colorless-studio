document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");

  if (!modal) return;

  document.querySelectorAll(".scatter-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault(); // href="#" のジャンプを止める

      const img = card.querySelector("img");
      modalImg.src = img ? img.src : "";
      modalTitle.textContent = card.dataset.title || "";
      modalDesc.textContent = card.dataset.desc || "";

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });

  modal.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modalImg.src = "";
      document.body.style.overflow = "";
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modalImg.src = "";
      document.body.style.overflow = "";
    }
  });
});

const player = document.getElementById("modalPlayer");

document.querySelectorAll(".scatter-card").forEach((card) => {
  card.addEventListener("click", (e) => {
    e.preventDefault();

    // 画像・文言は今まで通り…
    const img = card.querySelector("img");
    modalImg.src = img ? img.src : "";
    modalTitle.textContent = card.dataset.title || "";
    modalDesc.textContent = card.dataset.desc || "";

    // ★これ追加
    const url = card.dataset.soundcloud || "";
    if (player) {
      player.src = url; // embed.music.apple.com のURLを入れる
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
});

// 閉じるときに停止（超重要）
modal.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    if (player) player.src = "";
    document.body.style.overflow = "";
  });
});