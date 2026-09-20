# Signage PERSADA

Aplikasi dasbor signage dengan CMS admin untuk mengelola kontennya.

## Struktur

- `public/` — halaman signage publik (ditampilkan di TV/monitor), otomatis update lewat SSE.
- `admin/` — panel CMS (login + form edit + pratinjau langsung).
- `server/` — server Express (API, auth, upload media, penyimpanan konfigurasi).
- `data/config.json` — data konfigurasi signage (dibuat otomatis saat pertama jalan).
- `uploads/` — media hero (foto/video) yang diunggah lewat CMS.

## Menjalankan

1. Salin `.env.example` menjadi `.env` dan atur `ADMIN_USERNAME`, `ADMIN_PASSWORD`, dan `SESSION_SECRET`:

   ```bash
   cp .env.example .env
   ```

2. Install dependency:

   ```bash
   npm install
   ```

3. Jalankan server:

   ```bash
   npm start
   ```

4. Buka:
   - Signage publik: http://localhost:3000
   - CMS admin: http://localhost:3000/admin (login dengan kredensial dari `.env`)

## Catatan

- Data konfigurasi disimpan sebagai file JSON lokal (`data/config.json`), bukan database eksternal — cukup untuk kebutuhan satu layar signage.
- Halaman signage publik akan otomatis memperbarui tampilan secara langsung (real-time) setiap kali admin menyimpan perubahan di CMS, lewat koneksi Server-Sent Events.
- Media yang diunggah (foto/video hero) disimpan di folder `uploads/` dan disajikan lewat `/uploads/<nama-berkas>`.
