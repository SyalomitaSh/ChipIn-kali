# Chip-In | Git & GitHub Collaboration Guide

> Panduan penggunaan Git dan GitHub untuk seluruh anggota tim pengembang Chip-In.

Dokumen ini menjadi pedoman kolaborasi dan pengelolaan source code proyek Chip-In. Seluruh anggota tim diharapkan mengikuti command, branch naming convention, commit convention, dan Pull Request workflow yang telah ditentukan.

---

## 1. Introduction

### 1.1 What is Git?

Git adalah Version Control System (VCS) yang digunakan untuk mencatat dan mengelola perubahan pada source code. Dengan Git, developer dapat mengetahui riwayat perubahan, kembali ke versi sebelumnya, serta bekerja secara kolaboratif.

### 1.2 What is GitHub?

GitHub merupakan platform berbasis cloud untuk menyimpan repository Git dan memfasilitasi kolaborasi antar-developer.

### 1.3 Git vs GitHub

| Git | GitHub |
|---|---|
| Version Control System | Platform kolaborasi berbasis Git |
| Berjalan secara lokal | Berjalan secara online |
| Mengelola perubahan kode | Menyimpan dan membagikan repository |
| Menggunakan command seperti commit dan branch | Menyediakan Pull Request, Issues, dan Code Review |

---

## 2. Initial Setup

Sebelum berkontribusi, pastikan Git dan VS Code sudah terpasang.

### 2.1 Check Git Installation

Buka terminal dan jalankan:

```bash
git --version
```

Jika versi Git muncul, berarti Git sudah terpasang.

### 2.2 Configure Git Identity

Konfigurasikan nama dan email yang akan digunakan pada commit:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Gunakan email yang terhubung dengan akun GitHub agar atribusi commit sesuai.

### 2.3 Clone Repository

Clone repository Chip-In untuk pertama kali:

```bash
git clone https://github.com/SyalomitaSh/ChipIn-kali.git
```

Masuk ke direktori repository:

```bash
cd ChipIn-kali
```

Buka repository melalui VS Code:

```bash
code .
```

**Catatan:** Clone hanya dilakukan satu kali untuk setiap laptop. Jika repository sudah pernah di-clone, tidak perlu melakukan clone ulang untuk mendapatkan update.

---

## 3. Repository Structure

Struktur direktori utama Chip-In:

```text
ChipIn-kali/
│
├── .github/
│   └── pull_request_template.md
│
├── frontend/
│   ├── src/
│   └── public/
│
├── backend/
│   └── src/
│
├── ml/
│   ├── models/
│   ├── notebooks/
│   └── src/
│
├── .gitignore (belum dibuat sih)
├── git_and_github_guide.md
└── README.md
```

| Directory | Description |
|---|---|
| `frontend/` | Source code antarmuka aplikasi. |
| `backend/` | Source code server dan API. |
| `ml/` | Source code, eksperimen, dan model Machine Learning. |
| `.github/` | Konfigurasi dan template kolaborasi GitHub. |
| `.gitignore` | Daftar file yang tidak perlu dilacak Git. |
| `README.md` | Dokumentasi utama repository. |
| `git_and_github_guide.md` | Guide untuk git dan github yang digunakan untuk keperluan projek kita. |

---

## 4. Essential Git Commands

Bagian ini menjelaskan command Git yang paling sering digunakan selama pengembangan Chip-In.

### 4.1 Check Repository Status

```bash
git status
```

Menampilkan kondisi repository lokal, termasuk file baru, file yang dimodifikasi, dan perubahan yang sudah masuk staging area.

### 4.2 Add Changes

Memasukkan perubahan ke staging area sebelum commit.

```bash
# Menambahkan seluruh perubahan
git add .

# Menambahkan file tertentu
git add frontend/src/Login.jsx

# Menambahkan seluruh perubahan termasuk penghapusan
git add -A

# Menambahkan seluruh perubahan dalam folder tertentu
git add frontend/
```

### 4.3 Commit Changes

Merekam perubahan ke dalam riwayat Git.

```bash
git commit -m "feat: add login page"
```

"feat: add login page" nanti disesuaikan dengan nama commit masing-masing.

### 4.4 Push Changes

Mengirim commit lokal ke repository GitHub.

```bash
# Push branch yang sudah terhubung
git push

# Push branch pertama kali
git push -u origin feature/login-ui

-> feature/login-ui adalah nama branchnya

# Push ke branch tertentu
git push origin main
```

### 4.5 Pull Changes

Mengambil dan mengintegrasikan perubahan terbaru dari remote repository.

```bash
git pull origin main
```

Perintah ini digunakan ketika ingin memperbarui branch lokal `main` berdasarkan branch `main` di GitHub.

### 4.6 Fetch Changes

Mengambil informasi terbaru dari remote tanpa langsung mengintegrasikannya ke branch lokal.

```bash
git fetch origin
```

Untuk melihat commit yang ada di remote `main` tetapi belum ada di lokal:

```bash
git log main..origin/main --oneline
```

### 4.7 View Commit History

```bash
# Melihat seluruh riwayat commit
git log

# Melihat riwayat commit secara ringkas
git log --oneline

# Melihat 5 commit terakhir
git log -5 --oneline
```

Tekan `q` untuk keluar dari tampilan `git log` yang menggunakan pager.

### 4.8 View Changes

```bash
# Melihat perubahan yang belum masuk staging area
git diff

# Melihat perubahan yang sudah masuk staging area
git diff --staged

# Melihat detail commit terakhir
git show HEAD

# Melihat ringkasan file pada commit terakhir
git show --stat HEAD
```

### 4.9 Delete Files

Menghapus file dan mencatat penghapusannya ke staging area:

```bash
git rm filename.txt
```

Jika file sudah dihapus melalui VS Code:

```bash
git add -A
```

Kemudian commit dan push penghapusan tersebut.

### 4.10 Branch Management

```bash
# Melihat seluruh branch lokal
git branch

# Melihat branch lokal dan remote
git branch -a

# Membuat dan langsung berpindah ke branch baru
git switch -c feature/login-ui

# Berpindah branch
git switch main

# Menghapus branch lokal yang sudah di-merge
git branch -d feature/login-ui

# Menghapus branch remote
git push origin --delete feature/login-ui
```

---

## 5. Branch Naming Convention

Untuk menjaga konsistensi repository, seluruh anggota wajib menggunakan standar penamaan branch berikut.

Format:

```text
<type>/<short-description>
```

Gunakan huruf kecil, pisahkan kata dengan tanda hubung (`-`), dan hindari spasi.

| Type | Purpose | Example |
|---|---|---|
| `feature/` | Mengembangkan fitur baru | `feature/login-ui` |
| `fix/` | Memperbaiki bug | `fix/login-validation` |
| `docs/` | Memperbarui dokumentasi | `docs/update-readme` |
| `refactor/` | Merapikan kode tanpa mengubah fungsinya | `refactor/auth-controller` |
| `test/` | Menambahkan atau memperbarui pengujian | `test/login-validation` |
| `chore/` | Konfigurasi dan pemeliharaan proyek | `chore/setup-project` |

### Examples for Chip-In

```text
feature/login-ui
feature/group-management
feature/split-bill
feature/receipt-ocr
feature/expense-classification

fix/receipt-total-calculation
fix/login-validation

docs/update-prd
docs/update-readme

refactor/auth-controller
test/split-bill-calculation
chore/update-dependencies
```

**Rules:**
1. Setiap task atau fitur dikerjakan pada branch tersendiri.
2. Jangan melakukan implementasi fitur langsung di `main`.
3. Hindari nama branch yang terlalu umum seperti `new-feature`, `test-branch`, atau `my-branch`.
4. Gunakan nama yang menggambarkan pekerjaan yang dilakukan.
5. Satu branch sebaiknya memiliki satu fokus pekerjaan.

---

## 6. Commit Message Convention

Gunakan format berikut:

```text
<type>: <short-description>
```

| Type | Purpose |
|---|---|
| `feat` | Menambahkan fitur baru |
| `fix` | Memperbaiki bug |
| `docs` | Memperbarui dokumentasi |
| `refactor` | Merapikan struktur kode |
| `test` | Menambahkan atau memperbarui pengujian |
| `chore` | Pemeliharaan atau konfigurasi proyek |
| `style` | Perubahan format kode tanpa mengubah logika |

Examples:

```bash
git commit -m "feat: add login page"
git commit -m "fix: correct bill calculation"
git commit -m "docs: update installation guide"
git commit -m "refactor: improve auth controller"
git commit -m "test: add split bill test cases"
git commit -m "chore: update dependencies"
```

**Rules:**
- Gunakan bahasa Inggris yang singkat dan jelas.
- Awali dengan type yang sesuai.
- Jelaskan perubahan yang dilakukan.
- Hindari pesan seperti `update`, `changes`, atau `fix bug` tanpa penjelasan.

---

## 7. Team Collaboration Workflow

Seluruh anggota tim wajib mengikuti workflow berikut ketika mengembangkan fitur.

### Step 1 — Synchronize Main Branch

Sebelum memulai task baru:

```bash
git switch main
git pull origin main
```

Tujuannya agar pekerjaan dimulai dari versi terbaru branch utama.

### Step 2 — Create Feature Branch

Buat branch berdasarkan task yang diberikan:

```bash
git switch -c feature/login-ui
```

### Step 3 — Development

Kerjakan fitur pada direktori yang sesuai.

Contoh:

```text
frontend/src/
```

untuk implementasi antarmuka.

### Step 4 — Check Changes

```bash
git status
git diff
```

Periksa perubahan sebelum melakukan commit.

### Step 5 — Stage and Commit

```bash
git add .
git commit -m "feat: add login page"
```

### Step 6 — Push Branch

```bash
git push -u origin feature/login-ui
```

### Step 7 — Create Pull Request

Buka GitHub, masuk ke tab Pull Requests, lalu pilih New Pull Request.

Pastikan:
- Base branch: `main`
- Compare branch: branch pekerjaanmu.

Gunakan Pull Request Template yang tersedia di repository.

### Step 8 — Code Review

Anggota tim melakukan pemeriksaan terhadap perubahan kode.

Jika terdapat revisi, lakukan perbaikan pada branch yang sama, kemudian commit dan push kembali.

### Step 9 — Merge Pull Request

Setelah perubahan disetujui dan pemeriksaan yang diperlukan selesai, PR dapat di-merge ke `main` oleh anggota yang memiliki izin.

### Step 10 — Update Local Main

Setelah PR selesai di-merge:

```bash
git switch main
git pull origin main
```

Branch fitur lokal dapat dihapus setelah tidak dibutuhkan lagi.

---

## 8. Pull Request Guidelines

Setiap perubahan yang akan dimasukkan ke `main` harus melalui Pull Request.

### Pull Request Rules

1. Gunakan branch yang sesuai dengan naming convention.
2. Pastikan perubahan sudah di-commit dan di-push.
3. Gunakan judul PR yang jelas.
4. Jelaskan perubahan dan tujuan implementasi.
5. Cantumkan hasil testing.
6. Sertakan screenshot jika perubahan berkaitan dengan UI.
7. Hubungkan PR dengan GitHub Issue jika tersedia.
8. Minta review dari minimal satu anggota tim sebelum merge.
9. Jangan merge PR yang masih memiliki masalah penting atau belum diselesaikan.

---

## 9. Merge Conflict

Merge conflict terjadi ketika Git tidak dapat menggabungkan perubahan secara otomatis, misalnya karena dua branch mengubah bagian yang sama dalam satu file.

Langkah penanganan:

1. Buka file yang mengalami conflict.
2. Periksa bagian yang ditandai Git.
3. Diskusikan perubahan dengan anggota terkait jika diperlukan.
4. Tentukan kode yang seharusnya dipertahankan.
5. Hapus penanda conflict setelah diselesaikan.
6. Simpan file.
7. Stage dan commit penyelesaian conflict.

Contoh penanda conflict:

```text
<<<<<<< HEAD
Your current changes
=======
Incoming changes
>>>>>>> branch-name
```

Jangan langsung memilih salah satu perubahan tanpa memahami dampaknya.

---

## 10. Important Collaboration Rules

Untuk menjaga repository Chip-In tetap terorganisasi:

1. Jangan melakukan coding langsung di `main`.
2. Selalu sinkronkan branch sebelum memulai task baru.
3. Gunakan branch terpisah untuk setiap task atau fitur.
4. Gunakan commit message yang deskriptif.
5. Lakukan Pull Request sebelum menggabungkan fitur ke `main`.
6. Jangan melakukan force push pada branch bersama tanpa koordinasi.
7. Jangan mengunggah file `.env`, password, API key, atau informasi rahasia.
8. Jangan mengunggah `node_modules/`, virtual environment, atau file sementara.
9. Koordinasikan perubahan pada file yang dikerjakan bersama.
10. Hapus branch fitur setelah merge jika sudah tidak digunakan.

---

## 11. Quick Reference

| Task | Command |
|---|---|
| Clone repository | `git clone <url>` |
| Check status | `git status` |
| Add all changes | `git add .` |
| Add all changes including deletions | `git add -A` |
| Commit | `git commit -m "message"` |
| Push | `git push` |
| Pull main | `git pull origin main` |
| Fetch | `git fetch origin` |
| View commit history | `git log --oneline` |
| View branches | `git branch -a` |
| Create branch | `git switch -c <branch-name>` |
| Switch branch | `git switch <branch-name>` |
| Merge branch | `git merge <branch-name>` |
| Delete local branch | `git branch -d <branch-name>` |
| Delete remote branch | `git push origin --delete <branch-name>` |

---

## 12. Closing Notes

Seluruh anggota tim diharapkan memahami dan mengikuti panduan ini agar pengembangan Chip-In dapat berjalan secara konsisten, terorganisasi, dan kolaboratif.

Jika mengalami kendala terkait Git atau GitHub, diskusikan dengan anggota tim sebelum melakukan tindakan yang berisiko terhadap branch atau pekerjaan anggota lainnya.

**Happy Coding!**

*Kita pasti sukses guys aowkwkw*
*Chip-In Development Team*