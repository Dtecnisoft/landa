const testimonials = [
  {
    name: 'María L.',
    role: 'Fundadora de marca',
    quote: 'La implementación quedó muy profesional y mucho más fácil de mantener.'
  },
  {
    name: 'Carlos P.',
    role: 'Emprendedor',
    quote: 'Pude adaptar el contenido rápidamente sin tocar toda la estructura.'
  },
  {
    name: 'Ana R.',
    role: 'Directora de marketing',
    quote: 'El resultado se ve moderno, limpio y preparado para crecer.'
  }
];

function Testimonios() {
  return (
    <section id="testimonials" className="section">
      <div className="container">
        <div className="section-title">
          <h2>Lo que dicen quienes confían en el proceso</h2>
          <p>Proyectos que combinan diseño, claridad y una estrategia enfocada en resultados reales.</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.name}>
              <div className="stars">★★★★★</div>
              <p>“{item.quote}”</p>
              <h3>{item.name}</h3>
              <span>{item.role}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonios;
