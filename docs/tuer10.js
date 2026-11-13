"use strict";
// Türchen 10: Die Seite glaubt einfach, was in der Adresse steht. Genau das ist der Fehler.
const rolle = (new URLSearchParams(location.search).get("rolle") || "").trim().toLowerCase();
document.getElementById("t").textContent = rolle === "admin"
  ? "ACCESS GRANTED. Willkommen, Admin! Deine Flagge: CTRL{URL_IST_MANIPULIERBAR}"
  : "Hey " + (rolle || "Unbekannt") + "! Mit der Rolle \"" + (rolle || "unbekannt") + "\" siehst du hier gar nichts. Nur Admins dürfen rein.";
