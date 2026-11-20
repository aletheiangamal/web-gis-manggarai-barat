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
  Trash2,
  UploadCloud
} from 'lucide-react'
import Papa from 'papaparse'

const bidangOptions = ['Dayasos', 'Rehsos', 'UPTD PPA', 'KHP2HA', 'P3A', 'PSKB']
const dayasosCategoryOptions = ['Lembaga (LKS)', 'TKSK', 'KAT', 'LK3', 'TMP']
const dataStorageKey = 'data_gis_dinsos'
const legacyDataStorageKey = 'csvDatasets'

function formatFileSize(size) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function normalizeHeader(header) {
  return String(header).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getRowValue(row, aliases) {
  const normalizedRow = new Map(
    Object.entries(row).map(([header, value]) => [normalizeHeader(header), value])
  )

  for (const alias of aliases) {
    const value = normalizedRow.get(normalizeHeader(alias))
    if (value !== undefined && String(value).trim() !== '') {
      return String(value).trim()
    }
  }

  return ''
}

function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(
            `Format CSV tidak valid: ${result.errors
              .map(({ code, message }) => `${code}: ${message}`)
              .join('; ')}`
          ))
          return
        }
        if (!result.meta.fields?.length) {
          reject(new Error('CSV harus memiliki baris header dan data.'))
          return
        }
        resolve(result.data)
      },
      error: (error) => reject(new Error(`Gagal membaca CSV: ${error.message}`))
    })
  })
}

async function parseExcelFile(file) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error('Berkas Excel tidak memiliki sheet.')
  }

  const firstSheet = workbook.Sheets[firstSheetName]
  return XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: true })
}

async function parseSpreadsheetFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'csv') {
    return parseCsvFile(file)
  }
  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelFile(file)
  }

  throw new Error('Format file tidak didukung. Pilih file .csv, .xlsx, atau .xls.')
}

function mapRows(rows, namaBidang, defaultCategory = '') {
  const errors = []
  const records = []
  const coordinateHeaders = new Set([
    'latitude', 'lat', 'lintang',
    '_Lokasi LKS (Titik Koordinat)_latitude',
    'longitude', 'long', 'lon', 'lng', 'bujur',
    '_Lokasi LKS (Titik Koordinat)_longitude'
  ].map(normalizeHeader))
  const locationHeaders = new Set([
    'nama_lokasi', 'nama lokasi', 'lokasi', 'nama_tempat', 'location', 'Nama LKS'
  ].map(normalizeHeader))
  const yearHeaders = new Set([
    'tahun_kegiatan', 'tahun kegiatan', 'tahun', 'year', 'Tahun Berdiri LKS'
  ].map(normalizeHeader))
  const categoryHeaders = new Set(['jenis_kategori', 'jenis kategori', 'kategori'].map(normalizeHeader))
  const bidangHeaders = new Set(['nama_bidang', 'nama bidang'].map(normalizeHeader))

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const initialErrorCount = errors.length
    const latitudeText = getRowValue(row, [
      'latitude', 'lat', 'lintang',
      '_Lokasi LKS (Titik Koordinat)_latitude'
    ])
    const longitudeText = getRowValue(row, [
      'longitude', 'long', 'lon', 'lng', 'bujur',
      '_Lokasi LKS (Titik Koordinat)_longitude'
    ])
    const namaLokasi = getRowValue(row, [
      'nama_lokasi', 'nama lokasi', 'lokasi', 'nama_tempat', 'location', 'Nama LKS'
    ])
    const tahunText = getRowValue(row, [
      'tahun_kegiatan', 'tahun kegiatan', 'tahun', 'year', 'Tahun Berdiri LKS'
    ])
    const yearMatch = tahunText.match(/\d{4}/)
    const tahunKegiatan = yearMatch ? Number(yearMatch[0]) : 2026
    const jenisKategori = getRowValue(row, ['jenis_kategori', 'jenis kategori', 'kategori']) ||
      defaultCategory ||
      (getRowValue(row, ['Nama LKS']) ? 'Lembaga (LKS)' : '')
    const latitude = Number(latitudeText)
    const longitude = Number(longitudeText)

    if (!latitudeText || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.push(`Baris data ${rowNumber}: latitude kosong atau tidak valid (rentang -90 sampai 90).`)
    }
    if (!longitudeText || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.push(`Baris data ${rowNumber}: longitude kosong atau tidak valid (rentang -180 sampai 180).`)
    }
    if (!namaLokasi) {
      errors.push(`Baris data ${rowNumber}: nama_lokasi wajib diisi.`)
    }

    if (errors.length === initialErrorCount) {
      records.push({
        latitude,
        longitude,
        nama_lokasi: namaLokasi,
        nama_bidang: namaBidang,
        tahun_kegiatan: tahunKegiatan,
        jenis_kategori: jenisKategori,
        detail_informasi: Object.fromEntries(
          Object.entries(row).filter(([header, value]) =>
            !coordinateHeaders.has(normalizeHeader(header)) &&
            !locationHeaders.has(normalizeHeader(header)) &&
            !yearHeaders.has(normalizeHeader(header)) &&
            !categoryHeaders.has(normalizeHeader(header)) &&
            !bidangHeaders.has(normalizeHeader(header)) &&
            String(value ?? '').trim() !== ''
          )
        )
      })
    }
  })

  return { records, errors }
}

function AdminDashboard() {
  const fileInputRef = useRef(null)
  const [selectedBidang, setSelectedBidang] = useState('')
  const [selectedDayasosCategory, setSelectedDayasosCategory] = useState('')
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
      setNotification({ type: 'error', message: 'Pilih file spreadsheet yang akan diunggah.' })
      return
    }

    setIsUploading(true)
    try {
      const rows = await parseSpreadsheetFile(file)
      if (rows.length === 0) {
        throw new Error('File spreadsheet tidak berisi baris data.')
      }

      const defaultCategory = selectedBidang === 'Dayasos' ? selectedDayasosCategory : ''
      const { records, errors } = mapRows(rows, selectedBidang, defaultCategory)
      if (errors.length > 0) {
        throw new Error(`Data spreadsheet tidak disimpan:\n${errors.join('\n')}`)
      }

      let existingRecords = []
      const storedData = window.localStorage.getItem(dataStorageKey) ??
        window.localStorage.getItem(legacyDataStorageKey)
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          if (Array.isArray(parsedData)) {
            existingRecords = parsedData
          }
        } catch {
          throw new Error('Data GIS yang tersimpan rusak. Hapus data browser lalu coba lagi.')
        }
      }

      const combinedRecords = [
        ...existingRecords.filter((record) => record?.nama_bidang !== selectedBidang),
        ...records
      ]
      window.localStorage.setItem(dataStorageKey, JSON.stringify(combinedRecords))
      window.dispatchEvent(new CustomEvent('dataGisDinsosUpdated', {
        detail: combinedRecords
      }))

      setNotification({
        type: 'success',
        message: `${records.length} baris dari bidang ${selectedBidang} berhasil menggantikan data sebelumnya.`
      })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat mengunggah spreadsheet.'
      })
    } finally {
      setIsUploading(false)
    }
  }

  function handleClearAllData() {
    if (!window.confirm('Yakin ingin menghapus semua data GIS yang tersimpan di browser?')) {
      return
    }

    try {
      window.localStorage.removeItem(dataStorageKey)
      window.localStorage.removeItem(legacyDataStorageKey)
      window.dispatchEvent(new CustomEvent('dataGisDinsosUpdated', { detail: [] }))
      setNotification({ type: 'success', message: 'Semua data GIS berhasil dikosongkan.' })
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menghapus data GIS.'
      })
    }
  }

  const NotificationIcon = notification?.type === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div className="tw-min-h-screen tw-bg-slate-950 tw-font-sans tw-text-slate-100">
      <div className="tw-mx-auto tw-w-full tw-max-w-7xl tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <header className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border-b tw-border-slate-800 tw-py-6">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
            <div className="tw-flex tw-h-11 tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-bg-indigo-500/15 tw-text-indigo-300">
              <MapPinned size={22} />
            </div>
            <div className="tw-min-w-0">
              <p className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-slate-400">
                Web GIS Manggarai Barat
              </p>
              <h1 className="tw-mt-1 tw-truncate tw-text-xl tw-font-semibold tw-tracking-tight sm:tw-text-2xl">
                Dashboard Admin
              </h1>
            </div>
          </div>
          <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-slate-800 tw-bg-slate-900 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-slate-300">
            <Database className="tw-text-indigo-300" size={15} />
            Spreadsheet ke LocalStorage
          </div>
        </header>

        <div className="tw-py-8 sm:tw-py-10">
          <div className="tw-mb-7 tw-max-w-2xl">
            <p className="tw-text-sm tw-font-medium tw-text-indigo-300">Pusat data spasial</p>
            <h2 className="tw-mt-2 tw-text-2xl tw-font-semibold tw-tracking-tight sm:tw-text-3xl">
              Impor data kegiatan
            </h2>
            <p className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-slate-400">
              Pilih bidang dan file CSV atau Excel untuk memperbarui lokasi kegiatan pada peta.
              Data akan divalidasi sebelum menggantikan data bidang tersebut.
            </p>
          </div>

          <section className="tw-grid tw-items-start tw-gap-5 lg:tw-grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
            <section
              aria-labelledby="upload-card-title"
              className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-slate-700/80 tw-bg-slate-800 tw-shadow-lg tw-shadow-black/20"
            >
              <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-slate-700/80 tw-p-5 sm:tw-p-6">
                <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
                  <div className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-indigo-500/15 tw-text-indigo-300">
                    <UploadCloud size={19} />
                  </div>
                  <div className="tw-min-w-0">
                    <h3 className="tw-font-semibold tw-text-white" id="upload-card-title">
                      Unggah spreadsheet
                    </h3>
                    <p className="tw-mt-0.5 tw-text-xs tw-text-slate-400">
                      Format file yang didukung: .csv, .xlsx, .xls
                    </p>
                  </div>
                </div>
                <button
                  className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-rose-400/20 tw-bg-rose-400/[0.07] tw-px-2.5 tw-py-2 tw-text-xs tw-font-medium tw-text-rose-300 tw-transition hover:tw-border-rose-400/40 hover:tw-bg-rose-400/15 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                  disabled={isUploading}
                  onClick={handleClearAllData}
                  type="button"
                >
                  <Trash2 size={14} />
                  Kosongkan Semua Data
                </button>
              </div>

              <form className="tw-space-y-5 tw-p-5 sm:tw-p-6" onSubmit={handleUpload}>
                <div>
                  <label
                    className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-slate-200"
                    htmlFor="admin-bidang"
                  >
                    Nama bidang
                  </label>
                  <div className="tw-relative">
                    <MapPinned
                      className="tw-pointer-events-none tw-absolute tw-left-3.5 tw-top-1/2 -tw-translate-y-1/2 tw-text-slate-500"
                      size={17}
                    />
                    <select
                      className="tw-w-full tw-appearance-none tw-rounded-lg tw-border tw-border-slate-700 tw-bg-zinc-900 tw-px-10 tw-py-3 tw-pr-11 tw-text-sm tw-text-white tw-outline-none tw-transition focus:tw-border-indigo-400 focus:tw-ring-4 focus:tw-ring-indigo-500/15 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                      disabled={isUploading}
                      id="admin-bidang"
                      onChange={(event) => {
                        setSelectedBidang(event.target.value)
                        setNotification(null)
                      }}
                      value={selectedBidang}
                    >
                      <option className="tw-bg-zinc-900" value="">
                        Pilih bidang Dinsos P3A
                      </option>
                      {bidangOptions.map((bidang) => (
                        <option className="tw-bg-zinc-900" key={bidang} value={bidang}>
                          {bidang}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="tw-pointer-events-none tw-absolute tw-right-3.5 tw-top-1/2 -tw-translate-y-1/2 tw-text-slate-500"
                      size={16}
                    />
                  </div>
                </div>

                {selectedBidang === 'Dayasos' && (
                  <div>
                    <label
                      className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-slate-200"
                      htmlFor="admin-dayasos-category"
                    >
                      Jenis Kategori Data
                    </label>
                    <div className="tw-relative">
                      <select
                        className="tw-w-full tw-appearance-none tw-rounded-lg tw-border tw-border-slate-700 tw-bg-zinc-900 tw-px-4 tw-py-3 tw-pr-11 tw-text-sm tw-text-white tw-outline-none tw-transition focus:tw-border-indigo-400 focus:tw-ring-4 focus:tw-ring-indigo-500/15 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
                        disabled={isUploading}
                        id="admin-dayasos-category"
                        onChange={(event) => setSelectedDayasosCategory(event.target.value)}
                        value={selectedDayasosCategory}
                      >
                        <option className="tw-bg-zinc-900" value="">
                          Pilih kategori Dayasos
                        </option>
                        {dayasosCategoryOptions.map((category) => (
                          <option className="tw-bg-zinc-900" key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="tw-pointer-events-none tw-absolute tw-right-3.5 tw-top-1/2 -tw-translate-y-1/2 tw-text-slate-500"
                        size={16}
                      />
                    </div>
                    <p className="tw-mt-1.5 tw-text-xs tw-text-slate-500">
                      Digunakan jika kolom jenis_kategori pada spreadsheet kosong.
                    </p>
                  </div>
                )}

                <div>
                  <label
                    className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-slate-200"
                    htmlFor="admin-data-file"
                  >
                    File spreadsheet
                  </label>
                  <div className="tw-flex tw-min-h-[76px] tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-slate-700 tw-bg-zinc-900 tw-p-3 tw-transition focus-within:tw-border-indigo-400 focus-within:tw-ring-4 focus-within:tw-ring-indigo-500/10">
                    <div className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-slate-800 tw-text-indigo-300">
                      <FileSpreadsheet size={19} />
                    </div>
                    <div className="tw-min-w-0 tw-flex-1">
                      {file ? (
                        <>
                          <p className="tw-truncate tw-text-sm tw-font-medium tw-text-slate-100">
                            {file.name}
                          </p>
                          <p className="tw-mt-1 tw-text-xs tw-text-slate-500">
                            {formatFileSize(file.size)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="tw-text-sm tw-font-medium tw-text-slate-200">
                            Belum ada file dipilih
                          </p>
                          <p className="tw-mt-1 tw-text-xs tw-text-slate-500">
                            Pilih file .csv, .xlsx, atau .xls dari perangkat
                          </p>
                        </>
                      )}
                    </div>
                    <label
                      className={`tw-inline-flex tw-shrink-0 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-slate-600 tw-bg-slate-800 tw-px-3 tw-py-2.5 tw-text-xs tw-font-medium tw-text-slate-200 tw-transition hover:tw-border-indigo-400/60 hover:tw-bg-slate-700 ${
                        isUploading ? 'tw-pointer-events-none tw-opacity-50' : ''
                      }`}
                      htmlFor="admin-data-file"
                    >
                      <UploadCloud size={15} />
                      {file ? 'Ganti file' : 'Pilih file'}
                    </label>
                    <input
                      accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      className="tw-sr-only"
                      disabled={isUploading}
                      id="admin-data-file"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      type="file"
                    />
                  </div>
                </div>

                {notification && (
                  <div
                    className={`tw-flex tw-items-start tw-gap-2.5 tw-whitespace-pre-line tw-rounded-lg tw-border tw-p-3.5 tw-text-sm ${
                      notification.type === 'success'
                        ? 'tw-border-emerald-400/20 tw-bg-emerald-400/[0.07] tw-text-emerald-200'
                        : 'tw-border-rose-400/20 tw-bg-rose-400/[0.07] tw-text-rose-200'
                    }`}
                    role={notification.type === 'error' ? 'alert' : 'status'}
                  >
                    <NotificationIcon className="tw-mt-0.5 tw-shrink-0" size={17} />
                    <span>{notification.message}</span>
                  </div>
                )}

                <button
                  className="tw-inline-flex tw-w-full tw-items-center tw-justify-center tw-gap-2.5 tw-rounded-lg tw-bg-indigo-600 tw-px-5 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-shadow-md tw-shadow-indigo-950/30 tw-transition-all tw-duration-200 hover:-tw-translate-y-0.5 hover:tw-bg-indigo-500 hover:tw-shadow-lg focus-visible:tw-outline-none focus-visible:tw-ring-4 focus-visible:tw-ring-indigo-400/30 disabled:tw-translate-y-0 disabled:tw-cursor-not-allowed disabled:tw-bg-slate-700 disabled:tw-text-slate-400 disabled:tw-shadow-none"
                  disabled={isUploading}
                  type="submit"
                >
                  {isUploading ? (
                    <>
                      <LoaderCircle className="tw-animate-spin" size={18} />
                      Memproses dan menyimpan...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={18} />
                      Unggah ke Peta
                    </>
                  )}
                </button>
              </form>
            </section>

            <aside className="tw-space-y-5">
              <section className="tw-rounded-xl tw-border tw-border-slate-700/80 tw-bg-slate-800 tw-p-5 tw-shadow-lg tw-shadow-black/20 sm:tw-p-6">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-sky-400/10 tw-text-sky-300">
                    <Database size={18} />
                  </div>
                  <div>
                    <h3 className="tw-font-semibold tw-text-white">Kolom yang dibutuhkan</h3>
                    <p className="tw-mt-0.5 tw-text-xs tw-text-slate-400">
                      Header umum wajib pada baris pertama sheet
                    </p>
                  </div>
                </div>
                <div className="tw-mt-5 tw-space-y-2">
                  {['latitude', 'longitude', 'nama_lokasi'].map((column) => (
                    <div
                      className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-slate-700/70 tw-bg-zinc-900/70 tw-px-3 tw-py-2.5"
                      key={column}
                    >
                      <code className="tw-text-xs tw-text-slate-200">{column}</code>
                      <span className="tw-rounded-md tw-bg-slate-700/70 tw-px-2 tw-py-1 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wide tw-text-slate-400">
                        Wajib
                      </span>
                    </div>
                  ))}
                </div>
                <p className="tw-mt-4 tw-text-xs tw-leading-5 tw-text-slate-400">
                  Tahun kegiatan diambil dari empat angka pertama; jika kosong, nilainya 2026.
                  Kolom tambahan disimpan di <code className="tw-text-slate-300">detail_informasi</code>.
                  Koordinat kosong atau di luar rentang akan ditolak.
                </p>
                <p className="tw-mt-3 tw-border-t tw-border-slate-700/80 tw-pt-3 tw-text-xs tw-leading-5 tw-text-slate-400">
                  Format LKS Dayasos dari KoboToolbox juga didukung: koordinat
                  <code className="tw-mx-1 tw-text-slate-300">_Lokasi LKS (Titik Koordinat)_latitude/longitude</code>,
                  <code className="tw-mx-1 tw-text-slate-300">Nama LKS</code>,
                  <code className="tw-mx-1 tw-text-slate-300">Alamat Lengkap</code>, dan
                  <code className="tw-ml-1 tw-text-slate-300">Tahun Berdiri LKS</code>.
                </p>
              </section>

              <section className="tw-rounded-xl tw-border tw-border-amber-300/15 tw-bg-slate-800 tw-p-5 tw-shadow-lg tw-shadow-black/20 sm:tw-p-6">
                <div className="tw-flex tw-items-start tw-gap-3">
                  <div className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-amber-300/10 tw-text-amber-200">
                    <LockKeyhole size={18} />
                  </div>
                  <div className="tw-min-w-0">
                    <h3 className="tw-font-semibold tw-text-white">Akses dan keamanan</h3>
                    <p className="tw-mt-1.5 tw-text-sm tw-leading-6 tw-text-slate-400">
                      Batasi halaman ini untuk admin terautentikasi dan gunakan kebijakan RLS
                      sebelum mengizinkan penulisan ke database.
                    </p>
                  </div>
                </div>
                <div className="tw-mt-4 tw-flex tw-items-center tw-gap-2 tw-border-t tw-border-slate-700/80 tw-pt-4 tw-text-xs tw-text-slate-400">
                  <ShieldCheck className="tw-shrink-0 tw-text-emerald-400" size={15} />
                  Data divalidasi sebelum disimpan di browser
                </div>
              </section>
            </aside>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
