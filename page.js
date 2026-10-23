import { init, goTo, setStage, getStage, drawOneWay, drawDoorUS } from './scene.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ------------------------------------------------ 3D gezinti */
const STOP_INFO = {
  genel: ['Genel bakış', 'BİNA · KESİT', 'Eczanenin yanındaki MD kapısından girilip çelik merdivenle 1. kata çıkılıyor. Modeli parmağınızla çevirip yakınlaştırabilirsiniz.'],
  cephe: ['Cephe', 'ZEMİN + 1. KAT', 'Üst katın bütün camı ışıklı altıgen düzenli one-way vision ile kaplı. Eczanenin yanındaki MD kapısında ultrason görüntülü folyo; kapı önünde bekleyen araçlar.'],
  giris: ['Merdiven', 'ZEMİN → 1. KAT', 'Açılır-kapanır MD kapısından girilince U dönüşlü çelik merdiven: mat siyah limonlar, meşe basamaklar, cam korkuluk, pirinç küpeşte.'],
  resepsiyon: ['Karşılama', '1. KAT · 36 m²', 'L banko dış duvar önünde; arkasında ışıklı MD altıgeni. Merdivenden çıkan hasta bankoyu karşısında görüyor.'],
  bekleme: ['Bekleme', '1. KAT · 36 m²', 'Duvar boyu kanepe, sehpa ve iki berjer; bölme duvarında ışıklı altıgen raf.'],
  koridor: ['Koridor', '1. KAT · GEÇİŞ', 'İki oda bloğunun arasından arka hole uzanan orta koridor. D. odalarının otomatik cam kapılarında altıgen one-way vision.'],
  d1: ['D. Odası 1', '1. KAT · 8 m² · TEMA 1', 'İnci beyazı duvarlar, antrasit dolap ve masa, altın detaylar. Koridordan otomatik cam kapı (altıgen folyo), muayeneye iç sürgü kapı.'],
  m1: ['Muayene Odası 1', '1. KAT · 8,1 m²', 'Ultrason cihazı (klavye, trackball, 3 prob ve kabloları, jel), girişimsel işlem arabası, muayene lambası, basamak, perde rayı, eldiven-havlu-atık ünitesi, hastaya dönük 3D/4D ekran.'],
  d2: ['D. Odası 2', '1. KAT · 8,7 m² · TEMA 2', 'Açık versiyon: sıcak beyaz duvarlar, açık meşe ve krem bukle koltuklar, şampanya altın. Koridordan otomatik cam kapı (altıgen folyo).'],
  m2: ['Muayene Odası 2', '1. KAT · 8,5 m²', 'İkinci ultrason ve girişim odası: işlem arabası, muayene lambası, perde rayı, duvar ekranı, lavabo ve ışıklı altıgen ayna.'],
  wckapi: ['WC girişi', '1. KAT · ARKA HOL', 'Koridorun sonunda iki kapı: solda WC, sağda Engelli WC. Kapılarda pirinç kol ve siyah-altın yönlendirme tabelası.'],
  wc: ['WC', '1. KAT · 6 + 5 m²', 'Arka holde Engelli WC (6 m²) ve iki lavabolu WC (5 m²).'],
  plan: ['Kat planı', '1. KAT · ÜSTTEN', 'Proje planı: önde karşılama-bekleme ve merdiven boşluğu, ortada koridor ile iki D. Odası + Muayene çifti, arkada WC\'ler.'],
};
const STAGES = [
  ['Kaba yapı ve çelik merdiven', 'Tamamlandı', 'done'],
  ['Gazbeton bölme duvarlar', 'Tamamlandı', 'done'],
  ['Asma tavan ve kapılar', 'Sürüyor', 'now'],
  ['Zemin, boya, aydınlatma', 'Sırada', 'next'],
  ['Cephe giydirme ve tabela', 'Planlandı', 'next'],
  ['Cihazlar ve mobilya', 'Açılış', 'next'],
];
const CURRENT = 2;

function setInfo(key) {
  const [t, code, d] = STOP_INFO[key];
  $('#stop-title').textContent = t; $('#stop-code').textContent = code; $('#stop-desc').textContent = d;
  $$('.stop').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stop === key)));
}
function renderStage(n) {
  const [t, st] = STAGES[n];
  $('#stage-name').textContent = t;
  $('#stage-state').textContent = st;
  $('#stage-state').dataset.kind = STAGES[n][2];
  $('#stage').value = n;
  $$('.tick').forEach((el, i) => el.classList.toggle('on', i <= n));
}

const viewer = $('#viewer');
$$('.stop').forEach((b) => b.addEventListener('click', () => { goTo(b.dataset.stop); setInfo(b.dataset.stop); }));
$('#stage').addEventListener('input', (e) => { const n = +e.target.value; setStage(n); renderStage(n); });
$('#play').addEventListener('click', async () => {
  const btn = $('#play'); btn.disabled = true;
  goTo('genel', 1.2); setInfo('genel');
  for (let n = 0; n <= 5; n++) { setStage(n); renderStage(n); await new Promise((r) => setTimeout(r, n === 0 ? 900 : 1500)); }
  btn.disabled = false;
});
$('#now').addEventListener('click', () => { setStage(CURRENT); renderStage(CURRENT); goTo('resepsiyon'); setInfo('resepsiyon'); });

renderStage(5); setInfo('genel');
init($('#canvas-wrap'), () => viewer.classList.add('ready')).catch((err) => {
  console.error(err);
  $('#loading').textContent = '3D görünüm bu cihazda açılamadı. Aşağıdaki görselleri inceleyebilirsiniz.';
});
// ilk açılış: genel bakıştan cepheye kısa yolculuk
setTimeout(() => { if (!document.hidden) { goTo('cephe', 2.6); setInfo('cephe'); } }, 1600);

/* ------------------------------------------------ önce / sonra */
$$('.ba').forEach((ba) => {
  const r = $('input', ba);
  const set = () => ba.style.setProperty('--x', r.value + '%');
  r.addEventListener('input', set); set();
});

/* ------------------------------------------------ one-way vision taslağı */
(async () => {
  const c = $('#oneway');
  try { await document.fonts.load('600 40px Cinzel'); await document.fonts.load('500 20px "Albert Sans"'); } catch (e) { /* yedek */ }
  const g = c.getContext('2d'); drawOneWay(g, c.width, c.height);
  const d = $('#door'); drawDoorUS(d.getContext('2d'), d.width, d.height);
})();

/* ------------------------------------------------ harita & rehber */
const CLINIC = { name: 'MD Clinic', lat: 39.90395, lng: 32.81575 };
const PLACES = [
  { name: 'Özel Memorial Ankara Hastanesi', area: 'Balgat', lat: 39.90363, lng: 32.81542, note: 'Kliniğin hemen yanı' },
  { name: 'Özel Koru Ankara Hastanesi', area: 'Kızılırmak Mah. · Çukurambar', lat: 39.90253, lng: 32.81203, note: 'Karşı şerit' },
  { name: 'Özel Bayındır Söğütözü Hastanesi', area: 'Kızılırmak Mah. · Söğütözü', lat: 39.91068, lng: 32.81122 },
  { name: 'Özel 100. Yıl Hastanesi', area: 'Balgat · Muhsin Yazıcıoğlu Cd.', lat: 39.89197, lng: 32.81034 },
  { name: 'Ankara Bilkent Şehir Hastanesi', area: 'Bilkent', lat: 39.89856, lng: 32.7582 },
];
function km(a, b) {
  const R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmt = (d) => d < 1 ? `${Math.round(d * 1000 / 10) * 10} m` : `${d.toFixed(1).replace('.', ',')} km`;
const gmaps = (p) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' Ankara')}`;

const list = $('#places');
PLACES.map((p) => ({ ...p, d: km(CLINIC, p) })).sort((a, b) => a.d - b.d).forEach((p, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" class="place" data-i="${PLACES.indexOf(PLACES.find((x) => x.name === p.name))}">
      <span class="pn">${p.name}</span><span class="pa">${p.area}${p.note ? ' · ' + p.note : ''}</span></button>
    <span class="pd">${fmt(p.d)}</span>
    <a class="pl" href="${gmaps(p)}" target="_blank" rel="noopener">Yol tarifi</a>`;
  list.appendChild(li);
});

if (window.L) {
  const map = L.map('map', { zoomControl: true, scrollWheelZoom: false, attributionControl: true }).setView([CLINIC.lat, CLINIC.lng], 15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap katkıcıları &copy; CARTO',
  }).addTo(map);
  const hexIcon = (cls, label) => L.divIcon({ className: '', html: `<div class="pin ${cls}"><span>${label}</span></div>`, iconSize: [34, 38], iconAnchor: [17, 19] });
  const markers = PLACES.map((p) => L.marker([p.lat, p.lng], { icon: hexIcon('h', 'H') }).addTo(map).bindPopup(`<b>${p.name}</b><br>${p.area}`));
  L.marker([CLINIC.lat, CLINIC.lng], { icon: hexIcon('md', 'MD'), zIndexOffset: 1000 }).addTo(map)
    .bindPopup('<b>MD Clinic</b><br>Memorial Ankara Hastanesi yanı · giriş eczane yanı, 1. kat').openPopup();
  map.fitBounds(L.latLngBounds([[CLINIC.lat, CLINIC.lng], ...PLACES.slice(0, 4).map((p) => [p.lat, p.lng])]).pad(0.35));
  $$('.place').forEach((b) => b.addEventListener('click', () => { const p = PLACES[+b.dataset.i]; map.flyTo([p.lat, p.lng], 16, { duration: 0.8 }); markers[+b.dataset.i].openPopup(); }));
}
