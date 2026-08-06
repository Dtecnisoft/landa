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

// 1. Process dist directory (for Vite build outputs & GitHub Actions Pages artifact)
if (fs.existsSync(distIndexPath)) {
  const indexContent = fs.readFileSync(distIndexPath, 'utf8');

  routes.forEach((route) => {
    // Generate dist/<route>/index.html
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexContent);

    // Generate dist/<route>.html
    fs.writeFileSync(path.join(distDir, `${route}.html`), indexContent);

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
    fs.writeFileSync(path.join(rootDir, `${route}.html`), rootIndexContent);
    const rootRouteDir = path.join(rootDir, route);
    if (!fs.existsSync(rootRouteDir)) {
      fs.mkdirSync(rootRouteDir, { recursive: true });
    }
    fs.writeFileSync(path.join(rootRouteDir, 'index.html'), rootIndexContent);
    console.log(`✓ Generated root ${route}.html and ${route}/index.html`);
  });
}
