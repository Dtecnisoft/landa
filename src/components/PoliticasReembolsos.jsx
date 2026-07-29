import { useState } from 'react';

function Accordion({ chapters }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="accordion-menu">
      {chapters.map((chapter, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={chapter.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
            <button
              className="accordion-header"
              onClick={() => toggleAccordion(index)}
              type="button"
              aria-expanded={isOpen}
            >
              <span>{chapter.title}</span>
              <span className="accordion-arrow">{isOpen ? '▼' : '▶'}</span>
            </button>
            <div className="accordion-content">
              <div className="accordion-content-inner">
                {chapter.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PoliticasReembolsos() {
  const chapters = [
    {
      id: 'sec1',
      title: '1. IDENTIFICACIÓN DEL RESPONSABLE',
      content: (
        <>
          <p>El responsable del tratamiento de solicitudes de reembolsos y cancelaciones es la entidad titular de la Plataforma:</p>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Campo</th>
                <th>Dato</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Razón social</strong></td>
                <td>LANDA APP S.A.S.</td>
              </tr>
              <tr>
                <td><strong>NIT</strong></td>
                <td>902.065.549-2</td>
              </tr>
              <tr>
                <td><strong>Sitio web</strong></td>
                <td><a href="https://landaapp.co" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co</a></td>
              </tr>
              <tr>
                <td><strong>Canal de contacto</strong></td>
                <td>Formulario disponible en <a href="https://landaapp.co/contacto" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co/contacto</a> y sección “Ayuda” de la app móvil</td>
              </tr>
            </tbody>
          </table>
        </>
      )
    },
    {
      id: 'sec2',
      title: '2. MARCO NORMATIVO APLICABLE',
      content: (
        <>
          <p>Esta Política se rige por las siguientes normas del derecho colombiano:</p>
          <ul>
            <li><strong>Ley 1480 de 2011 (Estatuto del Consumidor):</strong> Arts. 23 (información clara y suficiente), 42 y 43 (cláusulas abusivas), 47 (derecho de retracto), 51 (reversión del pago), 53 a 55 (comercio electrónico), 56 a 58 (PQR y SIC).</li>
            <li><strong>Decreto 1499 de 2014:</strong> Reglamenta el ejercicio del derecho de retracto.</li>
            <li><strong>Decreto 587 de 2016:</strong> Reglamenta el procedimiento de reversión del pago (compilado en el Decreto 1074/2015).</li>
            <li><strong>Ley 1581 de 2012:</strong> Habeas data para el tratamiento de datos personales durante el proceso de reembolso.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec3',
      title: '3. DEFINICIONES',
      content: (
        <>
          <ul>
            <li><strong>3.1. Plataforma:</strong> la aplicación móvil y los sitios web operados por LANDA APP S.A.S.</li>
            <li><strong>3.2. Servicio:</strong> servicio de transporte o domicilio solicitado y contratado a través de la Plataforma.</li>
            <li><strong>3.3. Usuario:</strong> persona natural o jurídica que utiliza la Plataforma.</li>
            <li><strong>3.4. Prestador del Servicio:</strong> conductor o repartidor independiente que ejecuta materialmente el Servicio.</li>
            <li><strong>3.5. LANDA:</strong> LANDA APP S.A.S., operadora del portal tecnológico y proveedora del medio de comercio electrónico (Art. 53 Ley 1480/2011).</li>
            <li><strong>3.6. Servicio Iniciado:</strong> Servicio cuya ejecución material ha comenzado.</li>
            <li><strong>3.7. Cancelación:</strong> decisión del Usuario o del Prestador de no continuar con un Servicio.</li>
            <li><strong>3.8. Reembolso:</strong> devolución de valores cobrados, en cumplimiento de obligaciones legales o contractuales.</li>
            <li><strong>3.9. Compensación voluntaria:</strong> beneficio adicional otorgado por LANDA al Usuario por consideraciones de calidad de servicio, sin reconocimiento de responsabilidad y sin sustituir reembolsos legalmente exigibles.</li>
            <li><strong>3.10. Reversión del pago:</strong> mecanismo legal del Art. 51 de la Ley 1480/2011.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec4',
      title: '4. ALCANCE DE LA POLÍTICA',
      content: (
        <>
          <p>Esta Política aplica a todas las transacciones realizadas a través de la Plataforma para los siguientes Servicios:</p>
          <ul>
            <li>Transporte con conductor dentro de las ciudades donde LANDA opera.</li>
            <li>Domicilios de productos solicitados a través de la Plataforma a Comercios Afiliados.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec5',
      title: '5. DERECHO DE RETRACTO (ART. 47 LEY 1480/2011)',
      content: (
        <>
          <ul>
            <li><strong>5.1. Regla general:</strong> El Usuario tiene derecho a retractarse de un Servicio contratado dentro de los cinco (5) días hábiles siguientes a la celebración del contrato, salvo las excepciones legales.</li>
            <li><strong>5.2. Excepciones aplicables al modelo LANDA:</strong> No procede el retracto cuando:
              <ul style={{ marginTop: '0.4rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> El Servicio ya ha iniciado su ejecución con consentimiento del Usuario antes del vencimiento del plazo.</li>
                <li><strong>b)</strong> El Servicio se preste de manera continua o periódica una vez iniciado.</li>
                <li><strong>c)</strong> Las demás excepciones del Art. 47 Ley 1480/2011 que resulten aplicables.</li>
              </ul>
            </li>
            <li><strong>5.3. Caso típico en que sí aplica:</strong> Reservas de viaje programadas para una fecha futura cuyo Servicio aún no haya iniciado.</li>
            <li><strong>5.4. Procedimiento:</strong> Comunicación a LANDA por los canales habilitados en el numeral 11. Devolución del dinero en treinta (30) días calendario desde la comunicación, conforme al Decreto 1499/2014.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec6',
      title: '6. REVERSIÓN DEL PAGO (ART. 51 LEY 1480/2011)',
      content: (
        <>
          <ul>
            <li><strong>6.1. Causales:</strong>
              <ul style={{ marginTop: '0.4rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Fraude.</li>
                <li><strong>b)</strong> Operación no solicitada.</li>
                <li><strong>c)</strong> Servicio no prestado o que no corresponde a lo solicitado.</li>
                <li><strong>d)</strong> Servicio defectuoso.</li>
              </ul>
            </li>
            <li><strong>6.2. Plazo de la solicitud:</strong> Cinco (5) días hábiles desde la noticia del hecho.</li>
            <li><strong>6.3. Procedimiento:</strong> Notificación simultánea a LANDA y a la entidad financiera emisora del medio de pago.</li>
            <li><strong>6.4. Efectos:</strong> Verificada la causal, LANDA gestionará la reversión ante el procesador respectivo dentro de los plazos del reglamento aplicable. LANDA acompañará al Usuario en el procedimiento.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec7',
      title: '7. CANCELACIONES POR EL USUARIO',
      content: (
        <>
          <h4>7.1. Antes de iniciado el Servicio</h4>
          <ul>
            <li><strong>a)</strong> Si el Usuario cancela antes de que el Prestador haya aceptado la solicitud, no se cobrará valor alguno.</li>
            <li><strong>b)</strong> Si el Usuario cancela dentro de los cinco (5) minutos siguientes a la aceptación del Prestador, no se cobrará valor alguno.</li>
          </ul>

          <hr className="legal-divider" />

          <h4>7.2. Tras el periodo de gracia (Servicio aún no iniciado)</h4>
          <ul>
            <li><strong>a)</strong> Si el Usuario cancela después del periodo de gracia y antes de que el Servicio inicie, LANDA podrá cobrar una tarifa de cancelación publicada dentro de la Plataforma.</li>
            <li><strong>b)</strong> La tarifa de cancelación se informará al Usuario al momento de la cancelación.</li>
          </ul>

          <hr className="legal-divider" />

          <h4>7.3. Con el Servicio iniciado</h4>
          <ul>
            <li><strong>a) Transporte:</strong> se cobra el valor del trayecto recorrido hasta el momento de la cancelación, conforme a la tarifa base aplicable.</li>
            <li><strong>b) Domicilios (pedido ya recogido por el Prestador):</strong> se cobra el valor del producto y del Servicio de domicilio, salvo que la cancelación sea atribuible al Prestador o al Comercio Afiliado.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec8',
      title: '8. CANCELACIONES POR EL PRESTADOR DEL SERVICIO',
      content: (
        <>
          <ul>
            <li><strong>8.1.</strong> Si el Prestador cancela el Servicio antes de su inicio, LANDA reasignará la solicitud a otro Prestador sin cargo adicional para el Usuario.</li>
            <li><strong>8.2.</strong> Si el Prestador no llega al punto de recogida dentro de los cinco (5) minutos posteriores a la hora estimada de llegada informada en la Plataforma, el Usuario podrá cancelar sin cargo y solicitar la reasignación.</li>
            <li><strong>8.3.</strong> Si el Prestador cancela el Servicio una vez iniciado por causa no atribuible al Usuario, el Usuario tendrá derecho a:
              <ul style={{ marginTop: '0.4rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Reembolso proporcional al tramo no ejecutado.</li>
                <li><strong>b)</strong> Reasignación inmediata cuando sea posible.</li>
              </ul>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'sec9',
      title: '9. CANCELACIONES POR LANDA',
      content: (
        <>
          <ul>
            <li><strong>9.1.</strong> LANDA podrá cancelar un Servicio en curso por razones de seguridad, fraude, incumplimiento de los Términos y Condiciones, fuerza mayor o caso fortuito.</li>
            <li><strong>9.2.</strong> En estos casos LANDA informará al Usuario y procederá al reembolso correspondiente al tramo no ejecutado.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec10',
      title: '10. CASOS DE REEMBOLSO',
      content: (
        <>
          <h4>10.1. Procedencia</h4>
          <p>Se reembolsará al Usuario en los siguientes eventos:</p>
          <ul>
            <li><strong>a)</strong> Cobros duplicados o erróneos del mismo Servicio.</li>
            <li><strong>b)</strong> Cargos por Servicios no prestados.</li>
            <li><strong>c)</strong> Cargos por Servicios distintos a los solicitados.</li>
            <li><strong>d)</strong> Cargos por fallas técnicas de la Plataforma imputables a LANDA.</li>
            <li><strong>e)</strong> Cancelación por LANDA conforme al numeral 9.</li>
            <li><strong>f)</strong> Retracto procedente conforme al numeral 5.</li>
            <li><strong>g)</strong> Reversión del pago procedente conforme al numeral 6.</li>
          </ul>

          <hr className="legal-divider" />

          <h4>10.2. No procedencia</h4>
          <p>No procederá el reembolso en los siguientes eventos:</p>
          <ul>
            <li><strong>a)</strong> Servicios efectivamente prestados conforme a lo solicitado.</li>
            <li><strong>b)</strong> Cancelaciones tardías del Usuario fuera del periodo de gracia (7.1.b).</li>
            <li><strong>c)</strong> Solicitudes presentadas fuera de los plazos legales.</li>
          </ul>

          <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.25)', padding: '1rem 1.25rem', borderRadius: '12px', marginTop: '1rem' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#f97316', fontSize: '0.95rem' }}>Exclusiones específicas del módulo de domicilios:</h5>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
              <li style={{ marginBottom: '0.4rem' }}><strong>d)</strong> El Usuario compartió el código de seguridad de entrega antes de recibir el pedido. Compartir el código equivale a confirmar la entrega correcta del Servicio; es responsabilidad del Usuario compartir el código únicamente al recibir el pedido en sus manos.</li>
              <li style={{ marginBottom: '0.4rem' }}><strong>e)</strong> El Usuario ingresó incorrectamente la dirección de entrega y, por esa razón, el pedido no pudo ser entregado. Es responsabilidad del Usuario verificar la dirección antes de confirmar el pedido.</li>
              <li style={{ marginBottom: '0.4rem' }}><strong>f)</strong> El Prestador llegó a la dirección indicada pero no pudo entregar el pedido por ausencia del Usuario o falta de respuesta del Usuario a las comunicaciones del Prestador.</li>
              <li><strong>g)</strong> La información aportada por el Usuario en el reporte no se ajusta a la realidad de los hechos, verificada por LANDA mediante elementos objetivos (registros de la Plataforma, comunicaciones, geolocalización, imágenes). En este caso, si la compensación o el reembolso ya fueron otorgados, LANDA podrá revertirlos.</li>
            </ul>
          </div>
        </>
      )
    },
    {
      id: 'sec10bis',
      title: '10-BIS. COMPENSACIONES VOLUNTARIAS',
      content: (
        <>
          <ul>
            <li><strong>10-bis.1.</strong> Adicionalmente al régimen de reembolsos del numeral 10, LANDA podrá otorgar compensaciones voluntarias al Usuario cuando, sin existir obligación legal, considere conveniente reconocer afectaciones a su experiencia con la Plataforma.</li>
            <li><strong>10-bis.2.</strong> Las compensaciones voluntarias no implican reconocimiento de responsabilidad de LANDA por los hechos que las motivan y no sustituyen los reembolsos legalmente exigibles cuando éstos procedan.</li>
            <li><strong>10-bis.3. La compensación voluntaria podrá entregarse mediante:</strong>
              <ul style={{ marginTop: '0.4rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Crédito en el saldo de la cuenta del Usuario en la Plataforma, redimible en futuros Servicios.</li>
                <li><strong>b)</strong> Devolución parcial o total al medio de pago original del Usuario, cuando técnicamente sea viable.</li>
              </ul>
            </li>
            <li><strong>10-bis.4.</strong> El Usuario podrá optar entre las modalidades del numeral anterior, salvo restricciones operativas que se le informarán al momento del ofrecimiento.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec11',
      title: '11. PROCEDIMIENTO DE SOLICITUD',
      content: (
        <>
          <h4>11.1. Canales habilitados</h4>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Canal</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Formulario web</strong></td>
                <td><a href="https://landaapp.co/contacto" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co/contacto</a></td>
              </tr>
              <tr>
                <td><strong>Formulario in-app</strong></td>
                <td>Sección “Ayuda” → “Reembolsos”</td>
              </tr>
            </tbody>
          </table>

          <hr className="legal-divider" />

          <h4>11.2. Información requerida</h4>
          <ul>
            <li><strong>a)</strong> Identificación del Usuario.</li>
            <li><strong>b)</strong> Número de identificación del Servicio.</li>
            <li><strong>c)</strong> Descripción del hecho.</li>
            <li><strong>d)</strong> Soporte documental cuando aplique.</li>
          </ul>

          <hr className="legal-divider" />

          <h4>11.3. Plazos internos de respuesta</h4>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Tipo de solicitud</th>
                <th>Plazo</th>
                <th>Fundamento</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Reembolso por error técnico, cobro duplicado o servicio no prestado</strong></td>
                <td>Quince (15) días hábiles, prorrogables ocho (8) más</td>
                <td>Por analogía con Art. 15 Ley 1581/2012</td>
              </tr>
              <tr>
                <td><strong>Reversión del pago</strong></td>
                <td>Gestión inmediata ante el procesador</td>
                <td>Art. 51 Ley 1480/2011 + Decreto 587/2016</td>
              </tr>
              <tr>
                <td><strong>Retracto</strong></td>
                <td>Treinta (30) días calendario para el reintegro</td>
                <td>Decreto 1499/2014</td>
              </tr>
              <tr>
                <td><strong>Compensación voluntaria</strong></td>
                <td>Diez (10) días hábiles desde el reporte</td>
                <td>Compromiso interno de LANDA</td>
              </tr>
            </tbody>
          </table>

          <hr className="legal-divider" />

          <h4>11.4. Medio de devolución</h4>
          <p>El reembolso se efectuará por el mismo medio en que se realizó el pago, salvo que el Usuario solicite expresamente otro medio y este sea técnicamente viable. La compensación voluntaria opera conforme al numeral 10-bis.</p>
        </>
      )
    },
    {
      id: 'sec12',
      title: '12. PROTECCIÓN DE DATOS EN EL PROCESO DE REEMBOLSO',
      content: (
        <>
          <ul>
            <li><strong>12.1.</strong> Los datos personales se tratarán conforme al Aviso de Privacidad y a la Política de Tratamiento de Datos Personales de LANDA (<a href="https://landaapp.co/politicas-tratamientos-datos" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co/politicas-tratamientos-datos</a>), bajo la Ley 1581/2012.</li>
            <li><strong>12.2. Finalidad:</strong> atención de la solicitud, prevención del fraude y cumplimiento de obligaciones contables, tributarias y legales.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec13',
      title: '13. PETICIONES, QUEJAS Y RECLAMOS ANTE LA SIC',
      content: (
        <>
          <ul>
            <li><strong>13.1.</strong> Si el Usuario considera que LANDA no ha atendido satisfactoriamente su solicitud, podrá acudir a la Superintendencia de Industria y Comercio (SIC) en uso de los Arts. 56 y siguientes de la Ley 1480/2011.</li>
            <li><strong>13.2. Canal SIC:</strong> <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>www.sic.gov.co</a> — sección “Atención al Consumidor”.</li>
          </ul>
        </>
      )
    },
    {
      id: 'sec14',
      title: '14. VIGENCIA Y MODIFICACIONES',
      content: (
        <>
          <ul>
            <li><strong>14.1.</strong> Esta Política rige desde el 29 de julio de 2026.</li>
            <li><strong>14.2.</strong> LANDA podrá modificarla cuando lo requieran las normas aplicables, la operación de la Plataforma o los Servicios prestados, comunicando las modificaciones a través de la Plataforma y por el correo registrado del Usuario.</li>
            <li><strong>14.3. URL vigente:</strong> <a href="https://landaapp.co/politica-reembolsos" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co/politica-reembolsos</a></li>
          </ul>
        </>
      )
    }
  ];

  return (
    <section id="legal" className="privacy-page">
      <div className="page-hero">
        <div className="wrap">
          <span className="node-label">Legal</span>
          <h1>POLÍTICA DE REEMBOLSOS Y CANCELACIONES</h1>
          <p>LANDA APP S.A.S. · NIT 902.065.549-2 — Versión web 1.0 (29 de julio de 2026)</p>
        </div>
      </div>

      <section className="privacy-content section">
        <div className="container">
          <div className="document-reader-card">
            <div className="document-header">
              <span className="updated-badge">Última actualización · 29 de Julio 2026</span>
              <h2>POLÍTICA DE REEMBOLSOS Y CANCELACIONES — LANDA APP</h2>
            </div>
            <div className="document-body legal">
              <Accordion chapters={chapters} />

              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: '#f97316', fontWeight: 800, fontSize: '0.95rem' }}>
                LANDA APP S.A.S. — NIT 902.065.549-2 — landaapp.co
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default PoliticasReembolsos;
