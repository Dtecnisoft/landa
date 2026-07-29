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

function Politicas() {
  const chapters = [
    {
      id: 'cap1',
      title: 'CAPÍTULO I — DISPOSICIONES GENERALES',
      content: (
        <>
          <h3>1. Identificación del Responsable del Tratamiento</h3>
          <p>El responsable del tratamiento de las bases de datos regidas por esta política es:</p>

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
              <tr>
                <td><strong>Carácter</strong></td>
                <td>Responsable del Tratamiento (Art. 3, lit. e), Ley 1581/2012)</td>
              </tr>
            </tbody>
          </table>

          <h3>2. Marco normativo</h3>
          <ul>
            <li><strong>Constitución Política de Colombia:</strong> artículos 15 (habeas data) y 20.</li>
            <li><strong>Ley Estatutaria 1581 de 2012:</strong> Régimen general de protección de datos personales.</li>
            <li><strong>Decreto 1074 de 2015, Capítulo 25:</strong> Régimen reglamentario.</li>
            <li><strong>Decreto 1074 de 2015, Capítulo 26:</strong> Registro Nacional de Bases de Datos (RNBD).</li>
            <li><strong>Sentencia C-748/2011</strong> de la Corte Constitucional.</li>
            <li><strong>Circulares vigentes</strong> de la Superintendencia de Industria y Comercio.</li>
            <li><strong>Ley 527 de 1999:</strong> Comercio electrónico y validez de las autorizaciones electrónicas.</li>
          </ul>

          <h3>3. Definiciones</h3>
          <ul>
            <li><strong>3.1. Autorización:</strong> consentimiento previo, expreso e informado del Titular (Art. 3, lit. a), Ley 1581/2012).</li>
            <li><strong>3.2. Base de Datos:</strong> conjunto organizado de Datos Personales objeto de Tratamiento.</li>
            <li><strong>3.3. Dato Personal:</strong> información vinculada o asociable a una persona natural determinada o determinable.</li>
            <li><strong>3.4. Dato Sensible:</strong> dato que afecta la intimidad del Titular o cuyo uso indebido puede generar discriminación (Art. 5 Ley 1581/2012).</li>
            <li><strong>3.5. Encargado del Tratamiento:</strong> persona natural o jurídica que trata datos por cuenta de LANDA.</li>
            <li><strong>3.6. Habeas Data:</strong> derecho fundamental a conocer, actualizar y rectificar información en bases de datos.</li>
            <li><strong>3.7. LANDA:</strong> LANDA APP S.A.S.</li>
            <li><strong>3.8. Plataforma:</strong> la aplicación móvil “LANDA APP” y los sitios web operados por LANDA.</li>
            <li><strong>3.9. Responsable del Tratamiento:</strong> LANDA APP S.A.S.</li>
            <li><strong>3.10. Titular:</strong> persona natural cuyos Datos Personales son objeto de Tratamiento.</li>
            <li><strong>3.11. Transferencia:</strong> envío de datos fuera de Colombia a un Responsable.</li>
            <li><strong>3.12. Transmisión:</strong> comunicación de datos a un Encargado, dentro o fuera de Colombia.</li>
            <li><strong>3.13. Tratamiento:</strong> cualquier operación sobre los Datos Personales.</li>
            <li><strong>3.14. Usuario:</strong> persona natural o jurídica registrada en la Plataforma.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap2',
      title: 'CAPÍTULO II — PRINCIPIOS RECTORES',
      content: (
        <>
          <p>LANDA aplicará los siguientes principios al Tratamiento de Datos Personales (Art. 4 Ley 1581/2012):</p>
          <ul>
            <li><strong>4.1. Legalidad:</strong> el Tratamiento se realiza en estricto cumplimiento de la ley.</li>
            <li><strong>4.2. Finalidad:</strong> obedece a finalidades legítimas que se informan al Titular.</li>
            <li><strong>4.3. Libertad:</strong> sólo se ejerce con el consentimiento previo, expreso e informado del Titular.</li>
            <li><strong>4.4. Veracidad o calidad:</strong> la información debe ser veraz, completa, exacta, actualizada y comprensible.</li>
            <li><strong>4.5. Transparencia:</strong> se garantiza el derecho del Titular a obtener información sobre sus datos.</li>
            <li><strong>4.6. Acceso y circulación restringida:</strong> sólo se realiza por personas autorizadas por el Titular o la ley.</li>
            <li><strong>4.7. Seguridad:</strong> se aplican medidas técnicas, humanas y administrativas necesarias para proteger los datos.</li>
            <li><strong>4.8. Confidencialidad:</strong> todas las personas que intervienen guardan reserva sobre los datos.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap3',
      title: 'CAPÍTULO III — DATOS TRATADOS Y FINALIDADES',
      content: (
        <>
          <h3>5. Categorías de Datos Personales</h3>

          <h4>5.1. Usuarios de la Plataforma</h4>
          <p>Identificación (nombre, documento, fecha de nacimiento); Contacto (teléfono, correo); Cuenta (usuario, contraseña cifrada, foto de perfil); Datos de pago (medio de pago tokenizado — LANDA no almacena números completos de tarjeta); Geolocalización (ubicación en tiempo real durante el Servicio); Datos del Servicio (historial de viajes/pedidos, calificaciones); Datos del dispositivo (identificador, sistema operativo, IP).</p>

          <hr className="legal-divider" />

          <h4>5.2. Prestadores del Servicio</h4>
          <p>Documentos personales (cédula, licencia de conducción, RUT, hoja de vida); Documentos vehiculares (SOAT, tarjeta de propiedad, revisión técnico-mecánica); Antecedentes judiciales, disciplinarios y contravencionales (dato de especial protección con autorización expresa específica — Art. 6 Ley 1581/2012); Datos financieros para liquidación de honorarios.</p>

          <hr className="legal-divider" />

          <h4>5.3. Comercios Afiliados</h4>
          <p>Identificación (razón social, NIT, RUT); Representante legal del comercio (nombre, documento, contacto); Datos bancarios para liquidación.</p>

          <hr className="legal-divider" />

          <h3>6. Finalidades</h3>
          <ul>
            <li><strong>6.1. Prestación del Servicio:</strong> crear y autenticar cuentas; conectar Usuarios con Prestadores y Comercios; calcular tarifas y procesar pagos; mostrar ubicación en tiempo real; atender consultas, reclamos y reembolsos; liquidar honorarios.</li>
            <li><strong>6.2. Seguridad y prevención de fraude:</strong> verificar identidad; detectar y prevenir conductas ilícitas; cooperar con autoridades.</li>
            <li><strong>6.3. Mejora del Servicio y comunicaciones operativas:</strong> analizar uso; enviar comunicaciones operativas.</li>
            <li><strong>6.4. Marketing (autorización separada):</strong> comunicaciones comerciales o promocionales, revocables en cualquier momento.</li>
            <li><strong>6.5. Cumplimiento:</strong> obligaciones contables, tributarias y regulatorias; atender requerimientos judiciales o administrativos; conservar pruebas.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap4',
      title: 'CAPÍTULO IV — TRATAMIENTOS ESPECIALES',
      content: (
        <>
          <h3>7. Geolocalización</h3>
          <ul>
            <li><strong>7.1.</strong> La geolocalización en tiempo real se trata bajo autorización expresa, específica e informada.</li>
            <li><strong>7.2.</strong> La autorización se otorga al activar el permiso de ubicación del sistema operativo y aceptar el aviso de privacidad (privacy disclosure) de la Plataforma.</li>
            <li><strong>7.3.</strong> El Usuario puede revocar la autorización en cualquier momento desde la configuración del dispositivo o la sección “Privacidad” de la Plataforma. La revocación implica la imposibilidad de prestar el Servicio.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>8. Antecedentes (solo Prestadores)</h3>
          <ul>
            <li><strong>8.1.</strong> La verificación se realiza únicamente con autorización expresa específica del Prestador.</li>
            <li><strong>8.2.</strong> Los datos se conservan mientras el Prestador esté vinculado, más los plazos legales de conservación.</li>
            <li><strong>8.3.</strong> Acceso interno restringido al área de cumplimiento y al área legal.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>9. Datos de menores</h3>
          <ul>
            <li><strong>9.1.</strong> La Plataforma no está dirigida a menores de 18 años.</li>
            <li><strong>9.2.</strong> Si LANDA detecta el registro de un menor, procede a la suspensión y cierre de la Cuenta salvo autorización expresa del representante legal del menor (Art. 7 Ley 1581/2012, Sentencia C-748/2011).</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap5',
      title: 'CAPÍTULO V — ENCARGADOS, CESIONARIOS, TRANSMISIONES Y TRANSFERENCIAS',
      content: (
        <>
          <h3>10. Encargados del Tratamiento</h3>
          <p>LANDA contrata Encargados bajo contrato escrito que los obliga a: (a) tratar los datos solo conforme a las instrucciones de LANDA; (b) aplicar medidas de seguridad equivalentes o superiores; (c) garantizar confidencialidad; (d) suprimir o devolver los datos al final del contrato; (e) notificar incidentes de seguridad.</p>

          <hr className="legal-divider" />

          <h3>11. Cesionarios</h3>
          <p>LANDA comparte datos con: (a) Prestadores del Servicio (para ejecutar el Servicio); (b) Comercios Afiliados (para procesar pedidos); (c) Autoridades (por imperativo legal).</p>

          <hr className="legal-divider" />

          <h3>12. Transferencia y Transmisión Internacional</h3>
          <ul>
            <li><strong>12.1.</strong> Aplica el Art. 26 Ley 1581/2012 y el Art. 2.2.2.25.5.1 Decreto 1074/2015.</li>
            <li><strong>12.2.</strong> Solo se realiza a países que ofrezcan niveles adecuados de protección declarados por la SIC o, cuando no lo sean, mediante cláusulas contractuales tipo o garantías equivalentes.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap6',
      title: 'CAPÍTULO VI — DERECHOS DEL TITULAR Y PROCEDIMIENTOS',
      content: (
        <>
          <h3>13. Derechos del Titular (Art. 8 Ley 1581/2012)</h3>
          <ul>
            <li><strong>13.1.</strong> Conocer, actualizar y rectificar sus datos.</li>
            <li><strong>13.2.</strong> Solicitar prueba de la autorización otorgada.</li>
            <li><strong>13.3.</strong> Ser informado del uso dado a sus datos.</li>
            <li><strong>13.4.</strong> Presentar quejas ante la SIC, previa consulta o reclamo ante LANDA.</li>
            <li><strong>13.5.</strong> Revocar la autorización y/o solicitar la supresión.</li>
            <li><strong>13.6.</strong> Acceder gratuitamente a sus datos.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>14. Procedimiento de Consulta (Art. 14 Ley 1581/2012)</h3>
          <ul>
            <li><strong>14.1. Quién:</strong> el Titular, sus causahabientes o su representante legal.</li>
            <li><strong>14.2. Canales:</strong>
              <table className="legal-table" style={{ marginTop: '0.75rem' }}>
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
                    <td>Sección “Soporte” → “Solicitudes”</td>
                  </tr>
                </tbody>
              </table>
            </li>
            <li><strong>14.3. Información requerida:</strong> identificación del Titular o representante; descripción de la consulta; canal para recibir la respuesta; documentos soporte.</li>
            <li><strong>14.4. Plazo:</strong> diez (10) días hábiles desde el día siguiente a la recepción. Prorrogable por cinco (5) días hábiles, informando al Titular antes del vencimiento.</li>
            <li><strong>14.5. Forma:</strong> por el mismo canal usado por el Titular o el que éste indique.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>15. Procedimiento de Reclamo (Art. 15 Ley 1581/2012)</h3>
          <ul>
            <li><strong>15.1. Quién:</strong> el Titular o sus causahabientes que consideren que la información debe corregirse, actualizarse o suprimirse.</li>
            <li><strong>15.2. Canales:</strong> los del numeral 14.2.</li>
            <li><strong>15.3. Información requerida:</strong> identificación; descripción de los hechos; canal para recibir la respuesta; documentos soporte.</li>
            <li><strong>15.4. Subsanación:</strong> si el reclamo está incompleto, LANDA requerirá al interesado dentro de los cinco (5) días siguientes para subsanar. Vencidos dos (2) meses sin subsanar, se entiende desistido.</li>
            <li><strong>15.5. Plazo:</strong> quince (15) días hábiles desde el día siguiente a la recepción. Prorrogable por ocho (8) días hábiles.</li>
            <li><strong>15.6. Anotación “reclamo en trámite”:</strong> máximo dos (2) días hábiles desde la recepción del reclamo completo. Se mantiene hasta la decisión.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>16. Revocación</h3>
          <ul>
            <li><strong>16.1.</strong> El Titular puede revocar su autorización en cualquier momento, siempre que no contradiga obligación legal o contractual.</li>
            <li><strong>16.2. Canales:</strong> los del numeral 14.2 + revocación in-app para autorizaciones específicas.</li>
            <li><strong>16.3.</strong> La revocación puede ser total (finalidades accesorias) o parcial (finalidades esenciales; puede implicar imposibilidad de prestar el Servicio).</li>
          </ul>

          <hr className="legal-divider" />

          <h3>17. Supresión</h3>
          <ul>
            <li><strong>17.1.</strong> El Titular puede solicitar la supresión cuando: (a) los datos no se traten conforme a la ley; (b) hayan dejado de ser necesarios.</li>
            <li><strong>17.2.</strong> LANDA evaluará y, salvo causal de conservación, procederá en máximo quince (15) días hábiles desde la decisión positiva.</li>
            <li><strong>17.3. Causales que impiden la supresión:</strong> deber legal o contractual del Titular; obstaculización de actuaciones judiciales o administrativas en curso; obligación legal de conservación.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap7',
      title: 'CAPÍTULO VII — ÁREA RESPONSABLE Y RNBD',
      content: (
        <>
          <h3>18. Área responsable</h3>
          <ul>
            <li><strong>18.1.</strong> La atención de PQR relacionadas con habeas data está a cargo del <strong>Oficial de Protección de Datos</strong> de LANDA APP S.A.S.</li>
            <li><strong>18.2. Contacto:</strong> formulario de <a href="https://landaapp.co/contacto" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co/contacto</a> o sección “Ayuda” de la app móvil.</li>
            <li><strong>18.3. Horario de respuesta:</strong> lunes a viernes, 8:00 a.m. – 5:00 p.m.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>19. Registro Nacional de Bases de Datos (RNBD)</h3>
          <ul>
            <li><strong>19.1.</strong> LANDA verifica anualmente la obligación de inscripción en el RNBD conforme al Decreto 1074/2015, Cap. 26.</li>
            <li><strong>19.2.</strong> La no obligación de inscripción no exime del cumplimiento de las demás obligaciones de la Ley 1581/2012.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap8',
      title: 'CAPÍTULO VIII — SEGURIDAD DE LA INFORMACIÓN',
      content: (
        <>
          <h3>20. Medidas de seguridad</h3>
          <p><strong>Técnicas:</strong> cifrado en tránsito TLS 1.2 o superior; cifrado en reposo de datos sensibles; tokenización de medios de pago; control de accesos por roles; auditoría de accesos; segregación de ambientes; respaldo con verificación de integridad; detección de intrusiones.</p>
          <p><strong>Administrativas:</strong> política interna de seguridad; cláusula de confidencialidad en contratos; capacitación periódica; procedimiento documentado de gestión de incidentes.</p>
          <p><strong>Humanas:</strong> Oficial de Protección de Datos; acceso restringido al personal estrictamente necesario; evaluación del personal con acceso a datos sensibles.</p>

          <hr className="legal-divider" />

          <h3>21. Gestión de incidentes</h3>
          <p>Ante un incidente que comprometa Datos Personales, LANDA: (a) activa el protocolo dentro de las 24 horas siguientes; (b) evalúa alcance, datos comprometidos y Titulares afectados; (c) notifica a la SIC conforme a los criterios y plazos aplicables; (d) notifica a los Titulares afectados si el incidente pone en riesgo sus derechos; (e) adopta medidas correctivas y preventivas; (f) documenta el incidente para auditoría.</p>
        </>
      )
    },
    {
      id: 'cap9',
      title: 'CAPÍTULO IX — AUDITORÍA Y CUMPLIMIENTO',
      content: (
        <>
          <h3>22. Auditoría interna anual</h3>
          <p>Evalúa: implementación de medidas de seguridad; atención oportuna de consultas y reclamos; cumplimiento de plazos; contratos con Encargados; trazabilidad de autorizaciones. El resultado se reporta al Representante Legal.</p>

          <hr className="legal-divider" />

          <h3>23. Capacitación</h3>
          <p>El personal con acceso a Datos Personales recibe capacitación inicial obligatoria y refuerzos periódicos.</p>
        </>
      )
    },
    {
      id: 'cap10',
      title: 'CAPÍTULO X — VIGENCIA Y MODIFICACIONES',
      content: (
        <>
          <h3>24. Vigencia</h3>
          <ul>
            <li><strong>24.1.</strong> Esta Política rige a partir del 29 de julio de 2026.</li>
            <li><strong>24.2.</strong> Las Bases de Datos se mantienen mientras subsista la finalidad del Tratamiento o el deber legal de conservación.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>25. Modificaciones</h3>
          <ul>
            <li><strong>25.1.</strong> LANDA podrá modificar esta Política por cambios normativos, jurisprudenciales o de la operación.</li>
            <li><strong>25.2.</strong> Las modificaciones sustanciales se comunicarán al Titular por notificación in-app, correo electrónico y publicación en <a href="https://landaapp.co/politicas-tratamientos-datos" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co/politicas-tratamientos-datos</a>.</li>
            <li><strong>25.3.</strong> Las modificaciones que requieran nueva autorización se solicitarán antes de continuar el Tratamiento.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap11',
      title: 'CAPÍTULO XI — DISPOSICIONES FINALES',
      content: (
        <>
          <h3>26. Coherencia con otros documentos</h3>
          <p>Esta Política se interpreta en armonía con: Aviso de Privacidad, Términos y Condiciones de Uso, Política de Reembolsos y Cancelaciones, y contratos con Prestadores del Servicio. En caso de conflicto, prevalece la disposición más favorable al Titular (Ley 1581/2012).</p>

          <hr className="legal-divider" />

          <h3>27. Cláusulas no abusivas</h3>
          <p>LANDA no incluye cláusulas que limiten su responsabilidad por dolo o culpa grave, impongan formalidades que dificulten el ejercicio de derechos, o trasladen al Titular riesgos atribuibles a LANDA.</p>

          <hr className="legal-divider" />

          <h3>28. Autoridad competente</h3>
          <p>La <strong>Superintendencia de Industria y Comercio (SIC)</strong> — Delegatura para la Protección de Datos Personales — es la autoridad competente para conocer las quejas relacionadas con esta Política, previo agotamiento del trámite interno ante LANDA.</p>
        </>
      )
    }
  ];

  return (
    <section id="legal" className="privacy-page">
      <div className="page-hero">
        <div className="wrap">
          <span className="node-label">Legal</span>
          <h1>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES</h1>
          <p>LANDA APP S.A.S. · NIT 902.065.549-2 — Versión web 1.0 (29 de julio de 2026)</p>
        </div>
      </div>

      <section className="privacy-content section">
        <div className="container">
          <div className="document-reader-card">
            <div className="document-header">
              <span className="updated-badge">Última actualización · 29 de Julio 2026</span>
              <h2>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES — LANDA APP</h2>
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

export default Politicas;
