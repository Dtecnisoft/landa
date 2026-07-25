import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/images/logo.png';
import { useToast } from '../context/ToastContext';

function EmployeeDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    pendingPosts: 0,
    tickets: 4,
    reports: 12
  });
  const [loading, setLoading] = useState(true);

  // Load employee user session & specialties
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
        const u = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Empleado',
          avatar: session.user.user_metadata?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email)}&background=4556EC&color=fff`,
          specialties: ['moderation', 'support', 'reports', 'finances'] // Default full access for web preview
        };
        setUser(u);
      }
    });

    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!error && count !== null) {
        setStats((prev) => ({ ...prev, pendingPosts: count }));
      }
    } catch (e) {
      console.error('Error loading employee metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error logging out:', e);
    }
    localStorage.removeItem('landa_user');
    showToast('Sesión de empleado cerrada correctamente. ¡Hasta pronto!', 'info', 'Cierre de Sesión');
    navigate('/');
  };

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Buenos días' : today.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';
  const dateStr = today.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  // Permissions helpers
  const specialties = user?.specialties || ['moderation', 'support', 'reports', 'finances'];
  const hasModerationPermission = specialties.includes('moderation');
  const hasSupportPermission = specialties.includes('support');
  const hasReportsPermission = specialties.includes('reports');
  const hasFinancesPermission = specialties.includes('finances');

  return (
    <div className="master-panel-page">
      {/* HEADER */}
      <header className="master-header">
        <div className="master-header-inner">
          <div className="master-brand">
            <img src={logo} alt="Landa Logo" className="master-logo-img" />
            <div className="master-brand-titles">
              <span className="master-brand-name">LANDA</span>
              <span className="master-brand-sub">Panel de Empleado</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="master-online-status">
              <span className="status-dot"></span>
              <span>En línea</span>
            </div>

            <button className="chip-btn" onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      <main className="master-container" style={{ maxWidth: '980px' }}>
        {/* WELCOME BANNER */}
        <div className="master-hero-banner" style={{ padding: '2rem', background: 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.78)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              📅 {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
            </span>
            <h1 className="banner-greeting" style={{ fontSize: '2rem', margin: 0, color: '#ffffff' }}>
              {greeting}, <br />
              <span style={{ fontWeight: 900, color: '#60a5fa' }}>{user?.name?.split(' ')[0] || 'Empleado'}</span>
            </h1>
          </div>

          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Empleado')}&background=3b82f6&color=fff`}
            alt="Avatar Empleado"
            style={{ width: '70px', height: '70px', borderRadius: '20px', border: '3px solid rgba(255,255,255,0.3)', objectFit: 'cover' }}
          />
        </div>

        {/* METRICS STATS GRID */}
        <div className="master-metrics-grid" style={{ marginTop: '1.25rem' }}>
          <div className="metric-card">
            <div className="metric-icon-box purple">🛡️</div>
            <div className="metric-info">
              <span className="metric-val">{stats.pendingPosts}</span>
              <span className="metric-label">Posts Pendientes</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box green">🎧</div>
            <div className="metric-info">
              <span className="metric-val">{stats.tickets}</span>
              <span className="metric-label">Tickets Soporte</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box orange">🚩</div>
            <div className="metric-info">
              <span className="metric-val">{stats.reports}</span>
              <span className="metric-label">Reportes</span>
            </div>
          </div>
        </div>

        {/* GESTIÓN RÁPIDA */}
        <section className="master-section" style={{ marginTop: '1.75rem' }}>
          <h2 className="master-section-title">Gestión Rápida de Operaciones</h2>
          <div className="quick-actions-grid">
            {(hasModerationPermission || hasSupportPermission) && (
              <button className="quick-action-card relative" onClick={() => navigate('/master/publicaciones')}>
                <div className="action-icon-box purple">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                {stats.pendingPosts > 0 && <span className="card-badge-num">{stats.pendingPosts}</span>}
                <span>Publicaciones</span>
              </button>
            )}

            {hasSupportPermission && (
              <button className="quick-action-card" onClick={() => showToast('Centro de atención y tickets de soporte activo.', 'info', 'Módulo Soporte')}>
                <div className="action-icon-box green">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span>Soporte</span>
              </button>
            )}

            {hasReportsPermission && (
              <button className="quick-action-card" onClick={() => showToast('Centro de revisión de incidencias y reportes.', 'warning', 'Módulo Reportes')}>
                <div className="action-icon-box orange">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                </div>
                <span>Reportes</span>
              </button>
            )}

            {hasFinancesPermission && (
              <button className="quick-action-card" onClick={() => navigate('/master/finanzas')}>
                <div className="action-icon-box purple">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <span>Finanzas</span>
              </button>
            )}
          </div>
        </section>

        {/* TAREAS PRIORITARIAS */}
        <section className="master-section" style={{ marginTop: '1.75rem' }}>
          <h2 className="master-section-title">Tareas Prioritarias</h2>
          <div className="users-table-container" style={{ padding: '0.75rem 1.25rem' }}>
            <div className="activity-item" style={{ cursor: 'pointer' }} onClick={() => showToast('Abriendo reporte de chat #4023...', 'info', 'Reportes')}>
              <div className="activity-left">
                <div className="activity-icon-circle" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' }}>🚩</div>
                <div className="activity-details">
                  <span className="activity-title">Revisar Reporte #4023</span>
                  <span className="activity-sub">Comportamiento inapropiado en chat de vecinos</span>
                </div>
              </div>
              <div className="activity-right">
                <span className="activity-badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' }}>10:30 AM</span>
              </div>
            </div>

            <div className="activity-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/master/publicaciones')}>
              <div className="activity-left">
                <div className="activity-icon-circle aprobado">🛡️</div>
                <div className="activity-details">
                  <span className="activity-title">Moderación de Posts</span>
                  <span className="activity-sub">{stats.pendingPosts} publicaciones esperando revisión en tiempo real</span>
                </div>
              </div>
              <div className="activity-right">
                <span className="activity-badge aprobado">Ahora</span>
              </div>
            </div>

            <div className="activity-item" style={{ cursor: 'pointer' }} onClick={() => showToast('Abriendo ticket #99 de soporte técnico...', 'info', 'Soporte')}>
              <div className="activity-left">
                <div className="activity-icon-circle registro">🎧</div>
                <div className="activity-details">
                  <span className="activity-title">Ticket #99 - Soporte Técnico</span>
                  <span className="activity-sub">Falla en carga de foto de perfil de usuario</span>
                </div>
              </div>
              <div className="activity-right">
                <span className="activity-badge registro">02:00 PM</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EmployeeDashboard;
