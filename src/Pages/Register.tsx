import { useState, useEffect, useRef } from "react";
import {Link } from "react-router-dom";
import "./Login.css";
import "./Register.css";
import { useAuth } from '../hook/useAuth'

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  drift: number;
  opacity: number;
}
interface RegisterForm {
  Name: string;
  Phone: string;
  Email: string;
  Password: string;
  OperatorKey?: string;
}


function formatTelefono(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 10);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
}

  // Validación de correo electrónico
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



function Register() {
  const [validationError, setValidationError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handleRegister, error: apiError, isLoading } = useAuth()
  const [showOperatorKey, setShowOperatorKey] = useState(false)
    const [form, setForm] = useState<RegisterForm>({
    Name: "",
    Phone: "",
    Email: "",
    Password: "",
    OperatorKey: "",
  });
 

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const newValue = name === "phone" ? formatTelefono(value) : value;
    setForm(prev => ({ ...prev, [name]: newValue }));
    setValidationError("");
  }



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let width = canvas.width;
    let height = canvas.height;

    const particles: Particle[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedY: Math.random() * 0.3 + 0.05,
      drift: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animationId: number;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 222, 158, ${pt.opacity})`;
        ctx.fill();
        pt.y -= pt.speedY;
        pt.x += pt.drift;
        if (pt.y < -10) { pt.y = height + 10; pt.x = Math.random() * width; }
        if (pt.x < -10) pt.x = width + 10;
        if (pt.x > width + 10) pt.x = -10;
      });
      animationId = requestAnimationFrame(draw);
    }
    draw();

    function handleResize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = canvas.width;
      height = canvas.height;
    }
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function validate(): string | null {
    if (!form.Name.trim()) {
      return "El nombre es obligatorio.";
    }
    if (form.Email.trim() && !EMAIL_REGEX.test(form.Email.trim())) {
      return "Correo electrónico no válido.";
    }
    if (form.Phone.trim() && form.Phone.replace(/\D/g, "").length < 10) {
      return "Número de teléfono incompleto.";
    }
    if (!form.Password || form.Password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
   setValidationError("");
    const validationError = validate();
    if (validationError) {
      setValidationError(validationError);
      return;
    }

        await handleRegister({
          Name: form.Name.trim(),
          Phone: form.Phone.trim(),
          Email: form.Email.trim(),
          Password: form.Password,
          OperatorKey: form.OperatorKey || undefined,
        });
  }
        
        
  



return (
    <div className="login-page">
      <canvas ref={canvasRef} className="particles-canvas" />
      <div className="login-card register-card">
        <div className="login-eyebrow">SISTEMA DE GESTIÓN DE ÓRDENES</div>
        <h1 className="login-title">Crear Cuenta</h1>
        <p className="login-subtitle">Regístrate para acceder al panel de operación</p>

  
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="name">
                Nombre completo <span className="register-required">*</span>
              </label>
              <input id="name" name="name" type="text" placeholder="Tu nombre"
                value={form.Name} onChange={handleChange} autoComplete="name" />
            </div>
            <div className="input-group">
              <label htmlFor="email">
                Correo electrónico <span className="register-optional"></span>
              </label>
              <input id="email" name="email" type="email" placeholder="correo@mail.com"
                value={form.Email} onChange={handleChange} autoComplete="email" />
            </div>
            <div className="input-group">
              <label htmlFor="password">
                Contraseña <span className="register-required">*</span>
              </label>
              <input id="password" name="password" type="password" placeholder="tu contraseña"
                value={form.Password} onChange={handleChange} autoComplete="new-password" />
            </div>
            <div className="input-group">
              <label htmlFor="phone">
                Teléfono <span className="register-optional"></span>
              </label>
              <input id="phone" name="phone" type="tel" placeholder="809-000-0000"
                value={form.Phone} onChange={handleChange} autoComplete="tel" />
            </div>

             {/* Botón discreto para mostrar el campo de clave de operador */}
          <div className="input-group">
            <button className="toggle-operator-key-btn"
              type="button"
              onClick={() => setShowOperatorKey(prev => !prev)}
            >
              {showOperatorKey ? 'Soy cliente normal' : '¿Eres operador?'}
            </button>
          </div>

          {showOperatorKey && (
            <div className="input-group">
              <label htmlFor="operator_key">Clave de operador</label>
              <input id="operator_key" name="operator_key" type="password"
                placeholder="Ingresa la clave del negocio"
                value={form.OperatorKey} onChange={handleChange} />
            </div>
          )}


          {(validationError || apiError) && (
  <div className="login-error">{validationError || apiError}</div>
)}

<button type="submit" className="login-button" disabled={isLoading}>
  {isLoading ? "Registrando..." : "Registrarse"}
</button>

            <p className="register-link">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login">Iniciar Sesión</Link>
            </p>
          </form>

      </div>
    </div>
  );
}

export default Register;
