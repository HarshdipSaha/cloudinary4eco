"""Uploads derivatives to Cloudinary. Originals are never touched."""
import cv2
import cloudinary
import cloudinary.uploader
import numpy as np

cloudinary.config(secure=True)  # reads CLOUDINARY_URL


def upload_derivative(img: np.ndarray, public_id: str, context: dict[str, str], fmt: str) -> str:
    ok, buf = cv2.imencode(f".{fmt}", img, [cv2.IMWRITE_JPEG_QUALITY, 90] if fmt == "jpg" else [])
    if not ok:
        raise RuntimeError("encode failed")
    res = cloudinary.uploader.upload(
        buf.tobytes(),
        public_id=public_id,
        overwrite=False,
        context="|".join(f"{k}={v}" for k, v in context.items()),
        tags=["saakshya", "derivative", context.get("derivation", "")],
    )
    return res["public_id"]
