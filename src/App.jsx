import { useEffect, useState } from 'react';

import {
  MapContainer,
  LayersControl,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Tooltip,
  ScaleControl
} from 'react-leaflet';

import {
  Map,
  LayoutDashboard,
  Layers,
  MapPin,
  Info,
  Maximize2,
  Search
} from 'lucide-react';

import 'leaflet/dist/leaflet.css';
import './index.css';
import AdminDashboard from './AdminDashboard.jsx';

import { union } from '@turf/union';
import { difference } from '@turf/difference';

// DATA BATAS DESA DARI 12 KECAMATAN
import dataBolengRaw from "./data/boleng_53.15.06_batas_desa.geojson?raw";
import dataKomodoRaw from "./data/komodo_53.15.05_batas_desa.geojson?raw";
import dataKuwusRaw from "./data/kuwus_53.15.02_batas_desa.geojson?raw";
import dataKuwusBaratRaw from "./data/kuwus_barat_53.15.12_batas_desa.geojson?raw";
import dataLemborRaw from "./data/lembor_53.15.03_batas_desa.geojson?raw";
import dataLemborSelatanRaw from "./data/lembor_selatan_53.15.09_batas_desa.geojson?raw";
import dataMacangPacarRaw from "./data/macang_pacar_53.15.01_batas_desa.geojson?raw";
import dataMbelilingRaw from "./data/mbeliling_53.15.10_batas_desa.geojson?raw";
import dataNdosoRaw from "./data/ndoso_53.15.08_batas_desa.geojson?raw";
import dataPacarRaw from "./data/pacar_53.15.11_batas_desa.geojson?raw";
import dataSanoNggoangRaw from "./data/sano_nggoang_53.15.04_batas_desa.geojson?raw";
import dataWelakRaw from "./data/welak_53.15.07_batas_desa.geojson?raw";

const dataBoleng = JSON.parse(dataBolengRaw);
const dataKomodo = JSON.parse(dataKomodoRaw);
const dataKuwus = JSON.parse(dataKuwusRaw);
const dataKuwusBarat = JSON.parse(dataKuwusBaratRaw);
const dataLembor = JSON.parse(dataLemborRaw);
const dataLemborSelatan = JSON.parse(dataLemborSelatanRaw);
const dataMacangPacar = JSON.parse(dataMacangPacarRaw);
const dataMbeliling = JSON.parse(dataMbelilingRaw);
const dataNdoso = JSON.parse(dataNdosoRaw);
const dataPacar = JSON.parse(dataPacarRaw);
const dataSanoNggoang = JSON.parse(dataSanoNggoangRaw);
const dataWelak = JSON.parse(dataWelakRaw);

// DAFTAR KECAMATAN DAN WARNA
const districts = {
  '53.15.01': { name: 'Macang Pacar', color: '#F2C94C' },
  '53.15.02': { name: 'Kuwus', color: '#F2994A' },
  '53.15.03': { name: 'Lembor', color: '#EB5757' },
  '53.15.04': { name: 'Sano Nggoang', color: '#219653' },
  '53.15.05': { name: 'Komodo', color: '#2F80ED' },
  '53.15.06': { name: 'Boleng', color: '#27AE60' },
  '53.15.07': { name: 'Welak', color: '#56CCF2' },
  '53.15.08': { name: 'Ndoso', color: '#BB6BD9' },
  '53.15.09': { name: 'Lembor Selatan', color: '#2DCCBF' },
  '53.15.10': { name: 'Mbeliling', color: '#A67C52' },
  '53.15.11': { name: 'Pacar', color: '#8492A6' },
  '53.15.12': { name: 'Kuwus Barat', color: '#9B51E0' }
};

// GABUNGKAN SELURUH DATA GEOJSON
const allFeatures = [
  ...dataBoleng.features,
  ...dataKomodo.features,
  ...dataKuwus.features,
  ...dataKuwusBarat.features,
  ...dataLembor.features,
  ...dataLemborSelatan.features,
  ...dataMacangPacar.features,
  ...dataMbeliling.features,
  ...dataNdoso.features,
  ...dataPacar.features,
  ...dataSanoNggoang.features,
  ...dataWelak.features
];

const villageGeoJSON = {
  type: 'FeatureCollection',
  features: allFeatures
};

// BATAS GABUNGAN KABUPATEN MANGGARAI BARAT
const manggaraiBaratBoundary = union(villageGeoJSON);

// AREA DI LUAR KABUPATEN YANG AKAN DITUTUP
const outerArea = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-180, -85],
      [180, -85],
      [180, 85],
      [-180, 85],
      [-180, -85]
    ]]
  }
};

const maskGeoJSON = difference({
  type: 'FeatureCollection',
  features: [outerArea, manggaraiBaratBoundary]
});

const bidangMenus = [
  { id: 'dayasos', name: 'Bidang Dayasos', color: '#58c4a5' },
  { id: 'rehsos', name: 'Bidang Rehsos', color: '#72a7ff' },
  { id: 'uptd-ppa', name: 'UPTD PPA', color: '#f08c9b' },
  { id: 'khp2ha', name: 'Bidang KHP2HA', color: '#bd9cff' },
  { id: 'p3a', name: 'Bidang P3A', color: '#f2bd68' },
  { id: 'pskb', name: 'Bidang PSKB', color: '#70c8d8' }
];

const statisticIcons = [MapPin, Layers, Map];
const dayasosCategories = ['LKS', 'TKSK', 'KAT', 'LK3', 'TMP'];

function normalizeIdentifier(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getLocationDetails(location) {
  return location.detail_informasi &&
    typeof location.detail_informasi === 'object' &&
    !Array.isArray(location.detail_informasi)
    ? location.detail_informasi
    : {};
}

function getLocationDetail(location, ...keys) {
  const normalizedKeys = new Set(keys.map(normalizeIdentifier));
  const entry = Object.entries(getLocationDetails(location)).find(
    ([detailKey]) => normalizedKeys.has(normalizeIdentifier(detailKey))
  );
  return String(entry?.[1] ?? '').trim() || '—';
}

function getLocationField(location, fieldName, ...aliases) {
  const value = location[fieldName];
  if (value !== undefined && value !== null && String(value).trim()) {
    return String(value).trim();
  }
  return getLocationDetail(location, fieldName, ...aliases);
}

function getLocationStatus(location) {
  const statusFields = new Set([
    'status',
    'statuspenanganan',
    'statuspenanganankasus',
    'statustangani',
    'statuskasus',
    'tahappenanganan',
    'penanganan'
  ]);
  const statusEntry = Object.entries(getLocationDetails(location)).find(
    ([key, value]) => statusFields.has(normalizeIdentifier(key)) && String(value).trim()
  );
  const normalizedStatus = normalizeIdentifier(statusEntry?.[1] ?? '');

  if (normalizedStatus.startsWith('belum')) {
    return 'Belum ditangani';
  }
  if (
    normalizedStatus.startsWith('sedang') ||
    normalizedStatus === 'diproses' ||
    normalizedStatus === 'proses'
  ) {
    return 'Sedang ditangani';
  }
  if (
    normalizedStatus.startsWith('sudah') ||
    normalizedStatus === 'selesai' ||
    normalizedStatus === 'ditangani'
  ) {
    return 'Sudah ditangani';
  }

  return 'Status tidak tersedia';
}

function getLocationCategories(location, menuId) {
  const details = getLocationDetails(location);
  const jenisKategori = String(location.jenis_kategori ?? '').trim();

  if (menuId === 'dayasos') {
    const categoryText = jenisKategori || String(location.kategori ?? '').trim();
    const normalizedCategory = normalizeIdentifier(categoryText);
    if (normalizedCategory.includes('tksk')) {
      return ['TKSK'];
    }
    if (normalizedCategory.includes('lk3')) {
      return ['LK3'];
    }
    if (normalizedCategory.includes('tmp')) {
      return ['TMP'];
    }
    if (
      normalizedCategory.includes('lks') ||
      normalizedCategory.includes('kegiatanadministratif')
    ) {
      return ['LKS'];
    }
    if (/\bkat\b/i.test(categoryText)) {
      return ['KAT'];
    }

    const legacyDetailEntries = Object.entries(details).map(([key, value]) => [
      normalizeIdentifier(key),
      normalizeIdentifier(value)
    ]);
    const matchedCategory = dayasosCategories.find((category) =>
      legacyDetailEntries.some(([key, value]) =>
        key === normalizeIdentifier(category) || value === normalizeIdentifier(category)
      )
    );
    return [matchedCategory || 'LKS'];
  }

  if (jenisKategori && menuId !== 'uptd-ppa') {
    return [jenisKategori];
  }

  if (menuId === 'uptd-ppa') {
    return [getLocationStatus(location)];
  }

  const categories = Object.keys(details).filter((key) => String(details[key] ?? '').trim());
  return categories.length > 0 ? categories : ['Lokasi tanpa rincian'];
}

function getLayerCategories(menuId, locations) {
  if (menuId === 'dayasos') {
    return dayasosCategories;
  }

  if (menuId === 'uptd-ppa') {
    const statuses = ['Belum ditangani', 'Sedang ditangani', 'Sudah ditangani'];
    return locations.some((location) =>
      getLocationStatus(location) === 'Status tidak tersedia'
    )
      ? [...statuses, 'Status tidak tersedia']
      : statuses;
  }

  const categories = new Set();
  locations.forEach((location) => {
    getLocationCategories(location, menuId).forEach((category) => categories.add(category));
  });
  return [...categories];
}

function belongsToBidang(location, bidangId) {
  const bidang = normalizeIdentifier(location.nama_bidang).replace(/^bidang/, '');
  const selectedBidang = normalizeIdentifier(bidangId).replace(/^bidang/, '');
  return bidang === selectedBidang;
}

// ATURAN WARNA SETIAP POLIGON
function styleFeature(feature, selectedKecamatan) {
  const parentCode = feature.properties.parent_code;
  const district = districts[parentCode];
  const isSelected = selectedKecamatan === null || district?.name === selectedKecamatan;

  return {
    fillColor: district ? district.color : '#BDBDBD',
    fillOpacity: isSelected
      ? selectedKecamatan === null ? 0.55 : 0.75
      : 0.12,
    color: '#ffffff',
    weight: 1,
    opacity: isSelected ? 1 : 0.2,
    className: 'district-polygon'
  };
}

// INFORMASI SAAT WILAYAH DISENTUH
function onEachVillage(feature, layer) {
  const properties = feature?.properties ?? {};
  const villageName = properties.name || 'Nama tidak tersedia';
  const parentCode = properties.parent_code;
  const districtName = districts[parentCode]?.name || 'Kecamatan tidak diketahui';

  const label = document.createElement('span');
  label.className = 'village-label-content';
  label.textContent = villageName;

  const districtLabel = document.createElement('small');
  districtLabel.textContent = districtName;
  label.appendChild(districtLabel);

  layer.bindTooltip(
    label,
    {
      permanent: false,
      direction: 'center',
      className: 'village-label'
    }
  );
}

function App() {
  const [activeMenu, setActiveMenu] = useState('peta-utama');
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [mapDataError, setMapDataError] = useState('');
  const [enabledLayers, setEnabledLayers] = useState({});
  const activeBidang = bidangMenus.find(({ id }) => id === activeMenu);
  const bidangLocations = activeBidang
    ? mapLocations.filter((location) => belongsToBidang(location, activeBidang.id))
    : mapLocations;
  const layerCategories = activeBidang
    ? getLayerCategories(activeBidang.id, bidangLocations)
    : [];
  const visibleLocations = activeBidang
    ? bidangLocations.filter((location) =>
        getLocationCategories(location, activeBidang.id).some((category) =>
          enabledLayers[`${activeBidang.id}:${normalizeIdentifier(category)}`] !== false
        )
      )
    : mapLocations;
  const activeLayerCount = layerCategories.filter((category) =>
    enabledLayers[`${activeMenu}:${normalizeIdentifier(category)}`] !== false
  ).length;

  const statistics = activeMenu === 'peta-utama'
    ? [
        { label: 'Lokasi Terdata', value: `${mapLocations.length} Lokasi` },
        { label: 'Wilayah Administratif', value: `${allFeatures.length} Desa` },
        { label: 'Bidang Tersedia', value: `${bidangMenus.length} Bidang` }
      ]
    : activeMenu === 'uptd-ppa'
      ? [
          { label: 'Total Kasus Masuk', value: `${bidangLocations.length} Kasus` },
          {
            label: 'Kasus Ditangani',
            value: `${bidangLocations.filter((location) =>
              ['Sedang ditangani', 'Sudah ditangani'].includes(getLocationStatus(location))
            ).length} Kasus`
          },
          {
            label: 'Kasus Selesai',
            value: `${bidangLocations.filter((location) =>
              getLocationStatus(location) === 'Sudah ditangani'
            ).length} Kasus`
          }
        ]
      : [
          { label: 'Total Lokasi', value: `${bidangLocations.length} Lokasi` },
          { label: 'Subkategori', value: `${layerCategories.length} Kategori` },
          {
            label: 'Tahun Terbaru',
            value: `${bidangLocations.reduce(
              (latestYear, { tahun_kegiatan: year }) => Math.max(latestYear, Number(year) || 0),
              0
            ) || '—'}`
          }
        ];

  useEffect(() => {
    function loadCsvDatasets() {
      setIsLoadingLocations(true);
      setMapDataError('');

      try {
        const storedData = window.localStorage.getItem('data_gis_dinsos') ??
          window.localStorage.getItem('csvDatasets');
        if (!storedData) {
          setMapLocations([]);
          return;
        }

        const parsedData = JSON.parse(storedData);
        setMapLocations(Array.isArray(parsedData) ? parsedData : []);
      } catch (error) {
        setMapLocations([]);
        setMapDataError(
          error instanceof Error
            ? error.message
            : 'Gagal membaca data CSV dari browser.'
        );
      } finally {
        setIsLoadingLocations(false);
      }
    }

    function handleStorageChange(event) {
      if (
        event.key === 'data_gis_dinsos' ||
        event.key === 'csvDatasets' ||
        event.key === null
      ) {
        loadCsvDatasets();
      }
    }

    loadCsvDatasets();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dataGisDinsosUpdated', loadCsvDatasets);
    window.addEventListener('csvDatasetsUpdated', loadCsvDatasets);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataGisDinsosUpdated', loadCsvDatasets);
      window.removeEventListener('csvDatasetsUpdated', loadCsvDatasets);
    };
  }, []);

  function renderCsvMarkers() {
    return visibleLocations.flatMap((location, index) => {
      const latitude = Number(location.latitude);
      const longitude = Number(location.longitude);
      if (
        location.latitude == null ||
        location.longitude == null ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        return [];
      }

      const status = activeMenu === 'uptd-ppa' ? getLocationStatus(location) : null;
      const locationName = location.nama_item || location.nama_lokasi || 'Nama lokasi tidak tersedia';
      const popupTitle = getLocationField(location, 'nama_lembaga_kegiatan');
      return [
        <Marker key={`${locationName}-${latitude}-${longitude}-${index}`} position={[latitude, longitude]}>
          <Tooltip
            permanent={true}
            direction="top"
            offset={[0, -8]}
            opacity={1}
            className="supabase-location-label"
          >
            <strong>{locationName}</strong>
            <br />
            {location.nama_bidang} · {location.tahun_kegiatan}
            {status && (
              <>
                <br />
                Status: {status}
              </>
            )}
          </Tooltip>
          <Popup minWidth={320} maxWidth={400} className="custom-popup">
            <div className="location-popup-content tw-text-slate-900 tw-w-full tw-p-1">
              <h3 className="location-popup-title tw-mb-2 tw-border-b tw-border-slate-200 tw-pb-1 tw-text-base tw-font-bold">
                {popupTitle !== '—' ? popupTitle : locationName}
              </h3>
              <dl className="location-popup-fields">
                <div>
                  <dt>Bidang</dt>
                  <dd>{getLocationField(location, 'nama_bidang')}</dd>
                </div>
                <div>
                  <dt>Jenis Kategori</dt>
                  <dd>{getLocationField(location, 'jenis_kategori')}</dd>
                </div>
                <div>
                  <dt>Lokasi</dt>
                  <dd>{getLocationField(location, 'nama_lokasi')}</dd>
                </div>
                <div>
                  <dt>Tahun Kegiatan</dt>
                  <dd>{getLocationField(location, 'tahun_kegiatan')}</dd>
                </div>
                <div>
                  <dt>Sasaran / Target</dt>
                  <dd>{getLocationField(location, 'sasaran_target', 'Sasaran / Target')}</dd>
                </div>
                <div>
                  <dt>Keterangan</dt>
                  <dd>{getLocationField(location, 'keterangan')}</dd>
                </div>
              </dl>
            </div>
          </Popup>
        </Marker>
      ];
    });
  }

  const menus = [
    { id: 'peta-utama', name: 'Peta Utama', icon: Map },
    { id: 'dashboard-admin', name: 'Dashboard Admin', icon: LayoutDashboard },
    ...bidangMenus.map((bidang) => ({ ...bidang, icon: MapPin }))
  ];

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Map size={26} />
          </div>

          <div>
            <h2>WEB GIS</h2>
            <span>MANGGARAI BARAT</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-label">MENU UTAMA</p>

          {menus.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
                aria-current={activeMenu === item.id ? 'page' : undefined}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <span className="status-indicator"></span>
          <span>Sistem Pemetaan Aktif</span>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* HEADER */}
        <header className="topbar">

          <div>
            <h1>Web GIS Kabupaten Manggarai Barat</h1>
            <p>Geographic Information System</p>
          </div>

          <div className="topbar-right">
            <span className="online-status">
              ● Online
            </span>
          </div>

        </header>

        {/* CONTENT */}
        {activeMenu === 'dashboard-admin' ? (
          <AdminDashboard />
        ) : (
        <section className="content-area">

          <div className="welcome">
            <div>
              <h2>{activeBidang?.name ?? 'Peta Utama'}</h2>
              <p>
                {activeBidang
                  ? `Visualisasi sebaran data ${activeBidang.name} di Kabupaten Manggarai Barat`
                  : 'Visualisasi gabungan data bidang serta batas administrasi Kabupaten Manggarai Barat'}
              </p>
            </div>
          </div>

          {/* STATISTICS */}
          <div className="statistics">

            {statistics.map((statistic, index) => {
              const Icon = statisticIcons[index];
              return (
                <div className="stat-card" key={statistic.label}>
                <div className={`stat-icon ${['blue', 'green', 'orange'][index]}`}>
                  <Icon size={23} />
                </div>
                  <div>
                    <span>{statistic.label}</span>
                    <h3>{statistic.value}</h3>
                  </div>
                </div>
              );
            })}

          </div>

          {/* MAP CARD */}
          <div className="map-card">

            <div className="map-header">

              <div>
                <h3>{activeBidang ? `Peta ${activeBidang.name}` : 'Peta Gabungan Kabupaten Manggarai Barat'}</h3>
                <span>
                  {activeBidang
                    ? `${bidangLocations.length} lokasi bidang · ${layerCategories.length} kategori layer`
                    : 'Batas desa/kelurahan dan data gabungan seluruh bidang'}
                </span>
              </div>

              <button
                className="map-action"
                onClick={() => window.open(
                  'https://www.arcgis.com/apps/mapviewer/',
                  '_blank'
                )}
              >
                <Maximize2 size={17} />
                <span>Map Viewer</span>
              </button>

            </div>

            {/* INTERACTIVE MAP */}
            <div className="map-wrapper">

              <MapContainer
                center={[-8.65, 119.9]}
                zoom={9}
                minZoom={7}
                maxZoom={18}
                scrollWheelZoom={true}
                className="leaflet-map"
              >

                <LayersControl position="topright">
                  <LayersControl.BaseLayer name="Peta Jalan">
                    <TileLayer
                      attribution='Tiles &copy; Esri — Sources: Esri, HERE, Garmin, USGS, Intermap, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                  </LayersControl.BaseLayer>

                  <LayersControl.BaseLayer checked name="Citra Satelit">
                    <TileLayer
                      attribution='&copy; Google'
                      url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                      maxZoom={20}
                    />
                  </LayersControl.BaseLayer>

                  <LayersControl.Overlay checked name="Jalan & Label">
                    <TileLayer
                      attribution='Overlay &copy; Esri — Sources: Esri, HERE, Garmin, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                  </LayersControl.Overlay>
                </LayersControl>

                <ScaleControl position="bottomright" metric imperial={false} />

                {/* PENUTUP AREA DI LUAR MANGGARAI BARAT */}
                <GeoJSON
                  data={maskGeoJSON}
                  style={() => ({
                    fillColor: '#f3f6fa',
                    fillOpacity: 1,
                    color: '#f3f6fa',
                    weight: 0,
                    opacity: 0
                  })}
                />

                {/* BATAS DAN WARNA 12 KECAMATAN */}
                <GeoJSON
                  data={villageGeoJSON}
                  style={(feature) => styleFeature(feature, selectedKecamatan)}
                  onEachFeature={onEachVillage}
                />

                {renderCsvMarkers()}

              </MapContainer>

              {activeBidang && (
                <section className="layer-manager map-layer-manager" aria-labelledby="layer-manager-title">
                  <div className="layer-manager-heading">
                    <div>
                      <h3 id="layer-manager-title">Manajemen Layer</h3>
                      <p>Filter subkategori {activeBidang.name}</p>
                    </div>
                    <span className="layer-count">{activeLayerCount}/{layerCategories.length}</span>
                  </div>
                  <div className="layer-list">
                    {layerCategories.length > 0 ? layerCategories.map((category) => {
                      const layerKey = `${activeMenu}:${normalizeIdentifier(category)}`;
                      const isEnabled = enabledLayers[layerKey] !== false;
                      return (
                        <label className="layer-item" key={layerKey}>
                          <span className="layer-item-info">
                            <span
                              className="layer-color"
                              style={{ '--layer-color': activeBidang.color }}
                              aria-hidden="true"
                            />
                            <span className="layer-item-copy">
                              <span className="layer-name">{category}</span>
                              <span className="layer-state">
                                {isEnabled ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </span>
                          </span>
                          <input
                            className="layer-toggle-input"
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => setEnabledLayers((current) => ({
                              ...current,
                              [layerKey]: !isEnabled
                            }))}
                            aria-label={`${isEnabled ? 'Matikan' : 'Aktifkan'} layer ${category}`}
                          />
                          <span className="layer-toggle" aria-hidden="true" />
                        </label>
                      );
                    }) : (
                      <p className="layer-empty">Belum ada data untuk bidang ini.</p>
                    )}
                  </div>
                </section>
              )}

              {/* MAP LEGEND */}
              <div className="map-legend district-legend">

                <strong>LEGENDA KECAMATAN</strong>

                {Object.entries(districts).map(([code, district]) => (
                  <button
                    className={`district-legend-item ${
                      selectedKecamatan === district.name ? 'active' : ''
                    }`}
                    key={code}
                    type="button"
                    aria-pressed={selectedKecamatan === district.name}
                    onClick={() => setSelectedKecamatan((current) =>
                      current === district.name ? null : district.name
                    )}
                  >
                    <span
                      className="district-swatch"
                      style={{ backgroundColor: district.color }}
                      aria-hidden="true"
                    />
                    <span>{district.name}</span>
                  </button>
                ))}

              </div>

              {/* MAP INFORMATION */}
              <div className="map-search">
                <Search size={17} />
                <span>Sentuh wilayah untuk melihat nama desa dan kecamatan</span>
              </div>

            </div>

          </div>

          {/* FOOTER */}
          <div className="footer-info">
            <Info size={16} />

            <span>
              Peta menampilkan data batas administrasi dari 12 file GeoJSON.
              Warna poligon menunjukkan kecamatan berdasarkan kode wilayah.
              {' '}
              {isLoadingLocations
                ? 'Memuat lokasi dari LocalStorage...'
                : mapDataError
                  ? `Gagal memuat lokasi: ${mapDataError}`
                  : `${mapLocations.length} lokasi dimuat dari localStorage browser.`}
            </span>
          </div>

        </section>
        )}

      </main>

    </div>
  );
}

export default App;
