import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, '../dist');
const distIndexPath = path.join(distDir, 'index.html');
const rootIndexPath = path.join(rootDir, 'index.html');

const routes = [
  'contacto',
  'eliminacion-cuenta',
  'quienes-somos',
  'terminos-condiciones',
  'politicas-tratamientos-datos',
  'politicas-tratamiento-datos',
  'politica-de-privacidad',
  'politica-privacidad',
  'privacy-policy',
  'politicas-tratamiento-de-datos',
  'politicas-reembolsos',
  'aviso-legal',
  'restaurantes',
  'cobertura',
  'caracteristicas',
  'sobre',
  'testimonios',
  'master',
  'empleado'
];

const privacyRoutes = new Set([
  'politicas-tratamientos-datos',
  'politicas-tratamiento-datos',
  'politica-de-privacidad',
  'politica-privacidad',
  'privacy-policy',
  'politicas-tratamiento-de-datos'
]);

const privacyStaticHtml = `
<div id="root">
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; color: #1e293b; background: #ffffff;">
    <header style="border-bottom: 2px solid #f97316; padding-bottom: 1rem; margin-bottom: 2rem;">
      <h1 style="color: #0f172a; font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES</h1>
      <p style="color: #64748b; font-size: 0.95rem; font-weight: 600;">LANDA APP S.A.S. · NIT 902.065.549-2 — Versión web 1.0 (Vigente desde el 29 de julio de 2026)</p>
    </header>
    <main>
      <section style="margin-bottom: 1.5rem;">
        <h2 style="color: #f97316; font-size: 1.25rem;">1. Identificación del Responsable del Tratamiento</h2>
        <p><strong>Razón social:</strong> LANDA APP S.A.S.</p>
        <p><strong>NIT:</strong> 902.065.549-2</p>
        <p><strong>Sitio Web:</strong> <a href="https://landaapp.co" style="color: #f97316;">landaapp.co</a></p>
        <p><strong>Canal de Contacto:</strong> <a href="https://landaapp.co/contacto" style="color: #f97316;">landaapp.co/contacto</a> o administracion@landapp.co</p>
        <p><strong>Carácter:</strong> Responsable del Tratamiento conforme a la Ley 1581 de 2012 de Colombia.</p>
      </section>
      <section style="margin-bottom: 1.5rem;">
        <h2 style="color: #f97316; font-size: 1.25rem;">2. Marco Normativo y Principios Rectores</h2>
        <p>LANDA APP S.A.S. garantiza la protección de los datos personales cumpliendo con la Constitución Política de Colombia (Art. 15 y 20), Ley Estatutaria 1581 de 2012, Decreto 1074 de 2015 y demás normas vigentes sobre Habeas Data.</p>
        <p>El tratamiento de datos personales se rige por los principios de legalidad, finalidad, libertad, veracidad o calidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad.</p>
      </section>
      <section style="margin-bottom: 1.5rem;">
        <h2 style="color: #f97316; font-size: 1.25rem;">3. Datos Recopilados y Finalidades</h2>
        <p>Recopilamos datos de Usuarios, Prestadores del Servicio y Comercios Afiliados (identificación, contacto, geolocalización en tiempo real durante el servicio, datos transaccionales) con la finalidad de prestar el servicio de la plataforma, garantizar seguridad y prevención de fraude, atención al usuario y cumplimiento de obligaciones legales y contables.</p>
      </section>
      <section style="margin-bottom: 1.5rem;">
        <h2 style="color: #f97316; font-size: 1.25rem;">4. Derechos del Titular y Procedimiento de Habeas Data</h2>
        <p>Los titulares de los datos tienen derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos, así como a revocar la autorización otorgada.</p>
        <p>Para ejercer sus derechos de Habeas Data, consulte nuestro formulario en <a href="https://landaapp.co/contacto" style="color: #f97316;">landaapp.co/contacto</a> o envíe su solicitud formal a nuestro Oficial de Protección de Datos.</p>
      </section>
    </main>
    <footer style="margin-top: 3rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; text-align: center; color: #64748b; font-size: 0.875rem;">
      <p>© 2026 LANDA APP S.A.S. — Todos los derechos reservados. Cali, Valle del Cauca, Colombia.</p>
    </footer>
  </div>
</div>
`;

function buildCustomHtml(baseHtml, route) {
  let content = baseHtml;
  if (privacyRoutes.has(route)) {
    // Custom Title
    content = content.replace(
      /<title>.*?<\/title>/gi,
      '<title>Política de Tratamiento de Datos Personales | Landa App</title>'
    );
    // Custom Description
    content = content.replace(
      /<meta name="description" content=".*?" \/>/gi,
      '<meta name="description" content="Política de Tratamiento de Datos Personales de LANDA APP S.A.S. NIT 902.065.549-2." />'
    );
    // Inject pre-rendered static HTML inside <div id="root"></div>
    content = content.replace('<div id="root"></div>', privacyStaticHtml);
  }
  return content;
}

// 1. Process dist directory (for Vite build outputs & GitHub Actions Pages artifact)
if (fs.existsSync(distIndexPath)) {
  const indexContent = fs.readFileSync(distIndexPath, 'utf8');

  routes.forEach((route) => {
    const routeHtml = buildCustomHtml(indexContent, route);

    // Generate dist/<route>/index.html
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml);

    // Generate dist/<route>.html
    fs.writeFileSync(path.join(distDir, `${route}.html`), routeHtml);

    console.log(`✓ Generated dist/${route}/index.html and dist/${route}.html`);
  });
} else {
  console.error('Error: dist/index.html does not exist.');
  process.exit(1);
}

// 2. Process root directory (in case GitHub Pages deploys directly from branch root)
if (fs.existsSync(rootIndexPath)) {
  const rootIndexContent = fs.readFileSync(rootIndexPath, 'utf8');

  routes.forEach((route) => {
    const routeHtml = buildCustomHtml(rootIndexContent, route);

    fs.writeFileSync(path.join(rootDir, `${route}.html`), routeHtml);
    const rootRouteDir = path.join(rootDir, route);
    if (!fs.existsSync(rootRouteDir)) {
      fs.mkdirSync(rootRouteDir, { recursive: true });
    }
    fs.writeFileSync(path.join(rootRouteDir, 'index.html'), routeHtml);
    console.log(`✓ Generated root ${route}.html and ${route}/index.html`);
  });
}
