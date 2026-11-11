// js/member-works.js
// メンバーページ（natsume.html / alpha.html）の Works。
// 作品データはページに埋め込んだ JSON（_build/works/<foriioユーザー名>.json から build.py が書き出す）。
// 外部サービスへの読み込みはしないので、どのブラウザでも同じように表示される。
// クリックすると HP 内のモーダルで詳細（YouTube / ニコニコは埋め込み再生）を表示する。
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-works]');
  const dataEl = document.getElementById('mwData');
  const modal = document.getElementById('mwModal');
  if (!root || !dataEl || !modal) return;

  let works = [];
  try {
    // [title, thumbnail, "cat|cat", "YYYY-MM", type(v/a/s/i), url]
    works = JSON.parse(dataEl.textContent).map(([t, th, c, d, type, url]) => ({
      t, th, cats: c ? c.split('|') : [], d, type, url,
    }));
  } catch (e) { works = []; }

  const grid = root.querySelector('.mw-grid');
  const chipsWrap = root.querySelector('.mw-chips');

  /* ---------- 小さな道具 ---------- */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const meta = (w) => [w.d.replace('-', '.'), w.cats.join(' / ')].filter(Boolean).join(' · ');
  const img = (src, cls, lazy = true) => {
    const i = el('img', cls);
    i.alt = '';
    if (lazy) i.loading = 'lazy';
    i.decoding = 'async';
    i.referrerPolicy = 'no-referrer';
    i.addEventListener('error', () => { i.style.visibility = 'hidden'; });
    i.src = src;
    return i;
  };
  const embedFor = (url) => {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([\w-]{11})/);
    if (yt) return 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?autoplay=1&rel=0';
    const nico = url.match(/nicovideo\.jp\/watch\/(sm\d+)/);
    if (nico) return 'https://embed.nicovideo.jp/watch/' + nico[1] + '?autoplay=1';
    return null;
  };

  /* ---------- 一覧 ---------- */
  const render = (filter) => {
    grid.innerHTML = '';
    let n = 0;
    works.forEach((w, i) => {
      if (filter !== 'all' && !w.cats.includes(filter)) return;
      const b = el('button', 'mw-card');
      b.type = 'button';
      b.dataset.i = i;
      b.style.setProperty('--d', String(Math.min(n++, 16)));
      const media = el('span', 'mw-card__media');
      media.append(img(w.th, 'mw-card__bg'), img(w.th, 'mw-card__img'));
      if (embedFor(w.url)) media.append(el('span', 'mw-card__play', '▶'));
      b.append(media, el('span', 'mw-card__title', w.t), el('span', 'mw-card__meta', meta(w)));
      b.addEventListener('click', () => open(i));
      grid.append(b);
    });
  };

  const buildChips = () => {
    const seen = [];
    works.forEach((w) => w.cats.forEach((c) => { if (!seen.includes(c)) seen.push(c); }));
    const order = (root.dataset.cats || '').split('|').filter(Boolean);
    const cats = [...order.filter((c) => seen.includes(c)), ...seen.filter((c) => !order.includes(c))];
    ['all', ...cats].forEach((c, k) => {
      const b = el('button', 'chip' + (k === 0 ? ' is-active' : ''), c === 'all' ? 'All' : c);
      b.type = 'button';
      b.addEventListener('click', () => {
        chipsWrap.querySelectorAll('.chip').forEach((x) => x.classList.toggle('is-active', x === b));
        render(c);
        grid.scrollTop = 0;
      });
      chipsWrap.append(b);
    });
  };

  /* ---------- 詳細（モーダル） ---------- */
  const mMedia = modal.querySelector('.mw-modal__media');
  const mTitle = modal.querySelector('.mw-modal__title');
  const mMeta = modal.querySelector('.mw-modal__meta');
  const mLink = modal.querySelector('.mw-modal__link');
  let cur = -1;

  const fill = (i) => {
    const w = works[i];
    cur = i;
    mMedia.innerHTML = '';
    const src = embedFor(w.url);
    if (src) {
      const f = el('iframe', 'mw-modal__frame');
      f.src = src;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.title = w.t;
      mMedia.append(f);
    } else {
      mMedia.append(img(w.th, 'mw-modal__bg', false), img(w.th, 'mw-modal__img', false));
    }
    mTitle.textContent = w.t;
    mMeta.textContent = meta(w);
    if (w.url) { mLink.href = w.url; mLink.hidden = false; } else { mLink.hidden = true; }
  };

  const open = (i) => {
    fill(i);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.documentElement.classList.add('mw-lock');
  };
  const close = () => {
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('mw-lock');
    cur = -1;
    setTimeout(() => { if (cur === -1) { modal.hidden = true; mMedia.innerHTML = ''; } }, 300);
  };
  const step = (dir) => {
    const vis = [...grid.querySelectorAll('.mw-card[data-i]')].map((b) => +b.dataset.i);
    const k = vis.indexOf(cur);
    if (k < 0) return;
    fill(vis[(k + dir + vis.length) % vis.length]);
  };

  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-mw-close]')) close(); });
  modal.querySelector('.mw-modal__prev').addEventListener('click', () => step(-1));
  modal.querySelector('.mw-modal__next').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  if (!works.length) {
    const p = el('p', 'mw-empty');
    const a = el('a', null, 'foriio で見る ↗');
    a.href = root.dataset.foriioUrl; a.target = '_blank'; a.rel = 'noopener';
    p.append(a);
    grid.append(p);
    return;
  }
  buildChips();
  render('all');
});
