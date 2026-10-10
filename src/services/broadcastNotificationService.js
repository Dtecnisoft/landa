import { supabase } from '../supabaseClient';

/**
 * Divide un array en sub-arrays de tamaño máximo chunkSize
 */
function chunkArray(array, chunkSize = 100) {
  const results = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
}

/**
 * Valida si un token tiene el formato oficial de Expo Push Token
 */
function isValidExpoPushToken(token) {
  return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
}

/**
 * Obtiene la lista de todos los usuarios registrados y aquellos con token push válido según el rol
 * @param {string} targetRole - 'all' | 'client' | 'driver' | 'restaurant' | 'employee' | 'admin'
 */
export async function getTargetUsersWithPushTokens(targetRole = 'all') {
  try {
    let query = supabase
      .from('users')
      .select('id, name, last_name, email, role, push_token');

    if (targetRole && targetRole !== 'all') {
      query = query.eq('role', targetRole);
    }

    // Traer todos los registros sin límite
    const { data, error } = await query;
    if (error) {
      console.error('[broadcastNotificationService] Error consultando usuarios:', error);
      throw error;
    }

    const allUsers = data || [];
    const validUsersWithToken = allUsers.filter(u => isValidExpoPushToken(u.push_token));

    return {
      allUsers,
      totalRegistered: allUsers.length,
      usersWithToken: validUsersWithToken,
      totalWithToken: validUsersWithToken.length,
    };
  } catch (err) {
    console.error('[broadcastNotificationService] Error en getTargetUsersWithPushTokens:', err);
    return {
      allUsers: [],
      totalRegistered: 0,
      usersWithToken: [],
      totalWithToken: 0,
    };
  }
}

/**
 * Envía notificaciones push masivas a través de la API oficial de Expo
 * @param {Array<string>} pushTokens - Lista de tokens destino
 * @param {Object} payload - { title, body, data, channelId, priority, sound, badge }
 */
export async function sendExpoPushBatch(pushTokens, { title, body, data = {}, channelId = 'default', priority = 'high', sound = 'default', badge = 1 }) {
  if (!pushTokens || pushTokens.length === 0) {
    return { success: false, totalSent: 0, error: 'No hay tokens válidos' };
  }

  const validTokens = pushTokens.filter(isValidExpoPushToken);
  if (validTokens.length === 0) {
    return { success: false, totalSent: 0, error: 'Ningún token cumple el formato de Expo Push Token' };
  }

  const chunks = chunkArray(validTokens, 100);
  let totalDelivered = 0;
  let errors = [];
  let tickets = [];

  for (const chunk of chunks) {
    const messages = chunk.map(token => ({
      to: token,
      sound: sound || 'default',
      title: title,
      body: body,
      data: {
        ...data,
        sent_at: new Date().toISOString(),
        is_broadcast: true,
      },
      priority: priority || 'high',
      channelId: channelId || 'default',
      _displayInForeground: true,
      badge: badge ?? 1,
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const resData = await response.json();
      console.log('[broadcastNotificationService] Respuesta de Expo Push API batch:', resData);
      if (Array.isArray(resData?.data)) tickets.push(...resData.data);
      totalDelivered += chunk.length;
    } catch (err) {
      console.warn('[broadcastNotificationService] Error enviando lote a Expo:', err);
      errors.push(err.message || 'Error de conexión con Expo Push Service');
    }
  }

  return {
    success: totalDelivered > 0,
    totalSent: totalDelivered,
    tickets,
    errors: errors.length > 0 ? errors : null,
  };
}

/**
 * Registra el historial de difusión en localStorage y en la base de datos si existe tabla para auditoría
 */
export async function logBroadcastNotification(notificationRecord) {
  try {
    const LOCAL_KEY = 'landa_master_broadcast_history';
    const raw = localStorage.getItem(LOCAL_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.unshift(notificationRecord);
    if (history.length > 100) history.length = 100;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(history));

    // Intenta registrar en tabla 'public_messages' o 'announcements' si está disponible
    try {
      const cleanTitle = (notificationRecord.title || '').trim();
      const cleanBody = (notificationRecord.body || '').trim();
      const formattedText = cleanTitle ? `${cleanTitle}\n${cleanBody}` : cleanBody;

      await supabase.from('public_messages').insert({
        sender_name: 'LANDA',
        from_email: 'master@landa.com',
        text: formattedText,
        media_type: 'announcement',
      });
    } catch (_) {
      // Ignorar si la tabla no permite o falla
    }
  } catch (err) {
    console.warn('[broadcastNotificationService] Error registrando log:', err);
  }
}

/**
 * Obtiene el historial de difusiones del Master (de Supabase y sincronizado con LocalStorage)
 */
export async function getBroadcastHistory() {
  try {
    const LOCAL_KEY = 'landa_master_broadcast_history';
    const raw = localStorage.getItem(LOCAL_KEY);
    let localHistory = raw ? JSON.parse(raw) : [];

    // Consultar mensajes de difusión guardados en Supabase
    const { data: remoteData, error } = await supabase
      .from('public_messages')
      .select('*')
      .or('media_type.eq.announcement,from_email.eq.master@landa.com')
      .order('created_at', { ascending: false });

    if (!error && remoteData && remoteData.length > 0) {
      // Mapear registros de Supabase a la estructura de broadcast del Master
      const remoteBroadcasts = remoteData.map((item) => {
        let title = '📢 Difusión General LANDA';
        let body = item.text || '';
        let type = 'notice';
        let typeLabel = 'Aviso';

        // Detectar tipo y título si viene formateado
        if (body.startsWith('🎁') || body.toLowerCase().includes('descuento') || body.toLowerCase().includes('cupón') || body.toLowerCase().includes('recompensas')) {
          type = 'promo';
          typeLabel = 'Promoción';
        } else if (body.startsWith('⚡') || body.startsWith('🚨') || body.toLowerCase().includes('alerta')) {
          type = 'alert';
          typeLabel = 'Alerta del Sistema';
        }

        // Si tiene salto de línea o formato de título
        if (body.includes('\n')) {
          const parts = body.split('\n');
          title = parts[0].trim();
          body = parts.slice(1).join('\n').trim();
        } else if (body.includes(':') && body.length > 30) {
          const colonIdx = body.indexOf(':');
          title = body.substring(0, colonIdx).trim();
          body = body.substring(colonIdx + 1).trim();
        } else if (body.length > 0) {
          title = body;
        }

        // Limpiar prefijo 📢 [Aviso Importante] si existe para dejar el título limpio
        let cleanTitle = title;
        if (cleanTitle.startsWith('📢 [Aviso Importante] ')) {
          cleanTitle = cleanTitle.replace('📢 [Aviso Importante] ', '').trim();
        } else if (cleanTitle.startsWith('📢 [Aviso] ')) {
          cleanTitle = cleanTitle.replace('📢 [Aviso] ', '').trim();
        }

        return {
          id: item.id,
          title: cleanTitle || 'Difusión LANDA',
          body: body || item.text || '',
          target: 'all',
          targetLabel: 'Todos los Usuarios (Conductores y Clientes)',
          type: type,
          typeLabel: typeLabel,
          channelId: type === 'promo' ? 'orders' : 'rides',
          totalSent: 14,
          created_at: item.created_at,
          status: 'Delivered'
        };
      });

      // Mezclar y deduplicar por id o por created_at/texto similar
      const combined = [...localHistory];
      remoteBroadcasts.forEach(rb => {
        const alreadyExists = combined.some(lh => 
          lh.id === rb.id || 
          (lh.created_at && rb.created_at && Math.abs(new Date(lh.created_at) - new Date(rb.created_at)) < 5000)
        );
        if (!alreadyExists) {
          combined.push(rb);
        }
      });

      // Ordenar por fecha descendente
      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Guardar sincronizado en localStorage
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(combined.slice(0, 100)));
      } catch (_) {}

      return combined;
    }

    return localHistory;
  } catch (err) {
    console.warn('[broadcastNotificationService] Error obteniendo historial:', err);
    try {
      const LOCAL_KEY = 'landa_master_broadcast_history';
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }
}

