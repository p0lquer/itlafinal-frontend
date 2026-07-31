import { Link } from "react-router-dom";
import { useAuthContext } from "../context/authContext";

function NavbarClient() {
  const { user, logout } = useAuthContext();

  return (
    <header className="navbar-client">

      <div className="logo">
        TimeGoBetter
      </div>

      <nav>

        <Link to="/dashboard">
          Dashboard
        </Link>

        <Link to="/historial">
          Historial
        </Link>

      </nav>

      <div className="user-info">

        <span>
          Hola, {user?.name}
        </span>

        <button onClick={logout}>
          Cerrar sesión
        </button>

      </div>

    </header>
  );
}

export default NavbarClient;