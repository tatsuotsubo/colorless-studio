#!/bin/bash
# colorless tool（visualiser）の最新版を CS_HP/visualiser にコピーする（ダブルクリックで実行）
# visualiser 側で template.html を編集 → build.py を実行したあとに使う。
cd "$(dirname "$0")" || exit 1
SRC="$HOME/Documents/Claude/colorless/colorless tool"
if [ ! -f "$SRC/index.html" ]; then echo "見つかりません: $SRC"; read -r -p "Enter で閉じる"; exit 1; fi
mkdir -p visualiser
rsync -a --delete "$SRC/v/" visualiser/v/
rsync -a --delete "$SRC/daw/" visualiser/daw/
rsync -a --delete "$SRC/demo/" visualiser/demo/
cp "$SRC/index.html" visualiser/index.html
echo "visualiser を更新しました → $(pwd)/visualiser"
read -r -p "Enter で閉じる"
