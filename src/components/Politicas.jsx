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
          <p>El responsable del tratamiento de las bases de datos regidas por esta política es la siguiente persona jurídica:</p>

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
                <td><strong>Matrícula mercantil</strong></td>
                <td>0001286276 — Cámara de Comercio de Cali</td>
              </tr>
              <tr>
                <td><strong>Domicilio</strong></td>
                <td>Carrera 23 No. 75B-00, Cali, Valle del Cauca, Colombia</td>
              </tr>
              <tr>
                <td><strong>Representante legal</strong></td>
                <td>Leonardo Esaut Landazuri Torres, C.C. 1.004.615.087</td>
              </tr>
              <tr>
                <td><strong>Sitio web</strong></td>
                <td>landaapp.co</td>
              </tr>
              <tr>
                <td><strong>Correo de contacto</strong></td>
                <td>administracion@landapp.com.co</td>
              </tr>
              <tr>
                <td><strong>Carácter</strong></td>
                <td>Responsable del Tratamiento (Art. 3, lit. e), Ley 1581/2012)</td>
              </tr>
            </tbody>
          </table>

          <h3>2. Marco normativo</h3>
          <p>Esta Política se rige por la legislación colombiana vigente en materia de protección de datos personales:</p>
          <ul>
            <li><strong>Constitución Política de Colombia:</strong> Artículos 15 (habeas data) y 20.</li>
            <li><strong>Ley Estatutaria 1581 de 2012:</strong> Régimen general de protección de datos personales.</li>
            <li><strong>Decreto 1074 de 2015 (Capítulo 25):</strong> Régimen reglamentario (compilación del Decreto 1377/2013).</li>
            <li><strong>Decreto 1074 de 2015 (Capítulo 26):</strong> Registro Nacional de Bases de Datos (RNBD).</li>
            <li><strong>Sentencia C-748/2011 de la Corte Constitucional:</strong> Alcance del derecho fundamental al habeas data.</li>
            <li><strong>Circulares vigentes de la SIC:</strong> Instrucciones de la Superintendencia de Industria y Comercio sobre protección de datos personales.</li>
            <li><strong>Ley 527 de 1999:</strong> Comercio electrónico y validez de las autorizaciones electrónicas.</li>
          </ul>

          <h3>3. Definiciones</h3>
          <p>Para efectos de la presente política, se aplican las siguientes definiciones:</p>
          <ul>
            <li><strong>3.1. Autorización:</strong> consentimiento previo, expreso e informado del Titular para llevar a cabo el Tratamiento de Datos Personales (Art. 3, lit. a), Ley 1581/2012).</li>
            <li><strong>3.2. Base de Datos:</strong> conjunto organizado de Datos Personales que sea objeto de Tratamiento.</li>
            <li><strong>3.3. Dato Personal:</strong> cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables.</li>
            <li><strong>3.4. Dato Sensible:</strong> dato que afecta la intimidad del Titular o cuyo uso indebido puede generar discriminación (Art. 5 Ley 1581/2012). Incluye origen racial o étnico, orientación política, convicciones religiosas o filosóficas, pertenencia a sindicatos, datos de salud, datos biométricos, etc.</li>
            <li><strong>3.5. Encargado del Tratamiento:</strong> persona natural o jurídica que realice el Tratamiento de Datos Personales por cuenta de LANDA.</li>
            <li><strong>3.6. Habeas Data:</strong> derecho fundamental de toda persona a conocer, actualizar y rectificar las informaciones que se hayan recogido sobre ella en bases de datos.</li>
            <li><strong>3.7. LANDA:</strong> LANDA APP S.A.S.</li>
            <li><strong>3.8. Plataforma:</strong> la aplicación móvil "LANDA APP" para iOS y Android y los sitios web operados por LANDA.</li>
            <li><strong>3.9. Responsable del Tratamiento:</strong> LANDA APP S.A.S., que decide sobre la Base de Datos y el Tratamiento.</li>
            <li><strong>3.10. Titular:</strong> persona natural cuyos Datos Personales son objeto de Tratamiento (Usuario, Prestador del Servicio, contacto comercial, etc.).</li>
            <li><strong>3.11. Transferencia:</strong> envío de Datos Personales fuera del territorio de Colombia a un Responsable del Tratamiento.</li>
            <li><strong>3.12. Transmisión:</strong> comunicación de Datos Personales fuera o dentro del territorio de Colombia a un Encargado del Tratamiento.</li>
            <li><strong>3.13. Tratamiento:</strong> cualquier operación o conjunto de operaciones sobre los Datos Personales (recolección, almacenamiento, uso, circulación, supresión).</li>
            <li><strong>3.14. Usuario:</strong> persona natural o jurídica que se registra en la Plataforma.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap2',
      title: 'CAPÍTULO II — PRINCIPIOS RECTORES',
      content: (
        <>
          <p>LANDA aplicará los siguientes principios al Tratamiento de los Datos Personales, conforme al Art. 4 Ley 1581/2012:</p>
          <ul>
            <li><strong>4.1. Legalidad:</strong> el Tratamiento sólo se realiza bajo el marco legal aplicable.</li>
            <li><strong>4.2. Finalidad:</strong> el Tratamiento obedece a finalidades legítimas, informadas previamente al Titular.</li>
            <li><strong>4.3. Libertad:</strong> el Tratamiento sólo se realiza con autorización previa, expresa e informada del Titular, salvo mandato legal o judicial.</li>
            <li><strong>4.4. Veracidad o calidad:</strong> los datos son veraces, completos, exactos, actualizados, comprobables y comprensibles.</li>
            <li><strong>4.5. Transparencia:</strong> se garantiza al Titular el derecho a obtener información sobre los datos que le conciernen.</li>
            <li><strong>4.6. Acceso y circulación restringida:</strong> los datos sólo pueden tratarse por las personas autorizadas o por las personas previstas en la ley.</li>
            <li><strong>4.7. Seguridad:</strong> LANDA implementa medidas técnicas, humanas y administrativas para garantizar la seguridad de los datos.</li>
            <li><strong>4.8. Confidencialidad:</strong> las personas que tratan los datos están obligadas a guardar reserva, aún después de finalizada su relación con LANDA.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap3',
      title: 'CAPÍTULO III — DATOS PERSONALES TRATADOS Y FINALIDADES',
      content: (
        <>
          <h3>5. Categorías de Datos Personales</h3>
          <p>LANDA trata las siguientes categorías de Datos Personales según la naturaleza del Titular:</p>

          <h4>5.1. Usuarios de la Plataforma</h4>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Ejemplos</th>
                <th>Sensibilidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Identificación</strong></td>
                <td>Nombre, documento de identidad, fecha de nacimiento</td>
                <td>Ordinario</td>
              </tr>
              <tr>
                <td><strong>Contacto</strong></td>
                <td>Teléfono, correo electrónico</td>
                <td>Ordinario</td>
              </tr>
              <tr>
                <td><strong>Cuenta</strong></td>
                <td>Nombre de usuario, contraseña cifrada, fotografía de perfil</td>
                <td>Ordinario</td>
              </tr>
              <tr>
                <td><strong>Datos de pago</strong></td>
                <td>Identificación del medio de pago, datos tokenizados (NO se almacenan números completos de tarjeta)</td>
                <td>Con especial cuidado por contenido financiero</td>
              </tr>
              <tr>
                <td><strong>Geolocalización</strong></td>
                <td>Ubicación en tiempo real durante el Servicio; ubicación aproximada para mostrar Prestadores cercanos</td>
                <td>Autorización reforzada</td>
              </tr>
              <tr>
                <td><strong>Datos del Servicio</strong></td>
                <td>Historial de viajes/pedidos, montos, calificaciones, comentarios</td>
                <td>Ordinario</td>
              </tr>
              <tr>
                <td><strong>Datos del dispositivo</strong></td>
                <td>Identificador del dispositivo, sistema operativo, versión de la app, IP</td>
                <td>Ordinario</td>
              </tr>
            </tbody>
          </table>

          <hr className="legal-divider" />

          <h4>5.2. Prestadores del Servicio (conductores y repartidores)</h4>
          <p>Adicionalmente a los datos de la sección anterior:</p>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Ejemplos</th>
                <th>Sensibilidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Documentos personales</strong></td>
                <td>Cédula, licencia de conducción, RUT, hoja de vida</td>
                <td>Ordinario</td>
              </tr>
              <tr>
                <td><strong>Documentos vehiculares</strong></td>
                <td>SOAT, tarjeta de propiedad, revisión técnico-mecánica</td>
                <td>Ordinario</td>
              </tr>
              <tr>
                <td><strong>Antecedentes</strong></td>
                <td>Antecedentes judiciales, disciplinarios, contravencionales</td>
                <td>Dato de especial protección — requiere autorización expresa específica (Art. 6 Ley 1581/2012)</td>
              </tr>
              <tr>
                <td><strong>Datos financieros para pago</strong></td>
                <td>Cuenta bancaria para liquidación de honorarios</td>
                <td>Con especial cuidado</td>
              </tr>
            </tbody>
          </table>

          <hr className="legal-divider" />

          <h4>5.3. Comercios Afiliados</h4>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Ejemplos</th>
                <th>Sensibilidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Identificación del comercio</strong></td>
                <td>Razón social, NIT, RUT</td>
                <td>Ordinario / datos públicos</td>
              </tr>
              <tr>
                <td><strong>Representante legal</strong></td>
                <td>Nombre, documento, contacto</td>
                <td>Ordinario</td>
              </tr>
              <tr>
                <td><strong>Datos bancarios para liquidación</strong></td>
                <td>Cuenta bancaria</td>
                <td>Con especial cuidado</td>
              </tr>
            </tbody>
          </table>

          <hr className="legal-divider" />

          <h3>6. Finalidades del Tratamiento</h3>
          <p>LANDA tratará los Datos Personales únicamente para las siguientes finalidades:</p>

          <h4>6.1. Finalidades asociadas a la prestación del Servicio</h4>
          <ul>
            <li><strong>a)</strong> Crear, administrar y autenticar Cuentas de Usuarios y Prestadores.</li>
            <li><strong>b)</strong> Conectar Usuarios con Prestadores y Comercios Afiliados.</li>
            <li><strong>c)</strong> Calcular tarifas y procesar pagos.</li>
            <li><strong>d)</strong> Mostrar al Usuario la ubicación en tiempo real del Prestador.</li>
            <li><strong>e)</strong> Atender consultas, reclamos, cancelaciones y reembolsos (ver Política de Reembolsos y Cancelaciones).</li>
            <li><strong>f)</strong> Liquidar honorarios a Prestadores y pagos a Comercios Afiliados.</li>
          </ul>

          <h4>6.2. Finalidades de seguridad y prevención de fraude</h4>
          <ul>
            <li><strong>g)</strong> Verificar la identidad del Usuario, Prestador y Comercio.</li>
            <li><strong>h)</strong> Detectar y prevenir conductas fraudulentas, abusivas o ilícitas.</li>
            <li><strong>i)</strong> Cooperar con autoridades en investigaciones formalmente requeridas.</li>
          </ul>

          <h4>6.3. Finalidades de mejora del Servicio y comunicaciones operativas</h4>
          <ul>
            <li><strong>j)</strong> Analizar el uso del Servicio para mejorar funcionalidades.</li>
            <li><strong>k)</strong> Enviar comunicaciones operativas (estado del Servicio, cambios en términos, alertas de seguridad).</li>
          </ul>

          <h4>6.4. Finalidades de marketing (autorización separada)</h4>
          <ul>
            <li><strong>l)</strong> Enviar comunicaciones comerciales o promocionales. Requieren autorización separada y específica, revocable en cualquier momento.</li>
          </ul>

          <h4>6.5. Finalidades de cumplimiento</h4>
          <ul>
            <li><strong>m)</strong> Cumplir obligaciones contables, tributarias, financieras y de control.</li>
            <li><strong>n)</strong> Atender requerimientos judiciales, administrativos o regulatorios.</li>
            <li><strong>o)</strong> Conservar pruebas para la defensa de derechos en sede judicial o administrativa.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap4',
      title: 'CAPÍTULO IV — TRATAMIENTOS ESPECIALES',
      content: (
        <>
          <h3>7. Tratamiento de geolocalización</h3>
          <ul>
            <li><strong>7.1.</strong> La geolocalización en tiempo real del Usuario y del Prestador se trata bajo autorización expresa, específica e informada previa.</li>
            <li><strong>7.2.</strong> La autorización se otorga al activar el permiso de ubicación del sistema operativo y al aceptar el flujo de privacy disclosure de la Plataforma.</li>
            <li><strong>7.3.</strong> El Usuario puede revocar la autorización en cualquier momento desde la configuración del sistema operativo o desde la sección "Privacidad" de la Plataforma. La revocación implica la imposibilidad de prestar el Servicio.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>8. Tratamiento de datos de antecedentes (solo Prestadores)</h3>
          <ul>
            <li><strong>8.1.</strong> La verificación de antecedentes de Prestadores se realiza únicamente con autorización expresa específica del Prestador.</li>
            <li><strong>8.2.</strong> Los datos se conservan mientras el Prestador esté vinculado a la Plataforma más los plazos legales de conservación aplicables.</li>
            <li><strong>8.3.</strong> Acceso interno restringido al área de cumplimiento y al área legal de LANDA.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>9. Tratamiento de datos de menores</h3>
          <ul>
            <li><strong>9.1.</strong> La Plataforma no está dirigida a menores de 18 años. LANDA no recolecta intencionalmente Datos Personales de menores.</li>
            <li><strong>9.2.</strong> Si LANDA detecta el registro de un menor, procederá a la suspensión y cierre de la Cuenta, salvo autorización expresa del representante legal del menor en los términos del Art. 7 Ley 1581/2012 y de la Sentencia C-748/2011.</li>
            <li><strong>9.3. [DECISIÓN TITULAR]</strong> Confirmar mecanismo técnico de verificación de mayoría de edad al registro.</li>
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
          <p>LANDA contrata Encargados del Tratamiento bajo contrato escrito que los obliga a:</p>
          <ul>
            <li><strong>a)</strong> Tratar los Datos Personales únicamente conforme a las instrucciones de LANDA.</li>
            <li><strong>b)</strong> Aplicar medidas de seguridad equivalentes o superiores a las de LANDA.</li>
            <li><strong>c)</strong> Garantizar la confidencialidad de las personas que tienen acceso.</li>
            <li><strong>d)</strong> Suprimir o devolver los datos al final del contrato.</li>
            <li><strong>e)</strong> Notificar incidentes de seguridad al Responsable.</li>
          </ul>

          <p><em>Lista de Encargados (a diligenciar — sección 9.1 del Aviso de Privacidad v2.0):</em></p>


          <hr className="legal-divider" />

          <h3>11. Cesionarios</h3>
          <p>LANDA comparte datos con los siguientes Cesionarios bajo finalidad acotada:</p>
          <ul>
            <li><strong>a)</strong> Prestadores del Servicio — para ejecutar el Servicio contratado.</li>
            <li><strong>b)</strong> Comercios Afiliados — para procesar pedidos de Domicilio.</li>
            <li><strong>c)</strong> Autoridades — por imperativo legal.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>12. Transmisión y Transferencia Internacional</h3>
          <ul>
            <li><strong>12.1.</strong> Cuando los Encargados procesen Datos Personales fuera de Colombia, aplica el Art. 26 Ley 1581/2012 y el Art. 2.2.2.25.5.1 Decreto 1074/2015.</li>
            <li><strong>12.2.</strong> La Transferencia o Transmisión sólo se realiza a países que:
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Ofrezcan niveles adecuados de protección declarados por la SIC, o</li>
                <li><strong>b)</strong> Cuando no lo sean, mediante cláusulas contractuales tipo o garantías que aseguren estándares equivalentes a la legislación colombiana.</li>
              </ul>
            </li>
            <li><strong>12.3.</strong> Listado de países a los que se transfieren/transmiten datos: Colombia.</li>
          </ul>
        </>
      )
    },
    {
      id: 'cap6',
      title: 'CAPÍTULO VI — DERECHOS DEL TITULAR Y PROCEDIMIENTOS',
      content: (
        <>
          <h3>13. Derechos del Titular</h3>
          <p>Conforme al Art. 8 Ley 1581/2012, el Titular tiene derecho a:</p>
          <ul>
            <li><strong>13.1.</strong> Conocer, actualizar y rectificar sus Datos Personales.</li>
            <li><strong>13.2.</strong> Solicitar prueba de la autorización otorgada.</li>
            <li><strong>13.3.</strong> Ser informado del uso dado a sus Datos Personales.</li>
            <li><strong>13.4.</strong> Presentar quejas ante la SIC, previa consulta o reclamo ante LANDA.</li>
            <li><strong>13.5.</strong> Revocar la autorización y/o solicitar la supresión del dato.</li>
            <li><strong>13.6.</strong> Acceder gratuitamente a sus Datos Personales objeto de Tratamiento.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>14. Procedimiento de Consulta (Art. 14 Ley 1581/2012)</h3>
          <ul>
            <li><strong>14.1. Quién puede presentar consulta:</strong> el Titular, sus causahabientes o su representante legal.</li>
            <li><strong>14.2. Canales habilitados:</strong>
              <table className="legal-table" style={{ marginTop: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Correo electrónico</strong></td>
                    <td>administracion@landapp.com.co</td>
                  </tr>
                  <tr>
                    <td><strong>Formulario in-app</strong></td>
                    <td>Sección &quot;Soporte&quot; → &quot;Solicitudes&quot;</td>
                  </tr>
                  <tr>
                    <td><strong>Página web</strong></td>
                    <td>landaapp.co/contacto</td>
                  </tr>
                  <tr>
                    <td><strong>Comunicación física</strong></td>
                    <td>Carrera 23 No. 75B-00, Cali</td>
                  </tr>
                </tbody>
              </table>
            </li>
            <li><strong>14.3. Información requerida en la solicitud:</strong>
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Identificación del Titular o de su representante.</li>
                <li><strong>b)</strong> Descripción clara de la consulta.</li>
                <li><strong>c)</strong> Domicilio o canal para recibir la respuesta.</li>
                <li><strong>d)</strong> Documentos que soporten la solicitud.</li>
              </ul>
            </li>
            <li><strong>14.4. Plazo de respuesta:</strong> diez (10) días hábiles contados desde el día siguiente a la fecha de recibo. Prorrogable por cinco (5) días hábiles adicionales, informando al Titular antes del vencimiento del primer plazo y exponiendo los motivos de la prórroga.</li>
            <li><strong>14.5. Forma de respuesta:</strong> por el mismo canal usado por el Titular o por el canal que éste indique en su solicitud.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>15. Procedimiento de Reclamo (Art. 15 Ley 1581/2012)</h3>
          <ul>
            <li><strong>15.1. Quién puede presentar reclamo:</strong> el Titular o sus causahabientes que consideren que la información debe ser corregida, actualizada o suprimida, o cuando adviertan presunto incumplimiento.</li>
            <li><strong>15.2. Canales:</strong> los mismos del numeral 14.2.</li>
            <li><strong>15.3. Información requerida:</strong>
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Identificación del Titular.</li>
                <li><strong>b)</strong> Descripción de los hechos que dan lugar al reclamo.</li>
                <li><strong>c)</strong> Dirección.</li>
                <li><strong>d)</strong> Documentos que se quieran hacer valer.</li>
              </ul>
            </li>
            <li><strong>15.4. Subsanación:</strong> si el reclamo está incompleto, LANDA requerirá al interesado dentro de los cinco (5) días siguientes a la recepción para que subsane. Vencidos dos (2) meses sin subsanar, se entenderá desistido el reclamo.</li>
            <li><strong>15.5. Plazo de respuesta:</strong> quince (15) días hábiles contados desde el día siguiente a la recepción del reclamo. Prorrogable por ocho (8) días hábiles más, informando al Titular antes del vencimiento del primer plazo y exponiendo los motivos.</li>
            <li><strong>15.6. Anotación de &quot;reclamo en trámite&quot;:</strong> una vez recibido el reclamo completo, LANDA incluirá en la Base de Datos la leyenda &quot;reclamo en trámite&quot; junto al dato objeto del reclamo, en un plazo máximo de dos (2) días hábiles. Esta leyenda se mantiene hasta que el reclamo sea decidido.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>16. Procedimiento de revocación de la autorización</h3>
          <ul>
            <li><strong>16.1.</strong> El Titular puede revocar su autorización en cualquier momento, siempre que la revocación no contradiga obligación legal o contractual vigente.</li>
            <li><strong>16.2. Canales:</strong> los mismos del numeral 14.2 + revocación in-app desde la sección &quot;Privacidad&quot; para autorizaciones específicas (notificaciones comerciales, geolocalización, etc.).</li>
            <li><strong>16.3. La revocación puede ser total o parcial:</strong>
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a) Total:</strong> cuando se trata de finalidades accesorias (marketing). LANDA cesa el Tratamiento para esas finalidades.</li>
                <li><strong>b) Parcial:</strong> cuando se trata de finalidades esenciales para el Servicio (geolocalización para transporte). En este caso, la revocación puede implicar la imposibilidad de prestar el Servicio.</li>
              </ul>
            </li>
          </ul>

          <hr className="legal-divider" />

          <h3>17. Procedimiento de supresión</h3>
          <ul>
            <li><strong>17.1.</strong> El Titular puede solicitar la supresión de sus Datos Personales cuando:
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Considere que no están siendo tratados conforme a la ley.</li>
                <li><strong>b)</strong> Hayan dejado de ser necesarios o pertinentes para la finalidad.</li>
              </ul>
            </li>
            <li><strong>17.2.</strong> LANDA evaluará la solicitud y, salvo causal de conservación legal o contractual, procederá a la supresión en un plazo máximo de quince (15) días hábiles desde la decisión positiva.</li>
            <li><strong>17.3. Causales que impiden la supresión:</strong>
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> El Titular tiene un deber legal o contractual de permanecer en la Base de Datos.</li>
                <li><strong>b)</strong> La eliminación obstaculiza actuaciones judiciales o administrativas en curso.</li>
                <li><strong>c)</strong> Los datos son necesarios para cumplir obligaciones legales que requieren su conservación.</li>
              </ul>
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'cap7',
      title: 'CAPÍTULO VII — ÁREA RESPONSABLE Y RNBD',
      content: (
        <>
          <h3>18. Área responsable de la atención de PQR</h3>
          <ul>
            <li><strong>18.1.</strong> La atención de consultas, reclamos y demás solicitudes relacionadas con el habeas data está a cargo del <strong>Oficial de Protección de Datos</strong> de LANDA APP S.A.S.</li>
          </ul>

          <h4>18.2. Datos de contacto del área:</h4>
          <table className="legal-table">
            <thead>
              <tr>
                <th>Campo</th>
                <th>Dato</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Correo</strong></td>
                <td>administracion@landapp.com.co</td>
              </tr>
              <tr>
                <td><strong>Domicilio</strong></td>
                <td>Carrera 23 No. 75B-00, Cali</td>
              </tr>
              <tr>
                <td><strong>Horario de atención</strong></td>
                <td>Lunes a Viernes 8 a.m. a 5 p.m.</td>
              </tr>
            </tbody>
          </table>

          <hr className="legal-divider" />

          <h3>19. Registro Nacional de Bases de Datos (RNBD)</h3>
          <ul>
            <li><strong>19.1.</strong> Conforme al Decreto 1074/2015, Capítulo 26, LANDA verificó el 15/06/2026 que no está obligada actualmente a inscribir sus Bases de Datos en el RNBD, porque sus activos totales no superan el umbral fijado por la regulación vigente.</li>
            <li><strong>19.2.</strong> LANDA verificará anualmente la procedencia de la inscripción y procederá conforme corresponda.</li>
            <li><strong>19.3.</strong> La no obligación de inscripción en el RNBD no exime del cumplimiento de las demás obligaciones de la Ley 1581/2012.</li>
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
          <p>LANDA implementa las siguientes medidas para garantizar la seguridad de los Datos Personales:</p>

          <h4>20.1. Medidas técnicas</h4>
          <ul>
            <li><strong>a)</strong> Cifrado en tránsito mediante HTTPS/TLS 1.2 o superior.</li>
            <li><strong>b)</strong> Cifrado en reposo para datos sensibles y credenciales.</li>
            <li><strong>c)</strong> Tokenización de medios de pago a través del procesador autorizado.</li>
            <li><strong>d)</strong> Control de accesos por roles y privilegios mínimos.</li>
            <li><strong>e)</strong> Registro de auditoría de accesos y operaciones críticas.</li>
            <li><strong>f)</strong> Segregación de ambientes (desarrollo, pruebas, producción).</li>
            <li><strong>g)</strong> Respaldo periódico con verificación de integridad.</li>
            <li><strong>h)</strong> Mecanismos de detección de intrusiones NIDS / IPS.</li>
          </ul>

          <h4>20.2. Medidas administrativas</h4>
          <ul>
            <li><strong>a)</strong> Política interna de seguridad de la información.</li>
            <li><strong>b)</strong> Cláusula de confidencialidad en contratos laborales y de prestación de servicios.</li>
            <li><strong>c)</strong> Capacitación periódica al personal en protección de datos.</li>
            <li><strong>d)</strong> Procedimiento documentado de gestión de incidentes.</li>
          </ul>

          <h4>20.3. Medidas humanas</h4>
          <ul>
            <li><strong>a)</strong> Designación de un Oficial de Protección de Datos.</li>
            <li><strong>b)</strong> Acceso a los datos restringido al personal estrictamente necesario.</li>
            <li><strong>c)</strong> Evaluación de competencias y conducta del personal con acceso a datos sensibles.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>21. Gestión de incidentes de seguridad</h3>
          <ul>
            <li><strong>21.1.</strong> Ante un incidente que comprometa Datos Personales, LANDA:
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Activa el protocolo interno de respuesta dentro de las 24 horas siguientes a la detección.</li>
                <li><strong>b)</strong> Evalúa el alcance del incidente, los datos comprometidos y los Titulares afectados.</li>
                <li><strong>c)</strong> Notifica a la SIC el incidente, conforme a los criterios y plazos que la entidad establezca.</li>
                <li><strong>d)</strong> Notifica a los Titulares afectados cuando el incidente pueda generar riesgo para sus derechos.</li>
                <li><strong>e)</strong> Adopta medidas correctivas y preventivas.</li>
                <li><strong>f)</strong> Documenta el incidente en bitácora interna para auditoría.</li>
              </ul>
            </li>
          </ul>

        </>
      )
    },
    {
      id: 'cap9',
      title: 'CAPÍTULO IX — AUDITORÍA Y CUMPLIMIENTO',
      content: (
        <>
          <h3>22. Auditoría interna</h3>
          <ul>
            <li><strong>22.1.</strong> LANDA realizará al menos una auditoría interna anual del cumplimiento de esta Política.</li>
            <li><strong>22.2. La auditoría evaluará:</strong>
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Implementación efectiva de las medidas de seguridad.</li>
                <li><strong>b)</strong> Atención oportuna de consultas y reclamos.</li>
                <li><strong>c)</strong> Cumplimiento de los plazos legales.</li>
                <li><strong>d)</strong> Contratos con Encargados.</li>
                <li><strong>e)</strong> Registro y trazabilidad de autorizaciones.</li>
              </ul>
            </li>
            <li><strong>22.3.</strong> El resultado de la auditoría se reporta al representante legal.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>23. Capacitación al personal</h3>
          <ul>
            <li><strong>23.1. El personal con acceso a Datos Personales recibirá capacitación inicial obligatoria y refuerzos periódicos sobre:</strong>
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Marco normativo de protección de datos.</li>
                <li><strong>b)</strong> Procedimientos internos de LANDA.</li>
                <li><strong>c)</strong> Manejo de incidentes.</li>
                <li><strong>d)</strong> Régimen sancionatorio interno y legal.</li>
              </ul>
            </li>
          </ul>

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
            <li><strong>24.1.</strong> Esta Política rige a partir del 8 de julio de 2026.</li>
            <li><strong>24.2.</strong> Las Bases de Datos se mantienen vigentes mientras subsista la finalidad del Tratamiento o mientras exista deber legal de conservación.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>25. Modificaciones</h3>
          <ul>
            <li><strong>25.1. LANDA podrá modificar esta Política cuando lo requieran:</strong>
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Cambios en la legislación o jurisprudencia aplicable.</li>
                <li><strong>b)</strong> Cambios en la operación o en los Servicios.</li>
                <li><strong>c)</strong> Recomendaciones de la SIC o de la auditoría interna.</li>
              </ul>
            </li>
            <li><strong>25.2. Las modificaciones sustanciales que afecten finalidades, Encargados, derechos del Titular o procedimientos serán comunicadas oportunamente al Titular por:</strong>
              <ul style={{ marginTop: '0.5rem', listStyleType: 'circle' }}>
                <li><strong>a)</strong> Notificación in-app.</li>
                <li><strong>b)</strong> Correo electrónico al correo registrado.</li>
                <li><strong>c)</strong> Publicación en <a href="https://landaapp.co/politica-tratamiento-datos" target="_blank" rel="noopener noreferrer">landaapp.co/politica-tratamiento-datos</a></li>
              </ul>
            </li>
            <li><strong>25.3.</strong> Las modificaciones que requieran nueva autorización del Titular se solicitarán antes de continuar con el Tratamiento.</li>
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
          <p>Esta Política se interpreta en armonía con:</p>
          <ul>
            <li><strong>a)</strong> Aviso de Privacidad v2.0 (instrumento sintético).</li>
            <li><strong>b)</strong> Términos y Condiciones de Uso v2.0.</li>
            <li><strong>c)</strong> Política de Reembolsos y Cancelaciones v1.1.</li>
            <li><strong>d)</strong> Contratos con Prestadores del Servicio.</li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>En caso de conflicto entre documentos, prevalece la disposición más favorable al Titular conforme a la Ley 1581/2012.</p>

          <hr className="legal-divider" />

          <h3>27. Cláusulas no abusivas</h3>
          <p>LANDA, en concordancia con el Art. 42 Ley 1480/2011 y el Art. 4 Ley 1581/2012, no incluye en esta Política cláusulas que:</p>
          <ul>
            <li><strong>a)</strong> Limiten la responsabilidad de LANDA por dolo o culpa grave.</li>
            <li><strong>b)</strong> Impongan al Titular formalidades que dificulten el ejercicio de sus derechos.</li>
            <li><strong>c)</strong> Trasladen al Titular riesgos derivados del Tratamiento atribuibles a LANDA.</li>
          </ul>

          <hr className="legal-divider" />

          <h3>28. Autoridad competente</h3>
          <p>La <strong>Superintendencia de Industria y Comercio (SIC)</strong> — Delegatura para la Protección de Datos Personales — es la autoridad competente para conocer de las quejas relacionadas con esta Política, previo agotamiento del trámite interno ante LANDA conforme al numeral 13.4 y a los Caps. VI de esta Política.</p>

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
          <p>En Landa App, la transparencia y la privacidad son fundamentales. Conoce cómo protegemos y administramos la información personal de nuestra comunidad de usuarios, comercios y conductores.</p>
        </div>
      </div>

      <section className="privacy-content section">
        <div className="container">
          <div className="document-reader-card">
            <div className="document-header">
              <span className="updated-badge">Última actualización · 8 de Julio 2026</span>
              <h2>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES — LANDA APP</h2>
            </div>
            <div className="document-body legal">
              <Accordion chapters={chapters} />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default Politicas;
