import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('plain copy preserves quotations, typed notes, scripts and link destinations',()=>{
 const result=execFileSync('python3',['-c',`
from plain_language import clean
sample='<h2>A clearer next step for painting.</h2><blockquote>Your next chapter</blockquote><textarea>Your next chapter</textarea><script>const s="Your next chapter";</script><a href="/next-chapter/">The next chapter.</a>'
assert clean(sample)=='<h2>Help with painting.</h2><blockquote>Your next chapter</blockquote><textarea>Your next chapter</textarea><script>const s="Your next chapter";</script><a href="/next-chapter/">Buying & selling.</a>'
print('ok')
`],{encoding:'utf8'});
 assert.equal(result.trim(),'ok');
});

test('all built pages avoid generation labels and retired vague headings',()=>{
 const result=execFileSync('python3',['-c',`
from pathlib import Path
from html.parser import HTMLParser
import re
class Text(HTMLParser):
 def __init__(self): super().__init__(); self.skip=0; self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag in ('script','style'): self.skip+=1
  for key,value in attrs:
   if key in ('alt','title','aria-label') and value: self.parts.append(value)
 def handle_endtag(self,tag):
  if tag in ('script','style'): self.skip-=1
 def handle_data(self,value):
  if not self.skip: self.parts.append(value)
pages=list(Path('dist').rglob('index.html'))
assert len(pages)>=78
for page in pages:
 p=Text();p.feed(page.read_text());text=' '.join(p.parts)
 assert not re.search(r'\\bAI(?:[- ](?:created|generated))?\\b|artificial intelligence|a clearer next step|your next chapter|local people[.] real possibilities',text,re.I), str(page)
print(len(pages))
`],{encoding:'utf8'});
 assert.ok(Number(result.trim())>=78);
});
