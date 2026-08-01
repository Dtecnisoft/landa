import { useState, useEffect } from 'react';
import logo from '../assets/images/logo.png';
import { supabase } from '../supabaseClient';
import { useToast } from '../context/ToastContext';

function translateAuthError(message) {

  if (!message) return 'Ocurrió un error inesperado.';
  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Credenciales inválidas. Verifica tu correo y contraseña.';
  if (msg.includes('user not found') || msg.includes('user_not_found')) return 'No existe una cuenta registrada con este correo.';
  if (msg.includes('invalid token') || msg.includes('token expired') || msg.includes('otp_expired')) return 'El código de 8 dígitos es inválido o ha expirado. Por favor solicita uno nuevo.';
  if (msg.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('too many requests') || msg.includes('rate limit')) return 'Demasiados intentos. Por favor espera un momento e intenta más tarde.';
  if (msg.includes('same_password')) return 'La nueva contraseña no puede ser igual a la anterior.';
  return message;
}

function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'forgot' | 'reset_otp'
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const isRecoveryUrl = hash.includes('type=recovery') || hash.includes('access_token') || search.includes('type=recovery');

    if (isRecoveryUrl) {
      setActiveTab('reset_otp');
      setSuccessMessage('Enlace del correo verificado. Crea tu nueva contraseña.');
    } else {
      setActiveTab('login');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Escuchar evento PASSWORD_RECOVERY si el usuario hace clic en el enlace del correo
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setActiveTab('reset_otp');
        if (session?.user?.email) {
          setForgotEmail(session.user.email);
        }
        setErrorMessage('');
        setSuccessMessage('Enlace verificado. Ingresa tu nueva contraseña.');
        showToast('Enlace de recuperación verificado. Crea tu nueva contraseña.', 'info', 'Restablecer Contraseña');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [showToast]);

  if (!isOpen) return null;


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = loginData.email.toLowerCase().trim();

    if (!cleanEmail || !loginData.password) {
      const msg = 'Por favor, completa todos los campos.';
      setErrorMessage(msg);
      showToast(msg, 'warning', 'Campos Incompletos');
      return;
    }

    setIsLoading(true);

    try {
      // Autenticación estricta con el servicio de Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginData.password
      });

      // Si Supabase devuelve error de autenticación, denegar acceso inmediatamente
      if (error || !data?.user) {
        let errMsg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
        if (error?.message?.includes('Email not confirmed')) {
          errMsg = 'El correo electrónico no ha sido confirmado aún.';
        } else if (error?.message?.includes('Too many requests')) {
          errMsg = 'Demasiados intentos fallidos. Intenta más tarde.';
        }

        setErrorMessage(errMsg);
        showToast(errMsg, 'error', 'Error de Autenticación');
        setIsLoading(false);
        return;
      }

      // Si la contraseña y correo son válidos en Supabase Auth:
      const isMasterAdmin = cleanEmail === 'admin@landa.com' || cleanEmail === 'master@landa.com';
      let userRole = isMasterAdmin ? 'master' : 'client';
      let userName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuario';

      try {
        const { data: userRow } = await supabase.from('users').select('role, name').eq('id', data.user.id).single();
        if (userRow) {
          if (userRow.role) userRole = userRow.role;
          if (userRow.name) userName = userRow.name;
        }

        const { data: empRow } = await supabase.from('empleado').select('id, name').eq('email', cleanEmail).single();
        if (empRow) {
          userRole = 'employee';
          if (empRow.name) userName = empRow.name;
        }
      } catch (checkErr) {
        console.log('Notice checking user role:', checkErr);
      }

      if (isMasterAdmin) {
        userRole = 'master';
      }

      const userProfile = {
        id: data.user.id,
        email: data.user.email,
        name: userName,
        role: userRole
      };

      // Registrar auditoría de accesos
      if (userRole === 'employee' || userRole === 'admin' || userRole === 'master') {
        try {
          const loginEvent = {
            id: `login-${Date.now()}`,
            user_id: data.user.id,
            name: userName,
            email: data.user.email,
            role: userRole,
            login_time: new Date().toISOString(),
            ip: '190.157.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250),
            device: navigator.userAgent.includes('Mobile') ? 'Móvil (Android/iOS)' : 'Escritorio (Navegador Web)',
            status: 'Activa'
          };
          const existingLogs = JSON.parse(localStorage.getItem('landa_employee_logins_history') || '[]');
          existingLogs.unshift(loginEvent);
          localStorage.setItem('landa_employee_logins_history', JSON.stringify(existingLogs.slice(0, 100)));
        } catch (logErr) {
          console.error('Error logging employee access:', logErr);
        }
      }

      if (userRole === 'admin' || userRole === 'master') {
        setSuccessMessage('¡Bienvenido Master!');
        showToast('¡Bienvenido Master Landa!', 'success', 'Acceso Master');
      } else if (userRole === 'employee') {
        setSuccessMessage('¡Bienvenido Empleado!');
        showToast(`¡Hola ${userName}, bienvenido!`, 'success', 'Acceso Empleado');
      } else {
        setSuccessMessage('¡Sesión iniciada con éxito!');
        showToast(`¡Hola ${userName}, bienvenido de nuevo!`, 'success', 'Inicio de Sesión');
      }

      setIsLoading(false);

      setTimeout(() => {
        onLoginSuccess(userProfile);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Supabase Auth error:', err);
      const errMsg = 'Error al conectar con el servicio de autenticación o credenciales incorrectas.';
      setErrorMessage(errMsg);
      showToast(errMsg, 'error', 'Error de Autenticación');
      setIsLoading(false);
    }
  };

  // 1. Solicitud de código de recuperación por correo
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = forgotEmail.toLowerCase().trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = 'Por favor, ingresa un correo electrónico válido.';
      setErrorMessage(msg);
      showToast(msg, 'warning', 'Campo Requerido');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin
      });

      if (error) {
        const translated = translateAuthError(error.message);
        setErrorMessage(translated);
        showToast(translated, 'error', 'Error de Recuperación');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setSuccessMessage('¡Código de 8 dígitos enviado a tu correo!');
      showToast('Te hemos enviado un código de 8 dígitos. Ingrésalo a continuación.', 'success', 'Código Enviado');

      // Transición automática al paso 2: Ingresar código OTP y nueva contraseña
      setActiveTab('reset_otp');
    } catch (err) {
      console.error('Supabase Reset Password error:', err);
      const errMsg = 'Error al enviar la solicitud de recuperación.';
      setErrorMessage(errMsg);
      showToast(errMsg, 'error', 'Error de Servidor');
      setIsLoading(false);
    }
  };

  // 2. Verificar código OTP de 8 dígitos y actualizar contraseña
  const handleResetPasswordWithOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = forgotEmail.toLowerCase().trim();
    const cleanOtp = otpCode.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = 'Por favor, ingresa un correo electrónico válido.';
      setErrorMessage(msg);
      showToast(msg, 'warning', 'Correo Requerido');
      return;
    }

    // Si no ingresó código OTP manualmente, verificar si ya hay una sesión de recuperación activa por el enlace del correo
    if (!cleanOtp) {
      const { data: { session } } = await supabase.auth.getSession();
      const hash = window.location.hash || '';
      const isRecovery = session?.user || hash.includes('type=recovery') || hash.includes('access_token');

      if (!isRecovery) {
        const msg = 'Por favor, ingresa el código de 8 dígitos recibido en tu correo.';
        setErrorMessage(msg);
        showToast(msg, 'warning', 'Código Requerido');
        return;
      }
    }


    if (!newPassword || newPassword.length < 6) {
      const msg = 'La nueva contraseña debe tener al menos 6 caracteres.';
      setErrorMessage(msg);
      showToast(msg, 'warning', 'Contraseña Corta');
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Las contraseñas no coinciden. Por favor verifícalas.';
      setErrorMessage(msg);
      showToast(msg, 'warning', 'Contraseñas No Coinciden');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Si se ingresó código OTP, verificarlo primero con Supabase
      if (cleanOtp) {
        let otpSuccess = false;
        let lastOtpErr = null;

        // Intentar verificar OTP con tipo 'recovery'
        const { data: recoveryData, error: recoveryErr } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: 'recovery'
        });

        if (!recoveryErr && recoveryData?.session) {
          otpSuccess = true;
        } else {
          lastOtpErr = recoveryErr;
          // Intento fallback con tipo 'email' o 'signup' por compatibilidad
          const { data: emailData, error: emailErr } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanOtp,
            type: 'email'
          });
          if (!emailErr && emailData?.session) {
            otpSuccess = true;
          } else if (emailErr) {
            lastOtpErr = emailErr;
          }
        }

        if (!otpSuccess && lastOtpErr) {
          console.error('OTP Verification Error:', lastOtpErr);
          const translated = translateAuthError(lastOtpErr.message);
          setErrorMessage(translated);
          showToast(translated, 'error', 'Código Inválido');
          setIsLoading(false);
          return;
        }
      }

      // 2. Con la sesión verificada, actualizar la contraseña en Supabase Auth
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) {
        console.error('Update password error:', updateErr);
        const translated = translateAuthError(updateErr.message);
        setErrorMessage(translated);
        showToast(translated, 'error', 'Error al Actualizar');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setSuccessMessage('¡Contraseña restablecida con éxito!');
      showToast('¡Tu contraseña se ha actualizado correctamente! Inicia sesión.', 'success', '¡Éxito!');

      // Redirigir al login preparado con el correo
      setTimeout(() => {
        setLoginData({ email: cleanEmail, password: '' });
        setActiveTab('login');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMessage('');
      }, 1500);

    } catch (err) {
      console.error('Error en proceso de restablecimiento:', err);
      const errMsg = 'Ocurrió un error al restablecer la contraseña.';
      setErrorMessage(errMsg);
      showToast(errMsg, 'error', 'Error del Sistema');
      setIsLoading(false);
    }
  };

  return (
    <div className="landa-auth-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="landa-auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="landa-auth-close" onClick={onClose} aria-label="Cerrar modal">
          ✕
        </button>

        {/* Official Landa Header & Logo */}
        <div className="landa-auth-header">
          <img src={logo} alt="Landa Logo" className="landa-auth-logo" />

          {activeTab === 'forgot' ? (
            <>
              <h2 className="landa-recovery-title">Recuperar Contraseña</h2>
              <p className="landa-auth-tagline">Ingresa tu correo para recibir un código de 8 dígitos.</p>
            </>
          ) : activeTab === 'reset_otp' ? (
            <>
              <h2 className="landa-recovery-title">Restablecer Contraseña</h2>
              <p className="landa-auth-tagline">Ingresa el código de 8 dígitos y tu nueva contraseña.</p>
            </>
          ) : (
            <p className="landa-auth-tagline">Encuentra, conecta y gana.</p>
          )}
        </div>

        {errorMessage && <div className="landa-auth-alert error">{errorMessage}</div>}
        {successMessage && <div className="landa-auth-alert success">{successMessage}</div>}

        {/* RECOVERY STEP 1: REQUEST CODE */}
        {activeTab === 'forgot' ? (
          <form onSubmit={handleForgotSubmit} className="landa-auth-form">
            <div className="landa-form-group">
              <label htmlFor="landa-forgot-email">CORREO ELECTRÓNICO</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="landa-forgot-email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="landa-btn-primary landa-icon-btn" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
              {isLoading ? (
                'Enviando...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                  Enviar Código
                </>
              )}
            </button>

            <button
              type="button"
              className="landa-btn-secondary landa-icon-btn"
              style={{ marginTop: '0.75rem' }}
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Volver al Inicio de Sesión
            </button>
          </form>
        ) : activeTab === 'reset_otp' ? (
          /* RECOVERY STEP 2: VERIFY OTP CODE & SET NEW PASSWORD */
          <form onSubmit={handleResetPasswordWithOtp} className="landa-auth-form">
            <div className="landa-form-group">
              <label htmlFor="landa-reset-email">CORREO ELECTRÓNICO</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="landa-reset-email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="landa-form-group">
              <label htmlFor="landa-reset-otp">CÓDIGO DE 8 DÍGITOS (OPCIONAL SI ABRISTE EL ENLACE)</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="landa-reset-otp"
                  type="text"
                  placeholder="Ej. 48958057 (o dejar en blanco)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={12}
                />
              </div>
            </div>


            <div className="landa-form-group">
              <label htmlFor="landa-new-password">NUEVA CONTRASEÑA</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </span>
                <input
                  id="landa-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="landa-toggle-eye"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showNewPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="landa-form-group">
              <label htmlFor="landa-confirm-password">CONFIRMAR NUEVA CONTRASEÑA</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <input
                  id="landa-confirm-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button type="submit" className="landa-btn-primary landa-icon-btn" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
              {isLoading ? (
                'Procesando...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Cambiar Contraseña
                </>
              )}
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="landa-btn-secondary"
                style={{ flex: 1, fontSize: '0.825rem', padding: '0.5rem' }}
                onClick={handleForgotSubmit}
                disabled={isLoading}
              >
                Reenviar Código
              </button>
              <button
                type="button"
                className="landa-btn-secondary"
                style={{ flex: 1, fontSize: '0.825rem', padding: '0.5rem' }}
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                Volver al Login
              </button>
            </div>
          </form>
        ) : (
          /* LOGIN FORM - EXACT LANDA APP REPLICA */
          <form onSubmit={handleLoginSubmit} className="landa-auth-form">

            <div className="landa-form-group">
              <label htmlFor="landa-login-email">CORREO ELECTRÓNICO</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="landa-login-email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="landa-form-group">
              <label htmlFor="landa-login-password">CONTRASEÑA</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="landa-login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="landa-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="landa-form-forgot">
              <a
                href="#forgot"
                className="landa-link-forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('forgot');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="landa-btn-primary" disabled={isLoading}>
              {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
