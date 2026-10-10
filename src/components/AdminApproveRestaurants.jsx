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

function AdminApproveRestaurants() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Eliminación definitiva de restaurante (Requisito 10)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingRestaurant, setDeletingRestaurant] = useState(false);


  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'restaurant')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (e) {
      console.error('Error loading restaurants:', e);
      showToast('Error al cargar la lista de restaurantes.', 'error', 'Error Supabase');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const updateRestaurantStatus = async (restaurantId, newStatus, restaurantName) => {
    setUpdatingId(restaurantId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', restaurantId);

      if (error) throw error;

      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurantId ? { ...r, status: newStatus } : r))
      );

      if (newStatus === 'approved') {
        showToast(`El restaurante "${restaurantName}" ha sido aprobado exitosamente. 🍔`, 'success', '¡Aprobado!');
      } else {
        showToast(`El restaurante "${restaurantName}" ha sido rechazado/suspendido. ⚠️`, 'warning', 'Estado Actualizado');
      }
    } catch (e) {
      console.error(e);
      showToast('No se pudo actualizar el estado del restaurante.', 'error', 'Error al Actualizar');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!deleteTarget) return;
    setDeletingRestaurant(true);
    const { id, name } = deleteTarget;

    try {
      // 1. Eliminar platillos vinculados al restaurante
      await supabase.from('dishes').delete().eq('restaurant_id', id);
      // 2. Eliminar restaurante de users
      const { error: delErr } = await supabase.from('users').delete().eq('id', id);
      if (delErr) throw delErr;

      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      showToast(`Restaurante "${name || 'Restaurante'}" y sus platillos fueron eliminados de la base de datos.`, 'success', 'Restaurante Eliminado');
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error al eliminar restaurante:', err);
      showToast('No se pudo eliminar el restaurante en Supabase.', 'error', 'Error al Eliminar');
    } finally {
      setDeletingRestaurant(false);
    }
  };

  // Filtered restaurants for active tab and search query

  const filteredRestaurants = restaurants.filter((r) => {
    const rStatus = r.status || 'approved'; // default to approved if status is null/empty
    if (rStatus !== activeTab) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const name = (r.name || '').toLowerCase();
      const foodType = (r.food_type || '').toLowerCase();
      const address = (r.address || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      return name.includes(q) || foodType.includes(q) || address.includes(q) || phone.includes(q);
    }
    return true;
  });

  const getTabCount = (tabId) => {
    return restaurants.filter((r) => (r.status || 'approved') === tabId).length;
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
              <span className="master-brand-sub">Panel Master • Gestión de Restaurantes</span>
            </div>
          </div>

          <button className="chip-btn active" onClick={() => navigate('/master')}>
            ← Volver al Panel Master
          </button>
        </div>
      </header>

      <main className="master-container" style={{ maxWidth: '980px' }}>
        {/* BANNER */}
        <div className="master-hero-banner" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)' }}>
          <div>
            <h1 className="banner-greeting" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Aprobación de Restaurantes y Comercios</h1>
            <p className="banner-subtext">Revisa las solicitudes, aprueba negocios locales o gestiona locales existentes.</p>
          </div>

          <button className="chip-btn" onClick={loadRestaurants} style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }}>
            🔄 Actualizar Lista
          </button>
        </div>

        {/* SEARCH AND TABS BAR */}
        <div className="system-status-card" style={{ padding: '1.25rem', gap: '1.25rem' }}>
          <div className="table-search-box" style={{ width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre de restaurante, especialidad, dirección o teléfono..."
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
            <p style={{ color: '#94a3b8' }}>Cargando restaurantes desde Supabase...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="system-status-card text-center" style={{ padding: '3.5rem 1.5rem', gap: '0.75rem' }}>
            <span style={{ fontSize: '3rem' }}>🏪</span>
            <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem' }}>Sin Resultados</h3>
            <p style={{ color: '#8a99ad', margin: 0, fontSize: '0.9rem' }}>
              No hay restaurantes en la categoría "{TABS.find((t) => t.id === activeTab)?.label}".
            </p>
          </div>
        ) : (
          <div className="restaurants-cards-grid">
            {filteredRestaurants.map((restaurant) => {
              const isUpdating = updatingId === restaurant.id;
              return (
                <div key={restaurant.id} className="restaurant-master-card">
                  <div className="restaurant-card-header">
                    <img
                      src={restaurant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(restaurant.name || 'R')}&background=ea580c&color=fff`}
                      alt={restaurant.name}
                      className="restaurant-avatar-img"
                    />
                    <div className="restaurant-header-info">
                      <h3 className="restaurant-title-name">{restaurant.name || 'Restaurante Sin Nombre'}</h3>
                      <span className="restaurant-food-badge">{restaurant.food_type || 'Gastronomía & Comida'}</span>
                    </div>

                    <span className={`status-badge-chip ${activeTab}`}>
                      {activeTab === 'pending' ? 'PENDIENTE' : activeTab === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                    </span>
                  </div>

                  <div className="restaurant-card-details">
                    <div className="detail-info-row">
                      <span className="detail-icon">📍</span>
                      <span>{restaurant.address || 'Dirección no registrada'}</span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-icon">📞</span>
                      <span>{restaurant.phone || 'Teléfono no registrado'}</span>
                    </div>
                    <div className="detail-info-row">
                      <span className="detail-icon">✉️</span>
                      <span>{restaurant.email || 'Sin correo registrado'}</span>
                    </div>
                    {restaurant.description && (
                      <div className="detail-info-row" style={{ alignItems: 'flex-start' }}>
                        <span className="detail-icon">📝</span>
                        <span className="detail-desc">{restaurant.description}</span>
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="restaurant-card-actions">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          className="btn-action-reject"
                          disabled={isUpdating}
                          onClick={() => updateRestaurantStatus(restaurant.id, 'rejected', restaurant.name)}
                        >
                          ✕ Rechazar
                        </button>
                        <button
                          className="btn-action-approve"
                          disabled={isUpdating}
                          onClick={() => updateRestaurantStatus(restaurant.id, 'approved', restaurant.name)}
                        >
                          ✓ Aprobar
                        </button>
                      </>
                    )}

                    {activeTab === 'approved' && (
                      <button
                        className="btn-action-reject full-width"
                        disabled={isUpdating}
                        onClick={() => updateRestaurantStatus(restaurant.id, 'rejected', restaurant.name)}
                      >
                        ⚠️ Suspender Restaurante
                      </button>
                    )}

                    {activeTab === 'rejected' && (
                      <button
                        className="btn-action-approve full-width"
                        disabled={isUpdating}
                        onClick={() => updateRestaurantStatus(restaurant.id, 'approved', restaurant.name)}
                      >
                        ↺ Deshacer y Aprobar
                      </button>
                    )}

                    {/* Botón de Eliminación Definitiva (Requisito 10) */}
                    <button
                      className="btn-action-reject full-width"
                      style={{ marginTop: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#f87171' }}
                      disabled={isUpdating || deletingRestaurant}
                      onClick={() => setDeleteTarget(restaurant)}
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

      {/* MODAL DE CONFIRMACIÓN DESTRUTIVA PARA ELIMINAR RESTAURANTE (REQUISITO 10) */}
      {deleteTarget && (
        <div className="finances-modal-backdrop" onClick={() => !deletingRestaurant && setDeleteTarget(null)}>
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
                <h3>¿Eliminar Restaurante Definitivamente?</h3>
                <p>Se borrarán los datos del restaurante y todos sus platillos asociados.</p>
              </div>
            </div>

            <div className="danger-target-box">
              <div className="danger-target-row">
                <div className="danger-target-avatar">
                  {deleteTarget.avatar ? (
                    <img src={deleteTarget.avatar} alt={deleteTarget.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (deleteTarget.name || 'R').substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="danger-target-info">
                  <span className="danger-target-name">{deleteTarget.name || 'Restaurante'}</span>
                  <span className="danger-target-meta">
                    {deleteTarget.food_type || 'Restaurante'} • {deleteTarget.email || deleteTarget.phone || 'Sin contacto'}
                  </span>
                </div>
              </div>
            </div>

            <div className="danger-impact-alert">
              ⚠️ Esta acción eliminará permanentemente el restaurante de LANDA y su menú completo. No se puede revertir.
            </div>

            <div className="danger-modal-actions">
              <button
                type="button"
                className="btn-cancel-action"
                disabled={deletingRestaurant}
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                disabled={deletingRestaurant}
                onClick={handleDeleteRestaurant}
              >
                {deletingRestaurant ? 'Eliminando...' : '🗑️ Eliminar Restaurante'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApproveRestaurants;
