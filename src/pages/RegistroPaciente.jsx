import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRegistrationStatus, submitRegistration } from '../services/api'
import './RegistroPaciente.css'

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  dni: '',
  birthDate: '',
  phone: '',
  email: '',
  coverageType: 'private',
  obraSocial: '',
  insurancePlan: '',
  memberNumber: '',
}

function validatePersonal(form) {
  const errors = {}
  if (!form.firstName.trim()) errors.firstName = 'Ingresá tu nombre'
  if (!form.lastName.trim()) errors.lastName = 'Ingresá tu apellido'
  if (!/^\d{7,9}$/.test(form.dni.replace(/\D/g, ''))) errors.dni = 'Ingresá un DNI válido'
  if (!form.birthDate || new Date(`${form.birthDate}T00:00:00`) > new Date()) {
    errors.birthDate = 'Ingresá una fecha válida'
  }
  if (form.phone.replace(/\D/g, '').length < 8) errors.phone = 'Ingresá un teléfono válido'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Ingresá un correo válido'
  }
  return errors
}

function validateCoverage(form) {
  const errors = {}
  if (!form.obraSocial.trim()) errors.obraSocial = 'Ingresá tu obra social'
  if (!form.memberNumber.trim()) errors.memberNumber = 'Ingresá tu número de afiliado'
  return errors
}

function Field({ id, label, error, optional, ...props }) {
  return (
    <label className="registration-field" htmlFor={id}>
      <span>
        {label} {optional && <small>Opcional</small>}
      </span>
      <input id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && <small id={`${id}-error`} className="field-error">{error}</small>}
    </label>
  )
}

function Unavailable({ status }) {
  const expired = status === 'expired'
  return (
    <main className="registration-shell">
      <section className="registration-card registration-message-card">
        <div className="message-icon" aria-hidden="true">!</div>
        <p className="eyebrow">Enlace no disponible</p>
        <h1>{expired ? 'El enlace venció' : 'Este enlace ya no está disponible'}</h1>
        <p>{expired ? 'Pasaron los 30 minutos de validez.' : 'Puede haber sido utilizado o reemplazado.'}</p>
        <p className="message-action">Comunicate con la Dra. Adriana para solicitar uno nuevo.</p>
      </section>
    </main>
  )
}

export default function RegistroPaciente() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')
  const [form, setForm] = useState(INITIAL_FORM)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const firstErrorRef = useRef(null)

  useEffect(() => {
    let active = true
    getRegistrationStatus(token)
      .then((data) => active && setStatus(data.status))
      .catch(() => active && setStatus('error'))
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (firstErrorRef.current) {
      document.getElementById(firstErrorRef.current)?.focus()
      firstErrorRef.current = null
    }
  }, [errors])

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const showErrors = (nextErrors) => {
    firstErrorRef.current = Object.keys(nextErrors)[0]
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goForward = () => {
    if (!showErrors(validatePersonal(form))) return
    if (form.coverageType === 'insurance') setStep(2)
    else sendForm()
  }

  const sendForm = async () => {
    const nextErrors = {
      ...validatePersonal(form),
      ...(form.coverageType === 'insurance' ? validateCoverage(form) : {}),
    }
    if (!showErrors(nextErrors)) {
      if (Object.keys(validatePersonal(form)).length > 0) setStep(1)
      return
    }

    setSubmitting(true)
    try {
      const data = await submitRegistration(token, form)
      setResult(data)
      setStatus('complete')
    } catch (error) {
      if (error.status === 410) {
        setStatus(error.data?.status || 'unavailable')
      } else if (error.data?.errors) {
        setErrors(error.data.errors)
        const personalFields = ['firstName', 'lastName', 'dni', 'birthDate', 'phone', 'email', 'coverageType']
        if (Object.keys(error.data.errors).some((key) => personalFields.includes(key))) setStep(1)
      } else {
        setErrors({ submit: error.message || 'No pudimos enviar tus datos. Intentá nuevamente.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return <main className="registration-shell"><div className="registration-loader" aria-label="Validando enlace" /></main>
  }
  if (status === 'error') {
    return (
      <main className="registration-shell">
        <section className="registration-card registration-message-card">
          <p className="eyebrow">No pudimos validar el enlace</p>
          <h1>Revisá tu conexión</h1>
          <button className="registration-button" type="button" onClick={() => window.location.reload()}>Intentar nuevamente</button>
        </section>
      </main>
    )
  }
  if (!['valid', 'complete'].includes(status)) return <Unavailable status={status} />
  if (status === 'complete') {
    return (
      <main className="registration-shell">
        <section className="registration-card registration-message-card success-card">
          <div className="success-icon" aria-hidden="true">✓</div>
          <p className="eyebrow">Registro recibido</p>
          <h1>Gracias, {result.registration.name.split(' ')[0]}</h1>
          <div className="patient-summary">
            <span>Paciente</span>
            <strong>{result.registration.name}</strong>
            <small>{result.registration.coverageType === 'insurance' ? 'Con obra social' : 'Atención particular'}</small>
          </div>
          <p>{result.message}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="registration-shell">
      <section className="registration-card">
        <header className="registration-header">
          <p className="eyebrow">Dra. Adriana Noguera</p>
          <h1>Completá tus datos</h1>
          <p>Esta información se utilizará para preparar tu ficha. El turno será confirmado por WhatsApp.</p>
          <div className="step-indicator" aria-label={`Paso ${step} de ${form.coverageType === 'insurance' ? 2 : 1}`}>
            <span className="active" />
            {form.coverageType === 'insurance' && <span className={step === 2 ? 'active' : ''} />}
          </div>
        </header>

        <div className="registration-viewport">
          <div className={`registration-slider step-${step}`}>
            <form className="registration-step" onSubmit={(event) => { event.preventDefault(); goForward() }} noValidate>
              <div className="registration-grid">
                <Field id="firstName" label="Nombre" value={form.firstName} onChange={update} error={errors.firstName} autoComplete="given-name" />
                <Field id="lastName" label="Apellido" value={form.lastName} onChange={update} error={errors.lastName} autoComplete="family-name" />
                <Field id="dni" label="DNI" value={form.dni} onChange={update} error={errors.dni} inputMode="numeric" autoComplete="off" />
                <Field id="birthDate" label="Fecha de nacimiento" value={form.birthDate} onChange={update} error={errors.birthDate} type="date" autoComplete="bday" />
                <Field id="phone" label="Teléfono" value={form.phone} onChange={update} error={errors.phone} type="tel" inputMode="tel" autoComplete="tel" />
                <Field id="email" label="Correo electrónico" optional value={form.email} onChange={update} error={errors.email} type="email" inputMode="email" autoComplete="email" />
              </div>

              <fieldset className="coverage-choice">
                <legend>¿Cómo vas a atenderte?</legend>
                <label className={form.coverageType === 'private' ? 'selected' : ''}>
                  <input type="radio" name="coverageType" value="private" checked={form.coverageType === 'private'} onChange={update} />
                  <span><strong>Particular</strong><small>Sin obra social</small></span>
                </label>
                <label className={form.coverageType === 'insurance' ? 'selected' : ''}>
                  <input type="radio" name="coverageType" value="insurance" checked={form.coverageType === 'insurance'} onChange={update} />
                  <span><strong>Obra social</strong><small>Completar cobertura</small></span>
                </label>
              </fieldset>

              {errors.submit && <p className="submit-error" role="alert">{errors.submit}</p>}
              <button className="registration-button" disabled={submitting}>
                {submitting ? 'Enviando…' : form.coverageType === 'insurance' ? 'Siguiente' : 'Enviar mis datos'}
              </button>
            </form>

            <form className="registration-step" onSubmit={(event) => { event.preventDefault(); sendForm() }} noValidate>
              <div className="coverage-heading">
                <button type="button" className="back-button" onClick={() => setStep(1)}>← Volver</button>
                <h2>Datos de cobertura</h2>
                <p>Ingresá los datos tal como aparecen en tu credencial.</p>
              </div>
              <div className="registration-grid coverage-grid">
                <Field id="obraSocial" label="Obra social" value={form.obraSocial} onChange={update} error={errors.obraSocial} autoComplete="organization" />
                <Field id="insurancePlan" label="Plan" optional value={form.insurancePlan} onChange={update} error={errors.insurancePlan} />
                <Field id="memberNumber" label="Número de afiliado" value={form.memberNumber} onChange={update} error={errors.memberNumber} />
              </div>
              {errors.submit && <p className="submit-error" role="alert">{errors.submit}</p>}
              <button className="registration-button" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar mis datos'}</button>
            </form>
          </div>
        </div>
        <footer className="registration-footer">Tus datos se envían de forma segura y el enlace deja de funcionar después del registro.</footer>
      </section>
    </main>
  )
}
