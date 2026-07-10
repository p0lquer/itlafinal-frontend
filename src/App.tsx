import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import { Register } from './Pages/Register';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/authContext';
import {ProtectedRoute} from './components/ProtectedRoute';

const queryClient = new QueryClient()

// Placeholders temporales — los crearás después
function OperatorPage() {
  return <h1 style={{ padding: 24 }}>Panel Operador 🔧 (en construcción)</h1>
}
function DashboardPage() {
  return <h1 style={{ padding: 24 }}>Dashboard Cliente 👕 (en construcción)</h1>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        

        {/* Solo operadores */}
            <Route path="/operator" element={
              <ProtectedRoute allowedRole="operator">
                <Route path="/operator" element={<OperatorPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <OperatorPage />
              </ProtectedRoute>
            }/>

             {/* Solo customers */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="customer">
                <DashboardPage />
              </ProtectedRoute>
            }/>
  {/* Redirigir raíz al login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
    </BrowserRouter>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;