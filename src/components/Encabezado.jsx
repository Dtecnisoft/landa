import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';

function Encabezado() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          <img src={logo} alt="Landa Logo" className="header-logo" />
        </Link>

        <button
          className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Abrir menú de navegación"
          aria-expanded={isMenuOpen}
        >
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>

        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`} aria-label="Navegación principal">
          <Link to="/" onClick={closeMenu}>Inicio</Link>
          <Link to="/restaurantes" onClick={closeMenu}>Restaurantes</Link>
          <Link to="/quienes-somos" onClick={closeMenu}>Quiénes Somos</Link>
          <Link to="/contacto" onClick={closeMenu}>Soporte y Contacto</Link>
          <Link to="/contacto" className="btn btn-primary header-cta mobile-only-cta" onClick={closeMenu}>
            Descargar
          </Link>
        </nav>

        <Link to="/contacto" className="btn btn-primary header-cta desktop-only-cta">
          Descargar
        </Link>
      </div>
    </header>
  );
}

export default Encabezado;

