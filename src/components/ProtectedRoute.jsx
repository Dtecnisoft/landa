import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/**
 * Componente Guardián de Seguridad para proteger rutas sensibles (Admin, Empleado, Restaurante).
 * Soporta autenticación mediante Supabase Session y almacenamiento persistente local ('landa_user').
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Vista a proteger.
 * @param {Array<string>} [props.allowedRoles] - Roles permitidos (ej: ['master', 'admin', 'employee', 'restaurant']).
 * @param {string} [props.redirectTo='/'] - Ruta de redirección si no está autenticado.
 */
export default function ProtectedRoute({ children, allowedRoles = [], redirectTo = '/' }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        let activeUser = null;
        let role = null;

        // 1. Verificar primero la sesión guardada en localStorage ('landa_user')
        const savedUserStr = localStorage.getItem('landa_user');
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            if (savedUser && savedUser.email) {
              activeUser = savedUser;
              role = savedUser.role || null;

              // Administrador Master especial
              if (savedUser.email === 'admin@landa.com' || savedUser.email === 'master@landa.com' || role === 'admin' || role === 'master') {
                role = 'master';
              }
            }
          } catch (e) {
            console.error('Error parseando landa_user en ProtectedRoute:', e);
          }
        }

        // 2. Si no se encontró en localStorage, consultar la sesión activa de Supabase
        if (!activeUser) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            activeUser = session.user;
            role = session.user.user_metadata?.role || session.user.app_metadata?.role || null;

            if (session.user.email === 'admin@landa.com' || session.user.email === 'master@landa.com') {
              role = 'master';
            }

            // Consultar tabla 'profiles' o 'users' si el rol aún es nulo
            if (!role) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
              if (profile?.role) role = profile.role;
            }
          }
        }

        if (isMounted) {
          setUser(activeUser);
          setUserRole(role);
          setLoading(false);
        }
      } catch (err) {
        console.error('[ProtectedRoute Auth Error]:', err);
        if (isMounted) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    }

    checkAuth();

    // Escuchar cambios de sesión en Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        fontFamily: 'sans-serif',
        color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '36px',
            height: '36px',
            border: '3px solid rgba(0,0,0,0.1)',
            borderRadius: '50%',
            borderTopColor: '#0052cc',
            animation: 'spin 1s ease-in-out infinite',
            margin: '0 auto 12px'
          }} />
          <p>Verificando credenciales de acceso...</p>
        </div>
      </div>
    );
  }

  // 1. Denegar si no hay usuario autenticado ni en localStorage ni en Supabase
  if (!user) {
    console.warn('[ProtectedRoute] No hay usuario autenticado. Redirigiendo a', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  // 2. Verificar rol si se especificaron restricciones
  if (allowedRoles.length > 0) {
    const isMasterOrAdmin = userRole === 'master' || userRole === 'admin' || user?.email === 'admin@landa.com' || user?.email === 'master@landa.com';
    const isEmployeeAllowed = allowedRoles.includes('employee') && (userRole === 'employee' || user?.isEmployee);
    const isRestaurantAllowed = allowedRoles.includes('restaurant') && (userRole === 'restaurant' || user?.isRestaurant);
    const isRoleExplicitlyAllowed = allowedRoles.includes(userRole);

    const hasAccess = isMasterOrAdmin || isEmployeeAllowed || isRestaurantAllowed || isRoleExplicitlyAllowed;

    if (!hasAccess) {
      console.warn(`[ProtectedRoute] Acceso denegado a ruta. Requerido: [${allowedRoles.join(', ')}], Actual: '${userRole}', Email: ${user?.email}`);
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
}
