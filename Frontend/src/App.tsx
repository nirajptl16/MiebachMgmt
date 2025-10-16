import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/authcontext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/login';
import ManagerDashboard from './pages/ManagerDashboard';
import CreateProject from './pages/createproject';
import ProjectDetail from './pages/ProjectDetail';
import ContributorDashboard from './pages/contributordashboard';


function AppRoutes() {
  const { isManager } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {isManager ? <ManagerDashboard /> : <ContributorDashboard />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/create"
        element={
          <ProtectedRoute requireManager>
            <CreateProject />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute requireManager>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
    
    
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute>
            <ContributorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}