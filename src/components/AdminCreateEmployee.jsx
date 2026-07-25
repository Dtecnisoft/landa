import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/images/logo.png';
import { useToast } from '../context/ToastContext';

const SPECIALTY_OPTIONS = [
  { id: 'moderation', label: 'Moderación', icon: '🛡️', color: '#3b82f6', description: 'Moderación de contenido y publicaciones' },
  { id: 'support', label: 'Soporte', icon: '🎧', color: '#10b981', description: 'Atención al usuario y servicio al cliente' },
  { id: 'reports', label: 'Reportes', icon: '🚩', color: '#f59e0b', description: 'Gestión de denuncias e incidencias' },
  { id: 'finances', label: 'Finanzas', icon: '💰', color: '#8b5cf6', description: 'Control de recargas, comisiones y billeteras' },
];

function AdminCreateEmployee() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cc, setCc] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const toggleSpecialty = (id) => {
    if (specialties.includes(id)) {
      setSpecialties(specialties.filter((s) => s !== id));
    } else {
      setSpecialties([...specialties, id]);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!cc.trim()) newErrors.cc = 'El documento de identidad es obligatorio';
    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Correo electrónico inválido';
    }
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    if (specialties.length === 0) {
      newErrors.specialties = 'Selecciona al menos una especialidad para el empleado.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast('Por favor, completa los campos requeridos.', 'warning', 'Formulario Incompleto');
      return false;
    }
    return true;
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Create employee in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password
      });

      if (signUpError) {
        setLoading(false);
        let msg = signUpError.message;
        if (msg.includes('User already registered')) msg = 'Ya existe un usuario registrado con este correo.';
        setErrors({ form: msg });
        showToast(msg, 'error', 'Error de Registro');
        return;
      }

      const uid = data?.user?.id || `emp-${Date.now()}`;

      // 2. Insert into 'users' table
      const { error: userError } = await supabase.from('users').insert({
        id: uid,
        name: name.trim(),
        last_name: '',
        email: email.toLowerCase().trim(),
        role: 'employee',
        specialties: specialties,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=4f46e5&color=fff`,
        points: 0,
        city: 'Colombia',
        status: 'approved'
      });

      if (userError) {
        console.log('Notice inserting into users:', userError);
      }

      // 3. Insert into 'empleado' table
      const { error: empError } = await supabase.from('empleado').insert({
        id: uid,
        cc: cc.trim(),
        name: name.trim(),
        email: email.toLowerCase().trim()
      });

      if (empError) {
        console.log('Notice inserting into empleado:', empError);
      }

      setLoading(false);
      const successText = `El empleado ${name.trim()} ha sido creado correctamente en Supabase.`;
      setSuccessMsg(`¡Éxito! ${successText}`);
      showToast(successText, 'success', '¡Empleado Registrado!');

      setTimeout(() => {
        navigate('/master');
      }, 1800);
    } catch (error) {
      setLoading(false);
      console.error('Error al crear empleado:', error);
      const errMsg = 'No se pudo crear el empleado. Intenta nuevamente.';
      setErrors({ form: errMsg });
      showToast(errMsg, 'error', 'Error al Crear');
    }
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
              <span className="master-brand-sub">Panel Master • Nuevo Empleado</span>
            </div>
          </div>

          <button className="chip-btn active" onClick={() => navigate('/master')}>
            ← Volver al Panel Master
          </button>
        </div>
      </header>

      <main className="master-container" style={{ maxWidth: '780px' }}>
        <div className="master-hero-banner" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)' }}>
          <div>
            <h1 className="banner-greeting" style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Regístrar Nuevo Empleado</h1>
            <p className="banner-subtext">Crea accesos y asigna permisos especiales para el equipo interno de Landa.</p>
          </div>
        </div>

        {errors.form && (
          <div className="landa-auth-alert error">
            ⚠️ {errors.form}
          </div>
        )}

        {successMsg && (
          <div className="landa-auth-alert success">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleCreateEmployee} className="create-employee-form">
          {/* SECTION 1: DATOS DEL EMPLEADO */}
          <div className="system-status-card" style={{ gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#5c7cfa', margin: 0, fontWeight: 700 }}>
              📄 Datos del Empleado
            </h3>

            {/* Documento CC */}
            <div className="landa-form-group">
              <label>DOCUMENTO DE IDENTIDAD (CC)</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">🆔</span>
                <input
                  type="text"
                  placeholder="Ej. 1020304050"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>
              {errors.cc && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.cc}</span>}
            </div>

            {/* Nombre Completo */}
            <div className="landa-form-group">
              <label>NOMBRE COMPLETO</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">👤</span>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {errors.name && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.name}</span>}
            </div>

            {/* Correo Electrónico */}
            <div className="landa-form-group">
              <label>CORREO ELECTRÓNICO</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">✉️</span>
                <input
                  type="email"
                  placeholder="empleado@landa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.email}</span>}
            </div>

            {/* Contraseña */}
            <div className="landa-form-group">
              <label>CONTRASEÑA</label>
              <div className="landa-input-wrapper">
                <span className="landa-input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {errors.password && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.password}</span>}
            </div>
          </div>

          {/* SECTION 2: ESPECIALIDADES */}
          <div className="system-status-card" style={{ gap: '1rem', marginTop: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#5c7cfa', margin: '0 0 0.25rem 0', fontWeight: 700 }}>
                💼 Especialidades (Soporte / Moderación)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                Define qué áreas de la plataforma podrá gestionar este empleado.
              </p>
            </div>

            {errors.specialties && (
              <span style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>⚠️ {errors.specialties}</span>
            )}

            <div className="specialties-grid">
              {SPECIALTY_OPTIONS.map((opt) => {
                const isSelected = specialties.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`specialty-card ${isSelected ? 'selected' : ''}`}
                    style={{ borderColor: isSelected ? opt.color : 'rgba(255, 255, 255, 0.08)' }}
                    onClick={() => toggleSpecialty(opt.id)}
                  >
                    <div className="specialty-header">
                      <span className="specialty-icon-badge" style={{ background: isSelected ? opt.color : 'rgba(255, 255, 255, 0.06)' }}>
                        {opt.icon}
                      </span>
                      {isSelected && <span className="specialty-check" style={{ background: opt.color }}>✓</span>}
                    </div>
                    <span className="specialty-title" style={{ color: isSelected ? opt.color : '#ffffff' }}>
                      {opt.label}
                    </span>
                    <span className="specialty-desc">{opt.description}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="landa-btn-primary"
            disabled={loading}
            style={{ marginTop: '1.75rem', minHeight: '52px', fontSize: '1.05rem', fontWeight: 700 }}
          >
            {loading ? 'CREANDO EMPLEADO EN SUPABASE...' : '👤+ REGISTRAR EMPLEADO'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default AdminCreateEmployee;
