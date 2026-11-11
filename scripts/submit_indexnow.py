"""Notify participating search engines after deployment; dry run unless --submit."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from search_submission import configuration, canonical_urls, select_urls, validate_public_page


def fetch(url, payload=None):
    command = ['curl', '--silent', '--show-error', '--max-time', '30', '--proto', '=https', '--write-out', '\n%{http_code}', url]
    if payload is not None:
        command += ['--header', 'Content-Type: application/json; charset=utf-8', '--data-binary', '@-']
    result = subprocess.run(command, input=json.dumps(payload) if payload is not None else None, text=True, capture_output=True, check=True)
    body, _, status = result.stdout.rpartition('\n')
    return int(status), body


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--submit', action='store_true', help='Notify IndexNow after verifying the live key and selected pages.')
    parser.add_argument('--url', action='append', help='Changed canonical URL. Repeat for each newly deployed or updated page.')
    parser.add_argument('--all', action='store_true', help='Intentionally notify all public sitemap URLs, for example at first launch.')
    args = parser.parse_args(argv)
    if args.url and args.all:
        parser.error('Choose --url or --all, not both.')
    if args.submit and not (args.url or args.all):
        parser.error('--submit needs --url for changed pages or --all for an intentional full submission.')
    config = configuration()
    origin, key = config['origin'], config['key']
    status, sitemap = fetch(origin + '/sitemap.xml')
    if status != 200:
        raise RuntimeError('The live sitemap is unavailable; nothing was submitted.')
    sitemap_urls = canonical_urls(sitemap, origin)
    urls = select_urls(sitemap_urls, args.url, args.all) if args.url or args.all else sitemap_urls
    key_location = origin + '/' + key + '.txt'
    status, proof = fetch(key_location)
    if status != 200 or proof.strip() != key:
        raise RuntimeError('The live ownership file is not verified; nothing was submitted.')
    for url in urls if args.submit or args.url else []:
        status, markup = fetch(url)
        if status != 200:
            raise RuntimeError(f'{url}: live page returned HTTP {status}; nothing was submitted.')
        validate_public_page(markup, url)
    print(f'Verified live ownership file; selected {len(urls)} of {len(sitemap_urls)} canonical public sitemap URLs.', flush=True)
    if not args.submit:
        print('Dry run only. Use --submit --url CANONICAL_URL after deployment; --all is for an intentional full submission.')
        return
    payload = {'host': 'wazoozie.com', 'key': key, 'keyLocation': key_location, 'urlList': urls}
    status, body = fetch('https://api.indexnow.org/indexnow', payload)
    if status not in (200, 202):
        raise RuntimeError(f'IndexNow returned HTTP {status}; submission is not confirmed. {body[:200]}')
    result = {'submittedAt': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(), 'httpStatus': status, 'urlCount': len(urls), 'status': 'received' if status == 200 else 'received_key_validation_pending', 'indexingGuaranteed': False}
    print(json.dumps(result))


if __name__ == '__main__':
    main()
