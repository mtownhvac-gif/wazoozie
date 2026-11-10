"""Warm project artwork and clear central-office email handoff."""
import shutil

def add(out):
    shutil.copy(out.parent/'assets/project-welcome-2026.webp',out/'assets/project-welcome-2026.webp')
    style='''<style>.project-intro.project-intro-visual{max-width:none;display:grid;grid-template-columns:1.05fr 1fr;align-items:center;gap:35px;padding:30px 0}.project-intro-visual h1{font-size:clamp(40px,4.5vw,66px)}.project-welcome{margin:0}.project-welcome img{width:100%;height:auto;display:block;border-radius:24px}.project-welcome figcaption{font-size:11px;color:#71675d;margin-top:8px}.desk-route{background:#e9ede4;border-radius:14px;padding:18px 22px;line-height:1.7;margin:18px 0 28px}.desk-route p{margin:8px 0}.desk-route a{font-weight:650}@media(max-width:760px){.project-intro.project-intro-visual{grid-template-columns:1fr;gap:20px}.project-welcome{max-width:560px}}</style>'''
    for target in out.rglob('*.html'):
        s=target.read_text().replace('hello@wazoozie.com','wazooziehelp@gmail.com')
        if target==out/'start/index.html':
            s=s.replace('<section class="project-intro">','<section class="project-intro project-intro-visual"><div>',1)
            s=s.replace('</p></section>','</p></div><figure class="project-welcome"><img src="/assets/project-welcome-2026.webp" width="1200" height="800" fetchpriority="high" alt="Clay-style homeowner and carpenter planning a project together on a Pennsylvania stone porch"><figcaption>Illustration · fictional homeowner and contractor.</figcaption></figure></section>',1)
            s=s.replace('<div class="project-layout">','<aside class="desk-route"><strong>A local introduction, with a person in the middle.</strong><p>Email your project brief to <a href="mailto:wazooziehelp@gmail.com">wazooziehelp@gmail.com</a>. Our team reviews it and forwards it to the appropriate business. The planner prepares an email for you to review and send; saving notes alone does not send an email.</p><p>Need help sooner? Call the business directly to ask about availability.</p></aside><div class="project-layout">',1)
            s=s.replace('</head>',style+'</head>',1)
        target.write_text(s)
