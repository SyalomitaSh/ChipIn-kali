"""Tahap OCR: gambar -> daftar baris teks beserta bounding box.

STUB: mengembalikan baris contoh tetap.
NANTI: preprocess (OpenCV) -> PaddleOCR (detection + recognition) -> list OcrLine.
Muat model sekali saat startup (lifespan), bukan di setiap request.
"""
from typing import List, TypedDict


class OcrLine(TypedDict):
    text: str
    bbox: List[List[float]]  # 4 titik [x, y]
    confidence: float


def predict(image_bytes: bytes) -> List[OcrLine]:
    return [
        {"text": "WARUNG MAKAN SEDERHANA", "bbox": [[10, 10], [300, 10], [300, 30], [10, 30]], "confidence": 0.98},
        {"text": "NASI GORENG 2 x 20.000 40.000", "bbox": [[10, 50], [300, 50], [300, 70], [10, 70]], "confidence": 0.95},
        {"text": "TOTAL 55.500", "bbox": [[10, 200], [300, 200], [300, 220], [10, 220]], "confidence": 0.97},
    ]
