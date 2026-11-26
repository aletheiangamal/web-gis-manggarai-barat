import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  MapContainer,
  useMap,
  LayersControl,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Tooltip,
  ScaleControl
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import { control, divIcon, DomEvent, DomUtil, geoJSON } from 'leaflet';

import {
  Map as MapIcon,
  LayoutDashboard,
  Layers,
  MapPin,
  Info,
  Maximize2,
  Search,
  Download,
  Printer,
  LogIn,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts';

import Papa from 'papaparse';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import './index.css';
import { useAuth } from './useAuth.js';
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
  { id: 'dayasos', name: 'Bidang Dayasos', color: '#3b82f6' },
  { id: 'rehsos', name: 'Bidang Rehsos', color: '#10b981' },
  { id: 'uptd-ppa', name: 'UPTD PPA', color: '#f43f5e' },
  { id: 'khp2ha', name: 'Bidang KHP2HA', color: '#06b6d4' },
  { id: 'p3a', name: 'Bidang P3A', color: '#a855f7' },
  { id: 'pskb', name: 'Bidang PSKB', color: '#f59e0b' }
];

const statisticIcons = [MapPin, Layers, MapIcon];
const dayasosCategories = ['LKS', 'TKSK', 'KAT', 'LK3', 'TMP'];
const MAP_INITIAL_CENTER = [-8.65, 119.9];
const MAP_INITIAL_ZOOM = 10;

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

function getFirstLocationField(location, ...fieldNames) {
  return fieldNames
    .map((fieldName) => getLocationField(location, fieldName))
    .find((value) => value !== '—') ?? '—';
}

function getAreaFromLocationName(locationName, level) {
  const keywords = level === 'kecamatan'
    ? 'kecamatan|kec\\.?'
    : 'desa|kelurahan|kel\\.?';
  const nextAreaKeywords = level === 'kecamatan'
    ? 'desa|kelurahan|kel\\.?'
    : 'kecamatan|kec\\.?';
  const match = String(locationName ?? '').match(
    new RegExp(`(?:^|[\\s,])(?:${keywords})\\s*[:\\-]?\\s*(.+?)(?=\\s+(?:${nextAreaKeywords})\\b|[,;/|]|$)`, 'i')
  );
  return match?.[1]?.trim().replace(/[.)\s]+$/, '') || null;
}

function isPointInRing(point, ring) {
  const [longitude, latitude] = point;
  let isInside = false;

  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index++) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[previousIndex];
    const crossProduct = (latitude - y1) * (x2 - x1) - (longitude - x1) * (y2 - y1);
    const isOnSegment = Math.abs(crossProduct) < 1e-10 &&
      longitude >= Math.min(x1, x2) &&
      longitude <= Math.max(x1, x2) &&
      latitude >= Math.min(y1, y2) &&
      latitude <= Math.max(y1, y2);

    if (isOnSegment) {
      return true;
    }

    if ((y1 > latitude) !== (y2 > latitude) &&
      longitude < ((x2 - x1) * (latitude - y1)) / (y2 - y1) + x1) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function isPointInPolygon(point, polygon) {
  const [outerRing, ...holes] = polygon;
  return isPointInRing(point, outerRing) &&
    !holes.some((hole) => isPointInRing(point, hole));
}

function getAreaFromCoordinates(location, level) {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const feature = allFeatures.find(({ geometry }) => {
    if (geometry.type === 'Polygon') {
      return isPointInPolygon([longitude, latitude], geometry.coordinates);
    }
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.some((polygon) =>
        isPointInPolygon([longitude, latitude], polygon)
      );
    }
    return false;
  });

  if (!feature) {
    return null;
  }

  return level === 'desa'
    ? feature.properties.name
    : districts[feature.properties.parent_code]?.name ?? null;
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

function getPercentageCategories(menuId, locations) {
  if (menuId === 'dayasos') {
    return dayasosCategories;
  }

  const categories = new Set();
  locations.forEach((location) => {
    const jenisKategori = String(location.jenis_kategori ?? '').trim();
    const locationCategories = jenisKategori
      ? [jenisKategori]
      : getLocationCategories(location, menuId);
    locationCategories.forEach((category) => categories.add(category));
  });
  return [...categories];
}

function getPercentageLocationCategories(location, menuId) {
  const jenisKategori = String(location.jenis_kategori ?? '').trim();
  return menuId !== 'dayasos' && jenisKategori
    ? [jenisKategori]
    : getLocationCategories(location, menuId);
}

function formatPercentage(count, total) {
  return total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%';
}

function getLocationSearchText(location) {
  const fields = [
    location.nama_item,
    location.nama_lokasi,
    location.nama_lembaga_kegiatan,
    location.nama_program,
    location.program,
    location.nama_desa,
    location.desa,
    location.kelurahan,
    location.nama_kecamatan,
    location.kecamatan,
    ...Object.values(getLocationDetails(location))
  ];
  return fields
    .filter((value) => value !== null && value !== undefined)
    .map(String)
    .join(' ')
    .toLocaleLowerCase('id');
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const { label, count, percentage } = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p>{label}</p>
      <strong>{count} lokasi</strong>
      <span>{percentage}</span>
    </div>
  );
}

function MapFlyToController({ searchSelection, tableSelection, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    const location = searchSelection?.location;
    if (!location) {
      return;
    }

    map.flyTo([Number(location.latitude), Number(location.longitude)], 16);
  }, [map, searchSelection]);

  useEffect(() => {
    const location = tableSelection?.location;
    if (!location) {
      return;
    }

    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return;
    }

    map.flyTo([latitude, longitude], 16);
    markerRefs.current.get(location)?.openPopup();
  }, [map, tableSelection, markerRefs]);

  return null;
}

function MapDistrictController({ selectedKecamatan }) {
  const map = useMap();

  useEffect(() => {
    const features = selectedKecamatan
      ? allFeatures.filter((feature) =>
          districts[feature.properties.parent_code]?.name === selectedKecamatan
        )
      : allFeatures;
    const bounds = geoJSON({
      type: 'FeatureCollection',
      features
    }).getBounds();

    if (bounds.isValid()) {
      map.flyToBounds(bounds, {
        padding: [24, 24],
        maxZoom: selectedKecamatan ? 12 : MAP_INITIAL_ZOOM,
        duration: 0.8
      });
    }
  }, [map, selectedKecamatan]);

  return null;
}

function MapHomeControl() {
  const map = useMap();

  useEffect(() => {
    const homeControl = control({ position: 'topleft' });
    homeControl.onAdd = () => {
      const container = DomUtil.create('div', 'leaflet-bar leaflet-control map-home-control');
      const button = DomUtil.create('button', 'map-home-button', container);
      button.type = 'button';
      button.title = 'Kembalikan tampilan peta';
      button.setAttribute('aria-label', 'Kembalikan tampilan peta ke Manggarai Barat');
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/></svg>';
      DomEvent.disableClickPropagation(container);
      DomEvent.on(button, 'click', () => map.flyTo(MAP_INITIAL_CENTER, MAP_INITIAL_ZOOM));
      return container;
    };

    homeControl.addTo(map);
    return () => homeControl.remove();
  }, [map]);

  return null;
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
    color: selectedKecamatan === district?.name ? '#e0f2fe' : '#ffffff',
    weight: selectedKecamatan === district?.name ? 3 : 1,
    opacity: isSelected ? 1 : 0.3,
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, signIn, signOut } = useAuth();
  const [activeMenu, setActiveMenu] = useState('peta-utama');
  const isAdmin = Boolean(session);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const isLoginModalOpen = showLoginModal;
  const requestedKecamatan = searchParams.get('kecamatan');
  const selectedKecamatan = Object.values(districts).find(({ name }) =>
    normalizeIdentifier(name) === normalizeIdentifier(requestedKecamatan ?? '')
  )?.name ?? null;
  const requestedYear = searchParams.get('tahun');
  const selectedYear = ['2024', '2025', '2026'].includes(requestedYear)
    ? requestedYear
    : 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [searchSelection, setSearchSelection] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const [chartAreaLevel, setChartAreaLevel] = useState('kecamatan');
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [mapDataError, setMapDataError] = useState('');
  const [enabledLayers, setEnabledLayers] = useState({});
  const [hasAgencyLogo, setHasAgencyLogo] = useState(true);
  const markerRefs = useRef(new Map());
  const tableSelectionId = useRef(0);
  const [tableSelection, setTableSelection] = useState(null);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);
  const yearFilteredLocations = selectedYear === 'all'
    ? mapLocations
    : mapLocations.filter((location) =>
        String(location.tahun_kegiatan ?? '').trim() === selectedYear
      );
  const chartLocations = searchQuery.trim()
    ? yearFilteredLocations.filter((location) =>
        getLocationSearchText(location).includes(searchQuery.trim().toLocaleLowerCase('id'))
      )
    : yearFilteredLocations;
  const activityChartData = bidangMenus.map((bidang) => {
    const count = chartLocations.filter((location) =>
      belongsToBidang(location, bidang.id)
    ).length;
    return {
      label: bidang.name.replace(/^Bidang /, ''),
      count,
      percentage: formatPercentage(count, chartLocations.length),
      color: bidang.color
    };
  });
  const areaCounts = chartLocations.reduce((counts, location) => {
    const level = chartAreaLevel;
    const areaName = getFirstLocationField(
      location,
      ...(level === 'kecamatan'
        ? ['nama_kecamatan', 'kecamatan']
        : ['nama_desa', 'desa', 'kelurahan'])
    );
    const label = areaName !== '—'
      ? areaName
      : getAreaFromLocationName(location.nama_lokasi, level) ??
        getAreaFromCoordinates(location, level);
    if (label) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return counts;
  }, new Map());
  const topAreas = [...areaCounts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: formatPercentage(count, chartLocations.length)
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'id'))
    .slice(0, 5);
  const searchResults = searchQuery.trim()
    ? yearFilteredLocations.filter((location) => {
        const latitude = Number(location.latitude);
        const longitude = Number(location.longitude);
        return (
          Number.isFinite(latitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          Number.isFinite(longitude) &&
          longitude >= -180 &&
          longitude <= 180 &&
          getLocationSearchText(location).includes(searchQuery.trim().toLocaleLowerCase('id'))
        );
      }).slice(0, 6)
    : [];
  const activeBidang = bidangMenus.find(({ id }) => id === activeMenu);
  const bidangLocations = activeBidang
    ? yearFilteredLocations.filter((location) => belongsToBidang(location, activeBidang.id))
    : yearFilteredLocations;
  const layerCategories = activeBidang
    ? getLayerCategories(activeBidang.id, bidangLocations)
    : [];
  const visibleLocations = activeBidang
    ? bidangLocations.filter((location) =>
        getLocationCategories(location, activeBidang.id).some((category) =>
          enabledLayers[`${activeBidang.id}:${normalizeIdentifier(category)}`] !== false
        )
      )
    : yearFilteredLocations;
  const activeLayerCount = layerCategories.filter((category) =>
    enabledLayers[`${activeMenu}:${normalizeIdentifier(category)}`] !== false
  ).length;
  const percentageCards = activeBidang
    ? getPercentageCategories(activeBidang.id, bidangLocations).map((category) => {
        const categoryLocations = bidangLocations.filter((location) =>
          getPercentageLocationCategories(location, activeBidang.id).some(
            (locationCategory) =>
              normalizeIdentifier(locationCategory) === normalizeIdentifier(category)
          )
        );
        return {
          key: category,
          label: category === 'LKS' ? 'Lembaga (LKS)' : category,
          count: categoryLocations.length,
          percentage: formatPercentage(categoryLocations.length, bidangLocations.length),
          color: activeBidang.color
        };
      })
    : bidangMenus.map((bidang) => {
      const count = yearFilteredLocations.filter((location) =>
          belongsToBidang(location, bidang.id)
        ).length;
        return {
          key: bidang.id,
          label: bidang.name.replace(/^Bidang /, ''),
          count,
          percentage: formatPercentage(count, yearFilteredLocations.length),
          color: bidang.color
        };
      });

  function updateFilterParam(name, value) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (!value || value === 'all') {
        nextParams.delete(name);
      } else {
        nextParams.set(name, value);
      }
      return nextParams;
    }, { replace: true });
  }

  function openLoginModal() {
    setLoginError('');
    setShowLoginModal(true);
  }

  function closeLoginModal() {
    setShowLoginModal(false);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');
    try {
      await signIn(loginEmail.trim(), loginPassword);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      navigate('/admin');
    } catch (error) {
      setLoginError(error instanceof Error
        ? error.message
        : 'Gagal masuk menggunakan Supabase.');
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      setActiveMenu('peta-utama');
      navigate('/', { replace: true });
    } catch (error) {
      setLoginError(error instanceof Error
        ? error.message
        : 'Gagal keluar dari sesi Supabase.');
    }
  }

  const statistics = activeMenu === 'peta-utama'
    ? [
        { label: 'Lokasi Terdata', value: `${yearFilteredLocations.length} Lokasi` },
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

  function downloadFilteredCsv() {
    const csv = Papa.unparse(visibleLocations);
    const bidangSlug = activeBidang
      ? activeBidang.name.replace(/^Bidang\s+/, '').replace(/[^a-z0-9]+/gi, '_')
      : 'Semua_Bidang';
    const yearSlug = selectedYear === 'all' ? 'Semua_Tahun' : selectedYear;
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `Rekap_Data_Dinsos_Mabar_${bidangSlug}_${yearSlug}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  }

  function printReport() {
    window.print();
  }

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
      const markerColor = bidangMenus.find((bidang) =>
        belongsToBidang(location, bidang.id)
      )?.color ?? '#94a3b8';
      return [
        <Marker
          key={`${locationName}-${latitude}-${longitude}-${index}`}
          ref={(marker) => {
            if (marker) {
              markerRefs.current.set(location, marker);
            } else {
              markerRefs.current.delete(location);
            }
          }}
          position={[latitude, longitude]}
          icon={divIcon({
            className: 'field-marker-icon',
            html: `<span class="field-marker-dot" style="--marker-color:${markerColor}"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          })}
        >
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
    { id: 'peta-utama', name: 'Peta Utama', icon: MapIcon },
    ...(isAdmin
      ? [{ id: 'dashboard-admin', name: 'Dashboard Admin', icon: LayoutDashboard }]
      : []),
    ...bidangMenus.map((bidang) => ({ ...bidang, icon: MapPin }))
  ];

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="mobile-drawer-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Tutup menu"
        />
      )}
      <aside
        id="app-sidebar"
        className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}
      >

        <div className="brand">
          <div className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center">
            {hasAgencyLogo ? (
              <img
                src="/logo-mabar.png"
                alt="Logo Kabupaten Manggarai Barat"
                className="tw-h-10 tw-w-10 tw-object-contain"
                onError={() => setHasAgencyLogo(false)}
              />
            ) : (
              <MapPin
                size={24}
                strokeWidth={2.5}
                className="tw-text-cyan-300 tw-drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="tw-min-w-0">
            <h2 className="tw-text-xs tw-font-extrabold tw-leading-tight tw-tracking-wider tw-text-slate-100">
              PIN DINSOSP3A
            </h2>
            <span className="tw-mt-1 tw-block tw-text-[10px] tw-font-medium tw-text-slate-400">
              Kab. Manggarai Barat
            </span>
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
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (item.id === 'dashboard-admin' && !isAdmin) {
                    openLoginModal();
                    return;
                  }
                  if (item.id === 'dashboard-admin') {
                    navigate('/admin');
                    return;
                  }
                  setActiveMenu(item.id);
                }}
                aria-current={activeMenu === item.id ? 'page' : undefined}
              >
                <Icon size={19} style={item.color ? { color: item.color } : undefined} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="status-indicator"></span>
            <span>Sistem Pemetaan Aktif</span>
          </div>
          {loginError && !isLoginModalOpen && (
            <p role="alert" className="tw-text-xs tw-text-rose-300">
              {loginError}
            </p>
          )}
          {isAdmin ? (
            <button
              type="button"
              onClick={handleLogout}
              className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-slate-600 tw-bg-slate-800 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-slate-200 hover:tw-bg-slate-700"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-sky-500/40 tw-bg-sky-500/10 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-sky-200 hover:tw-bg-sky-500/20"
              aria-label="Login Admin"
              title="Login Admin"
            >
              <LogIn size={15} />
              <span>Login Admin</span>
            </button>
          )}
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        <div
          className="topbar-announcement tw-w-full tw-overflow-hidden"
          aria-label="Selamat Datang di PIN DINSOSP3A (Peta Informasi Navigasi Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kab. Manggarai Barat)"
        >
          <div
            className="announcement-track hover:tw-[animation-play-state:paused]"
            aria-hidden="true"
          >
            <span className="tw-inline-block tw-min-w-max tw-whitespace-nowrap">
              Selamat Datang di PIN DINSOSP3A (Peta Informasi Navigasi Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kab. Manggarai Barat)
            </span>
          </div>
        </div>

        {/* HEADER */}
        <header className="topbar">
          <div className="topbar-heading">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              aria-expanded={isMobileMenuOpen}
              aria-controls="app-sidebar"
            >
              <Menu size={21} aria-hidden="true" />
            </button>
            <div className="tw-min-w-0">
              <h1 className="tw-text-lg tw-font-extrabold tw-leading-tight tw-tracking-wide tw-text-white sm:tw-text-2xl">
                PIN DINSOSP3A
              </h1>
              <p className="tw-mt-1 tw-max-w-[48vw] tw-text-xs tw-leading-relaxed tw-text-slate-400 md:tw-max-w-3xl sm:tw-text-sm">
                Peta Informasi Navigasi Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kab. Manggarai Barat
              </p>
            </div>

            <div className="topbar-right">
              <span className="online-status">
                ● Online
              </span>
            </div>
          </div>

        </header>

        {/* CONTENT */}
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
                <div
                  className="stat-card"
                  key={statistic.label}
                  style={activeBidang ? { borderTop: `3px solid ${activeBidang.color}` } : undefined}
                >
                  <div
                    className={`stat-icon ${['blue', 'green', 'orange'][index]}`}
                    style={activeBidang ? {
                      backgroundColor: `${activeBidang.color}22`,
                      color: activeBidang.color
                    } : undefined}
                  >
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

          {/* INTERACTIVE CHARTS */}
          <section className="chart-grid" aria-label="Visualisasi data lokasi">
            <article className="chart-card" aria-labelledby="activity-chart-title">
              <div className="chart-card-header">
                <div>
                  <h3 id="activity-chart-title">Persentase Kegiatan per Bidang</h3>
                  <p>Proporsi dari {chartLocations.length} lokasi terfilter</p>
                </div>
              </div>
              <div className="activity-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityChartData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={66}
                      outerRadius={94}
                      paddingAngle={activityChartData.some(({ count }) => count > 0) ? 3 : 0}
                      stroke="none"
                    >
                      {activityChartData.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-total" aria-label={`Total ${chartLocations.length} lokasi`}>
                  <strong>{chartLocations.length}</strong>
                  <span>Total Lokasi</span>
                </div>
              </div>
              <ul className="chart-legend">
                {activityChartData.map((entry) => (
                  <li key={entry.label}>
                    <span className="chart-legend-marker" style={{ backgroundColor: entry.color }} />
                    <span className="chart-legend-label">{entry.label}</span>
                    <span className="chart-legend-value">
                      {entry.count} <span>({entry.percentage})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="chart-card" aria-labelledby="area-chart-title">
              <div className="chart-card-header">
                <div>
                  <h3 id="area-chart-title">Sebaran Titik Kegiatan Terbanyak</h3>
                  <p>Top 5 wilayah dari {chartLocations.length} lokasi terfilter</p>
                </div>
                <div className="chart-tabs" role="group" aria-label="Kelompok wilayah">
                  <button
                    type="button"
                    className={chartAreaLevel === 'kecamatan' ? 'active' : ''}
                    aria-pressed={chartAreaLevel === 'kecamatan'}
                    onClick={() => setChartAreaLevel('kecamatan')}
                  >
                    Per Kecamatan
                  </button>
                  <button
                    type="button"
                    className={chartAreaLevel === 'desa' ? 'active' : ''}
                    aria-pressed={chartAreaLevel === 'desa'}
                    onClick={() => setChartAreaLevel('desa')}
                  >
                    Per Desa
                  </button>
                </div>
              </div>
              {topAreas.length > 0 ? (
                <div className="area-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topAreas}
                      layout="vertical"
                      margin={{ top: 5, right: 68, bottom: 5, left: 5 }}
                    >
                      <CartesianGrid stroke="#2b4056" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a9bd', fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={112}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#d8e3ee', fontSize: 11 }}
                      />
                      <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff0a' }} />
                      <Bar dataKey="count" fill="#38bdf8" radius={[0, 5, 5, 0]} barSize={22}>
                        <LabelList
                          dataKey="count"
                          position="right"
                          content={({ x, y, width, height, value, index }) => {
                            const percentage = topAreas[index]?.percentage;
                            return (
                              <text
                                x={Number(x) + Number(width) + 6}
                                y={Number(y) + Number(height) / 2}
                                fill="#c6d5e3"
                                fontSize={10}
                                dominantBaseline="middle"
                              >
                                {value} · {percentage}
                              </text>
                            );
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="chart-empty">Belum ada data wilayah untuk filter yang dipilih.</div>
              )}
            </article>
          </section>

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

              <div className="map-header-actions print-hide">
                <button
                  type="button"
                  className="map-action"
                  onClick={() => window.open(
                    'https://www.arcgis.com/apps/mapviewer/',
                    '_blank'
                  )}
                >
                  <Maximize2 size={17} />
                  <span>Map Viewer</span>
                </button>
                <button
                  type="button"
                  className="map-action report-action"
                  onClick={downloadFilteredCsv}
                >
                  <Download size={16} />
                  <span>Unduh Rekap (CSV)</span>
                </button>
                <button
                  type="button"
                  className="map-action report-action"
                  onClick={printReport}
                >
                  <Printer size={16} />
                  <span>Cetak Laporan</span>
                </button>
              </div>

            </div>

            <div className="map-filter-bar tw-flex tw-flex-col tw-gap-3 tw-border-y tw-border-slate-700 tw-bg-slate-900/60 tw-p-4 sm:tw-flex-row sm:tw-items-start">
              <div className="tw-relative tw-min-w-0 tw-flex-1">
                <label htmlFor="map-location-search" className="tw-sr-only">
                  Cari nama LKS, program, atau desa
                </label>
                <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-slate-700 tw-bg-slate-950 tw-px-3 tw-text-slate-400 focus-within:tw-border-sky-500 focus-within:tw-ring-2 focus-within:tw-ring-sky-500/20">
                  <Search size={17} aria-hidden="true" />
                  <input
                    id="map-location-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setIsSearchResultsOpen(true);
                      setSearchSelection(null);
                    }}
                    onFocus={() => setIsSearchResultsOpen(true)}
                    onBlur={() => setIsSearchResultsOpen(false)}
                    placeholder="Cari nama LKS, program, atau desa..."
                    autoComplete="off"
                    className="tw-min-w-0 tw-flex-1 tw-bg-transparent tw-py-2.5 tw-text-sm tw-text-white tw-outline-none placeholder:tw-text-slate-500"
                  />
                </div>
                {isSearchResultsOpen && searchQuery.trim() && (
                  <ul className="tw-absolute tw-inset-x-0 tw-top-full tw-z-[1000] tw-mt-1 tw-max-h-64 tw-overflow-y-auto tw-rounded-lg tw-border tw-border-slate-700 tw-bg-slate-900 tw-py-1 tw-shadow-xl">
                    {searchResults.length > 0 ? searchResults.map((location, index) => {
                      const locationName = location.nama_item ||
                        location.nama_lokasi ||
                        getLocationField(location, 'nama_lembaga_kegiatan');
                      const villageName = getLocationField(location, 'nama_desa', 'desa', 'kelurahan');
                      return (
                        <li key={`${locationName}-${location.latitude}-${location.longitude}-${index}`}>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setSearchSelection({ location });
                              setIsSearchResultsOpen(false);
                            }}
                            className="tw-flex tw-w-full tw-flex-col tw-items-start tw-px-3 tw-py-2 tw-text-left hover:tw-bg-slate-800 focus:tw-bg-slate-800 focus:tw-outline-none"
                          >
                            <span className="tw-text-sm tw-font-medium tw-text-slate-100">
                              {locationName !== '—' ? locationName : 'Nama lokasi tidak tersedia'}
                            </span>
                            <span className="tw-mt-0.5 tw-text-xs tw-text-slate-400">
                              {[villageName !== '—' ? villageName : '', location.tahun_kegiatan]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </button>
                        </li>
                      );
                    }) : (
                      <li className="tw-px-3 tw-py-2 tw-text-sm tw-text-slate-400">
                        Tidak ada lokasi yang cocok.
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 sm:tw-w-auto">
                <label htmlFor="map-year-filter" className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-slate-300">
                  Tahun anggaran
                </label>
                <select
                  id="map-year-filter"
                  value={selectedYear}
                  onChange={(event) => updateFilterParam('tahun', event.target.value)}
                  className="tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-slate-700 tw-bg-slate-950 tw-px-3 tw-py-2.5 tw-text-sm tw-text-slate-100 tw-outline-none focus:tw-border-sky-500 focus:tw-ring-2 focus:tw-ring-sky-500/20 sm:tw-flex-none"
                >
                  <option value="all">Semua Tahun</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>

            {/* INTERACTIVE MAP */}
            <div className="map-wrapper">

              <MapContainer
                center={MAP_INITIAL_CENTER}
                zoom={MAP_INITIAL_ZOOM}
                minZoom={10}
                maxZoom={18}
                dragging={true}
                zoomControl={true}
                scrollWheelZoom={true}
                maxBounds={[[-9.15, 119.25], [-8.15, 120.55]]}
                maxBoundsViscosity={1.0}
                className="leaflet-map"
              >

                <MapFlyToController
                  searchSelection={searchSelection}
                  tableSelection={tableSelection}
                  markerRefs={markerRefs}
                />
                <MapDistrictController selectedKecamatan={selectedKecamatan} />
                <MapHomeControl />

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

                <MarkerClusterGroup
                  chunkedLoading
                  maxClusterRadius={60}
                  disableClusteringAtZoom={15}
                  showCoverageOnHover={false}
                >
                  {renderCsvMarkers()}
                </MarkerClusterGroup>

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
              <div className={`map-legend district-legend ${isLegendExpanded ? 'is-expanded' : ''}`}>
                <div className="district-legend-heading">
                  <strong>LEGENDA KECAMATAN</strong>
                  <button
                    type="button"
                    className="district-reset-button"
                    onClick={() => updateFilterParam('kecamatan', '')}
                    aria-label="Reset pilihan kecamatan dan tampilkan seluruh wilayah"
                    title="Tampilkan semua kecamatan"
                  >
                    Reset / Semua Kecamatan
                  </button>
                </div>
                <button
                  type="button"
                  className="legend-collapse-toggle"
                  onClick={() => setIsLegendExpanded((expanded) => !expanded)}
                  aria-expanded={isLegendExpanded}
                  aria-controls="district-legend-list"
                >
                  <span>Legenda Kecamatan</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                <div id="district-legend-list" className="district-legend-list">
                  {Object.entries(districts).map(([code, district]) => (
                    <button
                      className={`district-legend-item ${
                        selectedKecamatan === district.name ? 'active' : ''
                      }`}
                      key={code}
                      type="button"
                      aria-pressed={selectedKecamatan === district.name}
                      onClick={() => updateFilterParam(
                        'kecamatan',
                        selectedKecamatan === district.name
                          ? ''
                          : normalizeIdentifier(district.name)
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
              </div>

              {/* MAP INFORMATION */}
              <div className="map-search">
                <Search size={17} />
                <span>Sentuh wilayah untuk melihat nama desa dan kecamatan</span>
              </div>

            </div>

          </div>

          <section className="summary-table-card" aria-labelledby="summary-table-title">
            <div className="summary-table-heading">
              <div>
                <h3 id="summary-table-title">Ringkasan Data Lokasi</h3>
                <p>
                  {activeBidang?.name ?? 'Seluruh Bidang'}
                  {' · '}
                  {selectedYear === 'all' ? 'Semua Tahun' : selectedYear}
                </p>
              </div>
              <span className="summary-table-count">{visibleLocations.length} data</span>
            </div>
            <div className="summary-table-scroll">
              <table className="summary-data-table">
                <thead>
                  <tr>
                    <th scope="col">No</th>
                    <th scope="col">Nama Lembaga / Kegiatan</th>
                    <th scope="col">Bidang</th>
                    <th scope="col">Kategori</th>
                    <th scope="col">Lokasi</th>
                    <th scope="col">Tahun</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLocations.map((location, index) => {
                    const latitude = Number(location.latitude);
                    const longitude = Number(location.longitude);
                    const canFocusMap =
                      Number.isFinite(latitude) &&
                      latitude >= -90 &&
                      latitude <= 90 &&
                      Number.isFinite(longitude) &&
                      longitude >= -180 &&
                      longitude <= 180;
                    const name = getFirstLocationField(
                      location,
                      'nama_lembaga_kegiatan',
                      'nama_item',
                      'nama_lokasi',
                      'nama_program',
                      'program'
                    );

                    return (
                      <tr
                        key={`${name}-${latitude}-${longitude}-${index}`}
                        className={canFocusMap ? 'summary-data-row' : 'summary-data-row is-unmapped'}
                        tabIndex={canFocusMap ? 0 : -1}
                        aria-label={canFocusMap ? `Fokus peta pada ${name}` : undefined}
                        aria-disabled={!canFocusMap}
                        title={canFocusMap ? 'Klik untuk melihat lokasi pada peta' : 'Data ini tidak memiliki koordinat peta'}
                        onClick={() => {
                          if (canFocusMap) {
                            setTableSelection({
                              location,
                              id: ++tableSelectionId.current
                            });
                          }
                        }}
                        onKeyDown={(event) => {
                          if (canFocusMap && (event.key === 'Enter' || event.key === ' ')) {
                            event.preventDefault();
                            setTableSelection({
                              location,
                              id: ++tableSelectionId.current
                            });
                          }
                        }}
                      >
                        <td>{index + 1}</td>
                        <td>{name}</td>
                        <td>{getLocationField(location, 'nama_bidang')}</td>
                        <td>{getFirstLocationField(location, 'jenis_kategori', 'kategori')}</td>
                        <td>{getFirstLocationField(location, 'nama_lokasi', 'nama_desa', 'desa', 'kelurahan')}</td>
                        <td>{getLocationField(location, 'tahun_kegiatan')}</td>
                      </tr>
                    );
                  })}
                  {visibleLocations.length === 0 && (
                    <tr>
                      <td colSpan="6" className="summary-table-empty">
                        {isLoadingLocations
                          ? 'Memuat data lokasi...'
                          : mapDataError
                            ? `Data tidak dapat dimuat: ${mapDataError}`
                            : 'Belum ada data untuk filter yang dipilih.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-summary report-print-only" aria-labelledby="print-summary-title">
            <h3 id="print-summary-title">
              Ringkasan Data {activeBidang?.name ?? 'Seluruh Bidang'}
              {' · '}
              {selectedYear === 'all' ? 'Semua Tahun' : selectedYear}
            </h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">Kategori</th>
                  <th scope="col">Jumlah Lokasi</th>
                  <th scope="col">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {percentageCards.map((card) => (
                  <tr key={card.key}>
                    <td>{card.label}</td>
                    <td>{card.count}</td>
                    <td>{card.percentage}</td>
                  </tr>
                ))}
                {percentageCards.length === 0 && (
                  <tr>
                    <td colSpan="3">Belum ada data untuk filter yang dipilih.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

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

      </main>

      {isLoginModalOpen && !isAdmin && (
        <div className="tw-fixed tw-inset-0 tw-z-[2000] tw-flex tw-items-center tw-justify-center tw-bg-slate-950/80 tw-p-4 tw-backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
            className="tw-relative tw-max-h-[90vh] tw-w-full tw-max-w-lg tw-overflow-y-auto tw-rounded-2xl tw-border tw-border-slate-700 tw-bg-slate-900/80 tw-p-6 tw-shadow-2xl tw-backdrop-blur-md sm:tw-p-8"
          >
            <div className="tw-mb-6 tw-flex tw-flex-col tw-items-center tw-text-center">
              <div className="tw-mb-4 tw-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-cyan-400/30 tw-bg-cyan-400/10 tw-shadow-[0_0_24px_rgba(34,211,238,0.18)]">
                <MapPin
                  size={30}
                  strokeWidth={2.5}
                  className="tw-text-cyan-300 tw-drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]"
                />
              </div>
              <h2 id="admin-login-title" className="tw-text-2xl tw-font-extrabold tw-tracking-wide tw-text-white sm:tw-text-3xl">
                PIN DINSOSP3A
              </h2>
              <p className="tw-mt-2 tw-max-w-sm tw-text-sm tw-leading-relaxed tw-text-slate-300">
                Peta Informasi Navigasi Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Kab. Manggarai Barat
              </p>
              <p className="tw-mt-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.2em] tw-text-cyan-300">
                Login Admin
              </p>
            </div>
            <button
              type="button"
              onClick={closeLoginModal}
              className="tw-absolute tw-right-3 tw-top-3 tw-rounded-lg tw-p-2 tw-text-slate-400 hover:tw-bg-slate-800 hover:tw-text-white"
              aria-label="Tutup form login"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleLogin} className="tw-space-y-4">
              <div>
                <label htmlFor="admin-login-email" className="tw-mb-1.5 tw-block tw-text-sm tw-font-medium tw-text-slate-200">
                  Email
                </label>
                <input
                  id="admin-login-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="tw-w-full tw-rounded-lg tw-border tw-border-slate-700 tw-bg-slate-950 tw-px-3 tw-py-2.5 tw-text-sm tw-text-white tw-outline-none placeholder:tw-text-slate-500 focus:tw-border-sky-500 focus:tw-ring-2 focus:tw-ring-sky-500/20"
                  placeholder="admin@dinsos.go.id"
                />
              </div>
              <div>
                <label htmlFor="admin-login-password" className="tw-mb-1.5 tw-block tw-text-sm tw-font-medium tw-text-slate-200">
                  Password
                </label>
                <input
                  id="admin-login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="tw-w-full tw-rounded-lg tw-border tw-border-slate-700 tw-bg-slate-950 tw-px-3 tw-py-2.5 tw-text-sm tw-text-white tw-outline-none placeholder:tw-text-slate-500 focus:tw-border-sky-500 focus:tw-ring-2 focus:tw-ring-sky-500/20"
                  placeholder="Masukkan password"
                />
              </div>
              {loginError && (
                <p role="alert" className="tw-text-sm tw-text-rose-400">
                  {loginError}
                </p>
              )}
              <button
                type="submit"
                className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-sky-600 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-sky-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-sky-400 focus:tw-ring-offset-2 focus:tw-ring-offset-slate-900"
              >
                <LogIn size={16} />
                Masuk ke Dashboard
              </button>
            </form>
          </section>
        </div>
      )}

    </div>
  );
}

export default App;
