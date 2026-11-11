#!/usr/bin/env python3
"""colorless studio HP — 全ページ生成

使い方:  python3 _build/build.py 20261111f   （引数は CSS/JS のキャッシュ用バージョン。CSS/JS を変えたら上げる）

生成するページ（リポジトリ直下に書き出す。直接編集しない）:
  index.html       ホーム（トップ動画・About・メニュー・最新リリース）
  gallery.html     Gallery
  release.html     New Release
  visualiser.html  Visualiser
  artist.html      Artist
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
    ("gallery", "gallery.html", "Gallery", "01"),
    ("release", "release.html", "New Release", "02"),
    ("visualiser", "visualiser.html", "Visualiser", "03"),
    ("artist", "artist.html", "Artist", "04"),
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


def page_gallery():
    cards = gallery_cards()
    grid = "".join(f"\n      <div class=\"gal-item\" data-reveal style=\"--r:{(i * 37) % 7 - 3}\">{c}</div>" for i, c in enumerate(cards))
    return kv("gallery") + f'''
<main id="content">
<section id="scatter">
{P["gallery_stage"]}
</section>

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
    return kv("visualiser") + f'''
<main id="content">
{body}
{next_link("visualiser")}
</main>
'''


def page_artist():
    body = strip_h2(P["artist"]).replace('<div class="Artist">', '<div class="Artist" data-reveal>')
    body = body.replace('<section id="artist" data-slider="artist">', '<section id="artist" data-slider="artist">\n' + section_head("Artist"))
    about = P["about"].replace('<div class="about-wrapper">', '<div class="about-wrapper" data-reveal>')
    return kv("artist") + f'''
<main id="content">
{about}
{body}
{next_link("artist")}
</main>
'''


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
    "release": ("New Release — colorless studio", ["scatter-modal", "music-preview", "release-v3"], page_release, None),
    "visualiser": ("Visualiser — colorless studio", ["visualiser-tab"], page_visualiser, None),
    "artist": ("Artist — colorless studio", [], page_artist, None),
    "contact": ("Contact us — colorless studio", [], page_contact, None),
}

for key, (title, scripts, fn, bd) in SPEC.items():
    bdsrc = bd or KV[key]["videos"][0]["src"]
    page = (head(title, DESC, scripts) + backdrop(bdsrc).replace("{PAGE}", key)
            + (loader() if key == "home" else "") + header(key) + fn()
            + (HOME_END if key == "home" else footer()))
    (ROOT / FILE[key]).write_text(page, encoding="utf-8")
    print("wrote", FILE[key], len(page))
print("v=" + V)
