"use strict";
// Türchen 11: Die Seite vertraut einem Cookie, den jeder im eigenen Browser ändern kann.
function getCookie(n) {
  let all = "";
  try { all = document.cookie; } catch { return null; }
  const m = all.match(new RegExp("(?:^|; )" + n + "=([^;]*)"));
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}
if (getCookie("rolle") === null) { try { document.cookie = "rolle=gast; path=/; SameSite=Lax"; } catch {} }
const stored = getCookie("rolle");
const r = (stored || "").trim().toLowerCase();
document.getElementById("t").textContent = stored === null
  ? "Dein Browser blockiert Cookies für diese Seite. Erlaube Cookies (oder verlasse den privaten Modus) und lade die Seite neu."
  : r === "admin"
  ? "ACCESS GRANTED. Willkommen im VIP-Bereich! Deine Flagge: CTRL{COOKIES_SIND_AENDERBAR}"
  : "Du bist als \"" + r + "\" angemeldet. Nur Admins dürfen hier rein. Dein Cookie verrät dich.";
