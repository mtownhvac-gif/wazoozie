"""Small, optional motion on public browsing pages; request flows stay static."""
import re
import shutil


def add(out):
    for name in ('motion.css', 'motion.mjs'):
        shutil.copy(out.parent / 'assets' / name, out / 'assets' / name)
    sections = {'home-services', 'local-help', 'explore', 'services', 'businesses',
                'about', 'how-it-works', 'our-standards'}
    for target in out.rglob('*.html'):
        relative = target.relative_to(out)
        if str(relative) != 'index.html' and relative.parts[0] not in sections:
            continue
        content = re.sub(r'<body(?=[\s>])', '<body data-wz-motion', target.read_text(), count=1)
        content = content.replace('</head>', '<link rel="stylesheet" href="/assets/motion.css"></head>', 1)
        content = content.replace('</body>', '<script type="module" src="/assets/motion.mjs"></script></body>', 1)
        target.write_text(content)
