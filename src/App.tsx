import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider } from '@/lib/themeContext';
import { FilterProvider } from '@/lib/filterContext';
import { ToastProvider } from '@/components/ui/Toast';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CrimeExplorerPage } from '@/pages/dashboard/CrimeExplorerPage';
import { CrimeMapPage } from '@/pages/dashboard/CrimeMapPage';
import { AnalyticsPage } from '@/pages/dashboard/AnalyticsPage';
import { HotspotsPage } from '@/pages/dashboard/HotspotsPage';
import { RiskIntelligencePage } from '@/pages/dashboard/RiskIntelligencePage';
import { PredictionsPage } from '@/pages/dashboard/PredictionsPage';
import { ReportsPage } from '@/pages/dashboard/ReportsPage';
import { DataManagementPage } from '@/pages/dashboard/DataManagementPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { LoadingSpinner } from '@/components/ui/States';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <FilterProvider>
              <DashboardLayout />
            </FilterProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="crime-explorer" element={<CrimeExplorerPage />} />
        <Route path="crime-map" element={<CrimeMapPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="hotspots" element={<HotspotsPage />} />
        <Route path="risk-intelligence" element={<RiskIntelligencePage />} />
        <Route path="predictions" element={<PredictionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="data-management" element={<DataManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
