document.addEventListener('DOMContentLoaded', () => {
  const wraps = document.querySelectorAll('.music-art-wrap');

  wraps.forEach(wrap => {
    const video = wrap.querySelector('.music-video');
    if (!video) return;

    wrap.addEventListener('mouseenter', () => {
      video.currentTime = 0;
      video.play();
    });

    wrap.addEventListener('mouseleave', () => {
      video.pause();
    });
  });
});
