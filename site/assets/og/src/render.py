"""Run from repository root while python -m http.server 8765 is running.

Requires existing Python Playwright, Pillow and Chromium; installs nothing.
"""
from pathlib import Path
import os
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[4]
OG = ROOT / 'site/assets/og'

with sync_playwright() as p:
    executable = Path(p.chromium.executable_path)
    if not executable.exists():
        executable = next((Path(os.environ['LOCALAPPDATA']) / 'ms-playwright').glob('chromium-*/chrome-win/chrome.exe'))
    browser = p.chromium.launch(executable_path=str(executable), headless=True)
    page = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for variant in ['a', 'b']:
        page.goto(f'http://127.0.0.1:8765/site/assets/og/src/og-{variant}.html', wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        page.evaluate("document.fonts.load('110px \"Bodoni Moda\"')")
        fonts = page.evaluate("[...document.fonts].filter(f => f.family.includes('Bodoni')).map(f => f.status)")
        assert fonts and all(status == 'loaded' for status in fonts), fonts
        assert page.evaluate('Promise.all([...document.images].map(i => i.decode().then(() => true)))')
        page.screenshot(path=str(OG / f'og-{variant}.png'))
        print(f'OGP {variant.upper()}: 1200x630; Bodoni Moda loaded')
    browser.close()
    assert not errors, errors

# Original size, half size, and small social preview, side by side for each variant.
sheet = Image.new('RGB', (2448, 1222), '#e9edf1')
draw = ImageDraw.Draw(sheet)
for x, variant in [(16, 'a'), (1232, 'b')]:
    source = Image.open(OG / f'og-{variant}.png').convert('RGB')
    for y, size, label in [(34, (1200, 630), '1200 x 630'), (700, (600, 315), '600 x 315'), (1049, (300, 157), '300 x 157')]:
        draw.text((x, y - 22), f'{variant.upper()} / {label}', fill='#10233e')
        sheet.paste(source.resize(size, Image.Resampling.LANCZOS), (x, y))
check = ROOT / '.tmp_check/r11-og.png'
check.parent.mkdir(exist_ok=True)
sheet.save(check)
print(check)
