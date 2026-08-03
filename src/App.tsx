import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from './pages/Register';
import OrderHistory from "./pages/OrderHistory";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/authContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardClients from "./pages/DashboardClients";
import NotFound from "./pages/404";

const queryClient = new QueryClient()

console.log("App.tsx loaded");
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/operator"
              element={
                <ProtectedRoute allowedRole="operator">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/404" element={<NotFound />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRole="customer">
                    <DashboardClients />
                  </ProtectedRoute>
                }
              />

            <Route
              path="/historial"
              element={
                <ProtectedRoute allowedRole="customer">
                  <OrderHistory />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;