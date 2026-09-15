// =============================================================
// KONFIGURASI FIREBASE
// -------------------------------------------------------------
// Ganti nilai-nilai di bawah ini dengan konfigurasi proyek
// Firebase kamu sendiri. Cara mendapatkannya ada di README.md
// (bagian "Setup Firebase"), langkahnya kurang lebih:
//   1. Buka https://console.firebase.google.com
//   2. Buat proyek baru, misalnya "evoting-osis-mtsn3subang"
//   3. Tambahkan aplikasi Web (ikon </>)
//   4. Salin objek firebaseConfig yang muncul ke bawah ini
// =============================================================

const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_AUTH_DOMAIN",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_STORAGE_BUCKET",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};

// Nama sekolah & pemilihan — bisa diubah sesuai kebutuhan
const KONFIGURASI_PEMILIHAN = {
  namaSekolah: "MTsN 3 Subang",
  namaPemilihan: "Pemilihan Ketua & Wakil Ketua OSIS",
  tahunPeriode: "2026/2027",
  totalSiswaTerdaftar: null // isi angka jika ingin menampilkan persentase partisipasi, atau biarkan null
};
