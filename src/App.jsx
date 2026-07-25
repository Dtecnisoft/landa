import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import PanelMaster from './components/PanelMaster';
import AdminCreateEmployee from './components/AdminCreateEmployee';
import AdminApproveRestaurants from './components/AdminApproveRestaurants';
import AdminApproveDrivers from './components/AdminApproveDrivers';
import AdminApprovePosts from './components/AdminApprovePosts';
import AdminFinances from './components/AdminFinances';
import EmployeeDashboard from './components/EmployeeDashboard';
import RestaurantDashboard from './components/RestaurantDashboard';
import { ToastProvider } from './context/ToastContext';

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

function MainLayout() {
  const location = useLocation();
  const isMasterPath = location.pathname.startsWith('/master') || location.pathname.startsWith('/empleado') || location.pathname.startsWith('/restaurante/gestion');

  return (
    <div className="app-shell">
      {!isMasterPath && <Encabezado />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/master" element={<PanelMaster />} />
          <Route path="/empleado" element={<EmployeeDashboard />} />
          <Route path="/restaurante/gestion" element={<RestaurantDashboard />} />
          <Route path="/master/nuevo-empleado" element={<AdminCreateEmployee />} />
          <Route path="/master/restaurantes" element={<AdminApproveRestaurants />} />
          <Route path="/master/conductores" element={<AdminApproveDrivers />} />
          <Route path="/master/publicaciones" element={<AdminApprovePosts />} />
          <Route path="/master/finanzas" element={<AdminFinances />} />
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
      {!isMasterPath && <PiePagina />}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

