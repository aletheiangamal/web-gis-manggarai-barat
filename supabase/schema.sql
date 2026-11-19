CREATE TABLE public.lokasi_kegiatan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  nama_lokasi text NOT NULL CHECK (btrim(nama_lokasi) <> ''),
  nama_bidang text NOT NULL CHECK (
    nama_bidang IN ('Dayasos', 'Rehsos', 'UPTD PPA', 'KHP2HA', 'P3A', 'PSKB')
  ),
  detail_informasi jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(detail_informasi) = 'object'),
  tahun_kegiatan integer NOT NULL CHECK (tahun_kegiatan BETWEEN 1900 AND 9999),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lokasi_kegiatan_bidang_tahun_idx
  ON public.lokasi_kegiatan (nama_bidang, tahun_kegiatan DESC);

ALTER TABLE public.lokasi_kegiatan ENABLE ROW LEVEL SECURITY;

-- Add narrowly scoped policies after deciding which staff roles may access each bidang.
-- Do not store identifying or sensitive case information in detail_informasi.
