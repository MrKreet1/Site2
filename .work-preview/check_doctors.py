from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge')
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.goto('http://127.0.0.1:8765/team.html')
    page.locator('[data-lang="ru"]').click()
    cards = page.locator('.doctor-card:visible')
    assert cards.count() == 6
    page.locator('#doctor-search').fill('  АХМЕТОВА  ')
    assert cards.count() == 1
    page.locator('#doctor-search').fill('')
    page.locator('#doctor-specialty').select_option('doctor-4')
    assert cards.count() == 1
    assert cards.first.get_attribute('data-doctor') == 'doctor-4'
    page.locator('[data-lang="en"]').click()
    assert cards.count() == 1
    assert 'Ultrasound' in cards.first.inner_text()
    assert 'Specialists found: 1' == page.locator('#doctor-count').inner_text()
    page.locator('#doctor-search').fill('no-such-name')
    assert cards.count() == 0
    assert page.locator('#doctor-empty').is_visible()
    page.locator('#doctor-reset').click()
    assert cards.count() == 6
    assert page.locator('#doctor-search').input_value() == ''
    page.locator('.doctor-details summary').first.click()
    assert page.locator('.doctor-biography').first.is_visible()
    assert 'Education' in page.locator('.doctor-biography').first.inner_text()
    page.locator('[data-lang="kk"]').click()
    assert 'Білімі' in page.locator('.doctor-biography').first.inner_text()
    page.locator('.doctor-details summary').first.click()
    for img in page.locator('.doctor-portrait img').all():
        img.scroll_into_view_if_needed()
        img.evaluate('(img) => img.decode()')
        assert img.evaluate('(img) => img.naturalWidth > 0')
    page.locator('[data-lang="ru"]').click()
    page.evaluate('scrollTo(0, 0)')
    page.screenshot(path='.work-preview/doctors-desktop.png', full_page=True)
    print('Six local portraits, search, specialty filter, combined empty state, reset, multilingual details: passed')
    # Direct-file use is supported by the static site.
    from pathlib import Path
    page.goto(Path('clinic-site/team.html').resolve().as_uri())
    assert page.locator('.doctor-card').count() == 6
    assert page.locator('#doctor-count').inner_text().endswith('6')
    print('Direct file opening: passed')
    browser.close()
