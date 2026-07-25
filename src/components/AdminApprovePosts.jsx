import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/images/logo.png';
import { useToast } from '../context/ToastContext';

const TABS = [
  { id: 'pending', label: 'Pendientes', icon: '⏳', color: '#f59e0b' },
  { id: 'approved', label: 'Aprobadas', icon: '✅', color: '#10b981' },
  { id: 'rejected', label: 'Rechazadas', icon: '❌', color: '#ef4444' },
];

const BANNED_KEYWORDS = [
  'estafa', 'fraude', 'drogas', 'armas', 'violencia', 'sexo',
  'casino', 'apuestas', 'ilegal', 'piramidal', 'multinivel'
];

function runKeywordModeration(text) {
  if (!text) return { isApproved: true };
  const lower = text.toLowerCase();
  for (const word of BANNED_KEYWORDS) {
    if (lower.includes(word)) {
      return { isApproved: false, reason: `Palabra no permitida detectada: "${word}"` };
    }
  }
  return { isApproved: true };
}

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

function AdminApprovePosts() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [isAutoModerating, setIsAutoModerating] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const adapted = (data || []).map((p) => ({
        ...p,
        image: p.image_url || p.image,
        time: p.created_at,
        user: p.user_email || p.user_name || 'Usuario',
        userFullName: p.user_full_name || p.user_name || 'Usuario Landa',
      }));

      setPosts(adapted);
    } catch (e) {
      console.error('Error loading posts:', e);
      showToast('Error al cargar la lista de publicaciones.', 'error', 'Error Supabase');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const updatePostStatus = async (postId, newStatus, authorEmail) => {
    setUpdatingId(postId);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', postId);

      if (error) throw error;

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
      );

      // If rejected and authorEmail exists, deduct 50 points
      if (newStatus === 'rejected' && authorEmail) {
        try {
          const { data: userRow } = await supabase
            .from('users')
            .select('id, points')
            .eq('email', authorEmail)
            .single();

          if (userRow) {
            const newPoints = Math.max(0, (userRow.points || 0) - 50);
            await supabase.from('users').update({ points: newPoints }).eq('id', userRow.id);

            await supabase.from('points_transactions').insert({
              user_id: userRow.id,
              amount: -50,
              type: 'redeemed',
              description: 'Publicación rechazada por moderación'
            });
          }
        } catch (pointErr) {
          console.log('Notice deducting points:', pointErr);
        }
      }

      if (newStatus === 'approved') {
        showToast('La publicación ha sido aprobada y ahora es pública.', 'success', '¡Publicación Aprobada!');
      } else {
        showToast('La publicación fue rechazada y se descontaron 50 Puntos al usuario.', 'warning', 'Publicación Rechazada');
      }
    } catch (e) {
      console.error(e);
      showToast('No se pudo actualizar el estado de la publicación.', 'error', 'Error de Moderación');
    } finally {
      setUpdatingId(null);
    }
  };

  const runAutoModeration = async () => {
    const pendingPosts = posts.filter((p) => (p.status || 'pending') === 'pending');
    if (pendingPosts.length === 0) {
      showToast('No hay publicaciones pendientes para moderar.', 'info', 'Auto-Moderación IA');
      return;
    }

    setIsAutoModerating(true);
    let approvedCount = 0;
    let rejectedCount = 0;

    try {
      for (const p of pendingPosts) {
        const modResult = runKeywordModeration(p.title || p.content || '');
        const newStatus = modResult.isApproved ? 'approved' : 'rejected';
        if (newStatus === 'approved') approvedCount++;
        else rejectedCount++;

        await supabase.from('posts').update({
          status: newStatus,
          auto_moderated: true,
          moderation_reason: modResult.reason || null,
        }).eq('id', p.id);
      }

      await loadPosts();
      showToast(`Procesadas: ${pendingPosts.length} | ✅ Aprobadas: ${approvedCount} | ❌ Rechazadas: ${rejectedCount}`, 'success', 'Análisis IA Completo');
    } catch (e) {
      console.error('Error auto-moderating:', e);
      showToast('Error al ejecutar el algoritmo de auto-moderación.', 'error', 'Error IA');
    } finally {
      setIsAutoModerating(false);
    }
  };

  // Filtered posts for active tab and search query
  const filteredPosts = posts.filter((p) => {
    const pStatus = p.status || 'pending';
    if (pStatus !== activeTab) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const title = (p.title || p.content || '').toLowerCase();
      const author = (p.userFullName || p.user || '').toLowerCase();
      const city = (p.userCity || p.location || '').toLowerCase();
      return title.includes(q) || author.includes(q) || city.includes(q);
    }
    return true;
  });

  const getTabCount = (tabId) => {
    return posts.filter((p) => (p.status || 'pending') === tabId).length;
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
              <span className="master-brand-sub">Panel Master • Moderación de Publicaciones</span>
            </div>
          </div>

          <button className="chip-btn active" onClick={() => navigate('/master')}>
            ← Volver al Panel Master
          </button>
        </div>
      </header>

      <main className="master-container" style={{ maxWidth: '980px' }}>
        {/* BANNER */}
        <div className="master-hero-banner" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}>
          <div>
            <h1 className="banner-greeting" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Moderación de Publicaciones del Feed</h1>
            <p className="banner-subtext">Revisa las publicaciones de la comunidad, aprueba ofertas y filtra contenido inapropiado.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="chip-btn"
              onClick={runAutoModeration}
              disabled={isAutoModerating}
              style={{ background: '#7c3aed', borderColor: '#8b5cf6', color: '#ffffff', fontWeight: 700 }}
            >
              🤖 {isAutoModerating ? 'Analizando con IA...' : `Auto-Moderar IA (${getTabCount('pending')})`}
            </button>
            <button className="chip-btn" onClick={loadPosts} style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }}>
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* SEARCH AND TABS BAR */}
        <div className="system-status-card" style={{ padding: '1.25rem', gap: '1.25rem' }}>
          <div className="table-search-box" style={{ width: '100%' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por título de publicación, nombre del autor o ciudad..."
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
            <p style={{ color: '#94a3b8' }}>Cargando publicaciones desde Supabase...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="system-status-card text-center" style={{ padding: '3.5rem 1.5rem', gap: '0.75rem' }}>
            <span style={{ fontSize: '3rem' }}>📂</span>
            <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1.2rem' }}>Sin Resultados</h3>
            <p style={{ color: '#8a99ad', margin: 0, fontSize: '0.9rem' }}>
              No hay publicaciones en la categoría "{TABS.find((t) => t.id === activeTab)?.label}".
            </p>
          </div>
        ) : (
          <div className="restaurants-cards-grid">
            {filteredPosts.map((post) => {
              const isUpdating = updatingId === post.id;

              // Parse image or images array
              let images = [];
              if (post.image) {
                if (typeof post.image === 'string' && post.image.startsWith('[') && post.image.endsWith(']')) {
                  try {
                    images = JSON.parse(post.image);
                  } catch (e) {
                    images = [post.image];
                  }
                } else {
                  images = [post.image];
                }
              }

              return (
                <div key={post.id} className="restaurant-master-card">
                  <div className="restaurant-card-header">
                    <img
                      src={post.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userFullName || 'U')}&background=4f46e5&color=fff`}
                      alt={post.userFullName}
                      className="restaurant-avatar-img"
                    />
                    <div className="restaurant-header-info">
                      <h3 className="restaurant-title-name">{post.userFullName || post.user}</h3>
                      <span className="restaurant-food-badge">
                        {formatTimeAgo(post.time)} • {post.userCity || post.location || 'Colombia'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={`status-badge-chip ${activeTab}`}>
                        {activeTab === 'pending' ? 'PENDIENTE' : activeTab === 'approved' ? 'APROBADA' : 'RECHAZADA'}
                      </span>
                      {post.auto_moderated && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                          🤖 IA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="restaurant-card-details" style={{ gap: '0.65rem' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
                      {post.title || post.content || 'Sin título'}
                    </p>

                    {post.price && (
                      <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.9rem' }}>
                        💰 {post.price}
                      </span>
                    )}

                    {/* IMAGES */}
                    {images.length > 0 && (
                      <div className="post-images-preview-row">
                        {images.map((img, idx) => (
                          <img key={idx} src={img} alt={`Adjunto ${idx + 1}`} className="post-attached-img" />
                        ))}
                      </div>
                    )}

                    {post.moderation_reason && activeTab === 'rejected' && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.6rem 0.8rem', borderRadius: '10px', marginTop: '0.4rem' }}>
                        <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem', display: 'block' }}>Razón del Algoritmo:</span>
                        <span style={{ color: '#fca5a5', fontSize: '0.78rem' }}>{post.moderation_reason}</span>
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
                          onClick={() => updatePostStatus(post.id, 'rejected', post.user)}
                        >
                          ✕ Rechazar
                        </button>
                        <button
                          className="btn-action-approve"
                          disabled={isUpdating}
                          onClick={() => updatePostStatus(post.id, 'approved', post.user)}
                        >
                          ✓ Aprobar
                        </button>
                      </>
                    )}

                    {activeTab === 'approved' && (
                      <button
                        className="btn-action-reject full-width"
                        disabled={isUpdating}
                        onClick={() => updatePostStatus(post.id, 'rejected', post.user)}
                      >
                        ⚠️ Revocar y Rechazar
                      </button>
                    )}

                    {activeTab === 'rejected' && (
                      <button
                        className="btn-action-approve full-width"
                        disabled={isUpdating}
                        onClick={() => updatePostStatus(post.id, 'approved', post.user)}
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

export default AdminApprovePosts;
