import { Link } from 'react-router-dom';

function LlamadaAccion() {
  return (
    <section id="cta" className="section section-alt">
      <div className="container">
        <div className="section-title text-center">
          <span className="eyebrow">Únete a Landa</span>
          <h2>Lleva tu comunidad en tu bolsillo</h2>
          <p>
            Ya seas un vecino que busca apoyar lo local o un comercio que quiere crecer de forma justa, Landa es la súper-app diseñada para ti.
          </p>
        </div>

        <div className="cta-grid">
          <div className="cta-card user-cta">
            <div className="card-badge">Para Vecinos</div>
            <h3>Descarga Landa App</h3>
            <p>Conéctate con tu barrio, compra directo sin comisiones abusivas y gana recompensas por tu participación activa.</p>
            <ul className="cta-features">
              <li><span>✦</span> Delivery local y directo sin intermediarios</li>
              <li><span>✦</span> Chat seguro y libre para conectar con vecinos</li>
              <li><span>✦</span> Puntos y beneficios por apoyar comercios locales</li>
            </ul>
            <div className="app-download-buttons">
              <a href="#download-store" className="btn btn-primary" onClick={(e) => e.preventDefault()}>
                <span className="btn-icon"></span> App Store
              </a>
              <a href="#download-store" className="btn btn-secondary" onClick={(e) => e.preventDefault()}>
                <span className="btn-icon">▶</span> Google Play
              </a>
            </div>
          </div>

          <div className="cta-card business-cta">
            <div className="card-badge badge-alt">Para Comercios</div>
            <h3>Suma tu Negocio</h3>
            <p>Digitaliza tu catálogo, llega a miles de clientes locales y gestiona tus pedidos con comisiones justas y transparentes.</p>
            <ul className="cta-features">
              <li><span>✦</span> Vende sin las comisiones excesivas de siempre</li>
              <li><span>✦</span> Control total sobre tus precios, entregas y catálogo</li>
              <li><span>✦</span> Promociones segmentadas directo a tu zona</li>
            </ul>
            <div className="app-download-buttons">
              <Link to="/contacto" className="btn btn-primary">
                Registrar Comercio
              </Link>
              <Link to="/restaurantes" className="btn btn-secondary">
                Ver Comercios
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LlamadaAccion;
