"use strict";
// Eigenes Icon-Set (24er-Raster, Linienstärke 2). Alle Zeichnungen sind selbst gemacht, keine fremden Dateien.
const ICONS = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/><path d="M12 15v2"/>',
  hash: '<path d="M4.5 9h15M4.5 15h15M10 3.5 8 20.5M16 3.5l-2 17"/>',
  code: '<path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5M13.5 5l-3 14"/>',
  grid: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
  radio: '<circle cx="12" cy="9" r="2"/><path d="M12 11v10M8 13a5.6 5.6 0 0 1 0-8M16 5a5.6 5.6 0 0 1 0 8M5 16a10 10 0 0 1 0-14M19 2a10 10 0 0 1 0 14"/>',
  image: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m21 15.5-5-5-9 9"/>',
  shield: '<path d="M12 3 20 6v6c0 4.8-3.3 7.9-8 9-4.7-1.1-8-4.2-8-9V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.4"/>',
  wifi: '<path d="M2.5 9a14.5 14.5 0 0 1 19 0M5.8 12.600a9.5 9.5 0 0 1 12.4 0M9 16.100a4.7 4.7 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.300l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.700l1-1"/>',
  cookie: '<path d="M20.5 12.500A8.5 8.5 0 1 1 11.5 3.500a3.5 3.5 0 0 0 4 4 3.5 3.5 0 0 0 5 5z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="13.5" cy="13" r="1" fill="currentColor"/><circle cx="9.5" cy="15.5" r="1" fill="currentColor"/>',
  scroll: '<path d="M6.5 3h8.500l4 4v14H6.500z"/><path d="M15 3v4h4M9.5 12h6.500M9.5 16h6.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.500v13c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-13M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
  xor: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.500v17M3.5 12h17"/>',
  key: '<circle cx="8" cy="15.5" r="4"/><path d="m11 12.5 9-9M16.5 7l3 3M13.5 10l2 2"/>',
  binary: '<rect x="4.5" y="4" width="6" height="7" rx="3"/><path d="M15.5 4.8 17.5 4v7M5.5 14l2-.8v7"/><rect x="13.5" y="13.2" width="6" height="7" rx="3"/>',
  coffee: '<path d="M4 9.500h13V14a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10.500h1.500a2.5 2.5 0 0 1 0 5H17M8 3v3M12.5 3v3"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m7 9.5 3 2.5-3 2.500M13 15h4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18h3"/>',
  chart: '<path d="M6 20v-6M12 20V9M18 20V4"/>',
  layers: '<path d="m12 3 9 4.8-9 4.8-9-4.800zM3.5 12.200l8.5 4.6 8.5-4.600M3.5 16.4 12 21l8.5-4.6"/>',
  bug: '<ellipse cx="12" cy="13.5" rx="5" ry="6"/><path d="M9 7.500a3 3 0 0 1 6 0M3 13.500h4M17 13.500h4M4 7.500l3.2 2.800M20 7.500l-3.2 2.800M4.5 20.500l3-2.800M19.5 20.500l-3-2.800M12 8v11"/>',
  monitor: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.500h7M12 16.500v4"/>',
  bulb: '<path d="M9 17.500h6M10 21h4M8.5 14.500a6 6 0 1 1 7 0c-.6.5-1 1.3-1 2h-5c0-.7-.4-1.5-1-2z"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.500a2.6 2.6 0 1 1 3.7 2.300c-.8.4-1.2 1-1.2 1.900M12 17h.01"/>',
  check: '<path d="m5 12.5 4.5 4.500L19 7.5"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M5.5 15.500h-1a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.500V12l3 2"/>',
  wrench: '<path d="M14.5 6.500a4.2 4.2 0 0 0-5.6 5.200l-5.4 5.400a1.8 1.8 0 0 0 2.5 2.500l5.4-5.400a4.2 4.2 0 0 0 5.2-5.600l-2.6 2.6-2-.5-.5-2z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
};

function icon(name, cls = "") {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.star}</svg>`;
}

// Icons im HTML: <span data-icon="lock"></span>
document.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
