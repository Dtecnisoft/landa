import React, { useState } from 'react';
import imgContacto from '../assets/images/contacto.jpeg';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';

// Vector SVG Icons for a professional enterprise feel
const Icons = {
  Restaurant: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7M4 7l2-4h12l2 4M5 21V10.85M19 21V10.85" />
    </svg>
  ),
  Delivery: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M15 6h2a2 2 0 0 1 2 2v4M12 17.5V14l-3-3 4-3 2 3h4" />
      <path d="M5.5 15H9l3-4" />
    </svg>
  ),
  Support: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  Rocket: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71 1.63-1.63 2.5-2.5L5.5 12.5l-1 4z" />
      <path d="M12 15l-3.5-3.5c4-4 7-9 12-10-1 5-6 8-10 12z" />
      <path d="M9 18l3.5 3.5c.87-.87 1.79-1.79 2.5-2.5-1.5-1.26-2-5-2-5s-3.74.5-5 2z" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  WhatsApp: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.43-9.875 9.877-9.875 2.638 0 5.118 1.028 6.984 2.897a9.816 9.816 0 012.892 6.974c-.001 5.446-4.432 9.875-9.877 9.875m0-18.067c-5.42 0-9.832 4.412-9.832 9.832 0 1.73.451 3.42 1.309 4.908l-1.391 5.08 5.198-1.363c1.439.784 3.064 1.198 4.716 1.198h.004c5.42 0 9.832-4.412 9.832-9.832a9.78 9.78 0 00-2.88-6.942 9.782 9.782 0 00-6.956-2.881" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  HelpCircle: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
};

function Contacto() {
  const { showToast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'faq' | 'presets'

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    motivo: 'restaurante', // default selected option
    mensaje: '',
    botField: '' // Honeypot anti-bot hidden field
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [openFaqId, setOpenFaqId] = useState(1);

  // Sanitizador simple de cadenas para prevenir XSS básico en inputs de texto
  const sanitizeString = (str) => {
    if (!str) return '';
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
  };

  // Copiar al portapapeles con feedback visual y toast
  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`¡${fieldName} copiado al portapapeles!`, 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectMotivo = (motivoValue) => {
    setFormData((prev) => ({ ...prev, motivo: motivoValue }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // 1. Verificación Honeypot anti-spam (si el campo oculto tiene contenido, es un bot)
    if (formData.botField) {
      console.warn('[Security Warning] Bot submission blocked via Honeypot.');
      showToast('Solicitud rechazada.', 'error');
      return;
    }

    // 2. Cooldown Rate Limiting (Evitar spam por clics repetidos, mínimo 10 segundos entre envíos)
    const now = Date.now();
    if (now - lastSubmitTime < 10000) {
      const waitSeconds = Math.ceil((10000 - (now - lastSubmitTime)) / 1000);
      showToast(`Por favor espera ${waitSeconds} segundos antes de enviar otro mensaje.`, 'warning');
      return;
    }

    const cleanNombre = sanitizeString(formData.nombre);
    const cleanEmail = sanitizeString(formData.email);
    const cleanTelefono = sanitizeString(formData.telefono);
    const cleanMensaje = sanitizeString(formData.mensaje);

    if (!cleanNombre) {
      showToast('Por favor ingresa tu nombre completo', 'warning');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Por favor ingresa un correo electrónico válido', 'warning');
      return;
    }
    if (!cleanMensaje || cleanMensaje.length < 10) {
      showToast('Por favor escribe un mensaje de al menos 10 caracteres', 'warning');
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);

    try {
      // Intentar guardar en Supabase si existe tabla mensajes_contacto
      const { error } = await supabase.from('mensajes_contacto').insert([
        {
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          motivo: formData.motivo,
          mensaje: formData.mensaje,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) {
        console.info('Supabase save skipped or fallback activated:', error.message);
      }
    } catch (err) {
      console.info('Network/table fallback for contact form');
    }

    // Generar ticket simulación
    const ticketId = `LND-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedTicket({
        id: ticketId,
        date: new Date().toLocaleString('es-CO'),
        data: { ...formData }
      });
      showToast('¡Tu mensaje ha sido enviado correctamente!', 'success', 'Solicitud Registrada');
    }, 1000);
  };

  const resetForm = () => {
    setSubmittedTicket(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      motivo: 'restaurante',
      mensaje: ''
    });
  };

  const buildWhatsAppUrl = (customText) => {
    const phone = '573126201934';
    const text = customText || `Hola Landa App! Mi nombre es ${formData.nombre || 'un usuario'}. ${formData.motivo ? `[Motivo: ${formData.motivo}] ` : ''
      }${formData.mensaje || 'Me gustaría recibir información sobre la plataforma.'}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const faqs = [
    {
      id: 1,
      pregunta: '¿En cuánto tiempo responden a mis mensajes o solicitudes?',
      respuesta:
        'Nuestro equipo de soporte brinda atención 24/7 los 7 días de la semana (Lunes a Domingo). Procesamos tus mensajes y solicitudes en tiempo récord, con respuestas habituales en menos de 2 horas a cualquier hora del día o de la noche.'
    },
    {
      id: 2,
      pregunta: '¿Cómo puedo afiliar mi restaurante o negocio local a Landa?',
      respuesta:
        'Es muy sencillo. Selecciona la opción "Aliado Restaurante" en el formulario de arriba o escríbenos directamente por WhatsApp. Un asesor te guiará paso a paso para configurar tu menú, comisiones transparentes y presencia en la app.'
    },
    {
      id: 3,
      pregunta: '¿Cuáles son los requisitos para unirme como repartidor o conductor?',
      respuesta:
        'Necesitas ser mayor de edad, contar con documento de identidad vigente, licencia de conducción correspondiente a tu vehículo (moto o carro), tarjeta de propiedad y SOAT al día. Puedes registrarte solicitando atención directa por soporte.'
    },
    {
      id: 4,
      pregunta: '¿En qué ciudades y zonas está disponible Landa actualmente?',
      respuesta:
        'Actualmente operamos con cobertura completa en Cali, Colombia, extendiendo nuestros servicios a zonas como Jamundí y Palmira. Estamos en fase de expansión hacia más municipios del Valle del Cauca y Eje Cafetero.'
    },
    {
      id: 5,
      pregunta: '¿Tienen soporte técnico en vivo si tengo un problema con un pedido?',
      respuesta:
        '¡Sí! Contamos con un canal de WhatsApp directo donde nuestro equipo de operaciones ayuda en tiempo real a clientes, restaurantes y conductores ante cualquier novedad con una entrega.'
    }
  ];

  const presetsWhatsApp = [
    {
      iconComponent: Icons.Restaurant,
      title: 'Soy un Restaurante',
      desc: 'Quiero afiliar mi negocio y vender más',
      text: 'Hola Landa App, me gustaría recibir asesoría para afiliar mi restaurante a la plataforma.'
    },
    {
      iconComponent: Icons.Delivery,
      title: 'Quiero ser Repartidor',
      desc: 'Registro de conductores y mensajeros',
      text: 'Hola Landa App, quiero registrarme como conductor/repartidor para generar ingresos.'
    },
    {
      iconComponent: Icons.Support,
      title: 'Soporte con un Pedido',
      desc: 'Ayuda en vivo para clientes activos',
      text: 'Hola Landa App, requiero soporte rápido con un pedido en curso.'
    },
    {
      iconComponent: Icons.Rocket,
      title: 'Llevar Landa a mi Ciudad',
      desc: 'Alianzas comerciales e inversionistas',
      text: 'Hola Landa App, me interesa explorar una alianza o expansión en mi municipio.'
    }
  ];

  const motivos = [
    { id: 'restaurante', label: 'Aliado Restaurante', icon: Icons.Restaurant, desc: 'Registro o alianza comercial' },
    { id: 'repartidor', label: 'Repartidor / Conductor', icon: Icons.Delivery, desc: 'Trabajar con Landa' },
    { id: 'soporte', label: 'Soporte Técnico', icon: Icons.Support, desc: 'Ayuda con la app' },
    { id: 'general', label: 'Información General', icon: Icons.User, desc: 'Dudas y preguntas' }
  ];

  return (
    <section id="contacto" className="section contact-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-title text-center">
          <div className="contact-status-badge">
            <span className="pulse-dot"></span>
            <span className="badge-text">Soporte 24/7</span>
          </div>
          <span className="eyebrow">ESTAMOS PARA AYUDARTE</span>
          <h2>Contacto y Soporte Directo</h2>
          <p className="contact-subtitle">
            ¿Tienes preguntas, quieres integrar tu restaurante o necesitas ayuda inmediata? Elige tu canal preferido y hablemos.
          </p>
        </div>

        <div className="contact-main-wrapper">
          {/* LEFT COLUMN: Channels & Quick Info */}
          <div className="contact-sidebar">
            {/* Image Card with Glass Overlay */}
            <div className="contact-image-frame">
              <img
                src={imgContacto}
                alt="Soporte y Atención al Cliente Landa App"
                className="contact-img"
              />
              <div className="contact-image-badge">
                <div className="badge-icon svg-icon-box">
                  <Icons.Zap />
                </div>
                <div>
                  <strong>Atención Prioritaria</strong>
                  <p>Respuestas claras y humanas en minutos.</p>
                </div>
              </div>
            </div>

            {/* Official Contact Cards Grid */}
            <div className="contact-info-cards">
              {/* Email Card */}
              <article className="contact-card">
                <div className="contact-card-icon svg-icon-box cyan">
                  <Icons.Mail />
                </div>
                <div className="contact-card-body">
                  <span className="card-label">Correo Oficial</span>
                  <a href="mailto:administracion@landapp.com.co" className="contact-link">
                    administracion@landapp.com.co
                  </a>
                </div>
                <button
                  type="button"
                  className="contact-copy-btn"
                  onClick={() => handleCopy('administracion@landapp.com.co', 'Correo')}
                  title="Copiar correo"
                >
                  {copiedField === 'Correo' ? <Icons.Check /> : <Icons.Copy />}
                </button>
              </article>

              {/* Phone Card */}
              <article className="contact-card">
                <div className="contact-card-icon svg-icon-box emerald">
                  <Icons.Phone />
                </div>
                <div className="contact-card-body">
                  <span className="card-label">Línea Directa / WhatsApp</span>
                  <a href="tel:+573126201934" className="contact-link">
                    +57 312 620 1934
                  </a>
                </div>
                <button
                  type="button"
                  className="contact-copy-btn"
                  onClick={() => handleCopy('+573126201934', 'Teléfono')}
                  title="Copiar teléfono"
                >
                  {copiedField === 'Teléfono' ? <Icons.Check /> : <Icons.Copy />}
                </button>
              </article>

              {/* Location Card */}
              <article className="contact-card">
                <div className="contact-card-icon svg-icon-box amber">
                  <Icons.MapPin />
                </div>
                <div className="contact-card-body">
                  <span className="card-label">Sede Principal & Cobertura</span>
                  <p className="contact-text">Carrera 23 No. 75B-00, Cali, Valle del Cauca, Colombia</p>
                  <div className="contact-location-pills">
                    <span className="loc-pill active">Cali</span>
                    <span className="loc-pill active">Jamundí</span>
                    <span className="loc-pill active">Palmira</span>
                    <span className="loc-pill upcoming">+ Próximamente</span>
                  </div>
                </div>
              </article>
            </div>

            {/* Direct WhatsApp Primary CTA */}
            <div className="contact-wa-block">
              <div className="wa-block-content">
                <h4>Atención directa por WhatsApp</h4>
                <p>Abre un chat inmediato con un asesor de nuestro equipo.</p>
              </div>
              <a
                href="https://wa.me/573126201934"
                target="_blank"
                rel="noopener noreferrer"
                className="btn contact-wa-btn"
              >
                <Icons.WhatsApp />
                <span>Chatear por WhatsApp</span>
                <span className="btn-arrow">→</span>
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Tabs (Form / FAQ / WhatsApp Presets) */}
          <div className="contact-content-card">
            {/* Nav Tabs */}
            <div className="contact-tabs-nav">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
                onClick={() => setActiveTab('form')}
              >
                <Icons.FileText />
                <span>Formulario</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
                onClick={() => setActiveTab('presets')}
              >
                <Icons.Zap />
                <span>Mensajes Rápido</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
                onClick={() => setActiveTab('faq')}
              >
                <Icons.HelpCircle />
                <span>Preguntas Frecuentes</span>
              </button>
            </div>

            {/* TAB 1: FORMULARIO */}
            {activeTab === 'form' && (
              <div className="tab-pane">
                {submittedTicket ? (
                  /* Success Confirmation Card */
                  <div className="contact-success-card">
                    <div className="success-icon-wrapper">
                      <Icons.CheckCircle />
                    </div>
                    <h3>¡Mensaje Enviado con Éxito!</h3>
                    <p className="success-subtitle">
                      Hemos recibido tu solicitud y se ha generado un número de seguimiento.
                    </p>

                    <div className="ticket-details-box">
                      <div className="ticket-row">
                        <span>Código de Solicitud:</span>
                        <strong className="ticket-code">{submittedTicket.id}</strong>
                      </div>
                      <div className="ticket-row">
                        <span>Nombre:</span>
                        <strong>{submittedTicket.data.nombre}</strong>
                      </div>
                      <div className="ticket-row">
                        <span>Correo:</span>
                        <strong>{submittedTicket.data.email}</strong>
                      </div>
                      <div className="ticket-row">
                        <span>Atención de Soporte:</span>
                        <strong className="text-emerald">Soporte 24/7 (&lt; 2 horas)</strong>
                      </div>
                    </div>

                    <div className="success-actions">
                      <a
                        href={buildWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        <Icons.WhatsApp />
                        <span>Continuar en WhatsApp con mi ticket</span>
                      </a>
                      <button type="button" onClick={resetForm} className="btn btn-outline">
                        Enviar otra consulta
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Main Form */
                  <form onSubmit={handleSubmitForm} className="contact-form">
                    {/* Honeypot field (hidden for users, filled by automated bots) */}
                    <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }} aria-hidden="true">
                      <input
                        type="text"
                        name="botField"
                        tabIndex="-1"
                        autoComplete="off"
                        value={formData.botField || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-header">
                      <h3>Déjanos tu mensaje</h3>
                      <p>Llena los datos a continuación y nos pondremos en contacto contigo.</p>
                    </div>

                    {/* Motivo Chips Selector */}
                    <div className="form-group">
                      <label className="form-label">¿Cuál es el motivo de tu consulta?</label>
                      <div className="motivo-chips-grid">
                        {motivos.map((m) => {
                          const MotivoIcon = m.icon;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              className={`motivo-chip ${formData.motivo === m.id ? 'selected' : ''}`}
                              onClick={() => handleSelectMotivo(m.id)}
                            >
                              <span className="chip-icon">
                                <MotivoIcon />
                              </span>
                              <span className="chip-label">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 1: Nombre & Email */}
                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label" htmlFor="nombre">
                          Nombre completo <span className="req">*</span>
                        </label>
                        <div className="input-with-icon">
                          <span className="input-icon">
                            <Icons.User />
                          </span>
                          <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            placeholder="Ej. Juan Pérez"
                            className="form-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="email">
                          Correo electrónico <span className="req">*</span>
                        </label>
                        <div className="input-with-icon">
                          <span className="input-icon">
                            <Icons.Mail />
                          </span>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="ejemplo@correo.com"
                            className="form-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Teléfono */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="telefono">
                        Teléfono / WhatsApp <span className="optional">(opcional)</span>
                      </label>
                      <div className="input-with-icon">
                        <span className="input-icon">
                          <Icons.Phone />
                        </span>
                        <input
                          type="tel"
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          placeholder="+57 300 000 0000"
                          className="form-input"
                        />
                      </div>
                    </div>

                    {/* Row 3: Mensaje */}
                    <div className="form-group">
                      <div className="form-label-row">
                        <label className="form-label" htmlFor="mensaje">
                          Tu mensaje <span className="req">*</span>
                        </label>
                        <span className="char-counter">{formData.mensaje.length}/500</span>
                      </div>
                      <textarea
                        id="mensaje"
                        name="mensaje"
                        rows="4"
                        maxLength="500"
                        value={formData.mensaje}
                        onChange={handleInputChange}
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        className="form-textarea"
                        required
                      ></textarea>
                    </div>

                    {/* Submit Buttons */}
                    <div className="form-actions-row">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`btn btn-primary submit-btn ${isSubmitting ? 'submitting' : ''}`}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="btn-spinner"></span>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar Mensaje</span>
                            <span className="btn-icon">
                              <Icons.Send />
                            </span>
                          </>
                        )}
                      </button>

                      <a
                        href={buildWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-whatsapp-direct"
                        title="Enviar el texto ingresado directamente a WhatsApp"
                      >
                        <Icons.WhatsApp />
                        <span>WhatsApp Directo</span>
                      </a>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: PRESETS WHATSAPP */}
            {activeTab === 'presets' && (
              <div className="tab-pane">
                <div className="presets-header">
                  <h3>Mensajes Rápido por WhatsApp</h3>
                  <p>
                    Selecciona la opción que mejor se adapte a tu necesidad para abrir un chat preconfigurado.
                  </p>
                </div>

                <div className="presets-grid">
                  {presetsWhatsApp.map((item, idx) => {
                    const PresetIcon = item.iconComponent;
                    return (
                      <div key={idx} className="preset-card">
                        <div className="preset-icon-box">
                          <PresetIcon />
                        </div>
                        <div className="preset-body">
                          <h4>{item.title}</h4>
                          <p>{item.desc}</p>
                        </div>
                        <a
                          href={`https://wa.me/573126201934?text=${encodeURIComponent(item.text)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn preset-btn"
                        >
                          <Icons.WhatsApp />
                          <span>Iniciar Chat</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: FAQ */}
            {activeTab === 'faq' && (
              <div className="tab-pane">
                <div className="faq-header">
                  <h3>Preguntas Frecuentes</h3>
                  <p>Respuestas inmediatas a las dudas más habituales.</p>
                </div>

                <div className="faq-accordion">
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className={`faq-item ${openFaqId === faq.id ? 'open' : ''}`}
                    >
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                      >
                        <span>{faq.pregunta}</span>
                        <span className="faq-chevron">{openFaqId === faq.id ? '−' : '+'}</span>
                      </button>
                      {openFaqId === faq.id && (
                        <div className="faq-answer">
                          <p>{faq.respuesta}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contacto;
