// =============================================================
// app.js — inisialisasi Firebase & fungsi bantuan bersama
// =============================================================

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

/** Referensi koleksi Firestore */
const refKandidat = db.collection("kandidat");
const refSuara = db.collection("suara");
const refPengaturan = db.doc("pengaturan/status");

/** Ambil status pemilihan (buka/tutup). Membuat default jika belum ada. */
async function ambilStatusPemilihan() {
  const snap = await refPengaturan.get();
  if (!snap.exists) {
    await refPengaturan.set({ dibuka: false });
    return { dibuka: false };
  }
  return snap.data();
}

/** Format tanggal Indonesia sederhana */
function formatWaktu(timestamp) {
  if (!timestamp) return "-";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

/** Tampilkan pesan toast singkat di pojok bawah */
function tampilkanToast(pesan, jenis = "info") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast--${jenis}`;
  toast.textContent = pesan;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast--show"));
  setTimeout(() => {
    toast.classList.remove("toast--show");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/** Validasi format NISN sederhana: 8-12 digit angka */
function nisnValid(nisn) {
  return /^[0-9]{6,12}$/.test(nisn.trim());
}
