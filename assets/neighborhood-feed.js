const posts = [...document.querySelectorAll('[data-feed-topic]')];
const status = document.getElementById('neighbor-feed-status');
document.querySelectorAll('[data-feed-filter]').forEach(button => button.addEventListener('click', () => {
 const topic = button.dataset.feedFilter;
 document.querySelectorAll('[data-feed-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
 posts.forEach(post => { post.hidden = topic !== 'all' && post.dataset.feedTopic !== topic; });
 const count = posts.filter(post => !post.hidden).length;
 status.textContent = `${count} ${count === 1 ? 'story' : 'stories'} shown`;
}));
document.querySelectorAll('[data-share-page]').forEach(button => button.addEventListener('click', async () => {
 const url = new URL(button.dataset.sharePage, location.origin).href;
 try {
  if (navigator.share) await navigator.share({title: button.dataset.shareTitle, url});
  else if (navigator.clipboard) { await navigator.clipboard.writeText(url); status.textContent = 'Link copied. Share it with a neighbor.'; }
  else { status.textContent = `Share this link: ${url}`; }
 } catch(error) { if (error.name !== 'AbortError') status.textContent = `Share this link: ${url}`; }
}));
