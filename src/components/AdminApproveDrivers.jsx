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

  // Eliminación definitiva de conductor (Requisito 10)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingDriver, setDeletingDriver] = useState(false);


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

  const handleDeleteDriver = async () => {
    if (!deleteTarget) return;
    setDeletingDriver(true);
    const { id, user_id, name } = deleteTarget;

    try {
      const candidateUserIds = [id, user_id].filter(Boolean);
      for (const uid of candidateUserIds) {
        await supabase.from('wallet_transactions').delete().eq('driver_id', uid);
      }
      await supabase.from('drivers').delete().or(`id.eq.${id},user_id.eq.${id}`);
      for (const uid of candidateUserIds) {
        await supabase.from('users').delete().eq('id', uid);
      }

      setDrivers((prev) => prev.filter((d) => d.id !== id && d.user_id !== id));
      showToast(`Conductor "${name || 'Conductor'}" eliminado definitivamente de la base de datos.`, 'success', 'Conductor Eliminado');
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error al eliminar conductor:', err);
      showToast('No se pudo eliminar el conductor de Supabase.', 'error', 'Error al Eliminar');
    } finally {
      setDeletingDriver(false);
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
                        C.C: {driver.cedula || driver.cc || 'No especificada'} • Edad: {driver.age || driver.edad || '28'} años
                      </span>
                    </div>

                    <span className={`status-badge-chip ${activeTab}`}>
                      {activeTab === 'pending' ? 'PENDIENTE' : activeTab === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                    </span>
                  </div>

                  <div className="restaurant-card-details">
                    <div className="detail-info-row">
                      <span className="detail-icon">
                        {driver.vehicle_type === 'motorcycle' || (driver.vehicle_type || '').toLowerCase().includes('moto') ? '🏍️' : '🚘'}
                      </span>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>
                        {driver.vehicle_info || `${driver.vehicle_type || 'Carro'} ${driver.vehicle_model ? `- Modelo: ${driver.vehicle_model}` : ''}`}
                      </span>
                    </div>
                    {(driver.vehicle_model || driver.model) && (
                      <div className="detail-info-row">
                        <span className="detail-icon">📅</span>
                        <span>Modelo Vehículo: <strong>{driver.vehicle_model || driver.model}</strong></span>
                      </div>
                    )}
                    {(driver.placa || driver.license_plate) && (
                      <div className="detail-info-row">
                        <span className="detail-icon">🔤</span>
                        <span>Placa: <strong style={{ color: '#facc15' }}>{driver.placa || driver.license_plate}</strong></span>
                      </div>
                    )}
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

                    {/* Botón de Eliminación Definitiva (Requisito 10) */}
                    <button
                      className="btn-action-reject full-width"
                      style={{ marginTop: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#f87171' }}
                      disabled={isUpdating || deletingDriver}
                      onClick={() => setDeleteTarget(driver)}
                    >
                      🗑️ Eliminar Definitivamente
                    </button>
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

      {/* MODAL DE CONFIRMACIÓN DESTRUTIVA PARA ELIMINAR CONDUCTOR (REQUISITO 10) */}
      {deleteTarget && (
        <div className="finances-modal-backdrop" onClick={() => !deletingDriver && setDeleteTarget(null)}>
          <div className="danger-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="danger-modal-header">
              <div className="danger-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="danger-modal-title-box">
                <h3>¿Eliminar Conductor Definitivamente?</h3>
                <p>Se borrarán los registros del conductor, vehículo y su billetera operativa.</p>
              </div>
            </div>

            <div className="danger-target-box">
              <div className="danger-target-row">
                <div className="danger-target-avatar">
                  {deleteTarget.avatar ? (
                    <img src={deleteTarget.avatar} alt={deleteTarget.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (deleteTarget.name || 'C').substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="danger-target-info">
                  <span className="danger-target-name">{deleteTarget.name || 'Conductor'}</span>
                  <span className="danger-target-meta">
                    Tel: {deleteTarget.phone || 'No registrado'} • C.C: {deleteTarget.cedula || deleteTarget.cc || 'No registrada'}
                  </span>
                </div>
              </div>
            </div>

            <div className="danger-impact-alert">
              ⚠️ Esta acción eliminará permanentemente la cuenta de conductor y su acceso a la plataforma. No se puede revertir.
            </div>

            <div className="danger-modal-actions">
              <button
                type="button"
                className="btn-cancel-action"
                disabled={deletingDriver}
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                disabled={deletingDriver}
                onClick={handleDeleteDriver}
              >
                {deletingDriver ? 'Eliminando...' : '🗑️ Eliminar Conductor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApproveDrivers;
