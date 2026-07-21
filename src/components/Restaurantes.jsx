function Restaurantes() {
  return (
    <section id="restaurantes" className="restaurants-page">
      <div className="page-hero">
        <div className="wrap">
          <span className="node-label">Comercios locales</span>
          <h1>Restaurantes en tu comunidad</h1>
          <p>Pide directo a comercios locales dentro de Landa. Sin intermediarios que encarezcan tu plato, y sumando recompensas en cada pedido.</p>
        </div>
      </div>

      <section className="restaurants-content">
        <div className="wrap">
          <div className="rest-filter">
            <button className="chip active" type="button">Todos</button>
            <button className="chip" type="button">Comida local</button>
            <button className="chip" type="button">Café y postres</button>
            <button className="chip" type="button">Saludable</button>
            <button className="chip" type="button">Internacional</button>
          </div>

          <div className="rest-grid">
            <article className="rest-card">
              <div className="thumb" data-tag="Comida local"></div>
              <div className="body">
                <h4>Sazón de Barrio</h4>
                <p>Cocina tradicional con recetas de siempre, hecha por manos de la comunidad.</p>
                <div className="meta"><span>★ 4.8</span><span>15–25 min</span></div>
              </div>
            </article>

            <article className="rest-card">
              <div className="thumb" data-tag="Café y postres"></div>
              <div className="body">
                <h4>Molino Café</h4>
                <p>Café de origen local y repostería artesanal, tostado cerca de ti.</p>
                <div className="meta"><span>★ 4.9</span><span>10–15 min</span></div>
              </div>
            </article>

            <article className="rest-card">
              <div className="thumb" data-tag="Saludable"></div>
              <div className="body">
                <h4>Raíz Verde</h4>
                <p>Bowls y platos de temporada con ingredientes de productores locales.</p>
                <div className="meta"><span>★ 4.7</span><span>20–30 min</span></div>
              </div>
            </article>

            <article className="rest-card">
              <div className="thumb" data-tag="Internacional"></div>
              <div className="body">
                <h4>Fogón del Mundo</h4>
                <p>Sabores internacionales preparados por chefs de la comunidad.</p>
                <div className="meta"><span>★ 4.6</span><span>25–35 min</span></div>
              </div>
            </article>

            <article className="rest-card">
              <div className="thumb" data-tag="Comida local"></div>
              <div className="body">
                <h4>La Parrilla de Doña Inés</h4>
                <p>Asados y guisos caseros, directo desde la cocina de un vecino del barrio.</p>
                <div className="meta"><span>★ 4.9</span><span>20–30 min</span></div>
              </div>
            </article>

            <article className="rest-card">
              <div className="thumb" data-tag="Café y postres"></div>
              <div className="body">
                <h4>Dulce Nodo</h4>
                <p>Pastelería de barrio con recetas familiares y entrega directa.</p>
                <div className="meta"><span>★ 4.8</span><span>10–20 min</span></div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap cta-inner">
          <h2>¿Tienes un restaurante? Súmalo a la red de Landa.</h2>
          <a href="#contacto" className="btn btn-primary">Registrar mi comercio</a>
        </div>
      </section>
    </section>
  );
}

export default Restaurantes;
