export const MOTION_KEY = 'wazoozie-page-motion-v1';

export function mountMotion(w = window) {
  const d = w.document;
  if (!d.body?.hasAttribute('data-wz-motion') || !w.matchMedia || d.getElementById('wz-motion-toggle')) return null;
  const preference = w.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map(), seen = new WeakSet();
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
  }
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
        observer?.unobserve(el);
        if (seen.has(el)) continue;
        seen.add(el);
        const siblings = [...el.parentElement.children];
        const delay = el.matches('.network-intro li') ? Math.min(siblings.indexOf(el), 2) * 110 :
          el.matches('.service-choice, .explore-card, .brand-collection-card') ? Math.max(0, siblings.indexOf(el) % 3) * 55 : 0;
        play(el, delay);
      }
    }, {threshold:0.08, rootMargin:'0px 0px -24px 0px'});
    const targets = d.querySelectorAll('main > section h2, .service-choice, .explore-card, .brand-collection-card, .network-intro li, .brand-cover h1, .page-hero h1, .destination-intro h1');
    for (const el of [...targets].slice(0, 48)) {
      // Returning to an anchor or a restored scroll position never replays content above it.
      if (el.getBoundingClientRect().bottom <= 0) { seen.add(el); continue; }
      if (!seen.has(el)) observer.observe(el);
    }
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
    reveal();
  }
  const toggle = () => {
    paused = !paused;
    try { w.localStorage.setItem(MOTION_KEY, paused ? 'off' : 'on'); } catch {}
    update();
  };
  const focus = event => {
    for (const [animation, el] of running) if (el.contains(event.target)) { animation.cancel(); running.delete(animation); }
  };
  const visibility = () => { if (d.hidden) { for (const animation of running.keys()) animation.cancel(); running.clear(); } };
  const printing = () => { for (const animation of running.keys()) animation.cancel(); running.clear(); };
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
    d.removeEventListener('focusin', focus); d.removeEventListener('visibilitychange', visibility);
    w.removeEventListener('beforeprint', printing);
    d.body.classList.remove('wz-motion-on', 'wz-motion-off'); d.documentElement.classList.remove('wz-motion-disabled');
  }};
}

if (typeof window !== 'undefined') mountMotion(window);
