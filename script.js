// Toggle sidebar
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const sidebarToggle = document.getElementById("sidebarToggle");
const closeSidebar = document.getElementById("closeSidebar");
const collapseSidebar = document.getElementById("collapseSidebar");

// Dark mode
const darkModeToggle = document.getElementById("darkModeToggle");

// Search + table
const searchInput = document.getElementById("searchInput");
const table = document.getElementById("transactionTable");
const headers = table.querySelectorAll("th");

// Sidebar buka/tutup
sidebarToggle.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

closeSidebar.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

// Collapse sidebar (desktop)
collapseSidebar.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  document.body.classList.toggle("sidebar-collapsed");
  document.querySelector(".navbar").classList.toggle("sidebar-collapsed");
  localStorage.setItem("sidebarCollapsed", sidebar.classList.contains("collapsed"));
});

// Restore state
if (localStorage.getItem("sidebarCollapsed") === "true") {
  sidebar.classList.add("collapsed");
  document.body.classList.add("sidebar-collapsed");
  document.querySelector(".navbar").classList.add("sidebar-collapsed");
}

// Apply saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  darkModeToggle.textContent = "☀️";
}

// Toggle
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  darkModeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Search filter
searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();
  const rows = table.querySelectorAll("tbody tr");
  
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
});

// Sorting
headers.forEach(th => {
  th.addEventListener("click", () => {
    const colIndex = Number(th.getAttribute("data-col"));
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);

    // --- TENTUKAN ARAH BARU SEBELUM RESET KELAS ---
    const wasAsc  = th.classList.contains("asc");
    const wasDesc = th.classList.contains("desc");
    const nextDir = wasAsc ? "desc" : wasDesc ? "asc" : "asc"; // default pertama ASC

    // Reset panah di semua header
    headers.forEach(h => {
      h.classList.remove("asc", "desc");
      h.removeAttribute("aria-sort");
    });

    // Set panah & aria-sort di header aktif
    th.classList.add(nextDir);
    th.setAttribute("aria-sort", nextDir === "asc" ? "ascending" : "descending");

    // Helper ambil nilai sesuai kolom
    const getVal = (row) => {
      let txt = row.cells[colIndex].innerText.trim();

      if (colIndex === 0) {
        // Waktu: "YYYY-MM-DD HH:mm" -> jadikan ISO agar konsisten
        return new Date(txt.replace(" ", "T"));
      }
      if (colIndex === 2) {
        // USD: angka polos
        const num = parseFloat(txt.replace(/[^\d.-]/g, ""));
        return isNaN(num) ? -Infinity : num;
      }
      if (colIndex === 3) {
        // IDR: "Rp 1.200.000" -> 1200000
        const num = parseInt(txt.replace(/[^\d]/g, ""), 10);
        return isNaN(num) ? -Infinity : num;
      }
      // Nama: string
      return txt.toLowerCase();
    };

    // Sort
    rows.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      let cmp;

      if (va instanceof Date && vb instanceof Date) {
        cmp = va - vb;
      } else if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), "id", { numeric: true, sensitivity: "base" });
      }

      return nextDir === "asc" ? cmp : -cmp;
    });

    // Re-attach rows
    rows.forEach(r => tbody.appendChild(r));

    // Hapus highlight lama
    headers.forEach(h => h.classList.remove("sorted"));
    table.querySelectorAll("td").forEach(td => td.classList.remove("sorted"));

    // Tambah highlight ke header & kolom aktif
    th.classList.add("sorted");
    rows.forEach(r => r.cells[colIndex].classList.add("sorted"));

  });
});

// Pastikan semua baris muncul saat load pertama
document.querySelectorAll(".history tbody tr").forEach(tr => tr.classList.add("show"));

// ==========================
// SEARCH + PAGINATION
// ==========================
let ROWS_PER_PAGE = 50; // default
let currentPage = 1;
let filteredRows = []; // hasil filter aktif

function getAllRows() {
  return Array.from(table.querySelectorAll("tbody tr"));
}

function applySearchFilter() {
  const filter = searchInput.value.toLowerCase();
  const allRows = getAllRows();

  filteredRows = allRows.filter(row =>
    row.innerText.toLowerCase().includes(filter)
  );

  currentPage = 1; // reset ke halaman 1
  renderTablePage(currentPage);
}

searchInput.addEventListener("input", applySearchFilter);

// Render tabel sesuai pagination + filter
function renderTablePage(page = 1) {
  const rows = getAllRows();
  const rowsToShow = filteredRows.length > 0 || searchInput.value
    ? filteredRows
    : rows;

  const totalRows = rowsToShow.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);

  // Sembunyikan semua dulu
  rows.forEach(r => (r.style.display = "none"));

  // Tampilkan hanya baris sesuai halaman
  rowsToShow.forEach((row, index) => {
    row.style.display =
      index >= (page - 1) * ROWS_PER_PAGE && index < page * ROWS_PER_PAGE
        ? ""
        : "none";
  });

  renderPagination(totalPages, page, totalRows);
}

function renderPagination(totalPages, activePage, totalRows) {
  let pagination = document.getElementById("pagination");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    pagination.classList.add("pagination");
    table.parentNode.appendChild(pagination);
  }

  pagination.innerHTML = "";

  // Dropdown jumlah entri
  let dropdown = document.getElementById("rows-per-page");
  if (!dropdown) {
    dropdown = document.createElement("select");
    dropdown.id = "rows-per-page";
    dropdown.classList.add("rows-dropdown");

    [10, 25, 50, 100].forEach(num => {
      const opt = document.createElement("option");
      opt.value = num;
      opt.textContent = `${num} entri`;
      if (num === ROWS_PER_PAGE) opt.selected = true;
      dropdown.appendChild(opt);
    });

    dropdown.addEventListener("change", () => {
      ROWS_PER_PAGE = parseInt(dropdown.value);
      currentPage = 1;
      renderTablePage(currentPage);
    });

    pagination.appendChild(dropdown);
  }

  // Tombol Prev
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "⬅️ Prev";
  prevBtn.classList.add("page-btn");
  prevBtn.disabled = activePage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTablePage(currentPage);
    }
  });
  pagination.appendChild(prevBtn);

  // Tombol nomor halaman
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.add("page-btn");
    if (i === activePage) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentPage = i;
      renderTablePage(i);
    });

    pagination.appendChild(btn);
  }

  // Tombol Next
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next ➡️";
  nextBtn.classList.add("page-btn");
  nextBtn.disabled = activePage === totalPages || totalPages === 0;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTablePage(currentPage);
    }
  });
  pagination.appendChild(nextBtn);

  // Info jumlah data
  let info = document.getElementById("pagination-info");
  if (!info) {
    info = document.createElement("div");
    info.id = "pagination-info";
    info.classList.add("pagination-info");
    table.parentNode.appendChild(info);
  }

  if (totalRows > 0) {
    const start = (activePage - 1) * ROWS_PER_PAGE + 1;
    const end = Math.min(activePage * ROWS_PER_PAGE, totalRows);
    info.textContent = `Menampilkan ${start}–${end} dari ${totalRows} entri`;
  } else {
    info.textContent = "Tidak ada data yang cocok";
  }
}

// Jalankan saat halaman pertama kali dibuka
applySearchFilter();

const CONVERT_RATE = 12000;
const waNumber = "6285846005280";
let realtimeRateConvert = null;

// ===== KURS REAL-TIME =====
async function showConvertRealtimeRate() {
  const infoEl = document.getElementById("convert-info");

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();

    if (!data.rates || !data.rates.IDR) throw new Error("Data tidak valid");

    realtimeRateConvert = data.rates.IDR;
    if (infoEl) {
      infoEl.style.color = "green";
      infoEl.textContent = `Kurs Real-Time (info): Rp ${realtimeRateConvert.toLocaleString("id-ID")} / USD`;
    }
  } catch (err) {
    console.error("Gagal ambil kurs:", err);
    realtimeRateConvert = null;
    if (infoEl) {
      infoEl.style.color = "red";
      infoEl.textContent = "Kurs Real-Time (info): gagal memuat ❌";
    }
  }
}

window.addEventListener("load", () => {
  const infoEl = document.getElementById("convert-info");
  if (infoEl) {
    infoEl.style.color = "orange";
    infoEl.textContent = "Kurs Real-Time (info): Memuat...";
  }
  showConvertRealtimeRate();
  setInterval(showConvertRealtimeRate, 300000); // update tiap 5 menit
});

// ===== HITUNG OTOMATIS KURS TETAP =====
document.getElementById("convUsd").addEventListener("input", () => {
  const usd = parseFloat(document.getElementById("convUsd").value) || 0;
  document.getElementById("convIdr").value =
    "Rp " + (usd * CONVERT_RATE).toLocaleString("id-ID");
});

// ===== TOAST =====
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ===== VALIDASI REAL-TIME =====
const nameInput = document.getElementById("convName");
const emailInput = document.getElementById("convEmail");
const accountInput = document.getElementById("convAccount");
const usdInput = document.getElementById("convUsd");

nameInput.addEventListener("input", () => {
  if (nameInput.value.trim().length < 3) {
    nameInput.style.borderColor = "red";
  } else {
    nameInput.style.borderColor = "#2563eb";
  }
});

emailInput.addEventListener("input", () => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(emailInput.value)) {
    emailInput.style.borderColor = "red";
  } else {
    emailInput.style.borderColor = "#2563eb";
  }
});

accountInput.addEventListener("input", () => {
  if (accountInput.value.trim() === "") {
    accountInput.style.borderColor = "red";
  } else {
    accountInput.style.borderColor = "#2563eb";
  }
});

usdInput.addEventListener("input", () => {
  if (parseFloat(usdInput.value) < 1) {
    usdInput.style.borderColor = "red";
  } else {
    usdInput.style.borderColor = "#2563eb";
  }
});

// ===== POPUP KATEGORI =====
const selectedOption = document.getElementById("selectedOption");
const popup = document.getElementById("categoryPopup");
const closePopup = document.getElementById("closePopup");
const bankList = document.getElementById("bankList");
const ewalletList = document.getElementById("ewalletList");

selectedOption.addEventListener("click", () => {
  popup.style.display = "flex"; // tampilkan popup
  bankList.style.display = "none";
  ewalletList.style.display = "none";
});

closePopup.addEventListener("click", () => {
  popup.style.display = "none";
});

// Pilih kategori
document.querySelectorAll(".grid-options button[data-category]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.category === "Bank Lokal") {
      bankList.style.display = "grid";
      ewalletList.style.display = "none";
    } else {
      ewalletList.style.display = "grid";
      bankList.style.display = "none";
    }
  });
});

// Pilih bank atau ewallet
document.querySelectorAll("#bankList button, #ewalletList button").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedOption.value = btn.textContent;
    popup.style.display = "none";
  });
});

// ===== KIRIM FORM =====
document.addEventListener("DOMContentLoaded", () => {
  const convertForm = document.getElementById("convertForm");

  convertForm.addEventListener("submit", function (e) {
    e.preventDefault(); // cegah auto-submit
    console.log("👉 Submit ditekan");

    const convName = document.getElementById("convName");
    const convEmail = document.getElementById("convEmail");
    const selectedOption = document.getElementById("selectedOption");
    const convAccount = document.getElementById("convAccount");
    const convUsd = document.getElementById("convUsd");
    const convIdr = document.getElementById("convIdr");

    // Validasi
    if (!convName.value.trim()) {
      showToast("Nama lengkap wajib diisi.", "warning");
      console.log("❌ Nama kosong");
      return;
    }

    if (!convEmail.value.trim() || !/\S+@\S+\.\S+/.test(convEmail.value)) {
      showToast("Masukkan email PayPal yang valid.", "warning");
      console.log("❌ Email tidak valid");
      return;
    }

    if (!selectedOption.value.trim()) {
      showToast("Pilih kategori & bank/ewallet dulu.", "warning");
      console.log("❌ Kategori belum dipilih");
      return;
    }

    if (!convAccount.value.trim()) {
      showToast("Nomor rekening / akun e-wallet wajib diisi.", "warning");
      console.log("❌ Rekening kosong");
      return;
    }

    if (!convUsd.value.trim() || isNaN(convUsd.value) || parseFloat(convUsd.value) <= 0) {
      showToast("Nominal USD harus angka lebih dari 0.", "warning");
      console.log("❌ Nominal USD tidak valid");
      return;
    }

    if (!convIdr.value.trim()) {
      showToast("Konversi IDR tidak valid.", "warning");
      console.log("❌ Konversi IDR kosong");
      return;
    }

    // ✅ Semua valid → kirim WA
    const message = `
Convert Saldo PayPal
Nama: ${convName.value}
Email PayPal: ${convEmail.value}
Kategori: ${selectedOption.value}
No Rekening/E-Wallet: ${convAccount.value}
Nominal USD: ${convUsd.value}
Nominal IDR: ${convIdr.value}
    `.trim();

    console.log("✅ Semua valid, kirim ke WA");
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");
  });
});

const TOPUP_RATE = 17000;
const waNumber = "6285846005280";
let realtimeRateTopup = null;

// ===== REAL-TIME RATE =====
async function showTopupRealtimeRate() {
  const infoEl = document.getElementById("topup-info");
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (!data.rates || !data.rates.IDR) throw new Error("Data tidak valid");

    realtimeRateTopup = data.rates.IDR;
    infoEl.style.color = "green";
    infoEl.textContent = `Kurs Real-Time (info): Rp ${realtimeRateTopup.toLocaleString("id-ID")} / USD`;
  } catch (err) {
    console.error("Gagal ambil kurs:", err);
    realtimeRateTopup = null;
    infoEl.style.color = "red";
    infoEl.textContent = "Kurs Real-Time (info): gagal memuat ❌";
  }
}
window.addEventListener("load", () => {
  const infoEl = document.getElementById("topup-info");
  infoEl.style.color = "orange";
  infoEl.textContent = "Kurs Real-Time (info): Memuat...";
  showTopupRealtimeRate();
  setInterval(showTopupRealtimeRate, 300000);
});

// ===== OTOMATIS KONVERSI =====
document.getElementById("topUsd").addEventListener("input", () => {
  const usd = parseFloat(document.getElementById("topUsd").value) || 0;
  document.getElementById("topIdr").value =
    "Rp " + (usd * TOPUP_RATE).toLocaleString("id-ID");
});

// ===== TOAST =====
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ===== VALIDASI REAL-TIME =====
const nameInput = document.getElementById("topName");
const emailInput = document.getElementById("topEmail");
const accountInput = document.getElementById("topAccount");
const usdInput = document.getElementById("topUsd");

nameInput.addEventListener("input", () => {
  nameInput.style.borderColor = nameInput.value.trim().length < 3 ? "red" : "#2563eb";
});
emailInput.addEventListener("input", () => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailInput.style.borderColor = !regex.test(emailInput.value) ? "red" : "#2563eb";
});
accountInput.addEventListener("input", () => {
  accountInput.style.borderColor = accountInput.value.trim() === "" ? "red" : "#2563eb";
});
usdInput.addEventListener("input", () => {
  usdInput.style.borderColor = parseFloat(usdInput.value) < 1 ? "red" : "#2563eb";
});

// ===== SUBMIT FORM =====
document.addEventListener("DOMContentLoaded", () => {
  const topupForm = document.getElementById("topupForm");

  topupForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const topName = document.getElementById("topName");
    const topEmail = document.getElementById("topEmail");
    const topSelectedOption = document.getElementById("topSelectedOption");
    const topAccount = document.getElementById("topAccount");
    const topUsd = document.getElementById("topUsd");
    const topIdr = document.getElementById("topIdr");

    if (!topName.value.trim()) return showToast("Nama lengkap wajib diisi.", "warning");
    if (!topEmail.value.trim() || !/\S+@\S+\.\S+/.test(topEmail.value)) return showToast("Masukkan email PayPal yang valid.", "warning");
    if (!topSelectedOption.value.trim()) return showToast("Pilih kategori & bank/ewallet dulu.", "warning");
    if (!topAccount.value.trim()) return showToast("Nomor rekening / akun e-wallet wajib diisi.", "warning");
    if (!topUsd.value.trim() || isNaN(topUsd.value) || parseFloat(topUsd.value) <= 0) return showToast("Nominal USD harus lebih dari 0.", "warning");
    if (!topIdr.value.trim()) return showToast("Konversi IDR tidak valid.", "warning");

    const message = `
Topup Saldo PayPal
Nama: ${topName.value}
Email PayPal: ${topEmail.value}
Kategori: ${topSelectedOption.value}
No Rekening/E-Wallet: ${topAccount.value}
Nominal USD: ${topUsd.value}
Nominal IDR: ${topIdr.value}
    `.trim();

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");
  });
});

// ===== POPUP KATEGORI =====
const selectedOption = document.getElementById("topSelectedOption");
const popup = document.getElementById("topupCategoryPopup");
const closePopup = document.getElementById("topupClosePopup");
const bankList = document.getElementById("topupBankList");
const ewalletList = document.getElementById("topupEwalletList");

selectedOption.addEventListener("click", () => {
  popup.style.display = "flex";
  bankList.style.display = "none";
  ewalletList.style.display = "none";
});
closePopup.addEventListener("click", () => {
  popup.style.display = "none";
});
document.querySelectorAll(".grid-options button[data-category]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.category === "Bank Lokal") {
      bankList.style.display = "grid";
      ewalletList.style.display = "none";
    } else {
      ewalletList.style.display = "grid";
      bankList.style.display = "none";
    }
  });
});
document.querySelectorAll("#topupBankList button, #topupEwalletList button").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedOption.value = btn.textContent;
    popup.style.display = "none";
  });
});

