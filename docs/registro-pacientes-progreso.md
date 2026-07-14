# Progreso: registro de pacientes mediante enlace temporal

Este archivo es el punto de reanudación de la funcionalidad. Debe actualizarse al terminar cada bloque de trabajo y enlazar commits, PR o decisiones relevantes cuando existan.

Documento de contexto y roadmap: [registro-pacientes-roadmap.md](./registro-pacientes-roadmap.md)

## Estado general

**Etapa actual:** solicitudes pendientes separadas de pacientes activos, con revisión y aprobación desplegadas en Railway development.

**Última actualización:** 13 de julio de 2026.

**Próximo paso recomendado:** completar la gestión del historial de enlaces con estados, vencimiento visible y revocación desde el dashboard.

## Checklist

### Descubrimiento y decisiones

- [x] Verificar las ramas remotas existentes en ambos repositorios.
- [x] Confirmar que actualmente solo existe `main` y que `dev` todavía debe crearse.
- [x] Definir que `main` se mantiene estable y que la función se integra primero en `dev`.
- [x] Verificar la topología productiva actual mediante las capturas de Railway.
- [x] Confirmar que no existen ambientes de desarrollo en Railway.
- [x] Definir la topología de desarrollo recomendada para Railway y la APK.
- [x] Crear la rama `dev` desde el `main` actual en `MiConsultorio`.
- [x] Crear la rama `dev` desde el `main` actual en `dranoguera-sistema`.
- [x] Crear `feature/registro-pacientes-link` desde `dev` para implementar.
- [x] Crear `development` en `BK-MiConsultorio-adri2026` y retirar sus builds automáticos.
- [x] Vincular `MiConsultorioAdri/development` a la rama `dev`.
- [x] Vincular `dranoguera-sistema/development` a la rama `dev` después de parametrizar la API.
- [x] Crear un PostgreSQL nuevo dentro del ambiente `development`.
- [x] Reemplazar y verificar `DATABASE_URL` antes del primer despliegue.
- [x] Generar dominio Railway exclusivo para la API de desarrollo.
- [x] Generar dominio Railway exclusivo para el dashboard de desarrollo.
- [x] Parametrizar el dashboard para leer la API desde `VITE_API_URL` con fallback productivo.
- [x] Configurar el dashboard desplegado en desarrollo para utilizar la API de staging.
- [ ] Crear una APK `MiConsultorio Dev` que pueda coexistir con producción.
- [x] Definir el objetivo y el flujo general.
- [x] Definir vigencia del enlace en 30 minutos.
- [x] Definir que el enlace es de un solo uso.
- [x] Definir que Adriana genera el enlace sin cargar datos previos.
- [x] Definir formulario condicional para particular u obra social.
- [x] Definir registro pendiente de revisión.
- [x] Definir que el turno no se confirma automáticamente.
- [x] Definir acceso desde la revisión hacia el formulario existente de nuevo turno.
- [x] Documentar roadmap, riesgos y criterios de aceptación.
- [x] Localizar y revisar el código del backend de Railway.
- [x] Revisar el esquema real de pacientes y migraciones.
- [x] Identificar la app móvil y descartar el frontend web antiguo como objetivo de implementación.
- [x] Auditar el estado actual de autenticación de las rutas involucradas.
- [ ] Definir la autenticación administrativa para móvil, web y backend.
- [x] Definir para la primera versión DNI, fecha de nacimiento y teléfono obligatorios; correo y plan opcionales.
- [x] Mantener `name` por compatibilidad y recibir nombre/apellido separados en el formulario público.
- [x] Marcar coincidencias de DNI como `duplicate_review` sin revelar datos existentes al paciente.
- [ ] Aprobar textos de consentimiento y mensajes al paciente.

### Backend y base de datos

- [x] Aplicar las cinco migraciones Prisma existentes al PostgreSQL de `development`.
- [ ] Incorporar autenticación remota en la app móvil.
- [ ] Hacer que el dashboard web autentique las operaciones de pacientes y turnos.
- [ ] Proteger las rutas administrativas existentes en el backend.
- [x] Diseñar y crear la entidad de invitaciones.
- [x] Ampliar el modelo de paciente.
- [x] Implementar endpoint autenticado para generar enlaces.
- [x] Implementar listado y revocación de invitaciones.
- [x] Implementar validación pública del token.
- [x] Implementar alta pública transaccional.
- [x] Implementar vencimiento a los 30 minutos según hora del servidor.
- [x] Implementar consumo de un solo uso.
- [x] Implementar normalización y detección inicial de duplicados por DNI.
- [x] Implementar endpoints de registros pendientes y revisión.
- [ ] Incorporar rate limiting y auditoría.
- [ ] Agregar pruebas automatizadas del backend.

### Formulario público

- [x] Agregar la ruta `/registro/:token`.
- [x] Crear estados visuales de carga, vencido, usado, revocado e inválido.
- [x] Crear el paso de datos personales.
- [x] Crear selector Particular / Obra social.
- [x] Crear el paso condicional de cobertura.
- [x] Implementar validaciones y normalización en el cliente.
- [x] Implementar transición lateral y conservación de datos al volver.
- [x] Implementar prevención de doble envío.
- [x] Integrar el formulario con la API pública.
- [x] Crear la tarjeta de confirmación.
- [ ] Revisar experiencia móvil y accesibilidad.

### Aplicación de Adriana

- [x] Agregar métodos de invitaciones y revisión a `src/services/api.js`.
- [x] Agregar botón Generar enlace de registro.
- [ ] Crear interfaz para copiar, consultar y revocar enlaces.
- [x] Crear contador persistente de registros pendientes.
- [x] Crear listado o bandeja de pendientes.
- [x] Crear pantalla o modal de revisión.
- [x] Permitir editar, aprobar y rechazar solicitudes.
- [x] Resolver duplicados vinculando al paciente existente o confirmando la creación de uno nuevo.
- [x] Abrir Agenda desde Crear turno con el paciente precargado.
- [ ] Adaptar el alta manual a los nuevos campos sin eliminarla.

### Notificaciones

- [x] Implementar aviso interno de nuevos registros.
- [x] Actualizar el contador al recuperar foco, después de aprobar y cada 30 segundos.
- [ ] Decidir si las notificaciones push forman parte de la primera entrega.
- [ ] Configurar Firebase Cloud Messaging si se aprueban notificaciones push.
- [ ] Abrir la ficha correcta al tocar la notificación.

### Pruebas y entrega

- [ ] Probar todos los estados del enlace.
- [ ] Probar flujos Particular y Obra social.
- [ ] Probar validaciones y errores de red.
- [ ] Probar doble envío y concurrencia.
- [x] Probar detección y resolución de duplicados.
- [x] Probar revisión, aprobación y creación de turno con el paciente precargado.
- [ ] Probar que el alta manual siga funcionando.
- [ ] Ejecutar lint y build del frontend.
- [ ] Ejecutar pruebas y migraciones del backend.
- [ ] Realizar prueba integral con Adriana.
- [ ] Publicar y verificar en producción.

## Trabajo realizado en la sesión actual

- Se revisó la estructura del frontend.
- Se identificó que la aplicación usa React/Vite, Firebase Authentication y una API REST externa alojada en Railway.
- Se verificó que ya existen los flujos manuales de pacientes y turnos que deberán reutilizarse.
- Se documentó el diseño funcional, la propuesta técnica, el roadmap y los criterios de aceptación.
- Se localizó y revisó [roprogramer91/MiConsultorio](https://github.com/roprogramer91/MiConsultorio), commit inspeccionado `7c29aec` del 2 de julio de 2026.
- Se confirmó que `backend/` es la API Node/Express con PostgreSQL y Prisma desplegada en Railway.
- Se confirmó que `mobile/` es la app Expo/React Native en uso y que su pantalla de nuevo turno ya acepta un `patientId` precargado.
- Se determinó que `frontend/` en ese repositorio es un prototipo web anterior y que el dashboard web nuevo es este repositorio separado.
- Se auditó la autenticación: notas clínicas y estadísticas usan Firebase Admin, pero pacientes y turnos están sin protección; la app móvil solo posee bloqueo biométrico local.
- Se verificaron las ramas de GitHub: tanto `MiConsultorio` como `dranoguera-sistema` tienen únicamente `main`; la rama `dev` mencionada todavía no existe.
- Se definió una política de ramas y staging para evitar cualquier impacto sobre la app y la base que Adriana usa en producción.
- Las capturas confirmaron que dashboard y backend comparten `BK-MiConsultorio-adri2026/production`, mientras PostgreSQL está en `DB-miConsultorio-Adri2026/production`.
- Se definió mantener intacto el proyecto de base productiva y crear el Postgres de desarrollo junto al backend dentro de `BK-MiConsultorio-adri2026/development`.
- Se confirmó que la APK instalada seguirá usando producción; las pruebas móviles requerirán una APK de desarrollo independiente.
- Se crearon las ramas remotas `dev` desde el `main` vigente en `MiConsultorio` y `dranoguera-sistema`.
- El workspace local de `dranoguera-sistema` quedó en `dev`, siguiendo `origin/dev`, con la documentación aún sin commit.
- Se instaló Railway CLI 5.26.0 y se vinculó el workspace al proyecto correcto.
- Se creó `BK-MiConsultorio-adri2026/development` con ID `bb000012-b31a-4127-b03e-d4951ea7eacd`.
- Railway inició automáticamente builds duplicados desde `main`; se retiraron inmediatamente y ambos quedaron confirmados como `REMOVED`.
- Los dos servicios siguen configurados para `main`: el cambio de rama queda pendiente en Railway antes de crear o conectar la base de desarrollo.
- Se creó el servicio `Postgres` exclusivo de `development`, ID `632662a3-44bb-4864-9dca-80e61fa048e2`.
- El despliegue inicial del PostgreSQL finalizó en estado `SUCCESS`; luego se conectó al backend de desarrollo y recibió únicamente la estructura versionada.
- `MiConsultorioAdri/development` quedó conectado a `roprogramer91/MiConsultorio:dev` y desplegado correctamente.
- `DATABASE_URL` fue conectado al Postgres de desarrollo y verificado como referencia privada `${{Postgres.DATABASE_URL}}`.
- Se aplicaron correctamente las cinco migraciones Prisma existentes; quedaron creadas `_prisma_migrations`, `Patient`, `Appointment` y `ClinicalNote` sin copiar datos productivos.
- Para ejecutar las migraciones desde local se utilizó temporalmente el proxy público del mismo Postgres; al terminar se restauró y verificó la referencia privada.
- Se generó `https://miconsultorioadri-development.up.railway.app` para la API de desarrollo y se verificó que `/patients` responde con cero registros.
- El dashboard quedó parametrizado para usar `VITE_API_URL`, manteniendo la URL productiva únicamente como fallback compatible.
- `VITE_API_URL` quedó configurada en Railway development para apuntar a la API de staging.
- `npm run build` finalizó correctamente. `npm run lint` continúa fallando por problemas preexistentes en `AuthContext.jsx`, `Agenda.jsx` y `Pacientes.jsx`, ajenos a esta parametrización.
- GitHub CLI quedó autenticado como `roprogramer91`; los cambios se publicaron en `dev` mediante el commit `66cd10c`.
- `dranoguera-sistema/development` quedó conectado a `roprogramer91/dranoguera-sistema:dev`.
- Se generó `https://dranoguera-sistema-development.up.railway.app` para el dashboard de desarrollo.
- El despliegue del dashboard finalizó en `SUCCESS`, arrancó con `serve -s dist -l $PORT` y la URL pública respondió HTTP 200.
- Se crearon ramas `feature/registro-pacientes-link` desde `dev` en ambos repositorios.
- En `MiConsultorio` se implementaron invitaciones con token aleatorio, hash SHA-256, vencimiento de 30 minutos, revocación y consumo atómico de un solo uso.
- Se amplió `Patient` con cobertura, origen y estado de revisión; la migración `20260713153000_add_registration_invites` fue aplicada únicamente al PostgreSQL de development.
- El backend incorpora registro público validado, detección inicial de DNI duplicado, bandeja protegida de pendientes y rate limiting.
- El backend fue publicado en la rama de funcionalidad mediante el commit `55cc41a` y desplegado correctamente en Railway development.
- En el dashboard se agregó `/registro/:token`, formulario condicional mobile-first, estados del enlace, confirmación y generador de enlaces desde Pacientes.
- El build y el lint específico de los archivos modificados del dashboard finalizaron correctamente.
- El dashboard fue publicado mediante el commit `39ee30d` y desplegado correctamente en Railway development.
- Se verificó que la ruta pública desplegada responde HTTP 200, que un token inválido devuelve `unavailable` y que el generador administrativo sin token Firebase responde 401.
- La prueba automática con escritura ficticia no se ejecutó porque habría requerido cambiar temporalmente `DATABASE_URL` al proxy público; se preservó la conexión privada y la prueba queda para el flujo autenticado real.
- La prueba autenticada creó correctamente a Roger, consumió el enlace y permitió detectar que el primer modelo lo mostraba prematuramente como paciente activo.
- Se creó `RegistrationSubmission` para almacenar solicitudes sin incorporarlas a la lista de pacientes hasta que Adriana las apruebe.
- La migración privada convirtió el registro ficticio de Roger en solicitud pendiente y lo retiró de la lista activa sin perder sus datos.
- El dashboard incorpora contador, bandeja, revisión editable, aprobación y acceso a Agenda con el paciente precargado.
- Los commits correctivos `67fe306` (backend) y `fc8fbad` (dashboard) quedaron desplegados en development con estado `SUCCESS`.
- `backend/railway.json` ejecuta `prisma migrate deploy` antes de cada despliegue dentro de la red privada de Railway.
- Se completó satisfactoriamente la prueba integral de Roger: revisión, aprobación, alta activa y apertura de Agenda con el paciente precargado.
- La API confirmó que Roger quedó `active=true`, `reviewStatus=reviewed` y `registrationSource=self_service` después de la aprobación.
- Se implementó el rechazo de solicitudes sin crear pacientes activos.
- Las coincidencias de DNI muestran el paciente existente y permiten vincularlo, vincularlo y crear turno, o confirmar que se trata de otra persona.
- Los commits `e1f4214` (backend) y `79460ce` (dashboard) quedaron desplegados en development con estado `SUCCESS`.
- Se corrigió y validó la visualización inmediata de las acciones para DNI duplicado; los commits `bdf18bb` y `7bc8a98` quedaron desplegados correctamente.

## Bloqueos o dependencias actuales

- El backend vive en otro repositorio, por lo que la implementación requerirá cambios coordinados en ambos proyectos.
- Antes de proteger pacientes y turnos hay que incorporar una identidad verificable en la app móvil y adaptar el dashboard web para enviar tokens en esas operaciones.
- Las notificaciones push requieren configuración adicional y permiso del dispositivo; el contador interno debe funcionar aunque ese permiso sea rechazado.

## Notas para la próxima sesión

1. Abrir este archivo y el roadmap antes de implementar.
2. Confirmar que el trabajo está en una rama creada desde `dev`, nunca directamente en `main`.
3. Confirmar que API y base de datos son de staging antes de ejecutar pruebas o migraciones.
4. Comenzar por el backend y no por la pantalla pública.
5. Evitar escrituras públicas directas a Firestore desde el navegador.
6. Mantener la creación manual de pacientes como alternativa.
7. Actualizar los checks al completar cada punto, no solamente al finalizar una fase completa.
