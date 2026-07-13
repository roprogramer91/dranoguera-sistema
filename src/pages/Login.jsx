import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { useState } from 'react'

const provider = new GoogleAuthProvider()

export default function Login() {
  const { user, role } = useAuth()
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  const handleLogin = async () => {
    setError('')
    setSigningIn(true)
    try {
      await signInWithPopup(auth, provider)
    } catch (loginError) {
      if (loginError.code === 'auth/unauthorized-domain') {
        setError('Este dominio de development todavía no está autorizado en Firebase.')
      } else if (loginError.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana de Google. Habilitá las ventanas emergentes e intentá nuevamente.')
      } else if (loginError.code !== 'auth/popup-closed-by-user') {
        setError('No se pudo iniciar sesión con Google. Intentá nuevamente.')
      }
    } finally {
      setSigningIn(false)
    }
  }

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
          onClick={handleLogin}
          disabled={signingIn}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-6 py-3 text-sm font-medium text-gray-700 hover:shadow-md hover:border-gray-300 transition w-full justify-center disabled:opacity-60 disabled:cursor-wait"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          {signingIn ? 'Conectando…' : 'Ingresar con Google'}
        </button>
        {error && (
          <p className="w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700 text-center" role="alert">
            {error}
          </p>
        )}
        <p className="text-xs text-gray-300">Acceso exclusivo para personal autorizado</p>
      </div>
    </div>
  )
}
