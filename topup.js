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