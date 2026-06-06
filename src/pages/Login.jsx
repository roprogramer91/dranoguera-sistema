import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const provider = new GoogleAuthProvider()

export default function Login() {
  const { user, role } = useAuth()

  if (user) {
    return role === 'doctor'
      ? <Navigate to="/dashboard" replace />
      : <Navigate to="/no-autorizado" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🫀</span>
          <span className="text-xl font-bold text-[#b00000]">Dra. Adriana Noguera</span>
        </div>
        <p className="text-gray-400 text-sm text-center">Sistema de gestión del consultorio</p>
        <hr className="w-full border-gray-100" />
        <button
          onClick={() => signInWithPopup(auth, provider)}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-6 py-3 text-sm font-medium text-gray-700 hover:shadow-md hover:border-gray-300 transition w-full justify-center"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Ingresar con Google
        </button>
        <p className="text-xs text-gray-300">Acceso exclusivo para personal autorizado</p>
      </div>
    </div>
  )
}
