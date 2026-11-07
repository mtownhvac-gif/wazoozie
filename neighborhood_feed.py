"""Editorial neighborhood feed using published projects and named business profiles."""
import html,re,shutil

def add(out):
 root=out.parent;e=html.escape
 posts=[
 ('comfort','Middletown HVAC','MH','Published project','middletown-ductless-project','A room that finally feels right.','A published Middletown ductless installation. Explore room-by-room heating and cooling for the space you want to enjoy.','/services/ductless-mini-splits/','comfort'),
 ('comfort','Middletown HVAC','MH','Published project','middletown-conversion-project','Thinking about moving beyond oil?','See a published conversion project and compare gas, heat-pump and dual-fuel options for your home.','/services/oil-to-gas-conversion/','replacement'),
 ('electrical','Ryan Dugan Electric','RD','Business spotlight','outdoor-lighting','A little light changes everything.','Lighting, outlets and electrical projects from the business Middletown calls for its own electrical work. Image illustrates the service.','/businesses/ryan-dugan-electric/','electrical'),
 ('plumbing','Liberator Service Company','LS','Business spotlight','sink','Make the everyday work better.','Fixtures, leaks and drain concerns. Meet the business and talk through what your home needs. Image illustrates the service.','/businesses/liberator-service-company/','plumbing'),
 ('projects','Hart Builders','HB','Business spotlight','window-framing','More room for the way you live.','Doors, windows, decks and larger home projects. Start with the space and the result you have in mind. Image illustrates the service.','/businesses/hart-builders/','windows'),
 ('projects','Cooke Carpentry & Construction','CC','Business spotlight','carpentry','The little jobs worth finishing.','Smaller carpentry projects, trim, shelving and repairs. Bring the details to Cooke. Image illustrates the service.','/businesses/cooke-carpentry-construction/','carpentry'),
 ('painting','Rolled Right Painting','RR','Business spotlight','valley-colonial-home','A fresh finish. A different feeling.','Explore painting, drywall repairs and cabinet refinishing. Discuss preparation, finishes and your project directly. Image illustrates the service.','/businesses/rolled-right-painting/','painting')]
 # Introduce each business once, alphabetically, before extra project stories.
 counts={}
 def story_order(post):
  name=post[1];occurrence=counts.get(name,0);counts[name]=occurrence+1
  return occurrence,name.casefold()
 posts=sorted(posts,key=story_order)
 cards=[]
 for group,name,initials,label,photo,title,desc,url,intent in posts:
  cards.append('<article class="neighbor-post" data-feed-topic="'+group+'"><header><span class="neighbor-avatar" aria-hidden="true">'+initials+'</span><div><a href="'+url+'">'+e(name)+'</a><small>'+label+' · Wazoozie</small></div></header><a href="'+url+'" tabindex="-1" aria-hidden="true"><img src="/assets/'+photo+'.jpg" alt="'+('Published Middletown HVAC project' if label=='Published project' else 'Illustrative '+group+' service scene')+'" width="1200" height="800" loading="lazy"></a><div class="neighbor-post-copy"><h3>'+e(title)+'</h3><p>'+e(desc)+'</p></div><div class="neighbor-post-actions"><a href="'+url+'">Explore →</a><a href="/start/?intent='+intent+'">Ask about a project</a><button type="button" data-share-page="'+url+'" data-share-title="'+e(title,quote=True)+'">Share ↗</button></div></article>')
 intro='<section class="neighbor-welcome" aria-labelledby="hero-title"><div class="eyebrow">YOUR HOME. YOUR LOCAL PEOPLE.</div><h1 id="hero-title">Good things happen<br><em>around here.</em></h1><p>Local work, useful ideas and people worth knowing. A little help for the place you call home.</p><div class="neighbor-composer"><span class="neighbor-avatar" aria-hidden="true">⌂</span><a href="/start/">What’s happening at your house?</a><a class="btn primary" href="/start/">Start a project →</a></div></section>'
 topics=[('all','Everything'),('comfort','Heating & cooling'),('electrical','Electrical'),('plumbing','Plumbing'),('projects','Home projects'),('painting','Painting')]
 filters=''.join('<button type="button" data-feed-filter="'+key+'" aria-pressed="'+('true' if key=='all' else 'false')+'">'+label+'</button>' for key,label in topics)
 feed='<section class="neighbor-layout" aria-label="Around the neighborhood"><aside class="neighbor-rail"><h2>Make yourself at home.</h2><a href="/help/">⌂ Find the right help</a><a href="/#find">↗ Meet local businesses</a><a href="/projects/">▧ Real local work</a><a href="/neighbors/">♡ Invite a neighbor</a><a href="/before-you-approve/">✓ Before you approve</a><p>Delco · Chester County<br>The Main Line</p></aside><div class="neighbor-feed"><div class="neighbor-feed-heading"><h2>Around the neighborhood</h2><p>Project stories & local business introductions, curated by Wazoozie.</p></div><div class="neighbor-filters" aria-label="Filter neighborhood stories">'+filters+'</div><p id="neighbor-feed-status" class="neighbor-feedback" role="status" aria-live="polite"></p>'+''.join(cards)+'</div><aside class="neighbor-side"><div><div class="eyebrow">ONE GOOD INTRODUCTION</div><h2>Know someone<br>who needs a hand?</h2><p>Send a neighbor a place to start. They choose the business and the next step.</p><a class="btn primary" href="/neighbors/">Make a sharing link →</a></div><div><h3>Meet your local people.</h3><p>Explore the businesses behind the stories, then choose who you’d like to call.</p><a href="/home-services/">Meet the businesses →</a></div></aside></section>'
 f=out/'index.html';s=f.read_text();start=s.index('<section class="hero"');depth=0;end=None
 for token in re.finditer(r'</?section\b[^>]*>',s[start:]):
  depth+= -1 if token.group().startswith('</') else 1
  if depth==0:end=start+token.end();break
 hero=s[start:end]
 form=re.search(r'<form class="search".*?</form>',hero,re.S)
 if form:s=s.replace('<div class="filterline">',form.group()+'<div class="filterline">',1)
 s=s[:start]+intro+feed+s[end:];s=s.replace('</head>','<link rel="stylesheet" href="/assets/neighborhood-feed.css"></head>');s=s.replace('</body>','<script src="/assets/neighborhood-feed.js" defer></script></body>');f.write_text(s)
 for name in ('neighborhood-feed.css','neighborhood-feed.js'):shutil.copy(root/'assets'/name,out/'assets'/name)
