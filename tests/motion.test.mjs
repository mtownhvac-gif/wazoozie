import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {mountMotion,MOTION_KEY} from '../assets/motion.mjs';
const html=readFileSync('dist/index.html','utf8');

function page({reduced=false,paused=false,broken=false}={}){
 const dom=new JSDOM(html,{url:'https://wazoozie.com/',pretendToBeVisual:true});
 const w=dom.window,animations=[],observers=[],listeners=new Set();
 const preference={matches:reduced,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
 w.matchMedia=()=>preference;
 w.fetch=()=>{throw Error('Motion must not send data');};
 if(paused)w.localStorage.setItem(MOTION_KEY,'off');
 w.localStorage.setItem('my-project','keep my project');
 w.Element.prototype.getBoundingClientRect=()=>({top:100,bottom:200,width:300,height:100});
 w.Element.prototype.animate=function(frames,options){if(broken)throw Error('Animation unavailable');let finish;const animation={el:this,frames,options,cancelled:false,finished:new Promise(resolve=>{finish=resolve;}),finish(){finish();},cancel(){this.cancelled=true;}};animations.push(animation);return animation;};
 w.IntersectionObserver=class{constructor(fn){this.fn=fn;this.targets=new Set();observers.push(this);}observe(el){this.targets.add(el);}unobserve(el){this.targets.delete(el);}disconnect(){this.targets.clear();}fire(el,ratio=0.5){this.fn([{target:el,isIntersecting:true,intersectionRatio:ratio}]);}};
 const app=mountMotion(w);
 return {w,d:w.document,dom,app,animations,observers,change(value){preference.matches=value;for(const fn of listeners)fn();},close(){app?.destroy();dom.window.close();}};
}

test('device reduced-motion preference prevents entrance/reveal animations and reacts immediately to changes',()=>{
 const p=page({reduced:true});try{
  assert.equal(p.animations.length,0);assert.equal(p.app.enabled(),false);assert.equal(p.d.getElementById('wz-motion-toggle').disabled,true);
  p.change(false);assert.equal(p.app.enabled(),true);const target=p.d.querySelector('.project-finder-choice');p.observers.at(-1).fire(target);assert.equal(p.animations.length,1);
  p.change(true);assert.equal(p.animations[0].cancelled,true);assert.equal(p.observers.at(-1).targets.size,0);
 }finally{p.close();}
});
test('the visible motion switch cancels work, persists only its preference and leaves project storage intact',()=>{
 const p=page();try{
  assert.ok(p.animations.length>0);p.d.getElementById('wz-motion-toggle').click();assert.ok(p.animations.every(a=>a.cancelled));assert.equal(p.app.enabled(),false);assert.equal(p.w.localStorage.getItem(MOTION_KEY),'off');assert.equal(p.w.localStorage.getItem('my-project'),'keep my project');
  assert.equal(p.d.getElementById('wz-motion-toggle').getAttribute('aria-pressed'),'false');assert.equal(p.w.localStorage.length,2);
 }finally{p.close();}
 const q=page({paused:true});try{assert.equal(q.animations.length,0);q.d.getElementById('wz-motion-toggle').click();assert.equal(q.app.enabled(),true);}finally{q.close();}
});
test('reveals run once, do not observe forms, and cancel when a user focuses their link',()=>{
 const p=page();try{
  const observer=p.observers[0],card=p.d.querySelector('.project-finder-choice');assert.ok(observer.targets.has(card));assert.ok([...observer.targets].every(el=>!el.matches('form,input,select,textarea')));
  const before=p.animations.length;observer.fire(card);observer.fire(card);assert.equal(p.animations.length,before+1);
  const animation=p.animations.at(-1);card.focus();assert.equal(animation.cancelled,true);
  assert.ok(p.animations.every(a=>a.options.iterations===undefined&&a.options.duration<=1050));
 }finally{p.close();}
});
test('missing browser APIs and animation failures leave the visible site and contact links usable',()=>{
 const p=page({broken:true});try{assert.equal(p.animations.length,0);assert.ok(p.d.querySelector('.project-finder-choice[href]'));assert.equal(p.d.querySelector('.grand-hero h1').style.opacity,'');assert.equal(p.d.querySelector('.grand-hero').hasAttribute('hidden'),false);}finally{p.close();}
 const dom=new JSDOM(html);try{assert.equal(mountMotion(dom.window),null);assert.ok(dom.window.document.querySelector('h1').textContent.length);}finally{dom.window.close();}
});
test('forms, accounts and private tools retain their existing static flow; browsing pages get bundled motion styles',()=>{
 for(const route of ['start','account','for-contractors','before-it-disappears','compare']){const text=readFileSync('dist/'+route+'/index.html','utf8');assert.ok(!text.includes('/assets/motion.mjs'),route);assert.ok(!text.includes('data-wz-motion'),route);}
 for(const route of ['index.html','home-services/index.html','businesses/middletown-hvac/index.html','services/heating-cooling/index.html']){const text=readFileSync('dist/'+route,'utf8');assert.ok(text.includes('/assets/motion.mjs'),route);assert.ok(text.includes('data-wz-motion'),route);}
 const d=new JSDOM(html).window.document;assert.equal(d.querySelectorAll('link[href*="site-"]').length,1);assert.equal(d.querySelectorAll('.project-finder-choice').length,8);
});

test('project illustrations play once on entry and can be replayed without navigation or network calls',async()=>{
 const p=page();try{
  const figure=p.d.querySelector('[data-wz-scene="order"]'),art=figure.querySelector('a'),button=figure.querySelector('button');
  assert.equal(button.hidden,false);assert.equal(button.getAttribute('aria-controls'),art.id);
  const before=p.animations.length;const observer=p.observers[0];observer.fire(art,0.1);assert.equal(p.animations.length,before);observer.fire(art);observer.fire(art);assert.equal(p.animations.length,before+3);assert.equal(button.disabled,true);
  p.animations.slice(before).forEach(a=>a.finish());await new Promise(r=>setImmediate(r));
  assert.equal(art.children[1].textContent.includes('Replace the windows'),true);assert.equal(art.children[2].textContent.includes('Paint the room'),true);
  assert.match(figure.querySelector('figcaption').textContent,/Windows first/);assert.equal(button.disabled,false);assert.equal(art.getAttribute('href'),'/second-invoice/');
  button.click();assert.equal(p.animations.length,before+6);assert.equal(art.children[1].textContent.includes('Paint the room'),true);
  p.d.getElementById('wz-motion-toggle').click();assert.equal(button.disabled,true);assert.ok(p.animations.slice(before+3).every(a=>a.cancelled));
  assert.equal(art.getAttribute('href'),'/second-invoice/');
 }finally{p.close();}
});
test('layer previews respect device settings and cancel together on link focus or tab hiding',()=>{
 const p=page();try{
  const figure=p.d.querySelector('[data-wz-scene="layers"]'),art=figure.querySelector('a');const before=p.animations.length;
  figure.querySelector('button').click();assert.equal(p.animations.length,before+3);art.focus();assert.ok(p.animations.slice(before).every(a=>a.cancelled));
  figure.querySelector('button').focus();figure.querySelector('button').click();const last=p.animations.slice(-3);
  Object.defineProperty(p.d,'hidden',{configurable:true,value:true});p.d.dispatchEvent(new p.w.Event('visibilitychange'));assert.ok(last.every(a=>a.cancelled));
  p.change(true);assert.equal(figure.querySelector('button').disabled,true);assert.equal(art.getAttribute('href'),'/before-it-disappears/');
 }finally{p.close();}
});
