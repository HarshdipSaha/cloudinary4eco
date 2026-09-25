import cv2
from fastapi.testclient import TestClient

import app.main as main
from tests.synth import scene, known_homography

client = TestClient(main.app)


def _patch(monkeypatch, images):
    monkeypatch.setenv("CV_WORKER_KEY", "k")
    monkeypatch.setattr(main, "download", lambda url: images[url])
    uploads = []
    monkeypatch.setattr(main, "upload_derivative", lambda img, public_id, context, fmt: uploads.append((public_id, context, fmt)) or public_id)
    return uploads


def body(**kw):
    return {"site_id": "s1", "baseline_asset_id": "b", "baseline_url": "B", "followup_asset_id": "f/x", "followup_url": "F", "folder": "saakshya/derived/s1", **kw}


def test_rejects_missing_key(monkeypatch):
    _patch(monkeypatch, {})
    assert client.post("/register", json=body()).status_code == 401


def test_registers_uploads_derivatives_with_lineage(monkeypatch):
    base = scene(3)
    h, w = base.shape[:2]
    follow = cv2.warpPerspective(base, known_homography(w, h), (w, h))
    uploads = _patch(monkeypatch, {"B": base, "F": follow})
    r = client.post("/register", json=body(), headers={"x-worker-key": "k"})
    assert r.status_code == 200
    j = r.json()
    assert j["quality"] == "good"
    assert j["aligned_asset_id"] == "saakshya/derived/s1/f_x_aligned"
    assert j["difference_asset_id"] == "saakshya/derived/s1/f_x_difference"
    assert set(j["metrics"]) == {"vegetation_fraction_before", "vegetation_fraction_after", "vegetation_delta", "changed_area_fraction", "brightness_shift"}
    ctx = uploads[0][1]
    assert ctx["source_asset_id"] == "f/x" and ctx["baseline_asset_id"] == "b" and ctx["derivation"] == "registration"


def test_failed_registration_uploads_nothing(monkeypatch):
    uploads = _patch(monkeypatch, {"B": scene(1), "F": scene(50)})
    j = client.post("/register", json=body(), headers={"x-worker-key": "k"}).json()
    assert j["quality"] == "failed" and j["aligned_asset_id"] is None and j["metrics"] is None
    assert uploads == []
