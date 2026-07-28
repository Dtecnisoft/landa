import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import AuthModal from './AuthModal';
import { supabase } from '../supabaseClient';

import { useToast } from '../context/ToastContext';

function Encabezado() {
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    // 1. Check local storage
    const savedUser = localStorage.getItem('landa_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }

    // 2. Check Supabase session & role
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserSession(session.user);
      }
    });

    // 3. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openLogin = () => {
    setIsAuthOpen(true);
    closeMenu();
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('landa_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out', e);
    }
    setUser(null);
    localStorage.removeItem('landa_user');
    setIsUserMenuOpen(false);
    closeMenu();
    showToast('Sesión cerrada correctamente. ¡Hasta pronto!', 'info', 'Cierre de Sesión');
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            <img src={logo} alt="Landa Logo" className="header-logo" />
          </Link>

          <button
            className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label="Abrir menú de navegación"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>

          <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`} aria-label="Navegación principal">
            <Link to="/" onClick={closeMenu}>Inicio</Link>
            <Link to="/restaurantes" onClick={closeMenu}>Restaurantes</Link>
            <Link to="/quienes-somos" onClick={closeMenu}>Quiénes Somos</Link>
            <Link to="/contacto" onClick={closeMenu}>Soporte y Contacto</Link>

            {/* Mobile Auth Button */}
            <div className="mobile-auth-actions">
              {user ? (
                <div className="mobile-user-info">
                  <span className="user-greeting">👤 Hola, {user.name}</span>
                  <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <button className="btn btn-secondary nav-auth-btn" onClick={openLogin}>
                    Iniciar Sesión
                  </button>
                </div>
              )}
            </div>

            <a
              href="https://drive.google.com/file/d/1lWZQqLHgHFEpl0xMgQK4_seo1pb8Edrd/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary header-cta mobile-only-cta"
              onClick={closeMenu}
              style={{
                background: 'linear-gradient(135deg, #4556EC 0%, #3142c9 100%)',
                borderColor: '#4556EC',
                color: '#ffffff',
                padding: '0.55rem 1.2rem',
                borderRadius: '50px',
                boxShadow: '0 6px 20px rgba(69, 86, 236, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
                alignItems: 'center',
                gap: '0.65rem',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: '1.25rem', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                📲
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#ffffff', letterSpacing: '0.2px' }}>
                  Descargar Landa App
                </span>
                <span style={{ fontSize: '0.66rem', color: '#dbe0ff', fontWeight: 600 }}>
                  ⚡ Gratis • Instalación Rápida
                </span>
              </div>
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="header-actions desktop-only-actions">
            {user ? (
              <div className="user-menu-container" ref={userMenuRef}>
                <button
                  className="user-profile-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                >
                  <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="user-name">{user.name}</span>
                  <span className="dropdown-caret">▾</span>
                </button>
                {isUserMenuOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <div className="dropdown-divider"></div>
                    {(user.role === 'admin' || user.email?.toLowerCase() === 'admin@landa.com' || user.email?.toLowerCase().includes('master')) && (
                      <Link to="/master" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        👑 Panel Master
                      </Link>
                    )}
                    {(user.role === 'employee' || user.role === 'empleado' || user.isEmployee) && (
                      <Link to="/empleado" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        💼 Panel Empleado
                      </Link>
                    )}
                    {(user.role === 'restaurant' || user.role === 'restaurante') && (
                      <Link to="/restaurante/gestion" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                        🏪 Mi Restaurante (Gestión)
                      </Link>
                    )}
                    <Link to="/restaurantes" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      🛒 Ver Restaurantes
                    </Link>
                    <Link to="/contacto" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      💬 Ayuda y Soporte
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      🚪 Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons-desktop">
                <button className="btn btn-secondary header-auth-btn" onClick={openLogin}>
                  Iniciar Sesión
                </button>
              </div>
            )}

            <a
              href="https://drive.google.com/file/d/1lWZQqLHgHFEpl0xMgQK4_seo1pb8Edrd/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary header-cta desktop-cta"
              style={{
                background: 'linear-gradient(135deg, #4556EC 0%, #3142c9 100%)',
                borderColor: '#4556EC',
                color: '#ffffff',
                padding: '0.55rem 1.2rem',
                borderRadius: '50px',
                boxShadow: '0 6px 20px rgba(69, 86, 236, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
                alignItems: 'center',
                gap: '0.65rem',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: '1.25rem', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                📲
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#ffffff', letterSpacing: '0.2px' }}>
                  Descargar Landa App
                </span>
                <span style={{ fontSize: '0.66rem', color: '#dbe0ff', fontWeight: 600 }}>
                  ⚡ Gratis • Instalación Rápida
                </span>
              </div>
            </a>
          </div>
        </div>
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



