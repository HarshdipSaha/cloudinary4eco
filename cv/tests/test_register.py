import cv2
import numpy as np
from app.register import register, grade_quality
from tests.synth import scene, known_homography


def test_recovers_a_known_offset_and_aligns():
    base = scene(1)
    h, w = base.shape[:2]
    H_true = known_homography(w, h)
    follow = cv2.warpPerspective(base, H_true, (w, h))
    r = register(base, follow)
    assert r.quality == "good"
    assert r.inliers >= 40
    assert r.aligned is not None and r.aligned.shape == base.shape
    diff = np.abs(r.aligned.astype(int) - base.astype(int)).mean(axis=2)
    assert diff[r.valid_mask].mean() < 12  # aligned back onto the baseline
    assert 0 < len(r.inlier_points) <= 200
    assert all(0 <= x <= 1 and 0 <= y <= 1 for x, y in r.inlier_points)


def test_different_place_fails():
    r = register(scene(1), scene(99))
    assert r.quality == "failed"
    assert r.aligned is None


def test_featureless_image_fails_cleanly():
    flat = np.full((600, 800, 3), 128, np.uint8)
    assert register(flat, flat).quality == "failed"


def test_quality_grading_rules():
    eye = np.eye(3)
    assert grade_quality(60, 0.5, eye) == "good"
    assert grade_quality(20, 0.25, eye) == "weak"
    assert grade_quality(10, 0.5, eye) == "failed"
    assert grade_quality(80, 0.6, None) == "failed"
    squash = np.diag([0.1, 0.1, 1.0])
    assert grade_quality(80, 0.6, squash) == "failed"  # degenerate scale
