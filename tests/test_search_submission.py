import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from search_submission import canonical_urls,configuration,prepare


def sitemap(url):
    return '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+url+'</loc></url></urlset>'


class SearchSubmissionTests(unittest.TestCase):
    def test_only_public_canonical_pages(self):
        self.assertEqual(canonical_urls(sitemap('https://wazoozie.com/'),'https://wazoozie.com'),['https://wazoozie.com/'])
        for url in ['https://other.test/','http://wazoozie.com/','https://wazoozie.com/start/?neighbor=private','https://wazoozie.com/#secret','https://wazoozie.com/api/project-briefs/','https://user@wazoozie.com/']:
            with self.subTest(url=url),self.assertRaises(ValueError):canonical_urls(sitemap(url),'https://wazoozie.com')

    def test_empty_or_wrong_document_rejected(self):
        for xml in ['<html/>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>']:
            with self.assertRaises(ValueError):canonical_urls(xml,'https://wazoozie.com')

    def test_key_published_for_production_only(self):
        config=configuration()
        with tempfile.TemporaryDirectory() as folder:
            out=Path(folder)
            prepare(out,'')
            self.assertEqual(list(out.iterdir()),[])
            prepare(out,config['origin'])
            self.assertEqual((out/(config['key']+'.txt')).read_text().strip(),config['key'])




class SearchReadinessTests(unittest.TestCase):
    def test_internal_and_noncanonical_paths_rejected(self):
        for path in ['/account/', '/model-lab/', '/agent-content/', '/404/', '//services/', '/services/%66urnace-repair/', '/Services/']:
            with self.subTest(path=path), self.assertRaises(ValueError):
                canonical_urls(sitemap('https://wazoozie.com'+path), 'https://wazoozie.com')

    def test_live_page_must_match_canonical_and_allow_indexing(self):
        from search_submission import validate_public_page
        url = 'https://wazoozie.com/services/furnace-repair/'
        page = '<!doctype html><html><head><link rel="canonical" href="'+url+'"><meta name="robots" content="index,follow"></head></html>'
        validate_public_page(page, url)
        for markup in [page.replace(url, 'https://other.invalid/'), page.replace('index,follow', 'noindex,follow'), page.replace('index,follow', 'NONE'), page.replace('name="robots"', 'name="bingbot"').replace('index,follow', 'noindex'), page.replace('</head>', '<link rel="canonical" href="'+url+'"></head>'), '<html>Challenge page</html>']:
            with self.subTest(markup=markup), self.assertRaises(ValueError):
                validate_public_page(markup, url)

    def test_changed_urls_require_explicit_scope_and_sitemap_membership(self):
        from search_submission import select_urls
        urls = ['https://wazoozie.com/', 'https://wazoozie.com/services/furnace-repair/']
        self.assertEqual(select_urls(urls, [urls[1], urls[1]]), [urls[1]])
        self.assertEqual(select_urls(urls, all_urls=True), urls)
        for requested, full in [(None, False), ([urls[0]], True), (['https://wazoozie.com/account/'], False), ([urls[0]+'?ref=private'], False)]:
            with self.subTest(requested=requested), self.assertRaises(ValueError):
                select_urls(urls, requested, full)

class SubmissionCommandTests(unittest.TestCase):
    def test_submit_requires_deliberate_scope_before_any_network_call(self):
        from unittest.mock import patch
        from scripts.submit_indexnow import main
        import contextlib, io
        with patch('scripts.submit_indexnow.fetch') as fetch, contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                main(['--submit'])
            fetch.assert_not_called()

    def test_only_selected_live_verified_pages_are_sent(self):
        from unittest.mock import patch
        from scripts.submit_indexnow import main
        import contextlib, io
        config = configuration()
        url = 'https://wazoozie.com/services/furnace-repair/'
        calls = []
        def fake_fetch(target, payload=None):
            calls.append((target, payload))
            if target.endswith('/sitemap.xml'):
                return 200, sitemap(url).replace('</urlset>', '<url><loc>https://wazoozie.com/</loc></url></urlset>')
            if target.endswith('.txt'):
                return 200, config['key']
            if payload is not None:
                return 200, ''
            return 200, '<html><head><link rel="canonical" href="'+target+'"></head></html>'
        with patch('scripts.submit_indexnow.fetch', side_effect=fake_fetch), contextlib.redirect_stdout(io.StringIO()):
            main(['--submit', '--url', url, '--url', url])
        posts = [payload for target, payload in calls if payload is not None]
        self.assertEqual(len(posts), 1)
        self.assertEqual(posts[0]['urlList'], [url])
        self.assertFalse(any(target == 'https://wazoozie.com/' for target, payload in calls))

    def test_nonindexable_live_page_stops_before_submission(self):
        from unittest.mock import patch
        from scripts.submit_indexnow import main
        config = configuration()
        url = 'https://wazoozie.com/'
        with patch('scripts.submit_indexnow.fetch', side_effect=[(200, sitemap(url)), (200, config['key']), (200, '<html><link rel="canonical" href="'+url+'"><meta name="robots" content="noindex"></html>')]) as fetch:
            with self.assertRaises(ValueError):
                main(['--submit', '--url', url])
            self.assertEqual(fetch.call_count, 3)


if __name__ == '__main__':
    unittest.main()
