import { useEffect, useState } from 'react';

import {
  MapContainer,
  LayersControl,
  TileLayer,
  GeoJSON,
  Marker,
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

const managedLayers = [
  { id: 'dayasos', name: 'Bidang Dayasos', color: '#58c4a5' },
  { id: 'rehsos', name: 'Bidang Rehsos', color: '#72a7ff' },
  { id: 'uptd-ppa', name: 'UPTD PPA', color: '#f08c9b' },
  { id: 'khp2ha', name: 'Bidang KHP2HA', color: '#bd9cff' },
  { id: 'p3a', name: 'Bidang P3A', color: '#f2bd68' },
  { id: 'pskb', name: 'Bidang PSKB', color: '#70c8d8' }
];

function normalizeIdentifier(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ATURAN WARNA SETIAP POLIGON
function styleFeature(feature) {
  const parentCode = feature.properties.parent_code;
  const district = districts[parentCode];

  return {
    fillColor: district ? district.color : '#BDBDBD',
    fillOpacity: 0.55,
    color: '#ffffff',
    weight: 1,
    opacity: 1
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
  const [activeMenu, setActiveMenu] = useState('Peta Interaktif');
  const [mapLocations, setMapLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [mapDataError, setMapDataError] = useState('');
  const [enabledLayers, setEnabledLayers] = useState(() =>
    Object.fromEntries(managedLayers.map(({ id }) => [id, true]))
  );
  const activeLayerCount = Object.values(enabledLayers).filter(Boolean).length;

  useEffect(() => {
    const controller = new AbortController();

    async function loadMapLocations() {
      try {
        const { supabase } = await import('./supabaseClient.js');
        if (controller.signal.aborted) {
          return;
        }

        setIsLoadingLocations(true);
        setMapDataError('');
        const pageSize = 1000;
        const locations = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore && !controller.signal.aborted) {
          const { data, error } = await supabase
            .from('lokasi_kegiatan')
            .select('id, latitude, longitude, nama_lokasi, nama_bidang, tahun_kegiatan')
            .order('id', { ascending: true })
            .range(offset, offset + pageSize - 1)
            .abortSignal(controller.signal);

          if (error) {
            throw error;
          }

          const page = data ?? [];
          locations.push(...page);
          hasMore = page.length === pageSize;
          offset += pageSize;
        }

        if (!controller.signal.aborted) {
          setMapLocations(locations);
          setMapDataError('');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setMapDataError(
            error instanceof Error
              ? error.message
              : error?.message ?? 'Gagal memuat lokasi dari Supabase.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingLocations(false);
        }
      }
    }

    loadMapLocations();
    return () => controller.abort();
  }, [activeMenu]);

  function renderSupabaseMarkers() {
    return mapLocations.flatMap((location) => {
      const layer = managedLayers.find(
        ({ id }) => normalizeIdentifier(id) === normalizeIdentifier(location.nama_bidang)
      );
      if (!layer || !enabledLayers[layer.id]) {
        return [];
      }

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

      return [
        <Marker key={location.id} position={[latitude, longitude]}>
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <strong>{location.nama_lokasi || 'Nama lokasi tidak tersedia'}</strong>
            <br />
            {location.nama_bidang} · {location.tahun_kegiatan}
          </Tooltip>
        </Marker>
      ];
    });
  }

  const menus = [
    { name: 'Dashboard Admin', icon: LayoutDashboard },
    { name: 'Peta Interaktif', icon: Map },
    { name: 'Data Wilayah', icon: MapPin },
    { name: 'Manajemen Layer', icon: Layers }
  ];

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className={`sidebar ${activeMenu === 'Manajemen Layer' ? 'sidebar-layer-open' : ''}`}>

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
                className={`menu-item ${
                  activeMenu === item.name ? 'active' : ''
                }`}
                onClick={() => setActiveMenu(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {activeMenu === 'Manajemen Layer' && (
          <section className="layer-manager" aria-labelledby="layer-manager-title">
            <div className="layer-manager-heading">
              <div>
                <h3 id="layer-manager-title">Manajemen Layer</h3>
                <p>Atur tampilan data bidang</p>
              </div>
              <span className="layer-count">{activeLayerCount}/6</span>
            </div>

            <div className="layer-list">
              {managedLayers.map((layer) => (
                <label className="layer-item" key={layer.id}>
                  <span className="layer-item-info">
                    <span
                      className="layer-color"
                      style={{ '--layer-color': layer.color }}
                      aria-hidden="true"
                    />
                    <span className="layer-item-copy">
                      <span className="layer-name">{layer.name}</span>
                      <span className="layer-state">
                        {enabledLayers[layer.id] ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </span>
                  </span>
                  <input
                    className="layer-toggle-input"
                    type="checkbox"
                    checked={enabledLayers[layer.id]}
                    onChange={() => setEnabledLayers((current) => ({
                      ...current,
                      [layer.id]: !current[layer.id]
                    }))}
                    aria-label={`${enabledLayers[layer.id] ? 'Matikan' : 'Aktifkan'} ${layer.name}`}
                  />
                  <span className="layer-toggle" aria-hidden="true" />
                </label>
              ))}
            </div>
          </section>
        )}

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
        {activeMenu === 'Dashboard Admin' ? (
          <AdminDashboard />
        ) : (
        <section className="content-area">

          <div className="welcome">
            <div>
              <h2>Peta Interaktif</h2>
              <p>
                Visualisasi batas administrasi desa dan kecamatan
                Kabupaten Manggarai Barat, Nusa Tenggara Timur
              </p>
            </div>
          </div>

          {/* STATISTICS */}
          <div className="statistics">

            <div className="stat-card">
              <div className="stat-icon blue">
                <MapPin size={23} />
              </div>

              <div>
                <span>Kecamatan</span>
                <h3>12 Kecamatan</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <Layers size={23} />
              </div>

              <div>
                <span>Data Wilayah</span>
                <h3>{allFeatures.length} Poligon Desa</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                <Map size={23} />
              </div>

              <div>
                <span>Sumber Peta Dasar</span>
                <h3>Peta Jalan &amp; Satelit (Esri)</h3>
              </div>
            </div>

          </div>

          {/* MAP CARD */}
          <div className="map-card">

            <div className="map-header">

              <div>
                <h3>Peta Administrasi Kabupaten Manggarai Barat</h3>
                <span>Batas desa/kelurahan dibedakan berdasarkan kecamatan</span>
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
                      attribution='Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
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
                  style={styleFeature}
                  onEachFeature={onEachVillage}
                />

                {renderSupabaseMarkers()}

              </MapContainer>

              {/* MAP LEGEND */}
              <div className="map-legend district-legend">

                <strong>LEGENDA KECAMATAN</strong>

                {Object.entries(districts).map(([code, district]) => (
                  <div className="district-legend-item" key={code}>
                    <span
                      className="district-swatch"
                      style={{ backgroundColor: district.color }}
                    ></span>
                    <span>{district.name}</span>
                  </div>
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
                ? 'Memuat lokasi dari Supabase...'
                : mapDataError
                  ? `Gagal memuat lokasi: ${mapDataError}`
                  : `${mapLocations.length} lokasi dimuat dari Supabase.`}
            </span>
          </div>

        </section>
        )}

      </main>

    </div>
  );
}

export default App;
