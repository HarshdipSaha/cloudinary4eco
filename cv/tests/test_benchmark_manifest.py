import json
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
MANIFEST = json.loads((REPO / "cv/benchmarks/cases.json").read_text(encoding="utf-8"))
QUALITIES = {"good", "weak", "failed"}
CATEGORIES = {"same_scene", "lighting", "angle", "unrelated_site", "manipulated"}


def source_exists(src: str) -> bool:
    return src.startswith("synth:") or (REPO / src).is_file()


def test_every_case_is_well_formed():
    names = [c["name"] for c in MANIFEST["cases"]]
    assert len(names) == len(set(names))
    for c in MANIFEST["cases"]:
        assert c["category"] in CATEGORIES
        assert source_exists(c["baseline"]) and source_exists(c["followup"]), c["name"]
        assert isinstance(c.get("perturb", []), list)
        if c["expect"] is None:
            assert c.get("known_limitation") or c.get("exploratory"), f"{c['name']} must explain why it is not gated"
        else:
            assert set(c["expect"]) <= QUALITIES and c["expect"]


def test_coverage_minimums():
    n = Counter(c["category"] for c in MANIFEST["cases"])
    assert n["lighting"] >= 8 and n["angle"] >= 8 and n["unrelated_site"] >= 5 and n["manipulated"] >= 1
    gated_negative = [c for c in MANIFEST["cases"] if c["category"] == "unrelated_site" and c["expect"] == ["failed"]]
    assert len(gated_negative) >= 5
