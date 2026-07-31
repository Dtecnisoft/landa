import React from 'react';
import { Link } from 'react-router-dom';
import sobreBg from '../assets/images/sobre_bg.png';

function Sobre() {
  const FEATURES = [
    {
      title: 'Tecnología en Tiempo Real',
      description: 'Rastreo GPS en vivo, pedidos inmediatos y trazabilidad total desde tu dispositivo.',
      badge: 'Velocidad'
    },
    {
      title: 'Comercio Justo y Directo',
      description: 'Conectamos a clientes, restaurantes y repartidores locales sin intermediarios costosos.',
      badge: 'Equidad'
    },
    {
      title: 'Seguridad Verificada',
      description: 'Establecimientos validados e identificación rigurosa para máxima tranquilidad.',
      badge: 'Confianza'
    }
  ];

  return (
    <section id="about" className="sobre-section">
      {/* Background image container with gradient mask */}
      <div
        className="sobre-bg-wrapper"
        style={{ backgroundImage: `url(${sobreBg})` }}
        aria-hidden="true"
      />
      <div className="sobre-bg-overlay" />

      <div className="container sobre-container-relative">
        <div className="sobre-header-badge">
          <span className="sobre-badge-tag">🇨🇴 IMPULSO A LA ECONOMÍA COLOMBIANA</span>
        </div>

        <div className="sobre-centered-card">
          <h2 className="sobre-title">
            La plataforma de economía local que te conecta con tu comunidad
          </h2>

          <p className="sobre-description">
            En <strong>Landa App</strong> revolucionamos la forma en que las personas se conectan, se mueven y consumen a nivel local. Creamos un ecosistema digital robusto y transparente que empodera a los comercios y a los conductores locales en Colombia, eliminando intermediarios costosos para distribuir el valor equitativamente.
          </p>

          <div className="sobre-features-grid">
            {FEATURES.map((feat, idx) => (
              <div key={idx} className="sobre-feature-item">
                <div className="sobre-feature-header">
                  <span className="sobre-feature-badge">{feat.badge}</span>
                  <h3>{feat.title}</h3>
                </div>
                <p>{feat.description}</p>
              </div>
            ))}
          </div>

          <div className="sobre-cta-actions">
            <Link to="/quienes-somos" className="sobre-btn-primary">
              <span>Conoce Más Sobre Landa</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>

            <Link to="/contacto" className="sobre-btn-secondary">
              <span>Contactar Soporte</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Sobre;
