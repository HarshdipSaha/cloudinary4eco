from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('https://typesafe.ai', timeout=30000)
    page.wait_for_timeout(4000)
    content = page.inner_text('body')
    with open('typesafe_scraped.txt', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Saved typesafe_scraped.txt successfully!")
    browser.close()
