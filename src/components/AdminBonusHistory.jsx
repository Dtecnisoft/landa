import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/images/logo.png';
import { useToast } from '../context/ToastContext';

function formatCOP(val) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val || 0);
}

function AdminBonusHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [bonusHistoryList, setBonusHistoryList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const isEmployeeRoute = location.pathname.startsWith('/empleado');
  const isEmployeeRole = currentUser?.role === 'employee';
  const isEmployeeMode = isEmployeeRoute || (isEmployeeRole && currentUser?.role !== 'admin' && currentUser?.role !== 'master');

  useEffect(() => {
    const saved = localStorage.getItem('landa_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const [kpis, setKpis] = useState({
    totalAmount: 0,
    totalCount: 0,
    uniqueDriversCount: 0,
    averageBonus: 0
  });

  const loadBonusHistory = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Obtener transacciones de bonos en wallet_transactions
      const { data: txsData, error: txsErr } = await supabase
        .from('wallet_transactions')
        .select('*')
        .or('type.eq.admin_bonus,type.eq.bonus_credit,payment_method.eq.bono interno')
        .order('created_at', { ascending: false })
        .limit(300);

      if (txsErr) {
        console.error('Error fetching bonus transactions:', txsErr);
      }

      const txs = txsData || [];

      // 2. Extraer driver_ids únicos para obtener información del usuario/conductor
      const driverIds = [...new Set(txs.map((t) => t.driver_id).filter(Boolean))];

      let usersMap = {};
      let driversMap = {};

      if (driverIds.length > 0) {
        const [usersRes, driversRes] = await Promise.all([
          supabase.from('users').select('id, name, last_name, email, phone').in('id', driverIds),
          supabase.from('drivers').select('id, user_id, name, phone, email').or(`id.in.(${driverIds.join(',')}),user_id.in.(${driverIds.join(',')})`)
        ]);

        if (usersRes.data) {
          usersRes.data.forEach((u) => {
            usersMap[u.id] = u;
          });
        }

        if (driversRes.data) {
          driversRes.data.forEach((d) => {
            if (d.id) driversMap[d.id] = d;
            if (d.user_id) driversMap[d.user_id] = d;
          });
        }
      }

      // 3. Mapear datos enriquecidos
      const enriched = txs.map((tx) => {
        const u = usersMap[tx.driver_id];
        const d = driversMap[tx.driver_id];

        let driverName = 'Conductor Landa';
        let driverPhone = '';
        let driverEmail = '';

        if (u) {
          driverName = `${u.name || ''} ${u.last_name || ''}`.trim() || u.email || driverName;
          driverPhone = u.phone || '';
          driverEmail = u.email || '';
        } else if (d) {
          driverName = d.name || driverName;
          driverPhone = d.phone || '';
          driverEmail = d.email || '';
        }

        return {
          id: tx.id,
          driver_id: tx.driver_id,
          driver_name: driverName,
          driver_phone: driverPhone,
          driver_email: driverEmail,
          amount: Number(tx.amount) || 0,
          description: tx.description || 'Bono de viajes asignado',
          created_at: tx.created_at,
          payment_method: tx.payment_method || 'bono interno',
          type: tx.type || 'admin_bonus'
        };
      });

      // Calcular KPIs
      const totalAmt = enriched.reduce((sum, item) => sum + item.amount, 0);
      const totalCnt = enriched.length;
      const uniqueDrivers = new Set(enriched.map((i) => i.driver_id)).size;
      const avgBonus = totalCnt > 0 ? Math.round(totalAmt / totalCnt) : 0;

      setKpis({
        totalAmount: totalAmt,
        totalCount: totalCnt,
        uniqueDriversCount: uniqueDrivers,
        averageBonus: avgBonus
      });

      setBonusHistoryList(enriched);
    } catch (err) {
      console.error('Error in loadBonusHistory:', err);
      showToast('Error al consultar el historial de bonos.', 'error', 'Error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBonusHistory();
  }, [loadBonusHistory]);

  // Exportar a CSV
  const handleExportCSV = () => {
    try {
      const headers = ['ID Transaccion', 'Nombre Conductor', 'Telefono', 'Correo', 'Valor Bono (COP)', 'Fecha y Hora', 'Motivo / Descripcion', 'Condicion'];
      const rows = filteredList.map((item) => [
        `"${item.id}"`,
        `"${item.driver_name}"`,
        `"${item.driver_phone || ''}"`,
        `"${item.driver_email || ''}"`,
        item.amount,
        `"${new Date(item.created_at).toLocaleString('es-CO')}"`,
        `"${item.description || ''}"`,
        '"No Retirable / Bono Interno"'
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Historial_Bonos_Conductores_Landa_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Historial de bonos exportado en formato CSV exitosamente.', 'success', 'Exportación Completa');
    } catch (err) {
      showToast('No se pudo generar el reporte CSV.', 'error', 'Error al Exportar');
    }
  };

  // Filtrado
  const filteredList = bonusHistoryList.filter((item) => {
    // Filtro por período
    if (filterPeriod !== 'all') {
      const txDate = new Date(item.created_at);
      const now = new Date();
      if (filterPeriod === 'today') {
        if (txDate.toDateString() !== now.toDateString()) return false;
      } else if (filterPeriod === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (txDate < oneWeekAgo) return false;
      } else if (filterPeriod === 'month') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (txDate < oneMonthAgo) return false;
      }
    }

    // Filtro por texto
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const name = (item.driver_name || '').toLowerCase();
      const phone = (item.driver_phone || '').toLowerCase();
      const email = (item.driver_email || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q) || desc.includes(q);
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
              <span className="master-brand-sub">
                {isEmployeeMode ? '🛡️ Panel de Empleado • Módulo de Bonos' : '⭐ Panel Master • Historial de Bonos'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'rgba(245, 158, 11, 0.18)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24'
              }}
            >
              {isEmployeeMode ? `🛡️ Empleado: ${currentUser?.name || 'Operador'}` : '⭐ Administrador Master'}
            </span>

            <button
              className="chip-btn active"
              onClick={() => navigate(isEmployeeMode ? '/empleado' : '/master')}
            >
              {isEmployeeMode ? '← Volver al Panel Empleado' : '← Volver al Panel Master'}
            </button>
          </div>
        </div>
      </header>

      <main className="master-container" style={{ maxWidth: '1080px' }}>
        {/* BANNER PRINCIPAL */}
        <div className="master-hero-banner" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}>
          <div>
            <h1 className="banner-greeting" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Historial de Bonos Asignados</h1>
            <p className="banner-subtext">Auditoría completa de saldos y bonos de viaje acreditados internamente a billeteras de conductores (No retirables).</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="chip-btn" onClick={handleExportCSV} style={{ background: '#0284c7', borderColor: '#38bdf8', color: '#ffffff', fontWeight: 700 }}>
              📥 Exportar CSV
            </button>
            <button className="chip-btn" onClick={loadBonusHistory} style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }}>
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* TARJETAS DE KPIS */}
        <div className="finances-kpi-row" style={{ marginTop: '1.25rem' }}>
          <div className="finances-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <span className="kpi-title">TOTAL BONOS ASIGNADOS</span>
            <h3 className="kpi-val green" style={{ color: '#fde047' }}>{formatCOP(kpis.totalAmount)}</h3>
            <span style={{ fontSize: '0.75rem', color: '#8a99ad' }}>{kpis.totalCount} operaciones de crédito registradas</span>
          </div>

          <div className="finances-kpi-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <span className="kpi-title">CONDUCTORES BENEFICIADOS</span>
            <h3 className="kpi-val blue">{kpis.uniqueDriversCount}</h3>
            <span style={{ fontSize: '0.75rem', color: '#8a99ad' }}>Conductores con bonos activos recibidos</span>
          </div>

          <div className="finances-kpi-card" style={{ borderLeft: '4px solid #a855f7' }}>
            <span className="kpi-title">PROMEDIO POR ASIGNACIÓN</span>
            <h3 className="kpi-val purple">{formatCOP(kpis.averageBonus)}</h3>
            <span style={{ fontSize: '0.75rem', color: '#8a99ad' }}>Monto promedio por bono otorgado</span>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <section className="master-section" style={{ marginTop: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="master-section-title" style={{ margin: 0 }}>
              Movimientos de Bonos ({filteredList.length})
            </h2>

            {/* BUSCADOR */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="table-search-box" style={{ width: '280px', margin: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar conductor, teléfono o motivo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* FILTROS DE PERÍODO */}
              <div className="table-filter-chips" style={{ margin: 0 }}>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'today', label: 'Hoy' },
                  { id: 'week', label: 'Última Semana' },
                  { id: 'month', label: 'Último Mes' }
                ].map((f) => (
                  <button
                    key={f.id}
                    className={`filter-chip ${filterPeriod === f.id ? 'active' : ''}`}
                    onClick={() => setFilterPeriod(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="users-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid rgba(245, 158, 11, 0.3)', borderTopColor: '#fde047', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.85rem' }}></div>
                <div>Cargando historial de bonos asignados...</div>
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎫</div>
                <h3 style={{ color: '#ffffff', margin: '0 0 0.5rem 0' }}>No se encontraron registros de bonos</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  {searchQuery ? 'No existen coincidencias con la búsqueda ingresada.' : 'Aún no se han asignado bonos de viajes a conductores en la plataforma.'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="master-users-table">
                  <thead>
                    <tr>
                      <th>CONDUCTOR</th>
                      <th>VALOR BONO</th>
                      <th>FECHA Y HORA</th>
                      <th>MOTIVO / DESCRIPCIÓN</th>
                      <th>MÉTODO</th>
                      <th>CONDICIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>
                              {item.driver_name}
                            </strong>
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                              {item.driver_phone ? `📞 ${item.driver_phone}` : ''} {item.driver_email ? `• ${item.driver_email}` : ''}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: 'rgba(74, 222, 128, 0.12)',
                              border: '1px solid rgba(74, 222, 128, 0.35)',
                              color: '#4ade80',
                              fontWeight: '800',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.95rem'
                            }}
                          >
                            +{formatCOP(item.amount)}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                            <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.88rem' }}>
                              {new Date(item.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                              {new Date(item.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                            </span>
                          </div>
                        </td>

                        <td style={{ maxWidth: '300px' }}>
                          <span style={{ color: '#e2e8f0', display: 'block', wordBreak: 'break-word', fontSize: '0.86rem' }}>
                            {item.description}
                          </span>
                        </td>

                        <td>
                          <span className="role-badge purple" style={{ textTransform: 'capitalize' }}>
                            {item.payment_method || 'bono interno'}
                          </span>
                        </td>

                        <td>
                          <span
                            style={{
                              background: 'rgba(245, 158, 11, 0.14)',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              color: '#fde047',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            🔒 No Retirable
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminBonusHistory;
