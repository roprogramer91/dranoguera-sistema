import { auth } from '../firebase/config'

const DEFAULT_API_URL = 'https://miconsultorio-production.up.railway.app'
const BASE = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')
const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error del servidor')
  return data
}

async function authRequest(path, options = {}) {
  const token = await auth.currentUser?.getIdToken()
  return request(path, {
    ...options,
    headers: {
      ...JSON_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}

// ─── Pacientes ────────────────────────────────────────────────────────────────

export const getPacientes = (search = '') =>
  request(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`)

export const getPaciente = (id) => request(`/patients/${id}`)

export const createPaciente = (data) =>
  request('/patients', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data) })

export const updatePaciente = (id, data) =>
  request(`/patients/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(data) })

export const archivarPaciente = (id) =>
  request(`/patients/${id}/archive`, { method: 'PATCH' })

// ─── Turnos ───────────────────────────────────────────────────────────────────

export const getTurnosByRango = (from, to) =>
  request(`/appointments/calendar/range?from=${from}&to=${to}`)

export const createTurno = (data) =>
  request('/appointments', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data) })

export const updateTurnoEstado = (id, status) =>
  request(`/appointments/${id}/status`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ status }),
  })

// ─── Notas clínicas (requieren auth) ─────────────────────────────────────────

export const getNotas = (patientId) => authRequest(`/patients/${patientId}/notes`)

export const createNota = (patientId, content) =>
  authRequest(`/patients/${patientId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })

// ─── Stats (requieren auth) ───────────────────────────────────────────────────

export const getStats = () => authRequest('/stats')

// ─── Mappers API → shape del dashboard ───────────────────────────────────────

export function mapPaciente(p) {
  return {
    id: p.id,
    nombre: p.name,
    dni: p.dni || '',
    fechaNacimiento: p.birthDate ? p.birthDate.split('T')[0] : '',
    obraSocial: p.obraSocial || '',
    telefono: p.phone || '',
    email: p.email || '',
    activo: p.active,
    notas: p.notes || '',
  }
}

export function mapTurno(t) {
  return {
    id: t.id,
    pacienteId: t.patientId,
    pacienteNombre: t.patient?.name || '',
    fecha: t.date,
    hora: t.time,
    duracion: t.duration,
    motivo: t.reason || '',
    notas: t.notes || '',
    estado: t.status,
  }
}

export function mapNota(n) {
  return {
    id: n.id,
    contenido: n.content,
    creadoEn: n.createdAt,
  }
}

// ─── Mappers form → API ───────────────────────────────────────────────────────

export function pacienteFormToAPI(form) {
  return {
    name: form.nombre.trim(),
    dni: form.dni || null,
    birthDate: form.fechaNacimiento || null,
    obraSocial: form.obraSocial || null,
    phone: form.telefono || null,
    email: form.email || null,
  }
}
