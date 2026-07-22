import imgContacto from '../assets/images/contacto.jpeg';

function Contacto() {
  return (
    <section id="contacto" className="section contact-section">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">ESTAMOS PARA AYUDARTE</span>
          <h2>Contacto & Soporte Directo</h2>
          <p>¿Tienes preguntas o quieres saber más? Estamos listos para ayudarte a integrar Landa en tu localidad.</p>
        </div>

        <div className="contact-wrapper">
          {/* Image Banner Panel */}
          <div className="contact-image-panel">
            <div className="contact-image-frame">
              <img
                src={imgContacto}
                alt="Soporte y Atención al Cliente Landa App"
                className="contact-img"
              />
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="contact-info-grid">
            <article className="contact-card">
              <div className="contact-card-icon">✉️</div>
              <div className="contact-card-body">
                <h3>Escríbenos</h3>
                <a href="mailto:administracion@landapp.com.co" className="contact-link">
                  administracion@landapp.com.co
                </a>
              </div>
            </article>

            <article className="contact-card">
              <div className="contact-card-icon">📞</div>
              <div className="contact-card-body">
                <h3>Teléfono</h3>
                <a href="tel:+573126201934" className="contact-link">
                  +57 312 620 1934
                </a>
              </div>
            </article>

            <article className="contact-card">
              <div className="contact-card-icon">📍</div>
              <div className="contact-card-body">
                <h3>Ubicación</h3>
                <p className="contact-text">Cali, Colombia</p>
              </div>
            </article>

            <div className="contact-quick-action">
              <a
                href="https://wa.me/573126201934"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary contact-wa-btn"
              >
                💬 Chatear por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contacto;
