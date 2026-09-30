"""Deterministic photometric and geometric perturbations with ground-truth homographies.

apply() returns (image, G) where G maps pixel coordinates of the input to the output.
Photometric ops leave G unchanged; geometric ops keep the canvas size.
"""
from __future__ import annotations

import cv2
import numpy as np


def _about_centre(M: np.ndarray, w: int, h: int) -> np.ndarray:
    to_c = np.array([[1, 0, -w / 2], [0, 1, -h / 2], [0, 0, 1]], dtype=np.float64)
    back = np.array([[1, 0, w / 2], [0, 1, h / 2], [0, 0, 1]], dtype=np.float64)
    return back @ M @ to_c


def _geometric(img: np.ndarray, spec: dict) -> np.ndarray:
    h, w = img.shape[:2]
    op = spec["op"]
    if op == "rotate":
        a = np.deg2rad(spec["degrees"])
        return _about_centre(np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]]), w, h)
    if op == "scale":
        s = spec["factor"]
        return _about_centre(np.diag([s, s, 1.0]), w, h)
    if op == "translate":
        return np.array([[1, 0, spec["dx"] * w], [0, 1, spec["dy"] * h], [0, 0, 1]], dtype=np.float64)
    if op == "perspective":
        t = spec["tilt"]
        src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
        dst = np.float32([[t * w, 0], [w - t * w, 0], [w, h], [0, h]])  # camera tilted upward
        return cv2.getPerspectiveTransform(src, dst).astype(np.float64)
    if op == "mirror":
        return np.array([[-1, 0, w - 1], [0, 1, 0], [0, 0, 1]], dtype=np.float64)
    raise ValueError(f"unknown perturbation: {op}")


def _photometric(img: np.ndarray, spec: dict) -> np.ndarray | None:
    op = spec["op"]
    f = img.astype(np.float32)
    if op == "gamma":  # value > 1 darkens, < 1 brightens
        lut = np.clip(((np.arange(256) / 255.0) ** spec["value"]) * 255.0, 0, 255).astype(np.uint8)
        return cv2.LUT(img, lut)
    if op == "contrast":
        mean = f.mean(axis=(0, 1), keepdims=True)
        return np.clip(mean + (f - mean) * spec["value"], 0, 255).astype(np.uint8)
    if op == "color_cast":
        return np.clip(f * np.float32(spec["bgr"]), 0, 255).astype(np.uint8)
    if op == "shadow":  # linear shadow falling from the left edge to the centre
        w = img.shape[1]
        ramp = np.clip(np.linspace(1 - spec["strength"], 1.0 + spec["strength"], w), 1 - spec["strength"], 1.0)
        return np.clip(f * ramp[None, :, None].astype(np.float32), 0, 255).astype(np.uint8)
    if op == "noise":
        rng = np.random.default_rng(spec["seed"])
        return np.clip(f + rng.normal(0, spec["sigma"], img.shape), 0, 255).astype(np.uint8)
    if op == "blur":
        k = int(spec["ksize"])
        return cv2.GaussianBlur(img, (k, k), 0)
    if op == "jpeg":
        ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, int(spec["quality"])])
        assert ok
        return cv2.imdecode(buf, cv2.IMREAD_COLOR)
    return None


def apply(img: np.ndarray, specs: list[dict]) -> tuple[np.ndarray, np.ndarray]:
    out = img.copy()
    G = np.eye(3, dtype=np.float64)
    for spec in specs:
        photometric = _photometric(out, spec)
        if photometric is not None:
            out = photometric
            continue
        step = _geometric(out, spec)
        h, w = out.shape[:2]
        out = cv2.warpPerspective(out, step, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        G = step @ G
    return out, G


def corner_error(H_est: np.ndarray, G: np.ndarray, w: int, h: int) -> float:
    """Mean pixel distance between baseline corners and H_est(G(corners)); 0 means perfect recovery."""
    corners = np.float64([[0, 0], [w, 0], [w, h], [0, h]]).reshape(-1, 1, 2)
    round_trip = cv2.perspectiveTransform(cv2.perspectiveTransform(corners, G), H_est)
    return float(np.linalg.norm(round_trip - corners, axis=2).mean())
