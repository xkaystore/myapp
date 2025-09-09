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