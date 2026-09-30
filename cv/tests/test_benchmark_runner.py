import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from benchmarks.benchmark_photos import manifest_sha256, summarise, render_markdown  # noqa: E402

ROWS = [
    {"name": "a", "category": "angle", "gated": True, "expectation_met": True, "quality": "good", "corner_error_px": 1.0, "known_limitation": None},
    {"name": "b", "category": "angle", "gated": True, "expectation_met": False, "quality": "weak", "corner_error_px": 9.0, "known_limitation": None},
    {"name": "c", "category": "angle", "gated": False, "expectation_met": None, "quality": "failed", "corner_error_px": None, "known_limitation": "too steep"},
    {"name": "d", "category": "unrelated_site", "gated": True, "expectation_met": True, "quality": "failed", "corner_error_px": None, "known_limitation": None},
]


def test_manifest_hash_ignores_line_endings(tmp_path):
    a, b = tmp_path / "a.json", tmp_path / "b.json"
    a.write_bytes(b'{\n"x": 1\n}\n')
    b.write_bytes(b'{\r\n"x": 1\r\n}\r\n')
    assert manifest_sha256(a) == manifest_sha256(b)


def test_summary_counts_and_error_statistics():
    s = summarise(ROWS)
    assert s["angle"] == {"cases": 3, "gated": 2, "met": 1, "quality": {"good": 1, "weak": 1, "failed": 1},
                          "median_corner_error_px": 5.0, "max_corner_error_px": 9.0}
    assert s["unrelated_site"]["median_corner_error_px"] is None


def test_markdown_lists_categories_and_limitations():
    md = render_markdown({"cases": ROWS, "summary": summarise(ROWS), "opencv_version": "4.10.0", "generated_at_utc": "t"})
    assert "| angle | 3 | 1/2 |" in md
    assert "too steep" in md
