import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { login } from "../api/auth";
import { useAuthContext } from "../context/authContext";
import type { User } from "../types";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  drift: number;
  opacity: number;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { saveSession } = useAuthContext();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;


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
      width = canvas.width;
      height = canvas.height;
    }
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Completa tu correo y contraseña para continuar.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await login({ email, password });

      const user: User = {
        user_id: data.user_id ?? "",
        name: data.name,
        email: data.email,
        role: data.role,
      };

      saveSession(data.token, user);

      // Redirigir según el rol
      if (data.role === "operator") {
        navigate("/operator");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? "Credenciales incorrectas.");
    } finally {
      setIsLoading(false);
    }
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
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={120}
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
              maxLength={60}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>

          <p className="register-link">
            ¿No tienes cuenta?{" "}
            <Link to="/register">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;