import { useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Database,
  FileSpreadsheet,
  LoaderCircle,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  UploadCloud
} from 'lucide-react'

import { importCsvToSupabase } from './importCsvToSupabase.js'

const bidangOptions = ['Dayasos', 'Rehsos', 'UPTD PPA', 'KHP2HA', 'P3A', 'PSKB']

function formatFileSize(size) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function AdminDashboard() {
  const fileInputRef = useRef(null)
  const [selectedBidang, setSelectedBidang] = useState('')
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [notification, setNotification] = useState(null)

  function handleFileChange(event) {
    setFile(event.target.files?.[0] ?? null)
    setNotification(null)
  }

  async function handleUpload(event) {
    event.preventDefault()
    setNotification(null)

    if (!selectedBidang) {
      setNotification({ type: 'error', message: 'Pilih bidang sebelum mengunggah.' })
      return
    }

    if (!file) {
      setNotification({ type: 'error', message: 'Pilih file CSV yang akan diunggah.' })
      return
    }

    setIsUploading(true)
    try {
      const result = await importCsvToSupabase(file, selectedBidang)
      setNotification({
        type: 'success',
        message: `${result.jumlahDataDiimpor} baris dari bidang ${result.namaBidang} berhasil diunggah ke Supabase.`
      })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah CSV.'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const NotificationIcon = notification?.type === 'success' ? CheckCircle2 : AlertCircle

  return (
    <main className="tw-relative tw-min-h-screen tw-overflow-hidden tw-bg-slate-950 tw-font-sans tw-text-slate-100">
      <div
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] tw-from-indigo-950/60 tw-via-slate-950 tw-to-slate-950"
        aria-hidden="true"
      />
      <div className="tw-relative tw-mx-auto tw-w-full tw-max-w-7xl tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-10 lg:tw-px-8">
        <header className="tw-mb-10 tw-flex tw-items-center tw-justify-between tw-gap-4">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-grid tw-h-12 tw-w-12 tw-place-items-center tw-rounded-2xl tw-border tw-border-indigo-400/20 tw-bg-indigo-500/10 tw-text-indigo-300 tw-shadow-lg tw-shadow-indigo-950/40">
              <MapPinned size={23} />
            </div>
            <div>
              <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-indigo-300">
                Web GIS Manggarai Barat
              </p>
              <h1 className="tw-mt-1 tw-text-xl tw-font-semibold tw-tracking-tight sm:tw-text-2xl">
                Dashboard Admin
              </h1>
            </div>
          </div>
          <div className="tw-hidden tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-emerald-400/20 tw-bg-emerald-400/5 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-emerald-300 sm:tw-flex">
            <span className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-emerald-400 tw-shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            Data geografis
          </div>
        </header>

        <section className="tw-grid tw-items-start tw-gap-6 lg:tw-grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="tw-overflow-hidden tw-rounded-3xl tw-border tw-border-white/10 tw-bg-slate-900/80 tw-shadow-2xl tw-shadow-black/30 tw-backdrop-blur-xl">
            <div className="tw-border-b tw-border-white/10 tw-p-6 sm:tw-p-8">
              <div className="tw-mb-5 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-indigo-400/20 tw-bg-indigo-400/10 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-indigo-200">
                <UploadCloud size={14} />
                Impor data peta
              </div>
              <h2 className="tw-text-2xl tw-font-semibold tw-tracking-tight sm:tw-text-3xl">
                Unggah spreadsheet bidang
              </h2>
              <p className="tw-mt-3 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-slate-400">
                Pilih bidang dan file CSV. Data akan divalidasi lalu ditambahkan ke tabel
                lokasi kegiatan Supabase.
              </p>
            </div>

            <form className="tw-space-y-6 tw-p-6 sm:tw-p-8" onSubmit={handleUpload}>
              <div>
                <label
                  className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-slate-200"
                  htmlFor="admin-bidang"
                >
                  Nama bidang
                </label>
                <div className="tw-relative">
                  <select
                    className="tw-w-full tw-appearance-none tw-rounded-xl tw-border tw-border-slate-700 tw-bg-slate-950/70 tw-px-4 tw-py-3.5 tw-pr-11 tw-text-sm tw-text-slate-100 tw-outline-none tw-transition focus:tw-border-indigo-400 focus:tw-ring-4 focus:tw-ring-indigo-400/10 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                    disabled={isUploading}
                    id="admin-bidang"
                    onChange={(event) => {
                      setSelectedBidang(event.target.value)
                      setNotification(null)
                    }}
                    value={selectedBidang}
                  >
                    <option className="tw-bg-slate-900" value="">Pilih bidang Dinsos P3A</option>
                    {bidangOptions.map((bidang) => (
                      <option className="tw-bg-slate-900" key={bidang} value={bidang}>
                        {bidang}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-slate-500"
                    size={17}
                  />
                </div>
              </div>

              <div>
                <span className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-slate-200">
                  File spreadsheet
                </span>
                <label
                  className={`tw-group tw-flex tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-dashed tw-px-5 tw-py-8 tw-text-center tw-transition ${
                    isUploading
                      ? 'tw-cursor-not-allowed tw-border-slate-800 tw-bg-slate-950/30 tw-opacity-60'
                      : 'tw-border-slate-700 tw-bg-slate-950/40 hover:tw-border-indigo-400/60 hover:tw-bg-indigo-400/[0.04]'
                  }`}
                  htmlFor="admin-csv-file"
                >
                  <input
                    accept=".csv,text/csv"
                    className="tw-sr-only"
                    disabled={isUploading}
                    id="admin-csv-file"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    type="file"
                  />
                  <span className="tw-mb-3 tw-grid tw-h-12 tw-w-12 tw-place-items-center tw-rounded-2xl tw-bg-slate-800 tw-text-indigo-300 tw-transition group-hover:tw-bg-indigo-400/10">
                    <FileSpreadsheet size={22} />
                  </span>
                  {file ? (
                    <>
                      <span className="tw-max-w-full tw-break-all tw-text-sm tw-font-medium tw-text-slate-100">
                        {file.name}
                      </span>
                      <span className="tw-mt-1 tw-text-xs tw-text-slate-500">
                        {formatFileSize(file.size)} · Klik untuk mengganti file
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="tw-text-sm tw-font-medium tw-text-slate-200">
                        Klik untuk memilih file CSV
                      </span>
                      <span className="tw-mt-1 tw-text-xs tw-text-slate-500">
                        Format .csv · file tetap berada di perangkat sampai diproses
                      </span>
                    </>
                  )}
                </label>
              </div>

              {notification && (
                <div
                  className={`tw-flex tw-items-start tw-gap-3 tw-whitespace-pre-line tw-rounded-xl tw-border tw-p-4 tw-text-sm ${
                    notification.type === 'success'
                      ? 'tw-border-emerald-400/20 tw-bg-emerald-400/[0.07] tw-text-emerald-200'
                      : 'tw-border-rose-400/20 tw-bg-rose-400/[0.07] tw-text-rose-200'
                  }`}
                  role={notification.type === 'error' ? 'alert' : 'status'}
                >
                  <NotificationIcon className="tw-mt-0.5 tw-shrink-0" size={18} />
                  <span>{notification.message}</span>
                </div>
              )}

              <button
                className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2.5 tw-rounded-xl tw-bg-indigo-500 tw-px-5 tw-py-3.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-lg tw-shadow-indigo-950/40 tw-transition hover:tw-bg-indigo-400 focus-visible:tw-outline-none focus-visible:tw-ring-4 focus-visible:tw-ring-indigo-400/30 disabled:tw-cursor-not-allowed disabled:tw-bg-slate-700 disabled:tw-text-slate-400 disabled:tw-shadow-none"
                disabled={isUploading}
                type="submit"
              >
                {isUploading ? (
                  <>
                    <LoaderCircle className="tw-animate-spin" size={18} />
                    Memproses dan mengunggah...
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    Unggah ke Peta
                  </>
                )}
              </button>
            </form>
          </div>

          <aside className="tw-space-y-4">
            <div className="tw-rounded-3xl tw-border tw-border-white/10 tw-bg-slate-900/60 tw-p-6 tw-backdrop-blur-xl">
              <div className="tw-mb-4 tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-bg-sky-400/10 tw-text-sky-300">
                <Database size={19} />
              </div>
              <h3 className="tw-font-semibold tw-text-slate-100">Kolom yang dibutuhkan</h3>
              <p className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-slate-400">
                CSV harus memiliki latitude, longitude, nama_lokasi, dan tahun_kegiatan.
                Kolom lain disimpan sebagai detail informasi.
              </p>
              <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
                {['latitude', 'longitude', 'nama_lokasi', 'tahun_kegiatan'].map((column) => (
                  <code
                    className="tw-rounded-lg tw-border tw-border-white/10 tw-bg-slate-950/70 tw-px-2.5 tw-py-1.5 tw-text-[11px] tw-text-slate-300"
                    key={column}
                  >
                    {column}
                  </code>
                ))}
              </div>
            </div>

            <div className="tw-rounded-3xl tw-border tw-border-amber-300/15 tw-bg-amber-300/[0.04] tw-p-5">
              <div className="tw-flex tw-gap-3">
                <div className="tw-mt-0.5 tw-text-amber-200">
                  <LockKeyhole size={17} />
                </div>
                <div>
                  <h3 className="tw-text-sm tw-font-semibold tw-text-amber-100">
                    Akses admin dan keamanan
                  </h3>
                  <p className="tw-mt-1.5 tw-text-xs tw-leading-5 tw-text-amber-100/65">
                    Lindungi halaman ini dengan autentikasi admin dan kebijakan RLS
                    sebelum mengaktifkan hak tulis ke database.
                  </p>
                </div>
              </div>
            </div>

            <div className="tw-flex tw-items-center tw-gap-2 tw-px-1 tw-text-xs tw-text-slate-500">
              <ShieldCheck className="tw-text-emerald-400" size={15} />
              Validasi koordinat dilakukan sebelum data dikirim
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default AdminDashboard
