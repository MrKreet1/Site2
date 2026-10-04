from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: errors.append(f'HTTP {response.status}: {response.url}') if response.status >= 400 else None)
    for name in ['index.html', 'team.html']:
        page.goto('http://127.0.0.1:8765/' + name)
        for lang in ['ru', 'kk', 'en']:
            page.locator(f'[data-lang="{lang}"]').click()
            assert page.locator('html').get_attribute('lang') == lang
            for width in [320, 390, 768, 900, 1024, 1152, 1280, 1440]:
                page.set_viewport_size({'width': width, 'height': 1000})
                page.wait_for_timeout(40)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow: {name}, {lang}, {width}'
        print(name + ': three languages and eight screen widths passed')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.locator('[data-lang="ru"]').click()
    page.locator('#menu-toggle').click()
    assert page.locator('#site-nav').is_visible()
    assert page.locator('#site-nav [aria-current="page"]').count() == 1
    page.keyboard.press('Escape')
    assert page.locator('#menu-toggle').get_attribute('aria-expanded') == 'false'
    page.screenshot(path='.work-preview/team-mobile.png', full_page=True)
    page.locator('.header-tools [data-set-theme="dark"]').click()
    page.reload()
    assert page.locator('html').get_attribute('data-theme') == 'dark'
    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.screenshot(path='.work-preview/team-dark.png', full_page=True)
    missing = page.evaluate('''() => {
      const texts = {...window.CLINIC_CONTENT[document.documentElement.lang], ...window.CLINIC_PAGE_CONTENT[document.documentElement.lang]};
      return [...document.querySelectorAll('[data-i18n], [data-i18n-alt], [data-i18n-aria]')].flatMap(e => ['i18n','i18nAlt','i18nAria'].filter(k => e.dataset[k] && !texts[e.dataset[k]]).map(k => e.dataset[k]));
    }''')
    assert not missing, missing
    links = page.locator('a[href]').evaluate_all('(els) => els.map(e => e.getAttribute("href"))')
    for link in links:
        parsed = urlparse(link)
        if parsed.scheme or parsed.netloc:
            continue
        target = Path('clinic-site') / (unquote(parsed.path) or 'team.html')
        assert target.exists(), link
        if parsed.fragment:
            assert f'id="{parsed.fragment}"' in target.read_text(encoding='utf-8'), link
    page.locator('.team-visit-actions .btn').click()
    assert page.url.endswith('/index.html#appointment')
    assert page.locator('#appointment').is_visible()
    page.locator('#site-nav a[href="team.html"]').click()
    assert page.url.endswith('/team.html')
    assert not errors, errors
    print('Menu, Escape, theme persistence, translations, links and booking navigation passed; no browser errors')
    nojs = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
    static = nojs.new_page()
    static.goto('http://127.0.0.1:8765/team.html')
    assert static.locator('h1').inner_text().strip()
    assert not static.evaluate('document.documentElement.scrollWidth > innerWidth'), 'No-JS overflow'
    assert static.locator('#site-nav').is_visible()
    print('Russian content and navigation are available without JavaScript')
    browser.close()
