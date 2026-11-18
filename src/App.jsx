
import { useState } from 'react';

import {
  MapContainer,
  TileLayer
} from 'react-leaflet';

import {
  Map,
  LayoutDashboard,
  Layers,
  MapPin,
  Info,
  Maximize2,
  Search,
  ChevronDown
} from 'lucide-react';

import 'leaflet/dist/leaflet.css';
import './index.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('Peta Interaktif');

  const menus = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Peta Interaktif', icon: Map },
    { name: 'Data Wilayah', icon: MapPin },
    { name: 'Manajemen Layer', icon: Layers }
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
        <section className="content-area">

          <div className="welcome">
            <div>
              <h2>Peta Interaktif</h2>
              <p>
                Visualisasi geografis Kabupaten Manggarai Barat,
                Provinsi Nusa Tenggara Timur
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
                <span>Wilayah Pemetaan</span>
                <h3>1 Kabupaten</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <Layers size={23} />
              </div>

              <div>
                <span>Lapisan Peta</span>
                <h3>1 Layer Dasar</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                <Map size={23} />
              </div>

              <div>
                <span>Sumber Peta</span>
                <h3>Esri World Street</h3>
              </div>
            </div>

          </div>

          {/* MAP CARD */}
          <div className="map-card">

            <div className="map-header">

              <div>
                <h3>Peta Kabupaten Manggarai Barat</h3>
                <span>Flores, Nusa Tenggara Timur</span>
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

                <TileLayer
                  attribution='Tiles &copy; Esri — Sources: Esri, HERE, Garmin, USGS, Intermap, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />

              </MapContainer>

              {/* MAP LEGEND */}
              <div className="map-legend">

                <strong>LEGENDA PETA</strong>

                <div>
                  <span className="legend-dot blue-dot"></span>
                  Peta dasar
                </div>

                <div>
                  <span className="legend-dot gray-dot"></span>
                  Batas administrasi
                </div>

              </div>

              {/* MAP SEARCH PLACEHOLDER */}
              <div className="map-search">
                <Search size={17} />
                <span>Pencarian wilayah akan tersedia</span>
              </div>

            </div>

          </div>

          {/* FOOTER */}
          <div className="footer-info">
            <Info size={16} />

            <span>
              Peta dasar menggunakan Esri World Street Map.
              Data batas administrasi akan ditambahkan
              pada tahap pengembangan berikutnya.
            </span>
          </div>

        </section>

      </main>

    </div>
  );
}

export default App;
