# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Skema data Dinsos P3A

Skema PostgreSQL untuk Supabase tersedia di [`supabase/schema.sql`](./supabase/schema.sql). Jalankan sekali melalui SQL Editor Supabase.

- Satu tabel `lokasi_kegiatan` menampung enam bidang: Dayasos, Rehsos, UPTD PPA, KHP2HA, P3A, dan PSKB. Tabel mewajibkan koordinat, nama lokasi/bidang, detail JSONB, dan tahun kegiatan.
- Peta memuat kolom lokasi yang diperlukan dari Supabase dengan `useEffect`, lalu mencocokkan `nama_bidang` ke kontrol Manajemen Layer. Data dimuat ulang ketika menu berpindah.
- Row Level Security (RLS) aktif tanpa kebijakan akses bawaan, sehingga akses melalui API belum diizinkan sampai kebijakan `SELECT` yang sesuai peran ditambahkan. Data UPTD PPA dapat sangat sensitif; jangan menyimpan identitas korban atau informasi pribadi yang tidak diperlukan di `detail_informasi`.

## Konfigurasi Supabase

Salin `.env.example` menjadi `.env.local`, lalu isi URL proyek dan anon/publishable key dari pengaturan Supabase. Vite membaca variabel dengan awalan `VITE_` dan menyertakannya di bundle browser, jadi anon key bukan rahasia; jangan pernah menaruh `service_role` key di aplikasi frontend. Batasi akses dengan kebijakan RLS yang sesuai.

Client tersedia dari `src/supabaseClient.js`:

```js
import { supabase } from './supabaseClient'
```

### Impor CSV oleh admin

Halaman Dashboard Admin tersedia dari menu aplikasi dan menerima file CSV (`.csv`, bukan `.xlsx`). Fungsi `importCsvToSupabase` di `src/importCsvToSupabase.js` menerima `File` dan nama bidang yang dipilih. CSV perlu memiliki kolom `latitude` (atau `lat`/`lintang`), `longitude` (atau `lon`/`bujur`), `nama_lokasi` (atau `lokasi`), dan `tahun_kegiatan` (atau `tahun`). Kolom lain disimpan ke `detail_informasi`; kolom `detail_informasi` sendiri boleh berisi objek JSON.

Panggil fungsi ini dari handler unggah yang hanya tersedia bagi admin. Fungsi membatalkan seluruh impor jika koordinat kosong/tidak valid atau data wajib lain bermasalah.

```js
import { importCsvToSupabase } from './importCsvToSupabase.js'

const result = await importCsvToSupabase(file, 'Dayasos')
console.log(`${result.jumlahDataDiimpor} baris berhasil diimpor`)
```

Tambahkan kebijakan RLS yang membatasi `INSERT` sesuai autentikasi dan peran admin sebelum fungsi dipakai; skema tidak membuat kebijakan akses terbuka secara otomatis.
