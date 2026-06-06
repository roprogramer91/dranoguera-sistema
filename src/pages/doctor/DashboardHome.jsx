import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats } from '../../services/api'
import {
  IconUsers, IconCalendar, IconClipboard, IconFolder, IconArrowUpRight,
} from '../../components/Icons'

export default function DashboardHome() {
  const [stats, setStats] = useState({ totalPatients: '—', todayAppointments: '—', nextAppointment: null })
  const navigate = useNavigate()

  useEffect(() => {
    getStats()
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const proximoLabel = stats.nextAppointment
    ? `${stats.nextAppointment.time} hs`
    : 'Sin turnos'

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Bienvenida, Dra. Noguera</h1>
        <p className="text-gray-400 text-sm capitalize mt-0.5">{today}</p>
      </div>

      {/* Stats + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Stats 2×2 */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <BigStatCard value={stats.totalPatients} label="Total Pacientes" badge="activos" />
          <StatCard value={stats.todayAppointments} label="Turnos hoy" badge="hoy" badgeColor="gray" />
          <StatCard value="—" label="Seguimiento" badge="+6%" badgeColor="orange" />
          <StatCard value={proximoLabel} label="Próximo turno" badge="hoy" badgeColor="gray" />
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Evolución de pacientes</p>
            <span className="text-xs text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full">Anual</span>
          </div>
          <div className="flex-1 flex items-end">
            <MiniChart />
          </div>
          <div className="flex justify-between mt-2">
            {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'].map(m => (
              <span key={m} className="text-[10px] text-gray-300">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Módulos */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Módulos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModuleCard
          Icon={IconUsers}
          title="Pacientes"
          description="Registrar y gestionar expedientes"
          active
          onClick={() => navigate('/dashboard/pacientes')}
        />
        <ModuleCard
          Icon={IconCalendar}
          title="Agenda"
          description="Gestionar turnos del consultorio"
          active
          onClick={() => navigate('/dashboard/agenda')}
        />
        <ModuleCard
          Icon={IconClipboard}
          title="Historia Clínica"
          description="Notas de evolución por paciente"
          badge="Dentro de pacientes"
        />
        <ModuleCard
          Icon={IconFolder}
          title="Estudios"
          description="PDFs, ECG, laboratorios y más"
          badge="Próximamente"
        />
      </div>
    </div>
  )
}

function BigStatCard({ value, label, badge }) {
  return (
    <div className="bg-gradient-to-br from-[#B00000] to-[#7B0000] rounded-2xl p-5 text-white relative overflow-hidden">
      <span className="absolute top-3 right-3 bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-medium">
        {badge}
      </span>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-white/70 text-sm mt-1">{label}</p>
      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
        <IconArrowUpRight className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
  )
}

function StatCard({ value, label, badge, badgeColor }) {
  const colors = {
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    gray: 'bg-gray-100 text-gray-500',
  }
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <span className={`absolute top-3 right-3 text-[11px] px-2 py-0.5 rounded-full font-medium ${colors[badgeColor]}`}>
        {badge}
      </span>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
      <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
        <IconArrowUpRight className="w-3 h-3 text-[#B00000]" />
      </div>
    </div>
  )
}

function MiniChart() {
  const pts = [20, 35, 22, 50, 38, 65, 48, 80]
  const w = 240
  const h = 70
  const step = w / (pts.length - 1)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / 100) * h}`).join(' ')
  const area = `${d} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#B00000" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#B00000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)" />
      <path d={d} fill="none" stroke="#B00000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ModuleCard({ Icon, title, description, badge, active, onClick }) {
  return (
    <div
      onClick={active ? onClick : undefined}
      className={`bg-white rounded-2xl shadow-sm p-6 flex items-start gap-4 transition-all ${
        active
          ? 'cursor-pointer hover:shadow-md border border-transparent hover:border-red-100'
          : 'opacity-50'
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 text-[#B00000]">
        <Icon className="w-5 h-5" />
      </div>
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
