"""Tahap ekstraksi: baris OCR -> JSON terstruktur sesuai kontrak API.

STUB: mengembalikan skenario dummy.
NANTI: kelompokkan baris berdasarkan koordinat y, normalisasi rupiah, ekstrak
item/qty/harga/pajak/service/diskon/total, kategorisasi item, lalu validasi
(item + pajak + service - diskon == total, kalau tidak cocok needs_review = True).
"""
import copy
from typing import Dict, List, Optional

from app.schemas.receipt import ScanReceiptResponse
from app.services.ocr_service import OcrLine

MODEL_VERSION = "0.1.0-stub"

# Skenario dummy untuk ?mock=<nama>. Daftar kategori final masih perlu disepakati
# dengan tim (contoh di Notion: makanan, minuman, snack, kebutuhan rumah tangga,
# transportasi, oleh-oleh, lainnya).
SCENARIOS: Dict[str, dict] = {
    "success": {
        "model_version": MODEL_VERSION,
        "merchant": "Warung Makan Sederhana",
        "items": [
            {"name": "Nasi Goreng", "qty": 2, "unit_price": 20000, "total_price": 40000, "category": "makanan", "confidence": 0.95},
            {"name": "Es Teh", "qty": 2, "unit_price": 5000, "total_price": 10000, "category": "minuman", "confidence": 0.93},
        ],
        "subtotal": 50000,
        "tax": 5500,
        "service_charge": 0,
        "discount": 0,
        "total": 55500,
        "needs_review": False,
    },
    # Total di struk tidak cocok dengan jumlah item + pajak -> perlu dicek manual
    "needs_review": {
        "model_version": MODEL_VERSION,
        "merchant": "Warung Makan Sederhana",
        "items": [
            {"name": "Nasi Goreng", "qty": 2, "unit_price": 20000, "total_price": 40000, "category": "makanan", "confidence": 0.95},
            {"name": "Es Teh", "qty": 2, "unit_price": 5000, "total_price": 10000, "category": "minuman", "confidence": 0.93},
        ],
        "subtotal": 50000,
        "tax": 5500,
        "service_charge": 0,
        "discount": 0,
        "total": 57500,
        "needs_review": True,
    },
    # Nota tulisan tangan: confidence rendah, merchant tidak terbaca
    "handwritten": {
        "model_version": MODEL_VERSION,
        "merchant": None,
        "items": [
            {"name": "Ayam goreng", "qty": 1, "unit_price": 15000, "total_price": 15000, "category": "makanan", "confidence": 0.71},
            {"name": "Es jeruk", "qty": 1, "unit_price": 8000, "total_price": 8000, "category": "minuman", "confidence": 0.55},
        ],
        "subtotal": 23000,
        "tax": 0,
        "service_charge": 0,
        "discount": 0,
        "total": 23000,
        "needs_review": True,
    },
}


def get_scenario(name: str) -> Optional[dict]:
    scenario = SCENARIOS.get(name)
    return copy.deepcopy(scenario) if scenario else None


def extract(lines: List[OcrLine]) -> ScanReceiptResponse:
    return ScanReceiptResponse(**SCENARIOS["success"])
