# BL-06 — Create Group (Updated)

## 1. GET /api/groups/backgrounds
**Access:** Private (Bearer Token)

Mengambil daftar background yang aktif untuk ditampilkan sebagai pilihan di layar Create Group.

### Response — 200
```json
{
  "success": true,
  "data": {
    "backgrounds": [
      {
        "id": "uuid-background",
        "key": "blue-gradient",
        "name": "Blue Gradient",
        "image_url": "https://.../blue-gradient.jpg"
      }
    ]
  }
}
```

Background image dikelola sebagai katalog di tabel `group_backgrounds`. File gambar disimpan di Supabase Storage/CDN; `image_url` berisi URL gambar yang dapat diakses aplikasi. Admin/developer perlu mengisi katalog ini dengan aset desain yang disediakan.

## 2. POST /api/groups
**Access:** Private (Bearer Token)

### Request
```json
{
  "name": "CHIPPERS",
  "description": "Group untuk patungan",
  "start_date": "2026-11-23",
  "end_date": null,
  "background_id": "uuid-background",
  "member_ids": [
    "uuid-jibral",
    "uuid-kevin"
  ]
}
```

| Field | Type | Required | Rule |
|---|---|---:|---|
| name | string | Ya | 2–100 karakter |
| description | string/null | Tidak | Maks. 500 karakter |
| start_date | date | Tidak | Format YYYY-MM-DD; default tanggal database saat ini |
| end_date | date/null | Tidak | Boleh kosong; jika diisi tidak boleh sebelum start_date |
| background_id | UUID/null | Tidak | Harus mengacu ke background aktif |
| member_ids | UUID[] | Tidak | Default []; tidak boleh duplikat atau berisi ID pembuat |

### Perilaku tanggal
- Jika `start_date` tidak dikirim atau null, backend/database menggunakan `CURRENT_DATE`.
- `end_date` boleh null, artinya periode grup tidak memiliki tanggal akhir.
- Kedua kolom bertipe SQL `date` agar analisis bulanan menggunakan tanggal kalender, bukan timestamp/timezone.

### Response — 201
```json
{
  "success": true,
  "data": {
    "group": {
      "id": "uuid-group",
      "name": "CHIPPERS",
      "description": "Group untuk patungan",
      "start_date": "2026-11-23",
      "end_date": null,
      "background_id": "uuid-background",
      "join_code": "A1B2C3D4E5",
      "created_by": "uuid-owner"
    },
    "membership": {
      "group_id": "uuid-group",
      "user_id": "uuid-owner",
      "role": "owner",
      "status": "active"
    },
    "invitations": []
  }
}
```

### Error
| HTTP | Code | Keterangan |
|---|---|---|
| 400 | VALIDATION_ERROR | Format input tidak valid |
| 400 | INVALID_DATE_RANGE | end_date sebelum start_date |
| 404 | BACKGROUND_NOT_FOUND | Background tidak ditemukan/tidak aktif |
| 404 | MEMBER_NOT_FOUND | Pengguna yang dipilih tidak ditemukan |
| 401 | UNAUTHORIZED | Token tidak valid |
| 500 | GROUP_CREATE_FAILED | Gagal membuat grup |

## Database changes
Migration: `20261123010000_bl06_group_dates_and_backgrounds.sql`

- `groups.start_date`: DATE NOT NULL DEFAULT CURRENT_DATE
- `groups.end_date`: DATE NULL
- `groups.background_id`: FK ke `group_backgrounds.id`
- `group_backgrounds`: katalog opsi background
- RPC `create_group_with_owner`: diperluas untuk menyimpan tanggal dan background secara atomik dengan group, owner membership, dan invitations.

## Catatan integrasi FE
1. Panggil `GET /api/groups/backgrounds` saat layar Create Group dibuka.
2. Tampilkan `image_url` sebagai pilihan thumbnail/background.
3. Kirim `background_id` dari pilihan yang dipilih.
4. Kirim `start_date` hanya jika user memilih tanggal; jika kosong, backend mengisi tanggal hari ini.
5. `end_date` boleh dikirim null atau tidak dikirim.
6. Kirim tanggal dalam format `YYYY-MM-DD`.
7. Teman terpilih tetap dibuatkan invitation `pending`, bukan membership aktif langsung.
