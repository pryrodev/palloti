from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto("http://localhost:3001/en/publications")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path="/tmp/pubs.png", full_page=False)
    print("Screenshot saved")
    browser.close()
