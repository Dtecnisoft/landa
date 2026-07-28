import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import { isVideoUrl, getOptimizedVideoUrl } from '../services/cloudinaryService';

const FOOD_TYPE_CHIPS = [
  {
    id: 'all',
    label: 'Todos los Sabores',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=200&auto=format&fit=crop',
    icon: '🍽️',
    keywords: [],
  },
  {
    id: 'burgers',
    label: 'Burgers & Comida Rápida',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=200&auto=format&fit=crop',
    icon: '🍔',
    keywords: ['burger', 'hamburguesa', 'rápida', 'rapida', 'perro', 'fast food', 'criolla', 'combo'],
  },
  {
    id: 'pizza',
    label: 'Pizzas & Pastas',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop',
    icon: '🍕',
    keywords: ['pizza', 'pasta', 'italiana', 'napolitana', 'masa madre'],
  },
  {
    id: 'asados',
    label: 'Asados & Carnes',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200&auto=format&fit=crop',
    icon: '🥩',
    keywords: ['asado', 'carne', 'parrilla', 'bbq', 'churrasco', 'carbón', 'carbon'],
  },
  {
    id: 'saludable',
    label: 'Saludable & Ensaladas',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&auto=format&fit=crop',
    icon: '🥗',
    keywords: ['saludable', 'ensalada', 'fit', 'veggie', 'vegetariana', 'sushi', 'bowl', 'orgánico', 'organico'],
  },
  {
    id: 'postres',
    label: 'Repostería & Café',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=200&auto=format&fit=crop',
    icon: '🍰',
    keywords: ['postre', 'repostería', 'reposteria', 'café', 'cafe', 'panadería', 'panaderia', 'dulce', 'helado', 'torta'],
  },
];

function formatPrice(val) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function getDemoDishesForRestaurant(rest) {
  const type = (rest?.food_type || rest?.name || '').toLowerCase();

  if (type.includes('pizza')) {
    return [
      {
        id: 'd-1',
        name: 'Pizza Napolitana Especial',
        description: 'Masa madre, salsa artesanal de tomate fresco, queso mozzarella fundido y albahaca.',
        price: 35000,
        category: 'pizza',
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: 'd-2',
        name: 'Pizza Pepperoni Crunch',
        description: 'Doble porción de pepperoni crujiente, mezcla de quesos cheddar y mozzarella.',
        price: 39900,
        category: 'pizza',
        image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?q=80&w=400&auto=format&fit=crop',
      },
    ];
  } else if (type.includes('asado') || type.includes('carne') || type.includes('parrilla')) {
    return [
      {
        id: 'd-3',
        name: 'Picada Mixta Familiar (4 Personas)',
        description: 'Carne de res, lomo de cerdo, chorizo artesanal, chicharrón crocante, papa criolla y arepitas.',
        price: 68000,
        category: 'asados',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: 'd-4',
        name: 'Baby Beef 350g al Carbón',
        description: 'Corte de lomo tierno a la parrilla con mantequilla de hierbas, acompañado de ensalada y papas.',
        price: 42000,
        category: 'asados',
        image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=400&auto=format&fit=crop',
      },
    ];
  } else if (type.includes('saludable') || type.includes('ensalada') || type.includes('sushi')) {
    return [
      {
        id: 'd-5',
        name: 'Poke Bowl Salmón & Aguacate',
        description: 'Base de arroz sushi, salmón fresco, aguacate, edamame, mango y salsa soya ajonjolí.',
        price: 32000,
        category: 'saludable',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: 'd-6',
        name: 'Ensalada César con Pollo al Grill',
        description: 'Pechuga de pollo a la plancha, lechuga romana, crotones crujientes, queso parmesano y aderezo césar.',
        price: 26500,
        category: 'saludable',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop',
      },
    ];
  } else if (type.includes('postre') || type.includes('café') || type.includes('panader')) {
    return [
      {
        id: 'd-7',
        name: 'Cheesecake de Frutos Rojos',
        description: 'Cremoso pastel de queso al estilo artesanal con reducción de moras y arándanos silvestres.',
        price: 16000,
        category: 'postres',
        image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: 'd-8',
        name: 'Café Cappuccino de Origen + Croissant',
        description: 'Espreso doble con leche cremada al vapor acompañado de croissant caliente de mantequilla.',
        price: 12500,
        category: 'postres',
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop',
      },
    ];
  }

  return [
    {
      id: 'd-9',
      name: 'Hamburguesa Landa Doble Queso',
      description: 'Doble carne de res artesanal 180g, queso cheddar fundido, tocineta ahumada y salsa especial de la casa.',
      price: 26900,
      category: 'burgers',
      image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 'd-10',
      name: 'Combo Perro Caliente Especial + Papas',
      description: 'Salchicha suiza jumbo, tocineta, queso mozarella, papita fosforito, salsas de la casa y papas a la francesa.',
      price: 21000,
      category: 'burgers',
      image_url: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?q=80&w=400&auto=format&fit=crop',
    },
  ];
}

function Restaurantes() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedRestaurantModal, setSelectedRestaurantModal] = useState(null);
  const [modalDishes, setModalDishes] = useState([]);
  const [loadingModalDishes, setLoadingModalDishes] = useState(false);

  // Load Dishes for Selected Restaurant Modal
  useEffect(() => {
    if (!selectedRestaurantModal) {
      setModalDishes([]);
      return;
    }

    const loadModalDishes = async () => {
      setLoadingModalDishes(true);
      try {
        const { data, error } = await supabase
          .from('dishes')
          .select('*')
          .eq('restaurant_id', selectedRestaurantModal.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setModalDishes(data);
        } else {
          setModalDishes(getDemoDishesForRestaurant(selectedRestaurantModal));
        }
      } catch (e) {
        console.error('Error loading restaurant dishes:', e);
        setModalDishes(getDemoDishesForRestaurant(selectedRestaurantModal));
      } finally {
        setLoadingModalDishes(false);
      }
    };

    loadModalDishes();
  }, [selectedRestaurantModal]);

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
            name: 'Hamburguesería & Grill La Estación',
            food_type: 'Burgers & Comida Rápida',
            address: 'Calle 10 # 7-35, Centro',
            city: 'Jamundí',
            phone: '+57 315 882 9910',
            avatar: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
            rating: 4.9,
            reviewsCount: 184,
            deliveryTime: '25 - 35 min',
            deliveryFee: '$ 3.500 COP',
          },
          {
            id: 'demo-rest-2',
            name: 'Pizzería Don Mario - Masa Madre',
            food_type: 'Pizzas & Pastas Artesanales',
            address: 'Carrera 15 # 8-32, El Peñón',
            city: 'Cali',
            phone: '+57 310 443 1120',
            avatar: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
            rating: 4.8,
            reviewsCount: 210,
            deliveryTime: '30 - 45 min',
            deliveryFee: '$ 4.000 COP',
          },
          {
            id: 'demo-rest-3',
            name: 'La Parrilla de Doña Inés',
            food_type: 'Asados & Carnes al Carbón',
            address: 'Av. Circunvalar # 12-05',
            city: 'Jamundí',
            phone: '+57 320 998 7744',
            avatar: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
            rating: 4.9,
            reviewsCount: 156,
            deliveryTime: '35 - 50 min',
            deliveryFee: '$ 3.500 COP',
          },
          {
            id: 'demo-rest-4',
            name: 'Sushi Roll & Poke Bowl',
            food_type: 'Saludable & Sushi',
            address: 'Calle 12 # 5-18, Barrio Alfaguara',
            city: 'Jamundí',
            phone: '+57 318 456 7890',
            avatar: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
            rating: 4.7,
            reviewsCount: 98,
            deliveryTime: '25 - 40 min',
            deliveryFee: '$ 3.500 COP',
          },
          {
            id: 'demo-rest-5',
            name: 'Tacos & Antojitos El Mariachi',
            food_type: 'Burgers & Comida Rápida',
            address: 'Cra 10 # 14-20, Las Flores',
            city: 'Jamundí',
            phone: '+57 312 345 6789',
            avatar: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
            rating: 4.8,
            reviewsCount: 132,
            deliveryTime: '20 - 35 min',
            deliveryFee: '$ 3.000 COP',
          },
          {
            id: 'demo-rest-6',
            name: 'Molino Café & Repostería de Origen',
            food_type: 'Repostería & Café',
            address: 'Calle 5 # 22-10, Granada',
            city: 'Cali',
            phone: '+57 300 112 3388',
            avatar: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400&auto=format&fit=crop',
            status: 'approved',
            rating: 4.9,
            reviewsCount: 245,
            deliveryTime: '20 - 30 min',
            deliveryFee: '$ 3.800 COP',
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

    // 1. Search query filter
    if (q.length > 0 && !name.includes(q) && !type.includes(q) && !city.includes(q)) {
      return false;
    }

    // 2. Category chip filter
    if (selectedFilter !== 'all') {
      const activeChip = FOOD_TYPE_CHIPS.find((c) => c.id === selectedFilter);
      if (activeChip && activeChip.keywords && activeChip.keywords.length > 0) {
        const matchesKeyword = activeChip.keywords.some(
          (kw) => type.includes(kw) || name.includes(kw)
        );
        if (!matchesKeyword) return false;
      } else {
        const cleanFilter = selectedFilter.toLowerCase();
        if (!type.includes(cleanFilter) && !name.includes(cleanFilter)) {
          return false;
        }
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
            <a
              href="https://drive.google.com/file/d/1lWZQqLHgHFEpl0xMgQK4_seo1pb8Edrd/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="chip-btn"
              style={{
                background: '#ffffff',
                color: '#ea580c',
                fontWeight: 900,
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onClick={() => showToast('Abriendo enlace de descarga Landa App Móvil...', 'info', 'Descarga App')}
            >
              📲 Descargar App para Pedir
            </a>
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
          <div className="restaurant-tabs-row" style={{ overflowX: 'auto', paddingBottom: '0.2rem', display: 'flex', gap: '0.6rem' }}>
            {FOOD_TYPE_CHIPS.map((chip) => {
              const isActive = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  className={`restaurant-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(chip.id)}
                  style={{
                    borderColor: isActive ? '#f97316' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive ? 'rgba(249, 115, 22, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '20px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <img
                    src={chip.image}
                    alt={chip.label}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: isActive ? '2px solid #f97316' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                  <span className="tab-label" style={{ fontWeight: isActive ? 800 : 600 }}>{chip.label}</span>
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
                    borderRadius: '18px',
                    overflow: 'hidden',
                    background: '#0f172a',
                    transition: 'transform 0.25s ease, border-color 0.25s ease',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '175px', overflow: 'hidden' }}>
                    <img
                      src={rest.avatar || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop'}
                      alt={rest.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(16, 185, 129, 0.95)', color: '#ffffff', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 800, zIndex: 2 }}>
                      ✓ VERIFICADO
                    </span>
                    <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(4px)', color: '#f59e0b', padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, border: '1px solid rgba(245, 158, 11, 0.3)', zIndex: 2 }}>
                      ⭐ {rest.rating || '4.8'} ({rest.reviewsCount || '120+'})
                    </span>
                  </div>

                  <div style={{ padding: '1.2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.18rem', fontWeight: 800, lineHeight: 1.3 }}>
                      {rest.name || 'Restaurante Landa'}
                    </h3>

                    <span style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.84rem' }}>
                      🍴 {rest.food_type || 'Comida Criolla & Rápida'}
                    </span>

                    {/* METADATA CHIPS (TIME & DELIVERY) */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        ⏱️ {rest.deliveryTime || '25 - 35 min'}
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        🛵 Domicilio: {rest.deliveryFee || '$ 3.500 COP'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.4rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                      <span>📍 {rest.address || 'Dirección registrada'}{rest.city ? `, ${rest.city}` : ''}</span>
                      <span>📞 Contacto: {rest.phone || 'Disponible en App'}</span>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div style={{ padding: '0 1.2rem 1.2rem 1.2rem' }}>
                    <button
                      className="btn-action-approve full-width"
                      style={{ background: '#ea580c', borderColor: '#ea580c', fontSize: '0.88rem', padding: '0.8rem', fontWeight: 800 }}
                      onClick={() => setSelectedRestaurantModal(rest)}
                    >
                      🍽️ Ver Carta de Platos & Información
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

      {/* RESTAURANT DETAILS & MENU VIEWER MODAL */}
      {selectedRestaurantModal && (
        <div className="finances-modal-backdrop" onClick={() => setSelectedRestaurantModal(null)}>
          <div
            className="finances-modal-card"
            style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="finances-modal-header" style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.86rem' }}>
                <img
                  src={selectedRestaurantModal.avatar || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=200&auto=format&fit=crop'}
                  alt={selectedRestaurantModal.name}
                  style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #f97316' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: 800 }}>
                    {selectedRestaurantModal.name}
                  </h3>
                  <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.82rem' }}>
                    🍴 {selectedRestaurantModal.food_type || 'Comida Local'} • 📍 {selectedRestaurantModal.city || 'Colombia'}
                  </span>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedRestaurantModal(null)}>✕</button>
            </div>

            {/* MODAL BODY WITH SCROLL */}
            <div className="finances-modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* BANNER INFORMATIVO SOLO LECTURA */}
              <div style={{ background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '0.85rem 1rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>📲</span>
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 0.15rem 0', fontSize: '0.9rem', fontWeight: 800 }}>
                    Carta de Platos (Visualización)
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, lineHeight: 1.35 }}>
                    Explora los deliciosos platos disponibles. Para armar tu pedido, agregar adicionales y rastrear tu domicilio en mapa en tiempo real, ingresa a la <strong>App Móvil Landa</strong>.
                  </p>
                </div>
              </div>

              {/* DETALLES DE UBICACIÓN & CONTACTO */}
              <div style={{ background: '#090d16', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <span>📍 <strong>Dirección:</strong> {selectedRestaurantModal.address || 'Dirección registrada'}</span>
                <span>📞 <strong>Contacto:</strong> {selectedRestaurantModal.phone || 'Disponible en App'}</span>
              </div>

              {/* MENÚ / CARTA DE PLATOS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                    🍽️ Menú & Especialidades ({modalDishes.length})
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 700 }}>
                    Precios sugeridos en COP
                  </span>
                </div>

                {loadingModalDishes ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.3rem' }}>⏳</span>
                    Cargando carta de platos...
                  </div>
                ) : modalDishes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#090d16', borderRadius: '12px', color: '#94a3b8' }}>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.4rem' }}>🍲</span>
                    Este restaurante aún no ha publicado sus platos en la carta.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    {modalDishes.map((dish) => (
                      <div
                        key={dish.id}
                        style={{
                          background: '#090d16',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: '130px', background: '#1e293b' }}>
                          {isVideoUrl(dish.image_url) ? (
                            <video
                              src={getOptimizedVideoUrl(dish.image_url)}
                              controls
                              playsInline
                              muted
                              loop
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <img
                              src={dish.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop'}
                              alt={dish.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop'; }}
                            />
                          )}
                          <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#f97316', color: '#ffffff', padding: '0.2rem 0.55rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', zIndex: 2 }}>
                            {formatPrice(dish.price)}
                          </span>
                        </div>

                        <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <h5 style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem', fontWeight: 800 }}>{dish.name}</h5>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.35, flex: 1 }}>
                            {dish.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.75rem' }}>
              <button className="btn-action-reject full-width" onClick={() => setSelectedRestaurantModal(null)} style={{ padding: '0.85rem' }}>
                Cerrar
              </button>
              <a
                href="https://drive.google.com/file/d/1lWZQqLHgHFEpl0xMgQK4_seo1pb8Edrd/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-action-approve full-width"
                style={{
                  background: '#f97316',
                  borderColor: '#f97316',
                  padding: '0.85rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => {
                  showToast('Abriendo enlace de descarga Landa App Móvil...', 'info', 'Descarga App');
                  setSelectedRestaurantModal(null);
                }}
              >
                📲 Hacer Pedido en Landa App
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Restaurantes;
