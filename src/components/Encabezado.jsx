import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import AuthModal from './AuthModal';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

function Encabezado() {
  const { showToast } = useToast();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  // Scroll position detection for header translucency transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Check local storage & Supabase session
  useEffect(() => {
    const savedUser = localStorage.getItem('landa_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }

    const syncUserSession = async (userObj) => {
      if (!userObj) return;
      let userRole = 'client';
      let userName = userObj.user_metadata?.full_name || userObj.user_metadata?.name || userObj.email?.split('@')[0] || 'Usuario';

      try {
        const { data: userRow } = await supabase.from('users').select('role, name').eq('id', userObj.id).single();
        if (userRow) {
          if (userRow.role) userRole = userRow.role;
          if (userRow.name) userName = userRow.name;
        }

        const { data: empRow } = await supabase.from('empleado').select('id, name').eq('email', userObj.email).single();
        if (empRow) {
          userRole = 'employee';
          if (empRow.name) userName = empRow.name;
        }
      } catch (e) {
        console.log('Notice checking user role in Encabezado:', e);
      }

      const suUser = {
        id: userObj.id,
        email: userObj.email,
        name: userName,
        role: userRole,
        isEmployee: userRole === 'employee'
      };

      setUser(suUser);
      localStorage.setItem('landa_user', JSON.stringify(suUser));
    };

    // Detectar si la página cargó mediante el enlace del correo (type=recovery o access_token)
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.includes('type=recovery') || hash.includes('access_token') || search.includes('type=recovery')) {
      setIsAuthOpen(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserSession(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsAuthOpen(true);
      } else if (session?.user) {
        syncUserSession(session.user);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('landa_user');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);


  // Handle outside click & escape key to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Prevent background scroll when mobile drawer is active
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const openLogin = () => {
    setIsAuthOpen(true);
    closeMenu();
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('landa_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    const userRole = user?.role || '';
    const userFirstName = user?.name ? String(user.name).split(' ')[0] : '';
    const nameSuffix = userFirstName ? `, ${userFirstName}` : '';

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out', e);
    }

    setUser(null);
    localStorage.removeItem('landa_user');
    setIsUserMenuOpen(false);
    closeMenu();

    if (userRole === 'admin' || userRole === 'master') {
      showToast(`¡Sesión Master cerrada de forma segura${nameSuffix}! Gracias por gestionar Landa. ⭐`, 'info', '⭐ Cierre de Sesión Master');
    } else if (userRole === 'employee') {
      showToast(`¡Excelente labor hoy${nameSuffix}! Tu sesión de equipo Landa se ha cerrado de forma segura. 🛡️`, 'info', '🛡️ Cierre de Sesión Empleado');
    } else if (userRole === 'driver' || userRole === 'conductor') {
      showToast(`¡Gracias por tu jornada en ruta${nameSuffix}! Tu sesión de conductor se ha cerrado con éxito. 🚗`, 'info', '🚗 ¡Hasta pronto, Conductor!');
    } else if (userRole === 'restaurant' || userRole === 'restaurante') {
      showToast(`¡Sesión de aliado comercial cerrada exitosamente${nameSuffix}! Gracias por impulsar la gastronomía con Landa. 🏪`, 'info', '🏪 ¡Hasta pronto, Aliado!');
    } else {
      showToast(`¡Has cerrado sesión correctamente${nameSuffix}! Esperamos verte muy pronto para tus próximos pedidos y viajes. 👋`, 'info', '👋 ¡Hasta pronto!');
    }
  };

  const getRoleLabel = (role, isEmployee) => {
    if (role === 'admin' || role === 'master') return 'Administrador Master';
    if (role === 'employee' || isEmployee) return 'Equipo / Empleado';
    if (role === 'restaurant' || role === 'restaurante') return 'Aliado Restaurante';
    return 'Cliente';
  };

  const navItems = [
    {
      label: 'Inicio',
      path: '/',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      label: 'Restaurantes',
      path: '/restaurantes',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      )
    },
    {
      label: 'Cobertura',
      path: '/cobertura',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    },
    {
      label: 'Quiénes Somos',
      path: '/quienes-somos',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      label: 'Soporte y Contacto',
      path: '/contacto',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="header-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <Link to="/" className="brand" onClick={closeMenu} aria-label="Landa - Página principal">
            <img src={logo} alt="Landa Logo" className="header-logo" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-links desktop-nav" aria-label="Navegación principal">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={isActive ? 'active' : ''}
                  onClick={closeMenu}
                >
                  {item.label}
                  {isActive && <span className="nav-active-dot" />}
                </Link>
              );
            })}
          </nav>

          {/* Actions for Desktop */}
          <div className="header-actions desktop-only-actions">
            {user ? (
              <div className="user-menu-container" ref={userMenuRef}>
                <button
                  className="user-profile-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="avatar-wrapper">
                    <span className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    <span className="user-status-dot" title="Usuario Conectado" />
                  </div>
                  <span className="user-name">{user.name}</span>
                  <span className={`dropdown-caret ${isUserMenuOpen ? 'open' : ''}`}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-info">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                      <span className={`role-badge ${user.role || 'client'}`}>
                        {getRoleLabel(user.role, user.isEmployee)}
                      </span>
                    </div>

                    <div className="dropdown-divider"></div>

                    {(user.role === 'admin' || user.email?.toLowerCase() === 'admin@landa.com' || user.email?.toLowerCase().includes('master')) && (
                      <Link to="/master" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="dropdown-icon-box purple">
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                          </svg>
                        </span>
                        <span>Panel Master</span>
                      </Link>
                    )}

                    {(user.role === 'employee' || user.role === 'empleado' || user.isEmployee) && (
                      <Link to="/empleado" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="dropdown-icon-box blue">
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                        </span>
                        <span>Panel Empleado</span>
                      </Link>
                    )}

                    {(user.role === 'restaurant' || user.role === 'restaurante') && (
                      <Link to="/restaurante/gestion" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        <span className="dropdown-icon-box amber">
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7m0 0v1a3 3 0 0 0 6 0V7M4 7l2-4h12l2 4M5 21V10.85M19 21V10.85" />
                          </svg>
                        </span>
                        <span>Mi Restaurante (Gestión)</span>
                      </Link>
                    )}

                    <Link to="/restaurantes" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <span className="dropdown-icon-box cyan">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2v20M18 2v20M12 2v20M2 12h20" />
                        </svg>
                      </span>
                      <span>Explorar Restaurantes</span>
                    </Link>

                    <Link to="/contacto" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <span className="dropdown-icon-box emerald">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                        </svg>
                      </span>
                      <span>Centro de Ayuda</span>
                    </Link>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <span className="dropdown-icon-box red">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </span>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons-desktop">
                <button className="btn-secondary-modern" onClick={openLogin}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span>Iniciar Sesión</span>
                </button>
              </div>
            )}

            {/* App Download CTA */}
            <a
              href="https://play.google.com/store/apps/details?id=com.landaappsas.landa&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-download-cta desktop-cta"
            >
              <div className="cta-icon-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
                  <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                </svg>
              </div>
              <div className="cta-text">
                <span className="cta-title">Descargar Landa App</span>
                <span className="cta-subtitle">Gratis • Instalación rápida</span>
              </div>
              <span className="cta-arrow">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          </div>

          {/* Mobile Right Action Bar */}
          <div className="mobile-header-actions">
            {user ? (
              <button
                className="mobile-avatar-btn"
                onClick={toggleMenu}
                aria-label="Abrir menú de usuario"
              >
                <span className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                <span className="user-status-dot" />
              </button>
            ) : (
              <button className="mobile-login-icon-btn" onClick={openLogin} aria-label="Iniciar Sesión">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </button>
            )}

            {/* Hamburger Toggle */}
            <button
              className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
              aria-expanded={isMenuOpen}
            >
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
            </button>
          </div>
        </div>

        {/* Mobile Side Drawer Navigation */}
        <aside className={`mobile-nav-drawer ${isMenuOpen ? 'open' : ''}`} aria-label="Menú móvil">
          <div className="mobile-drawer-header">
            <div className="mobile-brand">
              <img src={logo} alt="Landa Logo" className="mobile-drawer-logo" />
            </div>
            <button className="mobile-close-btn" onClick={closeMenu} aria-label="Cerrar menú">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* User info card inside mobile menu */}
          {user && (
            <div className="mobile-user-card">
              <div className="mobile-user-header">
                <div className="avatar-wrapper">
                  <span className="mobile-user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  <span className="user-status-dot" />
                </div>
                <div className="mobile-user-meta">
                  <span className="mobile-user-name">{user.name}</span>
                  <span className="mobile-user-email">{user.email}</span>
                </div>
              </div>
              <span className={`role-badge ${user.role || 'client'}`}>
                {getRoleLabel(user.role, user.isEmployee)}
              </span>
            </div>
          )}

          <nav className="mobile-nav-links">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <div className="mobile-nav-item-left">
                    <span className="mobile-item-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <span className="mobile-active-tag">Actual</span>}
                </Link>
              );
            })}

            {/* Quick Panel Links in Mobile if Logged In */}
            {user && (
              <div className="mobile-panel-links">
                {(user.role === 'admin' || user.email?.toLowerCase() === 'admin@landa.com' || user.email?.toLowerCase().includes('master')) && (
                  <Link to="/master" className="mobile-nav-item panel-item purple" onClick={closeMenu}>
                    <div className="mobile-nav-item-left">
                      <span className="mobile-item-icon">👑</span>
                      <span>Panel Master</span>
                    </div>
                  </Link>
                )}
                {(user.role === 'employee' || user.role === 'empleado' || user.isEmployee) && (
                  <Link to="/empleado" className="mobile-nav-item panel-item blue" onClick={closeMenu}>
                    <div className="mobile-nav-item-left">
                      <span className="mobile-item-icon">💼</span>
                      <span>Panel Empleado</span>
                    </div>
                  </Link>
                )}
                {(user.role === 'restaurant' || user.role === 'restaurante') && (
                  <Link to="/restaurante/gestion" className="mobile-nav-item panel-item amber" onClick={closeMenu}>
                    <div className="mobile-nav-item-left">
                      <span className="mobile-item-icon">🏪</span>
                      <span>Gestión Restaurante</span>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </nav>

          <div className="mobile-drawer-footer">
            <a
              href="https://play.google.com/store/apps/details?id=com.landaappsas.landa&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-download-cta mobile-cta"
              onClick={closeMenu}
            >
              <div className="cta-icon-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
                  <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                </svg>
              </div>
              <div className="cta-text">
                <span className="cta-title">Descargar Landa App</span>
                <span className="cta-subtitle">Instalación Rápida • Gratis</span>
              </div>
            </a>

            {user ? (
              <button className="btn-mobile-logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            ) : (
              <button className="btn-secondary-modern full-width" onClick={openLogin}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </aside>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}

export default Encabezado;




