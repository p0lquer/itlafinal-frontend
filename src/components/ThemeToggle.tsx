import { useTheme } from "../context/themeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"} title={isDark ? "Tema claro" : "Tema oscuro"}>
    <span aria-hidden="true">{isDark ? "☀" : "◐"}</span>
    <span className="theme-toggle__label">{isDark ? "Claro" : "Oscuro"}</span>
  </button>;
}
