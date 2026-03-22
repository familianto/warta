# Warta — Platform Blog Personal dengan Mind Map

![Astro](https://img.shields.io/badge/Astro-6.0-BC52EE?logo=astro&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-222?logo=github&logoColor=white)
![License](https://img.shields.io/badge/License-GPL--3.0-blue)

Warta adalah platform blog personal yang menggabungkan penulisan artikel dengan visualisasi peta pikiran (mind map). Setiap artikel saling terhubung melalui tag dan relasi manual, membentuk jaringan ide yang bisa dieksplorasi secara visual.

**Live site:** [familianto.github.io/warta](https://familianto.github.io/warta)

## Screenshot

[Screenshot homepage]

[Screenshot mind map]

## Fitur Utama

- Blog dengan desain bersih ala Medium
- Visualisasi mind map hubungan antar artikel (D3.js)
- Admin panel dengan WYSIWYG editor (TipTap)
- Google OAuth untuk keamanan admin
- GitHub sebagai database (tanpa server, gratis total)
- Auto-deploy via GitHub Actions
- Dark mode otomatis
- SEO-friendly dengan Open Graph tags
- 100% gratis — GitHub Pages hosting
- Open source — fork dan gunakan sendiri

## Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| [Astro](https://astro.build/) | Static site generator |
| [React](https://react.dev/) | Komponen interaktif |
| [D3.js](https://d3js.org/) | Visualisasi mind map |
| [TipTap](https://tiptap.dev/) | WYSIWYG editor |
| [Google Identity Services](https://developers.google.com/identity) | Autentikasi admin |
| [GitHub API](https://docs.github.com/en/rest) | Database & penyimpanan konten |

## Cara Menggunakan (untuk yang ingin fork)

1. **Fork** repository ini ke akun GitHub kamu
2. **Update** `site.config.json` dengan data kamu (nama, email, warna, admin path)
3. **Ganti logo** — replace file `public/logo_master.png` dengan logo sendiri (lihat bagian [Mengganti Logo](#mengganti-logo))
4. **Setup Google OAuth** di [Google Cloud Console](https://console.cloud.google.com/):
   - Buat project baru
   - Aktifkan Google Identity Services
   - Buat OAuth Client ID (Web application)
   - Tambahkan URL GitHub Pages kamu sebagai Authorized JavaScript Origin
5. **Aktifkan GitHub Pages** di Settings > Pages > Source: **GitHub Actions**
6. **Buat GitHub Personal Access Token** untuk admin panel:
   - Settings > Developer settings > Personal access tokens > Fine-grained tokens
   - Berikan akses ke repository ini (Contents: Read and write)
7. **Push ke branch `main`** untuk trigger deploy pertama
8. **Mulai menulis** di `/[admin-path-kamu]/`

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

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Development server dengan hot reload |
| `npm run build` | Build site ke folder `dist/` |
| `npm run preview` | Preview hasil build secara lokal |

## Struktur Project

```
warta/
├── src/
│   ├── components/         # Komponen React (MindMap, Admin)
│   ├── layouts/            # Layout utama (Base.astro)
│   ├── lib/                # Utility (articles.ts, mindmap.ts)
│   ├── pages/              # Halaman Astro
│   │   ├── artikel/        # Halaman artikel dinamis
│   │   ├── kelola-w8x6m/   # Admin panel
│   │   ├── index.astro     # Homepage
│   │   ├── peta.astro      # Mind map
│   │   └── tentang.astro   # Halaman tentang
│   └── styles/             # CSS global
├── content/
│   ├── articles/           # File JSON per artikel
│   └── index.json          # Index metadata artikel
├── public/                 # Aset statis (logo, favicon, admin.css)
├── .github/workflows/      # GitHub Actions deploy
├── astro.config.mjs        # Konfigurasi Astro
├── site.config.json        # Konfigurasi situs
└── package.json
```

## Cara Menulis Artikel

1. Buka admin panel di URL admin kamu
2. Login dengan akun Google yang sudah diizinkan
3. Masukkan GitHub Personal Access Token
4. Klik **"Artikel Baru"**
5. Tulis menggunakan editor WYSIWYG — mendukung heading, bold, italic, link, gambar, code block, dan embed YouTube
6. Klik **"Simpan"**
7. Tunggu 1-2 menit untuk auto-deploy via GitHub Actions

## Mengganti Logo

Logo situs disimpan di `public/logo_master.png`.

Untuk mengganti logo, cukup replace file `public/logo_master.png` dengan logo sendiri.

**Spesifikasi logo:**
- **Format:** PNG (transparan background lebih baik)
- **Tinggi yang direkomendasikan:** 80px (akan ditampilkan di 40px, 2x untuk retina display)
- **Rasio:** bebas, tapi disarankan tidak lebih lebar dari 200px pada tinggi 80px
- **Pastikan** logo terlihat baik di background terang dan gelap (dark mode)

Jika tidak ingin menggunakan logo gambar, bisa kembalikan ke teks dengan mengubah tag `<img>` di `src/layouts/Base.astro` menjadi teks biasa:

```html
<!-- Ganti ini: -->
<img src={`${base}logo_master.png`} alt="Warta" class="logo-img" />

<!-- Menjadi: -->
<span class="logo-text">Warta</span>
```

## Keamanan

Admin panel dilindungi 3 lapis keamanan:

1. **Hidden path** — URL admin panel menggunakan path acak yang hanya diketahui pemilik
2. **Google OAuth** — Hanya akun Google tertentu yang bisa login (whitelist di `site.config.json`)
3. **GitHub Token** — Setiap operasi tulis membutuhkan Personal Access Token GitHub yang valid

Tanpa ketiga kredensial ini, tidak ada yang bisa mengakses atau memodifikasi konten blog.

## Lisensi

[GNU General Public License v3.0](LICENSE)
