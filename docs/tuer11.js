"use strict";
// Türchen 11: Die Seite vertraut einem Cookie, den jeder im eigenen Browser ändern kann.
function getCookie(n) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)"));
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}
if (getCookie("rolle") === null) document.cookie = "rolle=gast; path=/; SameSite=Lax";
const r = (getCookie("rolle") || "").trim().toLowerCase();
document.getElementById("t").textContent = r === "admin"
  ? "ACCESS GRANTED. Willkommen im VIP-Bereich! Deine Flagge: CTRL{COOKIES_SIND_AENDERBAR}"
  : "Du bist als \"" + r + "\" angemeldet. Nur Admins dürfen hier rein. Dein Cookie verrät dich.";
