# MD Clinic — Radyoloji · Girişimsel Radyoloji

Memorial Ankara Hastanesi yanı, Balgat / Ankara. Kliniğin gezilebilir 3D modeli ve tanıtım sitesi.

## İçerik
- **3D gezinti** (three.js): cephe, eczane yanındaki giriş, U dönüşlü çelik merdiven, 1. kat resepsiyon, bekleme, Ultrason 1, Ultrason 2 (3D/4D), doktor odası, kat planı
- **Şantiye → açılış** sürgüsü: 6 aşama (bugün: asma tavan ve kapılar)
- **Cephe one-way vision** taslağı: eczane üstündeki cam için hexagon temalı folyo
- **Hizmetler**, **mekân galerisi**, **harita ve çevre hastaneleri rehberi** (Leaflet + OpenStreetMap)

## Dosyalar
- `index.html` — sayfa ve stiller
- `scene.js` — 3D model
- `page.js` — arayüz, dönüşüm, harita
- `assets/` — tasarım görselleri ve şantiye fotoğrafları

## Yayınlama (GitHub Pages)
Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save.
Birkaç dakika sonra site `https://<kullanıcı>.github.io/<repo>/` adresinde açılır.

## Düzenleme
- Aşamayı güncellemek: `page.js` içinde `CURRENT` değeri ve `STAGES` listesi
- Kliniğin harita konumu: `page.js` içinde `CLINIC` koordinatı
- Hizmet listesi ve iletişim: `index.html`
