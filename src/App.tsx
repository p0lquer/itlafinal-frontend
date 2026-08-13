import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Register from './Pages/Register';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/authContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import DashboardClients from "./Pages/DashboardClients";
import NotFound from "./Pages/404";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminAnalytics from "./Pages/AdminAnalytics";
import { ThemeProvider } from "./context/themeContext";
import Checkout from './Pages/Checkout';

const queryClient = new QueryClient()

console.log("App.tsx loaded");
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            <Route
              path="/operator"
              element={
                <ProtectedRoute allowedRole="operator">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><AdminAnalytics /></ProtectedRoute>} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRole="customer">
                    <DashboardClients />
                  </ProtectedRoute>
                }
              />
              <Route path="/checkout/:orderId" element={<ProtectedRoute allowedRole="customer"><Checkout /></ProtectedRoute>} />

            
           <Route path="*" element={<NotFound />} />

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
