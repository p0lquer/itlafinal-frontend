import { NavLink } from "react-router-dom";
import { useAuthContext } from "../context/authContext";
import "./NavbarlClient.css";

function NavbarClient() {
  const { user, logout } = useAuthContext();

  return (
    <header className="navbar-client">
      {/* Left Side */}
      <div className="navbar-left">
        <NavLink to="/dashboard" className="logo">
          {/* <FaClock /> */}
          <span className="logo-icon">⏰</span>
          <span className="logo-text">TimeGoBetter</span>
        </NavLink>
      </div>

      {/* Center */}
      {/* <nav className="navbar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Dashboard
        </NavLink> */}

        {/* <NavLink
          to="/historial"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Historial
        </NavLink> */}
      {/* </nav> */}

      {/* Right Side */}
      <div className="navbar-user">
        <div className="user-profile">
          <div className="avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="user-details">
            <small>Bienvenido</small>
            <span>{user?.name}</span>
          </div>
        </div>

        <button className="logout-button" onClick={logout}>
          {/* <FaSignOutAlt /> */}
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}

export default NavbarClient;