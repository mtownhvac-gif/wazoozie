"""Notify participating search engines after deployment; dry run unless --submit."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from search_submission import configuration, canonical_urls


def fetch(url, payload=None):
    command = ['curl', '--silent', '--show-error', '--max-time', '30', '--proto', '=https', '--write-out', '\n%{http_code}', url]
    if payload is not None:
        command += ['--header', 'Content-Type: application/json; charset=utf-8', '--data-binary', '@-']
    result = subprocess.run(command, input=json.dumps(payload) if payload is not None else None, text=True, capture_output=True, check=True)
    body, _, status = result.stdout.rpartition('\n')
    return int(status), body


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--submit', action='store_true', help='Send public sitemap URLs to IndexNow after live key verification.')
    args = parser.parse_args()
    config = configuration()
    origin, key = config['origin'], config['key']
    status, sitemap = fetch(origin + '/sitemap.xml')
    if status != 200:
        raise RuntimeError('The live sitemap is unavailable; nothing was submitted.')
    urls = canonical_urls(sitemap, origin)
    key_location = origin + '/' + key + '.txt'
    status, proof = fetch(key_location)
    if status != 200 or proof.strip() != key:
        raise RuntimeError('The live ownership file is not verified; nothing was submitted.')
    print(f'Verified live ownership file and {len(urls)} canonical public sitemap URLs.', flush=True)
    if not args.submit:
        print('Dry run only. Use --submit after deployment to notify participating search engines.')
        return
    payload = {'host': 'wazoozie.com', 'key': key, 'keyLocation': key_location, 'urlList': urls}
    status, body = fetch('https://api.indexnow.org/indexnow', payload)
    if status not in (200, 202):
        raise RuntimeError(f'IndexNow returned HTTP {status}; submission is not confirmed. {body[:200]}')
    result = {'submittedAt': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(), 'httpStatus': status, 'urlCount': len(urls), 'status': 'received' if status == 200 else 'received_key_validation_pending', 'indexingGuaranteed': False}
    print(json.dumps(result))


if __name__ == '__main__':
    main()
