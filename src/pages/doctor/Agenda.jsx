import { useState, useEffect } from 'react'
import { getPacientes, getTurnosByRango, createTurno, updateTurnoEstado, mapPaciente, mapTurno } from '../../services/api'

const DURACIONES = [15, 30, 45, 60, 90]
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DIAS_CORTO = ['Lun','Mar','Mié','Jue','Vie','Sáb']

const FORM_INICIAL = {
  pacienteId: '', pacienteNombre: '', fecha: '',
  hora: '09:00', duracion: 30, motivo: '', notas: '',
}

const getLunes = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

const toStr = (date) => date.toISOString().split('T')[0]

export default function Agenda() {
  const [lunes, setLunes] = useState(getLunes())
  const [turnos, setTurnos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [saving, setSaving] = useState(false)
  const [turnoActivo, setTurnoActivo] = useState(null)

  const hoyStr = toStr(new Date())
  const dias = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() + i)
    return d
  })
  const sabadoStr = toStr(dias[5])
  const lunesStr = toStr(lunes)

  const fetchTurnos = async () => {
    setLoading(true)
    try {
      const data = await getTurnosByRango(lunesStr, sabadoStr)
      const mapped = data
        .map(mapTurno)
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
      setTurnos(mapped)
    } catch {
      setTurnos([])
    }
    setLoading(false)
  }

  useEffect(() => {
    getPacientes()
      .then(data => setPacientes(data.map(mapPaciente)))
      .catch(() => setPacientes([]))
  }, [])

  useEffect(() => { fetchTurnos() }, [lunes])

  const campo = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const abrirNuevoTurno = (fecha = hoyStr) => {
    setForm({ ...FORM_INICIAL, fecha })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.pacienteId || !form.fecha || !form.hora) return
    setSaving(true)
    try {
      await createTurno({
        patientId: Number(form.pacienteId),
        date: form.fecha,
        time: form.hora,
        duration: Number(form.duracion),
        reason: form.motivo || null,
        notes: form.notas || null,
        status: 'pendiente',
      })
      setForm(FORM_INICIAL)
      setShowForm(false)
      fetchTurnos()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRealizado = async () => {
    await updateTurnoEstado(turnoActivo.id, 'atendido')
    setTurnoActivo(null)
    fetchTurnos()
  }

  const handleCancelar = async () => {
    await updateTurnoEstado(turnoActivo.id, 'cancelado')
    setTurnoActivo(null)
    fetchTurnos()
  }

  const turnosDe = (fechaStr) =>
    turnos.filter(t => t.fecha === fechaStr && t.estado !== 'cancelado')

  const labelSemana = () => {
    const m1 = MESES[lunes.getMonth()]
    const m2 = MESES[dias[5].getMonth()]
    const a = lunes.getFullYear()
    return m1 === m2 ? `${m1} ${a}` : `${m1} – ${m2} ${a}`
  }

  const navSemana = (dir) => {
    const d = new Date(lunes)
    d.setDate(d.getDate() + dir * 7)
    setLunes(d)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-gray-400 text-sm capitalize">{labelSemana()}</p>
        </div>
        <button
          onClick={() => abrirNuevoTurno()}
          className="bg-[#b00000] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#900000] transition"
        >
          + Nuevo turno
        </button>
      </div>

      {/* Navegación semana */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navSemana(-1)} className="border border-gray-200 text-gray-500 px-3 py-1.5 rounded-xl text-sm hover:bg-gray-50 transition">
          ← Anterior
        </button>
        <button onClick={() => setLunes(getLunes())} className="border border-gray-200 text-gray-500 px-3 py-1.5 rounded-xl text-sm hover:bg-gray-50 transition">
          Hoy
        </button>
        <button onClick={() => navSemana(1)} className="border border-gray-200 text-gray-500 px-3 py-1.5 rounded-xl text-sm hover:bg-gray-50 transition">
          Siguiente →
        </button>
      </div>

      {/* Días */}
      {loading ? (
        <p className="text-gray-300 text-sm text-center py-16">Cargando...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {dias.map((dia, i) => {
            const fechaStr = toStr(dia)
            const esHoy = fechaStr === hoyStr
            const listaTurnos = turnosDe(fechaStr)

            return (
              <div key={fechaStr} className={`bg-white rounded-2xl overflow-hidden ${esHoy ? 'ring-2 ring-[#b00000]/20' : ''}`}>
                <div className={`px-5 py-3 flex items-center justify-between ${esHoy ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${esHoy ? 'text-[#b00000]' : 'text-gray-700'}`}>
                      {DIAS_CORTO[i]} {dia.getDate()} de {MESES[dia.getMonth()]}
                    </span>
                    {esHoy && <span className="text-xs bg-[#b00000] text-white px-2 py-0.5 rounded-full">Hoy</span>}
                    {listaTurnos.length > 0 && (
                      <span className="text-xs text-gray-400">{listaTurnos.length} turno{listaTurnos.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <button
                    onClick={() => abrirNuevoTurno(fechaStr)}
                    className="text-xs text-gray-400 hover:text-[#b00000] transition"
                  >
                    + turno
                  </button>
                </div>

                <div className="px-5 py-3">
                  {listaTurnos.length === 0 ? (
                    <p className="text-xs text-gray-300 py-1">Sin turnos</p>
                  ) : (
                    <div className="flex flex-col divide-y divide-gray-50">
                      {listaTurnos.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setTurnoActivo(t)}
                          className={`flex items-center gap-4 py-2.5 cursor-pointer hover:bg-gray-50 rounded-xl px-2 -mx-2 transition group ${t.estado === 'atendido' ? 'opacity-40' : ''}`}
                        >
                          <div className="w-14 flex-shrink-0 text-center">
                            <p className="text-sm font-bold text-[#b00000]">{t.hora}</p>
                            <p className="text-xs text-gray-300">{t.duracion}min</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{t.pacienteNombre}</p>
                            {t.motivo && <p className="text-xs text-gray-400 truncate">{t.motivo}</p>}
                          </div>
                          {t.estado === 'atendido' && (
                            <span className="text-xs text-green-500 flex-shrink-0">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nuevo turno */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-800 text-lg mb-5">Nuevo turno</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Paciente *</label>
                <select
                  value={form.pacienteId}
                  onChange={e => {
                    const p = pacientes.find(p => String(p.id) === e.target.value)
                    setForm(f => ({ ...f, pacienteId: e.target.value, pacienteNombre: p?.nombre || '' }))
                  }}
                  className="input"
                  required
                >
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha *</label>
                  <input type="date" value={form.fecha}
                    onChange={e => campo('fecha', e.target.value)}
                    className="input" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hora *</label>
                  <input type="time" value={form.hora}
                    onChange={e => campo('hora', e.target.value)}
                    className="input" required />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Duración</label>
                <select value={form.duracion} onChange={e => campo('duracion', e.target.value)} className="input">
                  {DURACIONES.map(d => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Motivo</label>
                <input type="text" value={form.motivo}
                  onChange={e => campo('motivo', e.target.value)}
                  className="input" placeholder="Ej: Control cardiológico, Holter, ECG..." />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Notas internas</label>
                <textarea value={form.notas}
                  onChange={e => campo('notas', e.target.value)}
                  className="input resize-none" rows={2}
                  placeholder="Observaciones adicionales..." />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#b00000] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#900000] transition disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ver/gestionar turno */}
      {turnoActivo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Turno</p>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{turnoActivo.pacienteNombre}</h3>
            <p className="text-sm text-gray-500 mb-1">
              {turnoActivo.fecha} · {turnoActivo.hora} hs · {turnoActivo.duracion} min
            </p>
            {turnoActivo.motivo && <p className="text-sm text-gray-600 mb-1">{turnoActivo.motivo}</p>}
            {turnoActivo.notas && <p className="text-xs text-gray-400 mb-4">{turnoActivo.notas}</p>}

            <div className="flex flex-col gap-2 mt-4">
              {turnoActivo.estado === 'pendiente' && (
                <>
                  <button onClick={handleRealizado}
                    className="w-full bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 transition">
                    ✓ Marcar como atendido
                  </button>
                  <button onClick={handleCancelar}
                    className="w-full border border-red-200 text-red-500 rounded-xl py-2.5 text-sm hover:bg-red-50 transition">
                    Cancelar turno
                  </button>
                </>
              )}
              <button onClick={() => setTurnoActivo(null)}
                className="w-full border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
