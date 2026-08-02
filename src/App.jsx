import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Encabezado from './components/Encabezado';
import Portada from './components/Portada';
import Caracteristicas from './components/Caracteristicas';
import Sobre from './components/Sobre';
import Testimonios from './components/Testimonios';
import LlamadaAccion from './components/LlamadaAccion';
import Politicas from './components/Politicas';
import PoliticasReembolsos from './components/PoliticasReembolsos';
import QuienesSomos from './components/QuienesSomos';
import TerminosCondiciones from './components/TerminosCondiciones';
import Restaurantes from './components/Restaurantes';
import Contacto from './components/Contacto';
import Cobertura from './components/Cobertura';
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
import ProtectedRoute from './components/ProtectedRoute';
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

          {/* Rutas administrativas protegidas */}
          <Route path="/master" element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <PanelMaster />
            </ProtectedRoute>
          } />
          <Route path="/master/nuevo-empleado" element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AdminCreateEmployee />
            </ProtectedRoute>
          } />
          <Route path="/master/restaurantes" element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AdminApproveRestaurants />
            </ProtectedRoute>
          } />
          <Route path="/master/conductores" element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AdminApproveDrivers />
            </ProtectedRoute>
          } />
          <Route path="/master/publicaciones" element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AdminApprovePosts />
            </ProtectedRoute>
          } />
          <Route path="/master/finanzas" element={
            <ProtectedRoute allowedRoles={['master', 'admin']}>
              <AdminFinances />
            </ProtectedRoute>
          } />

          {/* Rutas de empleado protegidas */}
          <Route path="/empleado" element={
            <ProtectedRoute allowedRoles={['employee', 'master', 'admin']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/empleado/publicaciones" element={
            <ProtectedRoute allowedRoles={['employee', 'master', 'admin']}>
              <AdminApprovePosts />
            </ProtectedRoute>
          } />
          <Route path="/empleado/finanzas" element={
            <ProtectedRoute allowedRoles={['employee', 'master', 'admin']}>
              <AdminFinances />
            </ProtectedRoute>
          } />

          {/* Ruta de gestión de restaurantes protegida */}
          <Route path="/restaurante/gestion" element={
            <ProtectedRoute allowedRoles={['restaurant', 'master', 'admin']}>
              <RestaurantDashboard />
            </ProtectedRoute>
          } />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
          <Route path="/politicas-tratamientos-datos" element={<Politicas />} />
          <Route path="/politicas-reembolsos" element={<PoliticasReembolsos />} />
          <Route path="/aviso-legal" element={<AvisoLegal />} />
          <Route path="/restaurantes" element={<Restaurantes />} />
          <Route path="/cobertura" element={<Cobertura />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/caracteristicas" element={<Caracteristicas />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/testimonios" element={<Testimonios />} />
          {/*<Route path="/llamada-accion" element={<LlamadaAccion />} /> */}
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

