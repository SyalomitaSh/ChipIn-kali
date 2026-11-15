# API Contract — ML Service

> Status: sesuai bagian "Kontrak API" di Notion (usulan awal). Jika ada perubahan
> yang disepakati dengan backend, ubah dokumen ini, `ml/app/schemas/receipt.py`,
> dan schema validasi di backend secara bersamaan.

## POST /scan-receipt

- Content-Type: `multipart/form-data`
- Field: `image` (JPEG/PNG, maksimal 5 MB, sisi terpanjang sekitar 1600–2000 px)
- Header: `X-API-Key` (wajib jika `ML_API_KEY` diisi di service)
- Timeout yang disarankan di Express: 10–15 detik

### Response sukses (200)

```json
{
  "model_version": "0.1.0",
  "merchant": null,
  "items": [
    {"name": "Nasi Goreng", "qty": 2, "unit_price": 25000, "total_price": 50000, "category": "makanan", "confidence": 0.93}
  ],
  "subtotal": 50000,
  "tax": 5500,
  "service_charge": 0,
  "discount": 0,
  "total": 55500,
  "needs_review": false
}
```

Aturan:
- Harga berupa integer rupiah.
- Key memakai `snake_case`.
- `merchant` boleh `null`.
- `needs_review` bernilai `true` jika item + pajak + service − diskon ≠ total,
  atau confidence rendah.

### Error

Bentuk: `{"error": {"code": "...", "message": "..."}}`

| Status | code | Keterangan |
|---|---|---|
| 400 | `INVALID_FILE` | File tidak ada, bukan JPEG/PNG, atau tidak valid |
| 401 | `UNAUTHORIZED` | API key salah (jika autentikasi aktif) |
| 413 | `FILE_TOO_LARGE` | Ukuran lebih dari 5 MB |
| 422 | `RECEIPT_UNREADABLE` | Struk tidak terbaca |
| 500 | `INTERNAL_ERROR` | Kesalahan internal |

## GET /health

`{"status": "ok", "mode": "stub", "model_version": "..."}`

## Mode dummy (hanya selama stub)

Parameter query `mock` dan `delay_ms` pada `POST /scan-receipt`. Daftar nilai ada di
`ml/README.md`. Nonaktifkan di production dengan `ML_ALLOW_MOCK=0`.

## Yang masih perlu disepakati

- Daftar kategori final (contoh di Notion: makanan, minuman, snack, kebutuhan rumah
  tangga, transportasi, oleh-oleh, lainnya).
- Penanganan field yang tidak terbaca: saat ini selalu terisi dan ditandai lewat
  `needs_review` serta `confidence`, tidak memakai `null`.
