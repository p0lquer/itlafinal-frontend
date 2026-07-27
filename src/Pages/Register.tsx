import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hook/useAuth'

export function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', operator_key: ''
  })
  const [showOperatorKey, setShowOperatorKey] = useState(false)
  const { handleRegister, error, isLoading } = useAuth()


  const formatTelefono = (value: string) => {
    // Elimina todo lo que no sea un número
    const numbers = value.replace(/\D/g, "").slice(0, 10);

    if (numbers.length <= 3) {
      return numbers;
    }

    if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };









  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newValue = value;

    // Aplicar formato automatico al campo de teléfono 
    if (name === "phone") {
      newValue = formatTelefono(value);
    }

    setForm(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };














  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()


    // Validación de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email)) {
      alert("Correo electrónico no válido.");
      return;
    }

    //validación de contraseña
    if (form.password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }












    handleRegister({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      operator_key: form.operator_key || undefined,
    })
  }






  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>BetterTime 🧺</h1>
        <p style={styles.subtitle}>Crea tu cuenta</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={onSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Nombre completo</label>
            <input style={styles.input} name="name" placeholder="Juan Pérez"
              value={form.name} onChange={handleChange} required maxLength={100} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} name="email" type="email" placeholder="tu@email.com"
              value={form.email} onChange={handleChange} required maxLength={100} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input style={styles.input} name="password" type="password" placeholder="Mínimo 8 caracteres"
              value={form.password} onChange={handleChange} required minLength={8} maxLength={65} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Teléfono (opcional)</label>
            <input style={styles.input} name="phone" placeholder="809-555-0000"
              value={form.phone} onChange={handleChange} maxLength={12} />
          </div>

          {/* Botón discreto para mostrar el campo de clave de operador */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setShowOperatorKey(prev => !prev)}
              style={styles.toggleBtn}
            >
              {showOperatorKey ? 'Soy cliente normal' : '¿Eres operador?'}
            </button>
          </div>

          {showOperatorKey && (
            <div style={styles.field}>
              <label style={styles.label}>Clave de operador</label>
              <input style={styles.input} name="operator_key" type="password"
                placeholder="Ingresa la clave del negocio"
                value={form.operator_key} onChange={handleChange} />
              <small style={{ color: '#888', fontSize: '12px' }}>
                Esta clave la provee el administrador del negocio.
              </small>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={isLoading ? { ...styles.button, opacity: 0.7 } : styles.button}
          >
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p style={styles.link}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#2e86c1' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '420px',
  },
  title: { margin: 0, textAlign: 'center', color: '#1b4f72', fontSize: '28px' },
  subtitle: { textAlign: 'center', color: '#888', marginBottom: '24px' },
  error: {
    backgroundColor: '#fdecea',
    color: '#c0392b',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  field: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#333' },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1b4f72',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#2e86c1',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'underline',
  },
  link: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' },
}