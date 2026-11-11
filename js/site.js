// js/site.js — 全ページ共通の演出
// 1) 最初の読み込み（ホームのみ・1セッション1回）
// 2) ページ遷移（幕が下から上がって閉じる → 次のページで幕が上へ抜ける）
// 3) 見出しの文字アニメ [data-split] / スクロールで表示 [data-reveal]
// 4) キービジュアルのパララックス、ホームのメニューのホバープレビュー、次ページリンクの動画
(() => {
  const html = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    /* ---------- 1) ローダー ---------- */
    const loader = document.querySelector('.loader');
    if (loader) {
      if (store.get('cs-loaded') || reduce || html.classList.contains('pt-enter')) {
        loader.remove();
      } else {
        store.set('cs-loaded', '1');
        body.classList.add('is-loading');
        const done = () => {
          loader.classList.add('is-done');
          body.classList.remove('is-loading');
          setTimeout(() => loader.remove(), 1200);
        };
        // 最低 1.8 秒は見せて、トップ動画の準備ができたら開ける（最長 4 秒）
        const v = document.querySelector('#mainvisual video');
        let ready = !v, min = false;
        const tryDone = () => { if (ready && min) done(); };
        setTimeout(() => { min = true; tryDone(); }, 1800);
        setTimeout(() => { ready = true; tryDone(); }, 4000);
        if (v) {
          if (v.readyState >= 3) ready = true;
          else v.addEventListener('canplay', () => { ready = true; tryDone(); }, { once: true });
        }
      }
    }

    /* ---------- 2) ページ遷移 ---------- */
    if (html.classList.contains('pt-enter')) {
      store.del('cs-pt');
      requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('pt-in')));
      setTimeout(() => html.classList.remove('pt-enter', 'pt-in'), 1100);
    }

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname) return; // 同じページ内のリンクはそのまま
      e.preventDefault();
      if (reduce) { location.href = url.href; return; }
      store.set('cs-pt', '1');
      body.classList.add('pt-leave');
      setTimeout(() => { location.href = url.href; }, 650);
    });

    // 戻るボタンで戻ってきた時に幕が残らないように
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) body.classList.remove('pt-leave');
    });

    /* ---------- 3) 文字アニメ・スクロール表示 ---------- */
    const targets = document.querySelectorAll('[data-reveal], [data-split]');
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      targets.forEach((t) => io.observe(t));
    } else {
      targets.forEach((t) => t.classList.add('is-in'));
    }

    /* ---------- 4a) キービジュアルのパララックス ---------- */
    const kv = document.querySelector('[data-kv]');
    if (kv && !reduce) {
      const media = kv.querySelector('.kv__media');
      const text = kv.querySelector('.kv__text');
      let raf = 0;
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const y = Math.min(window.scrollY, window.innerHeight);
          media.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1 + y / 4000})`;
          text.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
          text.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.7)));
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* ---------- 4b) ホームのメニュー：カーソルについてくる動画プレビュー ---------- */
    const preview = document.querySelector('.idx__preview');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (preview && fine) {
      const pv = preview.querySelector('video');
      let x = 0, y = 0, cx = 0, cy = 0, on = false, raf2 = 0;
      const loop = () => {
        cx += (x - cx) * 0.16; cy += (y - cy) * 0.16;
        preview.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) rotate(${(x - cx) * 0.04}deg)`;
        if (on || Math.abs(x - cx) > 0.5) raf2 = requestAnimationFrame(loop);
      };
      document.querySelectorAll('.idx__link').forEach((a) => {
        a.addEventListener('mouseenter', () => {
          const src = a.dataset.preview;
          if (pv.getAttribute('src') !== src) { pv.src = src; }
          pv.play().catch(() => {});
          preview.classList.add('is-on');
          on = true; cancelAnimationFrame(raf2); raf2 = requestAnimationFrame(loop);
        });
        a.addEventListener('mouseleave', () => { preview.classList.remove('is-on'); on = false; pv.pause(); });
        a.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
      });
    }

    /* ---------- 4c) 次ページリンクの動画（見えたら再生） ---------- */
    document.querySelectorAll('.next-page').forEach((n) => {
      const v = n.querySelector('video');
      if (!v || !('IntersectionObserver' in window)) return;
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting) v.play().catch(() => {}); else v.pause();
      }).observe(n);
    });

    /* ---------- 4d) キービジュアルの動画は画面外で止める（軽量化） ---------- */
    if (kv && 'IntersectionObserver' in window) {
      const vids = kv.querySelectorAll('video');
      new IntersectionObserver(([en]) => {
        vids.forEach((v) => (en.isIntersecting ? v.play().catch(() => {}) : v.pause()));
      }).observe(kv);
    }
  });
})();
