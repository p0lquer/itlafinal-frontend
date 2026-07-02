import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  drift: number;
  opacity: number;
}

function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

        if (pt.y < -10) {
          pt.y = height + 10;
          pt.x = Math.random() * width;
        }
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!usuario.trim() || !password.trim()) {
      setError("Completa usuario y contraseña para continuar.");
      return;
    }

    // TODO: conectar con el endpoint real de autenticación (JWT) cuando esté disponible en el backend
    console.log("Intentando iniciar sesión con:", usuario);
    navigate("/dashboard");
  }

  return (
    <div className="login-page">
      <canvas ref={canvasRef} className="particles-canvas" />

      <div className="login-card">
        <div className="login-eyebrow">SISTEMA DE GESTIÓN DE ÓRDENES</div>
        <h1 className="login-title">Iniciar Sesión</h1>
        <p className="login-subtitle">Accede a tu panel de operación</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              type="text"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;