"use strict";
// Testmodus: ?datum=2026-12-05 simuliert ein anderes Datum, ?alle=1 öffnet alle Türchen.
const params = new URLSearchParams(location.search);
const store = (() => { try { return localStorage; } catch { return null; } })();
const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  // crypto.subtle gibt es nur über https und localhost. Beim Testen im WLAN (http://192.168...) rechnet der Ersatz unten.
  if (!globalThis.crypto?.subtle) return sha256Fallback(data);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sha256Fallback(data) {
  const K = [], H = [];
  const frac = (x) => ((x - Math.floor(x)) * 4294967296) >>> 0;
  for (let n = 2; K.length < 64; n++) {
    let prime = true;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) { prime = false; break; }
    if (!prime) continue;
    if (H.length < 8) H.push(frac(Math.sqrt(n)));
    K.push(frac(Math.cbrt(n)));
  }
  const len = data.length, total = ((len + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(total); m.set(data); m[len] = 0x80;
  const dv = new DataView(m.buffer);
  dv.setUint32(total - 8, Math.floor(len / 536870912)); dv.setUint32(total - 4, (len << 3) >>> 0);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n)), w = new Uint32Array(64);
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) >>> 0; });
  }
  return H.map((v) => v.toString(16).padStart(8, "0")).join("");
}

function load(key, fallback) { try { return JSON.parse(store?.getItem(key) ?? "null") ?? fallback; } catch { return fallback; } }
function save(key, val) { try { store?.setItem(key, JSON.stringify(val)); } catch {} }

// ?datum=2026-12-05 als Ortszeit lesen (new Date("2026-12-05") wäre UTC und damit westlich von Europa einen Tag zu früh)
function today() {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(params.get("datum") || "");
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null;
  return d && !isNaN(d) ? d : new Date();
}
const dayKey = () => { const d = today(); return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate(); };

function isUnlocked(n, cfg) {
  if (params.get("alle")) return true;
  const now = today();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  if (y !== cfg.year) return y > cfg.year;
  if (m !== cfg.month) return m > cfg.month;
  return d >= n;
}

function isToday(n, cfg) {
  const now = today();
  return now.getFullYear() === cfg.year && now.getMonth() + 1 === cfg.month && now.getDate() === n;
}

/* ---------- kleine Effekte ---------- */
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

// Klasse kurz setzen, damit eine CSS-Animation neu startet
function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

// Schreibmaschine mit natürlichen Pausen an Satzzeichen. Antippen zeigt sofort alles.
function typeWriter(el, text) {
  const finish = () => { el.textContent = text; el.classList.add("done"); };
  if (reduceMotion) return finish();
  let i = 0, stop = false;
  el.addEventListener("click", () => { stop = true; finish(); }, { once: true });
  const tick = () => {
    if (stop) return;
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) return finish();
    const c = text[i - 1];
    setTimeout(tick, ".!?".includes(c) ? 280 : c === "," ? 110 : 14 + Math.random() * 14);
  };
  setTimeout(tick, 500);
}

// Zahl hochzählen (für die XP-Anzeige)
function countTo(el, to, suffix) {
  const from = parseInt(el.textContent, 10) || 0;
  if (reduceMotion || from === to) { el.textContent = to + suffix; return; }
  const t0 = performance.now(), dur = 700;
  let done = false;
  const step = (now) => {
    if (done) return;
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  setTimeout(() => { done = true; el.textContent = to + suffix; }, dur + 300); // falls der Browser Animationen drosselt
}

/* ---------- Zeichenflächen: scharf auf jedem Display ---------- */
function fitCanvas(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  cv.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ---------- Konfetti: Papierschnipsel mit Schwerkraft, Luftwiderstand und Flattern ---------- */
const canvas = $("confetti"), ctx = canvas.getContext("2d");
let parts = [], raf = 0, lastT = 0, confettiTimer;
addEventListener("resize", () => fitCanvas(canvas)); fitCanvas(canvas);
function confetti(amount = 120, from = null) {
  if (reduceMotion) return;
  const cs = getComputedStyle(document.documentElement);
  const colors = ["--gold", "--red", "--slime", "--blue", "--paper"].map((v) => cs.getPropertyValue(v).trim());
  const ox = from ? from.x : innerWidth / 2, oy = from ? from.y : innerHeight / 3;
  for (let i = 0; i < amount; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95, v = 320 + Math.random() * 620;
    parts.push({
      x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      w: 6 + Math.random() * 7, h: 4 + Math.random() * 5, c: colors[i % colors.length],
      rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 14, ph: Math.random() * 6.3,
      round: i % 5 === 0, t: 0, life: 1.7 + Math.random() * 1.3,
    });
  }
  if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(confettiLoop); }
  clearTimeout(confettiTimer); // Sicherheitsnetz, falls der Browser Animationen drosselt
  confettiTimer = setTimeout(() => { parts = []; ctx.clearRect(0, 0, innerWidth, innerHeight); }, 5000);
}
function confettiLoop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.t < p.life && p.y < innerHeight + 40);
  for (const p of parts) {
    p.t += dt;
    p.vy += 1150 * dt; p.vx *= 1 - 1.8 * dt; p.vy *= 1 - 0.9 * dt;
    p.x += p.vx * dt + Math.sin(p.ph + p.t * 6) * 0.6; p.y += p.vy * dt; p.rot += p.vr * dt;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, (p.life - p.t) / 0.4));
    ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.ph + p.t * 9)); // Flattern
    ctx.fillStyle = p.c;
    if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h * 0.7, 0, 6.3); ctx.fill(); }
    else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  raf = parts.length ? requestAnimationFrame(confettiLoop) : 0;
}

/* ---------- Schnee in drei Tiefen: nahe Flocken sind größer, schneller und heller ---------- */
const snowCv = $("snow"), sctx = snowCv.getContext("2d");
let flakes = [], snowT = 0, snowW = 0;
function makeSnow() {
  fitCanvas(snowCv);
  // Am Handy feuert "resize" bei jedem Ein- und Ausblenden der Adressleiste. Dann nur die Fläche anpassen, die Flocken bleiben.
  if (flakes.length && innerWidth === snowW) return;
  snowW = innerWidth;
  const count = Math.round(Math.min(70, innerWidth / 16));
  flakes = Array.from({ length: count }, () => {
    const z = Math.random(); // 0 = weit weg, 1 = nah
    return { x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 0.8 + z * 2.2, v: 14 + z * 38, a: 0.12 + z * 0.4, p: Math.random() * 6.3, sway: 6 + z * 14 };
  });
}
function snowLoop(now) {
  const dt = Math.min(0.05, (now - snowT) / 1000); snowT = now;
  sctx.clearRect(0, 0, innerWidth, innerHeight);
  sctx.fillStyle = "#fff";
  for (const f of flakes) {
    f.y += f.v * dt; f.p += dt * 0.8;
    if (f.y > innerHeight + 6) { f.y = -6; f.x = Math.random() * innerWidth; }
    sctx.globalAlpha = f.a;
    sctx.beginPath(); sctx.arc(f.x + Math.sin(f.p) * f.sway, f.y, f.r, 0, 6.3); sctx.fill();
  }
  requestAnimationFrame(snowLoop);
}
if (!reduceMotion) {
  makeSnow(); addEventListener("resize", makeSnow);
  snowT = performance.now(); requestAnimationFrame(snowLoop);
}

/* ---------- Modus: Handy (alles eingebaut) oder PC (echte Browser-Werkzeuge) ---------- */
const PC_ONLY_TOOLS = new Set(["source", "file", "cookie", "run", "robots", "urlparam"]); // am PC macht man das mit F12
let mode = "mobile";
function detectMode() { return matchMedia("(pointer: coarse)").matches || innerWidth < 820 ? "mobile" : "pc"; }
function applyMode(name, remember = false) {
  mode = name === "pc" ? "pc" : "mobile";
  document.documentElement.dataset.mode = mode;
  document.querySelectorAll(".modes button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  if (remember) save("mode", mode); // nur die eigene Wahl merken, nicht die automatische Erkennung
}
let forceTools = false; // PC-Modus: Werkzeug trotzdem einblenden, wenn F12 nicht klappt
function toolsFor(d) {
  const list = d?.tools || [];
  return mode === "pc" && !forceTools ? list.filter((t) => !PC_ONLY_TOOLS.has(t)) : list;
}
const hiddenTools = (d) => mode === "pc" && !forceTools && (d?.tools || []).some((t) => PC_ONLY_TOOLS.has(t));
document.querySelectorAll(".modes button").forEach((b) => (b.onclick = () => { applyMode(b.dataset.mode, true); toast(mode === "pc" ? "PC-Modus: Du nutzt die echten Browser-Werkzeuge (F12)." : "Handy-Modus: Alle Werkzeuge sind eingebaut."); }));
applyMode(params.get("modus") || load("mode", null) || detectMode());

/* ---------- Werkzeugkasten (läuft auf jedem Gerät) ---------- */
const MORSE = { ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z", "-----": "0", ".----": "1", "..---": "2", "...--": "3", "....-": "4", ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9" };
const hexBytes = (s) => (s.replace(/0x/gi, "").replace(/[^0-9a-f]/gi, "").match(/../g) || []).map((h) => parseInt(h, 16));
// Handys machen aus "--" gern einen langen Strich und aus "..." ein Auslassungszeichen
const morseClean = (s) => s.replace(/…/g, "...").replace(/—/g, "--").replace(/[–−_]/g, "-").replace(/[·•]/g, ".");
const T = {
  caesar: { title: "Caesar-Dreher", ic: "lock", hint: "Gib den Text ein und um wie viele Stellen er zurückgeschoben werden soll.",
    fields: [{ k: "text", l: "Text", v: "" }, { k: "n", l: "Zurückschieben um", v: "3", t: "number" }],
    run: (v) => v.text.toUpperCase().replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 - (+v.n || 0)) % 26 + 26) % 26 + 65)) },
  base64: { title: "Base64-Decoder", ic: "hash", hint: "Füge den Base64-Text ein.", fields: [{ k: "text", l: "Base64-Text", v: "" }],
    run: (v) => { try { return new TextDecoder().decode(Uint8Array.from(atob(v.text.trim()), (c) => c.charCodeAt(0))); } catch { return v.text.trim() ? "Das ist kein gültiges Base64." : ""; } } },
  hex: { title: "Hex-Decoder", ic: "grid", hint: "Füge die Hex-Zahlen ein (mit oder ohne Leerzeichen).", fields: [{ k: "text", l: "Hex-Zahlen", v: "" }],
    run: (v) => hexBytes(v.text).map((b) => String.fromCharCode(b)).join("") },
  binary: { title: "Binär-Decoder", ic: "binary", hint: "Füge die Nullen und Einsen ein.", fields: [{ k: "text", l: "Binärzahlen", v: "" }],
    run: (v) => (v.text.replace(/[^01]/g, "").match(/.{8}/g) || []).map((b) => String.fromCharCode(parseInt(b, 2))).join("") },
  morse: { title: "Morse-Decoder", ic: "radio", hint: "Füge Punkte und Striche ein, Buchstaben durch Leerzeichen getrennt.", fields: [{ k: "text", l: "Morsecode", v: "" }],
    run: (v) => morseClean(v.text).trim().split(/\s+/).filter(Boolean).map((m) => (m === "/" ? " " : MORSE[m] || "?")).join("") },
  xor: { title: "XOR-Rechner", ic: "xor", hint: "Füge die Hex-Zahlen ein und den Schlüssel.", fields: [{ k: "text", l: "Hex-Zahlen", v: "" }, { k: "key", l: "Schlüssel", v: "42", t: "number" }],
    run: (v) => hexBytes(v.text).map((b) => String.fromCharCode(b ^ (+v.key & 255))).join("") },
  vigenere: { title: "Vigenère-Decoder", ic: "key", hint: "Gib den Text und das Schlüsselwort ein.", fields: [{ k: "text", l: "Text", v: "" }, { k: "key", l: "Schlüsselwort", v: "" }],
    run: (v) => { const k = v.key.toUpperCase().replace(/[^A-Z]/g, ""); if (!k) return ""; let i = 0;
      return v.text.toUpperCase().replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 - (k.charCodeAt(i++ % k.length) - 65)) % 26 + 26) % 26 + 65)); } },
  source: { title: "Quelltext-Ansicht", ic: "code", hint: "So sieht der Computer diese Karte, wenn du F12 drückst.", fields: [], button: "Quelltext anzeigen", copy: true,
    run: (v, d) => d.task },
  file: { title: "Datei als Text lesen", ic: "scroll", hint: "Zeigt dir den Inhalt der Datei aus der Aufgabe als Text.", fields: [], button: "Datei als Text öffnen", copy: true,
    run: async () => { const r = await fetch("files/bild-tuer7.svg"); if (!r.ok) throw new Error(r.status); return r.text(); } },
  run: { title: "Programm ausführen", ic: "terminal", hint: "Führt das Programm aus der Aufgabe für dich aus.", fields: [], button: "Ausführen", copy: true,
    run: (v, d) => { const m = d.task.match(/\[([\d,\s]+)\]/); return m ? m[1].split(",").map((n) => String.fromCharCode(+n + 1)).join("") : "Fehler"; } },
  robots: { title: "robots.txt öffnen", ic: "ban", hint: "Öffnet die Datei robots.txt dieser Seite in einem neuen Tab. Dort steht ein Dateiname, den du dann selbst aufrufst.", fields: [{ k: "f", l: "Dateiname (leer = robots.txt)", v: "" }], button: "Datei öffnen",
    run: (v) => { const name = (v.f.trim() || "robots.txt").replace(/^\/+/, ""); if (/[^\w.\-]/.test(name)) return "Das ist kein gültiger Dateiname."; window.open(name, "_blank", "noopener"); return "Geöffnet: " + name; } },
  urlparam: { title: "Adress-Änderer", ic: "link", hint: "Das ist die Adresse aus der Aufgabe. Ändere den Wert hinter rolle= und öffne die Seite.", fields: [{ k: "r", l: "rolle =", v: "gast" }], button: "Seite öffnen",
    run: (v) => { const r = v.r.trim().toLowerCase(); if (/[^\w\-]/.test(r)) return "Nur Buchstaben und Zahlen bitte."; window.open("tuer10.html?rolle=" + r, "_blank", "noopener"); return "Geöffnet: tuer10.html?rolle=" + r; } },
  cookie: { title: "Cookie-Editor", ic: "cookie", hint: "Hier kannst du den Cookie „rolle“ ändern. Öffne danach die Seite aus der Aufgabe.", fields: [{ k: "v", l: "Wert von rolle", v: "" }], button: "Cookie speichern",
    run: (v) => { try { const val = v.v.trim().toLowerCase(); if (!val) return "Schreib erst einen Wert ins Feld."; if (/[^\w\-]/.test(val)) return "Nur Buchstaben und Zahlen bitte."; document.cookie = "rolle=" + val + "; path=/; SameSite=Lax"; return "Gespeichert: rolle=" + val + ". Öffne jetzt den VIP-Bereich aus der Aufgabe noch einmal."; } catch { return "Cookies sind hier gesperrt."; } } },
};

function buildTools(d, box) {
  box.replaceChildren();
  for (const id of toolsFor(d)) {
    const t = T[id];
    const fill = (d.fill || [])[(d.tools || []).indexOf(id)] || "";
    const wrap = document.createElement("div");
    wrap.className = "tool";
    wrap.innerHTML = `<h3>${icon(t.ic)}${t.title}</h3><p class="tool-hint">${t.hint}</p>`;
    const inputs = {};
    for (const f of t.fields) {
      const lab = document.createElement("label");
      lab.textContent = f.l;
      const inp = document.createElement("input");
      inp.type = f.t || "text"; inp.value = f.k === "text" && fill ? fill : f.v; inp.spellcheck = false; inp.autocomplete = "off";
      inp.setAttribute("autocapitalize", "off"); inp.setAttribute("autocorrect", "off");
      if (f.t === "number") inp.inputMode = "numeric";
      if (f.k === "text") inp.placeholder = "Hier einfügen ...";
      inputs[f.k] = inp; lab.append(inp); wrap.append(lab);
    }
    const out = document.createElement("pre");
    out.className = "tool-out"; out.textContent = "…";
    const values = () => Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value]));
    const go = async () => {
      try { out.textContent = (await t.run(values(), d)) || "…"; }
      catch { out.textContent = "Das hat nicht geklappt. Prüfe deine Internetverbindung und versuch es nochmal."; }
    };
    if (t.button) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn small"; b.textContent = t.button; b.onclick = go;
      wrap.append(b);
    } else {
      Object.values(inputs).forEach((el) => el.addEventListener("input", go));
      if (fill) go();
    }
    wrap.append(out);
    if (!t.button || t.copy) {
      const cp = document.createElement("button");
      cp.type = "button"; cp.className = "copy"; cp.innerHTML = icon("copy") + "Ergebnis kopieren";
      cp.onclick = async () => { try { await navigator.clipboard.writeText(out.textContent); toast("Kopiert!"); } catch { toast("Kopieren geht hier nicht. Tipp es einfach ab."); } };
      wrap.append(cp);
    }
    box.append(wrap);
  }
}

/* ---------- App ---------- */
(async () => {
  const getJson = async (url) => { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) throw new Error(url + " " + r.status); return r.json(); };
  let cfg, doors;
  try { [cfg, doors] = await Promise.all([getJson("config.json"), getJson("doors.json")]); }
  catch (err) {
    console.error(err);
    const p = document.createElement("p");
    p.className = "load-error";
    p.textContent = "Die Türchen konnten nicht geladen werden. Prüfe deine Internetverbindung und lade die Seite neu.";
    $("grid").replaceWith(p);
    return;
  }
  const byNr = new Map(doors.map((d) => [d.door, d]));
  // Gespeicherten Fortschritt prüfen: nur echte Türchen-Nummern zählen, kaputte Daten werden ignoriert
  const saved = load("solved", []);
  let solved = new Set((Array.isArray(saved) ? saved : []).filter((n) => Number.isInteger(n) && byNr.has(n)));
  let current = null, hintStep = 0, firstRender = true, checking = false;

  $("tiktok").href = cfg.tiktok;
  typeWriter($("intro"), cfg.intro);

  const xpOf = (d) => 50 * d.level;
  const totalXp = () => [...solved].reduce((s, n) => s + (byNr.get(n) ? xpOf(byNr.get(n)) : 0), 0);
  const rankFor = (count) => [...cfg.ranks].reverse().find((r) => count >= r.from).name;

  function renderStats() {
    $("rank").textContent = rankFor(solved.size);
    countTo($("xp-text"), totalXp(), " XP");
    const cur = [...cfg.ranks].reverse().find((r) => solved.size >= r.from);
    const next = cfg.ranks.find((r) => r.from > solved.size);
    $("bar-fill").style.width = (next ? ((solved.size - cur.from) / (next.from - cur.from)) * 100 : 100) + "%";
    $("bar").setAttribute("aria-valuenow", solved.size);
    $("next-rank").textContent = next ? `Noch ${next.from - solved.size} Türchen bis ${next.name}` : "Höchster Rang erreicht!";
    $("progress").textContent = `Türchen geknackt: ${solved.size} von 24`;
    const hp = 24 - solved.size;
    $("boss-fill").style.width = (hp / 24) * 100 + "%";
    $("boss-hp").textContent = hp ? `${hp} / 24 HP` : "BESIEGT!";
    $("boss").classList.toggle("ko", hp === 0);
    $("finale").hidden = solved.size < 24;

    const now = today(), cd = $("countdown-text");
    $("countdown").hidden = false;
    if (params.get("alle")) { $("countdown").hidden = true; return; }
    if (now.getFullYear() === cfg.year && now.getMonth() + 1 < cfg.month || now.getFullYear() < cfg.year) {
      const start = new Date(cfg.year, cfg.month - 1, 1);
      const days = Math.ceil((start - now) / 86400000);
      cd.textContent = `Noch ${days} Tag${days === 1 ? "" : "e"} bis Türchen 1!`;
    } else if (now.getFullYear() === cfg.year && now.getMonth() + 1 === cfg.month && now.getDate() < 24) {
      cd.textContent = "Morgen um 0 Uhr geht das nächste Türchen auf!";
    } else {
      $("countdown").hidden = true;
    }
  }

  function renderGrid(justSolved = 0) {
    const grid = $("grid");
    grid.replaceChildren();
    for (let n = 1; n <= 24; n++) {
      const d = byNr.get(n);
      const open = isUnlocked(n, cfg) && !!d;
      const done = solved.has(n);
      const b = document.createElement("button");
      b.className = "door" + (done ? " solved" : "") + (open ? "" : " locked") + (isToday(n, cfg) ? " today" : "") + (n === justSolved ? " just" : "");
      b.style.setProperty("--i", n);
      b.innerHTML = `<span class="n">${n}</span><span class="ic">${icon(open ? d.icon : "lock")}</span><small>${done ? "geknackt" : open ? "+" + xpOf(d) + " XP" : "ab " + n + ". Dez"}</small>` +
        (done ? `<span class="stamp">${icon("check")}</span>` : "") +
        (isToday(n, cfg) && !done ? '<span class="tag">HEUTE</span>' : "");
      b.setAttribute("aria-label", `Türchen ${n}, ${done ? "geknackt" : open ? "offen" : "noch gesperrt"}`);
      b.onclick = () => {
        if (!open) {
          replay(b, "shake");
          toast(`Türchen ${n} ist noch zu. Komm am ${n}. Dezember wieder!`);
          return;
        }
        if ($("dialog").open || grid.querySelector(".opening")) return; // Doppeltipp ignorieren
        if (reduceMotion) return openDoor(d);
        // Türchen schwingt kurz auf, dann erscheint das Rätsel
        b.classList.add("opening");
        setTimeout(() => { openDoor(d); setTimeout(() => b.classList.remove("opening"), 300); }, 190);
      };
      grid.append(b);
    }
    if (firstRender && !reduceMotion) { grid.classList.add("intro"); setTimeout(() => grid.classList.remove("intro"), 1600); }
    firstRender = false;
  }

  function showHint(step) {
    hintStep = Math.max(hintStep, step);
    $("d-hint1").hidden = hintStep < 1;
    $("d-hint2").hidden = hintStep < 2;
    $("btn-hint2").disabled = hintStep < 1;
    $("d-tools").hidden = hintStep < 2 || !toolsFor(current).length;
    $("btn-force").hidden = hintStep < 2 || !hiddenTools(current);
  }
  const setHint = (el, label, text) => { el.replaceChildren(Object.assign(document.createElement("b"), { textContent: label + " " }), text); };

  function openDoor(d) {
    current = d; hintStep = 0; forceTools = false;
    $("d-level").innerHTML = "Level " + [1, 2, 3].map((k) => icon("star", k <= d.level ? "on" : "off")).join("") + `<span>+${xpOf(d)} XP</span>`;
    $("d-icon").innerHTML = icon(d.icon);
    $("d-title").textContent = `Türchen ${d.door}: ${d.title}`;
    $("d-story").textContent = d.story;
    const needsDevtools = (d.tools || []).some((t) => PC_ONLY_TOOLS.has(t));
    $("d-task").innerHTML = d.task + (mode === "mobile" && needsDevtools
      ? '<p class="devnote">Am Handy gibt es kein F12. Tipp 2 schaltet dafür ein eingebautes Werkzeug frei.</p>' : "");
    $("d-task").querySelectorAll("a[target]").forEach((a) => { a.rel = "noopener"; });
    const mob = mode === "mobile";
    setHint($("d-hint1"), "Tipp 1:", (mob && d.hintM) || d.hint);
    setHint($("d-hint2"), "Tipp 2:", (mob && d.hint2M) || d.hint2);
    buildTools(d, $("d-tools"));
    $("btn-hint2-text").textContent = toolsFor(d).length ? "Tipp 2 + Werkzeug" : "Tipp 2";
    showHint(0);
    $("flag").value = "";
    $("result").textContent = ""; $("result").className = "";
    const done = solved.has(d.door);
    $("d-learn").hidden = !done;
    setHint($("d-learn"), "Gelernt:", d.learn);
    $("dialog").showModal();
    $("dialog").scrollTop = 0;
  }

  // Antippen von Code-Schnipseln kopiert sie (praktisch am Handy)
  $("d-task").addEventListener("click", async (e) => {
    const c = e.target.closest("code");
    if (!c) return;
    try { await navigator.clipboard.writeText(c.textContent); toast("Kopiert!"); } catch {}
  });

  $("btn-hint1").onclick = () => showHint(1);
  $("btn-hint2").onclick = () => showHint(2);
  $("btn-force").onclick = () => {
    forceTools = true;
    buildTools(current, $("d-tools"));
    if (current.hint2M) setHint($("d-hint2"), "Tipp 2:", current.hint2M);
    showHint(2);
  };

  $("flag-form").onsubmit = async (e) => {
    e.preventDefault();
    const guess = $("flag").value.trim().toUpperCase();
    if (!guess || !current || checking) return; // "checking" verhindert, dass ein Doppeltipp zweimal prüft
    // Kleine Toleranz: auch nur das Lösungswort ohne CTRL{ } ist ok, Leerzeichen und andere Klammern vom Handy werden bereinigt
    const clean = guess.replace(/[＜｛(\[]/g, "{").replace(/[＞｝)\]]/g, "}");
    const found = clean.match(/CTRL\s*\{[^{}]*\}/); // ganze Ausgabe eingefügt? Dann die Flagge herausfischen
    const inner = (found ? found[0] : clean).replace(/^CTRL\s*\{?/, "").replace(/[{}]/g, "").trim();
    const candidates = new Set([
      inner.replace(/\s+/g, ""),            // Leerzeichen weg
      inner.replace(/[\s,;\-_]+/g, "_"),    // "96 13", "96,13", "HALLO HACKER" -> mit Unterstrich
      inner.replace(/[\s.,']/g, ""),         // "1.000.000" -> 1000000
    ].map((x) => `CTRL{${x}}`));
    let ok = false;
    checking = true;
    try { for (const c of candidates) { if ((await sha256(c)) === current.hash) { ok = true; break; } } }
    finally { checking = false; }
    const form = $("flag-form");
    if (!ok) {
      $("result").textContent = "Noch nicht richtig. Schau nochmal genau hin oder hol dir einen Tipp.";
      $("result").className = "bad";
      replay(form, "shake");
      return;
    }
    const before = rankFor(solved.size);
    const firstTime = !solved.has(current.door);
    $("result").textContent = firstTime ? `Geknackt! +${xpOf(current)} XP` : "Richtig (hattest du schon geknackt).";
    $("result").className = "ok";
    $("d-learn").hidden = false;
    if (firstTime) {
      solved.add(current.door);
      save("solved", [...solved]);
      const r = form.getBoundingClientRect();
      confetti(solved.size === 24 ? 320 : 120, { x: r.left + r.width / 2, y: r.top });
      replay($("boss"), "hit");
      const after = rankFor(solved.size);
      if (after !== before) setTimeout(() => toast(`Neuer Rang: ${after}!`), 900);
    }
    renderGrid(firstTime ? current.door : 0); renderStats();
    if (solved.size === 24) setTimeout(() => $("finale").scrollIntoView({ behavior: "smooth" }), 600);
  };

  $("share").onclick = async () => {
    const text = `Ich habe den ctrl+Derek Hacking-Adventskalender komplett geknackt! 24 von 24 Türchen, Rang: ${rankFor(solved.size)}, ${totalXp()} XP. #hacking #ctrlderek`;
    try { await navigator.clipboard.writeText(text); toast("Kopiert! Poste es auf TikTok."); }
    catch { toast(text); }
  };

  $("reset").onclick = () => {
    if (confirm("Wirklich den ganzen Fortschritt löschen?")) { solved = new Set(); save("solved", []); renderGrid(); renderStats(); }
  };

  renderGrid();
  renderStats();

  // Bleibt die Seite über Mitternacht offen, geht das neue Türchen ohne Neuladen auf
  let shownDay = dayKey();
  const refreshDay = () => { if (dayKey() !== shownDay) { shownDay = dayKey(); renderGrid(); renderStats(); } };
  setInterval(refreshDay, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshDay(); });
})();
