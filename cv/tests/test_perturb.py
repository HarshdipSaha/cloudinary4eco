import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from benchmarks.perturb import apply, corner_error  # noqa: E402
from tests.synth import scene  # noqa: E402


def test_photometric_ops_keep_geometry_identity():
    img = scene(1)
    for spec in [{"op": "gamma", "value": 2.2}, {"op": "contrast", "value": 0.5}, {"op": "color_cast", "bgr": [0.8, 1.0, 1.25]},
                 {"op": "shadow", "strength": 0.6}, {"op": "noise", "sigma": 12, "seed": 7}, {"op": "blur", "ksize": 5},
                 {"op": "jpeg", "quality": 20}]:
        out, G = apply(img, [spec])
        assert out.shape == img.shape and out.dtype == np.uint8
        assert np.allclose(G, np.eye(3))


def test_ops_are_deterministic():
    img = scene(2)
    spec = [{"op": "noise", "sigma": 10, "seed": 3}, {"op": "rotate", "degrees": 7}]
    a, Ga = apply(img, spec)
    b, Gb = apply(img, spec)
    assert np.array_equal(a, b) and np.allclose(Ga, Gb)


def test_geometric_ops_compose_ground_truth():
    img = scene(3)
    _, G = apply(img, [{"op": "rotate", "degrees": 10}, {"op": "scale", "factor": 1.2}, {"op": "perspective", "tilt": 0.1}])
    assert not np.allclose(G, np.eye(3))
    h, w = img.shape[:2]
    assert corner_error(np.linalg.inv(G), G, w, h) == pytest.approx(0.0, abs=1e-6)


def test_mirror_has_negative_determinant():
    _, G = apply(scene(4), [{"op": "mirror"}])
    assert np.linalg.det(G[:2, :2]) < 0


def test_unknown_op_is_rejected():
    with pytest.raises(ValueError, match="unknown perturbation"):
        apply(scene(1), [{"op": "sparkle"}])
