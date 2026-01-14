document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  // trackItem -> { ws, icon }
  const waveMap = new Map();

  // ================================
  // 波形をまだ作ってなければ作る
  // ================================
  function ensureWave(trackItem) {
    if (waveMap.has(trackItem)) return waveMap.get(trackItem);

    const waveContainer = trackItem.querySelector(".wave");
    const btn = trackItem.querySelector(".soundBtn");
    const icon = trackItem.querySelector(".soundIcon");
    const src = trackItem.dataset.src;

    if (!src || !waveContainer || !btn || !icon) return null;

    // 念のため初期化
    waveContainer.innerHTML = "";

    const ws = WaveSurfer.create({
      container: waveContainer,
      waveColor: "#888",
      progressColor: "#333",
      height: 20,
      backend: "MediaElement", // ← 安定化
      normalize: true,
      cursorWidth: 0,
    });

    // ★ # 対策（最重要）
    ws.load(encodeURI(src));

    // ★ 読み込み完了後に描画保証
    ws.on("ready", () => {
      try {
        ws.drawer?.setWidth?.(waveContainer.clientWidth);
        ws.drawBuffer?.();
      } catch (e) {}
    });

    // 再生ボタン
    btn.addEventListener("click", () => {
      // 他の曲を止める
      waveMap.forEach(({ ws: otherWs, icon: otherIcon }, otherTrack) => {
        if (otherWs !== ws) {
          otherWs.pause();
          otherIcon.src = "images/button/play_button.png";
          otherTrack.classList.remove("is-playing");
        }
      });

      ws.playPause();

      const playing = ws.isPlaying();
      icon.src = playing
        ? "images/button/pause_button.png"
        : "images/button/play_button.png";

      trackItem.classList.toggle("is-playing", playing);
    });

    ws.on("finish", () => {
      icon.src = "images/button/play_button.png";
      trackItem.classList.remove("is-playing");
    });

    const obj = { ws, icon };
    waveMap.set(trackItem, obj);
    return obj;
  }

  // ================================
  // パネルをアクティブにしたとき
  // ================================
  function activatePanel(panel) {
    const items = panel.querySelectorAll(".track-item");

    // まだ作ってない波形を生成
    items.forEach((item) => ensureWave(item));

    // 表示後の再描画（display切替対策）
    requestAnimationFrame(() => {
      items.forEach((item) => {
        const data = waveMap.get(item);
        if (!data) return;

        const { ws } = data;
        const wave = item.querySelector(".wave");

        if (!wave || !wave.clientWidth) return;

        try {
          ws.drawer?.setWidth?.(wave.clientWidth);
          ws.drawBuffer?.();
        } catch (e) {}
      });
    });
  }

  // ================================
  // タブ切り替え
  // ================================
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

  // 初期表示
  const initial =
    document.querySelector(".tab-btn.is-active")?.dataset.tab || "demo";

  switchTab(initial);
});
