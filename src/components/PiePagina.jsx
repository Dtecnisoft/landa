import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';

function PiePagina() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Columna 1: Marca */}
        <div className="footer-col brand-col">
          <Link to="/" className="footer-brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Landa Logo" style={{ height: '80px', width: 'auto', display: 'block' }} />
          </Link>
          <p className="footer-tagline">Todo lo que necesitas, en un solo lugar.</p>
          <p className="footer-copy">© 2026 Landa. Todos los derechos reservados.</p>
        </div>

        {/* Columna 2: Explorar */}
        <div className="footer-col">
          <h4>Explorar</h4>
          <ul className="footer-list">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/restaurantes">Restaurantes</Link></li>
            <li><Link to="/quienes-somos">Quiénes Somos</Link></li>
          </ul>
        </div>

        {/* Columna 3: Ayuda */}
        <div className="footer-col">
          <h4>Ayuda</h4>
          <ul className="footer-list">
            <li><Link to="/contacto">Soporte y Contacto</Link></li>
          </ul>
        </div>

        {/* Columna 4: Legal */}
        <div className="footer-col">
          <h4>Legal</h4>
          <ul className="footer-list">
            <li><Link to="/terminos-condiciones">Términos y Condiciones</Link></li>
            <li><Link to="/politicas-tratamientos-datos">Política de Tratamiento de Datos</Link></li>
            <li><Link to="/aviso-legal">Aviso Legal</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default PiePagina;
