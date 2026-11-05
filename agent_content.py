"""Generate public Markdown from the same rendered content people read."""
from html.parser import HTMLParser
from urllib.parse import urljoin
import re

class Markdown(HTMLParser):
    def __init__(self, origin):
        super().__init__(); self.origin=origin; self.parts=[]; self.in_main=False; self.skip=0; self.links=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='main': self.in_main=True
        if not self.in_main:return
        if tag in ('script','style'):self.skip+=1
        if self.skip:return
        if tag in ('h1','h2','h3','h4'):self.parts.append('\n\n'+'#'*int(tag[1])+' ')
        elif tag in ('p','div','section','article','figure','blockquote','details'):self.parts.append('\n\n')
        elif tag=='li':self.parts.append('\n- ')
        elif tag=='br':self.parts.append('\n')
        elif tag=='a':self.links.append(urljoin(self.origin,a.get('href','')));self.parts.append('[')
    def handle_endtag(self,tag):
        if tag=='main':self.in_main=False
        if not self.in_main:return
        if tag in ('script','style'):self.skip=max(0,self.skip-1);return
        if self.skip:return
        if tag=='a' and self.links:self.parts.append(']('+self.links.pop()+')')
        elif tag in ('p','h1','h2','h3','h4','li','section','article','blockquote'):self.parts.append('\n\n')
    def handle_data(self,data):
        if self.in_main and not self.skip:self.parts.append(re.sub(r'\s+',' ',data))

def generate(out,origin):
    from conversion import DISCLOSURE
    for f in out.rglob('index.html'):
        path='/' if f.parent==out else '/'+str(f.parent.relative_to(out))+'/'
        if path=='/404/':continue
        parser=Markdown(origin+path);parser.feed(f.read_text())
        content=re.sub(r'\n[ \t]+','\n',''.join(parser.parts))
        content=re.sub(r'\n{3,}','\n\n',content).strip()
        target=out/'agent-content'/f.relative_to(out).with_suffix('.md')
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text('Source: '+origin+path+'\n\n'+content+'\n\n## About this directory\n\n'+DISCLOSURE+'\n\nContact the selected business directly. Email request forms prepare drafts; automatic lead delivery is not enabled. Confirm coverage and availability with the business.\n')
