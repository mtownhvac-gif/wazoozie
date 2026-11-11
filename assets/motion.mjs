export const MOTION_KEY = 'wazoozie-page-motion-v1';

export function mountMotion(w = window) {
  const d = w.document;
  if (!d.body?.hasAttribute('data-wz-motion') || !w.matchMedia || d.getElementById('wz-motion-toggle')) return null;
  const preference = w.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map(), seen = new WeakSet();
  const scenes = [];
  let paused = false, observer = null;
  try { paused = w.localStorage.getItem(MOTION_KEY) === 'off'; } catch {}
  const footer = d.querySelector('.footbottom') || d.querySelector('footer');
  const button = d.createElement('button');
  button.type = 'button'; button.id = 'wz-motion-toggle'; button.className = 'wz-motion-toggle';
  footer?.append(button);
  const enabled = () => !paused && !preference.matches;
  function cancel() {
    observer?.disconnect(); observer = null;
    for (const animation of running.keys()) animation.cancel();
    running.clear();
    for (const scene of scenes) scene.stop();
  }
  function mountScene(figure) {
    const art = figure.querySelector('.wz-scene-art'), replay = figure.querySelector('.wz-scene-replay');
    const status = figure.querySelector('.wz-scene-status');
    if (!art || !replay || !status || !art.animate) return;
    const order = figure.dataset.wzScene === 'order', original = [...art.children];
    const paint = order ? original[1] : null, windows = order ? original[2] : null, again = order ? original[3] : null;
    const snapshots = order ? [paint, windows, again].map(el => [el, [...el.childNodes].map(n => n.cloneNode(true))]) : [];
    const label = replay.textContent, initialStatus = status.textContent;
    let token = 0, active = false, animations = [];
    const restore = () => {
      if (!order) return;
      art.replaceChildren(...original);
      for (const [el, children] of snapshots) el.replaceChildren(...children.map(n => n.cloneNode(true)));
      art.removeAttribute('data-ordered');
    };
    const controls = () => {
      replay.disabled = !enabled() || active;
      replay.textContent = !enabled() ? 'Preview motion is off' : active ? 'A little planning in motion…' : label;
    };
    function stop() {
      token++; active = false;
      for (const animation of animations) { animation.cancel(); running.delete(animation); }
      animations = []; controls();
    }
    async function start() {
      if (!enabled() || d.hidden || active || art.contains(d.activeElement)) return;
      stop(); restore(); active = true; const current = token; controls(); status.textContent = initialStatus;
      const animate = (el, frames, delay = 0) => {
        const animation = el.animate(frames, {duration:1800, delay, easing:'cubic-bezier(.22,1,.36,1)'});
        animations.push(animation); running.set(animation, el); return animation.finished;
      };
      try {
        if (order) {
          const distance = windows.getBoundingClientRect().top - paint.getBoundingClientRect().top;
          await Promise.all([
            animate(paint, [{translate:'0 0',rotate:'0deg'}, {translate:'-10px 0',rotate:'-2deg',offset:0.25}, {translate:`-10px ${distance}px`,rotate:'-2deg',offset:0.8}, {translate:`0 ${distance}px`,rotate:'0deg'}]),
            animate(windows, [{translate:'0 0',rotate:'0deg'}, {translate:'10px 0',rotate:'2deg',offset:0.25}, {translate:`10px ${-distance}px`,rotate:'2deg',offset:0.8}, {translate:`0 ${-distance}px`,rotate:'0deg'}]),
            animate(again, [{opacity:1}, {opacity:0.2,offset:0.45}, {opacity:0.2}])
          ]);
          if (current !== token) return;
          paint.before(windows); windows.querySelector('b').textContent = '01'; paint.querySelector('b').textContent = '02';
          windows.querySelector('em').textContent = 'First.'; paint.querySelector('em').textContent = 'After.';
          again.textContent = '✓ A better order to discuss.'; art.dataset.ordered = '';
          status.textContent = 'Windows first. Paint after. Confirm the sequence with your contractor.';
        } else {
          await Promise.all([...art.querySelectorAll('span')].map((el, i) => animate(el, [
            {translate:'0 0',rotate:'0deg'},
            {translate:`${22-i*6}px ${-14+i*8}px`,rotate:`${-3+i*3}deg`,offset:0.35},
            {translate:`${22-i*6}px ${-14+i*8}px`,rotate:`${-3+i*3}deg`,offset:0.7},
            {translate:'0 0',rotate:'0deg'}
          ], i*90)));
          if (current !== token) return;
          status.textContent = 'The finish covers the preparation. Keep useful photos before it closes up.';
        }
      } catch { if (current === token) restore(); }
      finally { if (current === token) { active = false; for (const a of animations) { a.cancel(); running.delete(a); } animations = []; controls(); } }
    }
    replay.hidden = false; replay.addEventListener('click', start);
    scenes.push({art, start, stop, controls, destroy() {stop(); restore(); replay.removeEventListener('click',start); replay.hidden = true; status.textContent = initialStatus;}});
  }
  d.querySelectorAll('[data-wz-scene]').forEach(mountScene);
  function play(el, delay = 0, image = false) {
    if (!enabled() || d.hidden || !el?.animate || el.contains(d.activeElement)) return;
    try {
      const animation = el.animate(image ? [{scale:'1.025'}, {scale:'1'}] :
        [{opacity:0.4, translate:'0 12px'}, {opacity:1, translate:'0 0'}], {
          duration:image ? 1050 : 520, delay, easing:'cubic-bezier(.22,1,.36,1)'
        });
      running.set(animation, el);
      animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    } catch { /* Content is visible without the animation API. */ }
  }
  function reveal() {
    if (!enabled() || !w.IntersectionObserver) return;
    observer = new w.IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const scene = scenes.find(scene => scene.art === el);
        if (scene && entry.intersectionRatio < 0.35) continue;
        observer?.unobserve(el);
        if (seen.has(el)) continue;
        seen.add(el);
        if (scene) { scene.start(); continue; }
        const siblings = [...el.parentElement.children];
        const delay = el.matches('.network-intro li') ? Math.min(siblings.indexOf(el), 2) * 110 :
          el.matches('.service-choice, .explore-card, .brand-collection-card') ? Math.max(0, siblings.indexOf(el) % 3) * 55 : 0;
        play(el, delay);
      }
    }, {threshold:[0.08,0.35], rootMargin:'0px 0px -24px 0px'});
    const targets = d.querySelectorAll('main > section h2, .service-choice, .explore-card, .brand-collection-card, .network-intro li, .brand-cover h1, .page-hero h1, .destination-intro h1');
    for (const el of [...targets].slice(0, 48)) {
      // Returning to an anchor or a restored scroll position never replays content above it.
      if (el.getBoundingClientRect().bottom <= 0) { seen.add(el); continue; }
      if (!seen.has(el)) observer.observe(el);
    }
    for (const scene of scenes) if (!seen.has(scene.art) && scene.art.getBoundingClientRect().bottom > 0) observer.observe(scene.art);
  }
  function update() {
    cancel();
    const on = enabled();
    d.body.classList.toggle('wz-motion-on', on);
    d.body.classList.toggle('wz-motion-off', !on);
    d.documentElement.classList.toggle('wz-motion-disabled', !on);
    button.disabled = preference.matches;
    button.setAttribute('aria-pressed', String(on));
    button.textContent = preference.matches ? 'Motion: reduced by your device' : on ? 'Motion: on' : 'Motion: off';
    button.setAttribute('aria-label', preference.matches ? 'Motion limited by your device preference' : on ? 'Turn page motion off' : 'Turn page motion on');
    for (const scene of scenes) scene.controls();
    reveal();
  }
  const toggle = () => {
    paused = !paused;
    try { w.localStorage.setItem(MOTION_KEY, paused ? 'off' : 'on'); } catch {}
    update();
  };
  const focus = event => {
    for (const scene of scenes) if (scene.art.contains(event.target)) scene.stop();
    for (const [animation, el] of running) if (el.contains(event.target)) { animation.cancel(); running.delete(animation); }
  };
  const printing = () => { for (const scene of scenes) scene.stop(); for (const animation of running.keys()) animation.cancel(); running.clear(); };
  const visibility = () => { if (d.hidden) printing(); };
  button.addEventListener('click', toggle);
  preference.addEventListener?.('change', update);
  d.addEventListener('focusin', focus);
  d.addEventListener('visibilitychange', visibility);
  w.addEventListener('beforeprint', printing);
  update();
  // Entrance finishes quickly, never loops, and does not move the search form or contact controls.
  if (w.scrollY < 80 && enabled()) {
    const hero = d.querySelector('.grand-hero');
    hero?.querySelectorAll('h1, h1 + p, .grand-hero-actions').forEach((el, i) => { seen.add(el); play(el, i * 85); });
    play(hero?.querySelector('.grand-hero-image'), 0, true);
  }
  return {enabled, destroy() {
    cancel(); button.remove(); preference.removeEventListener?.('change', update);
    for (const scene of scenes) scene.destroy();
    d.removeEventListener('focusin', focus); d.removeEventListener('visibilitychange', visibility);
    w.removeEventListener('beforeprint', printing);
    d.body.classList.remove('wz-motion-on', 'wz-motion-off'); d.documentElement.classList.remove('wz-motion-disabled');
  }};
}

if (typeof window !== 'undefined') mountMotion(window);
