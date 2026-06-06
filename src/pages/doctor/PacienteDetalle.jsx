import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getPaciente, updatePaciente, archivarPaciente,
  getNotas, createNota,
  mapPaciente, mapNota, pacienteFormToAPI,
} from '../../services/api'

const OBRAS_SOCIALES = ['Galeno', 'Swiss Medical', 'Sancor Salud', 'Medifé', 'Particular']
const soloNumeros = (v) => v.replace(/\D/g, '')

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

export default function PacienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [notas, setNotas] = useState([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editErrores, setEditErrores] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  const [confirmArchivar, setConfirmArchivar] = useState(false)
  const [archivando, setArchivando] = useState(false)

  const fetchNotas = async () => {
    try {
      const data = await getNotas(id)
      setNotas(data.map(mapNota))
    } catch {
      setNotas([])
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPaciente(id)
        setPaciente(mapPaciente(data))
        await fetchNotas()
      } catch {
        setPaciente(null)
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  // ── Notas ──────────────────────────────────────────────
  const handleAddNota = async () => {
    if (!nuevaNota.trim()) return
    setSaving(true)
    try {
      await createNota(id, nuevaNota.trim())
      setNuevaNota('')
      await fetchNotas()
    } finally {
      setSaving(false)
    }
  }

  // ── Editar ─────────────────────────────────────────────
  const abrirEdit = () => {
    setEditForm({
      nombre: paciente.nombre || '',
      dni: paciente.dni || '',
      fechaNacimiento: paciente.fechaNacimiento || '',
      obraSocial: paciente.obraSocial || 'Particular',
      telefono: paciente.telefono || '',
      email: paciente.email || '',
    })
    setEditErrores({})
    setShowEdit(true)
  }

  const editCampo = (key, value) => {
    setEditForm(f => ({ ...f, [key]: value }))
    if (editErrores[key]) setEditErrores(e => ({ ...e, [key]: undefined }))
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    const errs = validar(editForm)
    if (Object.keys(errs).length > 0) { setEditErrores(errs); return }
    setEditSaving(true)
    try {
      const updated = await updatePaciente(id, pacienteFormToAPI(editForm))
      setPaciente(mapPaciente(updated))
      setShowEdit(false)
    } catch (err) {
      setEditErrores({ nombre: err.message })
    } finally {
      setEditSaving(false)
    }
  }

  // ── Archivar ───────────────────────────────────────────
  const handleArchivar = async () => {
    setArchivando(true)
    try {
      await archivarPaciente(id)
      navigate('/dashboard/pacientes')
    } finally {
      setArchivando(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────
  const calcEdad = (fecha) => {
    if (!fecha) return null
    const hoy = new Date()
    const nac = new Date(fecha + 'T00:00:00')
    return `${Math.floor((hoy - nac) / (365.25 * 24 * 60 * 60 * 1000))} años`
  }

  const formatFecha = (ts) => {
    if (!ts) return '—'
    const date = new Date(ts)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <p className="text-gray-300 text-sm text-center py-20">Cargando...</p>
  if (!paciente) return (
    <div className="text-center py-20">
      <p className="text-gray-400 text-sm mb-4">Paciente no encontrado</p>
      <button onClick={() => navigate('/dashboard/pacientes')} className="text-[#b00000] text-sm hover:underline">← Volver</button>
    </div>
  )

  const edad = calcEdad(paciente.fechaNacimiento)

  return (
    <div>
      {/* Volver */}
      <button
        onClick={() => navigate('/dashboard/pacientes')}
        className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1 transition"
      >
        ← Volver a pacientes
      </button>

      {/* Ficha */}
      <div className="bg-white rounded-2xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-[#b00000] font-bold text-xl flex-shrink-0">
              {paciente.nombre?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-bold text-gray-800">{paciente.nombre}</h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={abrirEdit}
              className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => setConfirmArchivar(true)}
              className="text-sm border border-gray-200 text-gray-400 px-3 py-1.5 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
            >
              Archivar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoItem label="DNI" value={paciente.dni || '—'} />
          {edad && <InfoItem label="Edad" value={edad} />}
          <InfoItem label="Obra social" value={paciente.obraSocial || '—'} />
          <InfoItem label="Teléfono" value={paciente.telefono || '—'} />
        </div>
        {paciente.email && <p className="text-xs text-gray-400 mt-3">✉️ {paciente.email}</p>}
      </div>

      {/* Historia clínica */}
      <div className="bg-white rounded-2xl p-5">
        <h2 className="font-bold text-gray-800 mb-4">Historia Clínica</h2>

        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wide">Nueva nota de evolución</label>
          <textarea
            value={nuevaNota}
            onChange={e => setNuevaNota(e.target.value)}
            placeholder="Motivo de consulta, diagnóstico, indicaciones..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 resize-none bg-white"
          />
          <button
            onClick={handleAddNota}
            disabled={saving || !nuevaNota.trim()}
            className="mt-3 bg-[#b00000] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#900000] transition disabled:opacity-40"
          >
            {saving ? 'Guardando...' : '+ Agregar nota'}
          </button>
        </div>

        {notas.length === 0 ? (
          <p className="text-gray-300 text-sm text-center py-8">Aún no hay notas en la historia clínica</p>
        ) : (
          <div className="flex flex-col gap-4">
            {notas.map(n => (
              <div key={n.id} className="border-l-4 border-red-100 pl-4 py-1">
                <p className="text-xs text-gray-400 mb-1.5">{formatFecha(n.creadoEn)}</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{n.contenido}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal editar */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-800 text-lg mb-5">Editar paciente</h2>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">

              <Campo label="Nombre completo *" error={editErrores.nombre}>
                <input type="text" value={editForm.nombre}
                  onChange={e => editCampo('nombre', e.target.value)}
                  className={inputClass(editErrores.nombre)} placeholder="Ej: María García" />
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo label="DNI" error={editErrores.dni}>
                  <input type="text" inputMode="numeric" value={editForm.dni}
                    onChange={e => editCampo('dni', soloNumeros(e.target.value))}
                    className={inputClass(editErrores.dni)} placeholder="12345678" maxLength={8} />
                </Campo>
                <Campo label="Fecha de nacimiento" error={editErrores.fechaNacimiento}>
                  <input type="date" value={editForm.fechaNacimiento}
                    onChange={e => editCampo('fechaNacimiento', e.target.value)}
                    className={inputClass(editErrores.fechaNacimiento)}
                    max={new Date().toISOString().split('T')[0]} />
                </Campo>
              </div>

              <Campo label="Obra social">
                <select value={editForm.obraSocial} onChange={e => editCampo('obraSocial', e.target.value)} className="input">
                  {OBRAS_SOCIALES.map(o => <option key={o}>{o}</option>)}
                </select>
              </Campo>

              <Campo label="Teléfono" error={editErrores.telefono}>
                <input type="text" inputMode="numeric" value={editForm.telefono}
                  onChange={e => editCampo('telefono', soloNumeros(e.target.value))}
                  className={inputClass(editErrores.telefono)} placeholder="1169693066" maxLength={15} />
              </Campo>

              <Campo label="Email" error={editErrores.email}>
                <input type="email" value={editForm.email}
                  onChange={e => editCampo('email', e.target.value)}
                  className={inputClass(editErrores.email)} placeholder="paciente@email.com" />
              </Campo>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 bg-[#b00000] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#900000] transition disabled:opacity-50">
                  {editSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmación archivar */}
      {confirmArchivar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <p className="text-4xl mb-3">📁</p>
            <h3 className="font-bold text-gray-800 mb-2">¿Archivar paciente?</h3>
            <p className="text-sm text-gray-400 mb-6">
              El expediente de <strong>{paciente.nombre}</strong> quedará archivado y no aparecerá en la lista activa. Podés reactivarlo después.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmArchivar(false)}
                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleArchivar} disabled={archivando}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
                {archivando ? 'Archivando...' : 'Sí, archivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
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
