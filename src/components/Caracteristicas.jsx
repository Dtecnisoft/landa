import { useNavigate } from 'react-router-dom';
import imgCarro from '../assets/images/carro.jpeg';
import imgRestaurantes from '../assets/images/r.png';
import imgSocial from '../assets/images/social2.jpeg';

const features = [
  {
    id: 'viajes',
    image: imgCarro,
    alt: 'Viajes Seguros Landa App',
    tag: '🚗 TRANSPORTE SEGURO',
    title: 'Viajes Urbanos & Intermunicipales',
    text: 'Conecta con conductores de tu propia comunidad validados minuciosamente con cédula y antecedentes. Viaja seguro con tarifa justa y monitoreo GPS.',
    highlights: [
      '✓ Conductores 100% validados con antecedentes RUNT',
      '✓ Tarifas transparentes sin cobros dinámicos ocultos',
      '✓ Rastreabilidad GPS y asistencia en tiempo real'
    ],
    ctaText: '📲 Pedir Viaje en la App',
    link: 'https://drive.google.com/file/d/1lWZQqLHgHFEpl0xMgQK4_seo1pb8Edrd/view?usp=sharing',
    btnColor: '#4556EC',
  },
  {
    id: 'comida',
    image: imgRestaurantes,
    alt: 'Restaurantes y Domicilios Landa App',
    tag: '🍔 GASTRONOMÍA & DOMICILIOS',
    title: 'Restaurantes Locales & Entregas',
    text: 'Apoya el comercio gastronómico de tu zona pidiendo comida de tus locales preferidos. Consulta el menú con fotos reales y precios de cada establecimiento.',
    highlights: [
      '✓ Fotos reales de los platos y precios exactos',
      '✓ Entregas promedio en 25 - 35 minutos',
      '✓ Rastreo en vivo del domiciliario en el mapa'
    ],
    ctaText: '🍽️ Ver Restaurantes & Menús',
    routePath: '/restaurantes',
    btnColor: '#ea580c',
  },
  {
    id: 'comunidad',
    image: imgSocial,
    alt: 'Red Social Local Landa App',
    tag: '💬 COMUNIDAD & MURO',
    title: 'Red Social & Muro Comunitario',
    text: 'Entérate de lo que sucede en tu municipio en tiempo real: ofertas de empleo local, eventos culturales, avisos de vecinos y chat directo entre usuarios.',
    highlights: [
      '✓ Muro interactivo de eventos e información de tu ciudad',
      '✓ Ofertas de empleo y servicios de vecinos',
      '✓ Mensajería directa segura entre habitantes locales'
    ],
    ctaText: '👥 Conectar con la Comunidad',
    link: 'https://drive.google.com/file/d/1lWZQqLHgHFEpl0xMgQK4_seo1pb8Edrd/view?usp=sharing',
    btnColor: '#4556EC',
  }
];

function Caracteristicas() {
  const navigate = useNavigate();

  const handleNavigation = (feature) => {
    if (feature.routePath) {
      navigate(feature.routePath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (feature.scrollId) {
      const el = document.getElementById(feature.scrollId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/restaurantes');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="features" className="section" style={{ background: '#060911', padding: '5rem 0' }}>
      <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1.25rem' }}>
        
        {/* HEADER SECTION */}
        <div className="section-title text-center" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: '#ea580c', fontWeight: 800, fontSize: '0.86rem', textTransform: 'uppercase', letterSpacing: '1.2px', background: 'rgba(234, 88, 12, 0.12)', padding: '0.35rem 0.9rem', borderRadius: '20px', display: 'inline-block', marginBottom: '0.75rem', border: '1px solid rgba(234, 88, 12, 0.3)' }}>
            ✨ Conexión Total en tu Municipio
          </span>
          <h2 style={{ color: '#ffffff', fontSize: '2.3rem', margin: '0.4rem 0 0.75rem 0', fontWeight: 900, lineHeight: 1.25 }}>
            Un Ecosistema Digital Real para tu Día a Día
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
            Landa te conecta directamente con conductores verificados, restaurantes locales y tu comunidad en Jamundí, Cali y el Valle del Cauca.
          </p>
        </div>

        {/* FEATURES GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.75rem' }}>
          {features.map((feature) => {
            const themeColor = feature.btnColor || '#ea580c';
            return (
              <article
                key={feature.id}
                style={{
                  background: '#0f172a',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                  transition: 'transform 0.25s ease, border-color 0.25s ease',
                }}
              >
                {/* IMAGE HEADER */}
                <div style={{ position: 'relative', width: '100%', height: '210px', overflow: 'hidden', background: '#1e293b' }}>
                  <img
                    src={feature.image}
                    alt={feature.alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span style={{ position: 'absolute', top: '14px', left: '14px', background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(6px)', color: themeColor, padding: '0.3rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, border: `1px solid ${themeColor}`, zIndex: 2 }}>
                    {feature.tag}
                  </span>
                </div>

                {/* CARD CONTENT */}
                <div style={{ padding: '1.6rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '1.3rem', margin: 0, fontWeight: 800, lineHeight: 1.3 }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>
                    {feature.text}
                  </p>

                  {/* HIGHLIGHTS BULLETS */}
                  <div style={{ background: '#090d16', padding: '0.85rem 1rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.3rem' }}>
                    {feature.highlights.map((item, idx) => (
                      <span key={idx} style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* ACTION BUTTON */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                    {feature.routePath || feature.scrollId ? (
                      <button
                        className="btn-action-approve full-width"
                        style={{ background: themeColor, borderColor: themeColor, padding: '0.85rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}
                        onClick={() => handleNavigation(feature)}
                      >
                        {feature.ctaText}
                      </button>
                    ) : (
                      <a
                        href={feature.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-action-approve full-width"
                        style={{
                          background: themeColor,
                          borderColor: themeColor,
                          padding: '0.85rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          textDecoration: 'none',
                          display: 'block',
                        }}
                      >
                        {feature.ctaText}
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Caracteristicas;
