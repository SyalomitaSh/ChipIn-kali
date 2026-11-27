# BL-05 — Undang Anggota via Link/Kode

## Scope

- Setiap grup memiliki `join_code` unik (sudah tersedia di `groups`).
- Kode berlaku selama 30 hari sejak grup dibuat/migrasi BL-05.
- Pengguna dapat memeriksa link/kode tanpa login.
- Pengguna harus login/registrasi sebelum bergabung.
- Setelah login, frontend mengirim kode yang sama ke endpoint join.
- Anggota aktif yang memasukkan kode lagi tidak dibuatkan membership duplikat.
- Membership dengan status `pending`, `left`, atau `removed` diaktifkan kembali, bukan dibuat sebagai baris baru.

`group_invitations.invite_code` tetap digunakan untuk undangan personal. BL-05 menggunakan `groups.join_code` untuk link/kode grup yang dapat dibagikan.

## Endpoints

### 1. Preview/validasi link (public)

`GET /api/groups/join/:joinCode`

Tidak memerlukan access token. Dipakai sebelum login untuk memeriksa kode dan menampilkan informasi grup.

Success `200`:

```json
{
  "success": true,
  "data": {
    "invitation": {
      "join_code": "A1B2C3D4E5F6",
      "expires_at": "2026-12-27T00:00:00Z"
    },
    "group": {
      "id": "uuid",
      "name": "CHIPPERS",
      "description": "Trip bersama",
      "created_by": "uuid",
      "created_at": "2026-11-27T00:00:00Z"
    }
  }
}
```

Errors:
- `400 VALIDATION_ERROR`: format kode tidak valid.
- `404 INVALID_JOIN_CODE`: kode tidak ditemukan.
- `410 JOIN_CODE_EXPIRED`: kode kedaluwarsa.
- `500 INVITATION_LOOKUP_FAILED`: gagal memeriksa kode.

### 2. Bergabung dengan kode (authenticated)

`POST /api/groups/join`

Header: `Authorization: Bearer <access_token>`

Body:

```json
{ "join_code": "A1B2C3D4E5F6" }
```

Success `201` jika baru bergabung:

```json
{
  "success": true,
  "data": {
    "group": { "id": "uuid", "name": "CHIPPERS" },
    "membership": {
      "id": "uuid",
      "group_id": "uuid",
      "user_id": "uuid",
      "role": "member",
      "status": "active",
      "joined_at": "2026-11-27T00:00:00Z"
    },
    "already_member": false,
    "message": "Berhasil bergabung ke grup"
  }
}
```

Success `200` jika user sudah menjadi anggota aktif:
- `already_member: true`
- Tidak ada membership baru yang dibuat.

Errors:
- `400 VALIDATION_ERROR`: format kode tidak valid.
- `401 UNAUTHORIZED`: belum login/token tidak valid.
- `404 INVALID_JOIN_CODE`: kode tidak ditemukan.
- `410 JOIN_CODE_EXPIRED`: kode kedaluwarsa.
- `500 GROUP_JOIN_FAILED`: gagal memproses keanggotaan.

## Frontend flow

1. User membuka link, misalnya `https://<domain-aplikasi>/join/A1B2C3D4E5F6`.
2. Frontend mengambil `GET /api/groups/join/A1B2C3D4E5F6`.
3. Jika valid, tampilkan nama grup dan tombol **Join**.
4. Jika belum login, arahkan ke login/registrasi sambil menyimpan kode undangan (misalnya query/deep-link state).
5. Setelah autentikasi berhasil, kirim `POST /api/groups/join` dengan kode yang sama.
6. Jika sukses, arahkan user ke halaman grup.
7. Jika API mengembalikan `INVALID_JOIN_CODE` atau `JOIN_CODE_EXPIRED`, tampilkan pesan error.

Backend tidak dapat mengarahkan navigasi aplikasi mobile/web setelah login. Frontend bertanggung jawab menyimpan kode selama login/registrasi dan melanjutkan request join setelah autentikasi berhasil.

## Database migration

Jalankan `supabase/migrations/20261127000000_bl05_group_join_by_code.sql` pada Supabase sebelum deploy backend. Migration menambahkan `groups.join_code_expires_at` (default 30 hari) dan RPC atomik `join_group_by_code`.

## Manual test checklist

- [ ] GET preview dengan kode valid mengembalikan data grup.
- [ ] GET preview dengan kode acak mengembalikan `404 INVALID_JOIN_CODE`.
- [ ] GET preview dengan kode kedaluwarsa mengembalikan `410 JOIN_CODE_EXPIRED`.
- [ ] POST join tanpa token mengembalikan `401 UNAUTHORIZED`.
- [ ] POST join dengan kode valid membuat membership `active` dan role `member`.
- [ ] POST join kedua kali oleh user yang sama mengembalikan `200` dan tidak menambah baris membership.
- [ ] Dua user berbeda dapat bergabung ke grup yang sama menggunakan kode yang sama.
- [ ] Kode dari grup lain tidak dapat digunakan untuk bergabung ke grup yang tidak sesuai.
- [ ] User yang belum login dapat login/registrasi lalu melanjutkan join dengan kode yang tersimpan di frontend.
