import json
import time
from playwright.sync_api import sync_playwright

def connect_and_search_twitter(query="typesafe jev"):
    with sync_playwright() as p:
        print("Connecting to running Chrome browser at http://localhost:9222...")
        try:
            browser = p.chromium.connect_over_cdp("http://localhost:9222")
            print("Connected successfully to your active Google Chrome browser!")
        except Exception as e:
            print(f"Failed to connect to Chrome over CDP on port 9222: {e}")
            return

        contexts = browser.contexts
        print(f"Found {len(contexts)} browser context(s).")
        
        if not contexts:
            context = browser.new_context()
        else:
            context = contexts[0]
            
        pages = context.pages
        print(f"Found {len(pages)} open tab(s).")
        
        # Check existing tabs
        target_page = None
        for idx, page in enumerate(pages):
            try:
                url = page.url
                title = page.title()
                print(f"Tab {idx+1}: [{title}] -> {url}")
                if "x.com" in url or "twitter.com" in url:
                    target_page = page
                    print(f"--> Found existing X/Twitter tab: {url}")
            except Exception:
                continue
                
        if not target_page:
            print("Opening new tab in your logged-in Chrome browser...")
            target_page = context.new_page()
        else:
            print("Using existing X/Twitter tab...")
            
        # Navigate to search query
        search_url = f"https://x.com/search?q={query.replace(' ', '%20')}&f=live"
        print(f"Navigating to {search_url}...")
        target_page.goto(search_url, timeout=60000)
        target_page.wait_for_timeout(5000)
        
        print(f"Active Page URL: {target_page.url}")
        print(f"Active Page Title: {target_page.title()}")
        
        # Extract tweets
        tweets_data = []
        seen_texts = set()
        
        print("Scrolling and harvesting live tweets...")
        for scroll in range(6):
            articles = target_page.locator("article[data-testid='tweet']").all()
            print(f"Found {len(articles)} tweet articles on screen (scroll {scroll+1}/6)...")
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
                except Exception as e:
                    continue
            target_page.mouse.wheel(0, 1500)
            target_page.wait_for_timeout(2500)
            
        print(f"\nSUCCESS! Extracted {len(tweets_data)} live tweets from your Chrome browser session!")
        with open("H:/code cubicle/twitter_jev_tweets.json", "w", encoding="utf-8") as f:
            json.dump(tweets_data, f, indent=2, ensure_ascii=False)
            
        print("Saved results to H:/code cubicle/twitter_jev_tweets.json")

if __name__ == "__main__":
    import sys
    q = sys.argv[1] if len(sys.argv) > 1 else "typesafe jev"
    connect_and_search_twitter(q)
