import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/images/logo.png';
import { useToast } from '../context/ToastContext';

const FOOD_CATEGORIES = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'asados', name: 'Asados', icon: '🥩' },
  { id: 'saludable', name: 'Saludable', icon: '🥗' },
  { id: 'sushi', name: 'Sushi', icon: '🍣' },
  { id: 'tacos', name: 'Tacos', icon: '🌮' },
  { id: 'postres', name: 'Postres', icon: '🍰' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
];

function formatPrice(val) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function RestaurantDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantBalance, setRestaurantBalance] = useState(0);

  // Orders State
  const [activeOrders, setActiveOrders] = useState([]);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

  // Publish / Edit Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState(null);
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'burgers',
    image_url: '',
  });
  const [savingDish, setSavingDish] = useState(false);

  // Load User & Role
  useEffect(() => {
    const savedUser = localStorage.getItem('landa_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('users')
          .select('id, role, name, balance')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            const u = {
              id: session.user.id,
              email: session.user.email,
              name: data?.name || session.user.email?.split('@')[0] || 'Restaurante',
              role: data?.role || 'restaurant',
              balance: data?.balance || 0,
            };
            setUser(u);
            setRestaurantBalance(data?.balance || 0);
          });
      }
    });
  }, []);

  const isRestaurant = user?.role === 'restaurant' || user?.role === 'admin' || user?.email?.includes('admin');

  // Load Dishes for Restaurant
  const loadDishes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('dishes')
        .select('*');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (user?.id && !user?.email?.includes('admin')) {
        query = query.eq('restaurant_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setDishes(data);
      } else {
        // Demo fallback dishes
        setDishes([
          {
            id: 'dish-101',
            name: 'Hamburguesa Landa Especial',
            description: 'Carne artesanal 180g, doble queso cheddar, tocineta y salsa especial.',
            price: 24900,
            category: 'burgers',
            image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600&auto=format&fit=crop',
            restaurant_id: user?.id || 'demo-rest-1',
          },
          {
            id: 'dish-102',
            name: 'Pizza Napolitana Familiar',
            description: 'Masa madre, salsa de tomate fresco, queso mozzarella y albahaca.',
            price: 38000,
            category: 'pizza',
            image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop',
            restaurant_id: user?.id || 'demo-rest-1',
          },
        ]);
      }
    } catch (e) {
      console.error('Error loading restaurant dishes:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, user?.id, user?.email]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  // Load Active Orders for Restaurant
  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, client:user_id(name)')
        .eq('restaurant_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setActiveOrders(data);
      }
    } catch (e) {
      console.error('Error loading orders:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Open Publish/Edit Modal
  const handleOpenPublishModal = (dish = null) => {
    if (dish) {
      setDishToEdit(dish);
      setDishForm({
        name: dish.name || '',
        description: dish.description || '',
        price: dish.price ? dish.price.toString() : '',
        category: dish.category || 'burgers',
        image_url: dish.image_url || '',
      });
    } else {
      setDishToEdit(null);
      setDishForm({
        name: '',
        description: '',
        price: '',
        category: 'burgers',
        image_url: '',
      });
    }
    setIsPublishModalOpen(true);
  };

  // Save Dish (Insert/Update)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dishForm.name || !dishForm.price) {
      showToast('Por favor ingresa el nombre y precio del plato.', 'warning', 'Campos Incompletos');
      return;
    }

    setSavingDish(true);
    try {
      const payload = {
        restaurant_id: user?.id || 'demo-rest-id',
        name: dishForm.name,
        description: dishForm.description,
        price: parseFloat(dishForm.price),
        category: dishForm.category,
        image_url: dishForm.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop',
      };

      if (dishToEdit) {
        const { error } = await supabase.from('dishes').update(payload).eq('id', dishToEdit.id);
        if (error) throw error;
        showToast(`El plato "${dishForm.name}" ha sido actualizado.`, 'success', 'Plato Actualizado');
      } else {
        const { error } = await supabase.from('dishes').insert(payload);
        if (error) throw error;
        showToast(`¡El plato "${dishForm.name}" ha sido publicado en tu menú!`, 'success', 'Plato Publicado');
      }

      setIsPublishModalOpen(false);
      loadDishes();
    } catch (err) {
      console.error(err);
      showToast('No se pudo guardar el plato en la base de datos.', 'error', 'Error al Guardar');
    } finally {
      setSavingDish(false);
    }
  };

  // Delete Dish
  const handleDeleteDish = async (dishId, dishName) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${dishName}" de tu menú?`)) return;

    try {
      const { error } = await supabase.from('dishes').delete().eq('id', dishId);
      if (error) throw error;
      setDishes((prev) => prev.filter((d) => d.id !== dishId));
      showToast(`El plato "${dishName}" fue eliminado de la carta.`, 'info', 'Plato Eliminado');
    } catch (e) {
      console.error(e);
      showToast('No se pudo eliminar el plato.', 'error', 'Error al Eliminar');
    }
  };

  // Filter dishes by search and category
  const filteredDishes = dishes.filter((dish) => {
    const q = searchQuery.toLowerCase().trim();
    const name = (dish.name || '').toLowerCase();
    const desc = (dish.description || '').toLowerCase();

    if (q.length > 0 && !name.includes(q) && !desc.includes(q)) {
      return false;
    }
    return true;
  });

  return (
    <div className="master-panel-page">
      {/* HEADER */}
      <header className="master-header">
        <div className="master-header-inner">
          <div className="master-brand">
            <img src={logo} alt="Landa Logo" className="master-logo-img" />
            <div className="master-brand-titles">
              <span className="master-brand-name">LANDA</span>
              <span className="master-brand-sub">Portal de Gestión de Restaurante</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="chip-btn active" onClick={() => navigate('/restaurantes')}>
              🌐 Ver Vista Pública
            </button>
            <button className="chip-btn" onClick={() => navigate('/')}>
              ← Inicio
            </button>
          </div>
        </div>
      </header>

      <main className="master-container" style={{ maxWidth: '1040px' }}>
        {!isRestaurant ? (
          <div className="system-status-card text-center" style={{ padding: '3.5rem 1.5rem', marginTop: '2rem', gap: '1rem' }}>
            <span style={{ fontSize: '3rem' }}>🔒</span>
            <h2 style={{ color: '#ffffff', margin: 0 }}>Acceso Restringido a Comercios</h2>
            <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
              Esta sección es exclusiva para restaurantes registrados en Landa. Por favor inicia sesión con tu cuenta de comercio para administrar tu carta y pedidos.
            </p>
            <button
              className="chip-btn"
              onClick={() => navigate('/')}
              style={{ background: '#ea580c', borderColor: '#ea580c', color: '#ffffff', fontWeight: 800, padding: '0.75rem 1.5rem', marginTop: '1rem' }}
            >
              Regresar al Inicio / Iniciar Sesión
            </button>
          </div>
        ) : (
          <>
            {/* HERO BANNER */}
            <div className="master-hero-banner" style={{ padding: '2rem 2.25rem', background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' }}>
              <div>
                <h1 className="banner-greeting" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
                  Panel de Control: {user?.name || 'Mi Restaurante'}
                </h1>
                <p className="banner-subtext">Gestiona tus platos en tiempo real, actualiza precios y revisa los pedidos recibidos.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="chip-btn"
                  onClick={() => handleOpenPublishModal(null)}
                  style={{ background: '#ffffff', color: '#ea580c', fontWeight: 800 }}
                >
                  ➕ Publicar Nuevo Plato
                </button>
                <button
                  className="chip-btn"
                  onClick={() => setIsOrdersModalOpen(true)}
                  style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' }}
                >
                  📋 Pedidos Recibidos ({activeOrders.length})
                </button>
              </div>
            </div>

            {/* RESTAURANT WALLET CARD */}
            <div className="system-status-card" style={{ marginTop: '1.25rem', padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(234, 88, 12, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(234, 88, 12, 0.2)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    🏪
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>SALDO ACUMULADO DISPONIBLE</span>
                    <h2 style={{ margin: 0, color: '#4ade80', fontSize: '1.6rem' }}>
                      {formatPrice(restaurantBalance)} <small style={{ fontSize: '0.85rem', color: '#94a3b8' }}>COP</small>
                    </h2>
                  </div>
                </div>

                <button
                  className="chip-btn"
                  onClick={() => showToast('Solicitud de transferencia enviada a tu cuenta bancaria registrada.', 'success', 'Retiro de Dinero')}
                  style={{ background: '#ea580c', borderColor: '#ea580c', color: '#ffffff', fontWeight: 800 }}
                >
                  💳 Transferir a mi Cuenta Bancaria
                </button>
              </div>
            </div>

            {/* SEARCH AND CATEGORIES */}
            <div className="system-status-card" style={{ marginTop: '1.25rem', padding: '1.25rem', gap: '1.25rem' }}>
              <div className="table-search-box" style={{ width: '100%' }}>
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Filtrar por nombre de plato o ingredientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* CATEGORIES */}
              <div className="restaurant-tabs-row" style={{ overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {FOOD_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      className={`restaurant-tab-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        borderColor: isActive ? '#ea580c' : 'transparent',
                        color: isActive ? '#ea580c' : '#94a3b8',
                      }}
                    >
                      <span className="tab-icon">{cat.icon}</span>
                      <span className="tab-label">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DISHES LIST GRID */}
            <div style={{ marginTop: '1.5rem', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem' }}>Carta de Platos Publicados ({filteredDishes.length})</h3>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Los clientes ven estos platos en la App Móvil</span>
              </div>

              {loading ? (
                <div className="system-status-card text-center" style={{ padding: '3rem' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>⏳</span>
                  <p style={{ color: '#94a3b8' }}>Cargando carta de platos...</p>
                </div>
              ) : filteredDishes.length === 0 ? (
                <div className="system-status-card text-center" style={{ padding: '3.5rem 1.5rem', gap: '0.75rem' }}>
                  <span style={{ fontSize: '3rem' }}>🍲</span>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem' }}>No tienes platos publicados</h3>
                  <p style={{ color: '#8a99ad', margin: 0, fontSize: '0.9rem' }}>
                    Presiona el botón "Publicar Nuevo Plato" para agregar tus primeras especialidades a la carta.
                  </p>
                </div>
              ) : (
                <div className="restaurants-cards-grid">
                  {filteredDishes.map((dish) => (
                    <div key={dish.id} className="restaurant-master-card" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                        <img
                          src={dish.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop'}
                          alt={dish.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#ea580c', color: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.95rem' }}>
                          {formatPrice(dish.price)}
                        </span>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem' }}>{dish.name}</h3>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.4, flex: 1 }}>
                          {dish.description}
                        </p>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-action-approve"
                          style={{ flex: 1, background: '#3b82f6', borderColor: '#3b82f6' }}
                          onClick={() => handleOpenPublishModal(dish)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn-action-reject"
                          style={{ flex: 1 }}
                          onClick={() => handleDeleteDish(dish.id, dish.name)}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* PUBLISH / EDIT MODAL */}
      {isPublishModalOpen && (
        <div className="finances-modal-backdrop" onClick={() => setIsPublishModalOpen(false)}>
          <div
            className="finances-modal-card"
            style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="finances-modal-header" style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{dishToEdit ? '✏️' : '🍔'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: 800 }}>
                    {dishToEdit ? 'Editar Plato de la Carta' : 'Publicar Nuevo Plato'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {dishToEdit ? 'Actualiza la información de tu menú' : 'Ingresa los detalles para ofrecer a la comunidad'}
                  </span>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setIsPublishModalOpen(false)}>✕</button>
            </div>

            <div className="finances-modal-body" style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleSaveDish} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* LIVE PHOTO PREVIEW */}
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#090d16', padding: '1rem', borderRadius: '16px', border: '1px dashed rgba(249, 115, 22, 0.3)' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '14px', overflow: 'hidden', background: '#1e293b', flexShrink: 0, border: '2px solid #ea580c' }}>
                    <img
                      src={dishForm.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop'}
                      alt="Vista Previa"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop'; }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vista Previa de la Foto</span>
                    <h4 style={{ margin: '0.2rem 0', color: '#ffffff', fontSize: '1rem' }}>{dishForm.name || 'Nombre del Plato'}</h4>
                    <span style={{ color: '#4ade80', fontWeight: 900, fontSize: '0.95rem' }}>
                      {dishForm.price ? formatPrice(dishForm.price) : '$ 0 COP'}
                    </span>
                  </div>
                </div>

                {/* NOMBRE DEL PLATO */}
                <div>
                  <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                    Nombre del Plato <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Hamburguesa Doble Carne Artesanal"
                    value={dishForm.name}
                    onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.92rem' }}
                  />
                </div>

                {/* DESCRIPCIÓN */}
                <div>
                  <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                    Descripción e Ingredientes
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Ej: Carne de res 180g a la parrilla, tocineta ahumada, doble queso cheddar, cebolla caramelizada y salsa especial..."
                    value={dishForm.description}
                    onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.92rem', resize: 'vertical' }}
                  />
                </div>

                {/* PRECIO Y CATEGORÍA */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                      Precio (COP) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="25000"
                      value={dishForm.price}
                      onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                      style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.92rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                      Categoría
                    </label>
                    <select
                      value={dishForm.category}
                      onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                      style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.92rem' }}
                    >
                      {FOOD_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* URL FOTO */}
                <div>
                  <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                    URL Foto del Plato
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={dishForm.image_url}
                    onChange={(e) => setDishForm({ ...dishForm, image_url: e.target.value })}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '0.92rem' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem', display: 'block' }}>
                    Puedes pegar un enlace directo a la imagen de tu plato.
                  </span>
                </div>

                {/* BOTONES */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    type="button"
                    className="btn-action-reject full-width"
                    onClick={() => setIsPublishModalOpen(false)}
                    style={{ padding: '0.9rem', fontSize: '0.95rem' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-action-approve full-width"
                    disabled={savingDish}
                    style={{ background: '#ea580c', borderColor: '#ea580c', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 800 }}
                  >
                    {savingDish ? 'Guardando...' : dishToEdit ? '✓ Guardar Cambios' : '🚀 Publicar Plato'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS MODAL */}
      {isOrdersModalOpen && (
        <div className="finances-modal-backdrop" onClick={() => setIsOrdersModalOpen(false)}>
          <div className="finances-modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="finances-modal-header">
              <h3>Pedidos de Comida Recibidos</h3>
              <button className="close-modal-btn" onClick={() => setIsOrdersModalOpen(false)}>✕</button>
            </div>

            <div style={{ marginTop: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {activeOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📦</span>
                  <p style={{ color: '#94a3b8', margin: 0 }}>No hay pedidos registrados por el momento.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeOrders.map((order, idx) => (
                    <div key={order.id || idx} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700 }}>
                          PEDIDO #{order.id?.toString().slice(-6) || idx + 1} • {order.client?.name || 'Cliente'}
                        </span>
                        <h4 style={{ margin: '0.2rem 0', color: '#ffffff' }}>
                          {order.items?.name || 'Pedido de Comida'}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {formatPrice(order.total_price || order.total)} • Código Entrega: 🔐 <strong>{order.delivery_code || '8821'}</strong>
                        </span>
                      </div>

                      <span style={{ padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, background: order.status === 'delivered' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(234, 88, 12, 0.2)', color: order.status === 'delivered' ? '#4ade80' : '#ea580c' }}>
                        {order.status === 'delivered' ? 'ENTREGADO' : 'EN PREPARACIÓN'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantDashboard;
