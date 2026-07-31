import React from 'react';
import { Link } from 'react-router-dom';

const TEAM_MEMBERS = [
  {
    name: 'Leonardo Esaut Landázuri Torres',
    role: 'Co-Fundador y Chief Executive Officer (CEO)',
    tag: 'Liderazgo Ejecutivo',
    avatar: 'https://plus.unsplash.com/premium_photo-1678566153919-86c4ba4216f1?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bio: 'Apasionado por la economía colaborativa y el desarrollo tecnológico inclusivo en el Valle del Cauca. Lidera la visión estratégica y la expansión de Landa App en Colombia.',
    location: 'Cali, Colombia',
  },
  {
    name: 'Diego Alonso Bolaños',
    role: 'Co-Fundador y Director de Tecnología (CTO)',
    tag: 'Ingeniería y Producto',
    avatar: 'https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?q=80&w=725&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bio: 'Especialista en arquitectura de software en tiempo real, sistemas distribuidos y seguridad de datos. Encargado de la infraestructura robusta y la experiencia digital de Landa.',
    location: 'Jamundí, Colombia',
  },
];

const METRICS = [
  { value: '+15.000', label: 'Domicilios y Viajes Realizados' },
  { value: '10%', label: 'Comisión Fija y Transparente' },
  { value: '100%', label: 'Conductores y Locales Verificados' },
  { value: '4.9 ⭐', label: 'Calificación Promedio de Usuarios' },
];

const VALUES = [
  {
    icon: '🤝',
    title: 'Comercio Justo y Transparente',
    desc: 'Sin tarifas ocultas ni comisiones abusivas del 30%. Conectamos al cliente directamente con el restaurante y el repartidor de su comunidad.',
  },
  {
    icon: '🛡️',
    title: 'Seguridad y Verificación Estricta',
    desc: 'Validamos minuciosamente los antecedentes (RUNT, Cédula, Licencia) de cada conductor y la legalidad de cada establecimiento aliado.',
  },
  {
    icon: '🌱',
    title: 'Desarrollo e Impacto Local',
    desc: 'Mantenemos el dinero dentro de nuestro propio municipio (Jamundí, Cali y alrededores), fortaleciendo el empleo y el emprendimiento local.',
  },
  {
    icon: '⚡',
    title: 'Innovación en Tiempo Real',
    desc: 'Monitoreo GPS en vivo, chat encriptado, menú multimedia interactivo y liquidación de saldos sin demoras innecesarias.',
  },
];

function QuienesSomos() {
  return (
    <div style={{ background: '#060911', color: '#ffffff', minHeight: '100vh', paddingTop: '5rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1.25rem' }}>

        {/* HERO SECTION */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{
            background: 'rgba(69, 86, 236, 0.12)',
            color: '#4556EC',
            padding: '0.4rem 1.1rem',
            borderRadius: '50px',
            fontSize: '0.86rem',
            fontWeight: 800,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            border: '1px solid rgba(69, 86, 236, 0.3)',
            display: 'inline-block',
            marginBottom: '1rem',
          }}>
            🇨🇴 ORGANIZACIÓN TECNOLÓGICA COLOMBIANA
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0.4rem 0 1rem 0', lineHeight: 1.2 }}>
            Quiénes Somos
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '780px', margin: '0 auto', lineHeight: 1.65 }}>
            LANDA , Somos la plataforma digital donde las personas encuentran, conectan y generan oportunidades en un solo lugar. Integramos servicios, comercio, movilidad y comunidad dentro de un ecosistema innovador, seguro y accesible que simplifica la vida de nuestros usuarios. Somos la aplicación que conecta personas, negocios y oportunidades, permitiendo comprar, vender, promocionar servicios, movilizarse y acceder a soluciones digitales desde una sola plataforma.

          </p>
        </div>

        {/* METRICS STRIP */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(69, 86, 236, 0.25)',
          padding: '2rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          textAlign: 'center',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          marginBottom: '4.5rem',
        }}>
          {METRICS.map((m, idx) => (
            <div key={idx} style={{ padding: '0.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#4556EC', display: 'block', marginBottom: '0.2rem' }}>
                {m.value}
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '0.88rem', fontWeight: 700 }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* MISIÓN & VISIÓN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem', marginBottom: '4.5rem' }}>
          <div style={{
            background: '#0f172a',
            padding: '2.2rem',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '5rem', opacity: 0.05, userSelect: 'none' }}>🎯</div>
            <span style={{ color: '#ea580c', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              NUESTRA MISIÓN
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.5rem 0 0.8rem 0', color: '#ffffff' }}>
              Transformar el Comercio y la Movilidad Local
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.96rem', lineHeight: 1.65, margin: 0 }}>
              Impulsar la economía real de miles de familias, repartidores y emprendedores gastronómicos, creando un ecosistema digital transparente donde cada habitante pueda pedir comida, solicitar transporte seguro y conectar directamente sin comisiones abusivas.
            </p>
          </div>

          <div style={{
            background: '#0f172a',
            padding: '2.2rem',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '5rem', opacity: 0.05, userSelect: 'none' }}>🚀</div>
            <span style={{ color: '#4556EC', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              NUESTRA VISIÓN
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.5rem 0 0.8rem 0', color: '#ffffff' }}>
              Líderes de Economía Colaborativa para 2030
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.96rem', lineHeight: 1.65, margin: 0 }}>
              Consolidar a Landa como la súper-app de servicios locales más confiable y querida de Colombia y Latinoamérica, conectando a más de 1 millón de usuarios con estándares internacionales de seguridad, velocidad e impacto positivo en la comunidad.
            </p>
          </div>
        </div>

        {/* VALORES CORPORATIVOS */}
        <div style={{ marginBottom: '4.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ color: '#4556EC', fontWeight: 800, fontSize: '0.84rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
              VALORES CORPORATIVOS
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '0.4rem 0 0.6rem 0' }}>
              Lo Que Nos Mueve Todos los Días
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto' }}>
              Principios sólidos sobre los cuales construimos nuestro código y nuestras relaciones.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {VALUES.map((v, idx) => (
              <div key={idx} style={{
                background: '#0f172a',
                padding: '1.6rem',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <span style={{ fontSize: '2.2rem', display: 'block' }}>{v.icon}</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{v.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN DEL EQUIPO DIRECTIVO */}
        <div style={{ marginBottom: '4.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ color: '#ea580c', fontWeight: 800, fontSize: '0.84rem', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
              EQUIPO LIDERAZGO
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '0.4rem 0 0.6rem 0' }}>
              Las Mentes Detrás de Landa
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto' }}>
              Profesionales apasionados por la tecnología, el diseño accesible y la transformación social.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem', justifyContent: 'center' }}>
            {TEAM_MEMBERS.map((member, idx) => (
              <div key={idx} style={{
                background: '#0f172a',
                borderRadius: '24px',
                border: '1px solid rgba(69, 86, 236, 0.25)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              }}>
                <img
                  src={member.avatar}
                  alt={member.name}
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #4556EC',
                    marginBottom: '1.2rem',
                    boxShadow: '0 8px 20px rgba(69, 86, 236, 0.3)',
                  }}
                />
                <span style={{ background: 'rgba(69, 86, 236, 0.15)', color: '#7ea7ff', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                  {member.tag}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.3rem 0', color: '#ffffff' }}>
                  {member.name}
                </h3>
                <span style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.88rem', display: 'block', marginBottom: '0.85rem' }}>
                  {member.role}
                </span>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.55, margin: '0 0 1.2rem 0' }}>
                  {member.bio}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>
                  📍 <span>{member.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BANNER INFORMATIVO / CTA CONTACTO */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.6rem 0', color: '#ffffff' }}>
            ¿Quieres formar parte del Ecosistema Landa?
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto 1.75rem auto', fontSize: '0.98rem', lineHeight: 1.55 }}>
            Registra tu restaurante, únete como conductor aliado o descarga nuestra súper-app para empezar a disfrutar de una experiencia local superior.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://drive.google.com/file/d/1lWZQqLHgHFEpl0xMgQK4_seo1pb8Edrd/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #4556EC 0%, #3142c9 100%)',
                borderColor: '#4556EC',
                color: '#ffffff',
                padding: '0.85rem 1.75rem',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: '0 8px 24px rgba(69, 86, 236, 0.45)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              📲 Descargar Landa App
            </a>
            <Link
              to="/contacto"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '0.85rem 1.75rem',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '0.95rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              💬 Contactar al Equipo
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default QuienesSomos;
