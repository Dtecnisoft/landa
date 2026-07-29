import { Link } from 'react-router-dom';

function AvisoLegal() {
  return (
    <section id="aviso-legal" className="privacy-page">
      <div className="page-hero">
        <div className="wrap">
          <span className="node-label">Legal</span>
          <h1>AVISO LEGAL</h1>
          <p>LANDA APP S.A.S. · NIT 902.065.549-2 — Versión web 1.0 (29 de julio de 2026)</p>
        </div>
      </div>

      <section className="privacy-content section">
        <div className="container">
          <div className="document-reader-card">
            <div className="document-header">
              <span className="updated-badge">Última actualización · 29 de Julio 2026</span>
              <h2>AVISO LEGAL — LANDA APP</h2>
            </div>
            <div className="document-body legal">
              <h3>1. Información General del Propietario</h3>
              <p>En cumplimiento de las disposiciones de comercio electrónico y derecho del consumidor en Colombia, se informa a los usuarios y público en general la identificación de la entidad titular de la plataforma:</p>

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
                    <td><strong>Sitio web principal</strong></td>
                    <td><a href="https://landaapp.co" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co</a></td>
                  </tr>
                  <tr>
                    <td><strong>Canal de contacto</strong></td>
                    <td>Formulario disponible en <a href="https://landaapp.co/contacto" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co/contacto</a></td>
                  </tr>
                </tbody>
              </table>

              <hr className="legal-divider" />

              <h3>2. Objeto y Aceptación</h3>
              <p><strong>2.1.</strong> El presente Aviso Legal regula las condiciones de uso y acceso al sitio web <a href="https://landaapp.co" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>landaapp.co</a> y a la aplicación móvil “LANDA APP” (en adelante, la “Plataforma”).</p>
              <p><strong>2.2.</strong> La navegación y el uso de la Plataforma le atribuyen la condición de usuario e implican la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal, así como de los <Link to="/terminos-condiciones" style={{ color: '#f97316' }}>Términos y Condiciones de Uso</Link>, la <Link to="/politicas-tratamientos-datos" style={{ color: '#f97316' }}>Política de Tratamiento de Datos Personales</Link> y la Política de Reembolsos y Cancelaciones.</p>

              <hr className="legal-divider" />

              <h3>3. Propiedad Intelectual e Industrial</h3>
              <p><strong>3.1.</strong> Todos los contenidos de la Plataforma (textos, fotografías, gráficos, imágenes, iconos, tecnología, software, links y demás contenidos audiovisuales o sonoros, así como su diseño gráfico y códigos fuente) son propiedad intelectual de <strong>LANDA APP S.A.S.</strong> o de terceros licenciatarios, sin que puedan entenderse cedidos al usuario ninguno de los derechos de explotación sobre los mismos.</p>
              <p><strong>3.2.</strong> Las marcas, nombres comerciales o signos distintivos que aparecen en la Plataforma son titularidad de LANDA APP S.A.S. o de terceros. El acceso a la Plataforma no atribuye derecho alguno sobre los mismos.</p>
              <p><strong>3.3.</strong> Queda prohibida la reproducción, copia, distribución, puesta a disposición, comunicación pública, transformación o modificación de los contenidos, salvo autorización expresa de su titular legal.</p>

              <hr className="legal-divider" />

              <h3>4. Condiciones de Uso de la Plataforma</h3>
              <p>El usuario se compromete a hacer un uso correcto y lícito de la Plataforma de conformidad con las leyes, la moral, las buenas costumbres y el orden público. Específicamente, el usuario se obliga a:</p>
              <ul>
                <li><strong>a)</strong> No introducir programas, virus, macros, applets, controles ActiveX o cualquier dispositivo lógico o secuencia de caracteres que causen o sean susceptibles de causar alteraciones en los sistemas informáticos de la Plataforma.</li>
                <li><strong>b)</strong> No utilizar la Plataforma con fines lesivos de bienes o intereses de LANDA APP S.A.S. o de terceros, ni sobrecargar, dañar o inutilizar las redes, servidores y equipos informáticos.</li>
                <li><strong>c)</strong> No realizar copias de seguridad de la base de datos de la Plataforma ni intentar técnicas de ingeniería inversa sobre el software.</li>
              </ul>

              <hr className="legal-divider" />

              <h3>5. Exclusión de Responsabilidad</h3>
              <p><strong>5.1.</strong> LANDA APP S.A.S. no garantiza la disponibilidad ininterrumpida de la Plataforma ni la ausencia de virus u otros elementos nocivos que puedan producir alteraciones en el sistema informático del usuario. En consecuencia, no se hace responsable por daños causados por fallas del sistema informático, ataques cibernéticos o virus informáticos de origen externo.</p>
              <p><strong>5.2.</strong> LANDA APP S.A.S. actúa como plataforma tecnológica de intermediación y no asume responsabilidad directa por la calidad o ejecución material de los servicios de transporte prestados por conductores independientes, ni de los productos vendidos por los comercios afiliados. Ello sin perjuicio del deber de canalizar los reclamos del usuario (Art. 53 Ley 1480/2011).</p>

              <hr className="legal-divider" />

              <h3>6. Enlaces (Links)</h3>
              <p><strong>6.1.</strong> La Plataforma puede incluir enlaces a sitios web de terceros con fines meramente informativos. LANDA APP S.A.S. no ejerce control alguno sobre dichos sitios y declina toda responsabilidad por los contenidos, políticas de privacidad o prácticas de los mismos.</p>

              <hr className="legal-divider" />

              <h3>7. Ley Aplicable y Jurisdicción</h3>
              <p>Cualquier controversia derivada del acceso o uso de la Plataforma se someterá a la legislación de la República de Colombia y a los jueces y tribunales competentes, con sujeción al fuero del consumidor (Art. 58 Ley 1480/2011) cuando el usuario tenga esa calidad.</p>

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

export default AvisoLegal;
