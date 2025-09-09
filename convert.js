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