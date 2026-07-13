import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPacientes,
  createPaciente,
  createRegistrationInvite,
  mapPaciente,
  pacienteFormToAPI,
} from '../../services/api'
import {
  IconSearch, IconPlus, IconPhone, IconShield, IconChevronDown, IconUsers,
} from '../../components/Icons'

const OBRAS_SOCIALES = ['Galeno', 'Swiss Medical', 'Sancor Salud', 'Medifé', 'Particular']

const FORM_INICIAL = {
  nombre: '', dni: '', fechaNacimiento: '', obraSocial: 'Particular', telefono: '', email: ''
}

const soloNumeros = (valor) => valor.replace(/\D/g, '')

const validar = (form) => {
  const e = {}
  if (!form.nombre.trim())
    e.nombre = 'El nombre es obligatorio'
  if (form.dni && (form.dni.length < 7 || form.dni.length > 8))
    e.dni = 'El DNI debe tener 7 u 8 dígitos'
  if (form.telefono && form.telefono.length < 8)
    e.telefono = 'Ingresá al menos 8 dígitos'
  if (form.fechaNacimiento && new Date(form.fechaNacimiento) > new Date())
    e.fechaNacimiento = 'La fecha no puede ser futura'
  return e
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nac = new Date(fechaNacimiento + 'T00:00:00')
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

const AVATAR_COLORS = [
  { bg: '#FFE4E1', text: '#B00000' },
  { bg: '#FFF3E0', text: '#D84315' },
  { bg: '#FCE4EC', text: '#AD1457' },
  { bg: '#EDE7F6', text: '#6A1B9A' },
  { bg: '#E8F5E9', text: '#2E7D32' },
  { bg: '#E3F2FD', text: '#1565C0' },
]

function getAvatarColor(nombre) {
  if (!nombre) return AVATAR_COLORS[0]
  return AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [errores, setErrores] = useState({})
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState(null)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  const fetchPacientes = async () => {
    try {
      const data = await getPacientes()
      setPacientes(data.map(mapPaciente))
    } catch {
      setPacientes([])
    }
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    getPacientes()
      .then(data => {
        if (!active) return
        setPacientes(data.map(mapPaciente))
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setPacientes([])
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filtered = pacientes.filter(p =>
    p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    p.dni?.includes(search)
  )

  const campo = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    if (errores[key]) setErrores(e => ({ ...e, [key]: undefined }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = validar(form)
    if (Object.keys(errs).length > 0) { setErrores(errs); return }
    setSaving(true)
    try {
      await createPaciente(pacienteFormToAPI(form))
      setForm(FORM_INICIAL)
      setErrores({})
      setShowForm(false)
      fetchPacientes()
    } catch (err) {
      setErrores({ nombre: err.message })
    } finally {
      setSaving(false)
    }
  }

  const cerrarForm = () => {
    setShowForm(false)
    setForm(FORM_INICIAL)
    setErrores({})
  }

  const generarEnlace = async () => {
    setGeneratingInvite(true)
    setInviteError('')
    setCopied(false)
    try {
      const data = await createRegistrationInvite()
      setInvite({
        ...data,
        registrationUrl: data.registrationUrl || `${window.location.origin}${data.registrationPath}`,
      })
    } catch (error) {
      setInviteError(error.message)
    } finally {
      setGeneratingInvite(false)
    }
  }

  const abrirGenerador = () => {
    setShowInvite(true)
    setInvite(null)
    generarEnlace()
  }

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(invite.registrationUrl)
      setCopied(true)
    } catch {
      setInviteError('No se pudo copiar automáticamente. Mantené presionado el enlace para copiarlo.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lista de Pacientes</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {loading
              ? '...'
              : `${pacientes.length} paciente${pacientes.length !== 1 ? 's' : ''} registrado${pacientes.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={abrirGenerador}
            className="flex items-center gap-2 border border-red-100 text-[#B00000] bg-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-all shadow-sm"
          >
            <span aria-hidden="true">↗</span>
            Enviar formulario
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#B00000] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#900000] transition-all shadow-sm"
          >
            <IconPlus className="w-4 h-4" />
            Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
          <IconSearch className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Buscar pacientes por nombre o DNI..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-300 text-sm text-center py-20">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="flex justify-center mb-4 text-gray-200">
            <IconUsers className="w-12 h-12" />
          </div>
          <p className="text-gray-400 text-sm">
            {search
              ? 'No se encontraron pacientes con esa búsqueda'
              : 'Todavía no hay pacientes registrados'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <PacienteCard
              key={p.id}
              paciente={p}
              onClick={() => navigate(`/dashboard/pacientes/${p.id}`)}
            />
          ))}
        </div>
      )}

      {/* Modal nuevo paciente */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-800 text-lg mb-5">Nuevo Paciente</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">

              <Campo label="Nombre completo *" error={errores.nombre}>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => campo('nombre', e.target.value)}
                  className={inputClass(errores.nombre)}
                  placeholder="Ej: María García"
                />
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo label="DNI" error={errores.dni}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.dni}
                    onChange={e => campo('dni', soloNumeros(e.target.value))}
                    className={inputClass(errores.dni)}
                    placeholder="12345678"
                    maxLength={8}
                  />
                </Campo>
                <Campo label="Fecha de nacimiento" error={errores.fechaNacimiento}>
                  <input
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={e => campo('fechaNacimiento', e.target.value)}
                    className={inputClass(errores.fechaNacimiento)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </Campo>
              </div>

              <Campo label="Obra social">
                <select
                  value={form.obraSocial}
                  onChange={e => campo('obraSocial', e.target.value)}
                  className="input"
                >
                  {OBRAS_SOCIALES.map(o => <option key={o}>{o}</option>)}
                </select>
              </Campo>

              <Campo label="Teléfono" error={errores.telefono}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.telefono}
                  onChange={e => campo('telefono', soloNumeros(e.target.value))}
                  className={inputClass(errores.telefono)}
                  placeholder="1169693066"
                  maxLength={15}
                />
              </Campo>

              <Campo label="Email" error={errores.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => campo('email', e.target.value)}
                  className={inputClass(errores.email)}
                  placeholder="paciente@email.com"
                />
              </Campo>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={cerrarForm}
                  className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#B00000] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#900000] transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B00000] mb-1">Registro del paciente</p>
                <h2 className="font-bold text-gray-800 text-lg">Enlace temporal</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {generatingInvite ? (
              <div className="py-10 text-center text-sm text-gray-400">Generando enlace seguro…</div>
            ) : invite ? (
              <div>
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-2">Copiá este enlace y envialo por WhatsApp:</p>
                  <p className="text-sm text-gray-800 font-medium break-all select-all">{invite.registrationUrl}</p>
                </div>
                <div className="flex items-center justify-between gap-3 mb-5 text-xs">
                  <span className="text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">Vence en 30 minutos</span>
                  <span className="text-gray-400">
                    {new Date(invite.expiresAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {inviteError && <p className="text-xs text-red-500 mb-3" role="alert">{inviteError}</p>}
                <button
                  type="button"
                  onClick={copiarEnlace}
                  className="w-full bg-[#B00000] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#900000] transition"
                >
                  {copied ? 'Enlace copiado ✓' : 'Copiar enlace'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-red-600 mb-4" role="alert">{inviteError || 'No se pudo generar el enlace.'}</p>
                <button type="button" onClick={generarEnlace} className="w-full border border-gray-200 rounded-xl py-2.5 text-sm">Intentar nuevamente</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PacienteCard({ paciente: p, onClick }) {
  const color = getAvatarColor(p.nombre)
  const edad = calcularEdad(p.fechaNacimiento)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {p.nombre?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-800 text-sm leading-tight truncate">{p.nombre}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {p.email || (p.dni ? `DNI ${p.dni}` : 'Sin datos de contacto')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {p.telefono ? (
            <a
              href={`tel:${p.telefono}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-[#B00000] border border-red-100 px-3 py-1 rounded-full hover:bg-red-50 transition"
            >
              <IconPhone className="w-3 h-3" />
              Llamar
            </a>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 border border-gray-100 px-3 py-1 rounded-full">
              <IconPhone className="w-3 h-3" />
              Sin tel.
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-100 px-3 py-1 rounded-full truncate max-w-[140px]">
            <IconShield className="w-3 h-3 flex-shrink-0" />
            {p.obraSocial || 'S/O'}
          </span>
        </div>
      </div>

      <div className="h-px bg-gray-50 mx-5" />

      <div className="px-5 py-4 space-y-2.5">
        <DetailRow label="Fecha nac." value={formatFecha(p.fechaNacimiento)} />
        <DetailRow label="Edad" value={edad !== null ? `${edad} años` : '—'} />
        <DetailRow label="Teléfono" value={p.telefono || '—'} />
        <DetailRow label="Estado">
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
            Activo
          </span>
        </DetailRow>
      </div>

      <div className="border-t border-gray-50 px-5 py-3 flex justify-center">
        <button
          onClick={onClick}
          title="Ver ficha"
          className="w-8 h-8 rounded-full bg-[#B00000] flex items-center justify-center text-white hover:bg-[#900000] transition shadow-sm"
        >
          <IconChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function DetailRow({ label, value, children }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      {children || <span className="text-xs font-medium text-gray-700">{value}</span>}
    </div>
  )
}

function Campo({ label, error, children }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(error) {
  return `input ${error ? 'border-red-300 focus:ring-red-200' : ''}`
}
