const testimonials = [
  {
    name: 'Don Mario Restrepo',
    role: 'Propietario de Pizzería Don Mario (Jamundí)',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop',
    quote: 'Con Landa logramos publicar nuestro menú digital y recibir domicilios directos en el local con comisiones justas. Es una bendición para el comercio gastronómico de nuestro municipio.',
    rating: '5.0 ⭐'
  },
  {
    name: 'Camila Ospina',
    role: 'Cliente Frecuente (Alfaguara, Jamundí)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    quote: 'Me encanta poder ver las fotos reales de los platos, ver la ubicación exacta de los restaurantes de mi zona y pedir comida con seguimiento en tiempo real desde la app.',
    rating: '5.0 ⭐'
  },
  {
    name: 'Jhonatan Bermúdez',
    role: 'Domiciliario Aliado (Cali - Jamundí)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    quote: 'La plataforma nos conecta directamente con negocios locales y clientes de la zona. La gestión de entregas y transferencias de saldo es transparente y eficiente.',
    rating: '5.0 ⭐'
  }
];

function Testimonios() {
  return (
    <section id="testimonials" className="section" style={{ background: '#090d16', padding: '4rem 0' }}>
      <div className="container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
        <div className="section-title text-center" style={{ marginBottom: '3rem' }}>
          <span style={{ color: '#ea580c', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            🤝 Testimonios de Nuestra Comunidad
          </span>
          <h2 style={{ color: '#ffffff', fontSize: '2rem', margin: '0.4rem 0 0.6rem 0', fontWeight: 900 }}>
            Historias Reales de Quienes Usan Landa
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Restaurantes locales, repartidores e integrantes de la comunidad compartiendo su experiencia.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {testimonials.map((item) => (
            <article
              key={item.name}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 800 }}>
                  {item.rating}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: 800 }}>
                  ✓ VERIFICADO
                </span>
              </div>

              <p style={{ color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.55, margin: 0, fontStyle: 'italic', flex: 1 }}>
                “{item.quote}”
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <img
                  src={item.avatar}
                  alt={item.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ea580c' }}
                />
                <div>
                  <h3 style={{ margin: 0, color: '#ffffff', fontSize: '0.98rem', fontWeight: 800 }}>{item.name}</h3>
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'block' }}>{item.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonios;
