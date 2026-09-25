import json
import os

import cv2
import httpx
import numpy as np
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from .metrics import change_metrics, difference_image
from .register import register
from .storage import upload_derivative

app = FastAPI(title="saakshya-cv")


class RegisterRequest(BaseModel):
    site_id: str
    baseline_asset_id: str
    baseline_url: str
    followup_asset_id: str
    followup_url: str
    folder: str


def download(url: str) -> np.ndarray:
    r = httpx.get(url, timeout=30, follow_redirects=True)
    r.raise_for_status()
    img = cv2.imdecode(np.frombuffer(r.content, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(422, f"could not decode image at {url}")
    return img


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/register")
def register_endpoint(req: RegisterRequest, x_worker_key: str | None = Header(default=None)):
    if not x_worker_key or x_worker_key != os.environ.get("CV_WORKER_KEY"):
        raise HTTPException(401, "bad worker key")
    base = download(req.baseline_url)
    follow = download(req.followup_url)
    r = register(base, follow)
    out = {
        "quality": r.quality,
        "inliers": r.inliers,
        "inlier_ratio": r.inlier_ratio,
        "homography": r.homography,
        "aligned_asset_id": None,
        "difference_asset_id": None,
        "inlier_points": r.inlier_points,
        "metrics": None,
    }
    if r.quality == "failed" or r.aligned is None or r.valid_mask is None or r.baseline is None:
        return out

    metrics, changed = change_metrics(r.baseline, r.aligned, r.valid_mask)
    stem = req.followup_asset_id.replace("/", "_")
    lineage = {
        "source_asset_id": req.followup_asset_id,
        "baseline_asset_id": req.baseline_asset_id,
        "site_id": req.site_id,
        "registration_quality": r.quality,
        "homography": json.dumps([round(v, 6) for v in r.homography or []]),
    }
    out["aligned_asset_id"] = upload_derivative(r.aligned, f"{req.folder}/{stem}_aligned", {**lineage, "derivation": "registration"}, "jpg")
    out["difference_asset_id"] = upload_derivative(
        difference_image(r.baseline, changed, r.valid_mask), f"{req.folder}/{stem}_difference", {**lineage, "derivation": "difference"}, "png"
    )
    out["metrics"] = metrics
    return out
