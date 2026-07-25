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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminApproveRestaurants;
