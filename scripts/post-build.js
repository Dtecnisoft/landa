import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

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

if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  routes.forEach((route) => {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexContent);
    console.log(`✓ Static HTML generated for route: /${route}`);
  });
} else {
  console.error('Error: dist/index.html does not exist.');
  process.exit(1);
}
