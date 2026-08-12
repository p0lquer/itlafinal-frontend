import { NavLink } from "react-router-dom";
import { useAuthContext } from "../context/authContext";
import "./NavbarlClient.css";

function getInitials(name?: string) {
  return name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function NavbarClient() {
  const { user, logout } = useAuthContext();

  return (
    <header className="navbar-client">
      <NavLink to="/dashboard" end className="logo" aria-label="Ir al panel de cliente de TimeGoBetter">
        <span className="logo-icon" aria-hidden="true">T</span>
        <span>
          <span className="logo-text">TimeGoBetter</span>
          <span className="logo-subtitle">Portal del cliente</span>
        </span>
      </NavLink>

      <nav className="navbar-nav" aria-label="Navegación principal">
        <NavLink to="/dashboard" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Mis órdenes
        </NavLink>
      </nav>

      <div className="navbar-user">
        <div className="user-profile" aria-label={`Sesión de ${user?.name ?? "cliente"}`}>
          <div className="avatar" aria-hidden="true">{getInitials(user?.name)}</div>
          <div className="user-details"><small>Bienvenido/a</small><span>{user?.name ?? "Cliente"}</span></div>
        </div>
        <button type="button" className="logout-button" onClick={logout}>Cerrar sesión</button>
      </div>
    </header>
  );
}

export default NavbarClient;
