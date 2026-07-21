const features = [
  {
    icon: '🚗',
    title: 'Viajes Seguros',
    text: 'Solicita transporte confiable con conductores de tu propia comunidad validados bajo estrictos estándares de seguridad.'
  },
  {
    icon: '🍔',
    title: 'Restaurantes y Domicilios',
    text: 'Apoya el comercio de tu zona pidiendo comida y productos a tus locales preferidos de forma rápida y directa.'
  },
  {
    icon: '🤝',
    title: 'Red Social Local',
    text: 'Publicaciones, comentarios, chat en tiempo real y conexión entre usuarios.'
  }
];

function Caracteristicas() {
  return (
    <section id="features" className="section">
      <div className="container">
        <div className="section-title">
          <h2>Un ecosistema digital completo para ti</h2>
          <p>Landa App te conecta con todo lo que necesitas a diario en tu localidad de forma simple, rápida y confiable.</p>
        </div>
        <div className="features-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="card-icon" style={{ fontSize: '2rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Caracteristicas;
