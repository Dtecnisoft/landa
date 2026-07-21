function QuienesSomos() {
  return (
    <section id="quienes-somos" className="about-page">
      <div className="page-hero">
        <div className="wrap">
          <span className="node-label">Nuestra Organización</span>
          <h1>Quiénes Somos</h1>
          <p>
            Somos un equipo convencido de que la tecnología debe servir a las personas, no a los intermediarios. En Landa unimos voluntades para conectar comunidades locales de forma justa y directa.
          </p>
        </div>
      </div>

      <section className="about-content section">
        <div className="container">
          <div className="about-grid-detailed">
            <article className="about-block">
              <h2>Nuestra Misión</h2>
              <p>
                Impulsar el crecimiento económico global de miles de usuarios, creando un ecosistema digital donde cada persona puede vender, conectar, moverse y prosperar.

              </p>
            </article>

            <article className="about-block">
              <h2>Nuestra Visión</h2>
              <p>
                Para el 2030, ser la plataforma de economía local líder en Latinoamérica, conectando a más de 1 millón de usuarios en una red integral de oportunidades y servicios.

              </p>
            </article>
          </div>

          <div className="values-section">
            <div className="section-title text-center">
              <span className="eyebrow">Nuestros Valores</span>
              <h2>Lo que nos impulsa a diario</h2>
            </div>

            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>Colaboración</h3>
                <p>Creemos en la fuerza del apoyo mutuo. Landa existe para tejer lazos más fuertes en los barrios.</p>
              </div>

              <div className="value-card">
                <div className="value-icon">🔍</div>
                <h3>Transparencia</h3>
                <p>Sin tarifas ocultas ni letras pequeñas. Conectamos de forma honesta y abierta a todos los actores locales.</p>
              </div>

              <div className="value-card">
                <div className="value-icon">🌱</div>
                <h3>Impacto Local</h3>
                <p>Priorizamos el desarrollo económico interno del barrio, manteniendo la riqueza donde se genera.</p>
              </div>
            </div>
          </div>

          <div className="team-section">
            <div className="section-title text-center">
              <span className="eyebrow">El Equipo</span>
              <h2>Las mentes detrás de Landa</h2>
              <p>Un equipo apasionado por la tecnología, el diseño y el impacto social.</p>
            </div>

            <div className="team-grid">
              <div className="team-card">
                <div className="team-avatar">🚀</div>
                <h3>Leonardo Esaut Landázuri Torres</h3>
                <span>Co-Fundador & CEO</span>
              </div>
              <div className="team-card">
                <div className="team-avatar">💻</div>
                <h3>Diego Alonso Bolaños.</h3>
                <span>Director de Desarrollo</span>
              </div>

            </div>
          </div>

        </div>
      </section>
    </section>
  );
}

export default QuienesSomos;
