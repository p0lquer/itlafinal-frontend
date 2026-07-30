import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import  Register  from './Pages/Register';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/authContext';
import {ProtectedRoute} from './components/ProtectedRoute';
import NotFound from "./Pages/404";

const queryClient = new QueryClient()



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
              {/* <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRole="customer">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              /> */}

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;