#!/usr/bin/env python3
"""colorless studio HP — 全ページ生成

使い方:  python3 _build/build.py 20261111f   （引数は CSS/JS のキャッシュ用バージョン。CSS/JS を変えたら上げる）

生成するページ（リポジトリ直下に書き出す。直接編集しない）:
  index.html       ホーム（トップ動画・About・メニュー・最新リリース）
  gallery.html     Gallery
  release.html     Release
  visualiser.html  Visualiser
  artist.html      About Us
  contact.html     Contact us

編集するもの:
  _build/releases.json       New Release の一覧（先頭が最新）
  _build/kv.json             各ページのキービジュアル（動画・レイアウト・見出し）
  _build/parts/*.html        ページの中身（about / gallery_stage / modal / visualiser / artist / hero_home）
"""
import json, html, re, textwrap, sys
from pathlib import Path

HERE = Path(__file__).parent
ROOT = HERE.parent
V = sys.argv[1] if len(sys.argv) > 1 else "dev"
E = html.escape

releases = json.loads((HERE / "releases.json").read_text(encoding="utf-8"))
KV = json.loads((HERE / "kv.json").read_text(encoding="utf-8"))
P = {p.stem: p.read_text(encoding="utf-8") for p in (HERE / "parts").glob("*.html")}

FORM = "https://forms.gle/ysjVeLeQBovMZLsK8"
MAIL = "colorless.studio.official@gmail.com"

PAGES = [  # (key, file, label, no)
    ("artist", "artist.html", "About Us", "01"),
    ("gallery", "gallery.html", "Gallery", "02"),
    ("release", "release.html", "Release", "03"),
    ("visualiser", "visualiser.html", "Visualiser", "04"),
    ("contact", "contact.html", "Contact us", "05"),
]
FILE = {k: f for k, f, _, _ in PAGES}
FILE["home"] = "index.html"

KIND_LABEL = {"album": "album", "samplepack": "sample pack", "tool": "tool", "single": "single", "live": "live"}

SNS = [("X", "https://x.com/colorless_ST"), ("Instagram", "https://www.instagram.com/colorless.studio.official/"),
       ("TikTok", "https://www.tiktok.com/@colorless_studio"), ("YouTube", "https://www.youtube.com/@colorless_studio_official")]
STORE = [("Booth", "https://colorless-studio.booth.pm/"), ("Payhip", "https://payhip.com/colorlessstudio"),
         ("SoundCloud", "https://www.soundcloud.com/colorless-studio"), ("Bandcamp", "https://colorlessstudio.bandcamp.com/")]


# ------------------------------------------------------------------ 共通パーツ
def head(title, desc, scripts):
    js = "\n".join(f'  <script src="js/{s}.js?v={V}" defer></script>' for s in scripts)
    wave = '  <script src="https://unpkg.com/wavesurfer.js"></script>\n' if "scatter-modal" in scripts else ""
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#EAEFF1">
  <title>{E(title)}</title>
  <meta name="description" content="{E(desc)}">
  <link rel="icon" href="images/logo/CS_logo_icon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/reset.css?v={V}">
  <link rel="stylesheet" href="css/style.css?v={V}">
  <script>document.documentElement.classList.add('js');try{{if(sessionStorage.getItem('cs-pt'))document.documentElement.classList.add('pt-enter')}}catch(e){{}}</script>
{wave}  <script src="js/site.js?v={V}" defer></script>
  <script src="js/hamburger-menu.js?v={V}" defer></script>
{js}
</head>
'''


def header(current):
    items = [("home", "Home", "00")] + [(k, lab, n) for k, _, lab, n in PAGES]
    lis = ""
    for k, lab, n in items:
        cur = ' aria-current="page"' if k == current else ""
        lis += f'\n          <li class="active"><a href="{FILE[k]}"{cur}><span class="menu-no">{n}</span>{lab}</a></li>'
    contact_cur = ' aria-current="page"' if current == "contact" else ""
    return f'''
<!-- ヘッダー -->
<header id="header">
  <div class="header-left">
    <div class="hamburger-menu">
      <div class="hamburger-icon" role="button" aria-label="menu" tabindex="0">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <!-- Menu -->
      <nav class="menu">
        <ul>{lis}
        </ul>
      </nav>
    </div>
  </div>

  <div class="header-center">
    <a href="index.html" class="header-home" aria-label="colorless studio home"><img src="images/logo/CS_logo.png" alt="colorless studio" class="header-logo"></a>
  </div>

  <div class="header-right">
    <a href="contact.html" class="contact-btn"{contact_cur}>Contact us</a>
  </div>
</header>
'''


def backdrop(src):
    return f'''<body class="page-{{PAGE}}">
<!-- 背景：visualiser と同じ「ぼかした動画＋淡いスカイ」 -->
<div class="backdrop" aria-hidden="true">
  <video autoplay muted loop playsinline preload="auto" src="{E(src)}"></video>
</div>

<!-- ページ遷移の幕 -->
<div class="pt" aria-hidden="true">
  <div class="pt__panel"></div>
  <img class="pt__logo" src="images/logo/CS_logo.png" alt="">
</div>
'''


def loader():
    word = "colorless studio"
    chars = "".join(f'<span style="--i:{i}">{" " if c == " " else E(c)}</span>' for i, c in enumerate(word))
    return f'''
<!-- 最初の読み込み（ホームのみ・1セッション1回） -->
<div class="loader" aria-hidden="true">
  <div class="loader__inner">
    <img class="loader__logo" src="images/logo/CS_logo.png" alt="">
    <p class="loader__word">{chars}</p>
    <div class="loader__bar"><i></i></div>
  </div>
</div>
'''


def split(text):
    """見出しを1文字ずつのspanに（文字アニメ用）"""
    out, i = [], 0
    for word in text.split(" "):
        cs = "".join(f'<span class="ch" style="--i:{(i := i + 1)}">{E(c)}</span>' for c in word)
        out.append(f'<span class="w">{cs}</span>')
    return " ".join(out)


def kv(key):
    k = KV[key]
    vids = k["videos"]
    layout = k.get("layout", "single")
    panes = ""
    for i, v in enumerate(vids):
        poster = f' poster="{E(v["poster"])}"' if v.get("poster") else ""
        panes += (f'\n    <div class="kv__pane" style="--d:{i}"><video autoplay muted loop playsinline preload="auto"'
                  f'{poster} src="{E(v["src"])}"></video></div>')
    no = next(n for kk, _, _, n in PAGES if kk == key)
    title = next(lab for kk, _, lab, _ in PAGES if kk == key)
    return f'''
<!-- キービジュアル -->
<section class="kv kv--{layout}" data-kv>
  <div class="kv__media">{panes}
  </div>
  <div class="kv__veil"></div>
  <div class="kv__text">
    <h1 class="kv__title" data-split>{split(title)}</h1>
  </div>
  <a class="kv__scroll" href="#content" aria-label="scroll"><span>scroll</span><i></i></a>
</section>
'''


def marquee(words):
    seq = "".join(f'<span>{E(w)}</span><i aria-hidden="true">✳︎</i>' for w in words)
    return f'''
<div class="marquee" aria-hidden="true"><div class="marquee__track">{seq}{seq}</div></div>
'''


def next_link(key):
    keys = [k for k, _, _, _ in PAGES]
    i = keys.index(key)
    nk = keys[(i + 1) % len(keys)]
    lab = next(l for k, _, l, _ in PAGES if k == nk)
    v = KV[nk]["videos"][0]["src"]
    return f'''
<!-- 次のページへ -->
<a class="next-page" href="{FILE[nk]}" data-reveal>
  <video class="next-page__video" muted loop playsinline preload="none" src="{E(v)}"></video>
  <span class="next-page__label">next</span>
  <span class="next-page__title">{E(lab)}</span>
  <span class="next-page__arrow" aria-hidden="true">→</span>
</a>
'''


def footer():
    """各ページの一番下：ホームと同じ（左に名前、右に SNS）"""
    sns = "".join(f'<a href="{u}" target="_blank" rel="noopener">{n}</a>' for n, u in SNS)
    return f'''
<footer class="site-foot">
  <p class="site-foot__name">colorless studio</p>
  <div class="site-foot__sns">{sns}</div>
</footer>

</body>
</html>
'''


# ------------------------------------------------------------------ Release
def track_slide(label, ul):
    n = ul.count("<li")
    body = textwrap.indent(textwrap.dedent(ul).strip("\n"), " " * 18)
    return f'''
            <section class="rel-slide rel-slide--list" aria-label="{E(label)}">
              <div class="music-info">
                <ul>
{body}
                </ul>
              </div>
            </section>''', label, n


def tracklist_slide(items, label="tracklist"):
    lis = "".join(f'\n                <li><span class="tl-no">{i:02d}</span><span class="tl-title">{E(t)}</span><span class="tl-artist">{E(a)}</span></li>'
                  for i, (t, a) in enumerate(items, 1))
    return f'''
            <section class="rel-slide rel-slide--list" aria-label="{E(label)}">
              <ol class="tracklist">{lis}
              </ol>
            </section>''', label, len(items)


def release_item(r, with_tracks=True):
    w, h = r["size"]
    img = r["img"]
    vid = (f'\n              <video class="music-video" src="{E(r["video"])}" muted loop playsinline preload="none"></video>'
           if r.get("video") else "")
    slides = []
    if with_tracks:
        if r.get("tracklist"):
            slides.append(tracklist_slide(r["tracklist"]))
        slides += [track_slide(lab, ul) for lab, ul in r.get("tracks", [])]
    date = f'\n          <span class="rel-date">{E(r["date"])}</span>' if r.get("date") else ""
    href = r.get("href")
    open_tag = (f'<a class="rel-media click" href="{E(href)}" target="_blank" rel="noopener noreferrer">' if href
                else '<div class="rel-media">')
    close_tag = "</a>" if href else "</div>"
    shape = "is-wide" if w / h > 1.15 else ("is-tall" if h / w > 1.15 else "is-square")
    media = f'''{open_tag}
          <div class="music-art-wrap">
              <img class="music-art-bg" src="{E(img)}" alt="" aria-hidden="true" loading="lazy" decoding="async">
              <img class="music-art" src="{E(img)}" alt="{E(r["title"])}" width="{w}" height="{h}" loading="lazy" decoding="async">{vid}
          </div>
        {close_tag}'''
    tabs = ""
    if slides:
        media = ('''<div class="rel-slider">
          <div class="rel-slides">
            <div class="rel-slide rel-slide--cover">
        ''' + media + '''
            </div>''' + "".join(html for html, _, _ in slides) + '''
          </div>
          <button class="rel-arrow rel-arrow--prev" type="button" aria-label="前へ" disabled></button>
          <button class="rel-arrow rel-arrow--next" type="button" aria-label="次へ"></button>
        </div>''')
        btns = '<button type="button" class="rel-tab is-active" data-i="0">cover</button>'
        for i, (_, lab, n) in enumerate(slides, 1):
            btns += f'<button type="button" class="rel-tab" data-i="{i}">{E(lab)}<span class="rel-count">{n}</span></button>'
        tabs = f'\n        <div class="rel-tabs">{btns}</div>'
    cls = "rel " + shape + (" has-slides" if slides else "")
    return f'''
      <!-- {E(r["title"])} -->
      <article class="{cls}" data-kind="{r["kind"]}" data-reveal>
        {media}
        <div class="rel-meta">
          <h3 class="rel-title">{E(r["title"])}</h3>
          <span class="rel-kind">{KIND_LABEL[r["kind"]]}</span>{date}
        </div>{tabs}
      </article>'''


def release_grid(items, with_tracks=True):
    return "".join(release_item(r, with_tracks) for r in items)


def release_filter():
    chips = '<button type="button" class="chip is-active" data-filter="all">All</button>'
    for k in ["album", "samplepack", "tool", "single", "live"]:
        if any(r["kind"] == k for r in releases):
            chips += f'<button type="button" class="chip" data-filter="{k}">{KIND_LABEL[k]}</button>'
    return f'<div class="rel-filter" role="group" aria-label="filter">{chips}</div>'


# ------------------------------------------------------------------ ページ本体
def strip_h2(s):
    return re.sub(r"\n\s*<h2>[^<]*</h2>\n", "\n", s, count=1)


def section_head(title, note=""):
    return f'''  <div class="sec-head" data-reveal>
    <h2>{E(title)}</h2>{f'<p class="sec-note">{E(note)}</p>' if note else ''}
  </div>
'''


# ホームのタイル（kv.json の何本目の軽い映像を使うか）。
# ホバー時の背景は videos/home/<key>.mp4（フルHD・切り抜きなし）＋ images/home/<key>.jpg
HOME_TILE = {"gallery": 0, "release": 1, "visualiser": 1, "artist": 1, "contact": 0}


def page_home():
    """ホーム：スクロールしない1画面。右に映像タイルのメニュー。
    タイルにホバーすると少し拡大し、背景がそのページの映像に切り替わる"""
    layers, tiles = "", ""
    for k, f, lab, n in PAGES:
        vids = KV[k]["videos"]
        # 背景はホーム専用のフル解像度版（videos/home/<key>.mp4）。パネル用の切り抜き版は使わない（荒くなる）
        bg = {"src": f"videos/home/{k}.mp4", "poster": f"images/home/{k}.jpg"}
        tv = vids[min(HOME_TILE[k], len(vids) - 1)]
        layers += (f'\n    <video class="home-bg__layer" data-key="{k}" muted loop playsinline preload="none"'
                   f' poster="{E(bg["poster"])}" src="{E(bg["src"])}"></video>')
        tiles += f'''
      <li style="--i:{int(n)}">
        <a class="home-tile" href="{f}" data-key="{k}">
          <video class="home-tile__video" autoplay muted loop playsinline preload="auto" poster="{E(tv["poster"])}" src="{E(tv["src"])}"></video>
          <span class="home-tile__shade"></span>
          <span class="home-tile__no">{n}</span>
          <span class="home-tile__title">{lab}</span>
          <span class="home-tile__arrow" aria-hidden="true">→</span>
        </a>
      </li>'''
    sns = "".join(f'<a href="{u}" target="_blank" rel="noopener">{n}</a>' for n, u in SNS)
    return P["hero_home"].replace("</section>", f'''
  <!-- ホバーしたページの映像に切り替わる背景 -->
  <div class="home-bg" aria-hidden="true">{layers}
  </div>

  <!-- 1画面のホーム：映像タイルのメニュー -->
  <nav class="home-nav" aria-label="pages">
    <ul>{tiles}
    </ul>
  </nav>

  <div class="home-meta">
    <p class="home-meta__name">colorless studio</p>
  </div>

  <div class="home-sns">{sns}</div>
</section>''', 1)


def gallery_cards():
    """sushiSource のカードから一覧用のカードを作る"""
    return re.findall(r'<a class="scatter-card".*?</a>', P["gallery_stage"], re.S)


def gallery_source():
    """流れるジャケ（寿司レーン）は表示しない。モーダルの元データとしてだけ置く"""
    return ('<div id="sushiSource" data-source-only hidden>'
            + "".join(gallery_cards()) + '</div>')


def page_gallery():
    cards = gallery_cards()
    grid = "".join(f"\n      <div class=\"gal-item\" data-reveal style=\"--r:{(i * 37) % 7 - 3}\">{c}</div>" for i, c in enumerate(cards))
    return kv("gallery") + f'''
<main id="content">
{gallery_source()}

<section class="gal-all">
{section_head("Archive")}
  <div class="gal-grid">{grid}
  </div>
</section>
{next_link("gallery")}
</main>

{P["modal"]}
'''


def page_release():
    return kv("release") + f'''
<main id="content">
<section id="music">
  {release_filter()}
  <div class="rel-grid">{release_grid(releases)}
  </div>
</section>
{next_link("release")}
</main>
'''


def page_visualiser():
    body = strip_h2(P["visualiser"]).replace('<div class="vis-panel">', '<div class="vis-panel" data-reveal>')
    # visualiser 本体を更新したら必ず新しい版が読まれるよう、中身のハッシュを URL に付ける
    import hashlib
    vh = hashlib.md5((ROOT / "visualiser" / "index.html").read_bytes()).hexdigest()[:10]
    vsrc = f"visualiser/index.html?v={vh}"
    body = body.replace('<iframe class="vis-frame" id="visFrame"', f'<iframe class="vis-frame" id="visFrame" data-src="{vsrc}"')
    body = body.replace('href="visualiser/index.html"', f'href="{vsrc}"')
    return kv("visualiser") + f'''
<main id="content">
{body}
{next_link("visualiser")}
</main>
'''


def page_artist():
    about = P["about"].replace('<div class="about-wrapper">', '<div class="about-wrapper" data-reveal>')
    # ページ名（About Us）と重複する見出しは出さない
    about = re.sub(r'\s*<h2 class="about-title">.*?</h2>', '', about, count=1, flags=re.S)
    return kv("artist") + f'''
<main id="content">
{about}
{member_cards()}
{next_link("artist")}
</main>
'''



# ------------------------------------------------------------------ メンバー（About Us のカード → 個別ページ）
MEMBERS = [
    {
        "key": "natsume", "file": "natsume.html", "name": "natsume",
        "role": "Composer / Sound Designer / Music Producer / Manipulator",
        "img": "images/artist/guitar.jpg",
        "foriio": "https://www.foriio.com/natsume0465", "foriio_user": "natsume0465",
        "cats": ["作曲", "編曲", "Remix", "MIx - Mastering"],
        "form": "https://forms.gle/DxaPEA6bQQMPRxas5",
        "works": [
            "Lir.E 2nd ワンマンライブ「愛について：REC」　Manipulator",
            "あおぎり高校　春雨麗女 1st ONE-MAN LIVE「submerge of spring」　Manipulator",
            "bit-chan　1st single　「あのゆめ」　作詞作曲",
            "Compilation Album / ユシナ & kohe - 多重合成音声　「fragment」作詞作曲",
            "Compilation Album / NEXTLIGHT - NX REALM　「fade」作詞作曲",
            "Compilation Album / wagataki - 透明の瞬き　「ひかり」　作編曲",
            "すぺしゃりてフェス #05 STREET FIGHTER 6 OP　BGM制作",
        ],
        "links": [
            ("X", "https://x.com/koshianko_0465"),
            ("YouTube", "https://www.youtube.com/@natsume-music"),
            ("Instagram", "https://instagram.com/oshiruko_0465"),
            ("SoundCloud", "https://soundcloud.com/user-37796398"),
            ("niconico", "https://www.nicovideo.jp/user/126239780"),
            ("Streaming", "https://linkco.re/TZ7ZeMM2"),
            ("pixivFANBOX", "https://natsume0465.fanbox.cc/"),
        ],
    },
    {
        "key": "alpha", "file": "alpha.html", "name": "alpha",
        "role": "Composer / Sound Designer / Music Producer",
        "img": "images/artist/panda.jpg",
        "foriio": "https://www.foriio.com/alphanium", "foriio_user": "alphanium",
        "cats": ["inst/BGM制作", "ボーカル曲制作", "個人制作", "整音"],
        "form": "https://docs.google.com/forms/d/e/1FAIpQLSdZc_pFKcuENPU7SAxjXQI1N2Rz0HOgiYGGd9JfyFECqcR7uQ/viewform?usp=send_form",
        "works": [
            "スマートフォン向けゲームアプリ「無期迷途」　BGM制作,ゲーム内楽曲制作",
            "楽園プロジェクト(ナイトプールremix) - 兎迷夢々　楽曲リアレンジ制作",
            "百鬼あやめ 7周年記念ライブ ライブOP 　BGM制作",
            "兎田ぺこら 6周年記念ライブ / SE,BGM制作",
            "LOG IN: GAME START #ROCKINBiboo ライブOP　BGM制作",
            "ホロライブ × ジョイポリス「SWEETY PARTY」　イベント幕間BGM制作",
        ],
        "links": [
            ("X", "https://x.com/_alphanium_"),
            ("YouTube", "https://www.youtube.com/@_alphanium_"),
            ("Instagram", "https://www.instagram.com/alphanium"),
            ("SoundCloud", "https://soundcloud.com/superalpha"),
            ("Spotify", "https://open.spotify.com/intl-ja/artist/0sQYQk5Q0asffq6qDNG9VT"),
            ("Apple Music", "https://music.apple.com/jp/artist/%E3%81%82%E3%82%8B%E3%81%B5%E3%81%81/1810330648"),
            ("bandcamp", "https://alphanium.bandcamp.com/"),
            ("pixivFANBOX", "https://alphanium.fanbox.cc/"),
            ("skeb", "https://skeb.jp/@_alphanium_"),
        ],
    },
]
for _m in MEMBERS:
    FILE[_m["key"]] = _m["file"]


def member_cards():
    cards = ""
    for i, m in enumerate(MEMBERS):
        cards += f"""
    <a class="member-card" href="{m['file']}" data-reveal style="--i:{i}">
      <span class="member-card__media"><img src="{E(m['img'])}" alt="{E(m['name'])}" loading="lazy"></span>
      <span class="member-card__meta">
        <span class="member-card__name">{E(m['name'])}</span>
        <span class="member-card__role">{E(m['role'])}</span>
      </span>
      <span class="member-card__arrow" aria-hidden="true">→</span>
    </a>"""
    return f"""<section id="artist">
{section_head("Artist")}  <div class="member-cards">{cards}
  </div>
</section>"""


def page_member(m):
    works = "".join(f"\n          <li>{E(w)}</li>" for w in m["works"])
    links = "".join(f'<a class="member__pill" href="{E(u)}" target="_blank" rel="noopener">{E(n)}</a>' for n, u in m["links"] + [("foriio", m["foriio"])])
    return f"""
<main class="member" id="content">
  <aside class="member__side">
    <a class="member__back" href="artist.html"><span aria-hidden="true">←</span> About Us</a>
    <div class="member__head">
      <img class="member__img" src="{E(m['img'])}" alt="{E(m['name'])}">
      <div>
        <h1 class="member__name" data-split>{split(m['name'])}</h1>
        <p class="member__role">{E(m['role'])}</p>
      </div>
    </div>
    <div class="member__works">
      <ul>{works}
      </ul>
    </div>
    <div class="member__cta">
      <a class="member__btn member__btn--primary" href="{E(m['form'])}" target="_blank" rel="noopener">{E(m['name'])} に依頼する <span aria-hidden="true">↗</span></a>
    </div>
    <div class="member__links">{links}</div>
  </aside>
  <section class="member__portfolio" aria-label="{E(m['name'])} works" data-foriio="{E(m['foriio_user'])}" data-foriio-url="{E(m['foriio'])}" data-cats="{E('|'.join(m['cats']))}">
    <div class="member__bar">
      <span class="member__bar-title">Works</span>
      <div class="mw-chips"></div>
    </div>
    <div class="mw-grid"></div>
  </section>
</main>

<div class="mw-modal" id="mwModal" hidden>
  <div class="mw-modal__card" role="dialog" aria-modal="true">
    <button class="mw-modal__close" type="button" data-mw-close aria-label="閉じる">×</button>
    <div class="mw-modal__media"></div>
    <div class="mw-modal__info">
      <p class="mw-modal__meta"></p>
      <h2 class="mw-modal__title"></h2>
      <p class="mw-modal__desc"></p>
      <div class="mw-modal__actions">
        <button class="mw-modal__prev" type="button" aria-label="前へ">←</button>
        <button class="mw-modal__next" type="button" aria-label="次へ">→</button>
        <a class="mw-modal__link member__btn member__btn--primary" href="#" target="_blank" rel="noopener" hidden>開く <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </div>
</div>
"""


def page_contact():
    sns = "".join(f'<a class="pill" href="{u}" target="_blank" rel="noopener">{n} <span aria-hidden="true">↗</span></a>' for n, u in SNS)
    store = "".join(f'<a class="pill" href="{u}" target="_blank" rel="noopener">{n} <span aria-hidden="true">↗</span></a>' for n, u in STORE)
    return kv("contact") + f'''
<main id="content">
<section class="contact">
  <div class="contact__grid">
    <div class="contact__cards">
      <a class="contact-card contact-card--primary" href="{FORM}" target="_blank" rel="noopener" data-reveal>
        <span class="contact-card__label">form</span>
        <span class="contact-card__title">お問い合わせフォーム</span>
        <span class="contact-card__arrow" aria-hidden="true">↗</span>
      </a>
      <a class="contact-card" href="mailto:{MAIL}?subject=お問い合わせ" data-reveal>
        <span class="contact-card__label">mail</span>
        <span class="contact-card__title">{MAIL}</span>
        <span class="contact-card__arrow" aria-hidden="true">→</span>
      </a>
      <div class="contact-card contact-card--list" data-reveal>
        <span class="contact-card__label">sns</span>
        <div class="pills">{sns}</div>
      </div>
      <div class="contact-card contact-card--list" data-reveal>
        <span class="contact-card__label">store</span>
        <div class="pills">{store}</div>
      </div>
    </div>
  </div>
</section>
{next_link("contact")}
</main>
'''


# ------------------------------------------------------------------ 書き出し
HOME_END = """
</body>
</html>
"""
DESC = "colorless studio — 透明感・淡い色彩・光の屈折や反射をテーマにした音と映像の活動組織。ambient / IDM / botanica / petal core."
SPEC = {
    # key: (title, scripts, body_fn, backdrop video)
    "home": ("colorless studio", [], page_home, "videos/colorless_bg_fix.mp4"),
    "gallery": ("Gallery — colorless studio", ["scatter-modal"], page_gallery, None),
    "release": ("Release — colorless studio", ["scatter-modal", "music-preview", "release-v3"], page_release, None),
    "visualiser": ("Visualiser — colorless studio", ["visualiser-tab"], page_visualiser, None),
    "artist": ("About Us — colorless studio", [], page_artist, None),
    "contact": ("Contact us — colorless studio", [], page_contact, None),
}

for key, (title, scripts, fn, bd) in SPEC.items():
    bdsrc = bd or KV[key]["videos"][0]["src"]
    page = (head(title, DESC, scripts) + backdrop(bdsrc).replace("{PAGE}", key)
            + (loader() if key == "home" else "") + header(key) + fn()
            + (HOME_END if key == "home" else footer()))
    (ROOT / FILE[key]).write_text(page, encoding="utf-8")
    print("wrote", FILE[key], len(page))
for m in MEMBERS:
    page = (head(f"{m['name']} — colorless studio", DESC, ["member-works"]) + backdrop(KV["artist"]["videos"][0]["src"]).replace("{PAGE}", "member")
            + header("artist") + page_member(m) + "\n</body>\n</html>\n")
    (ROOT / m["file"]).write_text(page, encoding="utf-8")
    print("wrote", m["file"], len(page))
print("v=" + V)
