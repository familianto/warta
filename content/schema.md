# Schema Artikel Warta

Setiap artikel disimpan sebagai file JSON di `content/articles/` dengan nama file `{slug}.json`.

## Field

| Field          | Tipe              | Wajib | Keterangan                                                    |
| -------------- | ----------------- | ----- | ------------------------------------------------------------- |
| `slug`         | `string`          | Ya    | Nama file tanpa `.json`, digunakan sebagai URL                |
| `title`        | `string`          | Ya    | Judul artikel                                                 |
| `subtitle`     | `string`          | Tidak | Deskripsi singkat 1-2 kalimat                                 |
| `author`       | `string`          | Ya    | Nama penulis                                                  |
| `createdAt`    | `string`          | Ya    | Tanggal dibuat, format ISO 8601 (contoh: `2026-03-15T10:00:00Z`) |
| `updatedAt`    | `string`          | Ya    | Tanggal terakhir diperbarui, format ISO 8601                  |
| `tags`         | `string[]`        | Ya    | Array tag/kategori artikel                                    |
| `relatedSlugs` | `string[]`        | Ya    | Slug artikel lain yang berhubungan (untuk mind map)           |
| `coverImage`   | `string`          | Tidak | URL gambar cover                                              |
| `content`      | `string`          | Ya    | Konten artikel dalam format HTML                              |
| `published`    | `boolean`         | Ya    | `true` jika artikel sudah dipublikasikan                      |

## Contoh

```json
{
  "slug": "contoh-artikel",
  "title": "Judul Artikel",
  "subtitle": "Deskripsi singkat artikel ini.",
  "author": "Hopy Familianto",
  "createdAt": "2026-03-15T10:00:00Z",
  "updatedAt": "2026-03-15T10:00:00Z",
  "tags": ["webdev", "tutorial"],
  "relatedSlugs": ["artikel-lain"],
  "coverImage": "",
  "content": "<p>Konten artikel dalam HTML.</p>",
  "published": true
}
```

## Index (`content/index.json`)

File `content/index.json` berisi array metadata semua artikel untuk halaman listing, agar tidak perlu membaca semua file artikel satu per satu.

Field yang disimpan di index: `slug`, `title`, `subtitle`, `tags`, `createdAt`, `published`.

## Catatan tentang Format Konten

Field `content` saat ini menggunakan **HTML string** biasa. Ini dipilih agar sprint awal bisa berjalan cepat tanpa perlu editor khusus.

Pada **Sprint 4**, saat admin panel dibangun, field `content` akan diganti ke format **TipTap JSON**. TipTap menggunakan representasi JSON dari dokumen ProseMirror, yang lebih terstruktur dan mudah diedit secara programatis melalui editor WYSIWYG.
