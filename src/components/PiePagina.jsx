import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { useToast } from '../context/ToastContext';

// Duotone Vector SVG Icons
const FooterIcons = {
  Home: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Restaurant: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M18 2v20M18 8a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V2M10 2v20" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Support: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  Store: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7M4 7l2-4h12l2 4M5 21V10.85M19 21V10.85" />
    </svg>
  ),
  Briefcase: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Crown: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Smartphone: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
};

function PiePagina() {
  const { showToast } = useToast();
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('administracion@landapp.co');
    setCopiedEmail(true);
    showToast('Correo administracion@landapp.co copiado al portapapeles', 'success', 'Copiado Exitosa');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <footer className="footer-master">
      <div className="container footer-content-wrap">

        {/* ROW 1: BRAND HERO & PLATFORM STATUS BANNER */}
        <div className="footer-brand-banner">
          <div className="brand-info-box">
            <Link to="/" className="footer-logo-link">
              <img src={logo} alt="Landa App Logo" className="footer-logo-img" />
            </Link>
            <div className="brand-texts">
              <h3 className="footer-brand-title">LANDA APP S.A.S.</h3>
            </div>
          </div>

          <a
            href="https://wa.me/573126201934?text=Hola%20Landa%20App%2C%20me%20gustar%C3%ADa%20recibir%20atenci%C3%B3n%20en%20l%C3%ADnea."
            target="_blank"
            rel="noopener noreferrer"
            className="footer-status-pill"
            title="Chatear por WhatsApp con Atención 24/7"
          >
            <span className="status-live-dot"></span>
            <span>🟢 Soporte 24/7</span>
          </a>
        </div>

        {/* ROW 2: MAIN NAVIGATION GRID */}
        <div className="footer-navigation-grid">

          {/* COL 1: NAVEGACIÓN PRINCIPAL */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Explorar Landa</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/">
                  <FooterIcons.Home />
                  <span>Inicio y Novedades</span>
                </Link>
              </li>
              <li>
                <Link to="/restaurantes">
                  <FooterIcons.Restaurant />
                  <span>Restaurantes y Gastronomía</span>
                </Link>
              </li>
              <li>
                <Link to="/quienes-somos">
                  <FooterIcons.Users />
                  <span>Quiénes Somos</span>
                </Link>
              </li>
              <li>
                <Link to="/contacto">
                  <FooterIcons.Support />
                  <span>Soporte y Atención 24/7</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 2: PORTALES Y PLATAFORMAS */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Portales de Gestión</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/restaurante/gestion">
                  <FooterIcons.Store />
                  <span>Portal Restaurantes (Comercios)</span>
                </Link>
              </li>
              <li>
                <Link to="/empleado">
                  <FooterIcons.Briefcase />
                  <span>Portal Empleados Landa</span>
                </Link>
              </li>
              <li>
                <Link to="/master">
                  <FooterIcons.Crown />
                  <span>Panel Administrador Master</span>
                </Link>
              </li>
              <li>
                <a href="https://play.google.com/store/apps/details?id=com.landaappsas.landa&pcampaignid=web_share" target="_blank" rel="noopener noreferrer">
                  <FooterIcons.Smartphone />
                  <span>Descargar App Móvil (Android/iOS)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* COL 3: MARCO LEGAL Y TRANSPARENCIA */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">Legal y Transparencia</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/terminos-condiciones">
                  <FooterIcons.FileText />
                  <span>Términos y Condiciones de Uso</span>
                </Link>
              </li>
              <li>
                <Link to="/politicas-tratamientos-datos">
                  <FooterIcons.Shield />
                  <span>Tratamiento de Datos Personales</span>
                </Link>
              </li>
              <li>
                <Link to="/politicas-reembolsos">
                  <FooterIcons.Refresh />
                  <span>Reembolsos y Cancelaciones</span>
                </Link>
              </li>
              <li>
                <Link to="/aviso-legal">
                  <FooterIcons.FileText />
                  <span>Aviso Legal e Identificación</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 4: CONTACTO OFICIAL & ATENCIÓN */}
          <div className="footer-nav-col contact-col">
            <h4 className="footer-col-title">Contacto y Atención</h4>

            <div className="footer-contact-card">
              <div className="contact-card-item">
                <FooterIcons.Mail />
                <div className="contact-item-info">
                  <small>Correo Institucional</small>
                  <div className="email-copy-row">
                    <span>administracion@landapp.com.co</span>
                    <button className="copy-mini-btn" onClick={handleCopyEmail} title="Copiar correo">
                      <FooterIcons.Copy />
                      <span>{copiedEmail ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="contact-card-item">
                <FooterIcons.MapPin />
                <div className="contact-item-info">
                  <small>Ubicación y Domicilio</small>
                  <span>Cali, Valle del Cauca, Colombia</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ROW 3: BOTTOM BAR & COPYRIGHT */}
        <div className="footer-bottom-bar">
          <div className="legal-nit-copy">
            <p style={{ margin: 0 }}>
              © 2026 <strong>LANDA APP S.A.S.</strong> — NIT 902.065.549-2. Todos los derechos reservados.
            </p>
            <span className="sub-tagline">Conectando personas, negocios y oportunidades para comprar, vender, promocionar servicios y movilizarse desde una sola plataforma.</span>
          </div>

          <div className="security-badge-pill">
            <FooterIcons.Lock />
            <span>Conexión Protegida con Cifrado SSL 256-Bit</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default PiePagina;
