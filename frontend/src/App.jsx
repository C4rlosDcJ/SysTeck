import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MobileHeader from './components/MobileHeader';
import Sidebar from './components/Sidebar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import NewQuoteForm from './pages/client/NewQuoteForm';
import RepairsListPage from './pages/client/RepairsListPage';
import ProfilePage from './pages/client/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRepairs from './pages/admin/AdminRepairs';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminServices from './pages/admin/AdminServices';
import AdminReports from './pages/admin/AdminReports';
import SettingsPage from './pages/admin/SettingsPage';
import NewRepairPage from './pages/admin/NewRepairPage';
import RepairDetailPage from './pages/shared/RepairDetailPage';

import './index.css';

// Componente para manejar el layout con Sidebar/MobileHeader
function DashboardLayout({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    // Using a timeout to defer the state update, avoiding synchronous setState in effect
    const timer = setTimeout(() => setIsSidebarOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-container">
      <MobileHeader isOpen={isSidebarOpen} toggleMenu={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleMenu={toggleSidebar} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

// Public Route (redirects if logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />

      {/* Client Routes */}
      <Route path="/dashboard" element={
        <DashboardLayout>
          <ClientDashboard />
        </DashboardLayout>
      } />
      <Route path="/dashboard/nueva-cotizacion" element={
        <DashboardLayout>
          <NewQuoteForm />
        </DashboardLayout>
      } />
      <Route path="/dashboard/reparaciones" element={
        <DashboardLayout>
          <RepairsListPage />
        </DashboardLayout>
      } />
      <Route path="/dashboard/reparaciones/:id" element={
        <DashboardLayout>
          <RepairDetailPage />
        </DashboardLayout>
      } />
      <Route path="/dashboard/perfil" element={
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <DashboardLayout adminOnly>
          <AdminDashboard />
        </DashboardLayout>
      } />
      <Route path="/admin/reparaciones" element={
        <DashboardLayout adminOnly>
          <AdminRepairs />
        </DashboardLayout>
      } />
      <Route path="/admin/reparaciones/:id" element={
        <DashboardLayout adminOnly>
          <RepairDetailPage />
        </DashboardLayout>
      } />
      <Route path="/admin/clientes" element={
        <DashboardLayout adminOnly>
          <AdminCustomers />
        </DashboardLayout>
      } />
      <Route path="/admin/servicios" element={
        <DashboardLayout adminOnly>
          <AdminServices />
        </DashboardLayout>
      } />
      <Route path="/admin/configuracion" element={
        <DashboardLayout adminOnly>
          <SettingsPage />
        </DashboardLayout>
      } />
      <Route path="/admin/reportes" element={
        <DashboardLayout adminOnly>
          <AdminReports />
        </DashboardLayout>
      } />
      <Route path="/admin/nueva-reparacion" element={
        <DashboardLayout adminOnly>
          <NewRepairPage />
        </DashboardLayout>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
