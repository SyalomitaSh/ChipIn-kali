# BL-07 — Lihat Daftar Anggota Grup

## Endpoint
`GET /api/groups/:groupId/members`

**Access:** Private — Bearer Token dan anggota aktif grup.

### Request
```http
GET /api/groups/550e8400-e29b-41d4-a716-446655440000/members
Authorization: Bearer ACCESS_TOKEN
```

Tidak membutuhkan request body.

### Response — 200 OK
```json
{
  "success": true,
  "data": {
    "total_members": 2,
    "members": [
      {
        "id": "uuid-membership",
        "user_id": "uuid-user",
        "username": "andi_123",
        "full_name": "Andi Pratama",
        "avatar_url": "https://example.com/avatar.jpg",
        "role": "owner",
        "is_admin": true,
        "status": "active",
        "joined_at": "2026-11-23T08:00:00.000Z"
      },
      {
        "id": "uuid-membership-2",
        "user_id": "uuid-user-2",
        "username": "budi_123",
        "full_name": "Budi Santoso",
        "avatar_url": null,
        "role": "member",
        "is_admin": false,
        "status": "active",
        "joined_at": "2026-11-23T08:30:00.000Z"
      }
    ]
  }
}
```

`is_admin` bernilai `true` untuk role `owner` dan `admin`. Role `owner` tetap ditampilkan terpisah agar frontend dapat memberi label yang tepat.

### Error
| HTTP | Code | Keterangan |
|---|---|---|
| 400 | INVALID_GROUP_ID | Format groupId tidak valid |
| 401 | UNAUTHORIZED | Token tidak ada/tidak valid |
| 403 | FORBIDDEN | Pengguna bukan anggota grup |
| 403 | GROUP_ACCESS_INACTIVE | Status keanggotaan tidak aktif |
| 500 | GROUP_ACCESS_CHECK_FAILED | Gagal memeriksa akses grup |
| 500 | GROUP_MEMBERS_FETCH_FAILED | Gagal mengambil daftar anggota |

### Business Rules
- Hanya anggota dengan `status = active` yang ditampilkan.
- Anggota yang `pending`, `left`, atau `removed` tidak ditampilkan.
- Hanya pengguna yang merupakan anggota aktif grup tersebut yang dapat mengakses endpoint.
- `owner` dan `admin` ditandai dengan `is_admin = true`.
- User ID diambil dari access token, bukan dari request body.
