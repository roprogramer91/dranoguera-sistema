import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPacientes,
  createPaciente,
  createRegistrationInvite,
  getRegistrationReviews,
  getRegistrationInvites,
  linkRegistrationToPatient,
  rejectRegistration,
  reviewRegistration,
  revokeRegistrationInvite,
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

const REVIEW_FORM_INICIAL = {
  firstName: '', lastName: '', dni: '', birthDate: '', phone: '', email: '',
  coverageType: 'private', obraSocial: '', insurancePlan: '', memberNumber: '',
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

function inviteStatus(invite, now) {
  if (invite.status === 'pending' && new Date(invite.expiresAt).getTime() <= now) return 'expired'
  return invite.status
}

function remainingTime(expiresAt, now) {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now)
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const INVITE_STATUS = {
  pending: { label: 'Pendiente', classes: 'bg-amber-50 text-amber-700' },
  used: { label: 'Utilizado', classes: 'bg-green-50 text-green-700' },
  expired: { label: 'Vencido', classes: 'bg-gray-100 text-gray-500' },
  revoked: { label: 'Revocado', classes: 'bg-red-50 text-red-600' },
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
  const [inviteHistory, setInviteHistory] = useState([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [inviteNow, setInviteNow] = useState(Date.now())
  const [pendingReviews, setPendingReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState(null)
  const [reviewForm, setReviewForm] = useState(REVIEW_FORM_INICIAL)
  const [reviewErrors, setReviewErrors] = useState({})
  const [reviewSaving, setReviewSaving] = useState(false)
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

  const fetchPendingReviews = async () => {
    try {
      const data = await getRegistrationReviews()
      setPendingReviews(data)
    } catch {
      setPendingReviews([])
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([getPacientes(), getRegistrationReviews()])
      .then(([patientsData, reviewsData]) => {
        if (!active) return
        setPacientes(patientsData.map(mapPaciente))
        setPendingReviews(reviewsData)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setPacientes([])
        setPendingReviews([])
        setLoading(false)
      })
    const refreshOnFocus = () => { fetchPendingReviews() }
    window.addEventListener('focus', refreshOnFocus)
    const refreshTimer = window.setInterval(refreshOnFocus, 30000)
    return () => {
      active = false
      window.removeEventListener('focus', refreshOnFocus)
      window.clearInterval(refreshTimer)
    }
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
    setInviteNow(Date.now())
    try {
      const data = await createRegistrationInvite()
      setInvite({
        ...data,
        registrationUrl: data.registrationUrl || `${window.location.origin}${data.registrationPath}`,
      })
      getRegistrationInvites().then(setInviteHistory).catch(() => {})
    } catch (error) {
      setInviteError(error.message)
    } finally {
      setGeneratingInvite(false)
    }
  }

  const cargarHistorial = () => {
    setLoadingInvites(true)
    return getRegistrationInvites()
      .then(setInviteHistory)
      .catch(error => setInviteError(error.message))
      .finally(() => setLoadingInvites(false))
  }

  const abrirGenerador = () => {
    setShowInvite(true)
    setInvite(null)
    setInviteError('')
    setCopied(false)
    setInviteNow(Date.now())
    cargarHistorial()
  }

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(invite.registrationUrl)
      setCopied(true)
    } catch {
      setInviteError('No se pudo copiar automáticamente. Mantené presionado el enlace para copiarlo.')
    }
  }

  const revocarEnlace = async (inviteId) => {
    if (!window.confirm('¿Revocar este enlace? El paciente ya no podrá utilizarlo.')) return
    try {
      const revoked = await revokeRegistrationInvite(inviteId)
      setInviteHistory(current => current.map(item => (
        item.id === inviteId ? { ...item, ...revoked } : item
      )))
      if (invite?.id === inviteId) setInvite(current => ({ ...current, ...revoked }))
    } catch (error) {
      setInviteError(error.message)
    }
  }

  useEffect(() => {
    if (!showInvite) return undefined
    const timer = window.setInterval(() => setInviteNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [showInvite])

  const abrirRevision = (submission) => {
    setSelectedReview(submission)
    setReviewErrors({})
    setReviewForm({
      firstName: submission.firstName || '',
      lastName: submission.lastName || '',
      dni: submission.dni || '',
      birthDate: submission.birthDate?.split('T')[0] || '',
      phone: submission.phone || '',
      email: submission.email || '',
      coverageType: submission.coverageType || 'private',
      obraSocial: submission.obraSocial || '',
      insurancePlan: submission.insurancePlan || '',
      memberNumber: submission.memberNumber || '',
    })
  }

  const reviewCampo = (key, value) => {
    setReviewForm(current => ({ ...current, [key]: value }))
    if (reviewErrors[key]) setReviewErrors(current => ({ ...current, [key]: undefined }))
  }

  const refrescarDespuesDeRevision = async () => {
    setSelectedReview(null)
    await Promise.all([fetchPacientes(), fetchPendingReviews()])
    window.dispatchEvent(new Event('registration-reviews-updated'))
  }

  const aprobarRegistro = async (crearTurno = false, allowDuplicate = false) => {
    setReviewSaving(true)
    setReviewErrors({})
    try {
      const patient = await reviewRegistration(selectedReview.id, {
        ...reviewForm,
        allowDuplicate,
      })
      await refrescarDespuesDeRevision()
      if (crearTurno) navigate(`/dashboard/agenda?nuevo=1&patientId=${patient.id}`)
    } catch (error) {
      if (error.data?.code === 'DUPLICATE_PATIENT' && error.data.duplicate) {
        setSelectedReview(current => ({
          ...current,
          status: 'duplicate_review',
          possibleDuplicatePatientId: error.data.duplicate.id,
          possibleDuplicate: error.data.duplicate,
        }))
        setReviewErrors({ submit: 'Elegí cómo resolver la coincidencia de DNI.' })
      } else {
        setReviewErrors(error.data?.errors || { submit: error.message })
      }
    } finally {
      setReviewSaving(false)
    }
  }

  const rechazarRegistro = async () => {
    if (!window.confirm('¿Descartar esta solicitud? No se creará ningún paciente.')) return
    setReviewSaving(true)
    setReviewErrors({})
    try {
      await rejectRegistration(selectedReview.id)
      await refrescarDespuesDeRevision()
    } catch (error) {
      setReviewErrors({ submit: error.message })
    } finally {
      setReviewSaving(false)
    }
  }

  const vincularExistente = async (crearTurno = false) => {
    const existing = selectedReview.possibleDuplicate
    if (!existing) return
    setReviewSaving(true)
    setReviewErrors({})
    try {
      const patient = await linkRegistrationToPatient(selectedReview.id, existing.id)
      await refrescarDespuesDeRevision()
      if (crearTurno) navigate(`/dashboard/agenda?nuevo=1&patientId=${patient.id}`)
    } catch (error) {
      setReviewErrors({ submit: error.message })
    } finally {
      setReviewSaving(false)
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

      {pendingReviews.length > 0 && (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm" aria-live="polite">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold">
                {pendingReviews.length}
              </span>
              <div>
                <h2 className="font-semibold text-amber-950">Pacientes pendientes de revisión</h2>
                <p className="text-sm text-amber-800/70">Revisá los datos antes de incorporarlos a la lista de pacientes.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {pendingReviews.map(submission => (
              <button
                key={submission.id}
                type="button"
                onClick={() => abrirRevision(submission)}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white px-4 py-3 text-left hover:border-amber-300 hover:shadow-sm transition"
              >
                <span className="min-w-0">
                  <strong className="block truncate text-sm text-gray-800">{submission.firstName} {submission.lastName}</strong>
                  <small className="text-gray-400">Recibido {new Date(submission.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</small>
                </span>
                <span className="text-xs font-semibold text-[#B00000]">Revisar →</span>
              </button>
            ))}
          </div>
        </section>
      )}

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

      {selectedReview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">Pendiente de revisión</p>
                <h2 className="font-bold text-gray-800 text-xl">Verificar datos del paciente</h2>
                <p className="text-sm text-gray-400 mt-1">Podés corregir la información antes de guardarla.</p>
              </div>
              <button type="button" onClick={() => setSelectedReview(null)} className="text-gray-400 hover:text-gray-700 text-xl" aria-label="Cerrar">×</button>
            </div>

            {selectedReview.status === 'duplicate_review' && (
              <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                <p className="font-semibold">Posible paciente duplicado</p>
                <p className="mt-1 text-orange-800/80">El DNI coincide con un paciente que ya está activo.</p>
                {selectedReview.possibleDuplicate && (
                  <div className="mt-3 rounded-lg bg-white/80 px-3 py-2">
                    <strong className="block">{selectedReview.possibleDuplicate.name}</strong>
                    <span className="text-xs text-gray-500">
                      DNI {selectedReview.possibleDuplicate.dni}
                      {selectedReview.possibleDuplicate.phone ? ` · Tel. ${selectedReview.possibleDuplicate.phone}` : ''}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Nombre *" error={reviewErrors.firstName}>
                <input value={reviewForm.firstName} onChange={e => reviewCampo('firstName', e.target.value)} className={inputClass(reviewErrors.firstName)} />
              </Campo>
              <Campo label="Apellido *" error={reviewErrors.lastName}>
                <input value={reviewForm.lastName} onChange={e => reviewCampo('lastName', e.target.value)} className={inputClass(reviewErrors.lastName)} />
              </Campo>
              <Campo label="DNI *" error={reviewErrors.dni}>
                <input inputMode="numeric" value={reviewForm.dni} onChange={e => reviewCampo('dni', soloNumeros(e.target.value))} className={inputClass(reviewErrors.dni)} />
              </Campo>
              <Campo label="Fecha de nacimiento *" error={reviewErrors.birthDate}>
                <input type="date" value={reviewForm.birthDate} onChange={e => reviewCampo('birthDate', e.target.value)} className={inputClass(reviewErrors.birthDate)} />
              </Campo>
              <Campo label="Teléfono *" error={reviewErrors.phone}>
                <input type="tel" value={reviewForm.phone} onChange={e => reviewCampo('phone', e.target.value)} className={inputClass(reviewErrors.phone)} />
              </Campo>
              <Campo label="Correo electrónico" error={reviewErrors.email}>
                <input type="email" value={reviewForm.email} onChange={e => reviewCampo('email', e.target.value)} className={inputClass(reviewErrors.email)} />
              </Campo>
              <Campo label="Tipo de atención" error={reviewErrors.coverageType}>
                <select value={reviewForm.coverageType} onChange={e => reviewCampo('coverageType', e.target.value)} className="input">
                  <option value="private">Particular</option>
                  <option value="insurance">Obra social</option>
                </select>
              </Campo>
              {reviewForm.coverageType === 'insurance' && (
                <>
                  <Campo label="Obra social *" error={reviewErrors.obraSocial}>
                    <input value={reviewForm.obraSocial} onChange={e => reviewCampo('obraSocial', e.target.value)} className={inputClass(reviewErrors.obraSocial)} />
                  </Campo>
                  <Campo label="Plan">
                    <input value={reviewForm.insurancePlan} onChange={e => reviewCampo('insurancePlan', e.target.value)} className="input" />
                  </Campo>
                  <Campo label="Número de afiliado *" error={reviewErrors.memberNumber}>
                    <input value={reviewForm.memberNumber} onChange={e => reviewCampo('memberNumber', e.target.value)} className={inputClass(reviewErrors.memberNumber)} />
                  </Campo>
                </>
              )}
            </div>

            {reviewErrors.submit && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{reviewErrors.submit}</p>}

            {selectedReview.status === 'duplicate_review' && selectedReview.possibleDuplicate ? (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Elegí cómo resolverlo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" disabled={reviewSaving} onClick={() => vincularExistente(false)} className="border border-green-200 bg-green-50 text-green-700 rounded-xl py-2.5 px-3 text-sm font-medium hover:bg-green-100 disabled:opacity-50">
                    Vincular al paciente existente
                  </button>
                  <button type="button" disabled={reviewSaving} onClick={() => vincularExistente(true)} className="bg-green-600 text-white rounded-xl py-2.5 px-3 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    Vincular y crear turno
                  </button>
                  <button type="button" disabled={reviewSaving} onClick={() => aprobarRegistro(false, true)} className="border border-orange-200 text-orange-700 rounded-xl py-2.5 px-3 text-sm font-medium hover:bg-orange-50 disabled:opacity-50">
                    Es otra persona: crear nueva
                  </button>
                  <button type="button" disabled={reviewSaving} onClick={rechazarRegistro} className="border border-gray-200 text-gray-500 rounded-xl py-2.5 px-3 text-sm hover:bg-gray-50 disabled:opacity-50">
                    Descartar solicitud
                  </button>
                </div>
                <button type="button" onClick={() => setSelectedReview(null)} className="w-full text-gray-400 rounded-xl py-2 text-sm hover:text-gray-600">Cerrar sin resolver</button>
              </div>
            ) : (
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
                <button type="button" disabled={reviewSaving} onClick={rechazarRegistro} className="sm:w-auto border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50">Descartar</button>
                <button type="button" disabled={reviewSaving} onClick={() => aprobarRegistro(false)} className="sm:flex-1 border border-red-200 text-[#B00000] rounded-xl py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                  {reviewSaving ? 'Guardando…' : 'Aprobar y guardar'}
                </button>
                <button type="button" disabled={reviewSaving} onClick={() => aprobarRegistro(true)} className="sm:flex-1 bg-[#B00000] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#900000] disabled:opacity-50">
                  {reviewSaving ? 'Guardando…' : 'Aprobar y crear turno'}
                </button>
              </div>
            )}
          </div>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B00000] mb-1">Registro del paciente</p>
                <h2 className="font-bold text-gray-800 text-lg">Enlaces temporales</h2>
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

            {inviteError && <p className="text-sm text-red-600 mb-4 rounded-xl bg-red-50 px-4 py-3" role="alert">{inviteError}</p>}

            {generatingInvite ? (
              <div className="py-8 text-center text-sm text-gray-400">Generando enlace seguro…</div>
            ) : invite ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 mb-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-gray-800">Enlace recién generado</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${INVITE_STATUS[inviteStatus(invite, inviteNow)]?.classes}`}>
                    {INVITE_STATUS[inviteStatus(invite, inviteNow)]?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">Copiá este enlace y envialo por WhatsApp. Por seguridad no volverá a mostrarse al cerrar.</p>
                <p className="text-sm text-gray-800 font-medium break-all select-all rounded-xl bg-white border border-red-100 p-3">{invite.registrationUrl}</p>
                <div className="flex items-center justify-between gap-3 my-3 text-xs">
                  <span className="text-amber-700">Tiempo restante: <strong>{remainingTime(invite.expiresAt, inviteNow)}</strong></span>
                  <span className="text-gray-400">Vence {new Date(invite.expiresAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="button" onClick={copiarEnlace} disabled={inviteStatus(invite, inviteNow) !== 'pending'} className="flex-1 bg-[#B00000] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#900000] disabled:opacity-40">
                    {copied ? 'Enlace copiado ✓' : 'Copiar enlace'}
                  </button>
                  {inviteStatus(invite, inviteNow) === 'pending' && (
                    <button type="button" onClick={() => revocarEnlace(invite.id)} className="border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm hover:bg-red-50">Revocar</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-6 text-center mb-5">
                <p className="text-sm font-medium text-gray-700">Generá un enlace válido por 30 minutos</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">No necesitás ingresar previamente ningún dato del paciente.</p>
                <button type="button" onClick={generarEnlace} className="bg-[#B00000] text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-[#900000]">Generar nuevo enlace</button>
              </div>
            )}

            {invite && !generatingInvite && (
              <button type="button" onClick={generarEnlace} className="w-full mb-5 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50">Generar otro enlace</button>
            )}

            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Historial reciente</h3>
                  <p className="text-xs text-gray-400">Los enlaces usados o cerrados no pueden copiarse nuevamente.</p>
                </div>
                <button type="button" onClick={cargarHistorial} className="text-xs text-[#B00000] hover:underline">Actualizar</button>
              </div>
              {loadingInvites ? (
                <p className="text-sm text-gray-300 text-center py-6">Cargando enlaces…</p>
              ) : inviteHistory.length === 0 ? (
                <p className="text-sm text-gray-300 text-center py-6">Todavía no hay enlaces generados.</p>
              ) : (
                <div className="space-y-2">
                  {inviteHistory.slice(0, 10).map(item => (
                    <InviteHistoryItem key={item.id} invite={item} now={inviteNow} onRevoke={revocarEnlace} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InviteHistoryItem({ invite, now, onRevoke }) {
  const status = inviteStatus(invite, now)
  const config = INVITE_STATUS[status] || INVITE_STATUS.expired
  const dateOptions = { dateStyle: 'short', timeStyle: 'short' }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-700">Enlace #{invite.id}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.classes}`}>
            {config.label}
          </span>
        </div>
        <p className="text-[11px] text-gray-400">
          Creado {new Date(invite.createdAt).toLocaleString('es-AR', dateOptions)}
        </p>
        {status === 'pending' && (
          <p className="text-[11px] text-amber-700 mt-0.5">
            Vence en {remainingTime(invite.expiresAt, now)}
          </p>
        )}
        {status === 'used' && invite.usedAt && (
          <p className="text-[11px] text-green-700 mt-0.5">
            Utilizado {new Date(invite.usedAt).toLocaleString('es-AR', dateOptions)}
          </p>
        )}
        {status === 'revoked' && invite.revokedAt && (
          <p className="text-[11px] text-red-600 mt-0.5">
            Revocado {new Date(invite.revokedAt).toLocaleString('es-AR', dateOptions)}
          </p>
        )}
      </div>
      {status === 'pending' && (
        <button
          type="button"
          onClick={() => onRevoke(invite.id)}
          className="flex-shrink-0 text-xs text-red-600 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50"
        >
          Revocar
        </button>
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
