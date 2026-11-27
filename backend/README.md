# ChipIn Backend

REST API ChipIn — Express.js + Supabase (Postgres & Auth).

## Setup

### Prasyarat

- Node.js >= 20
- npm
- Akun Supabase
- Postman atau Swagger untuk pengujian API

### Instalasi

```bash
npm install
```

Salin file konfigurasi environment:

```bash
cp .env.example .env
```

Isi kredensial Supabase di file `.env`, kemudian jalankan server:

```bash
npm run dev
```

Server berjalan di:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

## Konfigurasi Supabase

### 1. Membuat Project Supabase

1. Buka https://supabase.com.
2. Buat project baru.
3. Buka bagian Project Settings → API.
4. Salin URL dan API keys yang dibutuhkan.
5. Masukkan kredensial ke file `.env`.

Contoh konfigurasi:

```env
PORT=3000

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**Catatan keamanan:**

- `SUPABASE_ANON_KEY` digunakan untuk operasi yang membutuhkan akses pengguna.
- `SUPABASE_SERVICE_ROLE_KEY` digunakan hanya di backend untuk operasi administratif tertentu.
- Jangan memasukkan service role key ke frontend React Native.
- Jangan mengunggah file `.env` ke GitHub atau repository publik.

### 2. Menjalankan Database Schema

Jalankan file berikut melalui Supabase Dashboard → SQL Editor:

```text
supabase/schema.sql
```

Salin seluruh isi file SQL, kemudian jalankan query tersebut.

### 3. Konfigurasi Email Authentication

Untuk kebutuhan development:

1. Buka Supabase Dashboard.
2. Pilih Authentication → Providers → Email.
3. Matikan Confirm email jika ingin registrasi langsung mengembalikan session.

Untuk production, konfirmasi email sebaiknya tetap diaktifkan.

Jika Confirm email aktif, response registrasi dapat mengembalikan `session: null` dan `requires_email_confirmation: true`.

### 4. Supabase Permissions

Backend melakukan pengecekan username melalui tabel `public.profiles`.

Pastikan role `service_role` memiliki izin membaca tabel tersebut.

Jalankan melalui SQL Editor:

```sql
GRANT SELECT ON TABLE public.profiles TO service_role;
```

Perintah ini memberikan privilege SQL `SELECT` kepada `service_role`. Kebijakan RLS untuk pengguna aplikasi tetap mengikuti policy yang telah dibuat pada schema.

## Struktur Project

```text
src/
├── config/
│   └── env dan klien Supabase
│
├── middlewares/
│   ├── auth
│   ├── groupAccess (BL-04)
│   ├── validate
│   └── errorHandler
│
├── routes/
│   └── definisi endpoint
│
├── controllers/
│   └── logika request dan response
│
├── validators/
│   └── skema validasi Zod
│
└── utils/
    ├── AppError
    └── asyncHandler

supabase/
└── schema.sql
```

### Alur Request

```text
Client
  |
  v
Route
  |
  v
Validate
  |
  v
requireAuth (jika endpoint membutuhkan autentikasi)
  |
  v
Controller
  |
  v
Supabase
  |
  v
Response
```

Error dilempar menggunakan `AppError` dan diformat secara otomatis oleh `errorHandler`.

## API Documentation

Base URL:

```text
http://localhost:3000/api
```

### Format Response

**Response sukses:**

```json
{
  "success": true,
  "data": {}
}
```

**Response error:**

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_TAKEN",
    "message": "Email sudah terdaftar"
  }
}
```

### Authentication

Endpoint yang menggunakan autentikasi membutuhkan header:

```http
Authorization: Bearer <access_token>
```

## Endpoint (Sprint 1)

| Method | Path | Auth | Backlog |
|---|---|---|---|
| GET | `/api/health` | – | – |
| POST | `/api/auth/register` | – | BL-01 |
| POST | `/api/auth/login` | – | BL-02 |
| POST | `/api/auth/refresh` | – | BL-02 |
| POST | `/api/auth/logout` | Bearer | BL-02 |
| GET | `/api/users/me` | Bearer | BL-03 |
| PATCH | `/api/users/me` | Bearer | BL-03 |

---

## BL-01 — Register

### POST `/api/auth/register`

Mendaftarkan pengguna baru menggunakan Supabase Auth.

**Request Body:**

```json
{
  "username": "andi_123",
  "full_name": "Andi",
  "email": "andi@example.net",
  "password": "rahasia123"
}
```

**Validasi:**

- `username`: wajib, 3–30 karakter, huruf kecil, angka, dan underscore.
- `full_name`: wajib, 2–50 karakter.
- `email`: wajib, format email valid.
- `password`: wajib, minimal 8 karakter.
- Username harus unik.

**Response sukses — 201:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-user",
      "username": "andi_123",
      "full_name": "Andi",
      "email": "andi@example.net"
    },
    "session": {
      "access_token": "ACCESS_TOKEN",
      "refresh_token": "REFRESH_TOKEN",
      "expires_at": 1795000000
    },
    "requires_email_confirmation": false
  }
}
```

Jika konfirmasi email diaktifkan di Supabase:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-user",
      "username": "andi_123",
      "full_name": "Andi",
      "email": "andi@example.net"
    },
    "session": null,
    "requires_email_confirmation": true
  }
}
```

**Catatan:**

- Akun autentikasi disimpan di `auth.users`.
- Data username dan full name diteruskan sebagai metadata.
- Profil pengguna dibuat melalui trigger database sesuai konfigurasi schema.
- Password dikelola dan di-hash oleh Supabase Auth.

---

## BL-02 — Login

### POST `/api/auth/login`

Melakukan autentikasi pengguna menggunakan email dan password.

**Request Body:**

```json
{
  "email": "andi@example.net",
  "password": "rahasia123"
}
```

**Response sukses — 200:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-user",
      "username": "andi_123",
      "full_name": "Andi",
      "email": "andi@example.net"
    },
    "session": {
      "access_token": "ACCESS_TOKEN",
      "refresh_token": "REFRESH_TOKEN",
      "expires_at": 1795000000
    }
  }
}
```

**Kemungkinan error:**

| HTTP Status | Error Code | Keterangan |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | Email atau password salah |
| 403 | `EMAIL_NOT_CONFIRMED` | Email belum dikonfirmasi |
| 429 | `RATE_LIMITED` | Terlalu banyak percobaan login |
| 500 | `INTERNAL_ERROR` | Kesalahan server |

---

## BL-02 — Refresh Session

### POST `/api/auth/refresh`

Memperbarui session menggunakan refresh token.

**Request Body:**

```json
{
  "refresh_token": "REFRESH_TOKEN"
}
```

**Response sukses — 200:**

```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "NEW_ACCESS_TOKEN",
      "refresh_token": "NEW_REFRESH_TOKEN",
      "expires_at": 1795000000
    }
  }
}
```

**Kemungkinan error:**

| HTTP Status | Error Code | Keterangan |
|---|---|---|
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token tidak valid atau kedaluwarsa |
| 429 | `RATE_LIMITED` | Terlalu banyak request |
| 500 | `INTERNAL_ERROR` | Kesalahan server |

**Catatan:**

- Simpan access token dan refresh token terbaru.
- Supabase dapat melakukan rotasi refresh token.
- Jangan terus menggunakan refresh token lama setelah berhasil diperbarui.

---

## BL-02 — Logout

### POST `/api/auth/logout`

Mengakhiri session pengguna yang sedang login.

**Header:**

```http
Authorization: Bearer <access_token>
```

**Response sukses — 200:**

```json
{
  "success": true,
  "data": {
    "message": "Logout berhasil"
  }
}
```

**Catatan:**

- Endpoint membutuhkan autentikasi.
- Access token dikirim melalui header Authorization.
- Logout dilakukan melalui Supabase Auth.

---

## BL-03 — User Profile

### GET `/api/users/me`

Mengambil informasi profil pengguna yang sedang login.

**Header:**

```http
Authorization: Bearer <access_token>
```

**Response sukses:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-user",
      "username": "andi_123",
      "full_name": "Andi",
      "avatar_url": null
    }
  }
}
```

### PATCH `/api/users/me`

Memperbarui informasi profil pengguna yang sedang login.

**Header:**

```http
Authorization: Bearer <access_token>
```

Request body mengikuti field yang diizinkan oleh validator backend.

**Catatan:**

- Pengguna hanya dapat melihat profil miliknya sendiri.
- Pengguna hanya dapat memperbarui profil miliknya sendiri.
- Identitas pengguna diambil dari access token yang sudah diverifikasi.
- Jangan memperbolehkan pengguna mengubah `id` melalui request body.
- Email dan password tidak diperbarui melalui endpoint ini kecuali memang disediakan secara eksplisit oleh kontrak API.

**Catatan dokumentasi:** Field request dan response final untuk BL-03 harus disesuaikan dengan implementasi `users.validator.js` dan `users.controller.js`.

---

## Contoh Penggunaan API

### 1. Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "andi_123",
    "full_name": "Andi",
    "email": "andi@example.net",
    "password": "rahasia123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "andi@example.net",
    "password": "rahasia123"
  }'
```

### 3. Refresh Session

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### 4. Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### 5. Get My Profile

```bash
curl http://localhost:3000/api/users/me \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### 6. Update My Profile

```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -d '{
    "full_name": "Andi Updated"
  }'
```

Contoh body PATCH di atas hanya contoh apabila `full_name` memang diizinkan oleh validator backend.

---

## Catatan Pengembangan

1. Semua nama field JSON API menggunakan `snake_case`.
2. Nama kolom database menggunakan `snake_case`.
3. Nama variabel dan fungsi JavaScript menggunakan `camelCase`.
4. Endpoint yang membutuhkan autentikasi harus menggunakan middleware `requireAuth`.
5. Validasi request dilakukan menggunakan Zod.
6. Error menggunakan `AppError` dan ditangani oleh `errorHandler`.
7. `SUPABASE_SERVICE_ROLE_KEY` hanya boleh digunakan di backend.
8. Pastikan permission database diberikan sesuai kebutuhan backend.
9. Otorisasi grup akan menggunakan middleware `requireAuth` dan `requireGroupMember()` pada endpoint grup dan transaksi (BL-04).

## Backlog Reference

| Backlog | Fitur | Endpoint |
|---|---|---|
| BL-01 | Register | `POST /api/auth/register` |
| BL-02 | Login, Refresh Session, Logout | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| BL-03 | User Profile | `GET /api/users/me`, `PATCH /api/users/me` |
| BL-04 | Group Access | Middleware `requireGroupMember()` |

---

**ChipIn Backend — Sprint 1**
## BL-05 — Undang Anggota via Link/Kode

Lihat [`docs/BL-05-INVITE-GROUP-BY-LINK-CODE.md`](docs/BL-05-INVITE-GROUP-BY-LINK-CODE.md) untuk kontrak endpoint, alur frontend, error code, dan checklist pengujian.

Jalankan migration `supabase/migrations/20261127000000_bl05_group_join_by_code.sql` sebelum menggunakan endpoint BL-05.
