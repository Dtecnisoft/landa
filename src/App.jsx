import { HashRouter, Routes, Route } from 'react-router-dom';
import Encabezado from './components/Encabezado';
import Portada from './components/Portada';
import Caracteristicas from './components/Caracteristicas';
import Sobre from './components/Sobre';
import Testimonios from './components/Testimonios';
import LlamadaAccion from './components/LlamadaAccion';
import Politicas from './components/Politicas';
import QuienesSomos from './components/QuienesSomos';
import TerminosCondiciones from './components/TerminosCondiciones';
import Restaurantes from './components/Restaurantes';
import Contacto from './components/Contacto';
import PiePagina from './components/PiePagina';
import AvisoLegal from './components/AvisoLegal';


function HomePage() {
  return (
    <>
      <Portada />
      <Caracteristicas />
      <Sobre />
      <Testimonios />
      <LlamadaAccion />
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Encabezado />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quienes-somos" element={<QuienesSomos />} />
            <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
            <Route path="/politicas-tratamientos-datos" element={<Politicas />} />
            <Route path="/aviso-legal" element={<AvisoLegal />} />
            <Route path="/restaurantes" element={<Restaurantes />} />

            <Route path="/contacto" element={<Contacto />} />
            <Route path="/caracteristicas" element={<Caracteristicas />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/testimonios" element={<Testimonios />} />
            <Route path="/llamada-accion" element={<LlamadaAccion />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <PiePagina />
      </div>
    </HashRouter>
  );
}

export default App;
