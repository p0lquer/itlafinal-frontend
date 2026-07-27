import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import "./Register.css";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  drift: number;
  opacity: number;
}

function Register() {
  const [form, setForm] = useState({ id: "", name: "", phone: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.id.trim() || !form.name.trim()) {
      setError("El ID y el nombre son obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id.trim(),
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "No se pudo registrar el cliente.");
      }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <canvas ref={canvasRef} className="particles-canvas" />
      <div className="login-card register-card">
        <div className="login-eyebrow">SISTEMA DE GESTIÓN DE ÓRDENES</div>
        <h1 className="login-title">Crear Cuenta</h1>
        <p className="login-subtitle">Regístrate para acceder al panel de operación</p>

        {success ? (
          <div className="register-success">
            <span className="register-success-icon">✓</span>
            <p>¡Registro exitoso!</p>
            <p className="register-success-sub">Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="id">
                ID de cliente <span className="register-required">*</span>
              </label>
              <input id="id" name="id" type="text" placeholder="ej: c7"
                value={form.id} onChange={handleChange} autoComplete="off" />
            </div>
            <div className="input-group">
              <label htmlFor="name">
                Nombre completo <span className="register-required">*</span>
              </label>
              <input id="name" name="name" type="text" placeholder="Tu nombre"
                value={form.name} onChange={handleChange} autoComplete="name" />
            </div>
            <div className="input-group">
              <label htmlFor="phone">
                Teléfono <span className="register-optional">(opcional)</span>
              </label>
              <input id="phone" name="phone" type="tel" placeholder="809-000-0000"
                value={form.phone} onChange={handleChange} autoComplete="tel" />
            </div>
            <div className="input-group">
              <label htmlFor="email">
                Correo electrónico <span className="register-optional">(opcional)</span>
              </label>
              <input id="email" name="email" type="email" placeholder="correo@mail.com"
                value={form.email} onChange={handleChange} autoComplete="email" />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </button>

            <p className="register-link">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login">Iniciar Sesión</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default Register;