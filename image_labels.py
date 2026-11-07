"""Keep useful image descriptions and photo credits without production-method captions."""
import re


def clean(content):
    def caption(match):
        body=match.group(1)
        text=re.sub(r'<[^>]+>','',body).strip()
        if re.match(r'AI[- ](?:created|generated)\b',text,re.I):
            if 'fictional caricature' in text.lower():
                return '<figcaption>'+re.sub(r'^AI[- ](?:created|generated)\s+','',body,flags=re.I)+'</figcaption>'
            return ''
        return match.group(0)
    content=re.sub(r'<figcaption\b[^>]*>(.*?)</figcaption>',caption,content,flags=re.S)
    content=re.sub(r'<p class="(?:brand-image-note|homepage-image-note|match-caption)"[^>]*>.*?</p>',lambda m:'' if re.search(r'\bAI[- ](?:created|generated)\b',m.group(0),re.I) else m.group(0),content,flags=re.S)
    content=re.sub(r'<span class="grand-illustration-note"[^>]*>.*?</span>','',content,flags=re.S)
    content=re.sub(r'<small>AI[- ](?:created|generated).*?</small>','',content,flags=re.S|re.I)
    content=content.replace('Wazoozie AI-created editorial image; fictional people and scenes','Wazoozie editorial illustration')
    content=re.sub(r'\bAI[- ](?:created|generated)\s+','',content,flags=re.I)
    return content
