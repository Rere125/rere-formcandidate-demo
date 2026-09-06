# Form Data Kandidat — PT Tatalogam Group

Form pengumpulan data kandidat bergaya multi-bagian (seperti Zoho Forms) — kandidat
mengisi lewat menu samping (Data Pribadi, Keluarga & Referensi, Kontak Darurat,
Pendidikan, Riwayat Pekerjaan, dst), lengkap dengan grup berulang (bisa tambah baris
Referensi/Riwayat Pekerjaan), tanda tangan digital, dan upload file. Semua pertanyaan
& bagian bisa diedit lewat panel admin, dan data tersimpan hanya bisa diakses lewat
panel admin ber-password.

## Cara kerja singkat

- `public/index.html` + `public/js/app.js` — form yang dilihat kandidat. Struktur
  bagian & pertanyaan diambil otomatis dari server (`get-questions`), jadi begitu kamu
  ubah lewat admin, form ini langsung berubah tanpa perlu deploy ulang.
- `public/admin.html` + `public/js/admin.js` — panel admin (login password) untuk:
  - Tab **Kelola Formulir**: atur bagian (section), tambah/hapus/urutkan pertanyaan,
    ubah tipe field (termasuk **Grup Berulang** untuk field seperti Referensi/Riwayat
    Pekerjaan — kamu atur sendiri kolom apa saja di dalamnya).
  - Tab **Data Kandidat**: tabel ringkas semua kandidat masuk → klik **Lihat Detail**
    untuk laporan lengkap per-bagian (persis gaya laporan Zoho Forms), unduh file satu
    per satu, atau **Unduh PDF Laporan** untuk versi teks (lihat catatan di bawah), ubah
    **status kandidat** (Baru Masuk/Diproses/Diterima/Tidak Lolos — status Diproses,
    Diterima & Tidak Lolos otomatis mengirim email notifikasi ke kandidat), dan hapus
    data.
  - Tab **Template Email**: atur subjek & isi email notifikasi otomatis untuk status
    Diterima/Ditolak, pakai placeholder `{{nama}}` dan `{{posisi}}`.
- `netlify/functions/` — backend serverless (Netlify Functions) yang menyimpan data
  memakai **Netlify Blobs** (built-in storage Netlify, otomatis aktif, tidak perlu
  database terpisah).

Data kandidat (jawaban + file) **tidak pernah publik** — hanya bisa diakses lewat
`admin.html` dengan password yang kamu set sendiri.

### Soal export PDF laporan

Tombol **Unduh PDF Laporan** di Panel Admin menghasilkan PDF berisi seluruh jawaban
teks (dikelompokkan per bagian, persis seperti laporan Zoho) plus gambar tanda tangan
digital. File yang diupload kandidat (ijazah, slip gaji, hasil MBTI, dll — PDF/gambar)
**tidak digabung otomatis** ke PDF itu; namanya tetap dicantumkan di laporan, dan kamu
unduh satu per satu lewat tombol/link file di halaman detail lalu satukan manual
(misal pakai Adobe Acrobat / gabung PDF online). Ini sengaja dibuat begitu (bukan
digabung otomatis oleh sistem) sesuai permintaan awal.

## Langkah deploy ke Netlify

### 1. Push ke GitHub (paling gampang & direkomendasikan)

```bash
cd candidate-form
git init
git add .
git commit -m "Form data kandidat"
```

Buat repo baru di GitHub, lalu:
```bash
git remote add origin <url-repo-kamu>
git push -u origin main
```

### 2. Connect ke Netlify

1. Buka [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Pilih repo GitHub kamu.
3. Build settings biasanya otomatis kebaca dari `netlify.toml`:
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. Klik **Deploy**.

> Catatan: kalau mau deploy tanpa GitHub (drag & drop), functions **tidak akan jalan**
> — drag & drop cuma untuk file statis. Kalau mau tanpa GitHub, pakai Netlify CLI:
> `npm install -g netlify-cli` lalu `netlify deploy --prod` dari folder project ini.

### 3. Set environment variables

Di dashboard Netlify: **Site settings → Environment variables → Add a variable**,
tambahkan 2 variable ini:

```
Key:   ADMIN_PASSWORD
Value: (password lama kamu — dipakai SEKALI untuk bikin akun Super Admin pertama,
        username "admin", dan juga jadi jalur darurat kalau semua akun lupa password)

Key:   SESSION_SECRET
Value: (string acak yang panjang & rahasia, mis. hasil generate password manager —
        dipakai buat menandatangani sesi login, bukan password siapa pun)
```

Setelah nambah env var, **trigger deploy ulang** sekali (Deploys → Trigger deploy)
supaya functions membaca variable barunya.

### 3b. Email notifikasi otomatis (Resend) — opsional, tunggu DNS dari tim IT

Kalau mau status **Diproses**/**Diterima**/**Ditolak** otomatis kirim email ke kandidat, tambahkan
2 environment variable lagi setelah domain pengirim selesai diverifikasi DNS-nya:

```
Key:   RESEND_API_KEY
Value: (API key dari dashboard Resend)

Key:   RESEND_FROM_EMAIL
Value: (alamat pengirim dari domain yang SUDAH terverifikasi di Resend,
        mis. "HC Tatalogam Group <hc@tatalogam.co.id>")
```

Trigger deploy ulang lagi setelah menambahkannya. Selama 2 variable ini belum ada
(atau domainnya belum aktif), fitur ubah status kandidat **tetap jalan normal** —
sistem cuma menandai "email belum terkirim" di Panel Admin, tidak ada yang error/rusak.
Begitu 2 env var ini aktif, ubah status langsung otomatis kirim email tanpa perlu
ubah kode lagi. Template subjek & isi emailnya diatur di tab **Template Email**.

### 4. Login pertama kali & tambah akun tim

- Buka `https://nama-site-kamu.netlify.app/admin.html`
- Login pertama kali pakai **username `admin`** + password yang kamu isi di
  `ADMIN_PASSWORD` tadi → otomatis jadi akun **Super Admin** pertama.
- Buka tab **Kelola User** → tambahkan akun kamu sendiri pakai email (mis.
  `rere@tatalogam.co.id`) dengan role **Super Admin**, login pakai akun itu, lalu kalau
  mau, turunkan role akun `admin` bawaan jadi **Admin** biasa (atau biarkan saja sebagai
  cadangan) lewat dropdown "Ubah Role" di baris user tersebut.
- Tambahkan akun untuk tiap anggota tim HC lainnya (role **Admin** untuk akses harian,
  **Super Admin** kalau perlu bisa kelola akun juga). Username boleh pakai email atau
  nama pendek (huruf/angka/titik/underscore/plus/strip/@).
- Kirim link form ke kandidat: `https://nama-site-kamu.netlify.app/`

## Sistem akun & role

- **Super Admin**: akses penuh (Data Kandidat, Kelola Formulir, Kelola User —
  tambah/hapus user, reset password siapa saja, ubah role user lain jadi Admin/Super
  Admin, lihat Log Login).
- **Admin**: akses Data Kandidat & Kelola Formulir, bisa ganti password sendiri lewat
  tab Kelola User, tapi tidak bisa tambah/hapus/lihat user lain atau lihat log login.
- **Lupa password?** Minta Super Admin reset dari tab Kelola User → Daftar User →
  tombol "Reset Password".
- **Log Login**: Super Admin bisa lihat 300 login terakhir (waktu, username, role, IP)
  di tab Kelola User → kartu "Log Login".
- **Nambah/hapus/ubah user setelah ini SEMUA lewat panel, tidak perlu deploy ulang** —
  tersimpan langsung ke Netlify Blobs saat itu juga. Deploy ulang cuma perlu kalau ada
  perubahan kode.
- **Semua Super Admin lupa password (jalur darurat)**: set/ubah `ADMIN_PASSWORD` di
  Netlify env, trigger deploy ulang, lalu login pakai username `admin` + password itu —
  akun `admin` otomatis ke-reset ke password tersebut dan jadi Super Admin lagi.
  ⚠️ Ini berlaku terus selama `ADMIN_PASSWORD` di-set, jadi kalau kamu sudah pindah
  sepenuhnya ke akun individual dan ingin jalur darurat ini dimatikan, hapus saja
  environment variable `ADMIN_PASSWORD` di Netlify (tapi pastikan minimal 1 akun
  Super Admin lain sudah ada & passwordnya diingat sebelum menghapusnya).
- Password disimpan ter-hash (bukan teks polos) di Netlify Blobs; sesi login berlaku
  12 jam lalu perlu login ulang.

## Catatan penting

- **Batas ukuran file**: maksimal 8MB per file (CV/portofolio). Kalau butuh lebih besar,
  ubah `MAX_FILE_BYTES` di `netlify/functions/submit-candidate.js` dan `MAX_FILE_MB`
  di `public/js/app.js` — tapi perhatikan limit payload Netlify Functions (~6MB request
  synchronous di banyak plan, jadi kalau butuh file besar, pertimbangkan solusi upload
  langsung ke storage seperti S3).
- **Kepatuhan data pribadi**: karena ini data kandidat (termasuk kontak & CV), pastikan
  hanya buatkan akun untuk orang yang memang berwenang, sesuai kebijakan data pribadi
  internal Tatalogam Group.
- **Ubah pertanyaan default**: pertanyaan awal (Nama, Email, No HP, Posisi, dst) ada di
  `netlify/functions/get-questions.js` sebagai fallback — begitu kamu simpan sekali lewat
  admin panel, itu yang jadi acuan seterusnya (tersimpan di Netlify Blobs).
