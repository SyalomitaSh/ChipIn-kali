# BL-08 — Daftar Grup yang Diikuti

## Endpoint

`GET /api/groups`

Memerlukan `Authorization: Bearer <access_token>`.

### Query parameters

| Parameter | Wajib | Nilai | Keterangan |
|---|---|---|---|
| `search` | Tidak | string, maksimal 100 karakter | Mencari nama grup (case-insensitive) |
| `status` | Tidak | `all`, `unsettled`, `settled` | Filter berdasarkan status pembayaran user pada grup |

Contoh:
- `GET /api/groups`
- `GET /api/groups?search=chip`
- `GET /api/groups?status=unsettled`
- `GET /api/groups?search=trip&status=settled`

### Response

```json
{
  "success": true,
  "data": {
    "total": 1,
    "groups": [
      {
        "id": "uuid",
        "name": "CHIPPERS",
        "description": "Trip bersama",
        "background_id": "uuid-or-null",
        "created_by": "uuid",
        "created_at": "2026-11-27T03:00:00Z",
        "total_members": 5,
        "total_bills": 3,
        "settlement_status": "unsettled"
      }
    ]
  }
}
```

`settlement_status` dihitung dari `member_bills` milik user yang sedang login:
- `unsettled`: setidaknya ada bill user dengan status selain `paid`.
- `settled`: user memiliki bill di grup tersebut dan seluruh bill-nya berstatus `paid`.
- `no_bills`: belum ada bill milik user di grup tersebut. Grup ini hanya muncul pada filter `all`.

`total_members` menghitung membership aktif. `total_bills` menghitung transaksi grup yang tidak berstatus `cancelled`.

## Catatan implementasi

- User hanya mendapatkan grup dengan membership `active`.
- Pencarian saat ini berdasarkan nama grup.
- Endpoint menggunakan controller yang sudah ada; tidak menambahkan service layer.
- Endpoint ini tidak menggantikan `GET /api/groups/:groupId/members` (BL-07).
- Belum ada pagination; dapat ditambahkan ketika jumlah grup per user membutuhkan pembatasan hasil.
