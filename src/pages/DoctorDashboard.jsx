import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

export default function DoctorDashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🫀</span>
          <span className="font-bold text-[#b00000] text-lg">Panel Médico</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <img src={user.photoURL} className="w-8 h-8 rounded-full" alt="" />
            )}
            <span className="text-sm text-gray-600 hidden sm:block">{user.displayName}</span>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-gray-400 hover:text-red-600 transition"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Bienvenida, Dra. Noguera 👋
        </h1>
        <p className="text-gray-400 text-sm mb-8">Panel de gestión del consultorio</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Turnos hoy" value="—" icon="📅" />
          <StatCard label="Total pacientes" value="—" icon="👥" />
          <StatCard label="Próximo turno" value="—" icon="⏰" />
        </div>

        {/* Módulos próximos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModuleCard
            icon="👥"
            title="Pacientes"
            description="Registrar y gestionar expedientes de pacientes"
            badge="Próximamente"
          />
          <ModuleCard
            icon="📅"
            title="Agenda"
            description="Ver y gestionar turnos del consultorio"
            badge="Próximamente"
          />
          <ModuleCard
            icon="📋"
            title="Historia Clínica"
            description="Notas de evolución por paciente"
            badge="Próximamente"
          />
          <ModuleCard
            icon="📁"
            title="Estudios"
            description="PDFs, ECG, laboratorios y más"
            badge="Próximamente"
          />
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-700">{value}</p>
      </div>
    </div>
  )
}

function ModuleCard({ icon, title, description, badge }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-start gap-4 opacity-60">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {badge && (
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  )
}
