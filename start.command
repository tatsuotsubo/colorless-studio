#!/bin/bash
# colorless studio HP（CS_HP）をローカルサーバーで開く（ダブルクリックで起動）
# file:// で直接開くと、WaveSurfer の波形・音声読み込みがブラウザの制限で動かないことがあるため。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8
cd "$(dirname "$0")" || exit 1
PORT=8766   # visualiser（8765）と同時に開けるよう別ポート
URL="http://localhost:$PORT/index.html"
open_browser() { open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL"; }
if curl -s -o /dev/null "http://localhost:$PORT/index.html"; then
  echo "すでに起動しています → $URL"; open_browser; exit 0
fi
if ! command -v python3 >/dev/null 2>&1 || ! python3 -c 'import http.server' >/dev/null 2>&1; then
  echo "python3 が見つかりません。ターミナルで「xcode-select --install」を実行して、もう一度開いてください。"; read -r -p "Enter で閉じる"; exit 1
fi
echo "colorless studio HP → $URL"
echo "このウィンドウを閉じる（または Ctrl+C）とサーバーが止まります。"
( sleep 1; open_browser ) &
# テキスト類は UTF-8 で返す（日本語の文字化け防止）。CSS/JS の更新がすぐ反映されるようキャッシュ無効。
exec python3 -c "
import http.server
H = http.server.SimpleHTTPRequestHandler
for ext in ('.html', '.htm', '.js', '.css', '.json', '.md', '.txt'):
    H.extensions_map[ext] = {'.html':'text/html','.htm':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.md':'text/markdown','.txt':'text/plain'}[ext] + '; charset=utf-8'
class NoCache(H):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1', $PORT), NoCache).serve_forever()
"
