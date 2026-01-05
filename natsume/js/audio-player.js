document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  // trackItem -> { ws, icon }
  const waveMap = new Map();

  // ✅ 波形をまだ作ってなければ作る
  function ensureWave(trackItem) {
    if (waveMap.has(trackItem)) return waveMap.get(trackItem);

    const waveContainer = trackItem.querySelector(".wave");
    const btn = trackItem.querySelector(".soundBtn");
    const icon = trackItem.querySelector(".soundIcon");
    const src = trackItem.dataset.src;

    if (!src || !waveContainer || !btn || !icon) return null;

    // 念のためクリア（再生成時のゴミ防止）
    waveContainer.innerHTML = "";

    const ws = WaveSurfer.create({
      container: waveContainer,
      waveColor: "#888",
      progressColor: "#333",
      height: 20,
    });

    ws.load(src);

    // 再生ボタン
    btn.addEventListener("click", () => {
      // 他の曲を止める
      waveMap.forEach(({ ws: otherWs, icon: otherIcon }, otherTrack) => {
        if (otherWs !== ws) {
          otherWs.pause();
          otherIcon.src = "images/play_button.png";
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

    const obj = { ws, icon };
    waveMap.set(trackItem, obj);
    return obj;
  }

  // ✅ パネルをアクティブにした時：波形を作って、描画し直す
  function activatePanel(panel) {
    const items = panel.querySelectorAll(".track-item");

    // 1) まだ作ってない波形を作る
    items.forEach((item) => ensureWave(item));

    // 2) 表示後に再描画（display切替直後は幅が確定してないことがある）
    requestAnimationFrame(() => {
      items.forEach((item) => {
        const data = waveMap.get(item);
        if (!data) return;

        const { ws } = data;

        // WaveSurferの描画を強制更新（内部APIだけど実用的）
        try {
          ws.drawer?.setWidth?.(item.querySelector(".wave").clientWidth);
          ws.drawBuffer?.();
        } catch (e) {}
      });
    });
  }

  // ✅ タブ切替
  function switchTab(tabName) {
    tabs.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === tabName);
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === tabName;
      panel.classList.toggle("is-active", isActive);
      panel.style.display = isActive ? "block" : "none";
    });

    const activePanel = document.querySelector(
      `.tab-panel[data-panel="${tabName}"]`
    );
    if (activePanel) activatePanel(activePanel);
  }

  // タブクリック
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });

  // 初期表示（demo を表示）
  const initial = document.querySelector(".tab-btn.is-active")?.dataset.tab || "demo";
  switchTab(initial);
});