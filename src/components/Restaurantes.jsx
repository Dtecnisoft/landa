import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

const FOOD_TYPE_CHIPS = [
  { id: 'all', label: 'Todos los Sabores', icon: '🍽️' },
  { id: 'hamburguesa', label: 'Burgers & Comida Rápida', icon: '🍔' },
  { id: 'pizza', label: 'Pizzas & Pastas', icon: '🍕' },
  { id: 'asados', label: 'Asados & Carnes', icon: '🥩' },
  { id: 'saludable', label: 'Saludable & Ensaladas', icon: '🥗' },
  { id: 'postres', label: 'Repostería & Café', icon: '🍰' },
];

function Restaurantes() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedRestaurantModal, setSelectedRestaurantModal] = useState(null);

  // Load Real-time Restaurants from Supabase
  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      // Query users table for role = 'restaurant'
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar, address, city, food_type, phone, status, created_at')
        .eq('role', 'restaurant')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setRestaurants(data);
      } else {
        // Fallback demo restaurants if table is empty
        setRestaurants([
          {
            id: 'demo-rest-1',
            name: 'Sazón de Barrio',
            food_type: 'Hamburguesas & Comida Criolla',
            address: 'Calle 10 # 4-20',
            city: 'Cali',
            phone: '315 882 9910',
            avatar: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
          },
          {
            id: 'demo-rest-2',
            name: 'Pizzería Don Mario',
            food_type: 'Pizza & Masa Madre',
            address: 'Carrera 15 # 8-32',
            city: 'Cali',
            phone: '310 443 1120',
            avatar: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
          },
          {
            id: 'demo-rest-3',
            name: 'La Parrilla de Doña Inés',
            food_type: 'Asados & Carnes al Carbón',
            address: 'Av. Circunvalar # 12-05',
            city: 'Cali',
            phone: '320 998 7744',
            avatar: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
          },
          {
            id: 'demo-rest-4',
            name: 'Molino Café & Panadería',
            food_type: 'Repostería & Café de Origen',
            address: 'Calle 5 # 22-10',
            city: 'Cali',
            phone: '300 112 3388',
            avatar: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
          },
        ]);
      }
    } catch (e) {
      console.error('Error loading restaurants:', e);
      showToast('Error al consultar restaurantes registrados.', 'error', 'Error Supabase');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRestaurants();

    // Subscribe to realtime changes in users table
    const channel = supabase
      .channel('public-restaurants-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: 'role=eq.restaurant' },
        () => loadRestaurants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRestaurants]);

  const handleGoToManagement = () => {
    const savedUser = localStorage.getItem('landa_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.role === 'restaurant' || user.role === 'admin' || user.email?.includes('admin')) {
          navigate('/restaurante/gestion');
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    showToast('Debes iniciar sesión con tu cuenta de restaurante para acceder al panel de gestión.', 'info', 'Acceso Restaurantes');
    navigate('/restaurante/gestion');
  };

  // Filter restaurants by search query and category chips
  const filteredRestaurants = restaurants.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const name = (r.name || '').toLowerCase();
    const type = (r.food_type || '').toLowerCase();
    const city = (r.city || '').toLowerCase();

    if (q.length > 0 && !name.includes(q) && !type.includes(q) && !city.includes(q)) {
      return false;
    }

    if (selectedFilter !== 'all') {
      if (!type.includes(selectedFilter) && !name.toLowerCase().includes(selectedFilter)) {
        return false;
      }
    }

    return true;
  });

  return (
    <section id="restaurantes" className="restaurants-page" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <div className="container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* PUBLIC HERO WITH GASTRONOMIC STYLING */}
        <div
          className="master-hero-banner"
          style={{
            padding: '2.5rem 2.25rem',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
            borderRadius: '24px',
            boxShadow: '0 12px 32px rgba(249, 115, 22, 0.25)',
          }}
        >
          <div style={{ maxWidth: '720px' }}>
            <span
              className="eyebrow"
              style={{
                color: '#fff7ed',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.3rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
              }}
            >
              🍕 GUÍA GASTRONÓMICA LOCAL • RED LANDA
            </span>
            <h1 style={{ fontSize: '2.4rem', margin: '0.6rem 0 0.5rem 0', color: '#ffffff', lineHeight: 1.25, fontWeight: 900 }}>
              Descubre los Mejores Restaurantes de tu Ciudad
            </h1>
            <p className="banner-subtext" style={{ color: '#fff7ed', margin: 0, fontSize: '1rem', lineHeight: 1.55 }}>
              Explora la oferta gastronómica oficial en tiempo real. Pide tus platos favoritos sin intermediarios costosos directamente desde la App Landa.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
            <button
              className="chip-btn"
              onClick={() => showToast('¡Descarga la App Landa en Google Play Store o App Store para realizar tus pedidos!', 'info', 'Descarga la App')}
              style={{ background: '#ffffff', color: '#ea580c', fontWeight: 900, padding: '0.75rem 1.25rem', borderRadius: '12px' }}
            >
              📲 Descargar App para Pedir
            </button>
            <button
              className="chip-btn"
              onClick={handleGoToManagement}
              style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.35)', color: '#ffffff', fontWeight: 700 }}
            >
              🏪 Portal Restaurantes (Gestión)
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div
          className="system-status-card"
          style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            gap: '1.25rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
          }}
        >
          <div className="table-search-box" style={{ width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar restaurantes por nombre, especialidad (Hamburguesa, Pizza, Asados) o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* CHIP FILTERS */}
          <div className="restaurant-tabs-row" style={{ overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {FOOD_TYPE_CHIPS.map((chip) => {
              const isActive = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  className={`restaurant-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(chip.id)}
                  style={{
                    borderColor: isActive ? '#f97316' : 'transparent',
                    color: isActive ? '#f97316' : '#94a3b8',
                  }}
                >
                  <span className="tab-icon">{chip.icon}</span>
                  <span className="tab-label">{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* NOTICE BANNER FOR APP MOBILE */}
        <div
          className="system-status-card"
          style={{
            marginTop: '1.25rem',
            padding: '1rem 1.5rem',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.8rem' }}>📱</span>
            <div>
              <h4 style={{ margin: 0, color: '#f97316', fontSize: '0.95rem', fontWeight: 800 }}>
                ¿Deseas realizar un pedido a domicilio?
              </h4>
              <p style={{ margin: '0.15rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Los pedidos se procesan y rastrean en tiempo real mediante la App Móvil Landa. Selecciona un restaurante a continuación para consultar su menú.
              </p>
            </div>
          </div>
        </div>

        {/* RESTAURANTS REAL-TIME GRID */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                Restaurantes Registrados ({filteredRestaurants.length})
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Comercios locales conectados en directo desde la base de datos Supabase
              </span>
            </div>

            <button className="chip-btn" onClick={loadRestaurants} style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
              🔄 Actualizar En Vivo
            </button>
          </div>

          {loading ? (
            <div className="system-status-card text-center" style={{ padding: '3.5rem' }}>
              <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.5rem' }}>👨‍🍳</span>
              <p style={{ color: '#94a3b8' }}>Cargando directorio de restaurantes desde la base de datos...</p>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="system-status-card text-center" style={{ padding: '3.5rem 1.5rem', gap: '0.75rem' }}>
              <span style={{ fontSize: '3rem' }}>🏬</span>
              <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem' }}>Sin Restaurantes Registrados</h3>
              <p style={{ color: '#8a99ad', margin: 0, fontSize: '0.9rem' }}>
                {searchQuery ? 'No encontramos restaurantes que coincidan con la búsqueda.' : 'Aún no hay restaurantes registrados en esta categoría.'}
              </p>
            </div>
          ) : (
            <div className="restaurants-cards-grid">
              {filteredRestaurants.map((rest) => (
                <div
                  key={rest.id}
                  className="restaurant-master-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'transform 0.25s ease, border-color 0.25s ease',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: '14px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                    <img
                      src={rest.avatar || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop'}
                      alt={rest.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(16, 185, 129, 0.9)', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                      ✓ VERIFICADO
                    </span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
                      {rest.name || 'Restaurante Landa'}
                    </h3>

                    <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.84rem' }}>
                      🍴 {rest.food_type || 'Comida Criolla & Rápida'}
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.3rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                      <span>📍 {rest.address || 'Dirección registrada'}{rest.city ? `, ${rest.city}` : ''}</span>
                      <span>📞 {rest.phone || 'Teléfono no publicado'}</span>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <button
                      className="btn-action-approve full-width"
                      style={{ background: '#f97316', borderColor: '#f97316', fontSize: '0.88rem' }}
                      onClick={() => setSelectedRestaurantModal(rest)}
                    >
                      📲 Ver Información & Pedir en App
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RESTAURANT PARTNER CTA BANNER */}
        <div className="system-status-card text-center" style={{ marginTop: '3.5rem', padding: '2.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
          <h2 style={{ color: '#ffffff', fontSize: '1.6rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>
            ¿Eres dueño de un Restaurante o Comercio Gastronómico?
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '580px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Únete a la plataforma oficial de Landa. Publica tus platos, gestiona precios y menú en tiempo real y recibe transferencias de saldo directamente a tu cuenta bancaria.
          </p>

          <button
            className="chip-btn"
            onClick={handleGoToManagement}
            style={{ background: '#f97316', borderColor: '#f97316', color: '#ffffff', fontWeight: 900, padding: '0.85rem 1.75rem', fontSize: '1rem' }}
          >
            🏪 Ingresar al Portal de Gestión de Restaurantes
          </button>
        </div>
      </div>

      {/* RESTAURANT DETAILS & APP ORDER MODAL */}
      {selectedRestaurantModal && (
        <div className="finances-modal-backdrop" onClick={() => setSelectedRestaurantModal(null)}>
          <div className="finances-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="finances-modal-header">
              <h3>{selectedRestaurantModal.name}</h3>
              <button className="close-modal-btn" onClick={() => setSelectedRestaurantModal(null)}>✕</button>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <img
                src={selectedRestaurantModal.avatar || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop'}
                alt={selectedRestaurantModal.name}
                style={{ width: '120px', height: '120px', borderRadius: '20px', objectFit: 'cover', margin: '0 auto 1rem auto', border: '3px solid #f97316' }}
              />

              <span style={{ color: '#f97316', fontWeight: 800, fontSize: '1rem', display: 'block', marginBottom: '0.4rem' }}>
                🍴 {selectedRestaurantModal.food_type || 'Comida Local'}
              </span>

              <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1rem 0' }}>
                📍 {selectedRestaurantModal.address || 'Ubicación local'} {selectedRestaurantModal.city ? `, ${selectedRestaurantModal.city}` : ''} <br />
                📞 Contacto: {selectedRestaurantModal.phone || 'Disponible en App'}
              </p>

              <div style={{ background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '1rem', borderRadius: '14px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.3rem' }}>📲</span>
                <h4 style={{ color: '#ffffff', margin: '0 0 0.2rem 0', fontSize: '0.95rem' }}>
                  Realiza tu pedido desde la App Móvil Landa
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                  Abre la app en tu celular para ver la carta completa, agregar extras y seguir la ruta del domiciliario en mapa en tiempo real.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-action-reject full-width" onClick={() => setSelectedRestaurantModal(null)}>
                Cerrar
              </button>
              <button
                className="btn-action-approve full-width"
                style={{ background: '#f97316', borderColor: '#f97316' }}
                onClick={() => {
                  showToast('Abriendo enlace de descarga Landa App...', 'info', 'Descarga App');
                  setSelectedRestaurantModal(null);
                }}
              >
                📲 Descargar Landa App
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Restaurantes;
