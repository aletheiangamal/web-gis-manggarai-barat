import Papa from 'papaparse'

const bidangValid = new Set([
  'Dayasos',
  'Rehsos',
  'UPTD PPA',
  'KHP2HA',
  'P3A',
  'PSKB'
])

const csvFields = {
  latitude: ['latitude', 'lat', 'lintang'],
  longitude: ['longitude', 'long', 'lon', 'lng', 'bujur'],
  namaLokasi: ['nama_lokasi', 'nama lokasi', 'lokasi', 'nama_tempat', 'location'],
  tahunKegiatan: ['tahun_kegiatan', 'tahun kegiatan', 'tahun', 'year'],
  detailInformasi: ['detail_informasi', 'detail informasi'],
  namaBidang: ['nama_bidang', 'nama bidang']
}

const reservedHeaders = new Set([
  'id',
  ...Object.values(csvFields).flat().map(normalizeHeader)
])

function normalizeHeader(header) {
  return String(header).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getCsvValue(row, aliases) {
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
          const errors = result.errors
            .map(({ code, message }) => `${code}: ${message}`)
            .join('; ')
          reject(new Error(`Format CSV tidak valid: ${errors}`))
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

function getDetailInformasi(row, rowNumber, errors) {
  const detailText = getCsvValue(row, csvFields.detailInformasi)
  let detail = {}

  if (detailText) {
    try {
      detail = JSON.parse(detailText)
    } catch {
      errors.push(`Baris data ${rowNumber}: detail_informasi harus berupa JSON yang valid.`)
      return null
    }

    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
      errors.push(`Baris data ${rowNumber}: detail_informasi harus berupa objek JSON.`)
      return null
    }
  }

  const extraFields = Object.fromEntries(
    Object.entries(row).filter(([header, value]) =>
      !reservedHeaders.has(normalizeHeader(header)) &&
      String(value ?? '').trim() !== ''
    )
  )

  return { ...detail, ...extraFields }
}

function mapCsvRow(row, rowNumber, namaBidang, errors) {
  const latitudeText = getCsvValue(row, csvFields.latitude)
  const longitudeText = getCsvValue(row, csvFields.longitude)
  const latitude = Number(latitudeText)
  const longitude = Number(longitudeText)
  const namaLokasi = getCsvValue(row, csvFields.namaLokasi)
  const tahunText = getCsvValue(row, csvFields.tahunKegiatan)
  const tahunKegiatan = Number(tahunText)
  const initialErrorCount = errors.length

  if (!latitudeText || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push(`Baris data ${rowNumber}: latitude kosong atau tidak valid (rentang -90 sampai 90).`)
  }
  if (!longitudeText || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push(`Baris data ${rowNumber}: longitude kosong atau tidak valid (rentang -180 sampai 180).`)
  }
  if (!namaLokasi) {
    errors.push(`Baris data ${rowNumber}: nama_lokasi wajib diisi.`)
  }
  if (!tahunText || !Number.isInteger(tahunKegiatan) || tahunKegiatan < 1900 || tahunKegiatan > 9999) {
    errors.push(`Baris data ${rowNumber}: tahun_kegiatan harus berupa tahun bulat antara 1900 dan 9999.`)
  }

  const detailInformasi = getDetailInformasi(row, rowNumber, errors)
  if (errors.length > initialErrorCount) {
    return null
  }

  return {
    latitude,
    longitude,
    nama_lokasi: namaLokasi,
    nama_bidang: namaBidang,
    detail_informasi: detailInformasi,
    tahun_kegiatan: tahunKegiatan
  }
}

export async function importCsvToSupabase(file, namaBidang) {
  if (!file || typeof file.text !== 'function') {
    throw new Error('Pilih file CSV yang valid untuk diimpor.')
  }
  if (file.name && !file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Format file tidak didukung. Pilih file CSV (.csv).')
  }
  if (!bidangValid.has(namaBidang)) {
    throw new Error('Pilih nama bidang yang valid sebelum mengimpor CSV.')
  }

  const rows = await parseCsvFile(file)
  if (rows.length === 0) {
    throw new Error('File CSV tidak berisi baris data.')
  }

  const errors = []
  const records = rows.map((row, index) =>
    mapCsvRow(row, index + 1, namaBidang, errors)
  )

  if (errors.length > 0) {
    throw new Error(`CSV tidak diimpor:\n${errors.join('\n')}`)
  }

  const { supabase } = await import('./supabaseClient.js')
  const { error } = await supabase
    .from('lokasi_kegiatan')
    .insert(records)

  if (error) {
    throw new Error(`Gagal menyimpan data ke Supabase: ${error.message}`)
  }

  return { namaBidang, jumlahDataDiimpor: records.length }
}
