# Warta

Platform blog personal dengan fitur mind map — dibangun dengan Astro dan di-deploy ke GitHub Pages.

**Live site:** [familianto.github.io/warta](https://familianto.github.io/warta)

## Tentang

Warta adalah platform blog personal yang menggabungkan penulisan artikel dengan visualisasi peta pikiran (mind map). Dirancang untuk penulis yang ingin mengorganisir ide secara visual sekaligus menulis artikel secara terstruktur.

## Tech Stack

- **[Astro](https://astro.build/)** — Static site generator
- **[React](https://react.dev/)** — Komponen interaktif
- **[GitHub Pages](https://pages.github.com/)** — Hosting statis gratis

## Setup untuk Fork

1. Fork repository ini ke akun GitHub kamu
2. Update `site.config.json` dengan data kamu (nama, URL, email)
3. Update `astro.config.mjs`:
   - `site` → URL GitHub Pages kamu
   - `base` → nama repository kamu
4. Aktifkan GitHub Pages di **Settings > Pages > Source: GitHub Actions**
5. Push ke branch `main` untuk trigger deploy

## Menjalankan Secara Lokal

```bash
# Clone repository
git clone https://github.com/familianto/warta.git
cd warta

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka `http://localhost:4321/warta/` di browser.

## Perintah Lain

| Perintah           | Fungsi                          |
| ------------------- | ------------------------------- |
| `npm run build`    | Build site ke folder `dist/`   |
| `npm run preview`  | Preview hasil build secara lokal |

## Lisensi

[GNU General Public License v3.0](LICENSE)
