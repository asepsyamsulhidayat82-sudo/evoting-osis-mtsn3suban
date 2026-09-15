// =============================================================
// hasil.js — hasil suara real-time
// =============================================================

document.getElementById("txtSekolah").textContent = KONFIGURASI_PEMILIHAN.namaSekolah;

async function muatStatusHasil() {
  const status = await ambilStatusPemilihan();
  const pill = document.getElementById("pillStatus");
  if (status.dibuka) {
    pill.textContent = "Pemilihan masih berlangsung";
    pill.className = "status-pill status-pill--buka";
  } else {
    pill.textContent = "Pemilihan sudah ditutup";
    pill.className = "status-pill status-pill--tutup";
  }
}
muatStatusHasil();

let daftarKandidatCache = [];
let chartBatang = null;
let chartDonat = null;

const WARNA_GRAFIK = ["#7A1233", "#C9A24B", "#141A2E", "#9B1B41", "#55503f", "#3d5a80"];

refKandidat.orderBy("nomorUrut").onSnapshot((snap) => {
  daftarKandidatCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const adaKandidat = daftarKandidatCache.length > 0;
  document.getElementById("areaKosong").hidden = adaKandidat;
  document.getElementById("areaGrafik").hidden = !adaKandidat;
  document.getElementById("areaRekap").hidden = !adaKandidat;
  renderHasil();
});

refSuara.onSnapshot((snap) => {
  window.__semuaSuara = snap.docs.map((d) => d.data());
  renderHasil();
});

function renderHasil() {
  const semuaSuara = window.__semuaSuara || [];
  const totalSuara = semuaSuara.length;

  // Hitung per kandidat
  const hitung = {};
  daftarKandidatCache.forEach((k) => (hitung[k.id] = 0));
  semuaSuara.forEach((s) => {
    if (hitung[s.kandidatId] !== undefined) hitung[s.kandidatId]++;
  });

  // Ringkasan
  const ringkasan = document.getElementById("ringkasan");
  const totalTerdaftar = KONFIGURASI_PEMILIHAN.totalSiswaTerdaftar;
  const partisipasi = totalTerdaftar ? ((totalSuara / totalTerdaftar) * 100).toFixed(1) + "%" : "-";

  ringkasan.innerHTML = `
    <div class="ringkasan__kartu">
      <div class="ringkasan__angka">${totalSuara}</div>
      <div class="ringkasan__label">Total suara masuk</div>
    </div>
    <div class="ringkasan__kartu">
      <div class="ringkasan__angka">${daftarKandidatCache.length}</div>
      <div class="ringkasan__label">Jumlah kandidat</div>
    </div>
    <div class="ringkasan__kartu">
      <div class="ringkasan__angka">${partisipasi}</div>
      <div class="ringkasan__label">Partisipasi pemilih</div>
    </div>
  `;

  // Batang hasil, diurutkan dari suara terbanyak
  const urut = [...daftarKandidatCache].sort((a, b) => (hitung[b.id] || 0) - (hitung[a.id] || 0));
  const maksimum = Math.max(1, ...Object.values(hitung));

  const area = document.getElementById("areaHasil");
  area.innerHTML = urut.map((k) => {
    const jumlah = hitung[k.id] || 0;
    const persen = totalSuara ? ((jumlah / totalSuara) * 100).toFixed(1) : "0.0";
    const lebar = (jumlah / maksimum) * 100;
    return `
      <div class="hasil-baris">
        <div class="hasil-baris__label">
          <span class="hasil-baris__nama">No. ${k.nomorUrut} — ${k.namaKetua} &amp; ${k.namaWakil}</span>
          <span class="hasil-baris__angka">${jumlah} suara (${persen}%)</span>
        </div>
        <div class="hasil-bar-track">
          <div class="hasil-bar-fill" style="width:${lebar}%"></div>
        </div>
      </div>
    `;
  }).join("");

  renderGrafik(urut, hitung, totalSuara);
  renderRekap(urut, hitung, totalSuara);
}

function renderGrafik(urut, hitung, totalSuara) {
  if (typeof Chart === "undefined" || urut.length === 0) return;

  const label = (k) => `No.${k.nomorUrut} ${k.namaKetua}/${k.namaWakil}`;
  const labels = urut.map(label);
  const data = urut.map((k) => hitung[k.id] || 0);
  const warna = urut.map((_, i) => WARNA_GRAFIK[i % WARNA_GRAFIK.length]);

  const ctxBatang = document.getElementById("chartBatang");
  if (chartBatang) chartBatang.destroy();
  chartBatang = new Chart(ctxBatang, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Jumlah suara",
        data,
        backgroundColor: warna,
        borderRadius: 4,
        maxBarThickness: 56
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Perolehan suara per pasangan calon", font: { size: 13 } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });

  const ctxDonat = document.getElementById("chartDonat");
  if (chartDonat) chartDonat.destroy();
  chartDonat = new Chart(ctxDonat, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: warna, borderWidth: 2, borderColor: "#F3ECDD" }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
        title: { display: true, text: "Proporsi suara", font: { size: 13 } }
      }
    }
  });
}

function renderRekap(urut, hitung, totalSuara) {
  const tbody = document.getElementById("tbodyRekap");
  if (!tbody) return;

  tbody.innerHTML = urut.map((k, idx) => {
    const jumlah = hitung[k.id] || 0;
    const persen = totalSuara ? ((jumlah / totalSuara) * 100).toFixed(1) : "0.0";
    const peringkatKelas = idx === 0 && jumlah > 0 ? "rekap-peringkat rekap-peringkat--juara" : "rekap-peringkat";
    return `
      <tr>
        <td><span class="${peringkatKelas}">${idx + 1}</span></td>
        <td>${k.nomorUrut}</td>
        <td>${k.namaKetua} &amp; ${k.namaWakil}</td>
        <td>${jumlah}</td>
        <td>${persen}%</td>
      </tr>
    `;
  }).join("");

  document.getElementById("rekapTotalSuara").textContent = totalSuara;
  document.getElementById("rekapSubjudul").textContent =
    `${KONFIGURASI_PEMILIHAN.namaPemilihan} — Periode ${KONFIGURASI_PEMILIHAN.tahunPeriode}`;
}

document.getElementById("btnCetakRekap")?.addEventListener("click", () => {
  document.getElementById("rekapWaktuCetak").textContent =
    new Date().toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  window.print();
});
