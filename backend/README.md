# ChipIn Backend

REST API ChipIn — Express JS + Supabase (Postgres & Auth).

## Setup

```bash
npm install
cp .env.example .env     # isi kredensial Supabase
npm run dev              # http://localhost:3000/api/health
```

Prasyarat: Node.js >= 20.

### Supabase
1. Buat project di supabase.com, salin `URL`, `anon key`, dan `service_role key` ke `.env`.
2. Jalankan `supabase/schema.sql` di **SQL Editor**.
3. (Opsional dev) Authentication -> Providers -> Email -> matikan **Confirm email**
   agar registrasi langsung mengembalikan sesi. Untuk production sebaiknya aktif.

## Struktur

```
src/
  config/        env (validasi .env), klien Supabase
  middlewares/   auth (JWT), groupAccess (BL-04), validate (zod), errorHandler
  routes/        definisi endpoint
  controllers/   logika request/response
  validators/    skema zod
  utils/         AppError, asyncHandler
supabase/schema.sql
```

Alur: `route -> validate -> (requireAuth) -> controller`. Error dilempar sebagai `AppError`
dan diformat otomatis oleh `errorHandler`.

## Endpoint (Sprint 1)

| Method | Path | Auth | Backlog |
|---|---|---|---|
| GET | /api/health | – | – |
| POST | /api/auth/register | – | BL-01 |
| POST | /api/auth/login | – | BL-02 |
| POST | /api/auth/refresh | – | BL-02 |
| POST | /api/auth/logout | Bearer | BL-02 |
| GET | /api/users/me | Bearer | BL-03 |
| PATCH | /api/users/me | Bearer | BL-03 |

Format respons (seragam untuk kontrak API BL-25):

```json
{ "success": true,  "data": { } }
{ "success": false, "error": { "code": "EMAIL_TAKEN", "message": "...", "details": { } } }
```

Contoh:

```bash
curl -X POST localhost:3000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"a@mail.com","password":"rahasia123","full_name":"Andi"}'

curl localhost:3000/api/users/me -H 'Authorization: Bearer <accessToken>'
```

## Catatan
- `SUPABASE_SERVICE_ROLE_KEY` bypass RLS: hanya di backend, jangan di-commit / dikirim ke klien.
- Otorisasi grup (BL-04): pasang `requireAuth` lalu `requireGroupMember()` di route grup/transaksi.
