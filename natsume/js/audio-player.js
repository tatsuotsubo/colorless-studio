document.addEventListener("DOMContentLoaded", () => {
  const trackItems = document.querySelectorAll(".track-item");
  const players = [];

  trackItems.forEach((item, index) => {
    const waveContainer = item.querySelector(".wave");
    const btn = item.querySelector(".soundBtn");
    const icon = item.querySelector(".soundIcon");
    const src = item.dataset.src;

    if (!src) return; // data-src がない曲は無視（安全）

    const ws = WaveSurfer.create({
        container: waveContainer,
        waveColor: '#888',
        progressColor: '#333',
        height: 20,
    });

    ws.load(src);
    players.push(ws);

    btn.addEventListener("click", () => {

        // 他の曲を止める
        players.forEach((p, i) => {
        if (p !== ws) {
            p.pause();
            trackItems[i]
            .querySelector(".soundIcon")
            .src = "images/play_button.png";
        }
        });

        ws.playPause();
        icon.src = ws.isPlaying()
        ? "images/pause_button.png"
        : "images/play_button.png";
    });

    ws.on("finish", () => {
        icon.src = "images/play_button.png";
    });
  });
});
