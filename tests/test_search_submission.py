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


if __name__=='__main__':unittest.main()
