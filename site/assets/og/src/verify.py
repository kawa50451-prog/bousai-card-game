"""Check public heads and JavaScript using the local repository-root server."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json
import re
import os
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[4]
DATA = json.loads((Path(__file__).parent / 'metadata.json').read_text(encoding='utf8'))

class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == 'meta':
            self.meta.append(dict(attrs))
        if tag == 'link':
            self.links.append(dict(attrs))

for data in DATA:
    source = (ROOT / 'site' / data['file']).read_text(encoding='utf8').split('</head>')[0]
    head = Head()
    head.feed(source)
    keys = [m.get('name', m.get('property')) for m in head.meta if m.get('name') or m.get('property')]
    assert all(n == 1 for n in Counter(keys).values()), data['file']
    values = {m.get('name', m.get('property')): m.get('content') for m in head.meta}
    for key in ['description', 'og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name', 'og:locale', 'twitter:card', 'theme-color']:
        assert values.get(key), (data['file'], key)
    assert values['description'] == values['og:description'] == data['description']
    assert 60 <= len(values['description']) <= 120
    assert values['robots'] == 'noindex, nofollow'
    assert values['og:image'] == 'https://readyorlab.com/assets/og/og-a.png'
    path = '/' if data['file'] == 'index.html' else '/' + data['file'].removesuffix('.html')
    for rel in ['canonical', 'apple-touch-icon', 'manifest']:
        assert sum(link.get('rel') == rel for link in head.links) == 1
    assert next(link['href'] for link in head.links if link.get('rel') == 'canonical') == values['og:url'] == 'https://readyorlab.com' + path
    assert len(re.findall('<title>', source)) == 1
    assert '<title>' + data['title'] + '</title>' in source
    schemas = re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)
    assert len(schemas) == 1
    schema = json.loads(schemas[0])
    if data['file'] == 'index.html':
        assert {s['@type'] for s in schema['@graph']} == {'WebSite', 'Organization', 'VideoGame'}
        game = next(s for s in schema['@graph'] if s['@type'] == 'VideoGame')
        assert game['numberOfPlayers']['minValue'] == 1 and game['numberOfPlayers']['maxValue'] == 5
        assert game['url'] == 'https://toshibousai-cardgame.web.app/'
        assert all('?' not in g for g in game['genre'])
    else:
        assert schema['@type'] == 'BreadcrumbList'
        assert [item['position'] for item in schema['itemListElement']] == [1, 2]
    print(data['file'], 'canonical/og/description/duplicates/JSON-LD OK', len(values['description']))

tree = ET.parse(ROOT / 'site/sitemap.xml').getroot()
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
assert len(tree) == 8
assert all(e.text == '2026-11-07' for e in tree.findall('s:url/s:lastmod', ns))
json.loads((ROOT / 'site/site.webmanifest').read_text(encoding='utf8'))

with sync_playwright() as p:
    executable = Path(p.chromium.executable_path)
    if not executable.exists():
        executable = next((Path(os.environ['LOCALAPPDATA']) / 'ms-playwright').glob('chromium-*/chrome-win/chrome.exe'))
    browser = p.chromium.launch(executable_path=str(executable), headless=True)
    for width, height in [(1440, 900), (390, 844)]:
        for data in DATA + [{'file': '404.html'}]:
            page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('console', lambda message: errors.append(message.text) if message.type == 'error' and 'Failed to load resource' not in message.text else None)
            response = page.goto('http://127.0.0.1:8765/site/' + data['file'], wait_until='networkidle')
            assert response.status == 200
            page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
            page.wait_for_timeout(250)
            page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            page.wait_for_timeout(250)
            assert not errors, (data['file'], width, errors)
            print(data['file'], width, 'JS errors: 0')
            page.close()
    browser.close()
print('PASS: 8 public heads; JSON-LD JSON parsing; sitemap; manifest; desktop/mobile JS')
