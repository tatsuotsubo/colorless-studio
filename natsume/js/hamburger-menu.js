document.addEventListener("DOMContentLoaded", function () {
  const menu = document.querySelector(".menu");
  const menuWrapper = document.querySelector(".hamburger-menu");
  const hamburgerIcon = document.querySelector(".hamburger-icon");

  // ハンバーガーアイコンのクリックでメニュー開閉
  hamburgerIcon.addEventListener("click", function () {
    menu.classList.toggle("active");
    menuWrapper.classList.toggle("active");
  });

  // メニューのリンクをクリックしたら閉じる
  document.querySelectorAll(".menu a").forEach(link => {
    link.addEventListener("click", function () {
      menu.classList.remove("active");
      menuWrapper.classList.remove("active");
    });
  });
});