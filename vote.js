// =============================================================
// vote.js — logika halaman pemilihan
// =============================================================

let kandidatTerpilih = null;
let dataSiswa = null;

document.getElementById("txtSekolah").textContent = KONFIGURASI_PEMILIHAN.namaSekolah;
document.getElementById("txtPeriode").textContent =
  `${KONFIGURASI_PEMILIHAN.namaPemilihan} — Periode ${KONFIGURASI_PEMILIHAN.tahunPeriode}`;

async function muatStatus() {
  const status = await ambilStatusPemilihan();
  const pill = document.getElementById("pillStatus");
  if (status.dibuka) {
    pill.textContent = "Pemilihan sedang berlangsung";
    pill.className = "status-pill status-pill--buka";
  } else {
    pill.textContent = "Pemilihan belum/sudah ditutup";
    pill.className = "status-pill status-pill--tutup";
  }
  return status.dibuka;
}

document.getElementById("btnLanjut").addEventListener("click", async () => {
  const nisn = document.getElementById("inputNisn").value.trim();
  const nama = document.getElementById("inputNama").value.trim();
  const kelas = document.getElementById("inputKelas").value.trim();
  const pesan = document.getElementById("pesanIdentitas");
  pesan.textContent = "";

  if (!nisnValid(nisn)) {
    pesan.textContent = "NISN tidak valid. Masukkan 6–12 digit angka.";
    return;
  }
  if (!nama || !kelas) {
    pesan.textContent = "Nama dan kelas wajib diisi.";
    return;
  }

  document.getElementById("btnLanjut").disabled = true;
  document.getElementById("btnLanjut").textContent = "Memeriksa…";

  try {
    const dibuka = await muatStatus();
    if (!dibuka) {
      document.getElementById("kartuIdentitas").hidden = true;
      document.getElementById("areaKosong").hidden = false;
      return;
    }

    // Cek apakah NISN ini sudah pernah memilih
    const suaraSnap = await refSuara.doc(nisn).get();
    if (suaraSnap.exists) {
      document.getElementById("kartuIdentitas").hidden = true;
      document.getElementById("areaSudahMemilih").hidden = false;
      return;
    }

    dataSiswa = { nisn, nama, kelas };
    await muatKandidat();
    document.getElementById("kartuIdentitas").hidden = true;
    document.getElementById("areaKandidat").hidden = false;
  } catch (err) {
    console.error(err);
    pesan.textContent = "Terjadi kesalahan koneksi. Periksa konfigurasi Firebase dan coba lagi.";
  } finally {
    document.getElementById("btnLanjut").disabled = false;
    document.getElementById("btnLanjut").textContent = "Lanjut ke surat suara";
  }
});

async function muatKandidat() {
  const snap = await refKandidat.orderBy("nomorUrut").get();
  const kontainer = document.getElementById("daftarKandidat");
  kontainer.innerHTML = "";

  if (snap.empty) {
    document.getElementById("areaKandidat").hidden = true;
    document.getElementById("areaKosong").hidden = false;
    return;
  }

  snap.forEach((doc) => {
    const k = doc.data();
    const kartu = document.createElement("article");
    kartu.className = "kandidat";
    kartu.dataset.id = doc.id;

    kartu.innerHTML = `
      <div class="kandidat__foto" style="${k.fotoUrl ? `background-image:url('${k.fotoUrl}'); background-size:cover; background-position:center;` : ""}">
        <div class="kandidat__nomor">${k.nomorUrut}</div>
      </div>
      <div class="kandidat__isi">
        <div class="kandidat__nama">${k.namaKetua} &amp; ${k.namaWakil}</div>
        <div class="kandidat__visi">${k.visi || ""}</div>
        <button class="btn btn--outline kandidat__pilih" data-id="${doc.id}">Pilih calon ini</button>
      </div>
    `;
    kontainer.appendChild(kartu);
  });

  kontainer.querySelectorAll(".kandidat__pilih").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const kandidat = snap.docs.find((d) => d.id === id).data();
      bukaKonfirmasi(id, kandidat);
    });
  });
}

function bukaKonfirmasi(id, kandidat) {
  kandidatTerpilih = { id, ...kandidat };
  document.getElementById("teksKonfirmasi").textContent =
    `Kamu memilih Nomor Urut ${kandidat.nomorUrut}: ${kandidat.namaKetua} & ${kandidat.namaWakil}. Suara tidak dapat diubah setelah dikirim.`;
  document.getElementById("overlayKonfirmasi").hidden = false;
}

document.getElementById("btnBatal").addEventListener("click", () => {
  document.getElementById("overlayKonfirmasi").hidden = true;
  kandidatTerpilih = null;
});

document.getElementById("btnKirim").addEventListener("click", async () => {
  if (!kandidatTerpilih || !dataSiswa) return;

  const btn = document.getElementById("btnKirim");
  btn.disabled = true;
  btn.textContent = "Mengirim…";

  try {
    // doc id = NISN mencegah pemilihan ganda lewat security rule (create-only)
    await refSuara.doc(dataSiswa.nisn).set({
      kandidatId: kandidatTerpilih.id,
      nomorUrut: kandidatTerpilih.nomorUrut,
      nama: dataSiswa.nama,
      kelas: dataSiswa.kelas,
      waktu: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("overlayKonfirmasi").hidden = true;
    document.getElementById("areaKandidat").hidden = true;
    document.getElementById("areaSudahMemilih").hidden = false;
    document.getElementById("areaSudahMemilih").querySelector("h2").textContent = "Suara berhasil dikirim";
    tampilkanToast("Terima kasih! Suaramu sudah tercatat.", "sukses");
  } catch (err) {
    console.error(err);
    if (err.code === "permission-denied") {
      tampilkanToast("NISN ini sudah pernah memilih sebelumnya.", "error");
      document.getElementById("overlayKonfirmasi").hidden = true;
      document.getElementById("areaKandidat").hidden = true;
      document.getElementById("areaSudahMemilih").hidden = false;
    } else {
      tampilkanToast("Gagal mengirim suara. Coba lagi.", "error");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Kirim suara";
  }
});

muatStatus();
