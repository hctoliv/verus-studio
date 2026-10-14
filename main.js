(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WA = '5511984253611';
  const mq = matchMedia('(max-width:760px)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  const body = document.body, intro = $('#intro'), fly = $('#fly'), flyIn = $('#flyIn');

  /* ---------- intro: barber pole, razor cut, split ---------- */
  let introDone = false;
  const reveal = () => {
    if (introDone) return; introDone = true;
    intro.classList.add('is-cut', 'is-split');
    body.classList.remove('is-intro');
    fly.classList.add('is-in');
    setTimeout(() => fly.classList.add('is-shine'), 1500);
    setTimeout(() => intro.remove(), 1200);
    store.set('verusIntro', '1');
  };
  if (reduce || store.get('verusIntro')) {
    intro.style.display = 'none';
    requestAnimationFrame(reveal);
  } else {
    const num = $('#introNum'), t0 = performance.now();
    const count = now => {
      const k = clamp((now - t0) / 1300);
      num.textContent = String(Math.round(easeIO(k) * 100)).padStart(2, '0');
      if (k < 1 && !introDone) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    setTimeout(() => { if (!introDone) intro.classList.add('is-cut'); }, 1450);
    setTimeout(reveal, 2150);
    intro.addEventListener('click', reveal);
  }

  /* ---------- open now (São Paulo time) ---------- */
  const spNow = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const g = t => parts.find(x => x.type === t).value;
    return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), m: (+g('hour') % 24) * 60 + +g('minute') };
  };
  const HOURS = { 2: [540, 1200], 3: [540, 1200], 4: [540, 1200], 5: [540, 1200], 6: [540, 1080] };
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
  const DAYN = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const status = () => {
    const { d, m } = spNow(), h = HOURS[d];
    if (h && m >= h[0] && m < h[1]) return { open: true, txt: `Aberto agora · até ${fmt(h[1])}` };
    for (let i = 0; i < 8; i++) {
      const dd = (d + i) % 7, hh = HOURS[dd];
      if (hh && (i > 0 || m < hh[0])) return { open: false, txt: `Fechado · abre ${i === 0 ? 'hoje' : i === 1 ? 'amanhã' : DAYN[dd]} às ${fmt(hh[0])}` };
    }
  };
  const paintStatus = () => {
    const s = status();
    $$('[data-status]').forEach(el => { el.classList.toggle('is-open', s.open); el.querySelector('b').textContent = s.txt; });
    $('#sign').classList.toggle('is-closed', !s.open);
    const today = spNow().d;
    $$('#hours li').forEach(li => li.classList.toggle('is-today', li.dataset.d.split(',').includes(String(today))));
  };
  paintStatus(); setInterval(paintStatus, 60000);

  /* ---------- header + menu ---------- */
  const hd = $('#hd'), burger = $('#burger');
  let menuOpen = false;
  const setMenu = o => {
    if (o === menuOpen) return;
    menuOpen = o;
    hd.classList.toggle('menu-open', o);
    burger.setAttribute('aria-expanded', o);
    burger.setAttribute('aria-label', o ? 'Fechar menu' : 'Abrir menu');
    document.documentElement.classList.toggle('is-locked', o);
    // logo goes to the header while the menu is open
    fly.classList.add('is-snap');
    placeFly(scrollY); syncFlyHide();
    clearTimeout(setMenu.t); setMenu.t = setTimeout(() => fly.classList.remove('is-snap'), 600);
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 1000) setMenu(false); });
  // no pinch / double-tap zoom (iOS ignores user-scalable=no)
  ['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
  const navLinks = $$('#nav a').map(a => ({ a, sec: $(a.getAttribute('href')) }));

  /* ---------- flying logo: hero slot -> header slot ---------- */
  const heroSlot = $('#heroSlot'), hdSlot = $('#hdSlot');
  let base = null, dock = null, flyE = 0;
  const measureFly = () => {
    const r = heroSlot.getBoundingClientRect();
    base = { x: r.left, y: r.top + scrollY, w: r.width, h: r.height };
    const d = hdSlot.getBoundingClientRect();
    dock = { x: d.left, y: d.top + (hd.classList.contains('is-hidden') ? hd.offsetHeight : 0), w: d.width };
    fly.style.width = base.w + 'px';
    fly.style.height = base.h + 'px';
  };
  const placeFly = y => {
    const vh = innerHeight;
    flyE = menuOpen ? 1 : easeIO(clamp(y / (vh * .55)));
    const s = lerp(1, dock.w / base.w, flyE);
    const fx = lerp(base.x, dock.x, flyE), fy = lerp(base.y - y, dock.y, flyE);
    fly.style.transform = `translate3d(${fx.toFixed(1)}px,${fy.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
    fly.style.setProperty('--glow', (1 - flyE).toFixed(3));
    fly.classList.toggle('is-docked', flyE > .98);
  };
  // docked logo hides with the header
  const syncFlyHide = () => { fly.style.translate = (flyE > .98 && hd.classList.contains('is-hidden')) ? `0 -${hd.offsetHeight + 10}px` : '0 0'; };
  fly.style.transition = 'translate .5s cubic-bezier(.2,.8,.2,1)';

  /* light + tilt on the logo */
  if (fine) {
    const hero = $('#hero');
    hero.addEventListener('pointermove', e => {
      if (flyE > .05) return;
      const r = fly.getBoundingClientRect();
      flyIn.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      flyIn.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      flyIn.style.setProperty('--lo', '1');
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      flyIn.style.setProperty('--rx', (x * 16).toFixed(2) + 'deg');
      flyIn.style.setProperty('--ry', (-y * 12).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => { flyIn.style.setProperty('--lo', '0'); flyIn.style.setProperty('--rx', '0deg'); flyIn.style.setProperty('--ry', '0deg'); });
  }

  /* ---------- split headings into words ---------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const wrap = node => { const w = document.createElement('span'); w.className = 'wd'; const inner = document.createElement('span'); inner.className = 'wi'; inner.style.setProperty('--i', i++); w.appendChild(inner); return [w, inner]; };
    const walk = parent => {
      [...parent.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const [w, inner] = wrap(); inner.textContent = part; frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          if (n.matches('[data-count], .chrome')) { const [w, inner] = wrap(); n.replaceWith(w); inner.appendChild(n); }
          else walk(n);
        }
      });
    };
    walk(el);
  });

  /* ---------- manifesto ---------- */
  const mt = $('[data-words]');
  mt.innerHTML = mt.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = $$('.w', mt);
  const letters = $$('.manifesto__word span');
  letters.forEach((l, i) => { l.style.setProperty('--o', (i % 2 ? 1 : -1) * (50 + i * 22)); l.style.setProperty('--r', (i % 2 ? 1 : -1) * (6 + i * 2)); });

  /* ---------- count up ---------- */
  const countUp = el => {
    if (el.dataset.done) return; el.dataset.done = 1;
    const target = +el.dataset.count, mil = el.dataset.format === 'mil', t0 = performance.now(), dur = 1800;
    const step = now => {
      const k = clamp((now - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 4)));
      el.textContent = mil ? `${Math.round(v / 1000)} mil` : v.toLocaleString('pt-BR');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- lazy videos ---------- */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (v.dataset.lazy && !v.getAttribute('src')) v.src = v.dataset.lazy;
      if (!v.closest('.barber')) v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '250px 0px' });
  const heroVids = $$('.hero__v');
  new IntersectionObserver(es => es.forEach(e => heroVids.forEach(v => e.isIntersecting ? v.play().catch(() => {}) : v.pause()))).observe($('#hero'));

  /* ---------- reveal ---------- */
  $$('.sec-head, .cat__head, .reel, .barber, .ticket, .board, .partner__img, .partner__body, .where__info > *, .manifesto__def, .manifesto__sign').forEach(el => el.classList.add('rv'));
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(countUp);
    rio.unobserve(e.target);
  }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  $$('.rv').forEach(el => rio.observe(el));

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbv = $('#lbVideo');
  const openLb = src => { lbv.src = src; lb.hidden = false; body.style.overflow = 'hidden'; lbv.play().catch(() => {}); };
  const closeLb = () => { lbv.pause(); lbv.removeAttribute('src'); lbv.load(); lb.hidden = true; body.style.overflow = ''; };
  $$('.reel').forEach(r => $('.reel__media', r).addEventListener('click', () => openLb(r.dataset.reel)));
  $('#lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ---------- catalog ---------- */
  const cat = $('#catalogo'), track = $('#catTrack'), catBar = $('#catBar'), styles = $$('.style', track);
  let catMax = 0;
  const sizeCat = () => {
    if (mq.matches) { cat.style.removeProperty('--cat-h'); return; }
    catMax = Math.max(0, track.scrollWidth - (innerWidth - track.offsetLeft));
    cat.style.setProperty('--cat-h', (innerHeight + catMax) + 'px');
  };

  /* ---------- rails ---------- */
  const rails = $$('.rail').map(r => {
    const t = $('.rail__track', r);
    t.insertAdjacentHTML('beforeend', t.innerHTML);
    return { t, dir: +r.dataset.dir, x: 0 };
  });
  $$('video[data-lazy]').forEach(v => { if (!v.closest('.barber')) vio.observe(v); });

  /* ---------- team ---------- */
  $$('.barber').forEach(b => {
    const v = $('video', b), m = $('.barber__media', b);
    const on = () => { if (!v.getAttribute('src')) v.src = v.dataset.lazy; v.play().catch(() => {}); b.classList.add('is-playing'); };
    const off = () => { v.pause(); b.classList.remove('is-playing'); };
    if (fine) { m.addEventListener('mouseenter', on); m.addEventListener('mouseleave', off); }
    else m.addEventListener('click', () => b.classList.contains('is-playing') ? off() : on());
  });

  /* ---------- booking ---------- */
  const form = $('#bookForm'), daysEl = $('#days');
  const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  let pickedDay = null;
  {
    const base0 = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    for (let i = 0; i < 14; i++) {
      const d = new Date(base0); d.setDate(base0.getDate() + i);
      const wd = d.getDay();
      const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : WD[wd];
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'day'; b.disabled = !HOURS[wd];
      b.innerHTML = `<span>${label}</span><b>${d.getDate()}</b><span>${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>`;
      b.dataset.txt = `${i < 2 ? label.toLowerCase() + ', ' : ''}${DAYN[wd]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      b.addEventListener('click', () => { $$('.day', daysEl).forEach(x => x.classList.remove('is-on')); b.classList.add('is-on'); pickedDay = b.dataset.txt; render(); });
      daysEl.appendChild(b);
    }
  }
  const ticks = $('.dial__ticks');
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', 60 + Math.cos(a) * 38); l.setAttribute('y1', 60 + Math.sin(a) * 38);
    l.setAttribute('x2', 60 + Math.cos(a) * (i % 3 ? 42 : 44)); l.setAttribute('y2', 60 + Math.sin(a) * (i % 3 ? 42 : 44));
    ticks.appendChild(l);
  }
  const dialFg = $('#dialFg'), C = 2 * Math.PI * 52;
  const durTxt = m => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m}min`;
  const render = () => {
    const svcs = $$('input[name=svc]:checked', form);
    const mins = svcs.reduce((a, i) => a + +i.dataset.min, 0);
    const price = svcs.reduce((a, i) => a + +i.dataset.price, 0);
    const from = svcs.some(i => i.hasAttribute('data-from'));
    const barber = form.barber.value, period = form.period.value, nome = form.nome.value.trim();
    $('#tTime').textContent = durTxt(mins);
    dialFg.style.strokeDashoffset = C * (1 - Math.min(mins, 180) / 180);
    $('#tSvc').textContent = svcs.length ? svcs.map(i => i.value).join(' + ') : 'marque na tabela';
    $('#tBarber').textContent = barber;
    $('#tWhen').textContent = pickedDay ? `${pickedDay}, ${period}` : '—';
    $('#tPrice').textContent = `${from ? 'a partir de ' : ''}R$ ${price}`;
    const lines = [
      `Olá, Verus! ${nome ? `Aqui é ${nome}. ` : ''}Quero agendar um horário 💠`,
      svcs.length ? `• Serviço: ${svcs.map(i => i.value).join(' + ')} (${durTxt(mins)})` : '',
      `• Com: ${barber}`,
      pickedDay ? `• Dia: ${pickedDay}, de ${period}` : '• Dia: o próximo horário livre',
      svcs.length ? `• Valor de referência: ${from ? 'a partir de ' : ''}R$ ${price}` : ''
    ].filter(Boolean);
    const btn = $('#waBtn');
    btn.href = `https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`;
    btn.classList.toggle('is-off', !svcs.length);
    btn.textContent = svcs.length ? 'Enviar no WhatsApp' : 'Marque um serviço';
  };
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  $$('[data-pick-barber]').forEach(b => b.addEventListener('click', () => {
    $(`input[name=barber][value="${b.dataset.pickBarber}"]`, form).checked = true; render();
    $('#agendar').scrollIntoView({ behavior: 'smooth' });
  }));
  render();

  /* ---------- cursor: ring + scissors ---------- */
  if (fine && !reduce) {
    const cur = $('#cur');
    let mx = -100, my = -100, cx = -100, cy = -100;
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      const t = e.target;
      const c = t.closest && t.closest('[data-cursor]');
      cur.classList.toggle('is-snip', !!c && c.dataset.cursor === 'snip');
      cur.classList.toggle('is-play', !!c && c.dataset.cursor === 'play');
      cur.classList.toggle('is-link', !c && !!(t.closest && t.closest('a,button,label,.day')));
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mx = my = -100; });
    const loop = () => { cx = lerp(cx, mx, .22); cy = lerp(cy, my, .22); cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);

    /* magnetic buttons */
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.translate = `${((e.clientX - r.left) / r.width - .5) * 14}px ${((e.clientY - r.top) / r.height - .5) * 12}px`; });
      b.addEventListener('pointerleave', () => { b.style.translate = '0 0'; });
    });
  }

  /* ---------- scroll loop ---------- */
  const hero = $('#hero'), manif = $('#manifesto'), cuts = $$('.cut'), sidepole = $('.sidepole'), spGlass = $('#sidepole'), ft = $('.ft'), ftSign = $('.ft__sign'), book = $('#agendar');
  let lastY = scrollY, vel = 0, prevY = scrollY, ticking = false;
  const frame = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    // header
    hd.classList.toggle('is-solid', y > vh * .5);
    lastY = y;
    placeFly(y); syncFlyHide();
    // active nav
    const mid = vh * .4; let act = null;
    navLinks.forEach(n => { const r = n.sec.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) act = n.a; });
    navLinks.forEach(n => n.a.classList.toggle('is-active', n.a === act));
    // hero
    hero.style.setProperty('--hp', clamp(y / vh).toFixed(3));
    // manifesto
    const mr = manif.getBoundingClientRect();
    const mp = clamp((vh - mr.top) / (vh * .9));
    letters.forEach(l => l.style.setProperty('--mp', mp.toFixed(3)));
    const tr = mt.getBoundingClientRect();
    const n = Math.round(clamp((vh * .85 - tr.top) / (tr.height + vh * .3)) * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < n));
    // catalog
    if (!mq.matches) {
      const cr = cat.getBoundingClientRect();
      const cp = clamp(-cr.top / Math.max(1, cr.height - vh));
      track.style.transform = `translate3d(${(-cp * catMax).toFixed(1)}px,0,0)`;
      catBar.style.transform = `scaleX(${cp.toFixed(3)})`;
    }
    // razor dividers
    cuts.forEach(c => {
      const r = c.getBoundingClientRect();
      if (r.top > vh + 50 || r.bottom < -50) return;
      const p = clamp((vh - r.top) / (vh * .75));
      c.style.setProperty('--c', p.toFixed(3));
      c.style.setProperty('--cx', (p * r.width).toFixed(1) + 'px');
    });
    // side pole + fab
    sidepole.classList.toggle('is-on', y > vh * .6);
    spGlass.style.setProperty('--sp', (y * .35).toFixed(1) + 'px');
    // footer sheen
    const fr = ftSign.getBoundingClientRect();
    ft.style.setProperty('--fp', clamp((vh - fr.top) / (vh + fr.height)).toFixed(3));
    vel += (y - prevY) * .2; prevY = y;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });

  // continuous: rails + catalog tilt react to scroll speed
  let railsVisible = false;
  new IntersectionObserver(es => { railsVisible = es[0].isIntersecting; }).observe($('#cortes'));
  const loop = () => {
    vel *= .9;
    if (!reduce) {
      if (railsVisible) {
        const sp = .5 + Math.abs(vel) * .6, skew = clamp(vel * .25, -8, 8).toFixed(2) + 'deg';
        rails.forEach(r => {
          const half = r.t.scrollWidth / 2;
          r.x = (r.x + sp * r.dir) % half;
          r.t.style.transform = `translate3d(${-((r.x % half + half) % half)}px,0,0)`;
          r.t.style.setProperty('--skew', skew);
        });
      }
      if (!mq.matches) { const tl = clamp(vel * .12, -4, 4).toFixed(2) + 'deg'; styles.forEach(s => s.style.setProperty('--tilt', tl)); }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const onResize = () => { sizeCat(); measureFly(); frame(); };
  addEventListener('resize', onResize);
  addEventListener('load', onResize);
  document.fonts && document.fonts.ready.then(onResize);
  onResize();
})();
