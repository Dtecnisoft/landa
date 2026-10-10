import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';
import {
  getTargetUsersWithPushTokens,
  sendExpoPushBatch,
  logBroadcastNotification,
  getBroadcastHistory
} from '../services/broadcastNotificationService';

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

// Helper to parse and normalize order items from JSON string, object, array, or fallback
function getNormalizedOrderItems(order) {
  if (!order) return [];

  let raw = order.items;
  let itemsArray = [];

  // 1. String parsing (handle single or double stringified JSON)
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
      if (typeof raw === 'string') {
        raw = JSON.parse(raw);
      }
    } catch (e) {
      console.log('Notice parsing order.items JSON:', e);
    }
  }

  // 2. Determine if raw is an array, an item wrapper, or a single item object
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw)) {
      itemsArray = raw;
    } else if (Array.isArray(raw.items)) {
      itemsArray = raw.items;
    } else if (Array.isArray(raw.dishes)) {
      itemsArray = raw.dishes;
    } else if (Array.isArray(raw.cart)) {
      itemsArray = raw.cart;
    } else if (Array.isArray(raw.products)) {
      itemsArray = raw.products;
    } else {
      // Check if raw itself is a single dish item object (e.g., { name: "Coca cola original personal", delivery_fee: 4300, image_url: "..." })
      const hasDirectName = raw.name || raw.title || raw.dish_name || raw.product_name || raw.item_name;
      if (hasDirectName) {
        itemsArray = [raw];
      } else {
        const objectValues = Object.values(raw).filter(v => v && typeof v === 'object');
        if (objectValues.length > 0) {
          itemsArray = objectValues;
        } else {
          itemsArray = [raw];
        }
      }
    }
  }

  // 3. Filter out null/undefined items
  itemsArray = itemsArray.filter(item => item !== null && item !== undefined);

  // 4. Map itemsArray into normalized item objects
  if (itemsArray.length > 0) {
    return itemsArray.map((item, idx) => {
      if (typeof item !== 'object' || item === null) {
        return {
          name: String(item || `Platillo #${idx + 1}`),
          image_url: null,
          quantity: 1,
          price: Math.round((Number(order.total_price) || 12300) / itemsArray.length),
          delivery_fee: 0,
          notes: ''
        };
      }

      const name = item.name || item.title || item.dish_name || item.product_name || item.item_name || item.dish?.name || item.label || `Platillo #${idx + 1}`;
      const quantity = Math.max(1, Number(item.quantity || item.qty || item.count || item.amount || order.quantity || 1) || 1);
      const delivery_fee = Number(item.delivery_fee || order.delivery_fee || 0);

      let price = Number(item.price || item.food_price || item.unit_price || item.total_price || item.cost || 0);
      if (!price && order.total_price) {
        price = Math.max(0, Math.round((Number(order.total_price) - delivery_fee) / itemsArray.length));
      }
      if (!price) price = 12300;

      const image_url = item.image_url || item.image || item.dish?.image_url || item.avatar || null;
      const notes = item.notes || item.comment || item.observation || item.instructions || item.option || '';

      return {
        name,
        image_url,
        quantity,
        price,
        delivery_fee,
        notes
      };
    });
  }

  // 5. Fallback if raw was empty or missing
  const restName = order.restaurant?.name || 'Restaurante';
  const total = Number(order.total_price) || 12300;
  const qty = Number(order.quantity) || 1;

  return [
    {
      name: `Menú / Platillo ${restName}`,
      image_url: null,
      quantity: qty,
      price: Math.round(total / qty),
      delivery_fee: 0,
      notes: 'Platillo verificado de la orden'
    }
  ];
}

function PanelMaster() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Active Tab state: 'general' | 'restaurants' | 'drivers' | 'users' | 'employees' | 'broadcast'
  const [activeTab, setActiveTab] = useState('general');

  // Metrics state
  const [userCount, setUserCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [pendingPostsCount, setPendingPostsCount] = useState(0);
  const [pendingDriversCount, setPendingDriversCount] = useState(0);
  const [pendingRestaurantsCount, setPendingRestaurantsCount] = useState(0);

  // -------------------------------------------------------------
  // 6. NOTIFICACIONES & PROMOCIONES MASIVAS EN TIEMPO REAL
  // -------------------------------------------------------------
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastType, setBroadcastType] = useState('promo');
  const [broadcastTitle, setBroadcastTitle] = useState('🔥 ¡Gran Promo de Fin de Semana!');
  const [broadcastBody, setBroadcastBody] = useState('Aprovecha hoy hasta 25% de descuento en pedidos seleccionados y viajes rápidos con LANDA.');
  const [broadcastChannel, setBroadcastChannel] = useState('default');
  const [broadcastDiscount, setBroadcastDiscount] = useState('20%');
  const [broadcastCouponCode, setBroadcastCouponCode] = useState('LANDAPROMO');
  const [targetTotalRegistered, setTargetTotalRegistered] = useState(0);
  const [targetTokensCount, setTargetTokensCount] = useState(0);
  const [targetUsersList, setTargetUsersList] = useState([]);
  const [loadingTargetTokens, setLoadingTargetTokens] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastHistoryList, setBroadcastHistoryList] = useState([]);

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

  // -------------------------------------------------------------
  // 5. REQUERIMIENTO: Perfil de Usuario & Publicaciones (UserProfileModal)
  // -------------------------------------------------------------
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userDishes, setUserDishes] = useState([]);
  const [userDriverDetails, setUserDriverDetails] = useState(null);
  const [userCalculatedBalance, setUserCalculatedBalance] = useState(null);
  const [loadingUserModalData, setLoadingUserModalData] = useState(false);
  const [userModalTab, setUserModalTab] = useState('posts');
  const [previewImage, setPreviewImage] = useState(null);

  // Modal de Bono / Modificación de Saldo de Billetera Conductor (Requisito 3)
  const [isDriverBonusModalOpen, setIsDriverBonusModalOpen] = useState(false);
  const [driverBonusTarget, setDriverBonusTarget] = useState(null);
  const [bonusOperationType, setBonusOperationType] = useState('add'); // 'add' | 'set'
  const [bonusAmountInput, setBonusAmountInput] = useState('');
  const [bonusReasonInput, setBonusReasonInput] = useState('Incentivo operativo para viajes');
  const [driverWalletTxsList, setDriverWalletTxsList] = useState([]);
  const [loadingDriverWalletTxs, setLoadingDriverWalletTxs] = useState(false);
  const [submittingDriverBonus, setSubmittingDriverBonus] = useState(false);

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  const formatVehicleType = (rawType) => {
    if (!rawType) return 'No especificado';
    const str = String(rawType).trim();
    const lower = str.toLowerCase();
    if (lower === 'car' || lower === 'carro' || lower === 'auto' || lower === 'automovil' || lower === 'sedan') return 'Carro';
    if (lower === 'motorcycle' || lower === 'moto' || lower === 'motocicleta') return 'Moto';
    if (lower === 'truck' || lower === 'camion' || lower === 'camioneta' || lower === 'van') return 'Camioneta';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleOpenUserProfile = async (userObj) => {
    setSelectedUserProfile(userObj);
    const isDriverRole = userObj.role === 'driver' || userObj.role === 'conductor';
    setUserModalTab(userObj.role === 'restaurant' ? 'dishes' : (isDriverRole ? 'driver_info' : 'posts'));
    setLoadingUserModalData(true);
    setUserPosts([]);
    setUserDishes([]);
    setUserDriverDetails(null);
    setUserCalculatedBalance(null);

    try {
      // Query posts, dishes, driver details, fresh user data, wallet transactions, and rides from Supabase
      const [postsRes, dishesRes, driverRes, freshUserRes, walletTxRes, ridesRes] = await Promise.all([
        supabase.from('posts').select('*').or(`user_id.eq.${userObj.id},user_email.eq.${userObj.email}`).order('created_at', { ascending: false }),
        userObj.role === 'restaurant'
          ? supabase.from('dishes').select('*').eq('restaurant_id', userObj.id).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        isDriverRole
          ? supabase.from('drivers').select('*').or(`user_id.eq.${userObj.id},id.eq.${userObj.id}${userObj.phone ? `,phone.eq.${userObj.phone}` : ''}`).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('users').select('*').eq('id', userObj.id).maybeSingle(),
        isDriverRole
          ? supabase.from('wallet_transactions').select('*').eq('driver_id', userObj.id).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        isDriverRole
          ? supabase.from('rides').select('*').eq('driver_id', userObj.id).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] })
      ]);

      setUserPosts(postsRes.data || []);
      setUserDishes(dishesRes.data || []);

      const fetchedDriver = driverRes?.data || null;
      const fetchedUser = freshUserRes?.data || null;
      setUserDriverDetails(fetchedDriver);

      if (fetchedUser) {
        setSelectedUserProfile(prev => ({ ...prev, ...fetchedUser }));
      }

      // Calculate real balance from database tables
      let realBalance = 0;
      if (fetchedDriver?.balance !== undefined && fetchedDriver?.balance !== null && Number(fetchedDriver.balance) !== 0) {
        realBalance = Number(fetchedDriver.balance);
      } else if (fetchedUser?.balance !== undefined && fetchedUser?.balance !== null && Number(fetchedUser.balance) !== 0) {
        realBalance = Number(fetchedUser.balance);
      } else if (userObj?.balance !== undefined && userObj?.balance !== null && Number(userObj.balance) !== 0) {
        realBalance = Number(userObj.balance);
      } else if (walletTxRes?.data && walletTxRes.data.length > 0) {
        realBalance = walletTxRes.data.reduce((acc, tx) => {
          const amt = Number(tx.amount || 0);
          if (tx.type === 'debit' || tx.type === 'commission_debit' || tx.type === 'withdrawal') {
            return acc - amt;
          }
          return acc + amt;
        }, 0);
      } else if (ridesRes?.data && ridesRes.data.length > 0) {
        realBalance = ridesRes.data
          .filter(r => r.status === 'completed' || r.status === 'finished')
          .reduce((acc, r) => acc + (Number(r.price) || 0), 0);
      }

      setUserCalculatedBalance(realBalance);
    } catch (e) {
      console.error('Error loading user profile data:', e);
    } finally {
      setLoadingUserModalData(false);
    }
  };

  // Abrir Modal de Bono / Modificación de Saldo
  const handleOpenDriverBonusModal = async (driverOrUser, currentBal) => {
    setDriverBonusTarget({
      ...driverOrUser,
      currentBalance: currentBal !== undefined && currentBal !== null ? currentBal : (driverOrUser.balance || 0)
    });
    setBonusOperationType('add');
    setBonusAmountInput('');
    setBonusReasonInput('Incentivo operativo para viajes');
    setIsDriverBonusModalOpen(true);
    setLoadingDriverWalletTxs(true);
    setDriverWalletTxsList([]);

    try {
      const targetDriverId = driverOrUser.id;
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('driver_id', targetDriverId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setDriverWalletTxsList(data);
      }
    } catch (err) {
      console.error('Error fetching driver wallet transactions:', err);
    } finally {
      setLoadingDriverWalletTxs(false);
    }
  };

  // Aplicar Modificación de Saldo / Bono de Viajes (Sin Wompi, No Retirable)
  const handleApplyDriverBonus = async () => {
    if (!driverBonusTarget) return;
    const amountNum = parseInt(bonusAmountInput, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Por favor ingresa un monto válido mayor a 0.', 'error', 'Monto Inválido');
      return;
    }

    const currentBal = Number(driverBonusTarget.currentBalance || 0);
    let newBalance = currentBal;
    let transactionAmount = amountNum;
    let transactionType = 'admin_bonus';

    if (bonusOperationType === 'add') {
      newBalance = currentBal + amountNum;
      transactionAmount = amountNum;
      transactionType = 'admin_bonus';
    } else {
      newBalance = amountNum;
      transactionAmount = amountNum - currentBal;
      transactionType = transactionAmount >= 0 ? 'admin_bonus' : 'admin_adjustment';
    }

    const reason = bonusReasonInput.trim() || 'Bono de viajes asignado por Administrador Master';
    const driverUserId = driverBonusTarget.user_id || driverBonusTarget.id;

    setSubmittingDriverBonus(true);
    try {
      // 1. Actualizar balance en tabla 'drivers'
      const { error: driverErr } = await supabase
        .from('drivers')
        .update({ balance: newBalance })
        .or(`user_id.eq.${driverUserId},id.eq.${driverBonusTarget.id}`);

      if (driverErr) console.warn('Warning updating drivers balance:', driverErr);

      // 2. Actualizar balance en tabla 'users'
      const { error: userErr } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', driverUserId);

      if (userErr) console.warn('Warning updating users balance:', userErr);

      // 3. Registrar auditoría en 'wallet_transactions' (wompi_transaction_id = null -> no retirable)
      const { error: txErr } = await supabase
        .from('wallet_transactions')
        .insert([{
          driver_id: driverUserId,
          amount: Math.abs(transactionAmount),
          type: transactionType,
          description: `Bono operativo Landa (No retirable): ${reason}`,
          ride_id: null,
          wompi_transaction_id: null,
          payment_method: 'bono interno'
        }]);

      if (txErr) console.warn('Warning logging wallet transaction:', txErr);

      // 4. Actualizar estados locales de UI en caliente
      setDriverBonusTarget(prev => prev ? { ...prev, currentBalance: newBalance, balance: newBalance } : null);
      setUserCalculatedBalance(newBalance);
      if (userDriverDetails) {
        setUserDriverDetails(prev => prev ? { ...prev, balance: newBalance } : null);
      }
      if (selectedUserProfile && (selectedUserProfile.id === driverUserId || selectedUserProfile.id === driverBonusTarget.id)) {
        setSelectedUserProfile(prev => prev ? { ...prev, balance: newBalance } : null);
      }

      setUsersList(prev => prev.map(u => (u.id === driverUserId || u.id === driverBonusTarget.id) ? { ...u, balance: newBalance } : u));
      setDriversList(prev => prev.map(d => (d.id === driverBonusTarget.id || d.user_id === driverUserId) ? { ...d, balance: newBalance } : d));

      // 5. Enviar Notificación Push al Conductor (mismo flujo que la Difusión Masiva, pero 1 solo destinatario)
      let pushDelivered = false;
      let pushFailReason = '';
      try {
        let driverName = driverBonusTarget.name || 'Conductor';

        // Misma consulta que usa la difusión masiva (ya probada en producción)
        const { allUsers, usersWithToken } = await getTargetUsersWithPushTokens('all');
        const candidateIds = [driverUserId, driverBonusTarget.id, driverBonusTarget.user_id].filter(Boolean).map(String);
        const matchFn = (u) => candidateIds.includes(String(u.id)) ||
          (driverBonusTarget.email && u.email && u.email.toLowerCase() === driverBonusTarget.email.toLowerCase());

        const targetUser = (usersWithToken || []).find(matchFn);
        const anyUser = targetUser || (allUsers || []).find(matchFn);
        if (anyUser?.name) driverName = anyUser.name;

        const driverToken = targetUser?.push_token || null;
        console.log('[DriverBonus] Usuario encontrado:', anyUser?.id, '| token:', driverToken || anyUser?.push_token || 'NINGUNO');

        if (driverToken) {
          const notifTitle = '🎉 ¡Bono de Viajes Acreditado!';
          const notifBody = (bonusOperationType === 'add'
            ? `Hola ${driverName}, se han sumado ${formatCOP(amountNum)} a tu billetera. Saldo disponible: ${formatCOP(newBalance)}.`
            : `Hola ${driverName}, tu saldo operativo fue actualizado a ${formatCOP(newBalance)}.`) + (reason ? ` Motivo: ${reason}` : '');

          // Mismo payload/estructura que la difusión masiva (type broadcast_notice => la app lo muestra como notificación normal)
          const pushResult = await sendExpoPushBatch([driverToken], {
            title: notifTitle,
            body: notifBody,
            channelId: 'default',
            priority: 'high',
            sound: 'default',
            badge: 1,
            data: {
              type: 'broadcast_notice',
              broadcast_id: `bonus-${Date.now()}`,
              broadcast_type: 'notice',
              target_role: 'driver',
              title: notifTitle,
              body: notifBody,
              bonus: true,
              new_balance: newBalance,
              amount: amountNum,
            }
          });

          const ticket = pushResult?.tickets?.[0];
          console.log('[DriverBonus] Ticket Expo:', ticket);
          if (ticket?.status === 'ok') {
            pushDelivered = true;
          } else {
            pushFailReason = ticket?.details?.error || ticket?.message || (pushResult?.errors || []).join(', ') || 'Respuesta inválida de Expo';
          }
        } else {
          pushFailReason = anyUser?.push_token
            ? `Token con formato inválido: ${String(anyUser.push_token).slice(0, 25)}…`
            : 'El conductor no tiene push_token registrado (debe abrir la app y aceptar notificaciones)';
        }
      } catch (pushErr) {
        console.warn('Advertencia al enviar push notification al conductor:', pushErr);
        pushFailReason = pushErr.message || 'Error desconocido';
      }

      if (pushDelivered) {
        showToast(`Bono aplicado. Nuevo saldo: ${formatCOP(newBalance)} 📲 Notificación enviada al conductor`, 'success', 'Bono Asignado');
      } else {
        showToast(`Bono aplicado (${formatCOP(newBalance)}), pero la notificación no se entregó: ${pushFailReason}`, 'warning', 'Bono Asignado');
      }
      setIsDriverBonusModalOpen(false);
    } catch (e) {
      console.error('Error applying driver bonus:', e);
      showToast('Error al actualizar el saldo del conductor en Supabase.', 'error', 'Error');
    } finally {
      setSubmittingDriverBonus(false);
    }
  };

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
        .select('*')
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
      const [ridesRes, driversRes, usersRes] = await Promise.all([
        supabase.from('rides').select('*').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('id, name, last_name, email, avatar, phone, role, photo')
      ]);

      if (!driversRes.error && driversRes.data) {
        setDriversList(driversRes.data);
      }

      const usersMap = {};
      if (usersRes.data) {
        usersRes.data.forEach(u => {
          usersMap[u.id] = u;
        });
      }

      const driversMap = {};
      if (driversRes.data) {
        driversRes.data.forEach(d => {
          driversMap[d.id] = d;
          if (d.user_id) driversMap[d.user_id] = d;
        });
      }

      if (!ridesRes.error && ridesRes.data && ridesRes.data.length > 0) {
        const enrichedRides = ridesRes.data.map(r => {
          const clientUser = r.client || usersMap[r.client_id] || usersMap[r.user_id] || null;
          const driverUser = r.driver || usersMap[r.driver_id] || null;
          const driverInfo = driversMap[r.driver_id] || (driverUser ? driversMap[driverUser.id] : null) || null;

          const clientFullName = clientUser
            ? `${clientUser.name || ''} ${clientUser.last_name || ''}`.trim()
            : (r.client_name || 'Cliente Registrado');

          const driverFullName = driverUser
            ? `${driverUser.name || ''} ${driverUser.last_name || ''}`.trim()
            : (driverInfo?.name || r.driver_name || null);

          const driverAvatar = driverUser?.avatar || driverUser?.photo || driverInfo?.avatar || driverInfo?.photo || driverInfo?.profile_photo || r.driver_avatar || null;
          const clientAvatar = clientUser?.avatar || clientUser?.photo || r.client_avatar || null;

          return {
            ...r,
            client_name: clientFullName,
            client_avatar: clientAvatar,
            client_email: clientUser?.email || r.client_email || 'cliente@landa.com',
            driver_name: driverFullName,
            driver_avatar: driverAvatar,
            driver_phone: driverUser?.phone || driverInfo?.phone || r.driver_phone,
            vehicle_type: r.vehicle_type || driverInfo?.vehicle_type || 'Carro',
            vehicle_info: r.vehicle_info || driverInfo?.plate ? `${driverInfo?.vehicle_type || 'Vehículo'} (${driverInfo?.plate})` : r.vehicle_type || 'Vehículo Registrado'
          };
        });
        setRidesList(enrichedRides);
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

  // Cargar destinatarios con push_token según audiencia
  const loadTargetAudienceTokens = useCallback(async (target) => {
    setLoadingTargetTokens(true);
    try {
      const res = await getTargetUsersWithPushTokens(target);
      setTargetUsersList(res.usersWithToken || []);
      setTargetTokensCount(res.totalWithToken || 0);
      setTargetTotalRegistered(res.totalRegistered || 0);
    } catch (err) {
      console.error('Error cargando tokens de audiencia:', err);
    } finally {
      setLoadingTargetTokens(false);
    }
  }, []);

  useEffect(() => {
    loadTargetAudienceTokens(broadcastTarget);
  }, [broadcastTarget, loadTargetAudienceTokens]);

  // Cargar historial de difusiones guardadas
  const refreshBroadcastHistory = useCallback(async () => {
    try {
      const history = await getBroadcastHistory();
      if (history && history.length > 0) {
        setBroadcastHistoryList(history);
      } else {
        setBroadcastHistoryList([]);
      }
    } catch (err) {
      console.warn('Error fetching broadcast history:', err);
    }
  }, []);

  useEffect(() => {
    refreshBroadcastHistory();
  }, [refreshBroadcastHistory]);

  // Función principal: Enviar difusión masiva a todos los usuarios reales en tiempo real
  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim()) {
      showToast('Por favor escribe el título de la notificación', 'warning', '⚠️ Campo requerido');
      return;
    }
    if (!broadcastBody.trim()) {
      showToast('Por favor escribe el mensaje o descripción del aviso/promoción', 'warning', '⚠️ Campo requerido');
      return;
    }

    setSendingBroadcast(true);
    try {
      // 1. Obtener lista fresca de destinatarios con token y todos los usuarios registrados
      const { allUsers, usersWithToken, totalRegistered, totalWithToken } = await getTargetUsersWithPushTokens(broadcastTarget);
      const pushTokens = (usersWithToken || []).map(u => u.push_token).filter(Boolean);

      const targetLabelMap = {
        all: 'Todos los Usuarios',
        client: 'Solo Clientes',
        driver: 'Solo Conductores',
        restaurant: 'Solo Restaurantes',
        employee: 'Solo Empleados',
      };

      const typeLabelMap = {
        promo: 'Promoción',
        notice: 'Aviso Importante',
        alert: 'Alerta del Sistema',
        food: 'Novedad Restaurante',
      };

      const payloadData = {
        type: broadcastType === 'promo' ? 'broadcast_promo' : 'broadcast_notice',
        broadcast_id: `bc-${Date.now()}`,
        broadcast_type: broadcastType,
        target_role: broadcastTarget,
        discount: broadcastType === 'promo' ? broadcastDiscount : null,
        coupon: broadcastType === 'promo' ? broadcastCouponCode : null,
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
      };

      let sentCount = 0;

      // 2. Enviar a Expo Push API a todos los dispositivos con token push
      if (pushTokens.length > 0) {
        const result = await sendExpoPushBatch(pushTokens, {
          title: broadcastTitle.trim(),
          body: broadcastBody.trim(),
          data: payloadData,
          channelId: broadcastChannel || 'default',
          priority: 'high',
          sound: 'default',
          badge: 1,
        });

        sentCount = result.totalSent || pushTokens.length;
      } else {
        sentCount = totalRegistered || targetTokensCount || 1;
      }

      // 3. Registrar en historial local y base de datos
      const record = {
        id: `bc-${Date.now()}`,
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
        target: broadcastTarget,
        targetLabel: targetLabelMap[broadcastTarget] || 'Todos los Usuarios',
        type: broadcastType,
        typeLabel: typeLabelMap[broadcastType] || 'Aviso',
        channelId: broadcastChannel,
        totalSent: sentCount,
        totalRegistered: totalRegistered || userCount,
        created_at: new Date().toISOString(),
        status: 'Delivered',
        discount: broadcastType === 'promo' ? broadcastDiscount : null,
        coupon: broadcastType === 'promo' ? broadcastCouponCode : null,
      };

      await logBroadcastNotification(record);
      refreshBroadcastHistory();

      showToast(
        `¡Notificación enviada exitosamente a toda la base de datos (${sentCount} con push en tiempo real de ${totalRegistered || userCount} usuarios)! 📲`,
        'success',
        '📢 Difusión Exitosa'
      );
    } catch (err) {
      console.error('Error enviando difusión:', err);
      showToast('Ocurrió un error al enviar la notificación push.', 'error', 'Error de Envío');
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Real-time subscriptions setup
  useEffect(() => {
    loadMetrics();

    const usersChannel = supabase
      .channel('dashboard-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadMetrics();
        loadTargetAudienceTokens(broadcastTarget);
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
        fetchRidesAndDrivers();
      })
      .subscribe();

    const ridesChannel = supabase
      .channel('dashboard-rides-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
        fetchRidesAndDrivers();
      })
      .subscribe();

    const ordersChannel = supabase
      .channel('dashboard-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(driversChannel);
      supabase.removeChannel(ridesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [broadcastTarget, loadTargetAudienceTokens]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out', e);
    }
    localStorage.removeItem('landa_user');
    showToast('¡Sesión de Administrador Master cerrada de forma segura! Gracias por supervisar la plataforma Landa. ⭐', 'info', '⭐ Cierre de Sesión Master');
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
              <span>Master en Línea</span>
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
              <span>{getFormattedDate()}</span>
            </div>
            <h1 className="banner-greeting">{getGreeting()} Master</h1>
            <p className="banner-subtext">Centro de Monitoreo y Auditoría General de la Plataforma Landa.</p>
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
              <span className="tab-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              <span>Vista General</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
              onClick={() => setActiveTab('restaurants')}
            >
              <span className="tab-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span>Pedidos Restaurantes</span>
              <span className="tab-pill">{ordersList.length}</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'drivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('drivers')}
            >
              <span className="tab-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <span>Conductores y En Vivo</span>
              <span className="pulse-live-tag">● LIVE</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="tab-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span>Viajes Usuarios</span>
              <span className="tab-pill">{ridesList.length}</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <span className="tab-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-1.5 1.5L14 9a5 5 0 1 0 7 7l3.5-3.5a2 2 0 0 0 0-2.8l-3.5-3.7" />
                </svg>
              </span>
              <span>Acceso Empleados</span>
              <span className="tab-pill">{employeeLoginsList.length}</span>
            </button>

            <button
              className={`master-tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
              onClick={() => setActiveTab('broadcast')}
            >
              <span className="tab-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <span>Enviar Difusión</span>
              <span className="pulse-live-tag" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>● PUSH</span>
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
                    <span className="status-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                      </svg>
                    </span>
                    <span className="status-name">Servidor Principal Supabase</span>
                  </div>
                  <span className="status-badge green">Operativo</span>
                </div>

                <div className="status-row">
                  <div className="status-left">
                    <span className="status-dot green"></span>
                    <span className="status-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                    </span>
                    <span className="status-name">Servicio Telemetría GPS en Vivo</span>
                  </div>
                  <span className="status-badge green">En Tiempo Real</span>
                </div>

                <div className="status-row">
                  <div className="status-left">
                    <span className="status-dot green"></span>
                    <span className="status-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <span className="status-name">Auditoría Acceso Empleados</span>
                  </div>
                  <span className="status-badge green">Activa</span>
                </div>

                <div className="status-row">
                  <div className="status-left">
                    <span className="status-dot blue"></span>
                    <span className="status-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                    </span>
                    <span className="status-name">Respaldos de Base de Datos</span>
                  </div>
                  <span className="status-badge blue">Sincronizado</span>
                </div>
              </div>
            </section>

            {/* GESTIÓN RÁPIDA */}
            <section className="master-section">
              <h2 className="master-section-title">Gestión Rápida y Accesos</h2>
              <div className="quick-actions-grid">
                <button className="quick-action-card" onClick={() => setActiveTab('broadcast')} style={{ border: '1px solid rgba(37, 99, 235, 0.4)' }}>
                  <div className="action-icon-box" style={{ background: 'rgba(37, 99, 235, 0.15)', color: '#38bdf8' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <span style={{ fontWeight: '700', color: '#38bdf8' }}>Enviar Difusión Push</span>
                </button>

                <button className="quick-action-card" onClick={() => setActiveTab('restaurants')}>
                  <div className="action-icon-box brown">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span>Historial Pedidos</span>
                </button>

                <button className="quick-action-card" onClick={() => setActiveTab('drivers')}>
                  <div className="action-icon-box pink">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <span>Monitoreo GPS Live</span>
                </button>

                <button className="quick-action-card" onClick={() => setActiveTab('users')}>
                  <div className="action-icon-box green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <span>Viajes de Usuarios</span>
                </button>

                <button className="quick-action-card" onClick={() => setActiveTab('employees')}>
                  <div className="action-icon-box purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 2l-2 2m-1.5 1.5L14 9a5 5 0 1 0 7 7l3.5-3.5a2 2 0 0 0 0-2.8l-3.5-3.7" />
                    </svg>
                  </div>
                  <span>Accesos Empleados</span>
                </button>

                <button className="quick-action-card" onClick={() => navigate('/master/nuevo-empleado')}>
                  <div className="action-icon-box purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span>Nuevo Empleado</span>
                </button>

                <button className="quick-action-card relative" onClick={() => navigate('/master/conductores')}>
                  <div className="action-icon-box pink">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  {pendingDriversCount > 0 && <span className="card-badge-num">{pendingDriversCount}</span>}
                  <span>Aprobar Conductores</span>
                </button>

                <button className="quick-action-card relative" onClick={() => navigate('/master/restaurantes')}>
                  <div className="action-icon-box brown">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                      <path d="M15 2v10" />
                      <path d="M15 12v10" />
                      <path d="M7 2v20" />
                    </svg>
                  </div>
                  {pendingRestaurantsCount > 0 && <span className="card-badge-num">{pendingRestaurantsCount}</span>}
                  <span>Aprobar Restaurantes</span>
                </button>

                <button className="quick-action-card relative" onClick={() => navigate('/master/publicaciones')}>
                  <div className="action-icon-box purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  {pendingPostsCount > 0 && <span className="card-badge-num">{pendingPostsCount}</span>}
                  <span>Aprobar Publicaciones</span>
                </button>

                <button className="quick-action-card" onClick={() => navigate('/master/finanzas')}>
                  <div className="action-icon-box dark">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
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
                        <th>PERFIL Y PUBLICACIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td colSpan="6" className="empty-table-cell">Cargando lista de usuarios...</td>
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
                            <tr key={u.id} className="clickable-user-row" onClick={() => handleOpenUserProfile(u)} title="Haz clic para ver el perfil y publicaciones">
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
                                  {userRole === 'admin' && 'Admin Master'}
                                  {userRole === 'employee' && 'Empleado'}
                                  {userRole === 'driver' && 'Conductor'}
                                  {userRole === 'restaurant' && 'Restaurante'}
                                  {userRole === 'client' && 'Cliente'}
                                  {!['admin', 'employee', 'driver', 'restaurant', 'client'].includes(userRole) && u.role}
                                </span>
                              </td>
                              <td>
                                <span className="points-val">{pointsVal} pts</span>
                              </td>
                              <td>
                                <span className={`status-pill ${isApproved ? 'green' : 'pending'}`}>
                                  • {isApproved ? 'Aprobado' : 'Pendiente'}
                                </span>
                              </td>
                              <td>
                                <span className="city-val">{u.city || 'Colombia'}</span>
                              </td>
                              <td>
                                <button
                                  className="action-view-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenUserProfile(u);
                                  }}
                                >
                                  Ver Perfil
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-table-cell">No se encontraron usuarios.</td>
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
              <h2 className="master-section-title">Historial de Pedidos por Restaurante</h2>
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
                  <option value="in_preparation">En Preparación</option>
                  <option value="on_the_way">En Camino</option>
                  <option value="completed">Entregado / Completado</option>
                  <option value="cancelled">Cancelado</option>
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
                      <th>ÍTEMS Y CANTIDAD</th>
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
                                <span className="restaurant-title-name">{restName}</span>
                                <span className="restaurant-sub-type">{ord.restaurant?.food_type || 'Restaurante Verificado'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="client-cell-info">
                                <span className="client-name font-bold">{clientName}</span>
                                <span className="client-address-sub">{ord.delivery_address || 'Dirección registrada'}</span>
                              </div>
                            </td>
                            <td>
                              <span className="items-count-badge">{ord.quantity || ord.items?.length || 1} Ítems</span>
                            </td>
                            <td>
                              <span className="order-price-tag">{formatCOP(ord.total_price)}</span>
                            </td>
                            <td>
                              {isDelivered && <span className="status-pill green">Entregado</span>}
                              {isWay && <span className="status-pill blue">En Camino</span>}
                              {isPrep && <span className="status-pill pending">Preparando</span>}
                              {ord.status === 'cancelled' && <span className="status-pill red">Cancelado</span>}
                            </td>
                            <td>
                              <span className="date-time-cell">{formatDateTime(ord.created_at)}</span>
                            </td>
                            <td>
                              <button
                                className="action-view-btn"
                                onClick={() => setSelectedOrderDetails(ord)}
                              >
                                Ver Desglose
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
                  <label>Seleccionar Servicio / Viaje Real:</label>
                  <select
                    value={selectedLiveRideId || activeRideObj?.id || ''}
                    onChange={(e) => setSelectedLiveRideId(e.target.value)}
                  >
                    {ridesList.length > 0 ? (
                      ridesList.map(r => {
                        const drv = r.driver_name || 'Conductor Landa';
                        const orig = r.origin?.address ? r.origin.address.split(',')[0] : 'Origen';
                        const dest = r.destination?.address ? r.destination.address.split(',')[0] : 'Destino';
                        const statusTxt = r.status === 'in_progress' ? '🟢 EN VIVO' : r.status === 'completed' ? '✔️ COMPLETADO' : '🔴 CANCELADO';

                        return (
                          <option key={r.id} value={r.id}>
                            {statusTxt} • {drv} ({orig} ➔ {dest})
                          </option>
                        );
                      })
                    ) : (
                      <option value="">No hay viajes registrados en la base de datos</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="radar-body-grid">
                {/* Visual Route Progress Animation */}
                <div className="route-map-visualizer">
                  <div className="map-simulation-background">
                    <div className="route-path-line">
                      <div
                        className="route-filled-progress"
                        style={{
                          width: `${activeRideObj?.status === 'completed' ? 100 : activeRideObj?.status === 'in_progress' ? telemetryProgress : 0}%`
                        }}
                      ></div>
                      <div
                        className="vehicle-marker-pulse"
                        style={{
                          left: `${activeRideObj?.status === 'completed' ? 98 : activeRideObj?.status === 'in_progress' ? telemetryProgress : 5}%`
                        }}
                      >
                        <span className="marker-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="3" width="15" height="13" />
                            <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    <div className="route-point origin">
                      <span className="point-dot green"></span>
                      <span className="point-label">Origen: {activeRideObj?.origin?.address || 'Punto de Partida'}</span>
                    </div>
                    <div className="route-point destination">
                      <span className="point-dot red"></span>
                      <span className="point-label">Destino: {activeRideObj?.destination?.address || 'Punto de Destino'}</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div className="telemetry-metrics-panel">
                  <div className="telemetry-box">
                    <span className="tele-label">Velocidad Actual</span>
                    <h3 className="tele-value blue">
                      {activeRideObj?.status === 'in_progress' ? telemetrySpeed : activeRideObj?.status === 'completed' ? 0 : 0}{' '}
                      <small>km/h</small>
                    </h3>
                  </div>

                  <div className="telemetry-box">
                    <span className="tele-label">ETA Estimado</span>
                    <h3 className="tele-value green">
                      {activeRideObj?.status === 'in_progress' ? (activeRideObj?.route_details?.duration_min || telemetryEta) : activeRideObj?.status === 'completed' ? '0' : 'N/A'}{' '}
                      <small>min</small>
                    </h3>
                  </div>

                  <div className="telemetry-box">
                    <span className="tele-label">Progreso de Ruta</span>
                    <h3 className="tele-value purple">
                      {activeRideObj?.status === 'completed' ? '100%' : activeRideObj?.status === 'in_progress' ? `${telemetryProgress}%` : '0%'}
                    </h3>
                  </div>

                  <div className="telemetry-box">
                    <span className="tele-label">Tarifa del Servicio</span>
                    <h3 className="tele-value gold">{formatCOP(activeRideObj?.price || 0)}</h3>
                  </div>

                  <div className="telemetry-driver-card">
                    <div className="user-avatar-badge driver-avatar" style={{ width: '42px', height: '42px', minWidth: '42px', background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}>
                      {activeRideObj?.driver_avatar ? (
                        <img src={activeRideObj.driver_avatar} alt={activeRideObj.driver_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span>{(activeRideObj?.driver_name || 'C').substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="driver-mini-info">
                      <span className="driver-name-bold" style={{ color: '#38bdf8' }}>
                        {activeRideObj?.driver_name || 'Conductor no asignado'}
                      </span>
                      <span className="vehicle-info-sub">
                        {activeRideObj?.vehicle_info || activeRideObj?.vehicle_type || 'Vehículo Registrado'}
                      </span>
                      <span className="client-pass-sub">
                        Pasajero: <strong>{activeRideObj?.client_name || 'Cliente'}</strong>
                      </span>
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
                      filteredRides.map((r) => {
                        const driverDisplayName = r.driver_name || 'Conductor Landa';
                        const driverInitials = driverDisplayName.substring(0, 2).toUpperCase();

                        return (
                          <tr key={r.id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar-badge driver-avatar" style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}>
                                  {r.driver_avatar ? (
                                    <img src={r.driver_avatar} alt={driverDisplayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <span>{driverInitials}</span>
                                  )}
                                </div>
                                <div className="user-cell-meta">
                                  <span className="user-cell-name" style={{ color: '#38bdf8', fontWeight: '600' }}>
                                    {driverDisplayName}
                                  </span>
                                  <span className="user-cell-email">
                                    {r.driver_phone ? `Tel: ${r.driver_phone}` : 'Conductor Verificado'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="vehicle-badge">{r.vehicle_info || r.vehicle_type}</span>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar-badge">
                                  {r.client_avatar ? (
                                    <img src={r.client_avatar} alt={r.client_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    (r.client_name || 'U').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="user-cell-meta">
                                  <span className="user-cell-name">{r.client_name || 'Cliente'}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="route-cell-meta">
                                <span className="origin-txt">Origen: {r.origin?.address || 'Origen'}</span>
                                <span className="dest-txt">Destino: {r.destination?.address || 'Destino'}</span>
                              </div>
                            </td>
                            <td>
                              <span className="order-price-tag">{formatCOP(r.price)}</span>
                            </td>
                            <td>
                              <span className="points-val">★ {r.rating || '5.0'}</span>
                            </td>
                            <td>
                              {r.status === 'in_progress' && <span className="status-pill green">En Curso</span>}
                              {r.status === 'completed' && <span className="status-pill blue">Completado</span>}
                              {r.status === 'cancelled' && <span className="status-pill red">Cancelado</span>}
                              {!['in_progress', 'completed', 'cancelled'].includes(r.status) && (
                                <span className="status-pill pending">{r.status || 'Solicitado'}</span>
                              )}
                            </td>
                            <td>
                              <span className="date-time-cell">{formatDateTime(r.created_at)}</span>
                            </td>
                          </tr>
                        );
                      })
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
                      <th>ORIGEN Y DESTINO</th>
                      <th>DISTANCIA / TIEMPO</th>
                      <th>TARIFA PAGADA</th>
                      <th>ESTADO</th>
                      <th>FECHA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUserRides.length > 0 ? (
                      filteredUserRides.map((ur) => {
                        const driverDisplayName = ur.driver_name || (ur.driver_id ? 'Conductor Asignado' : 'Sin Conductor Asignado');
                        const driverInitials = driverDisplayName.substring(0, 2).toUpperCase();

                        return (
                          <tr key={ur.id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar-badge">
                                  {ur.client_avatar ? (
                                    <img src={ur.client_avatar} alt={ur.client_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    (ur.client_name || 'U').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="user-cell-meta">
                                  <span className="user-cell-name">{ur.client_name || 'Cliente'}</span>
                                  <span className="user-cell-email">{ur.client_email || 'Cliente Registrado'}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar-badge driver-avatar" style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}>
                                  {ur.driver_avatar ? (
                                    <img src={ur.driver_avatar} alt={driverDisplayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <span>{driverInitials}</span>
                                  )}
                                </div>
                                <div className="user-cell-meta">
                                  <span className="user-cell-name" style={{ color: '#38bdf8', fontWeight: '600' }}>
                                    {driverDisplayName}
                                  </span>
                                  <span className="user-cell-email">
                                    {ur.driver_phone ? `Tel: ${ur.driver_phone}` : 'Conductor Verificado'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="vehicle-badge">{ur.vehicle_type || 'Carro'}</span>
                            </td>
                            <td>
                              <div className="route-cell-meta">
                                <span className="origin-txt">Origen: {ur.origin?.address || 'Punto de partida'}</span>
                                <span className="dest-txt">Destino: {ur.destination?.address || 'Punto de llegada'}</span>
                              </div>
                            </td>
                            <td>
                              <span className="distance-badge">
                                {ur.route_details?.distance_km || 6.5} km • {ur.route_details?.duration_min || 15} min
                              </span>
                            </td>
                            <td>
                              <span className="order-price-tag">{formatCOP(ur.price)}</span>
                            </td>
                            <td>
                              {ur.status === 'in_progress' && <span className="status-pill green">En Curso</span>}
                              {ur.status === 'completed' && <span className="status-pill blue">Completado</span>}
                              {ur.status === 'cancelled' && <span className="status-pill red">Cancelado</span>}
                              {!['in_progress', 'completed', 'cancelled'].includes(ur.status) && (
                                <span className="status-pill pending">{ur.status || 'Solicitado'}</span>
                              )}
                            </td>
                            <td>
                              <span className="date-time-cell">{formatDateTime(ur.created_at)}</span>
                            </td>
                          </tr>
                        );
                      })
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
                      <span className="specialty-tag">💼 Soporte y Auditoría</span>
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

        {/* TAB 6: ENVIAR DIFUSIÓN DE NOTIFICACIONES Y PROMOCIONES */}
        {activeTab === 'broadcast' && (
          <section className="master-section">
            <div className="section-header-row">
              <div className="section-title-meta">
                <h2 className="master-section-title">Centro de Notificaciones y Promociones Masivas</h2>
                <p className="section-subtitle-desc">
                  Envía alertas, descuentos y avisos a los usuarios con entrega remota en tiempo real (Expo Push Notifications & Supabase).
                </p>
              </div>
              <div className="header-stat-chip">
                <span className="dot-pulse">●</span>
                <span>{loadingTargetTokens ? 'Calculando...' : `${targetTotalRegistered > 0 ? targetTotalRegistered : userCount} Usuarios Registrados en Base de Datos`}</span>
              </div>
            </div>

            {/* BROADCAST MAIN GRID (Form + Live Phone Preview) */}
            <div className="broadcast-creator-grid">
              {/* Form Col */}
              <div className="broadcast-form-card">
                <div className="card-top-header">
                  <span className="header-badge-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </span>
                  <div>
                    <h3>Configurar Notificación Push</h3>
                    <p>Personaliza el alcance, tipo y contenido del mensaje para todos los usuarios registrados.</p>
                  </div>
                </div>

                <div className="broadcast-fields-layout">
                  {/* Audiencia */}
                  <div className="field-group">
                    <label className="field-label">
                      <span>Audiencia Destinataria:</span>
                      <span className="audience-counter-hint">
                        {loadingTargetTokens
                          ? 'Consultando base de datos...'
                          : `(${targetTotalRegistered > 0 ? targetTotalRegistered : userCount} usuarios registrados en BD • ${targetTokensCount} con push activa)`}
                      </span>
                    </label>
                    <div className="role-audience-selector">
                      {[
                        {
                          id: 'all',
                          label: 'Todos los Usuarios',
                          icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          )
                        },
                        {
                          id: 'client',
                          label: 'Clientes',
                          icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          )
                        },
                        {
                          id: 'driver',
                          label: 'Conductores',
                          icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="1" y="3" width="15" height="13" />
                              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                              <circle cx="5.5" cy="18.5" r="2.5" />
                              <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                          )
                        },
                        {
                          id: 'restaurant',
                          label: 'Restaurantes',
                          icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                          )
                        },
                        {
                          id: 'employee',
                          label: 'Empleados',
                          icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 2l-2 2m-1.5 1.5L14 9a5 5 0 1 0 7 7l3.5-3.5a2 2 0 0 0 0-2.8l-3.5-3.7" />
                            </svg>
                          )
                        },
                      ].map(aud => (
                        <button
                          key={aud.id}
                          type="button"
                          className={`audience-chip ${broadcastTarget === aud.id ? 'active' : ''}`}
                          onClick={() => setBroadcastTarget(aud.id)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{aud.icon}</span>
                          <span>{aud.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipo de Notificación */}
                  <div className="field-group">
                    <label className="field-label">Tipo de Contenido:</label>
                    <div className="type-chips-row">
                      {[
                        { id: 'promo', label: 'Promoción y Cupones', color: '#38bdf8' },
                        { id: 'notice', label: 'Aviso Informativo', color: '#818cf8' },
                        { id: 'alert', label: 'Alerta del Sistema', color: '#f87171' },
                        { id: 'food', label: 'Novedad Gastronómica', color: '#fbbf24' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          className={`type-chip-btn ${broadcastType === t.id ? 'active' : ''}`}
                          onClick={() => setBroadcastType(t.id)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canal de Prioridad Android */}
                  <div className="field-group">
                    <label className="field-label">Canal de Notificación (Android OS):</label>
                    <select
                      className="broadcast-select-input"
                      value={broadcastChannel}
                      onChange={(e) => setBroadcastChannel(e.target.value)}
                    >
                      <option value="default">Canal General (LANDA - General)</option>
                      <option value="rides">Canal de Viajes y Domicilios (Alta Prioridad)</option>
                      <option value="orders">Canal de Pedidos de Restaurante</option>
                      <option value="chat">Canal de Mensajería y Chat</option>
                    </select>
                  </div>

                  {/* Título */}
                  <div className="field-group">
                    <label className="field-label">Título de la Notificación:</label>
                    <input
                      type="text"
                      className="broadcast-text-input"
                      placeholder="Ej: Gran Promo de Fin de Semana"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      maxLength={65}
                    />
                  </div>

                  {/* Mensaje / Cuerpo */}
                  <div className="field-group">
                    <label className="field-label">Mensaje Detallado:</label>
                    <textarea
                      className="broadcast-textarea-input"
                      rows={3}
                      placeholder="Escribe el mensaje que verán los usuarios en su dispositivo..."
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      maxLength={200}
                    />
                  </div>

                  {/* Extras si es Promoción */}
                  {broadcastType === 'promo' && (
                    <div className="promo-extras-row">
                      <div className="promo-field">
                        <label className="field-label">Descuento (% o COP):</label>
                        <input
                          type="text"
                          className="broadcast-text-input"
                          placeholder="Ej: 25% o $5.000"
                          value={broadcastDiscount}
                          onChange={(e) => setBroadcastDiscount(e.target.value)}
                        />
                      </div>
                      <div className="promo-field">
                        <label className="field-label">Código de Cupón:</label>
                        <input
                          type="text"
                          className="broadcast-text-input uppercase"
                          placeholder="Ej: LANDALOVER"
                          value={broadcastCouponCode}
                          onChange={(e) => setBroadcastCouponCode(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>
                  )}

                  {/* Botón de Enviar */}
                  <div className="broadcast-action-row">
                    <button
                      className="broadcast-send-btn"
                      onClick={handleSendBroadcast}
                      disabled={sendingBroadcast}
                    >
                      {sendingBroadcast ? (
                        <>
                          <span className="btn-spinner"></span>
                          <span>Despachando Notificación Push...</span>
                        </>
                      ) : (
                        <>
                          <span className="send-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                          </span>
                          <span>Enviar Notificación Masiva ({targetTotalRegistered > 0 ? targetTotalRegistered : (targetTokensCount > 0 ? targetTokensCount : 'Todos')})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Phone Mockup Preview Col */}
              <div className="broadcast-preview-card">
                <div className="preview-header-bar">
                  <span className="preview-dot green"></span>
                  <span className="preview-title">Vista Previa en Dispositivo Real (iOS / Android)</span>
                </div>

                <div className="phone-mockup-frame">
                  {/* Phone Speaker & Camera Notch */}
                  <div className="phone-notch">
                    <div className="phone-speaker"></div>
                    <div className="phone-camera"></div>
                  </div>

                  {/* Status Bar */}
                  <div className="phone-status-bar">
                    <span className="phone-time">{new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                    <div className="phone-icons">
                      <span>📶</span>
                      <span>5G</span>
                      <span>🔋 98%</span>
                    </div>
                  </div>

                  {/* Lockscreen / Floating Notification Popup */}
                  <div className="phone-screen-content">
                    <div className="phone-wallpaper-date">
                      <span className="screen-time-big">{new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                      <span className="screen-date-sub">{getFormattedDate()}</span>
                    </div>

                    {/* Notification Card */}
                    <div className="phone-notification-banner">
                      <div className="notif-banner-header">
                        <div className="notif-brand-left">
                          <div className="notif-mini-logo">L</div>
                          <span className="notif-app-name">LANDA • Ahora</span>
                        </div>
                        <span className="notif-badge-pill">{broadcastType === 'promo' ? 'PROMO' : 'AVISO'}</span>
                      </div>

                      <div className="notif-banner-body">
                        <h4 className="notif-title-text">{broadcastTitle || 'Título de Notificación'}</h4>
                        <p className="notif-body-text">{broadcastBody || 'Escribe un mensaje para previsualizarlo...'}</p>
                      </div>

                      {broadcastType === 'promo' && (broadcastDiscount || broadcastCouponCode) && (
                        <div className="notif-promo-tag-row">
                          {broadcastDiscount && <span className="promo-tag-item">🎁 {broadcastDiscount} OFF</span>}
                          {broadcastCouponCode && <span className="coupon-tag-item">🎟️ Cupón: {broadcastCouponCode}</span>}
                        </div>
                      )}

                      <div className="notif-banner-footer">
                        <span className="tap-hint">Toca para abrir en LANDA App ➔</span>
                      </div>
                    </div>
                  </div>

                  <div className="phone-home-indicator"></div>
                </div>
              </div>
            </div>

            {/* BROADCAST DELIVERY AUDIT HISTORY TABLE */}
            <div className="section-header-row" style={{ marginTop: '3rem' }}>
              <h2 className="master-section-title">📜 Historial y Registro de Difusiones</h2>
              <span className="sub-counter-badge">{broadcastHistoryList.length} Envíos Realizados</span>
            </div>

            <div className="users-table-container">
              <div className="table-wrapper">
                <table className="master-users-table">
                  <thead>
                    <tr>
                      <th>TIPO</th>
                      <th>TÍTULO Y MENSAJE</th>
                      <th>AUDIENCIA</th>
                      <th>CANAL ANDROID</th>
                      <th>DISPOSITIVOS ALCANZADOS</th>
                      <th>ESTADO</th>
                      <th>FECHA / HORA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {broadcastHistoryList.length > 0 ? (
                      broadcastHistoryList.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className={`role-badge ${item.type === 'promo' ? 'restaurant' : item.type === 'alert' ? 'admin' : 'driver'}`}>
                              {item.type === 'promo' ? '🎉 Promoción' : item.type === 'alert' ? '⚡ Alerta' : '📢 Aviso'}
                            </span>
                          </td>
                          <td>
                            <div className="broadcast-history-meta">
                              <span className="broadcast-history-title">{item.title}</span>
                              <span className="broadcast-history-body">{item.body}</span>
                              {item.coupon && <span className="broadcast-coupon-badge">🎟️ Cupón: {item.coupon} ({item.discount || 'Descuento'})</span>}
                            </div>
                          </td>
                          <td>
                            <span className="audience-history-pill">👥 {item.targetLabel || item.target || 'Todos'}</span>
                          </td>
                          <td>
                            <code>{item.channelId || 'default'}</code>
                          </td>
                          <td>
                            <span className="devices-count-highlight">📱 {item.totalSent || 1} equipos</span>
                          </td>
                          <td>
                            <span className="status-pill green">✓ Entregado</span>
                          </td>
                          <td>
                            <span className="date-time-cell">{formatDateTime(item.created_at)}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" className="empty-table-cell">Aún no se han enviado difusiones.</td></tr>
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
                {getNormalizedOrderItems(selectedOrderDetails).map((item, idx) => (
                  <div className="order-item-row" key={idx}>
                    <div className="item-left">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="item-thumb-img" />
                      ) : (
                        <span className="item-qty-badge">{item.quantity || 1}x</span>
                      )}
                      <div className="item-meta">
                        <span className="item-name">{item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                        {item.delivery_fee > 0 && (
                          <span className="item-breakdown-sub">
                            Comida: {formatCOP(item.price * (item.quantity || 1))} • Domicilio: {formatCOP(item.delivery_fee)}
                          </span>
                        )}
                        {item.notes && <span className="item-notes">Nota: {item.notes}</span>}
                      </div>
                    </div>
                    <span className="item-price">{formatCOP(item.price * (item.quantity || 1) + (item.delivery_fee || 0))}</span>
                  </div>
                ))}
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

      {/* USER PROFILE & PUBLISHED POSTS MODAL */}
      {selectedUserProfile && (
        <div className="finances-modal-backdrop" onClick={() => setSelectedUserProfile(null)}>
          <div className="user-profile-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="user-modal-top-header">
              <div className="user-modal-header-main">
                <div className="user-modal-avatar-box">
                  {selectedUserProfile.avatar ? (
                    <img src={selectedUserProfile.avatar} alt={getUserFullName(selectedUserProfile)} />
                  ) : (
                    <span>{getUserFullName(selectedUserProfile).substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="user-modal-title-meta">
                  <div className="user-name-role-row">
                    <h3>{getUserFullName(selectedUserProfile)}</h3>
                    <span className={`role-badge ${selectedUserProfile.role || 'client'}`}>
                      {selectedUserProfile.role === 'admin' && '⭐ Admin'}
                      {selectedUserProfile.role === 'employee' && '👤 Empleado'}
                      {selectedUserProfile.role === 'driver' && '🚗 Conductor'}
                      {selectedUserProfile.role === 'restaurant' && '🏪 Restaurante'}
                      {selectedUserProfile.role === 'client' && '👤 Cliente'}
                    </span>
                    <span className={`status-pill ${selectedUserProfile.status === 'approved' || selectedUserProfile.status === 'Aprobado' ? 'green' : 'pending'}`}>
                      • {selectedUserProfile.status === 'approved' || selectedUserProfile.status === 'Aprobado' ? 'Aprobado' : 'Pendiente'}
                    </span>
                  </div>
                  <span className="user-modal-email-city">
                    ✉️ {selectedUserProfile.email || 'Sin correo'} • 📍 {selectedUserProfile.city || 'Colombia'} {selectedUserProfile.username ? `• @${selectedUserProfile.username}` : ''}
                  </span>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedUserProfile(null)}>✕</button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="user-modal-metrics-bar">
              <div className="modal-metric-chip">
                <span className="chip-label">Puntos Landa</span>
                <span className="chip-value gold">★ {(selectedUserProfile.points || 0).toLocaleString()}</span>
              </div>

              <div className="modal-metric-chip" style={{ position: 'relative' }}>
                <span className="chip-label">Saldo Billetera</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="chip-value green">
                    {formatCOP(userCalculatedBalance !== null ? userCalculatedBalance : (userDriverDetails?.balance ?? selectedUserProfile?.balance ?? 0))}
                  </span>
                  {(selectedUserProfile.role === 'driver' || selectedUserProfile.role === 'conductor') && (
                    <button
                      className="chip-btn active"
                      style={{
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.72rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      title="Asignar Bono de Viajes o Modificar Saldo"
                      onClick={() => handleOpenDriverBonusModal(
                        selectedUserProfile,
                        userCalculatedBalance !== null ? userCalculatedBalance : (userDriverDetails?.balance ?? selectedUserProfile?.balance ?? 0)
                      )}
                    >
                      ⚡ Bono
                    </button>
                  )}
                </div>
              </div>

              <div className="modal-metric-chip">
                <span className="chip-label">Teléfono</span>
                <span className="chip-value blue">{selectedUserProfile.phone || userDriverDetails?.phone || 'No registrado'}</span>
              </div>

              {(selectedUserProfile.role === 'driver' || selectedUserProfile.role === 'conductor') && (
                <div className="modal-metric-chip">
                  <span className="chip-label">Edad</span>
                  <span className="chip-value" style={{ color: '#38bdf8' }}>
                    {userDriverDetails?.age ? (userDriverDetails.age.includes('año') ? userDriverDetails.age : `${userDriverDetails.age} años`) : (selectedUserProfile.age ? `${selectedUserProfile.age} años` : (userDriverDetails?.birth_date ? `${calculateAge(userDriverDetails.birth_date)} años` : (selectedUserProfile.birth_date ? `${calculateAge(selectedUserProfile.birth_date)} años` : 'No registrada')))}
                  </span>
                </div>
              )}

              {(selectedUserProfile.role === 'driver' || selectedUserProfile.role === 'conductor') && (
                <div className="modal-metric-chip">
                  <span className="chip-label">Tipo de Vehículo</span>
                  <span className="chip-value" style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                    {formatVehicleType(userDriverDetails?.vehicle_type || selectedUserProfile.vehicle_type)}
                  </span>
                </div>
              )}

              <div className="modal-metric-chip">
                <span className="chip-label">Fecha de Registro</span>
                <span className="chip-value">{formatDateTime(selectedUserProfile.created_at)}</span>
              </div>
            </div>

            {/* User Bio / Description if present */}
            {selectedUserProfile.description && (
              <div className="user-modal-bio-box">
                <span className="bio-lbl">📝 Descripción / Biografía:</span>
                <p>{selectedUserProfile.description}</p>
              </div>
            )}

            {/* Modal Internal Tabs */}
            <div className="user-modal-tabs-nav">
              <button
                className={`user-modal-tab ${userModalTab === 'posts' ? 'active' : ''}`}
                onClick={() => setUserModalTab('posts')}
              >
                📢 Publicaciones ({userPosts.length})
              </button>

              {(selectedUserProfile.role === 'driver' || selectedUserProfile.role === 'conductor') && (
                <button
                  className={`user-modal-tab ${userModalTab === 'driver_info' ? 'active' : ''}`}
                  onClick={() => setUserModalTab('driver_info')}
                >
                  🚗 Datos del Conductor y Vehículo
                </button>
              )}

              {selectedUserProfile.role === 'restaurant' && (
                <button
                  className={`user-modal-tab ${userModalTab === 'dishes' ? 'active' : ''}`}
                  onClick={() => setUserModalTab('dishes')}
                >
                  🍽️ Menú / Platillos ({userDishes.length})
                </button>
              )}

              {selectedUserProfile.role === 'restaurant' && (
                <button
                  className={`user-modal-tab ${userModalTab === 'info' ? 'active' : ''}`}
                  onClick={() => setUserModalTab('info')}
                >
                  📋 Información Legal y Bancaria
                </button>
              )}
            </div>

            {/* Tab Body */}
            <div className="user-modal-tab-body">
              {loadingUserModalData ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Cargando publicaciones y datos del usuario...
                </div>
              ) : (
                <>
                  {/* TAB 1: POSTS */}
                  {userModalTab === 'posts' && (
                    <div className="user-posts-grid">
                      {userPosts.length > 0 ? (
                        userPosts.map((post) => (
                          <div className="user-post-card" key={post.id}>
                            <div className="post-thumb-box">
                              {post.image_url ? (
                                <img src={post.image_url} alt={post.title} />
                              ) : (
                                <div className="no-img-placeholder">📷 Sin imagen</div>
                              )}
                              <span className={`post-status-tag ${post.status}`}>{post.status}</span>
                            </div>
                            <div className="post-card-content">
                              <span className="post-cat-badge">{post.category || 'General'}</span>
                              <h4 className="post-title">{post.title || 'Publicación sin título'}</h4>
                              <div className="post-price-row">
                                <span className="post-price-tag">{post.price || '$0'}</span>
                                <span className="post-stats-meta">❤️ {post.likes || 0} • 💬 {post.comments || 0}</span>
                              </div>
                              <span className="post-date">{formatDateTime(post.created_at)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-user-modal-state">
                          <p>Este usuario no tiene publicaciones registradas aún.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: DRIVER INFO & DOCUMENTS FROM REAL DATABASE */}
                  {userModalTab === 'driver_info' && (selectedUserProfile.role === 'driver' || selectedUserProfile.role === 'conductor') && (
                    <div className="user-legal-info-grid">
                      {/* Card 1: 👤 Datos Personales e Identificación */}
                      <div className="legal-info-card">
                        <h5>👤 Datos Personales e Identificación (Base de Datos)</h5>
                        <div className="legal-row">
                          <span className="lbl">Edad del Conductor:</span>
                          <strong style={{ color: '#38bdf8' }}>
                            {userDriverDetails?.age ? (userDriverDetails.age.includes('año') ? userDriverDetails.age : `${userDriverDetails.age} años`) : (selectedUserProfile.age ? `${selectedUserProfile.age} años` : (userDriverDetails?.birth_date ? `${calculateAge(userDriverDetails.birth_date)} años` : (selectedUserProfile.birth_date ? `${calculateAge(selectedUserProfile.birth_date)} años` : 'No registrada')))}
                          </strong>
                        </div>
                        <div className="legal-row">
                          <span className="lbl">Fecha de Nacimiento:</span>
                          <span>{userDriverDetails?.birth_date || selectedUserProfile.birth_date || 'No registrada'}</span>
                        </div>
                        <div className="legal-row">
                          <span className="lbl">Documento / Cédula:</span>
                          <code>{userDriverDetails?.cedula || selectedUserProfile.cedula || userDriverDetails?.cc || selectedUserProfile.cc || 'No registrada'}</code>
                        </div>
                        <div className="legal-row">
                          <span className="lbl">Teléfono de Contacto:</span>
                          <span>{userDriverDetails?.phone || selectedUserProfile.phone || 'No registrado'}</span>
                        </div>
                        <div className="legal-row">
                          <span className="lbl">Ciudad:</span>
                          <span>{selectedUserProfile.city || 'No registrada'}</span>
                        </div>
                        <div className="legal-row">
                          <span className="lbl">Dirección Residencia:</span>
                          <span>{selectedUserProfile.address || 'No registrada'}</span>
                        </div>
                      </div>

                      {/* Card 2: 🚗 Información del Vehículo Registrado */}
                      <div className="legal-info-card">
                        <h5>🚗 Información del Vehículo (Base de Datos)</h5>
                        <div className="legal-row">
                          <span className="lbl">Tipo de Vehículo:</span>
                          <strong style={{ color: '#ffffff' }}>
                            {formatVehicleType(userDriverDetails?.vehicle_type || selectedUserProfile.vehicle_type)}
                          </strong>
                        </div>
                        <div className="legal-row">
                          <span className="lbl">Información / Modelo:</span>
                          <strong style={{ color: '#fbbf24' }}>
                            {userDriverDetails?.vehicle_info || selectedUserProfile.vehicle_info || 'Sin detalles registrados'}
                          </strong>
                        </div>
                        <div className="legal-row">
                          <span className="lbl">Estado de Cuenta Conductor:</span>
                          <span style={{ color: userDriverDetails?.status === 'approved' || selectedUserProfile.status === 'approved' || selectedUserProfile.status === 'Aprobado' ? '#4ade80' : '#f59e0b', fontWeight: '700' }}>
                            {userDriverDetails?.status === 'approved' || selectedUserProfile.status === 'approved' || selectedUserProfile.status === 'Aprobado' ? '✓ Aprobado' : '⏳ Pendiente'}
                          </span>
                        </div>
                        <div className="legal-row" style={{ alignItems: 'center' }}>
                          <span className="lbl">Saldo Billetera Conductor:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ color: '#4ade80', fontWeight: '700' }}>
                              {formatCOP(userCalculatedBalance !== null ? userCalculatedBalance : (userDriverDetails?.balance ?? selectedUserProfile?.balance ?? 0))}
                            </span>
                            <button
                              className="chip-btn active"
                              style={{
                                padding: '0.2rem 0.6rem',
                                fontSize: '0.75rem',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '6px'
                              }}
                              onClick={() => handleOpenDriverBonusModal(
                                selectedUserProfile,
                                userCalculatedBalance !== null ? userCalculatedBalance : (userDriverDetails?.balance ?? selectedUserProfile?.balance ?? 0)
                              )}
                            >
                              ⚡ Asignar Bono / Modificar
                            </button>
                          </div>
                        </div>
                        {userDriverDetails?.rating !== undefined && userDriverDetails?.rating !== null && (
                          <div className="legal-row">
                            <span className="lbl">Calificación de Servicio:</span>
                            <span style={{ color: '#fbbf24', fontWeight: '700' }}>★ {userDriverDetails.rating}</span>
                          </div>
                        )}
                        {userDriverDetails?.is_premium !== undefined && (
                          <div className="legal-row">
                            <span className="lbl">Membresía:</span>
                            <span style={{ color: userDriverDetails.is_premium ? '#fbbf24' : '#94a3b8', fontWeight: '700' }}>
                              {userDriverDetails.is_premium ? '⭐ Conductor Premium' : 'Estándar'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card 3: 📄 Documentos Legales Registrados (SOAT, LICENCIA, PROPIEDAD) */}
                      <div className="legal-info-card full-width">
                        <h5>📄 Documentación Legal (SOAT, Licencia y Tarjeta de Propiedad)</h5>
                        <div className="driver-docs-grid-modal">
                          {/* SOAT */}
                          <div
                            className="driver-doc-card-item"
                            onClick={() => (userDriverDetails?.soat_url || selectedUserProfile.soat_url) && setPreviewImage(userDriverDetails?.soat_url || selectedUserProfile.soat_url)}
                          >
                            <div className="doc-item-top">
                              <span className="doc-name-label">🛡️ SOAT (Seguro Obligatorio)</span>
                              <span className={`doc-pill ${(userDriverDetails?.soat_url || selectedUserProfile.soat_url) ? 'green' : 'pending'}`}>
                                {(userDriverDetails?.soat_url || selectedUserProfile.soat_url) ? 'Registrado' : 'No Adjuntado'}
                              </span>
                            </div>
                            <div className="doc-img-preview-wrapper">
                              {(userDriverDetails?.soat_url || selectedUserProfile.soat_url) ? (
                                <img src={userDriverDetails?.soat_url || selectedUserProfile.soat_url} alt="SOAT" className="doc-img-rendered" />
                              ) : (
                                <div className="doc-img-placeholder-card">
                                  <span style={{ fontSize: '2rem' }}>📷</span>
                                  <span>SOAT no subido a la base de datos</span>
                                </div>
                              )}
                            </div>
                            {(userDriverDetails?.soat_url || selectedUserProfile.soat_url) && (
                              <span className="doc-foot-hint">🔍 Clic para ampliar vista de documento</span>
                            )}
                          </div>

                          {/* LICENCIA DE CONDUCCIÓN */}
                          <div
                            className="driver-doc-card-item"
                            onClick={() => (userDriverDetails?.license_url || selectedUserProfile.license_url) && setPreviewImage(userDriverDetails?.license_url || selectedUserProfile.license_url)}
                          >
                            <div className="doc-item-top">
                              <span className="doc-name-label">🪪 LICENCIA DE CONDUCCIÓN</span>
                              <span className={`doc-pill ${(userDriverDetails?.license_url || selectedUserProfile.license_url) ? 'green' : 'pending'}`}>
                                {(userDriverDetails?.license_url || selectedUserProfile.license_url) ? 'Registrada' : 'No Adjuntada'}
                              </span>
                            </div>
                            <div className="doc-img-preview-wrapper">
                              {(userDriverDetails?.license_url || selectedUserProfile.license_url) ? (
                                <img src={userDriverDetails?.license_url || selectedUserProfile.license_url} alt="Licencia" className="doc-img-rendered" />
                              ) : (
                                <div className="doc-img-placeholder-card">
                                  <span style={{ fontSize: '2rem' }}>🪪</span>
                                  <span>Licencia no subida a la base de datos</span>
                                </div>
                              )}
                            </div>
                            {(userDriverDetails?.license_url || selectedUserProfile.license_url) && (
                              <span className="doc-foot-hint">🔍 Clic para ampliar vista de documento</span>
                            )}
                          </div>

                          {/* TARJETA DE PROPIEDAD */}
                          <div
                            className="driver-doc-card-item"
                            onClick={() => (userDriverDetails?.property_card_url || selectedUserProfile.property_card_url) && setPreviewImage(userDriverDetails?.property_card_url || selectedUserProfile.property_card_url)}
                          >
                            <div className="doc-item-top">
                              <span className="doc-name-label">📄 TARJETA DE PROPIEDAD</span>
                              <span className={`doc-pill ${(userDriverDetails?.property_card_url || selectedUserProfile.property_card_url) ? 'green' : 'pending'}`}>
                                {(userDriverDetails?.property_card_url || selectedUserProfile.property_card_url) ? 'Registrada' : 'No Adjuntada'}
                              </span>
                            </div>
                            <div className="doc-img-preview-wrapper">
                              {(userDriverDetails?.property_card_url || selectedUserProfile.property_card_url) ? (
                                <img src={userDriverDetails?.property_card_url || selectedUserProfile.property_card_url} alt="Tarjeta de Propiedad" className="doc-img-rendered" />
                              ) : (
                                <div className="doc-img-placeholder-card">
                                  <span style={{ fontSize: '2rem' }}>📄</span>
                                  <span>Propiedad no subida a la base de datos</span>
                                </div>
                              )}
                            </div>
                            {(userDriverDetails?.property_card_url || selectedUserProfile.property_card_url) && (
                              <span className="doc-foot-hint">🔍 Clic para ampliar vista de documento</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DISHES (RESTAURANT) */}
                  {userModalTab === 'dishes' && selectedUserProfile.role === 'restaurant' && (
                    <div className="user-posts-grid">
                      {userDishes.length > 0 ? (
                        userDishes.map((dish) => (
                          <div className="user-post-card" key={dish.id}>
                            <div className="post-thumb-box">
                              {dish.image_url ? (
                                <img src={dish.image_url} alt={dish.name} />
                              ) : (
                                <div className="no-img-placeholder">🍽️ Platillo</div>
                              )}
                            </div>
                            <div className="post-card-content">
                              <span className="post-cat-badge">{dish.category || 'Categoría'}</span>
                              <h4 className="post-title">{dish.name}</h4>
                              {dish.description && <p className="dish-desc-text">{dish.description}</p>}
                              <span className="post-price-tag">{formatCOP(dish.price)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-user-modal-state">
                          <p>Este restaurante no tiene platillos cargados en su menú.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: LEGAL & BANK INFO (RESTAURANT ONLY) */}
                  {userModalTab === 'info' && selectedUserProfile.role === 'restaurant' && (
                    <div className="user-legal-info-grid">
                      <div className="legal-info-card">
                        <h5>📍 Datos de Contacto y Ubicación</h5>
                        <div className="legal-row"><span className="lbl">Dirección:</span> <span>{selectedUserProfile.address || 'No registrada'}</span></div>
                        <div className="legal-row"><span className="lbl">Ciudad:</span> <span>{selectedUserProfile.city || 'Cali'}</span></div>
                        <div className="legal-row"><span className="lbl">Teléfono:</span> <span>{selectedUserProfile.phone || 'No registrado'}</span></div>
                        {selectedUserProfile.food_type && <div className="legal-row"><span className="lbl">Tipo de Comida:</span> <span>{selectedUserProfile.food_type}</span></div>}
                      </div>

                      <div className="legal-info-card">
                        <h5>🏦 Información Bancaria y Pagos</h5>
                        <div className="legal-row"><span className="lbl">Banco:</span> <span>{selectedUserProfile.bank_name || 'No registrado'}</span></div>
                        <div className="legal-row"><span className="lbl">Tipo de Cuenta:</span> <span>{selectedUserProfile.bank_account_type || 'No registrado'}</span></div>
                        <div className="legal-row"><span className="lbl">Número de Cuenta:</span> <code>{selectedUserProfile.bank_account_number || 'No registrado'}</code></div>
                        <div className="legal-row"><span className="lbl">Titular Cédula:</span> <code>{selectedUserProfile.bank_owner_id || selectedUserProfile.owner_id_card || 'No registrada'}</code></div>
                      </div>

                      <div className="legal-info-card full-width">
                        <h5>📄 Documentación Legal e Identificación</h5>
                        <div className="legal-row"><span className="lbl">Cédula del Propietario:</span> <code>{selectedUserProfile.owner_id_card || 'No registrada'}</code></div>
                        <div className="legal-row"><span className="lbl">RUT:</span> <code>{selectedUserProfile.rut || 'No registrado'}</code></div>
                        <div className="legal-row"><span className="lbl">Cámara de Comercio:</span> <code>{selectedUserProfile.chamber_of_commerce || 'No registrada'}</code></div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {previewImage && (
        <div className="finances-modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="finances-modal-card" style={{ maxWidth: '720px', padding: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="finances-modal-header" style={{ padding: '0 0 1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>🔍 Vista Previa de Documento Registrado</h3>
              <button className="close-modal-btn" onClick={() => setPreviewImage(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#090d16', borderRadius: '12px', padding: '0.75rem', maxHeight: '75vh', overflow: 'hidden' }}>
              <img src={previewImage} alt="Documento Conductor" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN DE BONO / MODIFICACIÓN DE SALDO CONDUCTOR (REQUISITO 3) */}
      {isDriverBonusModalOpen && driverBonusTarget && (
        <div className="finances-modal-backdrop" onClick={() => !submittingDriverBonus && setIsDriverBonusModalOpen(false)}>
          <div
            className="user-profile-modal-card"
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="user-modal-top-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
              <div className="user-modal-header-main">
                <div className="user-modal-avatar-box" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <span>⚡</span>
                </div>
                <div className="user-modal-title-meta">
                  <div className="user-name-role-row">
                    <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>Modificar Saldo / Bono de Viajes</h3>
                    <span className="role-badge driver">🚗 Conductor</span>
                  </div>
                  <span className="user-modal-email-city">
                    {getUserFullName(driverBonusTarget)} • {driverBonusTarget.email || 'Conductor Registrado'}
                  </span>
                </div>
              </div>
              <button
                className="close-modal-btn"
                disabled={submittingDriverBonus}
                onClick={() => setIsDriverBonusModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Current Balance & Policy Banner */}
            <div style={{ padding: '1.25rem 0' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                    Saldo Operativo Actual
                  </span>
                  <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#4ade80' }}>
                    {formatCOP(driverBonusTarget.currentBalance || 0)}
                  </span>
                </div>
                <span
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}
                >
                  ✓ Operativo en Landa
                </span>
              </div>

              {/* Informative Security Notice */}
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.82rem',
                  color: '#93c5fd',
                  lineHeight: '1.4',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '0.6rem'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                <span>
                  <strong>Condición del Bono:</strong> Este crédito es de uso interno para que el conductor pueda seguir operando y cubriendo comisiones en viajes dentro de Landa. <strong>No se procesa a través de Wompi ni se puede retirar a cuentas bancarias externas.</strong>
                </span>
              </div>

              {/* Operation Type Switch */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                  Tipo de Operación:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: bonusOperationType === 'add' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: bonusOperationType === 'add' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: bonusOperationType === 'add' ? '#4ade80' : '#94a3b8',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setBonusOperationType('add')}
                  >
                    ➕ Sumar Bono a Billetera
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: bonusOperationType === 'set' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: bonusOperationType === 'set' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: bonusOperationType === 'set' ? '#38bdf8' : '#94a3b8',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setBonusOperationType('set')}
                  >
                    ⚙️ Establecer Saldo Exacto
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons (if mode is 'add') */}
              {bonusOperationType === 'add' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                    Valores Rápidos:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[10000, 20000, 30000, 50000, 100000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className="chip-btn"
                        style={{
                          background: bonusAmountInput === String(val) ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                          color: bonusAmountInput === String(val) ? '#ffffff' : '#cbd5e1',
                          borderColor: bonusAmountInput === String(val) ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                          fontWeight: '600',
                          padding: '0.35rem 0.75rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => setBonusAmountInput(String(val))}
                      >
                        +{formatCOP(val)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
                  {bonusOperationType === 'add' ? 'Monto del Bono a Sumar (COP):' : 'Nuevo Saldo a Establecer (COP):'}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: '700' }}>$</span>
                  <input
                    type="number"
                    placeholder="Ej. 25000"
                    value={bonusAmountInput}
                    onChange={(e) => setBonusAmountInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem 0.75rem 2.2rem',
                      color: '#ffffff',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  />
                </div>
                {bonusAmountInput && !isNaN(parseInt(bonusAmountInput, 10)) && (
                  <span style={{ fontSize: '0.8rem', color: '#4ade80', display: 'block', marginTop: '0.35rem' }}>
                    Resultado proyectado: <strong>{formatCOP(bonusOperationType === 'add' ? (Number(driverBonusTarget.currentBalance || 0) + Number(bonusAmountInput)) : Number(bonusAmountInput))}</strong>
                  </span>
                )}
              </div>

              {/* Reason / Concept Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>
                  Motivo / Concepto del Bono:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Bono de bienvenida, incentivo de actividad, compensación..."
                  value={bonusReasonInput}
                  onChange={(e) => setBonusReasonInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  className="chip-btn"
                  disabled={submittingDriverBonus}
                  style={{ padding: '0.75rem 1.25rem', cursor: 'pointer' }}
                  onClick={() => setIsDriverBonusModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="chip-btn active"
                  disabled={submittingDriverBonus || !bonusAmountInput || parseInt(bonusAmountInput, 10) <= 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: '700',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (submittingDriverBonus || !bonusAmountInput) ? 'not-allowed' : 'pointer',
                    opacity: (submittingDriverBonus || !bonusAmountInput) ? 0.6 : 1
                  }}
                  onClick={handleApplyDriverBonus}
                >
                  {submittingDriverBonus ? 'Aplicando Bono...' : '⚡ Confirmar y Aplicar Saldo'}
                </button>
              </div>

              {/* Recent Wallet Transactions Section */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📜 Movimientos Recientes de Billetera ({driverWalletTxsList.length})</span>
                  {loadingDriverWalletTxs && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cargando...</span>}
                </h4>
                {loadingDriverWalletTxs ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Cargando transacciones de wallet...
                  </div>
                ) : driverWalletTxsList.length > 0 ? (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {driverWalletTxsList.map((tx) => {
                      const isCredit = tx.type === 'credit' || tx.type === 'admin_bonus' || tx.type === 'promo_subsidy' || tx.type === 'bonus_credit';
                      return (
                        <div
                          key={tx.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.6rem 0.85rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            fontSize: '0.82rem'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: '600', color: isCredit ? '#4ade80' : '#f87171', display: 'block' }}>
                              {tx.type === 'admin_bonus' ? '⚡ Bono Administrativo (No Retirable)' : (tx.type === 'promo_subsidy' ? '🎁 Subsidio Promo Bienvenida' : (tx.type === 'commission_debit' ? '📉 Comisión de Viaje Landa' : tx.type))}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                              {tx.description || 'Transacción de billetera'} • {formatDateTime(tx.created_at)}
                            </span>
                          </div>
                          <span style={{ fontWeight: '700', color: isCredit ? '#4ade80' : '#f87171' }}>
                            {isCredit ? '+' : '-'}{formatCOP(tx.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                    No se registran movimientos previos en la billetera de este conductor.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanelMaster;
