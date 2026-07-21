import heroImage from '../assets/images/LandaP.jpeg';

function Portada() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">SÚPER-APP COMUNITARIA</span>
          <h1>La comunidad se conecta directo.</h1>
          <p>
            Landa es la súper-app comunitaria de última generación diseñada para conectar personas, comercios y servicios locales.
            Nuestra misión es empoderar a la comunidad facilitando la interacción directa, segura y transparente, reduciendo las comisiones excesivas de intermediarios y recompensando a los usuarios por su participación activa.
          </p>
          <div className="hero-actions">
            <a href="#" className="btn btn-primary">Descargar la app</a>
            <a href="#" className="btn btn-secondary">Cómo funciona</a>
          </div>
          <div className="hero-metrics">
            <div>
              <span>0%</span>
              <small className="metric-label">Comisiones en Domicilios</small>
            </div>
            <div>
              <span>100%</span>
              <small className="metric-label">Seguridad Comunitaria</small>
            </div>
            <div>
              <span>+Recompensas</span>
              <small className="metric-label">Por usar la App</small>
            </div>
          </div>
        </div>
        <div className="hero-image-panel">
          <img src={heroImage} alt="Landa super app" />
        </div>
      </div>
    </section>
  );
}

export default Portada;
