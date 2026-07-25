import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/images/logo.png';
import { useToast } from '../context/ToastContext';

const TABS = [
  { id: 'pending', label: 'Pendientes', icon: '⏳', color: '#f59e0b' },
  { id: 'approved', label: 'Aprobados', icon: '✅', color: '#10b981' },
  { id: 'rejected', label: 'Rechazados', icon: '❌', color: '#ef4444' },
];

function AdminApproveDrivers() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Modal Image Preview State
  const [previewImage, setPreviewImage] = useState(null);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (e) {
      console.error('Error loading drivers:', e);
      showToast('Error al cargar la lista de conductores.', 'error', 'Error Supabase');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const updateDriverStatus = async (driverId, newStatus, driverName) => {
    setUpdatingId(driverId);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: newStatus })
        .eq('id', driverId);

      if (error) throw error;

      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, status: newStatus } : d))
      );

      // If approved, update user role to 'driver' in users table if user_id exists
      if (newStatus === 'approved') {
        const targetDriver = drivers.find((d) => d.id === driverId);
        if (targetDriver?.user_id) {
          await supabase.from('users').update({ role: 'driver' }).eq('id', targetDriver.user_id);
        }
        showToast(`El conductor "${driverName}" ha sido aprobado exitosamente. 🚗`, 'success', '¡Conductor Aprobado!');
      } else {
        showToast(`La cuenta de conductor "${driverName}" ha sido suspendida/rechazada. ⚠️`, 'warning', 'Estado Actualizado');
      }
    } catch (e) {
      console.error(e);
      showToast('No se pudo actualizar el estado del conductor.', 'error', 'Error de Operación');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter drivers for active tab and search query
  const filteredDrivers = drivers.filter((d) => {
    const dStatus = d.status || 'pending';
    if (dStatus !== activeTab) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const name = (d.name || '').toLowerCase();
      const cedula = (d.cedula || d.cc || '').toString().toLowerCase();
      const phone = (d.phone || '').toLowerCase();
      const vehicle = (d.vehicle_info || '').toLowerCase();
      return name.includes(q) || cedula.includes(q) || phone.includes(q) || vehicle.includes(q);
    }
    return true;
  });

  const getTabCount = (tabId) => {
    return drivers.filter((d) => (d.status || 'pending') === tabId).length;
  };

  return (
    <div className="master-panel-page">
      {/* HEADER */}
      <header className="master-header">
        <div className="master-header-inner">
          <div className="master-brand">
            <img src={logo} alt="Landa Logo" className="master-logo-img" />
            <div className="master-brand-titles">
              <span className="master-brand-name">LANDA</span>
              <span className="master-brand-sub">Panel Master • Verificación de Conductores</span>
            </div>
          </div>

          <button className="chip-btn active" onClick={() => navigate('/master')}>
            ← Volver al Panel Master
          </button>
        </div>
      </header>

      <main className="master-container" style={{ maxWidth: '980px' }}>
        {/* BANNER */}
        <div className="master-hero-banner" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
          <div>
            <h1 className="banner-greeting" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Verificación de Conductores y Documentos</h1>
            <p className="banner-subtext">Revisa licencias, SOAT y tarjetas de propiedad para validar conductores de la comunidad.</p>
          </div>

          <button className="chip-btn" onClick={loadDrivers} style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }}>
            🔄 Actualizar Lista
          </button>
        </div>

        {/* SEARCH AND TABS BAR */}
        <div className="system-status-card" style={{ padding: '1.25rem', gap: '1.25rem' }}>
          <div className="table-search-box" style={{ width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar conductor por nombre, cédula (CC), teléfono o modelo de vehículo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* TABS */}
          <div className="restaurant-tabs-row">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = getTabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  className={`restaurant-tab-btn ${isActive ? 'active' : ''}`}
                  style={{
                    borderColor: isActive ? tab.color : 'transparent',
                    color: isActive ? tab.color : '#94a3b8',
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-badge-count" style={{ background: isActive ? tab.color : 'rgba(255,255,255,0.08)' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTING SECTION */}
        {loading ? (
          <div className="system-status-card text-center" style={{ padding: '3rem' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>⏳</span>
            <p style={{ color: '#94a3b8' }}>Cargando conductores desde Supabase...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="system-status-card text-center" style={{ padding: '3.5rem 1.5rem', gap: '0.75rem' }}>
            <span style={{ fontSize: '3rem' }}>🚗</span>
            <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem' }}>Sin Resultados</h3>
            <p style={{ color: '#8a99ad', margin: 0, fontSize: '0.9rem' }}>
              No hay conductores en la categoría "{TABS.find((t) => t.id === activeTab)?.label}".
            </p>
          </div>
        ) : (
          <div className="restaurants-cards-grid">
            {filteredDrivers.map((driver) => {
              const isUpdating = updatingId === driver.id;
              return (
                <div key={driver.id} className="restaurant-master-card">
                  <div className="restaurant-card-header">
                    <img
                      src={driver.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name || 'C')}&background=0284c7&color=fff`}
                      alt={driver.name}
                      className="restaurant-avatar-img"
                    />
                    <div className="restaurant-header-info">
                      <h3 className="restaurant-title-name">{driver.name || 'Conductor Sin Nombre'}</h3>
                      <span className="restaurant-food-badge">
                        C.C: {driver.cedula || driver.cc || 'No especificada'} {driver.age ? `• Edad: ${driver.age}` : ''}
                      </span>
                    </div>

                    <span className={`status-badge-chip ${activeTab}`}>
                      {activeTab === 'pending' ? 'PENDIENTE' : activeTab === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                    </span>
                  </div>

                  <div className="restaurant-card-details">
                    <div className="detail-info-row">
                      <span className="detail-icon">
                        {driver.vehicle_type === 'motorcycle' ? '🏍️' : '🚘'}
                      </span>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>
                        {driver.vehicle_info || 'Vehículo no especificado'}
                      </span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-icon">📞</span>
                      <span>{driver.phone || 'No registrado'}</span>
                    </div>

                    {/* DOCUMENT THUMBNAILS GRID */}
                    <div className="driver-docs-grid">
                      <div className="doc-thumb-item" onClick={() => driver.soat_url && setPreviewImage(driver.soat_url)}>
                        {driver.soat_url ? (
                          <img src={driver.soat_url} alt="SOAT" className="doc-img-thumb" />
                        ) : (
                          <div className="doc-thumb-placeholder">📷</div>
                        )}
                        <span className="doc-thumb-title">SOAT</span>
                      </div>

                      <div className="doc-thumb-item" onClick={() => driver.license_url && setPreviewImage(driver.license_url)}>
                        {driver.license_url ? (
                          <img src={driver.license_url} alt="Licencia" className="doc-img-thumb" />
                        ) : (
                          <div className="doc-thumb-placeholder">🪪</div>
                        )}
                        <span className="doc-thumb-title">Licencia</span>
                      </div>

                      <div className="doc-thumb-item" onClick={() => driver.property_card_url && setPreviewImage(driver.property_card_url)}>
                        {driver.property_card_url ? (
                          <img src={driver.property_card_url} alt="Propiedad" className="doc-img-thumb" />
                        ) : (
                          <div className="doc-thumb-placeholder">📄</div>
                        )}
                        <span className="doc-thumb-title">Propiedad</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="restaurant-card-actions">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          className="btn-action-reject"
                          disabled={isUpdating}
                          onClick={() => updateDriverStatus(driver.id, 'rejected', driver.name)}
                        >
                          ✕ Rechazar
                        </button>
                        <button
                          className="btn-action-approve"
                          disabled={isUpdating}
                          onClick={() => updateDriverStatus(driver.id, 'approved', driver.name)}
                        >
                          ✓ Aprobar
                        </button>
                      </>
                    )}

                    {activeTab === 'approved' && (
                      <button
                        className="btn-action-reject full-width"
                        disabled={isUpdating}
                        onClick={() => updateDriverStatus(driver.id, 'rejected', driver.name)}
                      >
                        ⚠️ Suspender Conductor
                      </button>
                    )}

                    {activeTab === 'rejected' && (
                      <button
                        className="btn-action-approve full-width"
                        disabled={isUpdating}
                        onClick={() => updateDriverStatus(driver.id, 'approved', driver.name)}
                      >
                        ↺ Deshacer y Aprobar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="finances-modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="finances-modal-card" style={{ maxWidth: '640px', padding: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="finances-modal-header" style={{ padding: '0 0 1rem 0' }}>
              <h3>Vista Previa del Documento</h3>
              <button className="close-modal-btn" onClick={() => setPreviewImage(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', borderRadius: '12px', padding: '0.5rem', maxHeight: '70vh', overflow: 'hidden' }}>
              <img src={previewImage} alt="Documento Conductor" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApproveDrivers;
