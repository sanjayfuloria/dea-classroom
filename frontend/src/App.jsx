import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import DashboardPage   from './pages/DashboardPage'
import AnalysisPage    from './pages/AnalysisPage'
import ResultsPage     from './pages/ResultsPage'
import PythonPage      from './pages/PythonPage'
import SessionsPage    from './pages/SessionsPage'
import FacultyPage     from './pages/FacultyPage'
import Layout          from './components/Layout'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-navy text-white text-lg">Loading…</div>
  if (!user)   return <Navigate to="/login" replace />
  return children
}

function RequireFaculty({ children }) {
  const { isFaculty, loading } = useAuth()
  if (loading)    return null
  if (!isFaculty) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"        element={<DashboardPage />} />
            <Route path="analysis"         element={<AnalysisPage />} />
            <Route path="results/:id"      element={<ResultsPage />} />
            <Route path="python"           element={<PythonPage />} />
            <Route path="sessions"         element={<SessionsPage />} />
            <Route path="faculty" element={
              <RequireFaculty><FacultyPage /></RequireFaculty>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
