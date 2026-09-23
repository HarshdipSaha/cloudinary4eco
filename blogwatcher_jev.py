import feedparser
import json

feeds = [
    ("Hacker News Frontpage", "https://news.ycombinator.com/rss"),
    ("Simon Willison", "https://simonwillison.net/atom/everything/"),
    ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"),
    ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/"),
    ("The Verge Tech", "https://www.theverge.com/rss/index.xml"),
    ("Latent Space", "https://www.latent.space/feed"),
    ("Import AI", "https://importai.substack.com/feed")
]

keywords = ["typesafe", "jev", "system one", "diogo almeida", "rlcd", "calibrated decisions"]

matched_entries = []
all_stats = []

for name, url in feeds:
    try:
        parsed = feedparser.parse(url)
        count = len(parsed.entries)
        all_stats.append((name, count))
        for entry in parsed.entries:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            link = entry.get("link", "")
            pub = entry.get("published", "")
            combined = (title + " " + summary).lower()
            if any(k in combined for k in keywords):
                matched_entries.append({
                    "feed": name,
                    "title": title,
                    "summary": summary[:400],
                    "link": link,
                    "published": pub
                })
    except Exception as e:
        all_stats.append((name, f"Error: {e}"))

print(f"Scanned {len(feeds)} feeds. Matched {len(matched_entries)} entries.")
for s in all_stats:
    print(f" - {s[0]}: {s[1]} entries")

with open("blogwatcher_jev_matches.json", "w", encoding="utf-8") as f:
    json.dump(matched_entries, f, indent=2)
print("Saved to blogwatcher_jev_matches.json")
