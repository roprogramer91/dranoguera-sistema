import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase/config'

export default function Unauthorized() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm mx-4">
        <p className="text-6xl mb-4">🔒</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Acceso no autorizado</h1>
        <p className="text-gray-400 text-sm mb-6">
          Esta sección es exclusiva para la Dra. Noguera.
        </p>
        <button
          onClick={handleSignOut}
          className="text-sm text-[#b00000] hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
