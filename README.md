# E-Voting Ketua OSIS — MTsN 3 Subang

Sistem pemilihan Ketua & Wakil Ketua OSIS secara online. Siswa memilih lewat HP/komputer dengan verifikasi NISN (tidak bisa memilih dua kali), panitia mengelola kandidat lewat panel admin, dan hasil tampil real-time.

**Struktur file:**
```
evoting-osis/
├── index.html          → halaman voting siswa
├── hasil.html           → hasil suara real-time (publik)
├── admin.html           → panel panitia (login diperlukan)
├── firestore.rules      → aturan keamanan database
├── assets/
│   ├── style.css
│   ├── app.js            → inisialisasi Firebase & fungsi bersama
│   ├── vote.js            → logika halaman voting
│   ├── hasil.js           → logika halaman hasil
│   ├── admin.js           → logika panel panitia
│   └── firebase-config.js → WAJIB DIISI dengan konfigurasi Firebase kamu
└── README.md (file ini)
```

Karena GitHub Pages hanya menyajikan file statis, penyimpanan suara memakai **Firebase Firestore** (basis data gratis dari Google) supaya suara dari semua siswa tersimpan di satu tempat dan bisa dilihat panitia secara real-time — bukan tersimpan sendiri-sendiri di tiap HP.

---

## Langkah 1 — Buat proyek Firebase (gratis)

1. Buka https://console.firebase.google.com dan login dengan akun Google.
2. Klik **Tambahkan proyek**, beri nama misalnya `evoting-osis-mtsn3subang`. Google Analytics boleh dimatikan.
3. Setelah proyek dibuat, di halaman utama klik ikon **`</>`** (Web) untuk mendaftarkan aplikasi web. Beri nama bebas, klik **Daftarkan aplikasi**.
4. Firebase akan menampilkan objek `firebaseConfig` seperti ini:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "evoting-osis-....firebaseapp.com",
     projectId: "evoting-osis-....",
     storageBucket: "evoting-osis-....appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Salin nilai-nilai tersebut ke file **`assets/firebase-config.js`**, menggantikan tulisan `GANTI_DENGAN_...`.

## Langkah 2 — Aktifkan Firestore Database

1. Di menu kiri Firebase Console, buka **Build > Firestore Database**.
2. Klik **Create database**, pilih lokasi server terdekat (misalnya `asia-southeast2 (Jakarta)`), lalu pilih mode **production**.
3. Setelah database dibuat, buka tab **Rules**, hapus isi default, lalu tempel isi file **`firestore.rules`** dari folder proyek ini. Klik **Publish**.
   - Aturan ini yang membuat satu NISN hanya bisa mengirim satu suara, dan mencegah siapa pun mengubah suara orang lain lewat kode di browser.

## Langkah 3 — Aktifkan Authentication untuk akun panitia

1. Di menu kiri, buka **Build > Authentication > Get started**.
2. Pada tab **Sign-in method**, aktifkan provider **Email/Password**.
3. Buka tab **Users**, klik **Add user**, isi email dan kata sandi untuk akun panitia (misalnya `panitia.osis@sekolah.id`). Akun inilah yang dipakai login di `admin.html`.
4. Buat sebanyak akun panitia yang diperlukan dengan cara yang sama.

## Langkah 4 — Siapkan dokumen pengaturan awal (opsional, sistem akan membuatnya otomatis saat pertama diakses)

Sistem otomatis membuat dokumen `pengaturan/status` dengan `dibuka: false` saat pertama kali halaman voting dibuka. Kamu bisa juga membuatnya manual di tab **Data** Firestore:
- Koleksi: `pengaturan`, ID dokumen: `status`, field: `dibuka` (boolean) = `false`.

## Langkah 5 — Unggah ke GitHub & aktifkan GitHub Pages

1. Buat repository baru di GitHub, misalnya `evoting-osis-mtsn3subang`.
2. Unggah seluruh isi folder `evoting-osis/` ke repository tersebut (lewat web GitHub "Add file > Upload files", atau lewat `git push` jika sudah terbiasa).
3. Di repository, buka **Settings > Pages**.
4. Pada **Source**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
5. Tunggu 1–2 menit, GitHub akan menampilkan alamat situs, biasanya:
   `https://<username-github>.github.io/evoting-osis-mtsn3subang/`

## Langkah 6 — Tambahkan kandidat & mulai pemilihan

1. Buka `https://<alamat-situs>/admin.html`, login dengan akun panitia yang dibuat di Langkah 3.
2. Di tab **Kandidat**, isi nomor urut, nama ketua, nama wakil, visi, dan (opsional) URL foto — bisa memakai layanan seperti Imgur atau Google Drive (pastikan link bisa diakses publik).
3. Di tab **Pengaturan pemilihan**, aktifkan saklar **Pemilihan dibuka** saat hari pemilihan dimulai, dan matikan setelah selesai.
4. Bagikan alamat `index.html` (halaman utama) ke seluruh siswa, dan alamat `hasil.html` untuk layar hasil di aula/panggung.

---

## Cara kerja pencegahan pemilihan ganda

Setiap suara disimpan sebagai satu dokumen di Firestore dengan **ID dokumen = NISN siswa**. Aturan keamanan (`firestore.rules`) hanya mengizinkan **pembuatan (create)** dokumen suara jika NISN tersebut *belum pernah* mengirim suara sebelumnya, dan melarang siapa pun mengubah suara yang sudah masuk kecuali panitia. Jadi meskipun siswa membuka halaman voting berkali-kali atau mencoba lewat perangkat lain, sistem akan menolak suara kedua.

## Uji coba sebelum hari-H

1. Tambahkan 2–3 kandidat contoh, buka status pemilihan, lalu coba memilih dari `index.html` memakai NISN uji coba.
2. Buka `hasil.html` di tab lain — angka seharusnya bertambah otomatis tanpa perlu memuat ulang halaman.
3. Setelah yakin sistem berjalan baik, di panel admin klik **Hapus semua suara** (tab Pengaturan) untuk membersihkan data uji coba sebelum pemilihan sungguhan dimulai.

## Batasan yang perlu diketahui

- Sistem memverifikasi NISN untuk mencegah satu siswa memilih dua kali, tapi tidak memverifikasi bahwa NISN yang dimasukkan benar-benar milik siswa yang bersangkutan (tidak ada login siswa). Untuk sekolah, ini biasanya cukup karena pemilihan diawasi langsung oleh guru/panitia di lab komputer atau memakai HP masing-masing di kelas dengan pengawasan.
- Firebase memiliki kuota gratis (Spark plan) yang jauh lebih dari cukup untuk pemilihan tingkat sekolah (puluhan ribu operasi baca/tulis per hari secara gratis).
- Jangan bagikan isi `assets/firebase-config.js` sebagai rahasia — nilai ini memang publik by design pada aplikasi web Firebase; keamanan sesungguhnya dijaga oleh `firestore.rules`, bukan dengan menyembunyikan config ini.

## Kustomisasi cepat

- **Nama sekolah/periode:** ubah `KONFIGURASI_PEMILIHAN` di `assets/firebase-config.js`.
- **Warna & tampilan:** ubah variabel warna di bagian atas `assets/style.css` (`:root { ... }`).
- **Menampilkan persentase partisipasi:** isi `totalSiswaTerdaftar` di `assets/firebase-config.js` dengan jumlah total siswa.
