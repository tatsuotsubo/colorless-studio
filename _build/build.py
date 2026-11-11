#!/usr/bin/env python3
"""colorless studio HP — index.html 生成

使い方:  python3 _build/build.py 20261111d   （引数は CSS/JS のキャッシュ用バージョン。CSS/JS を変えたら上げる）

- ページ全体の元:  _build/template.html  （Release 以外はここを直接編集。<!--RELEASES--> の位置に一覧が入る）
- リリース一覧:    _build/releases.json  （新しいものを先頭に1件足す）
    title / kind(album|samplepack|tool|single|live) / href / img / size[w,h] / video / date / tracks[[ラベル, "<li>…</li>…"], …]
- index.html は直接編集しない（このスクリプトで上書きされる）
"""
import json, html, textwrap, sys
from pathlib import Path

HERE = Path(__file__).parent
V = sys.argv[1] if len(sys.argv) > 1 else "dev"
template = (HERE / "template.html").read_text(encoding="utf-8")
releases = json.loads((HERE / "releases.json").read_text(encoding="utf-8"))
E = html.escape

KIND_LABEL = {"album": "album", "samplepack": "sample pack", "tool": "tool", "single": "single", "live": "live"}


def track_block(label, ul):
    n = ul.count("<li")
    body = textwrap.indent(textwrap.dedent(ul).strip("\n"), " " * 14)
    return f'''
        <details class="rel-tracks">
          <summary><span class="rel-tracks__label">{E(label)}</span><span class="rel-count">{n}</span><span class="rel-plus" aria-hidden="true"></span></summary>
          <div class="music-info">
            <ul>
{body}
            </ul>
          </div>
        </details>'''


def tracklist_block(items, label="tracklist"):
    """音源なしの曲目（[曲名, アーティスト] のリスト）"""
    lis = "".join(f'\n              <li><span class="tl-no">{i:02d}</span><span class="tl-title">{E(t)}</span><span class="tl-artist">{E(a)}</span></li>'
                  for i, (t, a) in enumerate(items, 1))
    return f'''
        <details class="rel-tracks">
          <summary><span class="rel-tracks__label">{E(label)}</span><span class="rel-count">{len(items)}</span><span class="rel-plus" aria-hidden="true"></span></summary>
          <ol class="tracklist">{lis}
          </ol>
        </details>'''


def release_item(r):
    w, h = r["size"]
    img = r["img"]
    vid = (f'\n              <video class="music-video" src="{E(r["video"])}" muted loop playsinline preload="none"></video>'
           if r.get("video") else "")
    tracks = "".join(track_block(lab, ul) for lab, ul in r.get("tracks", []))
    if r.get("tracklist"):
        tracks = tracklist_block(r["tracklist"]) + tracks
    date = f'\n          <span class="rel-date">{E(r["date"])}</span>' if r.get("date") else ""
    href = r.get("href")
    open_tag = (f'<a class="rel-media click" href="{E(href)}" target="_blank" rel="noopener noreferrer">' if href
                else '<div class="rel-media">')
    close_tag = "</a>" if href else "</div>"
    shape = "is-wide" if w / h > 1.15 else ("is-tall" if h / w > 1.15 else "is-square")
    return f'''
      <!-- {E(r["title"])} -->
      <article class="rel {shape}" data-kind="{r["kind"]}">
        {open_tag}
          <div class="music-art-wrap">
              <img class="music-art-bg" src="{E(img)}" alt="" aria-hidden="true" loading="lazy" decoding="async">
              <img class="music-art" src="{E(img)}" alt="{E(r["title"])}" width="{w}" height="{h}" loading="lazy" decoding="async">{vid}
          </div>
        {close_tag}
        <div class="rel-meta">
          <h3 class="rel-title">{E(r["title"])}</h3>
          <span class="rel-kind">{KIND_LABEL[r["kind"]]}</span>{date}
        </div>{tracks}
      </article>'''


chips = f'<button type="button" class="chip is-active" data-filter="all">All</button>'
for k in ["album", "samplepack", "tool", "single", "live"]:
    if any(r["kind"] == k for r in releases):
        chips += f'<button type="button" class="chip" data-filter="{k}">{KIND_LABEL[k]}</button>'

section = f'''<section id="music">
  <h2>New Release</h2>

  <div class="rel-filter" role="group" aria-label="filter">{chips}</div>

  <!-- 一覧は _build/releases.json から生成 -->
  <div class="rel-grid">{"".join(release_item(r) for r in releases)}
  </div>
</section>'''

page = template.replace("<!--RELEASES-->", section).replace("__V__", V)
(HERE.parent / "index.html").write_text(page, encoding="utf-8")
print("ok", len(releases), "releases, v=" + V)
