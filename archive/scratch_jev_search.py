from duckduckgo_search import DDGS
import json

queries = [
    '"TypeSafe" Jev',
    '"TypeSafe AI" Jev',
    '"Diogo Almeida" Jev',
    '"typesafe.ai"',
    'site:linkedin.com "TypeSafe" "Jev"',
    'site:twitter.com "TypeSafe" "Jev"',
    'site:x.com "typesafe" "jev"',
    '"Jev" "System One" model',
    'site:news.ycombinator.com "TypeSafe" Jev',
    'site:reddit.com "TypeSafe" "Jev"'
]

results = {}
with DDGS() as ddgs:
    for q in queries:
        try:
            r = list(ddgs.text(q, max_results=5))
            results[q] = r
            print(f"Query: {q} -> Found {len(r)} results")
        except Exception as e:
            results[q] = str(e)
            print(f"Query: {q} -> Error: {e}")

with open("scratch_jev_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
print("Saved to scratch_jev_results.json")
