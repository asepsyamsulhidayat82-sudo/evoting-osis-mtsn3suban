// =============================================================
// admin.js — logika panel panitia
// =============================================================

document.getElementById("txtSekolah").textContent = KONFIGURASI_PEMILIHAN.namaSekolah;

// ---------- Autentikasi ----------

auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("areaLogin").hidden = true;
    document.getElementById("areaPanel").hidden = false;
    document.getElementById("btnLogout").style.display = "inline-flex";
    muatKandidatAdmin();
    muatPengaturan();
    muatRiwayatSuara();
  } else {
    document.getElementById("areaLogin").hidden = false;
    document.getElementById("areaPanel").hidden = true;
    document.getElementById("btnLogout").style.display = "none";
  }
});

document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("inputEmail").value.trim();
  const password = document.getElementById("inputPassword").value;
  const pesan = document.getElementById("pesanLogin");
  pesan.textContent = "";

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    pesan.textContent = "Email atau kata sandi salah, atau akun belum dibuat di Firebase.";
  }
});

document.getElementById("btnLogout").addEventListener("click", () => auth.signOut());

// ---------- Navigasi tab ----------

document.querySelectorAll("nav.tab-admin a").forEach((tab) => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll("nav.tab-admin a").forEach((t) => t.classList.remove("aktif"));
    tab.classList.add("aktif");
    document.getElementById("tabKandidat").hidden = tab.dataset.tab !== "kandidat";
    document.getElementById("tabPengaturan").hidden = tab.dataset.tab !== "pengaturan";
    document.getElementById("tabSuara").hidden = tab.dataset.tab !== "suara";
  });
});

// ---------- Kandidat: tambah & daftar ----------

document.getElementById("btnSimpanKandidat").addEventListener("click", async () => {
  const nomorUrut = parseInt(document.getElementById("fNomor").value, 10);
  const namaKetua = document.getElementById("fKetua").value.trim();
  const namaWakil = document.getElementById("fWakil").value.trim();
  const visi = document.getElementById("fVisi").value.trim();
  const misi = document.getElementById("fMisi").value.trim();
  const fotoUrl = document.getElementById("fFoto").value.trim();
  const pesan = document.getElementById("pesanKandidat");

  if (!nomorUrut || !namaKetua || !namaWakil) {
    pesan.textContent = "Nomor urut, nama ketua, dan nama wakil wajib diisi.";
    pesan.style.color = "#9B1B41";
    return;
  }

  try {
    await refKandidat.add({ nomorUrut, namaKetua, namaWakil, visi, misi, fotoUrl });
    pesan.textContent = "Kandidat tersimpan.";
    pesan.style.color = "#2f6b3f";
    ["fNomor", "fKetua", "fWakil", "fVisi", "fMisi", "fFoto"].forEach((id) => (document.getElementById(id).value = ""));
    tampilkanToast("Kandidat berhasil ditambahkan.");
  } catch (err) {
    console.error(err);
    pesan.textContent = "Gagal menyimpan. Periksa koneksi/izin Firestore.";
    pesan.style.color = "#9B1B41";
  }
});

async function muatKandidatAdmin() {
  refKandidat.orderBy("nomorUrut").onSnapshot(async (snap) => {
    const suaraSnap = await refSuara.get();
    const hitung = {};
    suaraSnap.forEach((d) => {
      const kid = d.data().kandidatId;
      hitung[kid] = (hitung[kid] || 0) + 1;
    });

    const tbody = document.getElementById("tbodyKandidat");
    tbody.innerHTML = "";
    snap.forEach((doc) => {
      const k = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${k.fotoUrl ? `<img src="${k.fotoUrl}" alt="">` : ""}</td>
        <td>${k.nomorUrut}</td>
        <td>${k.namaKetua} &amp; ${k.namaWakil}</td>
        <td>${hitung[doc.id] || 0}</td>
        <td>
          <div class="aksi-kecil">
            <button class="btn-mini btn-mini--bahaya" data-id="${doc.id}">Hapus</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-mini--bahaya").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        if (!confirm("Hapus kandidat ini? Suara yang sudah masuk untuknya tidak ikut terhapus.")) return;
        await refKandidat.doc(id).delete();
        tampilkanToast("Kandidat dihapus.");
      });
    });
  });
}

// ---------- Pengaturan pemilihan ----------

async function muatPengaturan() {
  const status = await ambilStatusPemilihan();
  document.getElementById("toggleBuka").checked = !!status.dibuka;
}

document.getElementById("toggleBuka").addEventListener("change", async (e) => {
  await refPengaturan.set({ dibuka: e.target.checked }, { merge: true });
  tampilkanToast(e.target.checked ? "Pemilihan dibuka." : "Pemilihan ditutup.");
});

document.getElementById("btnResetSuara").addEventListener("click", async () => {
  if (!confirm("Yakin ingin menghapus SEMUA suara yang sudah masuk? Tindakan ini tidak dapat dibatalkan.")) return;
  if (!confirm("Konfirmasi sekali lagi: semua data suara akan hilang permanen.")) return;

  const snap = await refSuara.get();
  const batch = db.batch();
  snap.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  tampilkanToast("Semua suara telah dihapus.");
});

// ---------- Riwayat suara ----------

function muatRiwayatSuara() {
  refSuara.orderBy("waktu", "desc").onSnapshot((snap) => {
    const tbody = document.getElementById("tbodySuara");
    tbody.innerHTML = "";
    snap.forEach((doc) => {
      const s = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${doc.id}</td>
        <td>${s.nama || "-"}</td>
        <td>${s.kelas || "-"}</td>
        <td>${formatWaktu(s.waktu)}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}
