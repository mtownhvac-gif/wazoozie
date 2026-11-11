import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from scripts.check_live_search import check, KEY_PATHS

ORIGIN = 'https://wazoozie.com'
XML = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>'+ORIGIN+path+'</loc></url>' for path in KEY_PATHS) + '</urlset>'


def response(url, payload=None):
    if url.endswith('/sitemap.xml'):
        return 200, XML
    if url.endswith('/robots.txt'):
        return 200, 'User-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n'
    return 200, '<html><head><link rel="canonical" href="'+url+'"><meta name="robots" content="index,follow"></head></html>'


class LiveSearchTests(unittest.TestCase):
    def test_read_only_check_passes_without_claiming_indexing(self):
        with patch('scripts.check_live_search.fetch', side_effect=response) as fetch:
            result = check()
            self.assertEqual(result['status'], 'passed')
            self.assertEqual(result['sitemapUrlCount'], len(KEY_PATHS))
            self.assertFalse(result['indexingConfirmed'])
            self.assertTrue(all(len(call.args) == 1 for call in fetch.call_args_list))

    def test_stale_live_sitemap_does_not_pass_release_check(self):
        with tempfile.TemporaryDirectory() as folder:
            Path(folder, 'sitemap.xml').write_text(XML.replace('</urlset>', '<url><loc>'+ORIGIN+'/new-page/</loc></url></urlset>'))
            with patch('scripts.check_live_search.fetch', side_effect=response), self.assertRaisesRegex(RuntimeError, 'differs from this build'):
                check(folder)

    def test_specific_bot_block_is_detected(self):
        def blocked(url):
            if url.endswith('/robots.txt'):
                return 200, 'User-agent: Bingbot\nDisallow: /\n\nUser-agent: *\nAllow: /\nSitemap: '+ORIGIN+'/sitemap.xml\n'
            return response(url)
        with patch('scripts.check_live_search.fetch', side_effect=blocked), self.assertRaisesRegex(RuntimeError, 'disallows Bingbot'):
            check()

    def test_non_200_page_is_not_mistaken_for_search_readiness(self):
        def failed(url):
            return (503, 'Unavailable') if url == ORIGIN+'/' else response(url)
        with patch('scripts.check_live_search.fetch', side_effect=failed), self.assertRaisesRegex(RuntimeError, 'returned HTTP 503'):
            check()


if __name__ == '__main__':
    unittest.main()
