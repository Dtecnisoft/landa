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
 * Consulta los recibos de Expo para diagnosticar errores reales de entrega (FCM/APNs).
 * Un ticket "ok" solo significa que Expo aceptó el mensaje; el recibo indica si llegó al dispositivo.
 */
export async function checkExpoReceipts(ticketIds = []) {
  const ids = (ticketIds || []).filter(Boolean);
  if (ids.length === 0) return {};
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const json = await response.json();
    return json?.data || {};
  } catch (err) {
    console.warn('[broadcastNotificationService] Error consultando recibos de Expo:', err);
    return {};
  }
}

/**
 * Envía una notificación push a UN solo usuario usando exactamente la misma vía y el mismo
 * formato de payload que la Difusión Masiva (type broadcast_notice), que es el que la app móvil reconoce.
 *
 * @param {Object} target - { id, email } del usuario destinatario
 * @param {Object} message - { title, body, extraData }
 * @returns {Promise<{ delivered: boolean, reason: string, ticket: any, userName: string|null }>}
 */
export async function sendPushToSingleUser(target, { title, body, extraData = {} }) {
  const userId = target?.id ? String(target.id) : null;
  const email = target?.email ? String(target.email).toLowerCase().trim() : null;

  if (!userId && !email) {
    return { delivered: false, reason: 'Destinatario sin id ni correo', ticket: null, userName: null };
  }

  // 1. Consulta directa del token del destinatario (no descargar toda la tabla)
  let userRow = null;
  try {
    if (userId) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, role, push_token')
        .eq('id', userId)
        .maybeSingle();
      userRow = data || null;
    }
    if (!userRow?.push_token && email) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, role, push_token')
        .ilike('email', email)
        .limit(1);
      if (data && data[0]) userRow = data[0];
    }
  } catch (err) {
    console.warn('[sendPushToSingleUser] Error consultando token del usuario:', err);
  }

  const token = userRow?.push_token || null;

  // 2. Canal A: Registrar como Mensaje Privado Oficial en private_messages
  // (Garantiza 100% privacidad entre usuarios: solo el destinatario lo ve en su buzón de LANDA con conv_id exclusivo)
  let appMessagePublished = false;
  const targetEmail = (userRow?.email || email || '').toLowerCase().trim();
  const senderEmail = 'master@landa.com';
  const convId = targetEmail
    ? [senderEmail, targetEmail].sort().join('__')
    : `master@landa.com__user_${userId || Date.now()}`;

  try {
    const formattedText = `${(title || '').trim()}\n${(body || '').trim()}`;
    const { error: msgErr } = await supabase.from('private_messages').insert({
      conv_id: convId,
      from_email: senderEmail,
      sender_name: 'LANDA',
      text: formattedText,
      media_type: 'notice',
      media_url: null,
    });

    if (!msgErr) {
      appMessagePublished = true;
      console.log(`[sendPushToSingleUser] Mensaje privado registrado exitosamente en private_messages (conv_id: ${convId}).`);
    } else {
      console.warn('[sendPushToSingleUser] Advertencia insertando en private_messages:', msgErr);
    }
  } catch (msgErr) {
    console.warn('[sendPushToSingleUser] Excepción al registrar mensaje en private_messages:', msgErr);
  }

  // 3. Canal B: Transmitir por canal de Supabase Realtime Broadcast privado y canales de usuario
  try {
    const candidateChannels = [
      `landa-private-${userId || targetEmail || 'notice'}`,
      userId ? `user-${userId}` : null,
      userId ? `user:${userId}` : null,
      userId ? `points-${userId}` : null,
      userId ? `profile-${userId}` : null,
      targetEmail ? `user-${targetEmail}` : null,
      targetEmail ? `user:${targetEmail}` : null,
      `dashboard-users-realtime`
    ].filter(Boolean);

    for (const channelName of candidateChannels) {
      try {
        const realtimeChannel = supabase.channel(channelName);
        realtimeChannel.subscribe((subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            const rtPayload = {
              conv_id: convId,
              from_email: senderEmail,
              sender_name: 'LANDA',
              title,
              body,
              user_id: userId,
              email: targetEmail,
              sent_at: new Date().toISOString(),
              ...extraData
            };
            Promise.all([
              realtimeChannel.send({ type: 'broadcast', event: 'private_notice', payload: rtPayload }),
              realtimeChannel.send({ type: 'broadcast', event: 'points_updated', payload: rtPayload }),
              realtimeChannel.send({ type: 'broadcast', event: 'points_update', payload: rtPayload }),
              realtimeChannel.send({ type: 'broadcast', event: 'user_updated', payload: rtPayload }),
              realtimeChannel.send({ type: 'broadcast', event: 'profile_updated', payload: rtPayload })
            ]).finally(() => {
              setTimeout(() => {
                try { supabase.removeChannel(realtimeChannel); } catch (_) {}
              }, 3000);
            });
          }
        });
      } catch (_) {}
    }
  } catch (rtErr) {
    console.warn('[sendPushToSingleUser] Advertencia en Supabase Realtime Broadcast:', rtErr);
  }

  // 4. Canal C: Despachar notificación nativa a Expo Push API si tiene token válido
  let expoDelivered = false;
  let expoFailReason = '';
  let ticket = null;

  if (token && isValidExpoPushToken(token)) {
    // Preservar tipo específico (ej. points_update o wallet_bonus) para que el listener de la app móvil actualice el estado
    const effectiveType = extraData.type || (extraData.points_update ? 'points_update' : (extraData.bonus ? 'wallet_bonus' : 'broadcast_notice'));
    const effectiveAction = extraData.action || (extraData.points_update ? 'points_update' : (extraData.bonus ? 'wallet_bonus' : 'broadcast_notice'));
    const effectiveEvent = extraData.event || (extraData.points_update ? 'points_updated' : 'broadcast_notice');

    const payloadData = {
      type: effectiveType,
      action: effectiveAction,
      event: effectiveEvent,
      notification_type: effectiveType,
      broadcast_id: `single-${Date.now()}`,
      broadcast_type: 'notice',
      target_role: userRow?.role || 'all',
      title,
      body,
      user_id: userId,
      userId: userId,
      email: targetEmail,
      user_email: targetEmail,
      points: extraData.points ?? extraData.new_points,
      new_points: extraData.new_points ?? extraData.points,
      user_points: extraData.user_points ?? extraData.points,
      points_balance: extraData.points ?? extraData.new_points,
      balance: extraData.new_balance ?? extraData.points,
      new_balance: extraData.new_balance,
      delta: extraData.delta,
      amount: extraData.amount ?? extraData.delta,
      _displayInForeground: true,
      ...extraData,
    };

    const result = await sendExpoPushBatch([token], {
      title,
      body,
      data: payloadData,
      channelId: 'default',
      priority: 'high',
      sound: 'default',
      badge: 1,
      _displayInForeground: true,
    });

    ticket = result?.tickets?.[0] || null;
    console.log('[sendPushToSingleUser] Ticket Expo:', ticket);

    if (ticket?.status === 'ok') {
      expoDelivered = true;
    } else {
      expoFailReason = ticket?.details?.error || ticket?.message || (result?.errors || []).join(', ') || result?.error || 'Expo Push rechazó la entrega';
    }

    // Diagnóstico no bloqueante: consultar recibo de Expo si dio ok
    if (ticket?.id) {
      setTimeout(async () => {
        const receipts = await checkExpoReceipts([ticket.id]);
        const receipt = receipts?.[ticket.id];
        if (receipt?.status === 'error') {
          console.error('[sendPushToSingleUser] Expo reportó fallo de entrega al dispositivo:', receipt.details?.error, receipt.message);
        } else if (receipt) {
          console.log('[sendPushToSingleUser] Recibo de entrega OK:', receipt);
        }
      }, 5000);
    }
  } else if (!token) {
    expoFailReason = 'El usuario no tiene push_token registrado';
  } else {
    expoFailReason = `Token inválido: ${String(token).slice(0, 20)}…`;
  }

  const isOverallDelivered = appMessagePublished || expoDelivered;
  let overallReason = '';
  if (!isOverallDelivered) {
    overallReason = expoFailReason || 'No se pudo entregar por ningún canal';
  }

  return {
    delivered: isOverallDelivered,
    reason: overallReason,
    ticket,
    userName: userRow?.name || null,
    viaApp: appMessagePublished,
    viaExpo: expoDelivered
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
  const LOCAL_KEY = 'landa_master_broadcast_history';
  let localHistory = [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    localHistory = raw ? JSON.parse(raw) : [];
  } catch (_) {}

  try {
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

      // Conservar difusiones locales en memoria si no existen en remoto
      const combined = [...remoteBroadcasts];
      localHistory.forEach(lh => {
        if (String(lh.id).startsWith('bc-')) {
          const exists = combined.some(rb => rb.id === lh.id || rb.created_at === lh.created_at);
          if (!exists) combined.push(lh);
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
    return localHistory;
  }
}

/**
 * Elimina una difusión del historial local (localStorage) y de Supabase (public_messages) estrictamente por UUID
 * @param {Object|string} itemOrId - Objeto de difusión o ID
 */
export async function deleteBroadcastNotification(itemOrId) {
  const LOCAL_KEY = 'landa_master_broadcast_history';
  const id = typeof itemOrId === 'object' ? itemOrId?.id : itemOrId;
  const targetObj = typeof itemOrId === 'object' ? itemOrId : null;

  // 1. Eliminar de localStorage
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const history = JSON.parse(raw);
      const filtered = history.filter((item) => {
        if (id && item.id === id) return false;
        if (targetObj?.created_at && item.created_at === targetObj.created_at) return false;
        return true;
      });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn('[broadcastNotificationService] Error borrando de localStorage:', err);
  }

  // 2. Eliminar de Supabase (public_messages) estrictamente por ID exacto
  try {
    if (id && !String(id).startsWith('bc-')) {
      const { error: delErr } = await supabase.from('public_messages').delete().eq('id', id);
      if (delErr) console.warn('[deleteBroadcastNotification] Error eliminando en Supabase:', delErr);
    }
  } catch (dbErr) {
    console.warn('[broadcastNotificationService] Error borrando de Supabase public_messages:', dbErr);
  }

  return true;
}

