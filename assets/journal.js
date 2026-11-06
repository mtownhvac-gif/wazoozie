(() => {
 const root=document.querySelector('.journal-library'); if(!root)return;
 const cards=[...root.querySelectorAll('[data-journal-topic]')];
 const search=root.querySelector('#journal-search');
 const buttons=[...root.querySelectorAll('[data-journal-filter]')];
 const count=root.querySelector('#journal-count');
 const empty=root.querySelector('#journal-empty');
 const surprise=root.querySelector('#journal-surprise');
 const spotlight=root.querySelector('#journal-spotlight');
 let topic='all';let lastPick=null;
 const normalize=text=>text.toLowerCase().normalize('NFKC').trim();
 function visible(){return cards.filter(card=>!card.hidden);}
 function update(){
  const terms=normalize(search.value).split(/\s+/).filter(Boolean);
  for(const card of cards)card.hidden=(topic!=='all'&&card.dataset.journalTopic!==topic)||!terms.every(word=>normalize(card.textContent).includes(word));
  const total=visible().length;count.textContent=`${total} field ${total===1?'note':'notes'} to explore.`;
  empty.hidden=total!==0;surprise.disabled=total===0;spotlight.hidden=true;
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.journalFilter===topic));
 }
 for(const button of buttons)button.addEventListener('click',()=>{topic=button.dataset.journalFilter;update();});
 search.addEventListener('input',update);
 root.querySelector('#journal-reset').addEventListener('click',()=>{topic='all';search.value='';update();search.focus();});
 surprise.addEventListener('click',()=>{
  const all=visible();if(!all.length)return;
  const pool=all.length>1?all.filter(card=>card!==lastPick):all;
  const card=pool[Math.floor(Math.random()*pool.length)];lastPick=card;
  root.querySelector('#journal-pick-title').textContent=card.querySelector('h3').textContent;
  root.querySelector('#journal-pick-copy').textContent=card.querySelector('p').textContent;
  const link=root.querySelector('#journal-pick-link');const source=card.querySelector('a');
  link.textContent=source.textContent;link.setAttribute('href',source.getAttribute('href'));
  spotlight.hidden=false;count.textContent=`Your pick: ${card.querySelector('h3').textContent}`;
 });
 root.querySelector('.journal-controls').hidden=false;surprise.hidden=false;update();
})();
