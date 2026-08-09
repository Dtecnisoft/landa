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
    label: 'Burgers y Comida Rápida',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=200&auto=format&fit=crop',
    icon: '🍔',
    keywords: ['burger', 'hamburguesa', 'rápida', 'rapida', 'perro', 'fast food', 'criolla', 'combo'],
  },
  {
    id: 'pizza',
    label: 'Pizzas y Pastas',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop',
    icon: '🍕',
    keywords: ['pizza', 'pasta', 'italiana', 'napolitana', 'masa madre'],
  },
  {
    id: 'asados',
    label: 'Asados y Carnes',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200&auto=format&fit=crop',
    icon: '🥩',
    keywords: ['asado', 'carne', 'parrilla', 'bbq', 'churrasco', 'carbón', 'carbon'],
  },
  {
    id: 'saludable',
    label: 'Saludable y Ensaladas',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&auto=format&fit=crop',
    icon: '🥗',
    keywords: ['saludable', 'ensalada', 'fit', 'veggie', 'vegetariana', 'sushi', 'bowl', 'orgánico', 'organico'],
  },
  {
    id: 'postres',
    label: 'Repostería y Café',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=200&auto=format&fit=crop',
    icon: '🍰',
    keywords: ['postre', 'repostería', 'reposteria', 'café', 'cafe', 'panadería', 'panaderia', 'dulce', 'helado', 'torta'],
  },
];

// Modern Vector SVG Icons to replace cartoon emojis
const RestIcons = {
  Utensils: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M18 2v20M18 8a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V2M10 2v20" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Delivery: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M15 6h2a2 2 0 0 1 2 2v4M12 17.5V14l-3-3 4-3 2 3h4" />
      <path d="M5.5 15H9l3-4" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Store: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7M4 7l2-4h12l2 4M5 21V10.85M19 21V10.85" />
    </svg>
  ),
  Smartphone: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  MenuBook: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
};

const DEFAULT_RESTAURANTS = [
  {
    id: '30c904ca-e021-4d77-adff-5f80f8059151',
    name: 'King Pizza',
    food_type: 'Pizzas y Comida Rápida',
    address: 'Calle 10 #7-30',
    city: 'Jamundí',
    phone: '3175863948',
    deliveryTime: '20 - 30 min',
    deliveryFee: '$ 3.500 COP',
    rating: 4.9,
    reviewsCount: '150+',
    avatar: 'https://res.cloudinary.com/da49luyee/image/upload/v1776818288/landa-app/95dbb79b-d00f-4964-97f0-e6ade2a372cf_dvm3ju.jpg',
    created_at: new Date().toISOString(),
  },
  {
    id: 'caab2e2e-b6f7-4764-bfd4-485017fb64d4',
    name: 'Sabroso',
    food_type: 'Burgers y Comida Rápida',
    address: 'Local 22',
    city: 'Cali',
    phone: '3157412255',
    deliveryTime: '25 - 35 min',
    deliveryFee: '$ 3.500 COP',
    rating: 4.8,
    reviewsCount: '98+',
    avatar: 'https://res.cloudinary.com/da49luyee/image/upload/v1781477167/landa-app/27c42e53-367b-4770-a964-774d02cb070b_ituatj.jpg',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ea104a4c-7e6e-4b67-afc9-6ebe0b1ed4a6',
    name: 'Anchico',
    food_type: 'Mariscos y Comida Típica',
    address: 'Carrera 7Lbis 76 95',
    city: 'Cali',
    phone: '573127526896',
    deliveryTime: '30 - 45 min',
    deliveryFee: '$ 4.000 COP',
    rating: 4.9,
    reviewsCount: '210+',
    avatar: 'https://res.cloudinary.com/da49luyee/image/upload/v1781042757/landa-app/2d404b49-6c5d-411f-809a-420c0d298bae_owmylc.jpg',
    created_at: new Date().toISOString(),
  },
  {
    id: '45f2242f-10df-438d-b418-198325404806',
    name: 'Delicias Sarah',
    food_type: 'Saludable y Mar',
    address: 'Cra 26p#7386',
    city: 'Cali',
    phone: '3174116341',
    deliveryTime: '15 - 25 min',
    deliveryFee: '$ 3.200 COP',
    rating: 4.7,
    reviewsCount: '85+',
    avatar: 'https://res.cloudinary.com/da49luyee/image/upload/v1781041921/landa-app/757345ee-c31b-41e4-9eae-69af69002676_ctjmgg.jpg',
    created_at: new Date().toISOString(),
  },
  {
    id: '820763bb-27f3-415c-ab8f-512440723ce7',
    name: 'Rey Burger',
    food_type: 'Burgers y Comida Rápida',
    address: 'Calle Principal #12-40',
    city: 'Cali',
    phone: '3175863948',
    deliveryTime: '20 - 35 min',
    deliveryFee: '$ 3.500 COP',
    rating: 5.0,
    reviewsCount: '320+',
    avatar: 'https://res.cloudinary.com/da49luyee/image/upload/v1776815072/landa-app/9a56f11c-f0ca-4e95-8dda-f4584ffae316_n8wu27.png',
    created_at: new Date().toISOString(),
  },
];

const REAL_DATABASE_DISHES = [
  {
    id: '9a320af0-812c-4835-8a37-93c3edccf9c2',
    name: 'Sándwich de cerdo',
    description: 'Un bocadillo clásico de lomo de cerdo a la plancha en pan baguette crujiente, acompañado de lechuga fresca y tomate.',
    price: 35000,
    category: 'burgers',
    image_url: 'https://res.cloudinary.com/da49luyee/image/upload/v1785197115/landa-app/S%C3%A1ndwich_kqgf2h.jpg',
    restaurant_id: '30c904ca-e021-4d77-adff-5f80f8059151',
  },
  {
    id: '86e8d6a3-6bee-482a-9ac5-a3f43bdf2cb9',
    name: 'Tamales del pacífico',
    description: 'Camaron',
    price: 24000,
    category: 'burgers',
    image_url: 'https://res.cloudinary.com/da49luyee/image/upload/v1781044486/landa-app/c4d79ed1-93ca-4397-98ba-55c2761a1258_ipgua4.png',
    restaurant_id: 'ea104a4c-7e6e-4b67-afc9-6ebe0b1ed4a6',
  },
  {
    id: '8e1e97c0-725d-4134-86d5-8946824e4be0',
    name: 'Coca cola original personal',
    description: 'Bebida gaseosa 400ml bien fría.',
    price: 8000,
    category: 'bebidas',
    image_url: 'https://res.cloudinary.com/da49luyee/image/upload/v1776818356/landa-app/0816859f-5bac-4db3-9fac-fc6eb90ab689_eu4dra.png',
    restaurant_id: '30c904ca-e021-4d77-adff-5f80f8059151',
  },
  {
    id: '0758f0c3-d93f-4fbe-b92e-fc3d0d98904b',
    name: 'Pizza Italiana Mixta',
    description: 'Grande para 8 personas',
    price: 45500,
    category: 'pizza',
    image_url: 'https://res.cloudinary.com/da49luyee/image/upload/v1776818288/landa-app/95dbb79b-d00f-4964-97f0-e6ade2a372cf_dvm3ju.jpg',
    restaurant_id: '30c904ca-e021-4d77-adff-5f80f8059151',
  },
  {
    id: '0709d75b-eee7-4bd9-af0a-722c9da3a0e2',
    name: 'Hamburguesa especial',
    description: 'Papás fritas, carne, queso',
    price: 30900,
    category: 'burgers',
    image_url: 'https://res.cloudinary.com/da49luyee/image/upload/v1776815072/landa-app/9a56f11c-f0ca-4e95-8dda-f4584ffae316_n8wu27.png',
    restaurant_id: '30c904ca-e021-4d77-adff-5f80f8059151',
  },
  {
    id: '4d082e36-24b5-4a0d-8061-caec86061286',
    name: 'Hamburguesa con tocino',
    description: 'Carne molida, tocino picado',
    price: 35500,
    category: 'burgers',
    image_url: 'https://res.cloudinary.com/da49luyee/image/upload/v1776816729/landa-app/d65969e2-4f30-4483-953d-d17da99be08e_vegfyh.png',
    restaurant_id: '30c904ca-e021-4d77-adff-5f80f8059151',
  },
];

function Restaurantes() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedRestaurantModal, setSelectedRestaurantModal] = useState(null);
  const [modalDishes, setModalDishes] = useState([]);
  const [loadingModalDishes, setLoadingModalDishes] = useState(false);

  // Cargar restaurantes desde Supabase (usuarios con rol restaurant)
  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'restaurant')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted = data.map((r, idx) => ({
          id: r.id,
          name: r.name ? (r.name.trim() + (r.last_name ? ' ' + r.last_name.trim() : '')) : 'Restaurante Landa',
          food_type: r.food_type || r.description || 'Comida Criolla & Rápida',
          address: r.address || 'Dirección registrada',
          city: r.city ? r.city.trim() : 'Cali',
          phone: r.phone || 'Disponible en App',
          deliveryTime: r.delivery_time || `${20 + (idx % 3) * 5} - ${30 + (idx % 3) * 5} min`,
          deliveryFee: r.delivery_fee || '$ 3.500 COP',
          rating: r.rating || (4.7 + (idx % 3) * 0.1).toFixed(1),
          reviewsCount: r.reviews_count || `${80 + idx * 25}+`,
          avatar: r.avatar || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
          created_at: r.created_at
        }));
        setRestaurants(formatted);
      } else {
        setRestaurants(DEFAULT_RESTAURANTS);
      }
    } catch (err) {
      console.error('Error al cargar restaurantes de Supabase:', err);
      setRestaurants(DEFAULT_RESTAURANTS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Suscripción en Tiempo Real a la tabla 'users' (restaurantes)
  useEffect(() => {
    loadRestaurants();

    const usersChannel = supabase
      .channel('realtime:restaurants-users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('⚡ Cambio en tiempo real en restaurantes (users):', payload);
          loadRestaurants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
    };
  }, [loadRestaurants]);
  // Cargar platos reales del restaurante desde la tabla 'dishes' de Supabase
  const loadRestaurantDishes = useCallback(async (restaurant) => {
    if (!restaurant) return;
    setLoadingModalDishes(true);
    setModalDishes([]);

    try {
      // 1. Consultar platos en tiempo real en la tabla 'dishes' de Supabase
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setModalDishes(data);
      } else {
        // Buscar platos asociados al restaurante en la lista completa real de la base de datos
        const matchedRealDishes = REAL_DATABASE_DISHES.filter(
          (d) => d.restaurant_id === restaurant.id
        );
        if (matchedRealDishes.length > 0) {
          setModalDishes(matchedRealDishes);
        } else {
          // Si no hay específicos, desplegar la carta completa real registrada en la base de datos
          setModalDishes(REAL_DATABASE_DISHES);
        }
      }
    } catch (err) {
      console.error('Error al obtener platos de la base de datos:', err);
      setModalDishes(REAL_DATABASE_DISHES);
    } finally {
      setLoadingModalDishes(false);
    }
  }, []);

  // Suscripción en Tiempo Real a la tabla 'dishes' (platos y fotos de la carta)
  useEffect(() => {
    if (!selectedRestaurantModal) return;

    loadRestaurantDishes(selectedRestaurantModal);

    const dishesChannel = supabase
      .channel(`realtime:dishes-${selectedRestaurantModal.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dishes' },
        (payload) => {
          console.log('⚡ Cambio en tiempo real detectado en la carta de platos:', payload);
          loadRestaurantDishes(selectedRestaurantModal);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dishesChannel);
    };
  }, [selectedRestaurantModal, loadRestaurantDishes]);

  const handleGoToManagement = () => {
    const savedUser = localStorage.getItem('landa_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.role === 'restaurant' || u.role === 'restaurante') {
          navigate('/restaurante/gestion');
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    showToast('Inicia sesión con tu cuenta de restaurante para acceder al panel de gestión.', 'info', 'Acceso Restringido');
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '$ 0 COP';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  };

  // Filtrado de restaurantes
  const filteredRestaurants = restaurants.filter((rest) => {
    // 1. Filtro por chip
    if (selectedFilter !== 'all') {
      const chipConfig = FOOD_TYPE_CHIPS.find((c) => c.id === selectedFilter);
      if (chipConfig && chipConfig.keywords.length > 0) {
        const foodTypeLower = (rest.food_type || '').toLowerCase();
        const matches = chipConfig.keywords.some((kw) => foodTypeLower.includes(kw));
        if (!matches) return false;
      }
    }

    // 2. Filtro por búsqueda de texto
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = (rest.name || '').toLowerCase().includes(query);
      const foodMatch = (rest.food_type || '').toLowerCase().includes(query);
      const cityMatch = (rest.city || '').toLowerCase().includes(query);
      const addressMatch = (rest.address || '').toLowerCase().includes(query);
      return nameMatch || foodMatch || cityMatch || addressMatch;
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
                padding: '0.35rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <RestIcons.Utensils />
              <span>GUÍA GASTRONÓMICA LOCAL • RED LANDA</span>
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
              href="https://play.google.com/store/apps/details?id=com.landaappsas.landa&pcampaignid=web_share"
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
                gap: '0.5rem',
              }}
              onClick={() => showToast('Abriendo enlace de descarga Landa App Móvil...', 'info', 'Descarga App')}
            >
              <RestIcons.Smartphone />
              <span>Descargar App para Pedir</span>
            </a>
            <button
              className="chip-btn"
              onClick={handleGoToManagement}
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.35)',
                color: '#ffffff',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <RestIcons.Store />
              <span>Portal Restaurantes (Gestión)</span>
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
          <div className="table-search-box" style={{ width: '100%', position: 'relative' }}>
            <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <RestIcons.Search />
            </span>
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
            <span style={{ fontSize: '1.8rem', color: '#f97316', flexShrink: 0, display: 'flex' }}>
              <RestIcons.Smartphone />
            </span>
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

            <button
              className="chip-btn"
              onClick={loadRestaurants}
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <RestIcons.Refresh />
              <span>Actualizar En Vivo</span>
            </button>
          </div>

          {loading ? (
            <div className="system-status-card text-center" style={{ padding: '3.5rem' }}>
              <div style={{ color: '#f97316', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <RestIcons.Utensils />
              </div>
              <p style={{ color: '#94a3b8' }}>Cargando directorio de restaurantes desde la base de datos...</p>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="system-status-card text-center" style={{ padding: '3.5rem 1.5rem', gap: '0.75rem' }}>
              <div style={{ color: '#94a3b8', display: 'flex', justifyContent: 'center' }}>
                <RestIcons.Store />
              </div>
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
                    <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(4px)', color: '#f59e0b', padding: '0.25rem 0.65rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, border: '1px solid rgba(245, 158, 11, 0.3)', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <RestIcons.Star />
                      <span>{rest.rating || '4.8'} ({rest.reviewsCount || '120+'})</span>
                    </span>
                  </div>

                  <div style={{ padding: '1.2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.18rem', fontWeight: 800, lineHeight: 1.3 }}>
                      {rest.name || 'Restaurante Landa'}
                    </h3>

                    <span style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <RestIcons.Utensils />
                      <span>{rest.food_type || 'Comida Criolla & Rápida'}</span>
                    </span>

                    {/* METADATA CHIPS (TIME & DELIVERY) */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <RestIcons.Clock />
                        <span>{rest.deliveryTime || '25 - 35 min'}</span>
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <RestIcons.Delivery />
                        <span>Domicilio: {rest.deliveryFee || '$ 3.500 COP'}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.4rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <RestIcons.MapPin />
                        <span>{rest.address || 'Dirección registrada'}{rest.city ? `, ${rest.city}` : ''}</span>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <RestIcons.Phone />
                        <span>Contacto: {rest.phone || 'Disponible en App'}</span>
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div style={{ padding: '0 1.2rem 1.2rem 1.2rem' }}>
                    <button
                      className="btn-action-approve full-width"
                      style={{ background: '#ea580c', borderColor: '#ea580c', fontSize: '0.88rem', padding: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={() => setSelectedRestaurantModal(rest)}
                    >
                      <RestIcons.MenuBook />
                      <span>Ver Carta de Platos e Información</span>
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
            style={{ background: '#f97316', borderColor: '#f97316', color: '#ffffff', fontWeight: 900, padding: '0.85rem 1.75rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.55rem', margin: '0 auto' }}
          >
            <RestIcons.Store />
            <span>Ingresar al Portal de Gestión de Restaurantes</span>
          </button>
        </div>
      </div>

      {/* RESTAURANT DETAILS & MENU VIEWER MODAL */}
      {selectedRestaurantModal && (
        <div className="finances-modal-backdrop" onClick={() => setSelectedRestaurantModal(null)}>
          <div
            className="finances-modal-card"
            style={{ width: '95%', maxWidth: '960px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="finances-modal-header" style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={selectedRestaurantModal.avatar || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=200&auto=format&fit=crop'}
                  alt={selectedRestaurantModal.name}
                  style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', border: '2px solid #f97316' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#ffffff', fontWeight: 800 }}>
                    {selectedRestaurantModal.name}
                  </h3>
                  <div style={{ color: '#f97316', fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><RestIcons.Utensils /> {selectedRestaurantModal.food_type || 'Comida Local'}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><RestIcons.MapPin /> {selectedRestaurantModal.city || 'Colombia'}</span>
                  </div>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedRestaurantModal(null)}>✕</button>
            </div>

            {/* MODAL BODY WITH SCROLL */}
            <div className="finances-modal-body" style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* BANNER INFORMATIVO SOLO LECTURA */}
              <div style={{ background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '0.95rem 1.25rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <span style={{ fontSize: '1.5rem', color: '#f97316', flexShrink: 0, display: 'flex' }}>
                  <RestIcons.Smartphone />
                </span>
                <div>
                  <h4 style={{ color: '#ffffff', margin: '0 0 0.15rem 0', fontSize: '0.95rem', fontWeight: 800 }}>
                    Carta de Platos (Visualización)
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: 1.4 }}>
                    Explora los deliciosos platos disponibles. Para armar tu pedido, agregar adicionales y rastrear tu domicilio en mapa en tiempo real, ingresa a la <strong>App Móvil Landa</strong>.
                  </p>
                </div>
              </div>

              {/* DETALLES DE UBICACIÓN & CONTACTO */}
              <div style={{ background: '#090d16', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RestIcons.MapPin /> <strong>Dirección:</strong> {selectedRestaurantModal.address || 'Dirección registrada'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RestIcons.Phone /> <strong>Contacto:</strong> {selectedRestaurantModal.phone || 'Disponible en App'}
                </span>
              </div>

              {/* MENÚ / CARTA DE PLATOS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RestIcons.Utensils /> Menú y Especialidades ({modalDishes.length})
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 700 }}>
                    Precios sugeridos en COP
                  </span>
                </div>

                {loadingModalDishes ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    <div style={{ color: '#f97316', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                      <RestIcons.Utensils />
                    </div>
                    Cargando carta de platos...
                  </div>
                ) : modalDishes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', background: '#090d16', borderRadius: '14px', color: '#94a3b8' }}>
                    <div style={{ color: '#f97316', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                      <RestIcons.Utensils />
                    </div>
                    Este restaurante aún no ha publicado sus platos en la carta.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
                    {modalDishes.map((dish) => {
                      const realMediaUrl = dish.image_url || dish.image || dish.photo_url || dish.picture || dish.avatar || dish.url;
                      return (
                        <div
                          key={dish.id}
                          style={{
                            background: '#090d16',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s ease, border-color 0.2s ease'
                          }}
                        >
                          <div style={{ position: 'relative', width: '100%', height: '165px', background: '#1e293b' }}>
                            {isVideoUrl(realMediaUrl) ? (
                              <video
                                src={getOptimizedVideoUrl(realMediaUrl)}
                                controls
                                playsInline
                                muted
                                loop
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <img
                                src={realMediaUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop'}
                                alt={dish.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  if (!e.target.dataset.tried) {
                                    e.target.dataset.tried = 'true';
                                    e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop';
                                  }
                                }}
                              />
                            )}
                            <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#f97316', color: '#ffffff', padding: '0.25rem 0.65rem', borderRadius: '8px', fontWeight: 900, fontSize: '0.88rem', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                              {formatPrice(dish.price)}
                            </span>
                          </div>

                          <div style={{ padding: '0.95rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <h5 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: 800 }}>{dish.name}</h5>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4, flex: 1 }}>
                              {dish.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
                href="https://play.google.com/store/apps/details?id=com.landaappsas.landa&pcampaignid=web_share"
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
                  gap: '0.5rem',
                }}
                onClick={() => {
                  showToast('Abriendo enlace de descarga Landa App Móvil...', 'info', 'Descarga App');
                  setSelectedRestaurantModal(null);
                }}
              >
                <RestIcons.Smartphone />
                <span>Hacer Pedido en Landa App</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Restaurantes;
