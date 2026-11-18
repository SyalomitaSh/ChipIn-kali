# Panduan Pengujian BL-01 — Registrasi Akun

Endpoint: `POST /api/auth/register`

Header:
- `Content-Type: application/json`

Contoh body valid:
```json
{
  "username": "andi_123",
  "full_name": "Andi Saputra",
  "email": "andi.unique@example.net",
  "password": "rahasia123"
}
```

## Skenario pengujian

| No. | Skenario | Hasil yang diharapkan |
|---|---|---|
| 1 | Semua field valid dan email/username belum digunakan | HTTP 201, `success: true`, data user dikembalikan |
| 2 | Username sudah digunakan | HTTP 409, kode `USERNAME_TAKEN` |
| 3 | Email sudah digunakan | HTTP 409, kode `EMAIL_TAKEN` jika Supabase mengidentifikasi akun duplikat |
| 4 | Email tidak valid | HTTP 400, kode `VALIDATION_ERROR` atau `INVALID_EMAIL` dari Supabase |
| 5 | Password kurang dari 8 karakter | HTTP 400, validasi Zod gagal |
| 6 | Username kurang dari 3 atau lebih dari 30 karakter | HTTP 400, validasi Zod gagal |
| 7 | Username berisi karakter selain huruf, angka, underscore | HTTP 400, validasi Zod gagal |
| 8 | Field wajib tidak dikirim | HTTP 400, validasi Zod gagal |
| 9 | Supabase membatasi pengiriman email | HTTP 429, kode `RATE_LIMITED` |
| 10 | Konfirmasi email aktif | HTTP 201; `session` dapat `null` dan `requires_email_confirmation: true` |

## Verifikasi setelah registrasi

1. Buka Supabase Dashboard → Authentication → Users. Pastikan user baru muncul.
2. Buka Table Editor → `public.profiles`. Pastikan baris dengan `id` yang sama dengan `auth.users.id` dibuat oleh trigger.
3. Pastikan `username` dan `full_name` terisi sesuai request.
4. Coba registrasi lagi dengan username yang sama tetapi email berbeda. Harus ditolak dengan HTTP 409.
5. Coba registrasi lagi dengan email yang sama. Harus ditolak sebagai email yang sudah terdaftar.

## Catatan
- Gunakan email uji yang valid dan unik. Domain contoh seperti `example.com` dapat ditolak oleh konfigurasi/provider email tertentu.
- Jangan menguji berulang kali dalam waktu singkat karena Supabase memiliki batas pengiriman email.
- Jika konfirmasi email aktif, tidak adanya session pada respons registrasi bukan berarti registrasi gagal.
- Pengecekan username di endpoint membantu memberi respons yang ramah. Unique index di database tetap menjadi perlindungan final terhadap duplikasi bersamaan (race condition).
