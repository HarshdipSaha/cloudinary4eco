import time
import json
import os
import sys
from playwright.sync_api import sync_playwright

AUTH_FILE = "H:/code cubicle/twitter_auth.json"
RESULTS_FILE = "H:/code cubicle/twitter_jev_tweets.json"

def run_interactive_twitter_harvest(queries=None):
    if queries is None:
        queries = [
            "typesafe jev",
            "typesafe.ai",
            "from:CompleteSkeptic jev",
            "#TypeSafeAI"
        ]

    print("=" * 75)
    print("      INTERACTIVE TWITTER / X HARVESTER (TYPESAFE JEV RESEARCH)      ")
    print("=" * 75)
    
    with sync_playwright() as p:
        # Try launching real Google Chrome if available, otherwise Chromium
        browser = None
        try:
            print("Launching real Google Chrome window on your screen...")
            browser = p.chromium.launch(
                channel="chrome",
                headless=False,
                args=["--start-maximized", "--disable-blink-features=AutomationControlled"]
            )
        except Exception:
            print("Launching Chromium window on your screen...")
            browser = p.chromium.launch(
                headless=False,
                args=["--start-maximized", "--disable-blink-features=AutomationControlled"]
            )

        # Load existing saved session if present
        if os.path.exists(AUTH_FILE) and os.path.getsize(AUTH_FILE) > 50:
            print(f"Loading existing authenticated session from: {AUTH_FILE}")
            try:
                context = browser.new_context(
                    storage_state=AUTH_FILE,
                    no_viewport=True
                )
            except Exception as e:
                print(f"Could not load {AUTH_FILE} ({e}), starting fresh session...")
                context = browser.new_context(no_viewport=True)
        else:
            context = browser.new_context(no_viewport=True)

        page = context.new_page()

        # Step 1: Open Twitter / X
        print("Navigating to https://x.com/home...")
        page.goto("https://x.com/home", timeout=60000)
        page.wait_for_timeout(4000)

        # Step 2: Check if already logged in
        is_logged_in = False
        try:
            if page.locator("a[data-testid='AppTabBar_Profile_Link']").count() > 0 or \
               page.locator("div[data-testid='SideNav_AccountSwitcher_Button']").count() > 0 or \
               page.locator("article[data-testid='tweet']").count() > 0:
                is_logged_in = True
                print(">> Already logged in to Twitter/X! Proceeding directly to search...")
        except Exception:
            pass

        # If not logged in, prompt user and PAUSE execution until Enter
        if not is_logged_in:
            print("\n" + "=" * 75)
            print(">>> GOOGLE CHROME IS NOW OPEN ON YOUR SCREEN! <<<")
            print("=" * 75)
            print("1. In the open Chrome window, log in to your Twitter/X account.")
            print("   - You can click 'Sign in with Google' and select harshdipsaha@gmail.com,")
            print("   - OR enter your Twitter username/email and password directly.")
            print("2. The browser will STAY OPEN as long as you need.")
            print("3. Once you see your Twitter home feed, return to this terminal")
            print("   and press ENTER to begin extracting live tweets.")
            print("=" * 75 + "\n")
            
            # Explicit pause - will wait for human input
            input(">>> Press ENTER here once you have logged in on Twitter: ")
            
            # Give page 2 seconds to stabilize
            page.wait_for_timeout(2000)
            
            # Save storage state for all future runs
            print(f"Saving authenticated session cookies to {AUTH_FILE}...")
            try:
                context.storage_state(path=AUTH_FILE)
                print(f"Session saved! Future runs will automatically use this login.\n")
            except Exception as e:
                print(f"Warning: Could not save storage state: {e}")

        # Step 3: Harvest tweets across target queries
        all_tweets = []
        seen_texts = set()

        for q in queries:
            search_url = f"https://x.com/search?q={q.replace(' ', '%20')}&f=live"
            print(f"\nSearching Twitter for: '{q}'")
            print(f"URL: {search_url}")
            
            try:
                page.goto(search_url, timeout=60000)
                page.wait_for_timeout(4000)
            except Exception as e:
                print(f"Navigation error: {e}")
                continue

            # Scroll and harvest
            for scroll_idx in range(6):
                articles = page.locator("article[data-testid='tweet']").all()
                for art in articles:
                    try:
                        text_el = art.locator("div[data-testid='tweetText']")
                        user_el = art.locator("div[data-testid='User-Name']")
                        time_el = art.locator("time")

                        if text_el.count() > 0:
                            text = text_el.first.inner_text().strip()
                            user = user_el.first.inner_text().replace("\n", " ").strip() if user_el.count() > 0 else "Unknown"
                            timestamp = time_el.first.get_attribute("datetime") if time_el.count() > 0 else ""

                            if text and text not in seen_texts:
                                seen_texts.add(text)
                                tweet_record = {
                                    "query": q,
                                    "user": user,
                                    "timestamp": timestamp,
                                    "text": text
                                }
                                all_tweets.append(tweet_record)
                                print(f"  + [{user[:25]}]: {text[:80].replace(chr(10), ' ')}...")
                    except Exception:
                        continue

                # Scroll down
                page.mouse.wheel(0, 1500)
                page.wait_for_timeout(2000)

        print("\n" + "=" * 75)
        print(f"HARVEST COMPLETE: Extracted {len(all_tweets)} unique live tweets on Jev!")
        print("=" * 75)

        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(all_tweets, f, indent=2, ensure_ascii=False)

        print(f"Saved all extracted tweets to: {RESULTS_FILE}")
        
        # Keep open for 4 seconds so user can see completion
        page.wait_for_timeout(4000)
        browser.close()
        print("Harvester completed successfully.")

if __name__ == "__main__":
    query_arg = sys.argv[1] if len(sys.argv) > 1 else None
    queries_list = [query_arg] if query_arg else None
    run_interactive_twitter_harvest(queries_list)
