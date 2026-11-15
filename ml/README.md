# ChipIn — ML Service

Service OCR struk untuk ChipIn. Saat ini berjalan sebagai **stub**: endpoint sudah
sesuai kontrak API, tetapi isinya JSON dummy sampai model OCR selesai.

Alur: `Aplikasi → Express → FastAPI (service ini) → JSON → Express → Aplikasi`

Kontrak lengkap: [`../docs/api-contract.md`](../docs/api-contract.md)

## Struktur

```text
ml/
├── app/
│   ├── main.py                  # FastAPI app + /health
│   ├── routes/receipt.py        # POST /scan-receipt
│   ├── services/
│   │   ├── ocr_service.py       # gambar -> baris teks (STUB; nanti PaddleOCR)
│   │   └── extraction_service.py# baris teks -> JSON terstruktur (STUB; nanti parser)
│   └── schemas/receipt.py       # skema Pydantic response/error
├── datasets/                    # raw, processed, annotations, splits
├── configs/                     # det.yml, rec.yml
├── models/                      # pretrained, finetuned
├── scripts/                     # validate, prepare, evaluate, predict
├── notebooks/
├── tests/
├── requirements.txt
└── requirements-dev.txt
```

## Menjalankan

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger: http://localhost:8000/docs · Tes: `pytest`

Dengan Docker: `docker compose up --build` (dari folder `ml/`).

## Skenario dummy (parameter `mock`)

| `mock` | Hasil |
|---|---|
| `success` | 200, struk cetak normal |
| `needs_review` | 200, total tidak cocok, `needs_review: true` |
| `handwritten` | 200, nota tulisan tangan, confidence rendah |
| `invalid_file` | 400 |
| `too_large` | 413 |
| `unreadable` | 422 |
| `server_error` | 500 |

Tambahkan `delay_ms=3000` untuk mensimulasikan latency.

```bash
curl -X POST "http://localhost:8000/scan-receipt?mock=success"
curl -X POST "http://localhost:8000/scan-receipt?mock=unreadable&delay_ms=2000"
curl -X POST http://localhost:8000/scan-receipt -F "image=@struk.jpg"
```

## Environment variable

| Variabel | Fungsi | Default |
|---|---|---|
| `ML_API_KEY` | Jika diisi, request wajib membawa header `X-API-Key` | kosong (mati) |
| `ML_ALLOW_MOCK` | `0` menonaktifkan parameter `mock` (untuk production) | `1` |

## Mengganti stub dengan model asli

Cukup isi `services/ocr_service.py` (PaddleOCR) dan `services/extraction_service.py`
(parser + kategorisasi). Route, schema, dan kontrak tidak perlu berubah.
