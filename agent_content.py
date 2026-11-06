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
    disclosure = 'Wazoozie provides local recommendations and public business information for home services, automotive care and real estate. New referral profiles identify owner recommendations and linked public sources; those are not independent credential inspections. Wazoozie is operated by Bryan Cordy, owner of Middletown HVAC. You choose who to contact and agree on services directly.'
    delivery = 'Optional Middletown project-request submission supports email delivery through the configured Zapier integration after explicit consent. Saving alone and preparing an email draft do not send email. Other businesses and professionals are contacted directly. An accepted email request does not confirm inbox receipt or book an appointment.'
    directory = out / 'llms.txt'
    if directory.exists():
        summary = directory.read_text()
        summary = summary.replace('Email forms prepare drafts; they do not automatically deliver leads.', delivery)
        summary = summary.replace('Listed businesses have been vetted by Wazoozie;', 'Home-service profile evidence panels describe selection and recorded checks;')
        summary += '\n## Expanded local referrals\n\n' + origin + '/local-help/ connects home services, automotive care and real estate. ' + origin + '/auto-mechanics/ lists C&J Automotive & Tire at Upper Chichester Authority Auto Repair in Glenolden and Trans Man Transmissions in Eddystone. ' + origin + '/real-estate-agents/ lists Caitlin Kerezsi, Megan Kerezsi and Libbi Skivo. ' + origin + '/vehicle-wraps/ lists Sound Wraps in West Chester. ' + origin + '/pricing-guide/ links business-published price references with scope and dates; it does not claim market averages or lowest prices. ' + origin + '/before-you-say-yes/ offers behavior-based buying questions across directory industries. These new profiles identify owner recommendations and linked official business details; they do not claim independent credential inspections.\n\n## Public daily learning game\n\n' + origin + '/good-call-club/ offers five daily quiz questions with browser-local nonmonetary points and digital badges. No cash, discounts, prizes or affiliate reward offers are promised. It does not sync quiz progress to accounts.\n\n## Account and agent capabilities\n\n' + origin + '/account/ offers optional, user-operated passkey sign-in for private saved projects and favorite home-service businesses. It is excluded from the public sitemap. Browsing and direct business contact do not require an account. Delegated OAuth access, an authenticated MCP service and autonomous appointment booking are not implemented or advertised. Private account data and submitted briefs have no public listing endpoint.\n'
        directory.write_text(summary)
    for f in out.rglob('index.html'):
        path='/' if f.parent==out else '/'+str(f.parent.relative_to(out))+'/'
        if path=='/404/':continue
        parser=Markdown(origin+path);parser.feed(f.read_text())
        content=re.sub(r'\n[ \t]+','\n',''.join(parser.parts))
        content=re.sub(r'\n{3,}','\n\n',content).strip()
        target=out/'agent-content'/f.relative_to(out).with_suffix('.md')
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text('Source: '+origin+path+'\n\n'+content+'\n\n## About this directory\n\n'+disclosure+'\n\n'+delivery+'\n')
