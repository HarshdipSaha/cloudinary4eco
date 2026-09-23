import json
import time
import os
from playwright.sync_api import sync_playwright

USER_DATA_DIR = r"C:\Users\HARSHDIP\AppData\Local\Google\Chrome\User Data"
RESULTS_FILE = "H:/code cubicle/twitter_jev_tweets.json"

def run_chrome_twitter(query="typesafe jev"):
    print("==================================================================")
    print("Launching your Google Chrome with your 'Default' Profile (harshdipsaha@gmail.com)...")
    print("==================================================================")
    
    with sync_playwright() as p:
        try:
            context = p.chromium.launch_persistent_context(
                user_data_dir=USER_DATA_DIR,
                channel="chrome",
                headless=False,
                args=[
                    "--profile-directory=Default",
                    "--disable-blink-features=AutomationControlled"
                ],
                viewport={"width": 1280, "height": 800}
            )
        except Exception as e:
            print(f"Error launching persistent context: {e}")
            return

        page = context.pages[0] if context.pages else context.new_page()
        
        # Navigate to Twitter / X
        print("Navigating to Twitter/X home to verify login state...")
        page.goto("https://x.com/home", timeout=60000)
        page.wait_for_timeout(4000)
        
        print(f"Current URL: {page.url}")
        print(f"Current Title: {page.title()}")
        
        # Navigate to search query
        search_url = f"https://x.com/search?q={query.replace(' ', '%20')}&f=live"
        print(f"\nNavigating to Live Search: {search_url}")
        page.goto(search_url, timeout=60000)
        page.wait_for_timeout(5000)
        
        print("Scrolling and harvesting live tweets from your authenticated session...")
        tweets_data = []
        seen_texts = set()
        
        for scroll in range(8):
            articles = page.locator("article[data-testid='tweet']").all()
            print(f"Scroll {scroll+1}/8: Found {len(articles)} tweet articles visible...")
            for art in articles:
                try:
                    text_el = art.locator("div[data-testid='tweetText']")
                    user_el = art.locator("div[data-testid='User-Name']")
                    if text_el.count() > 0:
                        text = text_el.first.inner_text()
                        user = user_el.first.inner_text() if user_el.count() > 0 else "Unknown"
                        if text not in seen_texts:
                            seen_texts.add(text)
                            tweets_data.append({
                                "user": user.replace("\n", " "),
                                "text": text
                            })
                except Exception:
                    continue
            page.mouse.wheel(0, 1500)
            page.wait_for_timeout(2500)
            
        print(f"\n>>> EXTRACTED {len(tweets_data)} UNIQUE TWEETS! <<<")
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(tweets_data, f, indent=2, ensure_ascii=False)
            
        print(f"Successfully saved all live tweets to: {RESULTS_FILE}")
        
        # Keep window open for 5 seconds so user can see it
        page.wait_for_timeout(5000)
        context.close()

if __name__ == "__main__":
    import sys
    q = sys.argv[1] if len(sys.argv) > 1 else "typesafe jev"
    run_chrome_twitter(q)
