"use strict";
// Testmodus: ?datum=2026-12-05 simuliert ein anderes Datum, ?alle=1 öffnet alle Türchen.
const params = new URLSearchParams(location.search);
const store = (() => { try { return localStorage; } catch { return null; } })();
const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function load(key, fallback) { try { return JSON.parse(store?.getItem(key) ?? "null") ?? fallback; } catch { return fallback; } }
function save(key, val) { try { store?.setItem(key, JSON.stringify(val)); } catch {} }

function today() { return params.get("datum") ? new Date(params.get("datum")) : new Date(); }

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

function typeWriter(el, text) {
  if (reduceMotion) { el.textContent = text; el.classList.add("done"); return; }
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, 18); else el.classList.add("done");
  };
  tick();
}

const canvas = $("confetti");
const ctx = canvas.getContext("2d");
let parts = [], raf = 0;
function fit() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener("resize", fit); fit();
function confetti(amount = 140) {
  if (reduceMotion) return;
  const cs = getComputedStyle(document.documentElement);
  const colors = ["--acc", "--acc2", "--warn", "--cyan"].map((v) => cs.getPropertyValue(v).trim()).concat(["#ffffff"]);
  for (let i = 0; i < amount; i++) {
    parts.push({
      x: innerWidth / 2, y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 3,
      s: 4 + Math.random() * 6, c: colors[i % colors.length], r: Math.random() * 6, life: 110 + Math.random() * 60,
    });
  }
  if (!raf) loop();
}
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.vx *= 0.99; p.r += 0.2; p.life--;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
  }
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* ---------- Leichter Schnee ---------- */
const snowCv = $("snow"), sctx = snowCv.getContext("2d");
let flakes = [], snowOn = false;
function fitSnow() { snowCv.width = innerWidth; snowCv.height = innerHeight; }
addEventListener("resize", fitSnow); fitSnow();
function snowLoop() {
  if (!snowOn) return;
  sctx.clearRect(0, 0, snowCv.width, snowCv.height);
  sctx.fillStyle = "#fff";
  for (const f of flakes) {
    f.y += f.v; f.x += Math.sin((f.y + f.p) / 40) * 0.4;
    if (f.y > snowCv.height + 5) { f.y = -5; f.x = Math.random() * snowCv.width; }
    sctx.globalAlpha = f.a; sctx.beginPath(); sctx.arc(f.x, f.y, f.r, 0, 6.3); sctx.fill();
  }
  requestAnimationFrame(snowLoop);
}
if (!reduceMotion) {
  flakes = Array.from({ length: 45 }, () => ({ x: Math.random() * snowCv.width, y: Math.random() * snowCv.height, r: 1 + Math.random() * 2, v: 0.3 + Math.random() * 0.8, p: Math.random() * 100, a: 0.2 + Math.random() * 0.35 }));
  snowOn = true; snowLoop();
}

/* ---------- Modus: Handy (alles eingebaut) oder PC (echte Browser-Werkzeuge) ---------- */
const PC_ONLY_TOOLS = new Set(["source", "file", "cookie", "run", "robots", "urlparam"]); // am PC macht man das mit F12
let mode = "mobile";
function detectMode() { return matchMedia("(pointer: coarse)").matches || innerWidth < 820 ? "mobile" : "pc"; }
function applyMode(name) {
  mode = name === "pc" ? "pc" : "mobile";
  document.documentElement.dataset.mode = mode;
  document.querySelectorAll(".modes button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  save("mode", mode);
}
function toolsFor(d) {
  const list = d?.tools || [];
  return mode === "pc" ? list.filter((t) => !PC_ONLY_TOOLS.has(t)) : list;
}
document.querySelectorAll(".modes button").forEach((b) => (b.onclick = () => { applyMode(b.dataset.mode); toast(mode === "pc" ? "💻 PC-Modus: echte Browser-Werkzeuge (F12)." : "📱 Handy-Modus: Werkzeuge sind eingebaut."); }));
applyMode(params.get("modus") || load("mode", null) || detectMode());

/* ---------- Werkzeugkasten (läuft auf jedem Gerät) ---------- */
const MORSE = { ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z", "-----": "0", ".----": "1", "..---": "2", "...--": "3", "....-": "4", ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9" };
const hexBytes = (s) => (s.replace(/[^0-9a-f]/gi, "").match(/../g) || []).map((h) => parseInt(h, 16));
const T = {
  caesar: { title: "🔁 Caesar-Dreher", hint: "Gib den Text ein und um wie viele Stellen er zurückgeschoben werden soll.",
    fields: [{ k: "text", l: "Text", v: "" }, { k: "n", l: "Zurückschieben um", v: "3", t: "number" }],
    run: (v) => v.text.toUpperCase().replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 - (+v.n || 0)) % 26 + 26) % 26 + 65)) },
  base64: { title: "🔓 Base64-Decoder", hint: "Füge den Base64-Text ein.", fields: [{ k: "text", l: "Base64-Text", v: "" }],
    run: (v) => { try { return new TextDecoder().decode(Uint8Array.from(atob(v.text.trim()), (c) => c.charCodeAt(0))); } catch { return v.text.trim() ? "❌ Das ist kein gültiges Base64." : ""; } } },
  hex: { title: "🟩 Hex-Decoder", hint: "Füge die Hex-Zahlen ein (mit oder ohne Leerzeichen).", fields: [{ k: "text", l: "Hex-Zahlen", v: "" }],
    run: (v) => hexBytes(v.text).map((b) => String.fromCharCode(b)).join("") },
  binary: { title: "💾 Binär-Decoder", hint: "Füge die Nullen und Einsen ein.", fields: [{ k: "text", l: "Binärzahlen", v: "" }],
    run: (v) => (v.text.replace(/[^01]/g, "").match(/.{8}/g) || []).map((b) => String.fromCharCode(parseInt(b, 2))).join("") },
  morse: { title: "📡 Morse-Decoder", hint: "Füge Punkte und Striche ein, Buchstaben durch Leerzeichen getrennt.", fields: [{ k: "text", l: "Morsecode", v: "" }],
    run: (v) => v.text.trim().split(/\s+/).filter(Boolean).map((m) => MORSE[m] || "?").join("") },
  xor: { title: "✨ XOR-Rechner", hint: "Füge die Hex-Zahlen ein und den Schlüssel.", fields: [{ k: "text", l: "Hex-Zahlen", v: "" }, { k: "key", l: "Schlüssel", v: "42", t: "number" }],
    run: (v) => hexBytes(v.text).map((b) => String.fromCharCode(b ^ (+v.key & 255))).join("") },
  vigenere: { title: "🔑 Vigenère-Decoder", hint: "Gib den Text und das Schlüsselwort ein.", fields: [{ k: "text", l: "Text", v: "" }, { k: "key", l: "Schlüsselwort", v: "" }],
    run: (v) => { const k = v.key.toUpperCase().replace(/[^A-Z]/g, ""); if (!k) return ""; let i = 0;
      return v.text.toUpperCase().replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 - (k.charCodeAt(i++ % k.length) - 65)) % 26 + 26) % 26 + 65)); } },
  source: { title: "👀 Quelltext-Ansicht", hint: "So sieht der Computer diese Karte, wenn du F12 drückst.", fields: [], button: "Quelltext anzeigen",
    run: (v, d) => d.task },
  file: { title: "📄 Datei als Text lesen", hint: "Zeigt dir den Inhalt der Datei aus der Aufgabe als Text.", fields: [], button: "Datei als Text öffnen",
    run: async () => (await fetch("files/bild-tuer7.svg")).text() },
  run: { title: "▶️ Programm ausführen", hint: "Führt das Programm aus der Aufgabe für dich aus.", fields: [], button: "Ausführen",
    run: (v, d) => { const m = d.task.match(/\[([\d,\s]+)\]/); return m ? m[1].split(",").map((n) => String.fromCharCode(+n + 1)).join("") : "❌"; } },
  robots: { title: "🤖 robots.txt öffnen", hint: "Öffnet die Datei robots.txt dieser Seite in einem neuen Tab. Dort steht ein Dateiname, den du dann selbst aufrufst.", fields: [{ k: "f", l: "Dateiname (leer = robots.txt)", v: "" }], button: "Datei öffnen",
    run: (v) => { const name = (v.f.trim() || "robots.txt").replace(/^\/+/, ""); if (/[^\w.\-]/.test(name)) return "❌ Das ist kein gültiger Dateiname."; window.open(name, "_blank", "noopener"); return "Geöffnet: " + name; } },
  urlparam: { title: "🔗 Adress-Änderer", hint: "Das ist die Adresse aus der Aufgabe. Ändere den Wert hinter rolle= und öffne die Seite.", fields: [{ k: "r", l: "rolle =", v: "gast" }], button: "Seite öffnen",
    run: (v) => { const r = v.r.trim(); if (/[^\w\-]/.test(r)) return "❌ Nur Buchstaben und Zahlen bitte."; window.open("tuer10.html?rolle=" + r, "_blank", "noopener"); return "Geöffnet: tuer10.html?rolle=" + r; } },
  cookie: { title: "🍪 Cookie-Editor", hint: "Hier kannst du den Cookie „rolle“ ändern. Öffne danach die Seite aus der Aufgabe.", fields: [{ k: "v", l: "Wert von rolle", v: "" }], button: "Cookie speichern",
    run: (v) => { try { document.cookie = "rolle=" + encodeURIComponent(v.v.trim()) + "; path=/; SameSite=Lax"; return "Gespeichert: rolle=" + v.v.trim() + ". Öffne jetzt die Seite aus der Aufgabe (neu laden)."; } catch { return "❌ Cookies sind hier gesperrt."; } } },
};

function buildTools(d, box) {
  box.replaceChildren();
  for (const id of toolsFor(d)) {
    const t = T[id];
    const wrap = document.createElement("div");
    wrap.className = "tool";
    wrap.innerHTML = `<h3>${t.title}</h3><p class="tool-hint">${t.hint}</p>`;
    const inputs = {};
    for (const f of t.fields) {
      const lab = document.createElement("label");
      lab.textContent = f.l;
      const inp = document.createElement("input");
      inp.type = f.t || "text"; inp.value = f.v; inp.spellcheck = false; inp.autocomplete = "off";
      if (f.k === "text") inp.placeholder = "Hier einfügen ...";
      inputs[f.k] = inp; lab.append(inp); wrap.append(lab);
    }
    const out = document.createElement("pre");
    out.className = "tool-out"; out.textContent = "…";
    const values = () => Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value]));
    const go = async () => { out.textContent = (await t.run(values(), d)) || "…"; };
    if (t.button) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn small"; b.textContent = t.button; b.onclick = go;
      wrap.append(b);
    } else {
      Object.values(inputs).forEach((el) => el.addEventListener("input", go));
    }
    wrap.append(out);
    box.append(wrap);
  }
}

/* ---------- App ---------- */
(async () => {
  const [cfg, doors] = await Promise.all([
    fetch("config.json").then((r) => r.json()),
    fetch("doors.json").then((r) => r.json()),
  ]);
  const byNr = new Map(doors.map((d) => [d.door, d]));
  let solved = new Set(load("solved", []));
  let current = null, hintStep = 0;

  $("tiktok").href = cfg.tiktok;
  typeWriter($("intro"), cfg.intro);

  const xpOf = (d) => 50 * d.level;
  const totalXp = () => [...solved].reduce((s, n) => s + (byNr.get(n) ? xpOf(byNr.get(n)) : 0), 0);
  const rankFor = (count) => [...cfg.ranks].reverse().find((r) => count >= r.from).name;

  function renderStats() {
    $("rank").textContent = rankFor(solved.size);
    $("xp-text").textContent = totalXp() + " XP";
    $("bar-fill").style.width = (solved.size / 24) * 100 + "%";
    $("bar").setAttribute("aria-valuenow", solved.size);
    $("progress").textContent = `Türchen gelöst: ${solved.size} von 24`;
    $("finale").hidden = solved.size < 24;

    const now = today();
    if (params.get("alle")) { $("countdown").textContent = ""; return; }
    if (now.getFullYear() === cfg.year && now.getMonth() + 1 < cfg.month || now.getFullYear() < cfg.year) {
      const start = new Date(cfg.year, cfg.month - 1, 1);
      const days = Math.ceil((start - now) / 86400000);
      $("countdown").textContent = `⏳ Noch ${days} Tag${days === 1 ? "" : "e"} bis Türchen 1!`;
    } else if (now.getFullYear() === cfg.year && now.getMonth() + 1 === cfg.month && now.getDate() < 24) {
      $("countdown").textContent = "🔔 Morgen um 0 Uhr geht das nächste Türchen auf!";
    } else {
      $("countdown").textContent = "";
    }
  }

  function renderGrid() {
    const grid = $("grid");
    grid.replaceChildren();
    for (let n = 1; n <= 24; n++) {
      const d = byNr.get(n);
      const open = isUnlocked(n, cfg) && !!d;
      const b = document.createElement("button");
      b.className = "door" + (solved.has(n) ? " solved" : "") + (open ? "" : " locked") + (isToday(n, cfg) ? " today" : "");
      b.innerHTML = `<span class="n">${n}</span><span class="ic">${open ? d.icon : "🔒"}</span><small>${solved.has(n) ? "geknackt ✓" : open ? "offen" : "gesperrt"}</small>` +
        (isToday(n, cfg) && !solved.has(n) ? '<span class="tag">HEUTE</span>' : "");
      b.onclick = () => {
        if (!open) {
          b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
          toast(`🔒 Türchen ${n} ist noch zu. Komm am ${n}. Dezember wieder!`);
          return;
        }
        openDoor(d);
      };
      grid.append(b);
    }
  }

  function showHint(step) {
    hintStep = Math.max(hintStep, step);
    $("d-hint1").hidden = hintStep < 1;
    $("d-hint2").hidden = hintStep < 2;
    $("btn-hint2").disabled = hintStep < 1;
    $("d-tools").hidden = hintStep < 2 || !toolsFor(current).length;
  }

  function openDoor(d) {
    current = d; hintStep = 0;
    $("d-level").textContent = "Schwierigkeit: " + "★".repeat(d.level) + "  ·  " + xpOf(d) + " XP";
    $("d-title").textContent = `${d.icon} Türchen ${d.door}: ${d.title}`;
    $("d-story").textContent = d.story;
    const needsDevtools = (d.tools || []).some((t) => PC_ONLY_TOOLS.has(t));
    $("d-task").innerHTML = d.task + (mode === "mobile" && needsDevtools
      ? '<p class="devnote">📱 Am Handy gibt es kein F12. Tipp 2 schaltet dafür ein eingebautes Werkzeug frei.</p>' : "");
    $("d-hint1").textContent = "💡 " + d.hint;
    $("d-hint2").textContent = "🆘 " + d.hint2;
    buildTools(d, $("d-tools"));
    $("btn-hint2").textContent = toolsFor(d).length ? "🆘 Tipp 2 + Werkzeug" : "🆘 Tipp 2";
    showHint(0);
    $("flag").value = "";
    $("result").textContent = ""; $("result").className = "";
    const done = solved.has(d.door);
    $("d-learn").hidden = !done;
    $("d-learn").textContent = "🧠 Gelernt: " + d.learn;
    $("dialog").showModal();
  }

  // Antippen von Code-Schnipseln kopiert sie (praktisch am Handy)
  $("d-task").addEventListener("click", async (e) => {
    const c = e.target.closest("code");
    if (!c) return;
    try { await navigator.clipboard.writeText(c.textContent); toast("📋 Kopiert!"); } catch {}
  });

  $("btn-hint1").onclick = () => showHint(1);
  $("btn-hint2").onclick = () => showHint(2);

  $("flag-form").onsubmit = async (e) => {
    e.preventDefault();
    const guess = $("flag").value.trim().toUpperCase();
    if (!guess) return;
    // Kleine Toleranz: auch nur das Lösungswort ohne CTRL{ } ist ok, Leerzeichen und geschweifte Zeichen vom Handy werden bereinigt
    const clean = guess.replace(/[＜｛]/g, "{").replace(/[＞｝]/g, "}").replace(/\s+/g, "");
    const inner = clean.replace(/^CTRL\{/, "").replace(/\}$/, "");
    const candidates = new Set([clean, `CTRL{${inner}}`, `CTRL{${inner.replace(/[.']/g, "")}}`]);
    let ok = false;
    for (const c of candidates) { if ((await sha256(c)) === current.hash) { ok = true; break; } }
    const form = $("flag-form");
    if (!ok) {
      $("result").textContent = guess.startsWith("CTRL{") ? "❌ Fast, aber nicht ganz. Check nochmal deine Schreibweise." : "❌ Falsch. Die Flagge hat das Format CTRL{...}";
      $("result").className = "bad";
      form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      return;
    }
    const before = rankFor(solved.size);
    const firstTime = !solved.has(current.door);
    $("result").textContent = firstTime ? `✅ GEKNACKT! +${xpOf(current)} XP` : "✅ Richtig (hattest du schon geknackt).";
    $("result").className = "ok";
    $("d-learn").hidden = false;
    if (firstTime) {
      solved.add(current.door);
      save("solved", [...solved]);
      confetti(solved.size === 24 ? 400 : 140);
      const after = rankFor(solved.size);
      if (after !== before) setTimeout(() => toast(`🏆 Neuer Rang: ${after}!`), 900);
    }
    renderGrid(); renderStats();
    if (solved.size === 24) setTimeout(() => $("finale").scrollIntoView({ behavior: "smooth" }), 600);
  };

  $("share").onclick = async () => {
    const text = `Ich habe den ctrl+Derek Hacking-Adventskalender komplett geknackt! 24 von 24 Türchen, Rang: ${rankFor(solved.size)}, ${totalXp()} XP 🏆 #hacking #ctrlderek`;
    try { await navigator.clipboard.writeText(text); toast("📋 Kopiert! Poste es auf TikTok."); }
    catch { toast(text); }
  };

  $("reset").onclick = () => {
    if (confirm("Wirklich den ganzen Fortschritt löschen?")) { solved = new Set(); save("solved", []); renderGrid(); renderStats(); }
  };

  renderGrid();
  renderStats();
})();
