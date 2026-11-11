"""Read-only post-deployment checks for public search discovery and key HVAC pages."""
import argparse
import json
import sys
from pathlib import Path
from urllib.robotparser import RobotFileParser

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from search_submission import configuration, canonical_urls, validate_public_page
from scripts.submit_indexnow import fetch

KEY_PATHS = (
    '/', '/home-services/', '/businesses/middletown-hvac/',
    '/services/heating-cooling/', '/services/furnace-repair/',
    '/services/second-opinion/', '/services/water-heaters/', '/contact/',
)


def check(expected_dir=None):
    origin = configuration()['origin']
    status, sitemap = fetch(origin + '/sitemap.xml')
    if status != 200:
        raise RuntimeError(f'Live sitemap returned HTTP {status}.')
    urls = canonical_urls(sitemap, origin)
    if expected_dir:
        expected = canonical_urls((Path(expected_dir) / 'sitemap.xml').read_text(), origin)
        if set(expected) != set(urls):
            missing = sorted(set(expected) - set(urls))
            extra = sorted(set(urls) - set(expected))
            raise RuntimeError(f'Live sitemap differs from this build. Missing: {missing}; extra: {extra}')
    status, robots_text = fetch(origin + '/robots.txt')
    if status != 200:
        raise RuntimeError(f'Live robots.txt returned HTTP {status}.')
    robots = RobotFileParser()
    robots.parse(robots_text.splitlines())
    if origin + '/sitemap.xml' not in (robots.site_maps() or []):
        raise RuntimeError('Live robots.txt does not advertise the canonical sitemap.')
    checked = []
    for path in KEY_PATHS:
        url = origin + path
        if url not in urls:
            raise RuntimeError(f'Key public page is missing from the live sitemap: {url}')
        for bot in ('Googlebot', 'Bingbot', 'OAI-SearchBot'):
            if not robots.can_fetch(bot, url):
                raise RuntimeError(f'robots.txt disallows {bot} on {url}')
        status, markup = fetch(url)
        if status != 200:
            raise RuntimeError(f'{url}: returned HTTP {status}, expected 200.')
        validate_public_page(markup, url)
        checked.append(url)
    return {'status': 'passed', 'sitemapUrlCount': len(urls), 'verifiedPages': checked,
            'indexingConfirmed': False,
            'note': 'HTTP, canonical and crawl-directive checks only. Use search-engine dashboards for actual indexing.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--expected-dir', help='Compare the live sitemap to this built output directory after deployment.')
    args = parser.parse_args()
    print(json.dumps(check(args.expected_dir), indent=2))


if __name__ == '__main__':
    main()
