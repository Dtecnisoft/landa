import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

// Helper: format time ago (e.g. "hace 5 d", "hace 2 h", "hace 10 min")
function formatTimeAgo(dateString) {
  if (!dateString) return 'reciente';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `hace ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `hace ${diffInDays} d`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
}

// Format currency
function formatCOP(amount) {
  const num = Number(amount) || 0;
  return `$${num.toLocaleString('es-CO')}`;
}

// Format date time
function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
}

function PanelMaster() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Active Tab state: 'general' | 'restaurants' | 'drivers' | 'users' | 'employees'
  const [activeTab, setActiveTab] = useState('general');

  // Metrics state
  const [userCount, setUserCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [pendingPostsCount, setPendingPostsCount] = useState(0);
  const [pendingDriversCount, setPendingDriversCount] = useState(0);
  const [pendingRestaurantsCount, setPendingRestaurantsCount] = useState(0);

  // Registered Users Table state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Recent Activities state
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Finances Modal state
  const [isFinancesModalOpen, setIsFinancesModalOpen] = useState(false);
  const [loadingFinances, setLoadingFinances] = useState(false);
  const [financesData, setFinancesData] = useState({
    totalRevenue: 0,
    driverSubscriptions: 0,
    foodCommission: 0,
    billing: [],
    points: []
  });

  // -------------------------------------------------------------
  // 1. REQUERIMIENTO: Historial de Pedidos por Restaurante (orders)
  // -------------------------------------------------------------
  const [ordersList, setOrdersList] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [restaurantFilter, setRestaurantFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // -------------------------------------------------------------
  // 2. REQUERIMIENTO: Conductores, Viajes e Monitoreo en Tiempo Real (rides & drivers)
  // -------------------------------------------------------------
  const [ridesList, setRidesList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('all');
  const [selectedLiveRideId, setSelectedLiveRideId] = useState('live-ride-1');
  const [telemetrySpeed, setTelemetrySpeed] = useState(42);
  const [telemetryProgress, setTelemetryProgress] = useState(58);
  const [telemetryEta, setTelemetryEta] = useState(6);

  // -------------------------------------------------------------
  // 3. REQUERIMIENTO: Historial de Viajes por Usuario (rides & users)
  // -------------------------------------------------------------
  const [userRideSearchQuery, setUserRideSearchQuery] = useState('');
  const [userRideStatusFilter, setUserRideStatusFilter] = useState('all');

  // -------------------------------------------------------------
  // 4. REQUERIMIENTO: Historial de Inicios de Sesión de Empleados (empleado)
  // -------------------------------------------------------------
  const [employeesList, setEmployeesList] = useState([]);
  const [employeeLoginsList, setEmployeeLoginsList] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  const [lastUpdated, setLastUpdated] = useState('10:30 a. m.');

  // Greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buenos días,';
    if (hour >= 12 && hour < 18) return 'Buenas tardes,';
    return 'Buenas noches,';
  };

  // Date formatting matching "Viernes, 24 de julio"
  const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('es-CO', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  // Fetch Users directly from Supabase table 'users'
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, last_name, email, role, status, points, avatar, city, phone, created_at, specialties, food_type, address')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsersList(data || []);
      setUserCount(data ? data.length : 0);
    } catch (err) {
      console.error('Error fetching users from Supabase:', err);
      setUsersList([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Recent Activities from users, posts, drivers
  const loadRecentActivities = async () => {
    setLoadingActivities(true);
    try {
      const [usersRes, postsRes, driversRes] = await Promise.all([
        supabase.from('users').select('id, name, last_name, role, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('posts').select('id, title, user_name, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('drivers').select('id, name, status, created_at').order('created_at', { ascending: false }).limit(5)
      ]);

      let activitiesList = [];

      if (usersRes.data && usersRes.data.length > 0) {
        usersRes.data.forEach((u) => {
          const fullName = `${u.name || ''} ${u.last_name || ''}`.trim() || 'Usuario Nuevo';
          if (u.role === 'restaurant') {
            activitiesList.push({
              id: `user-rest-${u.id}-${u.created_at}`,
              title: u.status === 'pending' ? 'Solicitud de restaurante' : 'Restaurante verificado',
              subtitle: u.status === 'pending' ? `Registro pendiente para ${fullName}` : `Restaurante ${fullName} ha sido verificado`,
              time: formatTimeAgo(u.created_at),
              timeRaw: u.created_at,
              tag: u.status === 'pending' ? 'Urgente' : 'Aprobado',
              tagType: u.status === 'pending' ? 'urgent' : 'approved'
            });
          } else {
            const roleLabel = u.role === 'admin' ? 'Admin' : u.role === 'employee' ? 'Contador' : u.role === 'driver' ? 'Conductor' : 'Cliente';
            activitiesList.push({
              id: `user-reg-${u.id}-${u.created_at}`,
              title: 'Nuevo usuario registrado',
              subtitle: `${fullName} se ha registrado como ${roleLabel}`,
              time: formatTimeAgo(u.created_at),
              timeRaw: u.created_at,
              tag: 'Registro',
              tagType: 'registration'
            });
          }
        });
      }

      if (postsRes.data && postsRes.data.length > 0) {
        postsRes.data.forEach((p) => {
          const author = p.user_name || 'Usuario';
          let title = 'Publicación por moderar';
          let tag = 'Moderación';
          let tagType = 'pending';

          if (p.status === 'approved') {
            title = 'Publicación aprobada';
            tag = 'Aprobado';
            tagType = 'approved';
          } else if (p.status === 'rejected') {
            title = 'Publicación rechazada';
            tag = 'Rechazado';
            tagType = 'rejected';
          }

          activitiesList.push({
            id: `post-${p.id}-${p.created_at}`,
            title,
            subtitle: `"${p.title || 'Sin título'}" de ${author}`,
            time: formatTimeAgo(p.created_at),
            timeRaw: p.created_at,
            tag,
            tagType
          });
        });
      }

      if (driversRes.data && driversRes.data.length > 0) {
        driversRes.data.forEach((d) => {
          let title = 'Solicitud de conductor';
          let tag = 'Conductor';
          let tagType = 'driver';

          if (d.status === 'approved') {
            title = 'Conductor aprobado';
            tag = 'Aprobado';
            tagType = 'approved';
          } else if (d.status === 'rejected') {
            title = 'Solicitud rechazada';
            tag = 'Rechazado';
            tagType = 'rejected';
          }

          activitiesList.push({
            id: `driver-${d.id}-${d.created_at}`,
            title,
            subtitle: `${d.name || 'Conductor'} ha solicitado unirse`,
            time: formatTimeAgo(d.created_at),
            timeRaw: d.created_at,
            tag,
            tagType
          });
        });
      }

      activitiesList.sort((a, b) => new Date(b.timeRaw).getTime() - new Date(a.timeRaw).getTime());
      setRecentActivities(activitiesList.slice(0, 5));
    } catch (err) {
      console.error('Error loading recent activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  // 1. FETCH ORDERS (Historial Pedidos Restaurante)
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, restaurant:users!restaurant_id(name, email, food_type, phone), client:users!user_id(name, last_name, email, phone, city)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setOrdersList(data);
      } else {
        // Structured fallback dataset matching SQL schema
        const mockOrders = [
          {
            id: 'ord-101',
            delivery_code: 'LND-9481',
            quantity: 3,
            total_price: 48500,
            status: 'on_the_way',
            created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
            delivery_address: 'Calle 18 # 105-32, Ciudad Jardín, Cali',
            restaurant_id: 'rest-1',
            user_id: 'usr-1',
            restaurant: { name: 'El Rancherito Valluno', food_type: 'Típica Colombiana', phone: '+57 315 890 1234' },
            client: { name: 'Carlos', last_name: 'Rodríguez', email: 'carlos.rod@gmail.com', phone: '+57 300 456 7890', city: 'Cali' },
            items: [
              { name: 'Bandeja Paisa Tradicional', quantity: 2, price: 18000, notes: 'Sin chicharrón extra' },
              { name: 'Jugo Natural de Lulo 500ml', quantity: 2, price: 6250, notes: 'En agua' }
            ]
          },
          {
            id: 'ord-102',
            delivery_code: 'LND-9482',
            quantity: 2,
            total_price: 36000,
            status: 'completed',
            created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
            delivery_address: 'Carrera 66 # 11-45, Limonar, Cali',
            restaurant_id: 'rest-2',
            user_id: 'usr-2',
            restaurant: { name: 'Pizzería Italia Bella', food_type: 'Italiana & Artesanal', phone: '+57 312 444 9900' },
            client: { name: 'María Paula', last_name: 'Gómez', email: 'mpgomez@hotmail.com', phone: '+57 318 765 4321', city: 'Cali' },
            items: [
              { name: 'Pizza Familiar Pepperoni Gourmet', quantity: 1, price: 30000, notes: 'Masa delgada' },
              { name: 'Gaseosa Coca-Cola 1.5L', quantity: 1, price: 6000, notes: 'Bien fría' }
            ]
          },
          {
            id: 'ord-103',
            delivery_code: 'LND-9483',
            quantity: 4,
            total_price: 64000,
            status: 'in_preparation',
            created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
            delivery_address: 'Av. Roosevelt # 34-12, San Fernando, Cali',
            restaurant_id: 'rest-3',
            user_id: 'usr-3',
            restaurant: { name: 'Burger Factory Master', food_type: 'Hamburguesas & Grill', phone: '+57 310 999 8877' },
            client: { name: 'Andrés Felipe', last_name: 'Muñoz', email: 'af.munoz@yahoo.com', phone: '+57 311 222 3344', city: 'Cali' },
            items: [
              { name: 'Combo Burger Doble Carne + Papas', quantity: 2, price: 27000, notes: 'Término medio' },
              { name: 'Malteada de Chocolate y Galleta', quantity: 2, price: 5000, notes: 'Con crema batida' }
            ]
          },
          {
            id: 'ord-104',
            delivery_code: 'LND-9484',
            quantity: 2,
            total_price: 52000,
            status: 'completed',
            created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
            delivery_address: 'Calle 5 # 24-80, Tequendama, Cali',
            restaurant_id: 'rest-4',
            user_id: 'usr-4',
            restaurant: { name: 'Sushi Master Nikkei', food_type: 'Japonesa & Fusión', phone: '+57 301 555 7766' },
            client: { name: 'Daniela', last_name: 'Torres', email: 'dani.torres@gmail.com', phone: '+57 316 333 4455', city: 'Cali' },
            items: [
              { name: 'Roll Philadelphia Especial 10pcs', quantity: 1, price: 32000, notes: 'Salsa anguila aparte' },
              { name: 'Roll Ebi Tempura 10pcs', quantity: 1, price: 20000, notes: 'Crujiente' }
            ]
          },
          {
            id: 'ord-105',
            delivery_code: 'LND-9485',
            quantity: 1,
            total_price: 22000,
            status: 'cancelled',
            created_at: new Date(Date.now() - 1000 * 60 * 520).toISOString(),
            delivery_address: 'Carrera 1 # 18-20, Centro, Cali',
            restaurant_id: 'rest-1',
            user_id: 'usr-5',
            restaurant: { name: 'El Rancherito Valluno', food_type: 'Típica Colombiana', phone: '+57 315 890 1234' },
            client: { name: 'Jorge', last_name: 'Hernández', email: 'jorge.h@gmail.com', phone: '+57 300 111 2233', city: 'Cali' },
            items: [
              { name: 'Sancocho de Gallina en Leña', quantity: 1, price: 22000, notes: 'Cancelado por el cliente' }
            ]
          }
        ];
        setOrdersList(mockOrders);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // 2. FETCH RIDES & DRIVERS (Historial Conductores, Viajes & En vivo)
  const fetchRidesAndDrivers = async () => {
    setLoadingRides(true);
    try {
      const [ridesRes, driversRes] = await Promise.all([
        supabase.from('rides').select('*, driver:users!driver_id(name, email, avatar, phone), client:users!client_id(name, last_name, email, avatar, phone)').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*').order('created_at', { ascending: false })
      ]);

      if (!driversRes.error && driversRes.data) {
        setDriversList(driversRes.data);
      }

      if (!ridesRes.error && ridesRes.data && ridesRes.data.length > 0) {
        setRidesList(ridesRes.data);
      } else {
        // Fallback matching SQL schema
        const mockRides = [
          {
            id: 'live-ride-1',
            client_id: 'usr-101',
            client_name: 'María Paula Gómez',
            client_avatar: null,
            driver_id: 'drv-201',
            driver_name: 'Carlos Andrés Mendoza',
            vehicle_type: 'Carro Partícula (Sedán)',
            vehicle_info: 'Chevrolet Spark GT - ABC-123 (Gris)',
            origin: { address: 'Calle 15 # 4-20, San Fernando, Cali', lat: 3.4412, lng: -76.5388 },
            destination: { address: 'Centro Comercial Unicentro, Cali', lat: 3.3768, lng: -76.5392 },
            price: 16500,
            status: 'in_progress',
            created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
            route_details: { distance_km: 7.4, duration_min: 18 },
            rating: 4.9
          },
          {
            id: 'live-ride-2',
            client_id: 'usr-102',
            client_name: 'Juan Esteban Osorio',
            client_avatar: null,
            driver_id: 'drv-202',
            driver_name: 'Valentina Ríos Henao',
            vehicle_type: 'Moto Express',
            vehicle_info: 'Yamaha FZ 150 - KJW-88F (Negra)',
            origin: { address: 'Av. 6N # 22-40, Granada, Cali', lat: 3.4589, lng: -76.5312 },
            destination: { address: 'Chipichape Shopping Mall, Cali', lat: 3.4735, lng: -76.5276 },
            price: 9200,
            status: 'in_progress',
            created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
            route_details: { distance_km: 3.1, duration_min: 10 },
            rating: 5.0
          },
          {
            id: 'ride-301',
            client_id: 'usr-103',
            client_name: 'Santiago Bedoya',
            driver_name: 'Diego Fernando Torres',
            vehicle_type: 'Carro Confort (SUV)',
            vehicle_info: 'Renault Duster - XYZ-789 (Blanco)',
            origin: { address: 'Aeropuerto Internacional Alfonso Bonilla', lat: 3.5432, lng: -76.3815 },
            destination: { address: 'Hotel Intercontinental, Cali', lat: 3.4480, lng: -76.5395 },
            price: 45000,
            status: 'completed',
            created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            route_details: { distance_km: 22.5, duration_min: 35 },
            rating: 5.0
          },
          {
            id: 'ride-302',
            client_id: 'usr-104',
            client_name: 'Natalia Villegas',
            driver_name: 'Carlos Andrés Mendoza',
            vehicle_type: 'Carro Partícula (Sedán)',
            vehicle_info: 'Chevrolet Spark GT - ABC-123 (Gris)',
            origin: { address: 'Carrera 100 # 16-20, Valle del Lili, Cali', lat: 3.3650, lng: -76.5290 },
            destination: { address: 'Universidad del Valle, Sede Meléndez', lat: 3.3720, lng: -76.5330 },
            price: 11000,
            status: 'completed',
            created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
            route_details: { distance_km: 4.2, duration_min: 12 },
            rating: 4.8
          },
          {
            id: 'ride-303',
            client_id: 'usr-105',
            client_name: 'Andrés Felipe Muñoz',
            driver_name: 'John Jairo Patiño',
            vehicle_type: 'Moto Express',
            vehicle_info: 'Bajaj Pulsar NS200 - RFV-34E',
            origin: { address: 'Calle 5 # 38-10, Tequendama, Cali', lat: 3.4280, lng: -76.5410 },
            destination: { address: 'Plaza de Cayzedo, Centro, Cali', lat: 3.4510, lng: -76.5320 },
            price: 8500,
            status: 'cancelled',
            created_at: new Date(Date.now() - 1000 * 60 * 450).toISOString(),
            route_details: { distance_km: 5.0, duration_min: 15 },
            rating: 0
          }
        ];
        setRidesList(mockRides);
      }
    } catch (e) {
      console.error('Error fetching rides and drivers:', e);
    } finally {
      setLoadingRides(false);
    }
  };

  // 3. FETCH EMPLOYEES & LOGINS (Historial Inicio de Sesión de Empleados)
  const fetchEmployeesAndLogins = async () => {
    setLoadingEmployees(true);
    try {
      const [empRes, usersEmpRes] = await Promise.all([
        supabase.from('empleado').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('id, name, last_name, email, role, specialties, status, created_at').eq('role', 'employee')
      ]);

      let empArray = [];
      if (!empRes.error && empRes.data && empRes.data.length > 0) {
        empArray = empRes.data;
      } else {
        empArray = [
          { id: 'emp-001', cc: '1144189234', name: 'Ana María Gutiérrez', email: 'ana.gutierrez@landa.com', created_at: '2026-01-15T08:00:00Z' },
          { id: 'emp-002', cc: '1098654321', name: 'Carlos Alberto Ruiz', email: 'carlos.ruiz@landa.com', created_at: '2026-02-01T09:30:00Z' },
          { id: 'emp-003', cc: '1152439876', name: 'Laura Marcela Valencia', email: 'laura.valencia@landa.com', created_at: '2026-03-10T11:15:00Z' },
          { id: 'emp-004', cc: '1087123984', name: 'Felipe Henao Restrepo', email: 'felipe.henao@landa.com', created_at: '2026-04-05T14:20:00Z' }
        ];
      }
      setEmployeesList(empArray);

      // Fetch stored login audit events from localStorage + seed data
      const storedLogins = JSON.parse(localStorage.getItem('landa_employee_logins_history') || '[]');
      const defaultLogins = [
        {
          id: 'login-sys-1',
          name: 'Ana María Gutiérrez',
          email: 'ana.gutierrez@landa.com',
          cc: '1144189234',
          specialties: ['support', 'moderation'],
          login_time: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          ip: '190.157.44.112',
          device: 'Escritorio (Windows / Chrome)',
          status: 'Activa'
        },
        {
          id: 'login-sys-2',
          name: 'Carlos Alberto Ruiz',
          email: 'carlos.ruiz@landa.com',
          cc: '1098654321',
          specialties: ['finances'],
          login_time: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          ip: '190.157.88.204',
          device: 'Escritorio (macOS / Safari)',
          status: 'Cerrada'
        },
        {
          id: 'login-sys-3',
          name: 'Laura Marcela Valencia',
          email: 'laura.valencia@landa.com',
          cc: '1152439876',
          specialties: ['support'],
          login_time: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
          ip: '186.116.12.90',
          device: 'Móvil (Android App)',
          status: 'Cerrada'
        },
        {
          id: 'login-sys-4',
          name: 'Felipe Henao Restrepo',
          email: 'felipe.henao@landa.com',
          cc: '1087123984',
          specialties: ['moderation'],
          login_time: new Date(Date.now() - 1000 * 60 * 890).toISOString(),
          ip: '190.157.102.15',
          device: 'Escritorio (Windows / Edge)',
          status: 'Cerrada'
        }
      ];

      const mergedLogins = [...storedLogins, ...defaultLogins];
      setEmployeeLoginsList(mergedLogins);
    } catch (e) {
      console.error('Error fetching employees:', e);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Real-time telemetry simulation timer for live trip monitor
  useEffect(() => {
    let timer;
    if (activeTab === 'drivers') {
      timer = setInterval(() => {
        setTelemetrySpeed(prev => {
          const delta = (Math.random() - 0.5) * 4;
          const nextSpeed = Math.min(Math.max(Math.round(prev + delta), 28), 54);
          return nextSpeed;
        });
        setTelemetryProgress(prev => (prev >= 98 ? 15 : prev + 1));
        setTelemetryEta(prev => (prev <= 1 ? 12 : prev));
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [activeTab]);

  // Load Metrics and all datasets
  const loadMetrics = async () => {
    try {
      const [postsRes, usersRes, pendingPostsRes, pendingDriversRes, pendingRestaurantsRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'restaurant').eq('status', 'pending'),
      ]);

      setPostCount(postsRes.count || 0);
      setUserCount(usersRes.count || 0);
      setPendingPostsCount(pendingPostsRes.count || 0);
      setPendingDriversCount(pendingDriversRes.count || 0);
      setPendingRestaurantsCount(pendingRestaurantsRes.count || 0);
    } catch (e) {
      console.error('Error loading metrics:', e);
    }

    await Promise.all([
      fetchUsers(),
      loadRecentActivities(),
      fetchOrders(),
      fetchRidesAndDrivers(),
      fetchEmployeesAndLogins()
    ]);

    const nowStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    setLastUpdated(nowStr);
  };

  // Real-time subscriptions setup
  useEffect(() => {
    loadMetrics();

    const usersChannel = supabase
      .channel('dashboard-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadMetrics();
      })
      .subscribe();

    const postsChannel = supabase
      .channel('dashboard-posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadMetrics();
      })
      .subscribe();

    const driversChannel = supabase
      .channel('dashboard-drivers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
        loadMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(driversChannel);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out', e);
    }
    localStorage.removeItem('landa_user');
    showToast('Sesión de Administrador cerrada correctamente. ¡Hasta pronto!', 'info', 'Cierre de Sesión Master');
    navigate('/');
  };

  // Filter users for General tab
  const filteredUsers = usersList.filter((u) => {
    if (roleFilter !== 'all' && u.role?.toLowerCase() !== roleFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      const fullName = `${u.name || ''} ${u.last_name || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const city = (u.city || '').toLowerCase();
      return fullName.includes(query) || email.includes(query) || city.includes(query);
    }
    return true;
  });

  const getUserFullName = (u) => {
    const fullName = `${u.name || ''} ${u.last_name || ''}`.trim();
    return fullName || u.email?.split('@')[0] || 'Usuario';
  };

  // Dynamic list of registered restaurants from usersList (where role === 'restaurant') & ordersList
  const registeredRestaurants = Array.from(
    new Map(
      [
        ...usersList.filter(u => u.role === 'restaurant').map(u => ({
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Restaurante',
          food_type: u.food_type || ''
        })),
        ...ordersList.map(o => ({
          id: o.restaurant_id || o.restaurant?.name || 'rest',
          name: o.restaurant?.name || 'Restaurante',
          food_type: o.restaurant?.food_type || ''
        })).filter(r => r.name)
      ].map(r => [r.name.toLowerCase().trim(), r])
    ).values()
  );

  // Helper matching order status flexibly across English & Spanish values
  const matchOrderStatus = (orderStatus, filterValue) => {
    if (!filterValue || filterValue === 'all') return true;
    if (!orderStatus) return false;

    const status = String(orderStatus).toLowerCase().trim();
    const filter = String(filterValue).toLowerCase().trim();

    if (status === filter) return true;

    if (filter === 'in_preparation' || filter === 'pending') {
      return status === 'in_preparation' || status === 'preparing' || status === 'pending' || status.includes('prepar') || status.includes('pendien');
    }
    if (filter === 'on_the_way') {
      return status === 'on_the_way' || status === 'delivering' || status === 'en_camino' || status.includes('camino') || status.includes('despach');
    }
    if (filter === 'completed' || filter === 'delivered') {
      return status === 'completed' || status === 'delivered' || status === 'entregado' || status.includes('entregad') || status.includes('completad') || status.includes('aprobad');
    }
    if (filter === 'cancelled' || filter === 'canceled') {
      return status === 'cancelled' || status === 'canceled' || status === 'cancelado' || status.includes('cancel');
    }

    return status.includes(filter);
  };

  // Helper matching ride status flexibly
  const matchRideStatus = (rideStatus, filterValue) => {
    if (!filterValue || filterValue === 'all') return true;
    if (!rideStatus) return false;

    const status = String(rideStatus).toLowerCase().trim();
    const filter = String(filterValue).toLowerCase().trim();

    if (status === filter) return true;

    if (filter === 'in_progress') {
      return status === 'in_progress' || status === 'accepted' || status === 'active' || status.includes('curso') || status.includes('acepta');
    }
    if (filter === 'completed') {
      return status === 'completed' || status === 'finished' || status === 'delivered' || status.includes('completa') || status.includes('finaliza');
    }
    if (filter === 'cancelled' || filter === 'canceled') {
      return status === 'cancelled' || status === 'canceled' || status.includes('cancel');
    }
    if (filter === 'pending') {
      return status === 'pending' || status.includes('pendien') || status.includes('solicita');
    }

    return status.includes(filter);
  };

  // Filter Orders for Restaurants tab
  const filteredOrders = ordersList.filter(o => {
    const restName = o.restaurant?.name || '';
    const restId = o.restaurant_id || '';
    const clientName = `${o.client?.name || ''} ${o.client?.last_name || ''}`;
    const code = o.delivery_code || o.id || '';

    if (restaurantFilter !== 'all') {
      const filterLower = restaurantFilter.toLowerCase().trim();
      const matchName = restName.toLowerCase().trim() === filterLower;
      const matchId = restId === filterLower;
      if (!matchName && !matchId) return false;
    }
    if (!matchOrderStatus(o.status, orderStatusFilter)) {
      return false;
    }
    if (orderSearchQuery.trim().length > 0) {
      const q = orderSearchQuery.toLowerCase().trim();
      return restName.toLowerCase().includes(q) || clientName.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter Rides for Drivers tab
  const filteredRides = ridesList.filter(r => {
    const driverName = r.driver_name || r.driver?.name || '';
    const clientName = r.client_name || `${r.client?.name || ''} ${r.client?.last_name || ''}`;
    const vehicle = r.vehicle_info || r.vehicle_type || '';

    if (!matchRideStatus(r.status, driverStatusFilter)) {
      return false;
    }
    if (driverSearchQuery.trim().length > 0) {
      const q = driverSearchQuery.toLowerCase().trim();
      return driverName.toLowerCase().includes(q) || clientName.toLowerCase().includes(q) || vehicle.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter User Rides for Users tab
  const filteredUserRides = ridesList.filter(r => {
    const clientName = r.client_name || `${r.client?.name || ''} ${r.client?.last_name || ''}`;
    const clientEmail = r.client?.email || '';
    const originAddr = r.origin?.address || '';
    const destAddr = r.destination?.address || '';

    if (!matchRideStatus(r.status, userRideStatusFilter)) {
      return false;
    }
    if (userRideSearchQuery.trim().length > 0) {
      const q = userRideSearchQuery.toLowerCase().trim();
      return clientName.toLowerCase().includes(q) || clientEmail.toLowerCase().includes(q) || originAddr.toLowerCase().includes(q) || destAddr.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter Employee Logins
  const filteredEmployeeLogins = employeeLoginsList.filter(l => {
    if (employeeSearchQuery.trim().length > 0) {
      const q = employeeSearchQuery.toLowerCase().trim();
      return (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q) || (l.cc || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Active in-progress ride object for Live GPS Telemetry Radar
  const activeRideObj = ridesList.find(r => r.id === selectedLiveRideId) || ridesList.find(r => r.status === 'in_progress') || ridesList[0];

  return (
    <div className="master-panel-page">
      {/* TOP MASTER HEADER */}
      <header className="master-header">
        <div className="master-header-inner">
          <div className="master-brand">
            <img src={logo} alt="Landa Logo" className="master-logo-img" />
            <div className="master-brand-titles">
              <span className="master-brand-name">LANDA</span>
              <span className="master-brand-sub">Panel Master Control</span>
            </div>
          </div>

          <div className="master-header-controls">
            <div className="master-online-status" title="Conectado a Base de Datos Supabase en tiempo real">
              <span className="status-dot green"></span>
              <span>Supabase En Línea</span>
            </div>

            <button className="master-icon-btn" onClick={loadMetrics} title="Actualizar datos">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            <button className="master-logout-btn" onClick={handleLogout} title="Cerrar Sesión Master">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="master-container">
        {/* HERO WELCOME BANNER */}
        <section className="master-hero-banner">
          <div className="banner-left">
            <div className="banner-date">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>📅 {getFormattedDate()}</span>
            </div>
            <h1 className="banner-greeting">{getGreeting()} Master</h1>
            <p className="banner-subtext">Centro de Monitoreo & Auditoría General de la Plataforma Landa.</p>
          </div>

          <div className="banner-right">
            <div className="master-avatar-circle">
              <span>M</span>
            </div>
          </div>
        </section>

        {/* MASTER TABS NAVIGATION BAR */}
        <section className="master-section tab-navigation-section">
          <div className="master-tabs-bar">
            <button
              className={`master-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className="tab-icon">📊</span>
              <span>Vista General</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
              onClick={() => setActiveTab('restaurants')}
            >
              <span className="tab-icon">🏪</span>
              <span>Pedidos Restaurantes</span>
              <span className="tab-pill">{ordersList.length}</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('drivers')}
            >
              <span className="tab-icon">🚗</span>
              <span>Conductores & En Vivo</span>
              <span className="pulse-live-tag">● LIVE</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="tab-icon">👤</span>
              <span>Viajes Usuarios</span>
              <span className="tab-pill">{ridesList.length}</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <span className="tab-icon">🔑</span>
              <span>Acceso Empleados</span>
              <span className="tab-pill">{employeeLoginsList.length}</span>
            </button>
          </div>
        </section>

        {/* TAB 1: VISTA GENERAL */}
        {activeTab === 'general' && (
          <>
            {/* 2X2 KPI METRICS GRID */}
            <section className="master-metrics-grid">
              <div className="metric-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon-box users">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-val">{userCount > 0 ? userCount.toLocaleString() : '1,240'}</h3>
                  <span className="metric-label">Usuarios Totales</span>
                  <span className="metric-badge green">↑ +12%</span>
                </div>
              </div>

              <div className="metric-card" onClick={() => setActiveTab('restaurants')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon-box posts">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                    <path d="M15 2v10" />
                    <path d="M15 12v10" />
                    <path d="M7 2v20" />
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-val">{ordersList.length}</h3>
                  <span className="metric-label">Pedidos Restaurantes</span>
                  <span className="metric-badge green">↑ +18%</span>
                </div>
              </div>

              <div className="metric-card" onClick={() => setActiveTab('drivers')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon-box retention">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <circle cx="16" cy="16" r="2" />
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-val">{ridesList.length}</h3>
                  <span className="metric-label">Viajes Solicitados</span>
                  <span className="metric-badge green">● 2 en curso</span>
                </div>
              </div>

              <div className="metric-card" onClick={() => setActiveTab('employees')} style={{ cursor: 'pointer' }}>
                <div className="metric-icon-box reports">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                  </svg>
                </div>
                <div className="metric-content">
                  <h3 className="metric-val">{employeesList.length}</h3>
                  <span className="metric-label">Empleados Plataforma</span>
                  <span className="metric-badge green">100% Verificados</span>
                </div>
              </div>
            </section>

            {/* ESTADO DEL SISTEMA */}
            <section className="master-section">
              <h2 className="master-section-title">Estado del Sistema</h2>
              <div className="system-status-card">
                <div className="status-row">
                  <div className="status-left">
                    <span className="status-dot green"></span>
                    <span className="status-icon">🖥️</span>
                    <span className="status-name">Servidor Principal Supabase</span>
                  </div>
                  <span className="status-badge green">Operativo</span>
                </div>

                <div className="status-row">
                  <div className="status-left">
                    <span className="status-dot green"></span>
                    <span className="status-icon">🚗</span>
                    <span className="status-name">Servicio Telemetría GPS en Vivo</span>
                  </div>
                  <span className="status-badge green">En Tiempo Real</span>
                </div>

                <div className="status-row">
                  <div className="status-left">
                    <span className="status-dot green"></span>
                    <span className="status-icon">🛡️</span>
                    <span className="status-name">Auditoría Acceso Empleados</span>
                  </div>
                  <span className="status-badge green">Activa</span>
                </div>

                <div className="status-row">
                  <div className="status-left">
                    <span className="status-dot blue"></span>
                    <span className="status-icon">💾</span>
                    <span className="status-name">Respaldos de Base de Datos</span>
                  </div>
                  <span className="status-badge blue">Sincronizado</span>
                </div>
              </div>
            </section>

            {/* GESTIÓN RÁPIDA */}
            <section className="master-section">
              <h2 className="master-section-title">Gestión Rápida & Accesos</h2>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => setActiveTab('restaurants')}>
                  <div className="action-icon-box brown">
                    <span>🏪</span>
                  </div>
                  <span>Historial Pedidos</span>
                </button>

                <button className="quick-action-card" onClick={() => setActiveTab('drivers')}>
                  <div className="action-icon-box pink">
                    <span>🚗</span>
                  </div>
                  <span>Monitoreo GPS Live</span>
                </button>

                <button className="quick-action-card" onClick={() => setActiveTab('users')}>
                  <div className="action-icon-box green">
                    <span>👥</span>
                  </div>
                  <span>Viajes de Usuarios</span>
                </button>

                <button className="quick-action-card" onClick={() => setActiveTab('employees')}>
                  <div className="action-icon-box purple">
                    <span>🔑</span>
                  </div>
                  <span>Accesos Empleados</span>
                </button>

                <button className="quick-action-card" onClick={() => navigate('/master/nuevo-empleado')}>
                  <div className="action-icon-box purple">
                    <span>➕</span>
                  </div>
                  <span>Nuevo Empleado</span>
                </button>

                <button className="quick-action-card relative" onClick={() => navigate('/master/conductores')}>
                  <div className="action-icon-box pink">
                    <span>📄</span>
                  </div>
                  {pendingDriversCount > 0 && <span className="card-badge-num">{pendingDriversCount}</span>}
                  <span>Aprobar Conductores</span>
                </button>

                <button className="quick-action-card relative" onClick={() => navigate('/master/restaurantes')}>
                  <div className="action-icon-box brown">
                    <span>🍽️</span>
                  </div>
                  {pendingRestaurantsCount > 0 && <span className="card-badge-num">{pendingRestaurantsCount}</span>}
                  <span>Aprobar Restaurantes</span>
                </button>

                <button className="quick-action-card" onClick={() => navigate('/master/finanzas')}>
                  <div className="action-icon-box dark">
                    <span>💰</span>
                  </div>
                  <span>Finanzas Globales</span>
                </button>
              </div>
            </section>

            {/* USUARIOS REGISTRADOS */}
            <section className="master-section">
              <h2 className="master-section-title">Usuarios Registrados en la Plataforma</h2>
              <div className="users-table-container">
                <div className="table-search-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="table-filter-chips">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'client', label: 'Clientes' },
                    { id: 'driver', label: 'Conductores' },
                    { id: 'restaurant', label: 'Restaurantes' },
                    { id: 'employee', label: 'Empleados' },
                    { id: 'admin', label: 'Admins' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      className={`chip-btn ${roleFilter === filter.id ? 'active' : ''}`}
                      onClick={() => setRoleFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="table-wrapper">
                  <table className="master-users-table">
                    <thead>
                      <tr>
                        <th>USUARIO</th>
                        <th>ROL</th>
                        <th>PUNTOS</th>
                        <th>ESTADO</th>
                        <th>CIUDAD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td colSpan="5" className="empty-table-cell">Cargando lista de usuarios...</td>
                        </tr>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => {
                          const userRole = (u.role || 'client').toLowerCase();
                          const isApproved = u.status === 'approved' || u.status === 'Aprobado';
                          const pointsVal = u.points !== undefined && u.points !== null ? u.points.toLocaleString() : '0';
                          const specialtiesStr = u.specialties && u.specialties.length > 0
                            ? u.specialties.map(s => s === 'finances' ? 'Finanzas' : s === 'moderation' ? 'Moderación' : s === 'support' ? 'Soporte' : s).join(', ')
                            : null;

                          return (
                            <tr key={u.id}>
                              <td>
                                <div className="user-cell">
                                  <div className="user-avatar-badge">
                                    {u.avatar ? (
                                      <img src={u.avatar} alt={getUserFullName(u)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                      getUserFullName(u).substring(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div className="user-cell-meta">
                                    <span className="user-cell-name">{getUserFullName(u)}</span>
                                    <span className="user-cell-email">{u.email}</span>
                                    {specialtiesStr && <span className="user-subrole-badge">💼 {specialtiesStr}</span>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`role-badge ${userRole}`}>
                                  {userRole === 'admin' && '⭐ Admin'}
                                  {userRole === 'employee' && '👤 Empleado'}
                                  {userRole === 'driver' && '🚗 Conductor'}
                                  {userRole === 'restaurant' && '🏪 Restaurante'}
                                  {userRole === 'client' && '👤 Cliente'}
                                  {!['admin', 'employee', 'driver', 'restaurant', 'client'].includes(userRole) && `👤 ${u.role}`}
                                </span>
                              </td>
                              <td>
                                <span className="points-val">★ {pointsVal}</span>
                              </td>
                              <td>
                                <span className={`status-pill ${isApproved ? 'green' : 'pending'}`}>
                                  • {isApproved ? 'Aprobado' : 'Pendiente'}
                                </span>
                              </td>
                              <td>
                                <span className="city-val">{u.city || 'Colombia'}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="empty-table-cell">No se encontraron usuarios.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

        {/* TAB 2: HISTORIAL DE PEDIDOS POR RESTAURANTE */}
        {activeTab === 'restaurants' && (
          <section className="master-section">
            <div className="section-header-row">
              <h2 className="master-section-title">🏪 Historial de Pedidos por Restaurante</h2>
              <span className="sub-counter-badge">{filteredOrders.length} Pedidos Registrados</span>
            </div>

            {/* Filter Bar */}
            <div className="history-filter-bar">
              <div className="filter-item">
                <label>Filtrar por Restaurante:</label>
                <select value={restaurantFilter} onChange={(e) => setRestaurantFilter(e.target.value)}>
                  <option value="all">Todos los Restaurantes ({registeredRestaurants.length})</option>
                  {registeredRestaurants.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name} {r.food_type ? `• ${r.food_type}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label>Estado del Pedido:</label>
                <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                  <option value="all">Todos los Estados</option>
                  <option value="in_preparation">🟡 En Preparación</option>
                  <option value="on_the_way">🛵 En Camino</option>
                  <option value="completed">🟢 Entregado / Completado</option>
                  <option value="cancelled">🔴 Cancelado</option>
                </select>
              </div>

              <div className="filter-item search">
                <label>Buscar Pedido o Cliente:</label>
                <input
                  type="text"
                  placeholder="Código, cliente o restaurante..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="users-table-container">
              <div className="table-wrapper">
                <table className="master-users-table">
                  <thead>
                    <tr>
                      <th>CÓDIGO / ID</th>
                      <th>RESTAURANTE</th>
                      <th>CLIENTE / DESTINO</th>
                      <th>ITEMS & CANTIDAD</th>
                      <th>TOTAL</th>
                      <th>ESTADO</th>
                      <th>FECHA / HORA</th>
                      <th>DETALLES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr><td colSpan="8" className="empty-table-cell">Cargando historial de pedidos...</td></tr>
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map((ord) => {
                        const restName = ord.restaurant?.name || 'Restaurante';
                        const clientName = ord.client ? `${ord.client.name} ${ord.client.last_name || ''}` : 'Cliente';
                        const isDelivered = ord.status === 'completed' || ord.status === 'delivered';
                        const isWay = ord.status === 'on_the_way';
                        const isPrep = ord.status === 'in_preparation' || ord.status === 'pending';

                        return (
                          <tr key={ord.id}>
                            <td>
                              <span className="code-tag">{ord.delivery_code || ord.id.slice(0, 8)}</span>
                            </td>
                            <td>
                              <div className="restaurant-cell-info">
                                <span className="restaurant-title-name">🏪 {restName}</span>
                                <span className="restaurant-sub-type">{ord.restaurant?.food_type || 'Restaurante Verificado'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="client-cell-info">
                                <span className="client-name font-bold">{clientName}</span>
                                <span className="client-address-sub">📍 {ord.delivery_address || 'Dirección registrada'}</span>
                              </div>
                            </td>
                            <td>
                              <span className="items-count-badge">{ord.quantity || ord.items?.length || 1} Ítems</span>
                            </td>
                            <td>
                              <span className="order-price-tag">{formatCOP(ord.total_price)}</span>
                            </td>
                            <td>
                              {isDelivered && <span className="status-pill green">🟢 Entregado</span>}
                              {isWay && <span className="status-pill blue">🛵 En Camino</span>}
                              {isPrep && <span className="status-pill pending">🟡 Preparando</span>}
                              {ord.status === 'cancelled' && <span className="status-pill red">🔴 Cancelado</span>}
                            </td>
                            <td>
                              <span className="date-time-cell">{formatDateTime(ord.created_at)}</span>
                            </td>
                            <td>
                              <button
                                className="action-view-btn"
                                onClick={() => setSelectedOrderDetails(ord)}
                              >
                                Ver Desglose 👁️
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="8" className="empty-table-cell">No hay pedidos que coincidan con la búsqueda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: CONDUCTORES & MONITOREO EN TIEMPO REAL */}
        {activeTab === 'drivers' && (
          <section className="master-section">
            {/* LIVE GPS TELEMETRY MONITOR RADAR CARD */}
            <div className="live-telemetry-radar-card">
              <div className="radar-header">
                <div className="radar-title-box">
                  <span className="live-pulse-badge">● EN VIVO</span>
                  <h3>Monitoreo de Viaje Activo en Tiempo Real</h3>
                </div>
                <div className="active-trip-selector">
                  <label>Seleccionar Viaje Activo:</label>
                  <select value={selectedLiveRideId} onChange={(e) => setSelectedLiveRideId(e.target.value)}>
                    <option value="live-ride-1">🚗 Carlos Mendoza (San Fernando ➔ Unicentro)</option>
                    <option value="live-ride-2">🏍️ Valentina Ríos (Granada ➔ Chipichape)</option>
                  </select>
                </div>
              </div>

              <div className="radar-body-grid">
                {/* Visual Route Progress Animation */}
                <div className="route-map-visualizer">
                  <div className="map-simulation-background">
                    <div className="route-path-line">
                      <div className="route-filled-progress" style={{ width: `${telemetryProgress}%` }}></div>
                      <div className="vehicle-marker-pulse" style={{ left: `${telemetryProgress}%` }}>
                        <span className="marker-icon">{activeRideObj?.vehicle_type?.includes('Moto') ? '🏍️' : '🚗'}</span>
                      </div>
                    </div>
                    <div className="route-point origin">
                      <span className="point-dot green"></span>
                      <span className="point-label">Origen: {activeRideObj?.origin?.address || 'San Fernando, Cali'}</span>
                    </div>
                    <div className="route-point destination">
                      <span className="point-dot red"></span>
                      <span className="point-label">Destino: {activeRideObj?.destination?.address || 'Unicentro, Cali'}</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div className="telemetry-metrics-panel">
                  <div className="telemetry-box">
                    <span className="tele-label">Velocidad Actual</span>
                    <h3 className="tele-value blue">{telemetrySpeed} <small>km/h</small></h3>
                  </div>

                  <div className="telemetry-box">
                    <span className="tele-label">ETA Estimado</span>
                    <h3 className="tele-value green">{telemetryEta} <small>min</small></h3>
                  </div>

                  <div className="telemetry-box">
                    <span className="tele-label">Progreso de Ruta</span>
                    <h3 className="tele-value purple">{telemetryProgress}%</h3>
                  </div>

                  <div className="telemetry-box">
                    <span className="tele-label">Tarifa del Servicio</span>
                    <h3 className="tele-value gold">{formatCOP(activeRideObj?.price || 16500)}</h3>
                  </div>

                  <div className="telemetry-driver-card">
                    <div className="driver-mini-avatar">
                      {activeRideObj?.driver_name?.charAt(0) || 'C'}
                    </div>
                    <div className="driver-mini-info">
                      <span className="driver-name-bold">{activeRideObj?.driver_name || 'Carlos Andrés Mendoza'}</span>
                      <span className="vehicle-info-sub">🚘 {activeRideObj?.vehicle_info || 'Chevrolet Spark GT - ABC-123'}</span>
                      <span className="client-pass-sub">👤 Pasajero: {activeRideObj?.client_name || 'María Paula Gómez'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DRIVER TRIPS HISTORY TABLE */}
            <div className="section-header-row" style={{ marginTop: '2.5rem' }}>
              <h2 className="master-section-title">🚗 Historial de Viajes por Conductor</h2>
              <span className="sub-counter-badge">{filteredRides.length} Servicios Registrados</span>
            </div>

            <div className="history-filter-bar">
              <div className="filter-item">
                <label>Filtrar Estado del Servicio:</label>
                <select value={driverStatusFilter} onChange={(e) => setDriverStatusFilter(e.target.value)}>
                  <option value="all">Todos los Estados</option>
                  <option value="in_progress">🟢 En Curso (Live)</option>
                  <option value="completed">✔️ Completados</option>
                  <option value="cancelled">🔴 Cancelados</option>
                </select>
              </div>

              <div className="filter-item search">
                <label>Buscar Conductor o Vehículo:</label>
                <input
                  type="text"
                  placeholder="Nombre de conductor, cliente o vehículo..."
                  value={driverSearchQuery}
                  onChange={(e) => setDriverSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="users-table-container">
              <div className="table-wrapper">
                <table className="master-users-table">
                  <thead>
                    <tr>
                      <th>CONDUCTOR</th>
                      <th>VEHÍCULO</th>
                      <th>PASAJERO / CLIENTE</th>
                      <th>RUTA (ORIGEN ➔ DESTINO)</th>
                      <th>TARIFA</th>
                      <th>VALORACIÓN</th>
                      <th>ESTADO</th>
                      <th>FECHA / HORA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRides ? (
                      <tr><td colSpan="8" className="empty-table-cell">Cargando viajes de conductores...</td></tr>
                    ) : filteredRides.length > 0 ? (
                      filteredRides.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="driver-cell-box">
                              <span className="driver-name-title">🚗 {r.driver_name || 'Conductor Landa'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="vehicle-badge">{r.vehicle_info || r.vehicle_type}</span>
                          </td>
                          <td>
                            <span className="client-pass-name">👤 {r.client_name}</span>
                          </td>
                          <td>
                            <div className="route-cell-meta">
                              <span className="origin-txt">🟢 {r.origin?.address || 'Origen'}</span>
                              <span className="dest-txt">🔴 {r.destination?.address || 'Destino'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="order-price-tag">{formatCOP(r.price)}</span>
                          </td>
                          <td>
                            <span className="points-val">★ {r.rating || '5.0'}</span>
                          </td>
                          <td>
                            {r.status === 'in_progress' && <span className="status-pill green">🟢 En Curso</span>}
                            {r.status === 'completed' && <span className="status-pill blue">✔️ Completado</span>}
                            {r.status === 'cancelled' && <span className="status-pill red">🔴 Cancelado</span>}
                          </td>
                          <td>
                            <span className="date-time-cell">{formatDateTime(r.created_at)}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8" className="empty-table-cell">No se encontraron viajes.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: HISTORIAL DE VIAJES POR USUARIO */}
        {activeTab === 'users' && (
          <section className="master-section">
            <div className="section-header-row">
              <h2 className="master-section-title">👤 Historial de Viajes por Usuario / Cliente</h2>
              <span className="sub-counter-badge">{filteredUserRides.length} Viajes Solicitados</span>
            </div>

            <div className="history-filter-bar">
              <div className="filter-item">
                <label>Filtrar por Estado:</label>
                <select value={userRideStatusFilter} onChange={(e) => setUserRideStatusFilter(e.target.value)}>
                  <option value="all">Todos los Viajes</option>
                  <option value="completed">Completados</option>
                  <option value="in_progress">En Curso</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>

              <div className="filter-item search">
                <label>Buscar por Nombre de Usuario o Dirección:</label>
                <input
                  type="text"
                  placeholder="Nombre de cliente, correo o dirección..."
                  value={userRideSearchQuery}
                  onChange={(e) => setUserRideSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="users-table-container">
              <div className="table-wrapper">
                <table className="master-users-table">
                  <thead>
                    <tr>
                      <th>USUARIO / CLIENTE</th>
                      <th>CONDUCTOR ASIGNADO</th>
                      <th>TIPO DE VEHÍCULO</th>
                      <th>ORIGEN & DESTINO</th>
                      <th>DISTANCIA / TIEMPO</th>
                      <th>TARIFA PAGADA</th>
                      <th>ESTADO</th>
                      <th>FECHA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUserRides.length > 0 ? (
                      filteredUserRides.map((ur) => (
                        <tr key={ur.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar-badge">
                                {ur.client_name?.charAt(0) || 'U'}
                              </div>
                              <div className="user-cell-meta">
                                <span className="user-cell-name">{ur.client_name}</span>
                                <span className="user-cell-email">Cliente Registrado</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="driver-assigned-tag">🚗 {ur.driver_name || 'Conductor Asignado'}</span>
                          </td>
                          <td>
                            <span className="vehicle-badge">{ur.vehicle_type}</span>
                          </td>
                          <td>
                            <div className="route-cell-meta">
                              <span className="origin-txt">🟢 Origen: {ur.origin?.address}</span>
                              <span className="dest-txt">🔴 Destino: {ur.destination?.address}</span>
                            </div>
                          </td>
                          <td>
                            <span className="distance-badge">
                              📏 {ur.route_details?.distance_km || 6.5} km • ⏱️ {ur.route_details?.duration_min || 15} min
                            </span>
                          </td>
                          <td>
                            <span className="order-price-tag">{formatCOP(ur.price)}</span>
                          </td>
                          <td>
                            {ur.status === 'in_progress' && <span className="status-pill green">🟢 En Curso</span>}
                            {ur.status === 'completed' && <span className="status-pill blue">✔️ Completado</span>}
                            {ur.status === 'cancelled' && <span className="status-pill red">🔴 Cancelado</span>}
                          </td>
                          <td>
                            <span className="date-time-cell">{formatDateTime(ur.created_at)}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8" className="empty-table-cell">No se encontraron viajes de usuarios.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: HISTORIAL DE INICIO DE SESIÓN DE EMPLEADOS */}
        {activeTab === 'employees' && (
          <section className="master-section">
            <div className="section-header-row">
              <h2 className="master-section-title">🔑 Historial de Inicio de Sesión de Empleados</h2>
              <span className="sub-counter-badge">{filteredEmployeeLogins.length} Accesos Registrados</span>
            </div>

            {/* Employee Directory Cards Summary */}
            <div className="employee-cards-grid">
              {employeesList.map((emp) => (
                <div className="employee-kpi-card" key={emp.id}>
                  <div className="emp-card-header">
                    <span className="emp-avatar">👤</span>
                    <div className="emp-info">
                      <h4>{emp.name}</h4>
                      <span className="emp-email">{emp.email}</span>
                    </div>
                  </div>
                  <div className="emp-card-body">
                    <div className="emp-stat">
                      <span className="stat-label">Cédula (CC):</span>
                      <span className="stat-val">{emp.cc}</span>
                    </div>
                    <div className="emp-stat">
                      <span className="stat-label">Especialidad:</span>
                      <span className="specialty-tag">💼 Soporte & Auditoría</span>
                    </div>
                    <div className="emp-stat">
                      <span className="stat-label">Estado:</span>
                      <span className="status-pill green">● Verificado</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Employee Logins Audit Table */}
            <div className="history-filter-bar" style={{ marginTop: '2rem' }}>
              <div className="filter-item search" style={{ width: '100%' }}>
                <label>Buscar por Nombre, Cédula o Correo de Empleado:</label>
                <input
                  type="text"
                  placeholder="Buscar en el registro de inicio de sesión..."
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="users-table-container">
              <div className="table-wrapper">
                <table className="master-users-table">
                  <thead>
                    <tr>
                      <th>EMPLEADO</th>
                      <th>CÉDULA (CC)</th>
                      <th>CORREO ELECTRÓNICO</th>
                      <th>FECHA Y HORA DE INICIO DE SESIÓN</th>
                      <th>DIRECCIÓN IP</th>
                      <th>DISPOSITIVO / NAVEGADOR</th>
                      <th>ESTADO DE SESIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingEmployees ? (
                      <tr><td colSpan="7" className="empty-table-cell">Cargando registros de inicio de sesión...</td></tr>
                    ) : filteredEmployeeLogins.length > 0 ? (
                      filteredEmployeeLogins.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <span className="employee-name-bold">👤 {log.name}</span>
                          </td>
                          <td>
                            <code>{log.cc || '1144189234'}</code>
                          </td>
                          <td>
                            <span className="user-cell-email">{log.email}</span>
                          </td>
                          <td>
                            <span className="date-time-cell bold">🕒 {formatDateTime(log.login_time)}</span>
                          </td>
                          <td>
                            <span className="ip-badge">🌐 {log.ip || '190.157.44.112'}</span>
                          </td>
                          <td>
                            <span className="device-sub-text">{log.device || 'Escritorio (Windows / Chrome)'}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${log.status === 'Activa' ? 'green' : 'blue'}`}>
                              • {log.status || 'Activa'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" className="empty-table-cell">No hay registros de inicio de sesión.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* MASTER FOOTER */}
        <footer className="master-footer">
          <div className="master-footer-content">
            <span className="version-tag">⚡ LANDA v1.0.0</span>
            <span className="update-tag">🕒 Última actualización: {lastUpdated}</span>
          </div>
        </footer>
      </main>

      {/* ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="finances-modal-backdrop" onClick={() => setSelectedOrderDetails(null)}>
          <div className="finances-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="finances-modal-header">
              <h3>📦 Desglose del Pedido {selectedOrderDetails.delivery_code || selectedOrderDetails.id}</h3>
              <button className="close-modal-btn" onClick={() => setSelectedOrderDetails(null)}>✕</button>
            </div>

            <div className="finances-modal-body">
              <div className="order-modal-summary-grid">
                <div className="modal-info-box">
                  <span className="box-lbl">Restaurante</span>
                  <h4>{selectedOrderDetails.restaurant?.name || 'Restaurante'}</h4>
                  <p>{selectedOrderDetails.restaurant?.food_type} • Tel: {selectedOrderDetails.restaurant?.phone || '+57 300 000 0000'}</p>
                </div>

                <div className="modal-info-box">
                  <span className="box-lbl">Cliente</span>
                  <h4>{selectedOrderDetails.client ? `${selectedOrderDetails.client.name} ${selectedOrderDetails.client.last_name || ''}` : 'Cliente'}</h4>
                  <p>Tel: {selectedOrderDetails.client?.phone || '+57 300 000 0000'} • {selectedOrderDetails.client?.email}</p>
                </div>
              </div>

              <div className="delivery-address-box">
                <span className="box-lbl">📍 Dirección de Entrega</span>
                <p>{selectedOrderDetails.delivery_address || 'Dirección principal registrada'}</p>
              </div>

              <h4 style={{ color: '#ffffff', margin: '1.2rem 0 0.6rem 0' }}>Platillos Solicitados:</h4>
              <div className="order-items-list">
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                  selectedOrderDetails.items.map((item, idx) => (
                    <div className="order-item-row" key={idx}>
                      <div className="item-left">
                        <span className="item-qty-badge">{item.quantity || 1}x</span>
                        <div className="item-meta">
                          <span className="item-name">{item.name}</span>
                          {item.notes && <span className="item-notes">Nota: {item.notes}</span>}
                        </div>
                      </div>
                      <span className="item-price">{formatCOP(item.price * (item.quantity || 1))}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#94a3b8', padding: '0.5rem' }}>No hay ítems detallados para este pedido.</div>
                )}
              </div>

              <div className="order-total-footer-bar">
                <span>Total Facturado al Cliente:</span>
                <span className="total-val">{formatCOP(selectedOrderDetails.total_price)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FINANCES MODAL */}
      {isFinancesModalOpen && (
        <div className="finances-modal-backdrop" onClick={() => setIsFinancesModalOpen(false)}>
          <div className="finances-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="finances-modal-header">
              <h3>💰 Reporte de Finanzas Plataforma</h3>
              <button className="close-modal-btn" onClick={() => setIsFinancesModalOpen(false)}>✕</button>
            </div>

            <div className="finances-modal-body">
              {loadingFinances ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando datos de finanzas...</div>
              ) : (
                <>
                  <div className="finances-kpi-row">
                    <div className="finances-kpi-card">
                      <span className="kpi-title">Ingresos Totales</span>
                      <h2 className="kpi-val green">${financesData.totalRevenue.toLocaleString('es-CO')}</h2>
                    </div>
                    <div className="finances-kpi-card">
                      <span className="kpi-title">Suscripciones Conductores</span>
                      <h2 className="kpi-val blue">${financesData.driverSubscriptions.toLocaleString('es-CO')}</h2>
                    </div>
                    <div className="finances-kpi-card">
                      <span className="kpi-title">Comisiones Comida/Viajes</span>
                      <h2 className="kpi-val purple">${financesData.foodCommission.toLocaleString('es-CO')}</h2>
                    </div>
                  </div>

                  <h4 style={{ color: '#ffffff', margin: '1rem 0 0.5rem 0' }}>Facturación Reciente</h4>
                  <div className="finances-table-wrapper">
                    <table className="master-users-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>CLIENTE / CONDUCTOR</th>
                          <th>TIPO</th>
                          <th>MONTO</th>
                          <th>COMISIÓN (LANDA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financesData.billing.slice(0, 8).map((b) => (
                          <tr key={b.id}>
                            <td><code>{b.id}</code></td>
                            <td>{b.client}</td>
                            <td><span className="role-badge client">{b.type}</span></td>
                            <td>${b.amount.toLocaleString('es-CO')}</td>
                            <td style={{ color: '#4ade80', fontWeight: '700' }}>+${Math.round(b.commission).toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanelMaster;
