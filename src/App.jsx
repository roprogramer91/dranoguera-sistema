import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import DoctorLayout from './pages/DoctorLayout'
import DashboardHome from './pages/doctor/DashboardHome'
import Pacientes from './pages/doctor/Pacientes'
import PacienteDetalle from './pages/doctor/PacienteDetalle'
import Agenda from './pages/doctor/Agenda'
import Unauthorized from './pages/Unauthorized'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/no-autorizado" element={<Unauthorized />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="pacientes/:id" element={<PacienteDetalle />} />
            <Route path="agenda" element={<Agenda />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
