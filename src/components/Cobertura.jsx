import React from 'react';

const METRICS = [
  {
    val: '32',
    label: 'Departamentos',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    )
  },
  {
    val: '+500',
    label: 'Municipios Conectados',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
        <path d="M6 12H4a2 2 0 0 0-2 2v8" />
        <path d="M18 9h2a2 2 0 0 1 2 2v11" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    )
  },
  {
    val: '24 / 7',
    label: 'Disponibilidad Continua',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  },
  {
    val: '+15.000',
    label: 'Servicios Completados',
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  }
];

const FEATURE_CARDS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Geolocalización Inteligente',
    desc: 'Landa detecta automáticamente tu ubicación en Colombia para conectarte con los comercios y conductores más cercanos a ti.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Respuesta en Tiempo Real',
    desc: 'Seguimiento GPS en vivo de tu viaje o pedido sin importar el departamento o la ciudad en la que te encuentres.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: 'Red de Aliados Locales',
    desc: 'Empoderamos la economía nacional integrando pequeños y grandes establecimientos comerciales de cada municipio.'
  }
];

function Cobertura() {
  return (
    <div className="cobertura-page">
      {/* HERO SECTION */}
      <section className="cobertura-hero">
        <div className="container">
          <div className="cobertura-hero-badge">
            <span className="live-dot" />
            <span className="flag-emoji">🇨🇴</span>
            <span>Operación Activa en Toda Colombia</span>
          </div>

          <h1 className="cobertura-hero-title">
            Landa en Colombia: <br />
            <span className="gradient-text">Conectando Ciudades y Comunidades</span>
          </h1>

          <p className="cobertura-hero-subtitle">
            Desde las capitales principales hasta cada municipio del país, la súper-app Landa está diseñada para brindarte movilidad, domicilios y comercio local con total confiabilidad.
          </p>
        </div>
      </section>

      {/* METRICS STRIP */}
      <section className="cobertura-metrics-section">
        <div className="container">
          <div className="cobertura-metrics-grid">
            {METRICS.map((m, idx) => (
              <div key={idx} className="cobertura-metric-card">
                <div className="cob-metric-icon">{m.icon}</div>
                <span className="cob-metric-val">{m.val}</span>
                <span className="cob-metric-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAP VISUAL NODE BANNER */}
      <section className="cobertura-map-banner">
        <div className="container">
          <div className="map-banner-inner">
            <div className="map-banner-info">
              <span className="eyebrow-pill green">Red Nacional Integrada</span>
              <h2>Conexión directa en los 32 Departamentos de Colombia</h2>
              <p>
                Sin importar en qué región del país te encuentres —desde la Costa Caribe hasta el Amazonas, pasando por el Eje Cafetero y la Región Andina— Landa conecta a usuarios, restaurantes y conductores de manera rápida, segura y transparente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="cobertura-features-section">
        <div className="container">
          <div className="section-header-centered">
            <h2>¿Por qué Landa destaca en toda Colombia?</h2>
            <p>Una plataforma pensada por y para colombianos, adaptada a las necesidades reales de cada territorio.</p>
          </div>

          <div className="cobertura-features-grid">
            {FEATURE_CARDS.map((feat, idx) => (
              <div key={idx} className="cobertura-feature-card">
                <div className="feat-icon-box">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Cobertura;
