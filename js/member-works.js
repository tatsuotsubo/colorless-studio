// js/member-works.js
// メンバーページ（natsume.html / alpha.html）の Works。
// foriio の公開 API から作品一覧を読み込み、HP のデザインで並べる。
// クリックすると HP 内のモーダルで詳細（動画は埋め込み）を表示する。
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-foriio]');
  if (!root) return;

  const user = root.dataset.foriio;
  const fallbackUrl = root.dataset.foriioUrl;
  const API = 'https://api.foriio.com/api/v1/users/' + encodeURIComponent(user) + '/works';
  const grid = root.querySelector('.mw-grid');
  const chipsWrap = root.querySelector('.mw-chips');
  const modal = document.getElementById('mwModal');

  let works = [];
  const details = new Map();

  /* ---------- 小さな道具 ---------- */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const fmtDate = (s) => (s || '').slice(0, 7).replace('-', '.');
  // 文字列中の URL だけをリンクにする（HTML は解釈しない）
  const linkify = (target, text) => {
    const re = /(https?:\/\/[^\s]+)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) target.append(text.slice(last, m.index));
      const a = el('a', null, m[1]);
      a.href = m[1]; a.target = '_blank'; a.rel = 'noopener';
      target.append(a);
      last = m.index + m[1].length;
    }
    if (last < text.length) target.append(text.slice(last));
  };
  const img = (src, cls) => {
    const i = el('img', cls);
    i.src = src; i.alt = ''; i.loading = 'lazy'; i.decoding = 'async';
    i.referrerPolicy = 'no-referrer';
    i.addEventListener('error', () => { i.style.visibility = 'hidden'; });
    return i;
  };

  /* ---------- 一覧 ---------- */
  const skeleton = () => {
    grid.innerHTML = '';
    for (let i = 0; i < 12; i++) grid.append(el('div', 'mw-card mw-card--skeleton'));
  };

  const fail = () => {
    grid.innerHTML = '';
    const p = el('p', 'mw-empty', '作品を読み込めませんでした。 ');
    const a = el('a', null, 'foriio で見る ↗');
    a.href = fallbackUrl; a.target = '_blank'; a.rel = 'noopener';
    p.append(a);
    grid.append(p);
  };

  const render = (filter) => {
    grid.innerHTML = '';
    works.forEach((w, i) => {
      if (filter && filter !== 'all' && !(w.category_list || []).includes(filter)) return;
      const b = el('button', 'mw-card');
      b.type = 'button';
      b.dataset.i = i;
      b.style.setProperty('--d', String(Math.min(i, 16)));
      const media = el('span', 'mw-card__media');
      media.append(img(w.thumbnail, 'mw-card__bg'), img(w.thumbnail, 'mw-card__img'));
      if (w.type === 'video') media.append(el('span', 'mw-card__play', '▶'));
      const meta = el('span', 'mw-card__meta', [fmtDate(w.published_at), (w.category_list || []).join(' / ')].filter(Boolean).join(' · '));
      b.append(media, el('span', 'mw-card__title', w.title), meta);
      b.addEventListener('mouseenter', () => loadDetail(w), { once: true });
      b.addEventListener('click', () => open(i));
      grid.append(b);
    });
  };

  const buildChips = () => {
    const seen = [];
    works.forEach((w) => (w.category_list || []).forEach((c) => { if (!seen.includes(c)) seen.push(c); }));
    const order = (root.dataset.cats || '').split('|').filter(Boolean);
    const cats = [...order.filter((c) => seen.includes(c)), ...seen.filter((c) => !order.includes(c))];
    chipsWrap.innerHTML = '';
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

  const load = async () => {
    skeleton();
    try {
      let page = 1, total = 1;
      const all = [];
      do {
        const r = await fetch(API + '?page=' + page);
        if (!r.ok) throw new Error(r.status);
        const j = await r.json();
        all.push(...(j.works || []));
        total = (j.meta && j.meta.total_pages) || 1;
        page++;
      } while (page <= total && page <= 10);
      works = all.filter((w) => !w.is_nsfw);
      if (!works.length) throw new Error('empty');
      buildChips();
      render('all');
    } catch (e) {
      fail();
    }
  };

  /* ---------- 詳細（モーダル） ---------- */
  const loadDetail = (w) => {
    if (!details.has(w.signed_ref)) {
      details.set(w.signed_ref, fetch(API + '/' + encodeURIComponent(w.signed_ref))
        .then((r) => (r.ok ? r.json() : null)).then((j) => (j && j.work) || null).catch(() => null));
    }
    return details.get(w.signed_ref);
  };

  const embedFor = (d) => {
    const v = d && d.videos && d.videos[0];
    if (!v) return null;
    if (v.platform === 'youtube' && v.video_id) return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.video_id) + '?autoplay=1&rel=0';
    const nico = (v.url || '').match(/(sm\d+)/);
    if (nico) return 'https://embed.nicovideo.jp/watch/' + nico[1] + '?autoplay=1';
    return null;
  };
  const linkFor = (d) => {
    if (!d) return '';
    const pick = (arr) => (arr && arr[0] && (arr[0].url || arr[0].source_url)) || '';
    return pick(d.web_articles) || pick(d.videos) || pick(d.sounds) || '';
  };

  let cur = -1;
  const mMedia = modal.querySelector('.mw-modal__media');
  const mTitle = modal.querySelector('.mw-modal__title');
  const mMeta = modal.querySelector('.mw-modal__meta');
  const mDesc = modal.querySelector('.mw-modal__desc');
  const mLink = modal.querySelector('.mw-modal__link');

  const fill = async (i) => {
    const w = works[i];
    cur = i;
    mMedia.innerHTML = '';
    mMedia.append(img(w.thumbnail, 'mw-modal__bg'), img(w.thumbnail, 'mw-modal__img'));
    mTitle.textContent = w.title;
    mMeta.textContent = [fmtDate(w.published_at), (w.category_list || []).join(' / ')].filter(Boolean).join(' · ');
    mDesc.textContent = '';
    mLink.hidden = true;
    const d = await loadDetail(w);
    if (cur !== i) return;
    const src = embedFor(d);
    if (src) {
      const f = el('iframe', 'mw-modal__frame');
      f.src = src;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.title = w.title;
      mMedia.innerHTML = '';
      mMedia.append(f);
    }
    const text = ((d && d.description) || '').trim();
    if (text) linkify(mDesc, text.length > 600 ? text.slice(0, 600) + '…' : text);
    const url = linkFor(d);
    if (url) { mLink.href = url; mLink.hidden = false; }
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
    if (k < 0 || !vis.length) return;
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

  load();
});
