// MD Clinic — 3D model (three.js)
// Koordinatlar metre. Cephe z=0, bina içi -z, sokak +z. Zemin kat y=0, 1. kat y=3.6.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const F1 = 3.6;            // 1. kat döşeme kotu
const WH = 3.0;            // 1. kat bölme duvar yüksekliği (kesit görünüm)
const MOBILE = matchMedia('(max-width: 720px)').matches;

/* ---------------------------------------------------------- canvas dokular */
function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4; return t;
}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function marbleCanvas(base = '#e9e3db', vein = 'rgba(120,110,100,0.18)') {
  const [c, g] = cnv(512, 512); g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.05})`; g.fillRect(rnd() * 512, rnd() * 512, 3, 3); }
  g.strokeStyle = vein;
  for (let v = 0; v < 9; v++) {
    g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath(); let x = rnd() * 512, y = rnd() * 512; g.moveTo(x, y);
    for (let s = 0; s < 40; s++) { x += (rnd() - 0.3) * 26; y += (rnd() - 0.5) * 26; g.lineTo(x, y); }
    g.stroke();
  }
  // karo derzleri (60x120 benzeri)
  g.strokeStyle = 'rgba(80,70,60,0.12)'; g.lineWidth = 1.5; g.strokeRect(0, 0, 512, 512); g.beginPath(); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
  return c;
}
function blackMarbleCanvas() {
  const [c, g] = cnv(512, 512); g.fillStyle = '#1b1a19'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(210,200,185,0.22)';
  for (let v = 0; v < 12; v++) {
    g.lineWidth = 0.4 + rnd() * 1.2; g.beginPath(); let x = rnd() * 512, y = rnd() * 512; g.moveTo(x, y);
    for (let s = 0; s < 30; s++) { x += (rnd() - 0.5) * 30; y += (rnd() - 0.2) * 24; g.lineTo(x, y); }
    g.stroke();
  }
  return c;
}
function concreteCanvas() {
  const [c, g] = cnv(256, 256); g.fillStyle = '#8f8d89'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) { const v = 120 + rnd() * 70 | 0; g.fillStyle = `rgba(${v},${v},${v - 4},0.25)`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(230,228,222,${0.05 + rnd() * 0.08})`; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 10 + rnd() * 40, 0, 7); g.fill(); }
  return c;
}
function blockCanvas() { // gazbeton: 60x25 cm bloklar, 2.4 m karo
  const [c, g] = cnv(512, 512); g.fillStyle = '#e4ddd2'; g.fillRect(0, 0, 512, 512);
  const bw = 128, bh = 53.3;
  for (let r = 0; r < 10; r++) for (let k = -1; k < 5; k++) {
    const x = k * bw + (r % 2 ? bw / 2 : 0), y = r * bh, v = 218 + rnd() * 20 | 0;
    g.fillStyle = `rgb(${v},${v - 6},${v - 16})`; g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    if (rnd() < 0.3) { g.fillStyle = 'rgba(150,145,140,0.35)'; g.fillRect(x + bw - 8, y + 4, 6, bh - 10); }
  }
  return c;
}
function hexFloorCanvas(wm, dm) { // altıgen zemin halısı: 3 ton gri + pirinç çerçeve
  const pxm = 150, W = Math.min(2048, Math.round(wm * pxm)), H = Math.min(2048, Math.round(dm * pxm));
  const [c, g] = cnv(W, H); const sx = W / wm, sy = H / dm;
  g.fillStyle = '#c9c4bd'; g.fillRect(0, 0, W, H);
  const R = 0.32, hw = Math.sqrt(3) * R, cols = ['#e7e3dd', '#a9a6a2', '#5d5c5b', '#cfcac3'];
  for (let row = -1; row * 1.5 * R < dm + R; row++) for (let col = -1; col * hw < wm + hw; col++) {
    const cx = col * hw + (row % 2 ? hw / 2 : 0), cy = row * 1.5 * R;
    g.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; g.lineTo((cx + R * Math.cos(a)) * sx, (cy + R * Math.sin(a)) * sy); }
    g.closePath(); g.fillStyle = cols[(rnd() * 4) | 0]; g.fill(); g.strokeStyle = 'rgba(40,38,36,0.35)'; g.lineWidth = 1.2; g.stroke();
  }
  g.strokeStyle = '#b8913f'; g.lineWidth = 0.05 * sx; g.strokeRect(0.025 * sx, 0.025 * sy, W - 0.05 * sx, H - 0.05 * sy);
  return c;
}
function hexPath(g, cx, cy, r, rot = Math.PI / 6) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } g.closePath(); }

// MD logosu (altıgen içinde)
export function drawLogo(g, cx, cy, r, font = 'Cinzel') {
  hexPath(g, cx, cy, r, -Math.PI / 2 + Math.PI / 6 * 0); // sivri üst
  g.fillStyle = '#121110'; g.fill(); g.lineWidth = r * 0.07; g.strokeStyle = '#c9a45c'; g.stroke();
  hexPath(g, cx, cy, r * 0.86, -Math.PI / 2); g.lineWidth = r * 0.015; g.strokeStyle = 'rgba(201,164,92,0.6)'; g.stroke();
  g.fillStyle = '#d8b56d'; g.font = `600 ${r * 0.78}px ${font}, "Times New Roman", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('MD', cx, cy + r * 0.04);
}
function logoCanvas() { const [c, g] = cnv(512, 512); drawLogo(g, 256, 256, 240); return c; }

// Eczane üstü cam için one-way vision giydirme — sayfada da baskı taslağı olarak gösterilir
export function drawOneWay(g, W, H, opts = {}) {
  // Eczane üstü cam (≈ 4,2 x 3,15 m): ortada ışıklı MD altıgeni, çevresinde halkalar, altta uzmanlık satırı
  const font = opts.font || 'Cinzel';
  g.clearRect(0, 0, W, H);
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#1d1b19'); grd.addColorStop(1, '#0f0e0d');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const lx = W * 0.5, ly = H * 0.4, LR = H * 0.22;
  const R = H * 0.06, hw = Math.sqrt(3) * R;
  for (let row = -1; row * 1.5 * R < H + R; row++) for (let col = -1; col * hw < W + hw; col++) {
    const cx = col * hw + (row % 2 ? hw / 2 : 0), cy = row * 1.5 * R;
    const d = Math.hypot((cx - lx) / W, (cy - ly) / H);
    const k = Math.max(0, Math.min(1, (d - 0.18) * 2.2));
    if (k <= 0.02) continue;
    hexPath(g, cx, cy, R * 0.92, -Math.PI / 2);
    const tone = rnd();
    g.fillStyle = tone < 0.18 ? `rgba(201,164,92,${0.10 * k})` : tone < 0.55 ? `rgba(120,115,110,${0.22 * k})` : `rgba(230,225,218,${0.07 * k})`;
    g.fill(); g.strokeStyle = `rgba(201,164,92,${0.22 * k})`; g.lineWidth = Math.max(1, H * 0.003); g.stroke();
  }
  const ring = [[-1.6, -0.5, 0.3], [-1.55, 0.7, 0.22], [1.55, -0.6, 0.26], [1.6, 0.6, 0.3], [0.0, -1.45, 0.2], [-0.95, -1.25, 0.14], [0.95, 1.3, 0.15], [-2.35, 0.1, 0.13], [2.4, 0.0, 0.14]];
  for (const [dx, dy, s] of ring) {
    const x = lx + dx * LR, y = ly + dy * LR, r = LR * s;
    g.shadowColor = 'rgba(255,190,110,0.9)'; g.shadowBlur = r * 0.5;
    hexPath(g, x, y, r, -Math.PI / 2); g.lineWidth = r * 0.12; g.strokeStyle = '#d8b56d'; g.stroke();
    g.shadowBlur = 0; hexPath(g, x, y, r * 0.82, -Math.PI / 2); g.fillStyle = '#121110'; g.fill();
  }
  g.shadowColor = 'rgba(255,190,110,0.8)'; g.shadowBlur = LR * 0.15;
  drawLogo(g, lx, ly, LR, font); g.shadowBlur = 0;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#ece4d6'; g.font = `500 ${H * 0.058}px "Albert Sans", Arial, sans-serif`;
  g.fillText('RADYOLOJİ  ·  GİRİŞİMSEL RADYOLOJİ', lx, H * 0.8, W * 0.86);
  g.fillStyle = '#c9a45c'; g.fillRect(lx - W * 0.2, H * 0.835, W * 0.4, Math.max(2, H * 0.006));
  g.fillStyle = 'rgba(216,205,189,0.75)'; g.font = `400 ${H * 0.038}px "IBM Plex Mono", monospace`;
  g.fillText('GİRİŞ ECZANE YANI  ·  1. KAT', lx, H * 0.9);
}
function oneWayCanvas() { const [c, g] = cnv(2120, 1000); drawOneWay(g, 2120, 1000); return c; }

// MD giriş kapısı (çift kanat, açılır-kapanır) için ultrason görüntülü one-way vision
export function drawDoorUS(g, W, H) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#0d0c0b'; g.fillRect(0, 0, W, H);
  const R = W * 0.035, hw = Math.sqrt(3) * R;
  for (let row = -1; row * 1.5 * R < H + R; row++) for (let col = -1; col * hw < W + hw; col++) {
    hexPath(g, col * hw + (row % 2 ? hw / 2 : 0), row * 1.5 * R, R * 0.92, -Math.PI / 2);
    g.strokeStyle = 'rgba(201,164,92,0.10)'; g.lineWidth = 1.5; g.stroke();
  }
  // sektör tarama (konveks prob görüntüsü), altın-amber tonlarda
  const ax = W / 2, ay = H * 0.1, r0 = W * 0.06, r1 = H * 0.78, a0 = Math.PI * 0.27, a1 = Math.PI * 0.73;
  g.save(); g.beginPath(); g.arc(ax, ay, r1, a0, a1); g.arc(ax, ay, r0, a1, a0, true); g.closePath(); g.clip();
  const bg = g.createRadialGradient(ax, ay, r0, ax, ay, r1); bg.addColorStop(0, '#2a2016'); bg.addColorStop(0.6, '#1a140e'); bg.addColorStop(1, '#0d0a07');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26000; i++) {
    const a = a0 + rnd() * (a1 - a0), r = r0 + Math.sqrt(rnd()) * (r1 - r0);
    const x = ax + Math.cos(a) * r, y = ay + Math.sin(a) * r, v = rnd();
    g.fillStyle = `rgba(${200 + v * 40 | 0},${150 + v * 50 | 0},${80 + v * 40 | 0},${0.12 + v * 0.35})`;
    g.fillRect(x, y, 2 + rnd() * 3, 1.5);
  }
  // organ: böbrek benzeri yapı — parlak korteks, koyu medulla
  const ox = ax - W * 0.02, oy = ay + r1 * 0.55;
  g.save(); g.translate(ox, oy); g.rotate(-0.35);
  g.strokeStyle = 'rgba(240,208,140,0.75)'; g.lineWidth = W * 0.018; g.beginPath(); g.ellipse(0, 0, W * 0.2, H * 0.11, 0, 0, 7); g.stroke();
  g.fillStyle = 'rgba(8,6,4,0.75)'; g.beginPath(); g.ellipse(0, 0, W * 0.16, H * 0.08, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(230,190,120,0.45)'; g.beginPath(); g.ellipse(W * 0.02, 0, W * 0.07, H * 0.03, 0.2, 0, 7); g.fill();
  g.restore();
  g.fillStyle = 'rgba(0,0,0,0.8)'; g.beginPath(); g.ellipse(ax + W * 0.16, ay + r1 * 0.3, W * 0.05, H * 0.025, 0.4, 0, 7); g.fill();
  g.restore();
  g.strokeStyle = 'rgba(216,181,109,0.85)'; g.lineWidth = 3;
  g.beginPath(); g.arc(ax, ay, r1, a0, a1); g.stroke();
  for (let i = 0; i <= 8; i++) { const y = ay + r0 + (r1 - r0) * i / 8 * 0.95; g.beginPath(); g.moveTo(W * 0.9, y); g.lineTo(W * 0.92 + (i % 2 ? 0 : 14), y); g.stroke(); }
  g.fillStyle = '#d8b56d'; g.font = `500 ${W * 0.024}px "IBM Plex Mono", monospace`; g.textAlign = 'left';
  g.fillText('MD  ·  RADYOLOJİ', W * 0.06, H * 0.05); g.fillText('C5-1  ·  14 cm', W * 0.06, H * 0.08);
  g.textAlign = 'right'; g.fillText('GİRİŞ  ·  1. KAT', W * 0.94, H * 0.05);
  drawLogo(g, W / 2, H * 0.9, W * 0.07);
}
function doorCanvas() { const [c, g] = cnv(1024, 1188); drawDoorUS(g, 1024, 1188); return c; }
function pharmacySignCanvas() {   // fotoğraftaki tabela: açık gri zemin, bordo ECZANE, altında SEVİLAY
  const [c, g] = cnv(1024, 362); g.fillStyle = '#f1f0ee'; g.fillRect(0, 0, 1024, 362);
  g.fillStyle = '#c0173c'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = '800 210px "Albert Sans", Arial, sans-serif';
  if ('letterSpacing' in g) g.letterSpacing = '14px';
  g.fillText('ECZANE', 512, 222, 900);
  if ('letterSpacing' in g) g.letterSpacing = '6px';
  g.fillStyle = '#3a3a3c'; g.font = '700 70px "Albert Sans", Arial, sans-serif'; g.fillText('SEVİLAY', 512, 318);
  return c;
}

function usScreenCanvas() { // gri tonlu ultrason görüntüsü
  const [c, g] = cnv(256, 170); g.fillStyle = '#040506'; g.fillRect(0, 0, 256, 170);
  g.save(); g.beginPath(); g.moveTo(128, 18); g.arc(128, 18, 140, Math.PI * 0.27, Math.PI * 0.73); g.closePath(); g.clip();
  for (let i = 0; i < 3500; i++) { const v = rnd() * 150 | 0; g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.fillRect(rnd() * 256, 18 + rnd() * 150, 2, 1); }
  g.fillStyle = 'rgba(0,0,0,0.85)'; g.beginPath(); g.ellipse(126, 92, 46, 32, 0.2, 0, 7); g.fill();
  g.fillStyle = 'rgba(200,200,200,0.55)'; g.beginPath(); g.ellipse(120, 92, 24, 17, 0.3, 0, 7); g.fill();
  g.restore();
  g.fillStyle = '#5fa7c9'; g.font = '9px monospace'; g.fillText('MD CLINIC  C5-1  12cm', 8, 12); g.fillText('2D  64%', 210, 160);
  return c;
}
function fetus3dCanvas() {
  const [c, g] = cnv(400, 220); g.fillStyle = '#060504'; g.fillRect(0, 0, 400, 220);
  const rg = g.createRadialGradient(205, 105, 8, 200, 110, 95); rg.addColorStop(0, '#f6b77a'); rg.addColorStop(0.55, '#b4612c'); rg.addColorStop(1, 'rgba(40,14,4,0)');
  g.fillStyle = rg; g.beginPath(); g.ellipse(200, 110, 92, 82, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,214,170,0.55)'; g.beginPath(); g.ellipse(214, 96, 36, 30, 0.3, 0, 7); g.fill();
  for (let i = 0; i < 4; i++) { g.fillStyle = '#2b1a10'; g.fillRect(20, 30 + i * 40, 46, 34); }
  g.fillStyle = '#e8e1d6'; g.font = '12px monospace'; g.fillText('3D/4D', 20, 18); g.fillText('MI 0.9', 330, 40); g.fillText('FR 32Hz', 322, 60);
  return c;
}
function queueCanvas() {
  const [c, g] = cnv(512, 256); g.fillStyle = '#101010'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#d8b56d'; g.font = '600 70px Cinzel, serif'; g.fillText('MD', 34, 150);
  g.fillStyle = '#eee'; g.font = '600 30px "Albert Sans", sans-serif'; g.fillText('Hasta Sırası', 200, 52);
  const rows = [['US-1', 'A035'], ['US-2', 'B034'], ['GİR', 'C027']];
  g.font = '500 28px "IBM Plex Mono", monospace';
  rows.forEach(([a, b], i) => { g.fillStyle = '#bbb'; g.fillText(a, 200, 108 + i * 50); g.fillStyle = '#d8b56d'; g.fillText(b, 360, 108 + i * 50); });
  return c;
}
function artCanvas(kind) {
  const [c, g] = cnv(256, 320);
  if (kind === 'hex') {
    g.fillStyle = '#ece8e2'; g.fillRect(0, 0, 256, 320);
    const cols = ['#1d1c1b', '#e9e5df', '#8a8783', '#cfc9c1'];
    for (let r = 0; r < 6; r++) for (let k = 0; k < 5; k++) { if (rnd() < 0.25) continue; hexPath(g, 30 + k * 52 + (r % 2) * 26, 30 + r * 45, 28, -Math.PI / 2); g.fillStyle = cols[(rnd() * 4) | 0]; g.fill(); g.strokeStyle = '#b8913f'; g.lineWidth = 2; g.stroke(); }
  } else {
    g.fillStyle = '#e8ddd2'; g.fillRect(0, 0, 256, 320);
    g.fillStyle = '#c9926a'; g.beginPath(); g.arc(90, 90, 70, 0, 7); g.fill();
    g.fillStyle = '#1c1b1a'; g.beginPath(); g.moveTo(60, 320); g.bezierCurveTo(80, 200, 200, 240, 210, 120); g.lineTo(256, 130); g.bezierCurveTo(240, 260, 140, 260, 130, 320); g.fill();
  }
  g.strokeStyle = '#b8913f'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 312);
  return c;
}
function signCanvas(text, sub, fg, bg) {
  const [c, g] = cnv(1024, 160); g.fillStyle = bg; g.fillRect(0, 0, 1024, 160);
  g.fillStyle = fg; g.font = '800 96px "Albert Sans", Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText(text, 40, 70);
  if (sub) { g.font = '600 34px "Albert Sans", Arial, sans-serif'; g.fillText(sub, 44, 132); }
  return c;
}
function portalCanvas() {
  const [c, g] = cnv(1024, 256); g.fillStyle = '#121110'; g.fillRect(0, 0, 1024, 256);
  drawLogo(g, 118, 128, 100);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#ece4d6'; g.font = '500 50px "Albert Sans", sans-serif'; g.fillText('RADYOLOJİ', 250, 92, 740);
  g.fillText('GİRİŞİMSEL RADYOLOJİ', 250, 150, 740);
  g.fillStyle = '#d8b56d'; g.font = '500 34px "IBM Plex Mono", monospace'; g.fillText('↑ 1. KAT', 250, 208, 740);
  return c;
}
function groundSignCanvas() {   // zemin kat giriş tabelası (eski eczane cephesi)
  const [c, g] = cnv(1024, 125); g.fillStyle = '#121110'; g.fillRect(0, 0, 1024, 125);
  g.fillStyle = '#c9a45c'; g.fillRect(0, 0, 1024, 3); g.fillRect(0, 122, 1024, 3);
  drawLogo(g, 64, 62, 50);
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = '#ece4d6'; g.font = '500 40px "Albert Sans", Arial, sans-serif'; g.fillText('RADYOLOJİ · GİRİŞİMSEL RADYOLOJİ', 132, 64, 700);
  g.textAlign = 'right'; g.fillStyle = '#d8b56d'; g.font = '500 30px "IBM Plex Mono", monospace'; g.fillText('GİRİŞ', 1000, 64);
  return c;
}
function cobbleCanvas() {
  const [c, g] = cnv(512, 512); g.fillStyle = '#8d8a85'; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 16; r++) for (let k = 0; k < 16; k++) {
    const x = k * 32 + (r % 2) * 16 + (rnd() - 0.5) * 6, y = r * 32 + (rnd() - 0.5) * 6, v = 150 + rnd() * 60 | 0;
    g.fillStyle = `rgb(${v},${v - 3},${v - 8})`; g.beginPath(); g.roundRect ? g.roundRect(x + 2, y + 2, 27, 27, 7) : g.rect(x + 2, y + 2, 27, 27); g.fill();
  }
  return c;
}
function stripeCanvas() {
  const [c, g] = cnv(64, 512);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#c4c7cb' : '#dcdee1'; g.fillRect(0, i * 32, 64, 32); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, i * 32, 64, 2); }
  return c;
}
// kapılar için altıgen one-way vision (cephe ile aynı dil); label verilirse göz hizasında oda adı
function hexDoorCanvas(label) {
  const W = 512, H = 1160, [c, g] = cnv(W, H);
  g.clearRect(0, 0, W, H);
  const R = 34, hw = Math.sqrt(3) * R;
  for (let row = -1; row * 1.5 * R < H + R; row++) for (let col = -1; col * hw < W + hw; col++) {
    const cx = col * hw + (row % 2 ? hw / 2 : 0), cy = row * 1.5 * R, t = cy / H;
    const k = t < 0.18 ? t / 0.18 * 0.4 : t > 0.9 ? 0.6 : 1;            // üstte seyrek, gövdede tam kaplama
    if (rnd() > 0.35 + 0.65 * k) continue;
    hexPath(g, cx, cy, R * 0.9, -Math.PI / 2);
    const tone = rnd();
    g.fillStyle = tone < 0.12 ? 'rgba(201,164,92,0.75)' : tone < 0.6 ? 'rgba(22,21,20,0.88)' : 'rgba(70,66,62,0.8)';
    g.fill(); g.strokeStyle = 'rgba(216,181,109,0.85)'; g.lineWidth = 2.5; g.stroke();
  }
  if (label) {
    g.fillStyle = 'rgba(14,13,12,0.92)'; g.fillRect(40, H * 0.36, W - 80, 170);
    g.strokeStyle = '#c9a45c'; g.lineWidth = 3; g.strokeRect(40, H * 0.36, W - 80, 170);
    drawLogo(g, 110, H * 0.36 + 85, 50);
    g.fillStyle = '#ece4d6'; g.font = '600 52px "Albert Sans", Arial, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillText(label, 180, H * 0.36 + 85, W - 240);
  }
  return c;
}
function wcSignCanvas(kind) {
  const [c, g] = cnv(256, 256); g.fillStyle = '#121110'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#c9a45c'; g.lineWidth = 6; g.strokeRect(6, 6, 244, 244);
  g.strokeStyle = '#d8b56d'; g.fillStyle = '#d8b56d'; g.lineWidth = 11; g.lineCap = 'round';
  if (kind === 'engelli') {        // erişilebilirlik simgesi: baş, gövde, tekerlek
    g.beginPath(); g.arc(118, 52, 14, 0, 7); g.fill();
    g.beginPath(); g.moveTo(116, 76); g.lineTo(116, 132); g.lineTo(160, 132); g.lineTo(178, 176); g.stroke();
    g.beginPath(); g.moveTo(116, 98); g.lineTo(150, 98); g.stroke();
    g.beginPath(); g.arc(112, 160, 40, Math.PI * 0.15, Math.PI * 1.75); g.stroke();
    g.font = '600 30px "Albert Sans", Arial, sans-serif'; g.textAlign = 'center'; g.fillText('ENGELLİ WC', 128, 230);
  } else {
    g.font = '700 96px "Albert Sans", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WC', 128, 118);
    g.font = '600 26px "IBM Plex Mono", monospace'; g.fillText('KADIN · ERKEK', 128, 205);
  }
  return c;
}
function skyCanvas() {
  const [c, g] = cnv(16, 512); const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#34405a'); grd.addColorStop(0.45, '#7c88a0'); grd.addColorStop(0.72, '#d9a77d'); grd.addColorStop(0.82, '#f0c894'); grd.addColorStop(1, '#a89a8c');
  g.fillStyle = grd; g.fillRect(0, 0, 16, 512); return c;
}

/* ---------------------------------------------------------- malzemeler */
const M = {};
function std(o) { return new THREE.MeshStandardMaterial(o); }
function buildMaterials() {
  M.marble = std({ map: tex(marbleCanvas(), 1, 1), roughness: 0.18, metalness: 0.0 });
  M.concrete = std({ map: tex(concreteCanvas(), 6, 6), roughness: 0.95 });
  M.paving = std({ map: tex(concreteCanvas(), 18, 18), color: '#b9b2a8', roughness: 0.9 });
  M.road = std({ color: '#3a3b3d', roughness: 0.95 });
  M.sidewalk = std({ color: '#cfcac2', roughness: 0.9 });
  M.cobble = std({ map: tex(cobbleCanvas(), 30, 22), roughness: 0.95 });
  M.stripe = std({ map: tex(stripeCanvas(), 1, 2.2), roughness: 0.6 });
  M.paint = std({ color: '#ebe7e0', roughness: 0.7 });      // inci beyazı duvar
  M.paintLight = std({ color: '#f2efe9', roughness: 0.7 });
  M.anthraWall = std({ color: '#2e2e30', roughness: 0.6 });   // antrasit vurgu duvarı
  M.anthracite = std({ color: '#262626', roughness: 0.6 });
  M.black = std({ color: '#141414', roughness: 0.4 });
  M.blackMarble = std({ map: tex(blackMarbleCanvas(), 1, 1), roughness: 0.15 });
  M.white = std({ color: '#f1efea', roughness: 0.35 });
  M.cream = std({ color: '#e6ded3', roughness: 0.7 });
  M.taupeFab = std({ color: '#b9ab9c', roughness: 0.95 });
  M.brownLeather = std({ color: '#5a4033', roughness: 0.55 });
  M.greyLeather = std({ color: '#6c6b69', roughness: 0.5 });
  M.gold = std({ color: '#c9a45c', roughness: 0.28, metalness: 1.0 });
  M.chrome = std({ color: '#cfd2d4', roughness: 0.2, metalness: 1.0 });
  M.oak = std({ color: '#8a6440', roughness: 0.6 });
  M.primer = std({ color: '#7b2f22', roughness: 0.7, metalness: 0.2 });
  M.steelBlack = std({ color: '#1c1c1c', roughness: 0.45, metalness: 0.6 });
  M.red = std({ color: '#b3231c', roughness: 0.5 });
  M.osb = std({ color: '#c9a26e', roughness: 0.9 });
  M.green = std({ color: '#4f6b3a', roughness: 0.9, flatShading: true });
  M.pot = std({ color: '#dcd6cc', roughness: 0.6 });
  M.led = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb860').multiplyScalar(2.2), toneMapped: false });
  M.ledSoft = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf8f').multiplyScalar(1.4), toneMapped: false });
  M.downlight = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff1d6').multiplyScalar(1.8), toneMapped: false });
  M.glass = new THREE.MeshStandardMaterial({ color: '#7f97a0', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.5, depthWrite: false, side: THREE.DoubleSide });
  M.glassDark = new THREE.MeshStandardMaterial({ color: '#2a3238', transparent: true, opacity: 0.55, roughness: 0.08, metalness: 0.6, depthWrite: false });
  M.frosted = new THREE.MeshStandardMaterial({ color: '#dfe6e6', transparent: true, opacity: 0.55, roughness: 0.6, depthWrite: false, side: THREE.DoubleSide });
  M.mullion = std({ color: '#3b3d40', roughness: 0.4, metalness: 0.7 });
  M.ceiling = new THREE.MeshStandardMaterial({ color: '#efebe5', roughness: 0.9, side: THREE.FrontSide });
  M.grid = std({ color: '#cfd1d3', roughness: 0.4, metalness: 0.8 });
  M.block = std({ map: tex(blockCanvas(), 1, 1), roughness: 0.95 });
  M.logo = std({ map: tex(logoCanvas()), roughness: 0.3, emissive: '#ffffff', emissiveMap: tex(logoCanvas()), emissiveIntensity: 0.35 });
  M.oneway = new THREE.MeshStandardMaterial({ map: tex(oneWayCanvas()), transparent: true, opacity: 0.94, roughness: 0.35, metalness: 0.2, emissive: '#ffffff', emissiveMap: tex(oneWayCanvas()), emissiveIntensity: 0.18 });
  M.usScreen = new THREE.MeshBasicMaterial({ map: tex(usScreenCanvas()) });
  M.fetus = new THREE.MeshBasicMaterial({ map: tex(fetus3dCanvas()) });
  M.queue = new THREE.MeshBasicMaterial({ map: tex(queueCanvas()) });
  M.artHex = std({ map: tex(artCanvas('hex')), roughness: 0.6 });
  M.artCurve = std({ map: tex(artCanvas('curve')), roughness: 0.6 });
  M.pharmacy = std({ map: tex(pharmacySignCanvas()), roughness: 0.45, emissive: '#ffffff', emissiveMap: tex(pharmacySignCanvas()), emissiveIntensity: 0.08 });
  M.crimson = std({ color: '#c8102e', roughness: 0.45 });
  const dt = tex(doorCanvas()); const dl = dt.clone(); dl.repeat.set(0.5, 1); dl.offset.set(0, 0); dl.needsUpdate = true; const dr = dt.clone(); dr.repeat.set(0.5, 1); dr.offset.set(0.5, 0); dr.needsUpdate = true;
  M.doorL = std({ map: dl, emissive: '#ffffff', emissiveMap: dl, emissiveIntensity: 0.7, roughness: 0.3, side: THREE.DoubleSide });
  M.doorR = std({ map: dr, emissive: '#ffffff', emissiveMap: dr, emissiveIntensity: 0.7, roughness: 0.3, side: THREE.DoubleSide });
  M.autoGlass = new THREE.MeshStandardMaterial({ color: '#cfe0e2', transparent: true, opacity: 0.38, roughness: 0.15, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const hexDoorMat = (label) => { const t = tex(hexDoorCanvas(label)); return new THREE.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.25, transparent: true, alphaTest: 0.02, roughness: 0.25, side: THREE.DoubleSide }); };
  M.hexD1 = hexDoorMat('D. ODASI 1'); M.hexD2 = hexDoorMat('D. ODASI 2'); M.hexDoor = hexDoorMat('');
  M.signEngelli = new THREE.MeshBasicMaterial({ map: tex(wcSignCanvas('engelli')) }); M.signWC = new THREE.MeshBasicMaterial({ map: tex(wcSignCanvas('wc')) });
  M.pearlWall = std({ color: '#ece8e1', roughness: 0.55, metalness: 0.05 });
  M.warmWhite = std({ color: '#f2ece2', roughness: 0.8 });
  M.lightOak = std({ color: '#c9a984', roughness: 0.6 });
  M.anthraciteLeather = std({ color: '#2c2c2e', roughness: 0.5 });
  M.pearlLeather = std({ color: '#e6e1d8', roughness: 0.45 });
  M.taupeLeather = std({ color: '#a39282', roughness: 0.5 });
  M.boucle = std({ color: '#efe8dc', roughness: 0.98 });
  M.gelBlue = std({ color: '#3f8fc4', roughness: 0.4 });
  M.lavender = std({ color: '#9b8fd1', roughness: 0.5 });
  M.drape = std({ color: '#3b7f9c', roughness: 0.9 });
  M.sharps = std({ color: '#e8c21c', roughness: 0.5 });
  M.redLid = std({ color: '#c62828', roughness: 0.5 });
  M.curtain = std({ color: '#d9d2c7', roughness: 0.95 });
  M.sensor = new THREE.MeshBasicMaterial({ color: new THREE.Color('#4fb3ff').multiplyScalar(1.5), toneMapped: false });
  M.paintBlack = new THREE.MeshPhysicalMaterial({ color: '#0c0c0e', metalness: 0.6, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 });
  M.paintGraphite = new THREE.MeshPhysicalMaterial({ color: '#3a3d42', metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
  M.paintPearl = new THREE.MeshPhysicalMaterial({ color: '#e9e6df', metalness: 0.3, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 });
  M.tire = std({ color: '#111111', roughness: 0.9 });
  M.tail = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2a2a').multiplyScalar(1.6), toneMapped: false });
  M.portal = std({ map: tex(portalCanvas()), roughness: 0.35, emissive: '#ffffff', emissiveMap: tex(portalCanvas()), emissiveIntensity: 0.45 });
  M.skin = std({ color: '#3a3836', roughness: 0.9 });
  M.groundSign = std({ map: tex(groundSignCanvas()), roughness: 0.35, emissive: '#ffffff', emissiveMap: tex(groundSignCanvas()), emissiveIntensity: 0.45 });
  M.mirror = std({ color: '#d5d9db', roughness: 0.08, metalness: 0.35 });
}

/* ---------------------------------------------------------- yardımcılar */
let scene, camera, renderer, composer, controls;
const staged = [];   // {obj, from, to, mode, d}
function stage(obj, from, to = 99, mode = 'grow') { staged.push({ obj, from, to, mode, d: rnd() * 0.45, base: obj.scale.clone() }); return obj; }

function box(w, h, d, mat, x, y, z, parent = scene, cast = true) {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
function cyl(rt, rb, h, mat, x, y, z, parent = scene, seg = 24) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function plane(w, h, mat, x, y, z, ry = 0, parent = scene) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
}
function floorPlane(w, d, mat, cx, y, cz, parent = scene) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(cx, y, cz); m.receiveShadow = true; parent.add(m); return m;
}
function grp(x, y, z, ry = 0, parent = scene) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }
function hexRingGeo(r, t, depth) {
  const s = new THREE.Shape(), h = new THREE.Path();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i * Math.PI / 3; (i ? s.lineTo.bind(s) : s.moveTo.bind(s))(r * Math.cos(a), r * Math.sin(a)); }
  for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i * Math.PI / 3; (i ? h.lineTo.bind(h) : h.moveTo.bind(h))((r - t) * Math.cos(a), (r - t) * Math.sin(a)); }
  s.holes.push(h); return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}
function hexDiscGeo(r, depth) {
  const s = new THREE.Shape();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i * Math.PI / 3; (i ? s.lineTo.bind(s) : s.moveTo.bind(s))(r * Math.cos(a), r * Math.sin(a)); }
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}

/* duvar: x1,z1 → x2,z2 eksenli, iki malzeme (gazbeton → boya) */
function wall(x1, z1, x2, z2, y0 = F1, h = WH, t = 0.12, opts = {}) {
  const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const make = (mat) => { const m = box(len, h, t, mat, cx, y0, cz); m.rotation.y = -ang; return m; };
  const bm = M.block.clone(); bm.map = M.block.map.clone(); bm.map.repeat.set(len / 2.4, h / 2.4); bm.map.needsUpdate = true;
  const blockW = make(bm), paintW = make(opts.paint || M.paint);
  stage(blockW, opts.from ?? 1, 3, 'rise'); stage(paintW, 3, 99, 'swap');
  return paintW;
}

/* ---------------------------------------------------------- bina (proje: "Yeni merdiven planı") */
// Plan sokaktan bakışa göre aynalandı: merdiven boşluğu sağda (+X), karşılama bankosu solda (-X).
const XL = -3.34, XR = 3.34;              // cephe genişliği ≈ 6,7 m
const VOID = { x0: 0.82, x1: 3.22, z0: -1.98, z1: -6.66 };
const ZP = -6.66, ZDM = -9.6, ZB = -12.7, ZH = -14.3, ZE = -17.0;   // bölme hatları
const CX1 = 0.74, CX2 = -0.6;             // koridor duvarları (koridor ≈ 1,35 m)
const AX0 = -1.26, AX1 = 2.51;            // arka WC çıkması

function buildSite() {
  floorPlane(80, 3.2, M.sidewalk, 0, 0.0, 1.6);                     // 3 m kaldırım
  box(80, 0.14, 0.2, M.cream, 0, -0.1, 3.3, scene, false);           // bordür
  floorPlane(80, 60, M.cobble, 0, -0.01, 33.4);                     // arnavut kaldırımı yol
  for (let i = 0; i < 26; i++) {   // karşı şerit: Balgat koru
    const x = -38 + i * 3 + rnd() * 1.5, z = 21 + rnd() * 9, s = 0.8 + rnd() * 0.7;
    cyl(0.12, 0.16, 1.6 * s, M.oak, x, 0, z);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 * s, 0), M.green); crown.position.set(x, 2.4 * s, z); crown.castShadow = true; scene.add(crown);
  }
  // komşu birimler: sağda restoran (cam kanopi), solda komşu dükkân
  box(8.5, 3.9, 18, M.anthracite, 8.75, 0, -9);                     // yan bina: tek kat, camlı dükkân
  const rs = grp(8.75, 0, 0);
  plane(8.2, 3.3, M.glassDark, 0, 1.65, 0.03, 0, rs);
  for (let i = 0; i <= 5; i++) box(0.08, 3.4, 0.1, M.steelBlack, -4.1 + i * 1.64, 0, 0.04, rs);
  box(8.5, 0.1, 0.12, M.steelBlack, 0, 2.5, 0.05, rs);
  const can = grp(8.75, 0, 0);
  for (let i = 0; i < 4; i++) box(0.08, 3.2, 0.08, M.steelBlack, -3.6 + i * 2.4, 0, 3.4, can);
  box(8.4, 0.06, 3.6, M.glassDark, 0, 3.2, 1.8, can); plane(8.2, 3.1, M.glassDark, 0, 1.55, 3.44, 0, can);
  box(9, 7.4, 18, M.anthracite, -8.0, 0, -9); plane(8.4, 2.8, M.glassDark, -8.0, 1.5, 0.02); plane(8.4, 3.2, M.glassDark, -8.0, 5.3, 0.02);

  // kabuk
  box(0.3, 7.4, 14.3, M.anthracite, XL - 0.15, 0, -7.15); box(0.3, 7.4, 12.7, M.anthracite, XR + 0.15, 0, -6.35);
  box(0.3, 7.4, 4.3, M.anthracite, AX1 + 0.15, 0, -14.85); box(0.85, 7.4, 0.3, M.anthracite, (AX1 + XR) / 2 + 0.15, 0, ZB - 0.15);
  box(0.3, 7.4, 2.7, M.anthracite, AX0 - 0.15, 0, -15.65); box(AX0 - XL + 0.3, 7.4, 0.3, M.anthracite, (XL + AX0) / 2, 0, ZH - 0.15);
  box(AX1 - AX0 + 0.6, 7.4, 0.3, M.anthracite, (AX0 + AX1) / 2, 0, ZE - 0.15);
  floorPlane(30, 30, M.concrete, 0, 0.01, -8);

  // 1. kat döşemesi (merdiven boşluğu hariç)
  const pieces = [
    [VOID.x0 - XL, 14.3, (XL + VOID.x0) / 2, -7.15],
    [XR - VOID.x0, -VOID.z0, (VOID.x0 + XR) / 2, VOID.z0 / 2],
    [XR - VOID.x0, VOID.z1 - ZB, (VOID.x0 + XR) / 2, (VOID.z1 + ZB) / 2],
    [AX1 - VOID.x0, ZB - ZH, (VOID.x0 + AX1) / 2, (ZB + ZH) / 2],
    [AX1 - AX0, ZH - ZE, (AX0 + AX1) / 2, (ZH + ZE) / 2],
  ].filter((p) => p[1] > 0.05);
  for (const [w, d, cx, cz] of pieces) {
    box(w, 0.25, d, M.concrete, cx, F1 - 0.25, cz);
    const c = floorPlane(w, d, M.concrete, cx, F1 + 0.002, cz); stage(c, 0, 3, 'swap');
    const mm = M.marble.clone(); mm.map = M.marble.map.clone(); mm.map.repeat.set(w / 1.2, d / 1.2); mm.map.needsUpdate = true;
    stage(floorPlane(w, d, mm, cx, F1 + 0.004, cz), 3, 99, 'swap');
  }

  /* — ZEMİN KAT — */
  // bugün: Sevilay Eczanesi (X -3.34 … 0.7) — mülk yatırımcı hekimin, aşama 4'te klinik girişine dönüşür
  const ph = grp(-1.3, 0, -3);   // Sevilay Eczanesi — eczane olarak kalıyor
  box(4.0, 3.3, 0.1, M.white, 0, 0, -2.9, ph);
  for (let i = 0; i < 2; i++) box(1.8, 2.2, 0.4, M.white, -1.0 + i * 2.0, 0, -2.6, ph);
  for (let i = 0; i < 2; i++) for (let k = 0; k < 4; k++) box(1.7, 0.04, 0.38, M.oak, -1.0 + i * 2.0, 0.4 + k * 0.5, -2.6, ph, false);
  box(2.4, 1.0, 0.7, M.white, 0, 0, -0.6, ph);
  box(0.12, 3.35, 9, M.cream, 0.76, 0, -4.5);           // eczane | merdiven holü
  const gw = new THREE.Group(); scene.add(gw);                                // klinik: hole geçiş boşluğu
  box(0.12, 3.35, 7.2, M.cream, 0.76, 0, -5.4, gw); box(0.12, 3.35, 0.4, M.cream, 0.76, 0, -0.2, gw); box(0.12, 0.95, 1.4, M.cream, 0.76, 2.4, -1.1, gw);
  box(4.1, 3.35, 0.12, M.paint, -1.3, 0, -9, gw);
  scene.remove(gw);
  box(2.6, 3.35, 0.12, M.cream, 2.05, 0, -9);                                 // hol arka duvar

  // cephe — zemin
  plane(3.9, 2.75, M.glass, -1.3, 1.38, 0.0);
  for (const x of [XL, -2.4, -0.2, 0.7]) box(0.07, 2.8, 0.1, M.mullion, x, 0, 0);
  box(4.1, 0.1, 0.12, M.mullion, -1.3, 2.75, 0);
  const phs = new THREE.Group(); scene.add(phs);
  box(4.1, 0.6, 0.08, M.crimson, -1.29, 3.17, 0.22, phs);
  box(2.64, 0.95, 0.1, M.white, -1.27, 3.0, 0.27, phs); plane(2.6, 0.92, M.pharmacy, -1.27, 3.475, 0.325, 0, phs);
  // eczanenin otomatik sürgü kapısı
  box(1.7, 0.1, 0.1, M.chrome, -0.15, 2.45, 0.03, phs); box(0.06, 2.45, 0.1, M.chrome, -1.0, 0, 0.03, phs); box(0.06, 2.45, 0.1, M.chrome, 0.7, 0, 0.03, phs); box(0.04, 2.45, 0.08, M.chrome, -0.15, 0, 0.04, phs);

  const gs = new THREE.Group(); scene.add(gs);                                // MD giriş tabelası + otomatik kapı
  box(4.2, 0.6, 0.16, M.black, -1.3, 2.74, 0.06, gs);
  plane(4.1, 0.5, M.groundSign, -1.3, 3.04, 0.145, 0, gs);
  box(4.2, 0.025, 0.17, M.led, -1.3, 2.72, 0.06, gs, false);
  box(2.2, 0.06, 0.14, M.gold, -1.3, 2.62, 0.06, gs); box(0.06, 2.62, 0.14, M.gold, -2.4, 0, 0.06, gs); box(0.06, 2.62, 0.14, M.gold, -0.2, 0, 0.06, gs);
  box(0.03, 1.1, 0.05, M.gold, -1.42, 0.8, 0.09, gs); box(0.03, 1.1, 0.05, M.gold, -1.18, 0.8, 0.09, gs);
  scene.remove(gs);
  box(0.2, 3.3, 0.35, M.anthracite, 0.82, 0, 0);
  // merdiven holü kapısı: bugün OSB, sonra siyah-altın portal
  const osb = grp(0, 0, 0);
  box(2.3, 2.9, 0.04, M.osb, 2.08, 0, 0.06, osb);
  box(0.12, 3.0, 0.14, std({ color: '#d0581f' }), 0.98, 0, 0.02, osb); box(0.12, 3.0, 0.14, std({ color: '#d0581f' }), 3.18, 0, 0.02, osb);
  stage(osb, 0, 4, 'swap');
  const por = grp(2.08, 0, 0);
  box(2.6, 0.7, 0.3, M.black, 0, 2.62, 0.05, por); plane(2.45, 0.6, M.portal, 0, 2.97, 0.215, 0, por);
  box(0.14, 2.62, 0.75, M.black, -1.23, 0, -0.18, por); box(0.14, 2.62, 0.75, M.black, 1.23, 0, -0.18, por);
  box(2.46, 0.06, 0.6, M.black, 0, 2.56, -0.25, por); stage(floorPlane(2.32, 0.55, M.blackMarble, 2.08, 0.012, -0.27), 4, 99, 'swap');
  box(2.6, 0.03, 0.31, M.led, 0, 2.6, 0.05, por);
  for (const [side, mat] of [[-1, M.doorL], [1, M.doorR]]) {
    const leaf = new THREE.Group(); leaf.position.set(side * 1.16, 0, -0.5); por.add(leaf); doorLeaves.push({ leaf, side });
    plane(1.12, 2.55, mat, -side * 0.56, 1.28, 0, 0, leaf);
    box(1.14, 0.04, 0.05, M.gold, -side * 0.57, 2.53, 0, leaf, false); box(1.14, 0.04, 0.05, M.gold, -side * 0.57, 0, 0, leaf, false);
    box(0.03, 1.2, 0.05, M.gold, -side * 1.0, 0.65, 0.05, leaf, false);
  }
  stage(por, 4, 99, 'grow');

  // yanlarda açık gri yatay çizgili kaplama, üstte koyu pano
  box(1.15, 8.6, 0.4, M.stripe, XR + 0.58, 0, 0); box(0.4, 8.6, 0.4, M.paintLight, XL - 0.2, 0, 0);
  box(7.4, 2.2, 0.35, M.anthracite, -0.15, 7.4, 0);
  // cephe — 1. kat
  box(6.98, 0.6, 0.35, M.anthracite, 0, 3.2, 0);
  plane(6.6, 3.2, M.glass, 0, 5.4, 0.0);
  for (const x of [XL, -1.26, 0.82, XR]) box(0.07, 3.2, 0.12, M.mullion, x, 3.8, 0);
  box(6.98, 0.45, 0.35, M.anthracite, 0, 7.0, 0);
  const ow = plane(6.62, 3.12, M.oneway, 0, 5.38, 0.075);        // ONE-WAY VISION: üst katın tüm camı
  stage(ow, 4, 99, 'swap');

}

/* ---------------------------------------------------------- çelik merdiven (U dönüşlü, boşluk 2,4 x 4,7 m) */
function buildStairs() {
  const steps = 12, rise = F1 / 2 / steps, tread = 0.27;
  const zs = -2.1, zl = zs - steps * tread;                   // -2.1 → -5.34, sahanlık -5.34 … -6.6
  const A = { x0: 2.06, x1: 3.2 }, B = { x0: 0.86, x1: 2.0 };
  const make = (strMat, treadMat, from, to) => {
    const g = new THREE.Group(); scene.add(g);
    const ax = (A.x0 + A.x1) / 2, bx = (B.x0 + B.x1) / 2, w = A.x1 - A.x0;
    for (let i = 0; i < steps; i++) box(w, 0.05, tread, treadMat, ax, (i + 1) * rise - 0.05, zs - i * tread - tread / 2, g);
    box(B.x1 - A.x0 + w * 2 + 0.06, 0.12, 1.25, treadMat, (B.x0 + A.x1) / 2, F1 / 2 - 0.12, zl - 0.62, g);
    for (let i = 0; i < steps; i++) box(w, 0.05, tread, treadMat, bx, F1 / 2 + (i + 1) * rise - 0.05, zl + i * tread + tread / 2, g);
    const len = Math.hypot(steps * tread, F1 / 2), ang = Math.atan2(F1 / 2, steps * tread);
    for (const x of [A.x0, A.x1]) { const s = box(0.06, 0.3, len, strMat, x, 0, (zs + zl) / 2, g); s.position.y = F1 / 4 - 0.15; s.rotation.x = ang; }
    for (const x of [B.x0, B.x1]) { const s = box(0.06, 0.3, len, strMat, x, 0, (zs + zl) / 2, g); s.position.y = F1 * 0.75 - 0.15; s.rotation.x = -ang; }
    box(0.1, F1 / 2, 0.1, strMat, A.x0, 0, -6.55, g); box(0.1, F1 / 2, 0.1, strMat, B.x1, 0, -6.55, g);
    stage(g, from, to, 'swap'); return g;
  };
  make(M.primer, M.primer, 0, 3);
  make(M.steelBlack, M.oak, 3, 99);
  const rail = new THREE.Group(); scene.add(rail);
  const gr = (len, cx, cz, ry = 0) => { plane(len, 1.0, M.glass, cx, F1 + 0.5, cz, ry, rail); const h = box(len, 0.04, 0.05, M.gold, cx, F1 + 1.0, cz, rail, false); h.rotation.y = ry; };
  gr(VOID.z0 - VOID.z1, VOID.x0, (VOID.z0 + VOID.z1) / 2, Math.PI / 2);   // karşılama tarafı
  gr(A.x1 - A.x0 + 0.1, (A.x0 + A.x1) / 2, VOID.z0);                       // 1. kolun üstü
  stage(rail, 3, 99, 'grow');
}

/* ---------------------------------------------------------- 1. kat duvarları, tavan, tesisat */
function buildFloor1() {
  // dış duvar iç yüzleri
  wall(XL + 0.03, 0, XL + 0.03, ZH, F1, WH, 0.06, { from: 0 });
  wall(XR - 0.03, VOID.z1, XR - 0.03, ZB, F1, WH, 0.06, { from: 0 });
  wall(XR - 0.03, 0, XR - 0.03, VOID.z0, F1, WH, 0.06, { from: 0 });
  wall(AX1 - 0.03, ZB, AX1 - 0.03, ZE, F1, WH, 0.06, { from: 0 });
  wall(AX0 + 0.03, ZH, AX0 + 0.03, ZE, F1, WH, 0.06, { from: 0 });
  wall(AX0, ZE + 0.03, AX1, ZE + 0.03, F1, WH, 0.06, { from: 0 });
  wall(XL, ZH + 0.03, AX0, ZH + 0.03, F1, WH, 0.06, { from: 0 });
  // karşılama arka hattı (oda bloklarının ön duvarları; koridor ağzı açık)
  wall(CX1, ZP, XR, ZP); wall(XL, ZP, CX2, ZP);
  // koridor duvarları + D. odası kapı boşlukları
  wall(CX1, ZP, CX1, -7.3); wall(CX1, -8.2, CX1, ZB); wall(CX1, -7.3, CX1, -8.2, F1 + 2.2, WH - 2.2);
  wall(CX2, ZP, CX2, -7.2); wall(CX2, -8.1, CX2, ZB); wall(CX2, -7.2, CX2, -8.1, F1 + 2.2, WH - 2.2);
  // D. odası | muayene: iç sürgü kapı boşlukları
  wall(CX1, ZDM, 1.14, ZDM); wall(2.34, ZDM, XR, ZDM); wall(1.14, ZDM, 2.34, ZDM, F1 + 2.2, WH - 2.2);
  wall(CX2, ZDM, -0.96, ZDM); wall(-2.26, ZDM, XL, ZDM); wall(-2.26, ZDM, -0.96, ZDM, F1 + 2.2, WH - 2.2);
  // muayene arka duvarları
  wall(CX1, ZB, AX1, ZB); wall(XL, ZB, CX2, ZB);
  // WC'ler: Engelli WC (0,67 … 2,51) | WC (-1,26 … 0,67)
  wall(0.67, ZH, 0.67, ZE);
  wall(AX1, ZH, 1.75, ZH); wall(0.67, ZH, 0.85, ZH); wall(0.85, ZH, 1.75, ZH, F1 + 2.2, WH - 2.2);
  wall(0.67, ZH, 0.45, ZH); wall(-0.35, ZH, AX0, ZH); wall(-0.35, ZH, 0.45, ZH, F1 + 2.2, WH - 2.2);

  // şantiye: sprinkler hattı, gazbeton yığınları, iskele
  const site = new THREE.Group(); scene.add(site);
  { const p = cyl(0.05, 0.05, 16.5, M.red, 0.07, F1 + 2.85, -0.2, site, 10); p.rotation.x = -Math.PI / 2; }
  for (const z of [-3.5, -11]) { const p = cyl(0.05, 0.05, 6.5, M.red, XL + 0.1, F1 + 2.85, z, site, 10); p.rotation.z = -Math.PI / 2; }
  for (const [x, z] of [[-2, -3.2], [-2, -11], [2, -11.2], [1.4, -15.5]]) for (let k = 0; k < 3; k++) box(1.2, 0.25, 0.6, M.block, x + (k % 2) * 0.1, F1 + k * 0.25, z, site);
  const sc = grp(-2.9, F1, -4.6, 0, site);
  for (const [x, z] of [[0, 0], [1.6, 0], [0, 0.8], [1.6, 0.8]]) cyl(0.025, 0.025, 2.2, M.chrome, x, 0, z, sc, 8);
  for (const y of [0.9, 1.8]) { box(1.65, 0.04, 0.04, M.chrome, 0.8, y, 0, sc); box(1.65, 0.04, 0.04, M.chrome, 0.8, y, 0.8, sc); }
  stage(site, 0, 3, 'swap');

  // asma tavan: ızgara (aşama 2) + paneller (aşağıdan görünür)
  const gridG = new THREE.Group(); scene.add(gridG);
  for (let x = -3.0; x <= 3.1; x += 1.2) box(0.03, 0.03, 17, M.grid, x, F1 + 2.72, -8.5, gridG, false);
  for (let z = -0.5; z >= -16.7; z -= 1.2) box(6.6, 0.03, 0.03, M.grid, 0, F1 + 2.72, z, gridG, false);
  stage(gridG, 2, 3, 'swap');
  for (const [w, d, cx, cz] of [[6.68, 14.3, 0, -7.15], [AX1 - AX0, ZH - ZE, (AX0 + AX1) / 2, (ZH + ZE) / 2]]) {
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, F1 + 2.75, cz); scene.add(ceil); stage(ceil, 2, 99, 'swap');
  }
  const dl = new THREE.Group(); scene.add(dl);
  const spots = [[-2.5, -1], [-1, -1], [0.3, -1], [-2.5, -3], [-1, -3], [0.2, -3.2], [-2.5, -5], [-1, -5], [0.2, -5.4], [0.07, -7.5], [0.07, -9.5], [0.07, -11.5], [2, -8.1], [2, -11.2], [-2, -8.1], [-2, -11.2], [0.5, -13.5], [-2.2, -13.5], [1.6, -15.6], [-0.3, -15.6], [2.1, -0.9]];
  for (const [x, z] of spots) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), M.downlight); s.rotation.x = Math.PI / 2; s.position.set(x, F1 + 2.74, z); dl.add(s); }
  stage(dl, 3, 99, 'swap');

  // kapılar (aşama 2): koridora açılan D. odası kapıları, iç buzlu cam sürgüler, WC kapıları
  const doors = new THREE.Group(); scene.add(doors);
  // D. odaları: otomatik camlı sürgü kapı (koridor tarafında ray kutusu + sensör)
  for (const [x, zc, dir, film] of [[CX1 - 0.09, -7.75, -1, M.hexD1], [CX2 + 0.09, -7.65, 1, M.hexD2]]) {
    const pg = plane(0.96, 2.18, M.autoGlass, x, F1 + 1.09, zc, Math.PI / 2, doors);
    plane(0.94, 2.16, film, x + dir * 0.012, F1 + 1.09, zc, dir > 0 ? Math.PI / 2 : -Math.PI / 2, doors);
    box(0.05, 2.2, 0.03, M.steelBlack, x, F1, zc - 0.48, doors, false).rotation.y = Math.PI / 2;
    box(0.05, 2.2, 0.03, M.steelBlack, x, F1, zc + 0.48, doors, false).rotation.y = Math.PI / 2;
    const hd = box(0.14, 0.16, 2.0, M.steelBlack, x + dir * 0.03, F1 + 2.2, zc - 0.5, doors, false);
    box(0.03, 0.03, 0.12, M.sensor, x + dir * 0.11, F1 + 2.24, zc, doors, false);
    box(0.02, 0.06, 0.9, M.gold, x + dir * 0.005, F1 + 1.02, zc, doors, false);
  }
  for (const [x0, x1] of [[1.14, 2.34], [-2.26, -0.96]]) {
    plane((x1 - x0) / 2 + 0.05, 2.15, M.autoGlass, x0 + (x1 - x0) * 0.25, F1 + 1.08, ZDM, 0, doors);
    plane((x1 - x0) / 2 + 0.03, 2.13, M.hexDoor, x0 + (x1 - x0) * 0.25, F1 + 1.08, ZDM + 0.012, 0, doors);
    box(x1 - x0 + 0.3, 0.07, 0.06, M.steelBlack, (x0 + x1) / 2, F1 + 2.18, ZDM + 0.05, doors, false);
  }
  plane(0.9, 2.15, M.anthracite, 1.3, F1 + 1.08, ZH + 0.02, 0, doors); plane(0.8, 2.15, M.anthracite, 0.05, F1 + 1.08, ZH + 0.02, 0, doors);
  box(0.03, 0.5, 0.05, M.gold, 0.92, F1 + 0.8, ZH + 0.05, doors, false); box(0.03, 0.5, 0.05, M.gold, 0.4, F1 + 0.8, ZH + 0.05, doors, false);
  plane(0.36, 0.36, M.signEngelli, 1.3, F1 + 1.6, ZH + 0.035, 0, doors); plane(0.32, 0.32, M.signWC, 0.05, F1 + 1.6, ZH + 0.035, 0, doors);
  stage(doors, 2, 99, 'grow');
}

/* ---------------------------------------------------------- mobilya & cihaz parçaları */
function armchair(x, z, ry, mat, parent = scene) {
  const g = grp(x, F1, z, ry, parent);
  box(0.78, 0.22, 0.72, mat, 0, 0.22, 0, g); box(0.78, 0.5, 0.14, mat, 0, 0.42, -0.31, g);
  box(0.12, 0.3, 0.7, mat, -0.37, 0.4, 0, g); box(0.12, 0.3, 0.7, mat, 0.37, 0.4, 0, g);
  for (const [a, b] of [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]]) cyl(0.015, 0.015, 0.22, M.gold, a, 0, b, g, 8);
  return g;
}
function swivelChair(x, z, ry, mat, parent = scene, high = false) {
  const g = grp(x, F1, z, ry, parent);
  for (let i = 0; i < 5; i++) { const l = box(0.34, 0.03, 0.04, M.gold, 0, 0.05, 0, g, false); l.rotation.y = i * Math.PI * 2 / 5; l.geometry.translate(0.17, 0, 0); }
  cyl(0.03, 0.03, 0.35, M.gold, 0, 0.05, 0, g, 10);
  box(0.6, 0.12, 0.58, mat, 0, 0.4, 0, g);
  box(0.6, high ? 0.75 : 0.42, 0.1, mat, 0, 0.5, -0.27, g);
  if (!high) { box(0.08, 0.2, 0.5, mat, -0.3, 0.5, 0, g); box(0.08, 0.2, 0.5, mat, 0.3, 0.5, 0, g); }
  return g;
}
function sofa(x, z, ry, len, parent = scene) {
  const g = grp(x, F1, z, ry, parent);
  box(len, 0.24, 0.9, M.taupeFab, 0, 0.18, 0, g); box(len, 0.5, 0.2, M.taupeFab, 0, 0.42, -0.36, g);
  box(0.18, 0.32, 0.9, M.taupeFab, -len / 2 + 0.09, 0.4, 0, g); box(0.18, 0.32, 0.9, M.taupeFab, len / 2 - 0.09, 0.4, 0, g);
  for (let i = 0; i < 3; i++) box(0.42, 0.38, 0.14, i === 1 ? M.cream : M.anthracite, -len / 3 + i * len / 3, 0.44, -0.2, g);
  box(len, 0.18, 0.86, M.gold, 0, 0, 0, g).scale.set(1, 1, 1);
  return g;
}
function plant(x, z, s = 1, parent = scene, y = F1) {
  const g = grp(x, y, z, 0, parent);
  cyl(0.16 * s, 0.12 * s, 0.32 * s, M.pot, 0, 0, 0, g);
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry((0.18 + rnd() * 0.1) * s, 0), M.green); c.position.set((rnd() - 0.5) * 0.25 * s, (0.45 + rnd() * 0.35) * s, (rnd() - 0.5) * 0.25 * s); c.castShadow = true; g.add(c); }
  return g;
}
function oliveTree(x, z, parent = scene) {
  const g = grp(x, F1, z, 0, parent);
  cyl(0.28, 0.22, 0.5, M.pot, 0, 0, 0, g); box(0.5, 0.02, 0.02, M.gold, 0, 0.48, 0.27, g, false);
  cyl(0.04, 0.05, 1.2, M.oak, 0, 0.5, 0, g, 8);
  for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + rnd() * 0.12, 0), M.green); c.position.set((rnd() - 0.5) * 0.8, 1.4 + rnd() * 0.8, (rnd() - 0.5) * 0.8); g.add(c); }
  return g;
}
function usMachine(x, z, ry, parent = scene) {
  const g = grp(x, F1, z, ry, parent);
  for (const [a, b] of [[-0.24, -0.3], [0.24, -0.3], [-0.24, 0.3], [0.24, 0.3]]) cyl(0.05, 0.05, 0.1, M.black, a, 0, b, g, 10);
  box(0.62, 0.08, 0.78, M.white, 0, 0.1, 0, g);
  box(0.52, 0.62, 0.6, M.white, 0, 0.18, -0.02, g);
  box(0.06, 0.6, 0.62, M.black, -0.28, 0.18, -0.02, g);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), M.chrome); logo.position.set(0, 0.5, 0.29); g.add(logo);
  box(0.12, 0.25, 0.12, M.anthracite, 0, 0.8, -0.15, g);
  const pnl = box(0.7, 0.07, 0.48, M.white, 0, 1.0, 0.05, g); pnl.rotation.x = -0.18;
  const tp = plane(0.32, 0.2, M.usScreen, 0, 1.17, -0.12, 0, g); tp.rotation.x = -0.5;
  usDetails(g);
  box(0.06, 0.45, 0.06, M.anthracite, 0, 1.05, -0.22, g);
  const mon = box(0.66, 0.44, 0.05, M.black, 0, 1.5, -0.2, g);
  plane(0.6, 0.38, M.usScreen, 0, 1.72, -0.172, 0, g);
  return g;
}
function examBed(x, z, ry, parent = scene, mat = M.greyLeather) {
  const g = grp(x, F1, z, ry, parent);
  box(0.66, 0.6, 1.7, M.cream, 0, 0, 0.1, g);
  box(0.72, 0.1, 1.5, mat, 0, 0.62, 0.2, g);
  const hd = box(0.72, 0.1, 0.6, mat, 0, 0.62, 0, g); hd.position.z = -0.6; hd.rotation.x = 0.35;
  box(0.7, 0.012, 1.48, M.white, 0, 0.725, 0.21, g, false);
  cyl(0.06, 0.06, 0.66, M.white, 0, 0.55, 0.98, g, 12).rotation.z = Math.PI / 2;
  return g;
}
function stool(x, z, parent = scene) {
  const g = grp(x, F1, z, 0, parent);
  for (let i = 0; i < 5; i++) { const l = box(0.26, 0.025, 0.035, M.chrome, 0, 0.04, 0, g, false); l.rotation.y = i * Math.PI * 2 / 5; l.geometry.translate(0.13, 0, 0); }
  cyl(0.025, 0.025, 0.45, M.chrome, 0, 0.05, 0, g, 8); cyl(0.2, 0.2, 0.09, M.greyLeather, 0, 0.5, 0, g);
  return g;
}
function sinkUnit(x, z, ry, parent = scene) {
  const g = grp(x, F1, z, ry, parent);
  box(0.9, 0.55, 0.48, M.paintLight, 0, 0.3, 0, g); box(0.92, 0.06, 0.5, M.white, 0, 0.85, 0, g);
  box(0.42, 0.12, 0.32, M.white, 0, 0.91, 0, g); cyl(0.015, 0.015, 0.25, M.chrome, 0, 0.91, -0.2, g, 8);
  const m = new THREE.Mesh(hexRingGeo(0.42, 0.03, 0.03), M.led); m.position.set(0, 1.75, -0.24); g.add(m);
  const mi = new THREE.Mesh(hexDiscGeo(0.4, 0.01), M.chrome); mi.position.set(0, 1.75, -0.235); g.add(mi);
  return g;
}
function coatHooks(x, z, ry, parent = scene) {
  const g = grp(x, F1, z, ry, parent);
  box(0.9, 0.06, 0.04, M.black, 0, 1.75, 0, g);
  box(0.28, 0.75, 0.08, M.cream, -0.3, 1.0, 0.05, g); box(0.26, 0.7, 0.08, M.anthracite, 0, 1.05, 0.05, g); box(0.22, 0.28, 0.08, M.black, 0.32, 1.35, 0.05, g);
  return g;
}

/* ---------------------------------------------------------- odalar (proje planına göre) */
function roomSkin(x0, x1, z0, z1, mat, parent) {   // oda iç yüzlerine tema boyası
  const h = WH - 0.02, y = F1 + h / 2, w = x1 - x0, d = z0 - z1;
  plane(w - 0.14, h, mat, (x0 + x1) / 2, y, z0 - 0.065, 0, parent);
  plane(w - 0.14, h, mat, (x0 + x1) / 2, y, z1 + 0.065, Math.PI, parent);
  plane(d - 0.14, h, mat, x0 + 0.065, y, (z0 + z1) / 2, Math.PI / 2, parent);
  plane(d - 0.14, h, mat, x1 - 0.065, y, (z0 + z1) / 2, -Math.PI / 2, parent);
}
function officeDesk(x, z, ry, y = F1, base = M.anthracite, top = M.white) {
  const dk = grp(x, y, z, ry);
  box(1.5, 0.72, 0.65, base, 0, 0, 0, dk); box(1.6, 0.04, 0.72, top, 0, 0.72, 0, dk);
  box(0.03, 0.72, 0.66, M.gold, -0.75, 0, 0, dk, false); box(0.03, 0.72, 0.66, M.gold, 0.75, 0, 0, dk, false);
  box(0.5, 0.34, 0.03, M.chrome, 0.3, 0.95, -0.12, dk); box(0.1, 0.2, 0.07, M.chrome, 0.3, 0.76, -0.12, dk);
  cyl(0.02, 0.05, 0.38, M.gold, -0.55, 0.76, -0.18, dk, 8);
  return dk;
}
function toilet(x, z, ry) {
  const g = grp(x, F1, z, ry);
  box(0.38, 0.4, 0.55, M.white, 0, 0, 0.05, g); box(0.4, 0.06, 0.5, M.white, 0, 0.4, 0.07, g); box(0.42, 0.38, 0.16, M.white, 0, 0.42, -0.22, g);
  return g;
}
function wcSink(x, z, ry) {
  const g = grp(x, F1, z, ry);
  box(0.55, 0.14, 0.42, M.white, 0, 0.78, 0, g); cyl(0.012, 0.012, 0.22, M.chrome, 0, 0.9, -0.16, g, 8);
  box(0.5, 0.7, 0.02, M.mirror, 0, 1.15, -0.2, g);
  return g;
}

/* ---------------------------------------------------------- ultrason odası detayları */
function keysCanvas() {
  const [c, g] = cnv(256, 160); g.fillStyle = '#f2f1ee'; g.fillRect(0, 0, 256, 160);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) { g.fillStyle = (r + k) % 5 === 0 ? '#5aa7d6' : '#2d2e31'; g.beginPath(); g.arc(18 + k * 24, 22 + r * 20, 7, 0, 7); g.fill(); }
  g.fillStyle = '#9fa3a8'; g.beginPath(); g.arc(128, 128, 20, 0, 7); g.fill();
  for (let i = 0; i < 6; i++) { g.fillStyle = '#d6d7da'; g.fillRect(30 + i * 34, 106, 22, 40); }
  return c;
}
function probeAndCable(parent, x, y, z, side) {
  const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.09, 4, 8), M.anthracite); p.position.set(x, y, z); p.rotation.z = side * 0.3; parent.add(p);
  const pts = [new THREE.Vector3(x, y - 0.06, z), new THREE.Vector3(x + side * 0.08, y - 0.45, z + 0.06), new THREE.Vector3(x + side * 0.02, y - 0.75, z + 0.02), new THREE.Vector3(x - side * 0.05, y - 0.55, z - 0.05), new THREE.Vector3(x - side * 0.1, y - 0.25, z - 0.12)];
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.008, 6), M.anthracite); parent.add(tube);
}
function usDetails(g) {   // usMachine grubuna: klavye, trackball, prob tutucular, kablolar, jel
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38), new THREE.MeshStandardMaterial({ map: tex(keysCanvas()), roughness: 0.5 }));
  kb.rotation.x = -Math.PI / 2 - 0.18; kb.position.set(0, 1.075, 0.06); g.add(kb);
  const tb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), M.chrome); tb.position.set(0, 1.09, 0.2); g.add(tb);
  for (const [xo, side] of [[-0.38, -1], [0.38, 1]]) {
    box(0.08, 0.1, 0.08, M.anthracite, xo, 1.0, 0.22, g, false);
    probeAndCable(g, xo, 1.14, 0.22, side);
  }
  probeAndCable(g, 0.38, 1.14, 0.12, 1);
  cyl(0.03, 0.03, 0.14, M.gelBlue, -0.3, 1.1, -0.12, g, 10);
}
function trolley(x, z, ry = 0) {   // girişimsel işlem arabası: paslanmaz 2 kat, steril örtü, set
  const g = grp(x, F1, z, ry);
  for (const [a, b] of [[-0.25, -0.18], [0.25, -0.18], [-0.25, 0.18], [0.25, 0.18]]) { cyl(0.012, 0.012, 0.85, M.chrome, a, 0.06, b, g, 8); cyl(0.03, 0.03, 0.05, M.black, a, 0, b, g, 8); }
  box(0.56, 0.02, 0.42, M.chrome, 0, 0.35, 0, g); box(0.56, 0.02, 0.42, M.chrome, 0, 0.9, 0, g);
  box(0.5, 0.005, 0.38, M.drape, 0, 0.915, 0, g, false);
  box(0.2, 0.02, 0.12, M.chrome, -0.1, 0.92, 0.05, g, false);
  for (let i = 0; i < 3; i++) { const sy = cyl(0.008, 0.008, 0.12, M.white, 0.08 + i * 0.04, 0.925, -0.05, g, 6); sy.rotation.z = Math.PI / 2; sy.position.y = 0.93; }
  box(0.22, 0.12, 0.16, M.white, -0.1, 0.37, 0, g); box(0.14, 0.1, 0.1, M.gelBlue, 0.14, 0.37, 0.05, g);
  return g;
}
function curtainRail(x0, x1, z0, z1, drawSide, parent) {   // tavan perde rayı + toplanmış perde
  const y = F1 + 2.62, g = new THREE.Group(); parent.add(g);
  box(x1 - x0, 0.03, 0.03, M.chrome, (x0 + x1) / 2, y, z0, g, false); box(0.03, 0.03, z0 - z1, M.chrome, x0, y, (z0 + z1) / 2, g, false); box(0.03, 0.03, z0 - z1, M.chrome, x1, y, (z0 + z1) / 2, g, false);
  const len = 0.7, cx = drawSide > 0 ? x1 - len / 2 - 0.05 : x0 + len / 2 + 0.05;
  for (let i = 0; i < 7; i++) box(len / 7 * 0.8, 2.0, 0.05, M.curtain, cx - len / 2 + i * len / 7 + 0.04, y - 2.05, z0 + (i % 2 ? 0.03 : -0.03), g, false);
  return g;
}
function wallKit(x, z, ry) {   // eldiven kutusu, kağıt havlu, kesici-delici kutusu, tıbbi atık
  const g = grp(x, F1, z, ry);
  box(0.3, 0.42, 0.1, M.white, -0.45, 1.3, 0.05, g);
  for (let i = 0; i < 3; i++) box(0.26, 0.11, 0.08, [M.gelBlue, M.white, M.lavender][i], -0.45, 1.33 + i * 0.12, 0.08, g, false);
  box(0.3, 0.36, 0.12, M.chrome, 0.05, 1.35, 0.06, g);
  box(0.16, 0.24, 0.12, M.sharps, 0.45, 0.95, 0.06, g); box(0.16, 0.04, 0.12, M.redLid, 0.45, 1.19, 0.06, g, false);
  cyl(0.15, 0.13, 0.42, M.chrome, 0.45, 0, 0.2, g, 16); cyl(0.155, 0.155, 0.03, M.sharps, 0.45, 0.42, 0.2, g, 16);
  return g;
}
function wallClock(x, z, ry) {
  const g = grp(x, F1 + 2.2, z, ry);
  const f = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 32), M.white); f.rotation.x = Math.PI / 2; f.position.z = 0.02; g.add(f);
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 32), M.gold); r.position.z = 0.035; g.add(r);
  box(0.012, 0.1, 0.005, M.black, 0, 0, 0.04, g, false).rotation.z = 0.6; box(0.01, 0.13, 0.005, M.black, 0, 0, 0.042, g, false).rotation.z = -1.9;
  return g;
}
function examLamp(x, z) {
  const g = grp(x, F1, z, 0);
  cyl(0.18, 0.2, 0.04, M.white, 0, 0, 0, g, 20); cyl(0.015, 0.015, 1.3, M.chrome, 0, 0.04, 0, g, 8);
  const arm = box(0.02, 0.02, 0.5, M.chrome, 0, 1.34, -0.25, g, false); arm.rotation.x = -0.4;
  const head = cyl(0.1, 0.07, 0.08, M.white, 0, 1.42, -0.48, g, 16); head.rotation.x = 0.5;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), M.downlight); lens.position.set(0, 1.42, -0.52); lens.rotation.x = -Math.PI / 2 + 0.5; g.add(lens);
  return g;
}
function bedStep(x, z, ry) {
  const g = grp(x, F1, z, ry);
  box(0.42, 0.02, 0.24, M.anthracite, 0, 0.2, 0.1, g); box(0.42, 0.02, 0.24, M.anthracite, 0, 0.38, -0.1, g);
  for (const a of [-0.2, 0.2]) { box(0.02, 0.4, 0.02, M.chrome, a, 0, 0.2, g, false); box(0.02, 0.4, 0.02, M.chrome, a, 0, -0.2, g, false); }
  return g;
}

function accentWalls() {   // antrasit vurgular: koridor duvarları, lobi bölme duvarı, muayene yatak arkası
  const g = new THREE.Group(); scene.add(g);
  const h = WH - 0.02, y = F1 + h / 2;
  const zseg = (x, za, zb, ry) => plane(za - zb, h, M.anthraWall, x, y, (za + zb) / 2, ry, g);
  zseg(CX1 - 0.065, ZP, -7.3, -Math.PI / 2); zseg(CX1 - 0.065, -8.2, ZB, -Math.PI / 2); plane(0.9, WH - 2.2, M.anthraWall, CX1 - 0.065, F1 + 2.2 + (WH - 2.2) / 2, -7.75, -Math.PI / 2, g);
  zseg(CX2 + 0.065, ZP, -7.2, Math.PI / 2); zseg(CX2 + 0.065, -8.1, ZB, Math.PI / 2); plane(0.9, WH - 2.2, M.anthraWall, CX2 + 0.065, F1 + 2.2 + (WH - 2.2) / 2, -7.65, Math.PI / 2, g);
  plane(CX2 - XL - 0.1, h, M.anthraWall, (XL + CX2) / 2, y, ZP + 0.065, 0, g);
  plane(XR - CX1 - 0.1, h, M.anthraWall, (CX1 + XR) / 2, y, ZP + 0.065, 0, g);
  plane(XR - CX1 - 0.14, h, M.anthraWall, (CX1 + XR) / 2, y, ZB + 0.065, 0, g);
  plane(CX2 - XL - 0.14, h, M.anthraWall, (XL + CX2) / 2, y, ZB + 0.065, 0, g);
  stage(g, 3, 99, 'swap');
}

function buildFinish() {
  accentWalls();
  const add = (o, from = 5) => stage(o, from, 99, 'grow');
  const hexAreas = [[1.9, 3.1, -2.35, -2.15], [2.8, 2.4, -1.9, -5.2], [2.0, 2.2, 1.95, -8.2], [2.0, 2.2, -2.0, -8.2], [2.2, 2.6, 2.0, -11.1], [2.2, 2.6, -2.0, -11.1]];
  for (const [w, d, cx, cz] of hexAreas) stage(floorPlane(w, d, std({ map: tex(hexFloorCanvas(w, d)), roughness: 0.25 }), cx, F1 + 0.008, cz), 3, 99, 'swap');

  /* — KARŞILAMA VE BEKLEME (36 m²) — */
  const fw = new THREE.Group(); scene.add(fw);             // MD duvarı: banko arkası, sol dış duvar
  plane(3.4, WH, M.blackMarble, XL + 0.07, F1 + WH / 2, -2.2, Math.PI / 2, fw);
  for (let i = 0; i < 4; i++) { box(0.08, WH, 0.05, M.black, XL + 0.1, F1, -0.3 - i * 0.09, fw, false); box(0.08, WH, 0.05, M.black, XL + 0.1, F1, -4.1 + i * 0.09, fw, false); }
  box(0.02, WH, 0.02, M.led, XL + 0.13, F1, -0.5, fw, false); box(0.02, WH, 0.02, M.led, XL + 0.13, F1, -3.9, fw, false);
  const lg = plane(1.4, 1.4, M.logo, XL + 0.12, F1 + 1.85, -2.2, Math.PI / 2, fw);
  const ring = (r, t, x, y, z, mat, d = 0.02) => { const m = new THREE.Mesh(hexRingGeo(r, t, d), mat); m.position.set(x, y, z); m.rotation.y = Math.PI / 2; fw.add(m); return m; };
  ring(0.76, 0.04, XL + 0.09, F1 + 1.85, -2.2, M.led);
  for (const [dz, dy, r] of [[1.05, 0.55, 0.2], [1.15, -0.45, 0.16], [-1.05, 0.6, 0.18], [-1.15, -0.4, 0.22], [0.55, 1.0, 0.12], [-0.6, -1.0, 0.12]]) {
    ring(r, 0.035, XL + 0.1, F1 + 1.85 + dy, -2.2 + dz, M.led, 0.03);
    const d = new THREE.Mesh(hexDiscGeo(r - 0.04, 0.02), M.black); d.rotation.y = Math.PI / 2; d.position.set(XL + 0.11, F1 + 1.85 + dy, -2.2 + dz); fw.add(d);
  }
  stage(fw, 3, 99, 'swap');
  // L banko (plandaki gibi: personel duvar tarafında, önü merdiven/giriş yönüne)
  const desk = new THREE.Group(); scene.add(desk);
  box(0.62, 1.05, 2.0, M.white, -1.95, F1, -2.3, desk); box(0.7, 0.05, 2.08, M.blackMarble, -1.95, F1 + 1.05, -2.3, desk);
  box(1.3, 1.05, 0.32, M.white, -2.3, F1, -3.16, desk); box(1.38, 0.05, 0.4, M.blackMarble, -2.3, F1 + 1.05, -3.16, desk);
  box(0.3, 0.05, 1.4, M.blackMarble, -1.6, F1 + 1.14, -2.2, desk);
  for (let i = 0; i < 6; i++) box(0.04, 1.0, 0.06, M.black, -1.63, F1, -1.55 - i * 0.1, desk, false);
  box(0.02, 0.025, 2.0, M.led, -1.62, F1 + 0.03, -2.3, desk, false);
  box(0.03, 0.34, 0.48, M.chrome, -2.15, F1 + 1.1, -1.9, desk); plane(0.44, 0.28, M.queue, -2.17, F1 + 1.3, -1.9, -Math.PI / 2, desk);
  box(0.03, 0.34, 0.48, M.chrome, -2.15, F1 + 1.1, -2.7, desk);
  add(desk);
  add(swivelChair(-2.75, -1.75, Math.PI / 2, M.cream)); add(swivelChair(-2.75, -2.55, Math.PI / 2, M.cream));
  const ch = grp(-2.2, F1 + 2.2, -2.3, 0);
  for (const [r, y] of [[0.5, 0], [0.34, -0.16]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 48), M.gold); t.rotation.x = Math.PI / 2; t.position.y = y; ch.add(t); const l = new THREE.Mesh(new THREE.TorusGeometry(r - 0.01, 0.012, 6, 48), M.led); l.rotation.x = Math.PI / 2; l.position.y = y - 0.03; ch.add(l); }
  stage(ch, 3, 99, 'grow');
  // bekleme: duvar boyu kanepe, sehpa, iki berjer
  add(sofa(-2.9, -5.0, Math.PI / 2, 1.8));
  const ct = grp(-2.0, F1, -5.1); box(0.55, 0.04, 0.95, M.blackMarble, 0, 0.42, 0, ct); for (const [a, b] of [[-0.24, -0.43], [0.24, -0.43], [-0.24, 0.43], [0.24, 0.43]]) cyl(0.012, 0.012, 0.42, M.gold, a, 0, b, ct, 6); add(ct);
  add(armchair(-0.95, -4.45, -Math.PI / 2)); add(armchair(-0.95, -5.8, -Math.PI / 2));
  add(oliveTree(-2.9, -0.6)); add(plant(0.35, -6.25, 1.0));
  // bölme duvarı üzerinde ışıklı altıgen raf (D. Odası 2 ön duvarı, lobi tarafı)
  const sh = new THREE.Group(); scene.add(sh);
  const hr = 0.3, hw = Math.sqrt(3) * hr;
  [[0, 0], [1, 0], [2, 0], [3, 0], [0.5, 1], [1.5, 1], [2.5, 1], [1, 2], [2, 2]].forEach(([c, r], i) => {
    const rg = new THREE.Mesh(hexRingGeo(hr, 0.035, 0.26), i % 3 === 1 ? M.black : M.white); rg.position.set(-0.95 - c * hw * 0.98, F1 + 1.15 + r * 1.5 * hr * 0.98, ZP + 0.06); sh.add(rg);
    const bk = new THREE.Mesh(hexDiscGeo(hr - 0.035, 0.01), i % 3 === 1 ? M.anthracite : M.ledSoft); bk.position.set(rg.position.x, rg.position.y, ZP + 0.065); sh.add(bk);
    if (i % 2 === 0) plant(rg.position.x, ZP + 0.2, 0.4, sh, rg.position.y - 0.24);
  });
  stage(sh, 5, 99, 'grow');
  const q = grp(1.95, F1, ZP + 0.07, 0); box(1.1, 0.6, 0.05, M.black, 0, 1.6, 0, q); plane(1.04, 0.54, M.queue, 0, 1.9, 0.03, 0, q); add(q);   // boşluğun arkasında sıra ekranı

  /* — D. ODASI 1 (8 m²) + MUAYENE 1 (8,1 m²) — */
  const d1 = new THREE.Group(); scene.add(d1);
  // tema 1: inci beyazı duvarlar, antrasit dolap ve masa, altın detaylar
  roomSkin(CX1, XR, ZP, ZDM, M.pearlWall, d1);
  box(2.3, 2.6, 0.5, M.anthracite, 1.99, F1, ZP - 0.28, d1);
  box(0.02, WH, 0.02, M.led, CX1 + 0.08, F1, ZDM + 0.08, d1, false); box(2.5, 0.03, 0.03, M.gold, 2.04, F1 + 2.6, ZDM + 0.08, d1, false);
  for (const x of [1.4, 1.9, 2.4]) box(0.02, 1.0, 0.03, M.gold, x, F1 + 0.9, ZP - 0.54, d1, false);
  box(0.03, 1.0, 1.0, M.gold, XR - 0.05, F1 + 1.1, -8.5, d1, false); plane(0.95, 0.95, M.artHex, XR - 0.07, F1 + 1.6, -8.5, -Math.PI / 2, d1);
  stage(d1, 5, 99, 'grow');
  add(officeDesk(2.5, -8.5, -Math.PI / 2));
  add(swivelChair(3.0, -8.5, -Math.PI / 2, M.anthraciteLeather, scene, true));
  add(swivelChair(1.75, -8.05, Math.PI / 2, M.pearlLeather)); add(swivelChair(1.75, -8.95, Math.PI / 2, M.pearlLeather));
  const m1 = new THREE.Group(); scene.add(m1);
  box(0.06, 0.82, 1.4, M.black, CX1 + 0.06, F1 + 1.3, -11.0, m1, false); plane(1.32, 0.74, M.fetus, CX1 + 0.1, F1 + 1.71, -11.0, Math.PI / 2, m1);
  stage(m1, 5, 99, 'grow');
  add(examBed(2.0, -12.15, Math.PI / 2)); add(usMachine(1.15, -11.15, 0.9)); add(stool(1.65, -11.2));
  add(sinkUnit(XR - 0.3, -10.2, -Math.PI / 2)); add(coatHooks(3.0, ZDM - 0.08, Math.PI));
  add(trolley(3.0, -11.55, -Math.PI / 2)); add(wallKit(XR - 0.06, -10.95, -Math.PI / 2)); add(examLamp(0.98, -12.4)); add(bedStep(2.1, -11.55, 0));
  add(wallClock(1.5, ZDM - 0.07, Math.PI));
  { const cr = new THREE.Group(); scene.add(cr); curtainRail(1.0, 3.25, -11.35, -12.62, 1, cr); stage(cr, 5, 99, 'grow'); }

  /* — D. ODASI 2 (8,7 m²) + MUAYENE 2 (8,5 m²) — */
  const d2 = new THREE.Group(); scene.add(d2);
  // tema 2 (açık): sıcak beyaz duvarlar, açık meşe ve krem, şampanya altın
  roomSkin(XL, CX2, ZP, ZDM, M.warmWhite, d2);
  box(1.18, 2.6, 0.42, M.lightOak, -2.75, F1, -9.38, d2);
  for (let i = 0; i < 4; i++) { box(1.1, 0.03, 0.02, M.led, -2.75, F1 + 0.6 + i * 0.5, -9.16, d2, false); }
  box(0.03, 1.0, 1.0, M.gold, XL + 0.05, F1 + 1.1, -7.6, d2, false); plane(0.95, 0.95, M.artHex, XL + 0.07, F1 + 1.6, -7.6, Math.PI / 2, d2);
  box(0.02, WH, 0.02, M.led, XL + 0.08, F1, -6.8, d2, false);
  stage(d2, 5, 99, 'grow');
  add(officeDesk(-2.45, -7.65, Math.PI / 2, F1, M.lightOak, M.pearlWall));
  add(swivelChair(-3.0, -7.65, Math.PI / 2, M.taupeLeather, scene, true));
  add(swivelChair(-1.7, -7.2, -Math.PI / 2, M.boucle)); add(swivelChair(-1.7, -8.1, -Math.PI / 2, M.boucle));
  add(plant(-1.0, -9.15, 0.9));
  const m2 = new THREE.Group(); scene.add(m2);
  plane(0.9, 1.15, M.artCurve, CX2 - 0.06, F1 + 1.6, -11.2, -Math.PI / 2, m2);
  stage(m2, 5, 99, 'grow');
  add(examBed(-2.2, -12.1, -Math.PI / 2)); add(usMachine(-1.05, -11.1, -0.9)); add(stool(-1.6, -11.15));
  add(sinkUnit(XL + 0.3, -10.2, Math.PI / 2)); add(coatHooks(-3.0, ZDM - 0.08, Math.PI));
  add(trolley(-3.0, -11.55, Math.PI / 2)); add(wallKit(XL + 0.06, -10.95, Math.PI / 2)); add(examLamp(-0.88, -12.4)); add(bedStep(-2.2, -11.55, 0));
  add(wallClock(-1.6, ZDM - 0.07, Math.PI));
  { const tv = new THREE.Group(); scene.add(tv); box(1.2, 0.7, 0.05, M.black, -2.2, F1 + 1.35, ZB + 0.07, tv, false); plane(1.12, 0.62, M.usScreen, -2.2, F1 + 1.7, ZB + 0.1, 0, tv); stage(tv, 5, 99, 'grow'); }
  { const cr = new THREE.Group(); scene.add(cr); curtainRail(-3.25, -1.0, -11.35, -12.62, -1, cr); stage(cr, 5, 99, 'grow'); }

  /* — KORİDOR + ARKA HOL — */
  const cor = new THREE.Group(); scene.add(cor);
  box(0.03, 1.4, 0.6, M.gold, CX2 - 0.02, F1 + 0.6, -10.4, cor, false); plane(0.54, 1.34, M.mirror, CX2 + 0.01, F1 + 1.3, -10.4, Math.PI / 2, cor);
  box(0.03, 1.0, 0.8, M.gold, CX1 + 0.02, F1 + 1.0, -9.9, cor, false); plane(0.75, 0.95, M.artHex, CX1 - 0.01, F1 + 1.5, -9.9, -Math.PI / 2, cor);
  stage(cor, 5, 99, 'grow');
  add(plant(-2.95, -13.95, 1.1)); add(plant(2.15, -13.0, 1.0));

  /* — ENGELLİ WC (6 m²) + WC (5 m²) — */
  const wc = new THREE.Group(); scene.add(wc);
  box(0.04, 0.04, 0.8, M.chrome, AX1 - 0.08, F1 + 0.75, -16.4, wc, false); box(0.04, 0.04, 0.7, M.chrome, 1.75, F1 + 0.75, -16.4, wc, false);
  stage(wc, 5, 99, 'grow');
  add(toilet(2.1, -16.65, 0)); add(wcSink(1.05, -16.8, 0));
  add(wcSink(AX0 + 0.25, -14.95, Math.PI / 2)); add(wcSink(AX0 + 0.25, -15.65, Math.PI / 2));
  add(toilet(0.2, -16.65, 0));
  stage(box(0.04, 2.0, 1.4, M.paintLight, -0.35, F1, -16.3), 5, 99, 'grow');

  /* — ZEMİN KAT · KARŞILAMA (eski eczane) — */
  const gf = new THREE.Group(); scene.add(gf);
  const gm = M.marble.clone(); gm.map = M.marble.map.clone(); gm.map.repeat.set(3.4, 7.5); gm.map.needsUpdate = true;
  floorPlane(4.04, 9, gm, -1.3, 0.015, -4.5, gf);
  floorPlane(3.3, 3.0, std({ map: tex(hexFloorCanvas(3.3, 3.0)), roughness: 0.25 }), -1.3, 0.02, -7.0, gf);
  plane(3.6, 3.3, M.blackMarble, -1.3, 1.65, -8.93, 0, gf);
  plane(1.3, 1.3, M.logo, -1.3, 1.85, -8.86, 0, gf);
  const gh = new THREE.Mesh(hexRingGeo(0.7, 0.04, 0.02), M.led); gh.position.set(-1.3, 1.85, -8.9); gf.add(gh);
  for (const [dx, dy, r] of [[-1.2, 0.5, 0.18], [1.2, -0.4, 0.2], [-1.0, -0.7, 0.12], [1.1, 0.75, 0.13]]) { const o = new THREE.Mesh(hexRingGeo(r, 0.035, 0.03), M.led); o.position.set(-1.3 + dx, 1.85 + dy, -8.88); gf.add(o); }
  scene.remove(gf);
  const gd = grp(-1.3, 0, -6.5, 0);
  box(2.2, 1.05, 0.62, M.white, 0, 0, 0, gd); box(2.3, 0.05, 0.7, M.blackMarble, 0, 1.05, 0, gd);
  for (let i = 0; i < 5; i++) box(0.06, 1.0, 0.04, M.black, -0.9 + i * 0.1, 0, 0.32, gd, false);
  box(2.2, 0.025, 0.02, M.led, 0, 0.03, 0.32, gd, false);
  scene.remove(gd);
  const low = (o) => { scene.remove(o); return o; };
  low(sofa(-2.9, -3.9, Math.PI / 2, 2.0)); low(armchair(0.05, -3.3, -Math.PI / 2)); low(armchair(0.05, -4.6, -Math.PI / 2));
  low(oliveTree(-2.9, -0.7)); low(plant(0.3, -8.4, 1.1)); low(plant(-2.95, -8.4, 1.1));
  const gt = grp(-1.6, 0, -3.95); cyl(0.38, 0.38, 0.04, M.blackMarble, 0, 0.42, 0, gt, 28); for (let i = 0; i < 3; i++) cyl(0.012, 0.012, 0.42, M.gold, Math.cos(i * 2.1) * 0.34, 0, Math.sin(i * 2.1) * 0.34, gt, 6); scene.remove(gt);
  const gch = grp(-1.3, 2.75, -6.0, 0);
  for (const [r, y] of [[0.45, 0], [0.3, -0.15]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 48), M.gold); t.rotation.x = Math.PI / 2; t.position.y = y; gch.add(t); const l = new THREE.Mesh(new THREE.TorusGeometry(r - 0.01, 0.012, 6, 48), M.led); l.rotation.x = Math.PI / 2; l.position.y = y - 0.03; gch.add(l); }
  scene.remove(gch);
}

/* ---------------------------------------------------------- kapı önünde bekleyen 3 lüks araç */
function car(x, z, mat, kind = 'ev', ry = 0) {   // markasız, modern elektrikli araç siluetleri
  const g = grp(x, 0, z, ry);
  const suv = kind === 'evsuv';
  const L = suv ? 4.95 : 4.9, hb = suv ? 1.02 : 0.88, roof = suv ? 1.66 : 1.42, h = L / 2;
  const body = new THREE.Shape();
  body.moveTo(-h, 0.3); body.lineTo(-h, hb - 0.12); body.quadraticCurveTo(-h + 0.05, hb, -h + 0.45, hb + 0.02);
  body.lineTo(h - 0.7, hb); body.quadraticCurveTo(h - 0.05, hb - 0.08, h, hb - 0.38); body.quadraticCurveTo(h + 0.02, 0.32, h - 0.15, 0.3); body.closePath();
  const bg = new THREE.ExtrudeGeometry(body, { depth: 1.78, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.07, bevelSegments: 4, curveSegments: 16 }); bg.translate(0, 0, -0.89);
  const bm = new THREE.Mesh(bg, mat); bm.castShadow = true; g.add(bm);
  const cab = new THREE.Shape();
  const r0 = suv ? -2.05 : -2.0, rt = suv ? -1.55 : -0.6, ft = suv ? 0.25 : 0.25, r1 = suv ? 1.25 : 1.3;
  cab.moveTo(r0, hb); cab.quadraticCurveTo(rt - 0.2, roof + 0.02, rt, roof); cab.lineTo(ft, roof); cab.quadraticCurveTo(ft + 0.35, roof - 0.04, r1, hb + 0.02); cab.closePath();
  const cg = new THREE.ExtrudeGeometry(cab, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 12 }); cg.translate(0, 0, -0.75);
  g.add(new THREE.Mesh(cg, M.glassDark));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = cyl(0.36, 0.36, 0.26, M.tire, sx * (h - 0.88), 0.36, sz * 0.84, g, 28); w.rotation.x = Math.PI / 2; w.position.y = 0.36; w.geometry.translate(0, -0.13, 0);
    const rim = cyl(0.27, 0.27, 0.02, M.steelBlack, sx * (h - 0.88), 0.36, sz * 0.98, g, 20); rim.rotation.x = Math.PI / 2; rim.position.y = 0.36;
    for (let k = 0; k < 5; k++) { const sp = box(0.04, 0.24, 0.015, M.chrome, sx * (h - 0.88), 0.36, sz * 1.0, g, false); sp.geometry.translate(0, -0.12, 0); sp.position.y = 0.36; sp.rotation.z = k * Math.PI * 2 / 5; }
  }
  box(0.04, 0.035, 1.72, M.downlight, h + 0.03, hb - 0.2, 0, g, false);           // ön tam boy ışık çubuğu
  box(0.04, 0.035, 1.76, M.tail, -h - 0.08, hb - 0.08, 0, g, false);              // arka tam boy stop
  box(0.04, 0.06, 1.2, M.black, h + 0.02, 0.42, 0, g, false);
  for (const sz of [-1, 1]) box(0.16, 0.025, 0.02, M.chrome, 0.2, hb - 0.12, sz * 0.98, g, false), box(0.16, 0.025, 0.02, M.chrome, -1.0, hb - 0.12, sz * 0.98, g, false);
  return g;
}
function buildCars() {   // kaldırımdan sonra dikine park etmiş 4 araç, burunları binaya dönük
  const cars = new THREE.Group(); scene.add(cars);
  const zc = 8.0, xs = [-3.4, -0.65, 2.1, 4.85];
  const mats = [M.paintBlack, M.paintPearl, M.paintGraphite, M.paintBlack], kinds = ['ev', 'evsuv', 'ev', 'evsuv'];
  xs.forEach((x, i) => cars.add(car(x, zc, mats[i], kinds[i], Math.PI / 2)));
  for (let i = 0; i <= 4; i++) box(0.08, 0.01, 5.2, M.white, -4.775 + i * 2.75, 0.0, zc, cars, false);
  stage(cars, 5, 99, 'grow');
}

/* ---------------------------------------------------------- ışıklar */
const workLights = [], finishLights = [];
function buildLights() {
  scene.add(new THREE.HemisphereLight('#fff0dc', '#6a6058', 1.25));
  const sun = new THREE.DirectionalLight('#ffe0b8', 3.0);
  sun.position.set(-12, 18, 14); sun.target.position.set(0, 3, -8); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun);
  for (const [x, y, z] of [[-1.8, F1 + 2.5, -2.4], [-1.5, F1 + 2.5, -5.3], [2, F1 + 2.5, -8.1], [2, F1 + 2.5, -11.1], [-2, F1 + 2.5, -8.1], [-2, F1 + 2.5, -11.1], [0.3, F1 + 2.5, -14.2]]) {
    const p = new THREE.PointLight('#ffc98a', 0, 7, 1.6); p.position.set(x, y, z); scene.add(p); finishLights.push(p);
  }
  for (const [x, z] of [[-1.3, -4], [0, -11]]) { const p = new THREE.PointLight('#e8f0ff', 0, 10, 1.4); p.position.set(x, F1 + 2.2, z); scene.add(p); workLights.push(p); }
  const hall = new THREE.PointLight('#ffb070', 6, 9, 1.5); hall.position.set(2.1, 2.8, -3.5); scene.add(hall); workLights.push(hall);
}

/* ---------------------------------------------------------- aşama animasyonu */
let sNow = 5, sTarget = 5;
const smooth = (x) => x * x * (3 - 2 * x);
const cl = (x) => Math.max(0, Math.min(1, x));
function applyStage(s) {
  for (const e of staged) {
    let vin = e.mode === 'swap' ? (s >= e.from - 0.5 ? 1 : 0) : smooth(cl((s - (e.from - 1) - e.d) / (1 - e.d)));
    let vout = e.to >= 99 ? 1 : (e.mode === 'swap' || e.mode === 'rise' ? (s < e.to - 0.5 ? 1 : 0) : 1 - smooth(cl((s - (e.to - 1) - e.d) / (1 - e.d))));
    const v = Math.min(vin, vout);
    if (e.mode === 'rise') { const k = Math.min(smooth(cl((s - (e.from - 1) - e.d) / (1 - e.d))), vout); e.obj.visible = k > 0.001; e.obj.scale.set(1, Math.max(0.001, k), 1); continue; }
    e.obj.visible = v > 0.001;
    if (e.mode === 'grow') e.obj.scale.copy(e.base).multiplyScalar(Math.max(0.001, v));
  }
  const fin = smooth(cl(s - 2.5)), work = 1 - smooth(cl(s - 2.5));
  finishLights.forEach((l) => (l.intensity = 3.2 * fin));
  workLights.forEach((l, i) => (l.intensity = (i === 2 ? 4 + 4 * fin : 10) * (i === 2 ? 1 : work)));
}

/* ---------------------------------------------------------- kamera durakları */
export const STOPS = {
  genel: { p: [12, 14, 11], t: [0, 3.2, -8] },
  cephe: { p: [5.5, 6.2, 21.5], t: [0.8, 3.0, 0] },
  giris: { p: [2.2, 1.65, -0.3], t: [2.5, 2.6, -5.2] },
  resepsiyon: { p: [1.7, F1 + 2.3, -0.4], t: [-2.4, F1 + 0.9, -3.0] },
  bekleme: { p: [1.2, F1 + 2.4, -2.4], t: [-2.2, F1 + 0.5, -5.4] },
  koridor: { p: [0.07, F1 + 1.65, -5.2], t: [0.07, F1 + 1.2, -15] },
  d1: { p: [0.9, F1 + 6.2, -5.9], t: [2.05, F1 + 0.2, -8.3] },
  m1: { p: [0.9, F1 + 6.2, -8.9], t: [2.05, F1 + 0.2, -11.3] },
  d2: { p: [-0.9, F1 + 6.2, -5.9], t: [-2.0, F1 + 0.2, -8.3] },
  m2: { p: [-0.9, F1 + 6.2, -8.9], t: [-2.0, F1 + 0.2, -11.3] },
  wc: { p: [0.6, F1 + 6.4, -12.6], t: [0.6, F1 + 0.2, -15.7] },
  wckapi: { p: [0.07, F1 + 1.6, -11.0], t: [0.6, F1 + 1.3, -14.3] },
  plan: { p: [0, 24, -8.9], t: [0, F1, -8.7] },
};
let tween = null;
const doorLeaves = []; let doorOpen = 0, doorTarget = 0;
export function goTo(key, dur = 1.8) {
  doorTarget = key === 'giris' ? 1 : 0;
  const s = STOPS[key]; if (!s) return;
  tween = { t0: performance.now(), dur: dur * 1000, p0: camera.position.clone(), t0v: controls.target.clone(), p1: new THREE.Vector3(...s.p), t1: new THREE.Vector3(...s.t) };
}
export function setStage(n) { sTarget = n; }
export function getStage() { return sTarget; }

/* ---------------------------------------------------------- başlat */
export async function init(container, onReady) {
  try { await Promise.race([document.fonts.load('600 40px Cinzel'), new Promise((r) => setTimeout(r, 1500))]); await document.fonts.load('500 20px "Albert Sans"'); } catch (e) { /* yedek font */ }
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.6 : 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const sky = tex(skyCanvas(), 1, 1); sky.wrapS = sky.wrapT = THREE.ClampToEdgeWrapping; scene.background = sky;
  scene.fog = new THREE.Fog('#b9a594', 45, 110);
  camera = new THREE.PerspectiveCamera(MOBILE ? 62 : 48, container.clientWidth / container.clientHeight, 0.05, 300);
  camera.position.set(...STOPS.genel.p);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...STOPS.genel.t); controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495; controls.minDistance = 0.4; controls.maxDistance = 60; controls.zoomSpeed = 0.8;

  buildMaterials(); buildSite(); buildStairs(); buildFloor1(); buildFinish(); buildCars(); buildLights();
  applyStage(sNow);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 0.55, 0.5, 0.9);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); composer.setSize(w, h);
  };
  new ResizeObserver(resize).observe(container);
  controls.addEventListener('start', () => { tween = null; });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (Math.abs(sTarget - sNow) > 0.001) { const step = (reduce ? 50 : 1.15) * dt; sNow += Math.sign(sTarget - sNow) * Math.min(step, Math.abs(sTarget - sNow)); applyStage(sNow); }
    if (Math.abs(doorTarget - doorOpen) > 0.001) { doorOpen += Math.sign(doorTarget - doorOpen) * Math.min(dt * 0.8, Math.abs(doorTarget - doorOpen)); const e = smooth(doorOpen); doorLeaves.forEach(({ leaf, side }) => (leaf.rotation.y = side * e * 1.25)); }
    if (tween) {
      const k = cl((now - tween.t0) / (reduce ? 1 : tween.dur)), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0v, tween.t1, e);
      if (k >= 1) tween = null;
    }
    controls.update(); composer.render();
  });
  onReady && onReady();
}
