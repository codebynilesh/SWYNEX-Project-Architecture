import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute, PublicOnly } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}
