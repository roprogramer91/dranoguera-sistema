# Registro de pacientes mediante enlace temporal

## Objetivo

Permitir que un paciente complete sus propios datos desde un enlace enviado por WhatsApp, reduciendo la carga administrativa de la Dra. Adriana y mejorando la calidad de los datos utilizados en la atención y en los informes estadísticos.

La doctora debe conservar dos posibilidades:

- Enviar un enlace temporal para que el paciente se registre.
- Dar de alta al paciente manualmente desde la aplicación cuando la persona no pueda completar el formulario.

## Contexto actual del sistema

- El repositorio principal de la API y la app móvil es [roprogramer91/MiConsultorio](https://github.com/roprogramer91/MiConsultorio).
- `backend/` contiene la API productiva: Node.js, Express 5, PostgreSQL y Prisma 5, desplegada actualmente en Railway.
- `mobile/` contiene la app actual de Adriana: Expo 54, React Native y Expo Router.
- `frontend/` dentro de ese repositorio es un prototipo anterior en HTML, CSS y JavaScript que apunta a `localhost:3000`; no es el dashboard web actual y no se utilizará para esta función.
- Este repositorio (`dranoguera-sistema`) contiene el dashboard web nuevo, desarrollado con React 19, Vite y React Router.
- El dashboard web está protegido visualmente con Firebase Authentication y utiliza el mismo backend de Railway.
- La API ya permite listar, crear, actualizar y archivar/eliminar pacientes, y gestionar turnos.
- El formulario manual actual contempla nombre, DNI, fecha de nacimiento, obra social, teléfono y correo, pero solamente el nombre es obligatorio.
- La pantalla de agenda ya posee un formulario para crear turnos seleccionando un paciente.
- La app móvil ya admite abrir la pantalla de nuevo turno con `patientId`, por lo que ese mecanismo puede reutilizarse después de revisar un registro.
- El modelo `Patient` actual guarda `name`, `dni`, `phone`, `email`, `birthDate`, `notes`, `obraSocial`, `active` y `createdAt`. Todavía no posee plan, número de afiliado, origen ni estado de revisión.
- El middleware de Firebase Admin existe en el backend, pero actualmente solo protege notas clínicas y estadísticas.
- Las rutas de pacientes y turnos están expuestas sin autenticación. Esto incluye lectura, creación, edición y eliminación, por lo que asegurar las rutas administrativas es un prerrequisito de esta funcionalidad.
- La app móvil usa biometría como bloqueo local, pero no implementa Firebase Authentication ni envía tokens Bearer al backend. La estrategia de autenticación debe coordinarse entre backend, móvil y web antes de cerrar las rutas administrativas.

## Decisiones funcionales acordadas

- El enlace será generado por Adriana sin tener que ingresar previamente el teléfono ni otro dato del paciente.
- Tendrá una vigencia de **30 minutos desde su generación**.
- Será aleatorio, difícil de adivinar y válido para **un solo registro exitoso**.
- Al vencer, ser utilizado o ser revocado, no permitirá acceder al formulario.
- El paciente ingresará su propio teléfono en el formulario.
- Completar el formulario no confirmará el turno. Adriana deberá revisar el registro y crear el turno.
- Los pacientes ingresados desde el enlace quedarán inicialmente como **pendientes de revisión**.
- La fecha de nacimiento será el dato principal para calcular la edad. La edad no se guardará como un valor fijo porque cambia con el tiempo.
- Para estadísticas históricas, la edad deberá calcularse respecto de la fecha de la consulta o estudio.
- Se conservará el alta manual existente para casos excepcionales.

## Estrategia de ramas y ambientes

La API y la app móvil están siendo utilizadas actualmente por Adriana. Por lo tanto, esta función no debe desarrollarse ni probarse directamente sobre producción.

Estado verificado el 13 de julio de 2026:

- `roprogramer91/MiConsultorio` tiene solamente la rama remota `main`; no existe todavía `dev`.
- `dranoguera-sistema` también tiene solamente `main` local y remota.
- En `MiConsultorio`, `main` contiene el backend productivo y la app móvil que utiliza Adriana.
- El proyecto Railway `BK-MiConsultorio-adri2026`, ambiente `production`, contiene el dashboard `dranoguera-sistema` y la API `MiConsultorioAdri`.
- El proyecto Railway `DB-miConsultorio-Adri2026`, ambiente `production`, contiene el PostgreSQL productivo con las tablas Prisma, `Patient`, `Appointment` y `ClinicalNote`.
- No existe actualmente un ambiente persistente de desarrollo en ninguno de esos proyectos Railway.
- Adriana utiliza una APK ya compilada. Esa APK apunta a la URL productiva definida al compilarla y no cambia por crear una rama o un ambiente nuevo.
- Adriana todavía no utiliza el dashboard web, pero su servicio productivo debe mantenerse estable igualmente.

Política acordada para esta funcionalidad:

1. Mantener `main` como rama estable de producción.
2. Crear una rama `dev` desde el `main` actual en ambos repositorios.
3. Crear la rama de trabajo `feature/registro-pacientes-link` desde `dev`.
4. Integrar la funcionalidad primero en `dev` mediante PR y probarla allí.
5. Fusionar `dev` a `main` solamente después de completar migraciones, pruebas integrales y validación de Adriana.
6. No cambiar el `API_URL` de la app instalada actualmente hasta el despliegue productivo aprobado.

La rama por sí sola no aísla los datos. Para probar el backend con seguridad también se necesita:

- Un servicio de staging en Railway vinculado a `dev` o un entorno local equivalente.
- Una base PostgreSQL separada de producción, con datos ficticios o anonimizados.
- Variables de entorno de staging separadas.
- Una compilación de desarrollo de la app móvil que apunte a la API de staging.
- `VITE_API_URL` en el dashboard web para elegir API de desarrollo o producción sin editar código.
- Preferentemente un proyecto Firebase de staging; si se reutiliza el proyecto actual para autenticación, limitar estrictamente usuarios, credenciales y permisos.

No se deben ejecutar migraciones experimentales, pruebas de duplicados, borrados ni registros públicos contra la base productiva.

### Topología Railway recomendada para desarrollo

No es necesario modificar ni mover los servicios productivos existentes.

En `BK-MiConsultorio-adri2026`:

1. Crear un ambiente persistente llamado `development` duplicando la configuración de `production`.
2. Railway puede iniciar builds automáticamente al duplicar el ambiente. Si ocurre, retirarlos antes de que el backend quede activo y cambiar la fuente de ambos servicios a sus ramas `dev`.
3. Agregar un PostgreSQL nuevo únicamente dentro de `development`.
4. Configurar el backend de desarrollo para usar el `DATABASE_URL` privado de ese PostgreSQL nuevo.
5. Generar un dominio Railway diferente para la API de desarrollo.
6. Configurar el dashboard de desarrollo para consumir esa API mediante `VITE_API_URL`.
7. Usar solamente el dominio Railway temporal/de desarrollo; no asociar `panel.dranoguera.com` a este ambiente.

Esta distribución mantiene backend y base de desarrollo dentro del mismo proyecto y ambiente, permitiendo red privada y referencias de variables. Railway no ofrece red privada entre proyectos o entre ambientes diferentes.

El proyecto `DB-miConsultorio-Adri2026` puede permanecer exclusivamente productivo. Crear allí otro ambiente con PostgreSQL también aislaría los datos, pero el backend del otro proyecto tendría que conectarse mediante una dirección pública. Por seguridad y simplicidad, se prefiere colocar el Postgres de desarrollo dentro del ambiente `development` de `BK-MiConsultorio-adri2026`.

Al duplicar un ambiente, Railway copia servicios, variables y configuración. En la creación real de este ambiente inició builds automáticamente desde `main`; ambos fueron retirados antes de continuar. Antes de volver a desplegar es obligatorio comprobar que ningún `DATABASE_URL`, dominio, variable del frontend o disparador de GitHub continúe apuntando a producción.

### Tratamiento de la app móvil instalada

- La APK productiva seguirá consumiendo `https://miconsultorio-production.up.railway.app` mientras no se publique otra compilación ni se cambie la API productiva.
- Para probar se generará una APK de desarrollo que apunte a la API de `development`.
- Conviene darle otro nombre visible y otro identificador de aplicación, por ejemplo `MiConsultorio Dev`, para que pueda coexistir con la APK productiva.
- No se protegerán las rutas productivas de pacientes y turnos hasta que exista y se haya probado una versión móvil compatible con la autenticación nueva.
- La transición productiva de autenticación debe ser escalonada: publicar compatibilidad, instalar/probar la nueva APK y recién después exigir autenticación en todos los endpoints administrativos.

## Flujo completo

1. El paciente contacta a Adriana por WhatsApp y consulta disponibilidad.
2. Adriana conversa con el paciente sobre una fecha tentativa.
3. Desde la aplicación, Adriana pulsa **Generar enlace de registro**.
4. El backend crea una invitación de un solo uso que vence en 30 minutos.
5. Adriana copia el enlace y lo envía por WhatsApp.
6. El paciente abre el enlace.
7. El sistema valida en el backend que la invitación exista, esté pendiente y no haya vencido.
8. El paciente completa el paso de datos personales y selecciona si se atiende como particular o por obra social.
9. Si selecciona obra social, completa un segundo paso con los datos de cobertura. Si selecciona particular, ese paso se omite.
10. Al enviar, el backend vuelve a validar la invitación y todos los campos.
11. En una operación atómica, el backend registra al paciente o genera una revisión por posible duplicado y consume la invitación.
12. El paciente ve una confirmación aclarando que Adriana aún debe confirmar el turno.
13. La aplicación de Adriana muestra una notificación y suma el registro a la bandeja de pendientes.
14. Adriana revisa y, si hace falta, corrige la información.
15. Adriana pulsa **Crear turno**.
16. Se abre la pantalla existente de nuevo turno con el paciente ya seleccionado.
17. Al guardar el turno, el registro queda revisado y Adriana confirma el horario por WhatsApp.

## Experiencia del paciente

### Estados previos al formulario

La ruta pública propuesta es `/registro/:token`. Antes de mostrar datos debe consultar el estado de la invitación.

- Invitación válida: mostrar formulario.
- Invitación vencida: indicar que pasaron los 30 minutos y que debe contactar a la doctora.
- Invitación utilizada: indicar que el enlace ya no está disponible.
- Invitación revocada o inexistente: utilizar el mismo mensaje genérico para no revelar información interna.

Mensaje sugerido:

> Este enlace ya no está disponible. Comunicate con la Dra. Adriana para solicitar uno nuevo.

### Paso 1: datos personales

Campos previstos:

- Nombre.
- Apellido.
- DNI.
- Fecha de nacimiento.
- Teléfono.
- Correo electrónico, opcional salvo que se decida lo contrario.
- Tipo de atención: `Particular` u `Obra social`.

Los campos clínicamente o administrativamente indispensables deberán ser obligatorios. Antes de implementar se debe confirmar si el DNI puede omitirse en alguna situación y qué hacer cuando el paciente no conoce su fecha de nacimiento exacta.

### Paso 2: cobertura

Este paso se muestra únicamente cuando el paciente selecciona `Obra social`.

- Obra social.
- Plan, opcional.
- Número de afiliado.

La carga de una fotografía de la credencial queda fuera de la primera versión.

### Comportamiento visual

- Diseño mobile-first, simple y con campos compactos.
- Transición lateral entre pasos.
- Indicador de progreso cuando existan dos pasos.
- Botón para volver sin perder lo ingresado.
- Validación inmediata y foco automático en el primer campo con error.
- Permitir desplazamiento como respaldo para pantallas pequeñas y para cuando se abre el teclado; no depender de que todos los dispositivos puedan mostrar el formulario completo sin scroll.
- Prevenir envíos repetidos mientras la solicitud está en curso.

### Confirmación

Mostrar una tarjeta con pocos datos y sin exponer el DNI completo.

Mensaje sugerido:

> Tus datos se registraron correctamente. La Dra. Adriana revisará la información y confirmará tu turno por WhatsApp.

## Experiencia de Adriana

### Generador de enlaces

Agregar una acción visible en Pacientes y, si resulta conveniente, también en Inicio:

- **Generar enlace de registro**.
- Copiar enlace con un toque.
- Mostrar hora de vencimiento.
- Mostrar estados `Pendiente`, `Utilizado`, `Vencido` y `Revocado`.
- Permitir revocar un enlace pendiente.
- Permitir generar uno nuevo cuando sea necesario.

No se solicitará el teléfono ni otro dato antes de generar el enlace.

### Registros pendientes

Incorporar una bandeja o filtro con contador persistente, ya que una notificación del dispositivo puede perderse o estar desactivada.

Acciones previstas:

- Revisar datos.
- Editar datos.
- Aprobar registro.
- Resolver un posible duplicado.
- Crear turno con el paciente precargado.

La navegación hacia Agenda puede realizarse mediante estado de navegación o parámetros de URL, por ejemplo `/dashboard/agenda?nuevo=1&patientId=123`. Agenda debe validar que el paciente exista y abrir el formulario con ese paciente seleccionado.

## Modelo de datos propuesto

Los nombres finales deben adaptarse al modelo real del backend.

### Invitación de registro

```text
RegistrationInvite
- id
- tokenHash
- status: pending | used | expired | revoked
- createdAt
- expiresAt
- usedAt
- createdBy
- patientId, nullable
```

El token original se entrega solamente en la URL. En la base de datos es preferible guardar su hash para reducir el impacto de una lectura accidental de la tabla.

### Paciente

Campos nuevos o a confirmar además de los existentes:

```text
- name / firstName + lastName
- dni
- birthDate
- phone
- email
- coverageType: private | insurance
- obraSocial
- insurancePlan
- memberNumber
- reviewStatus: pending | reviewed | duplicate_review
- registrationSource: doctor | self_service
- reviewedAt
- reviewedBy
```

Se debe decidir si el backend mantiene `name` como un único campo por compatibilidad o migra a nombre y apellido separados.

## API propuesta

Endpoints orientativos:

```text
POST   /registration-invites              autenticado; genera invitación
GET    /registration-invites              autenticado; lista invitaciones
PATCH  /registration-invites/:id/revoke   autenticado; revoca invitación
GET    /public/registration/:token         público; devuelve estado/formulario
POST   /public/registration/:token         público; registra al paciente
GET    /patients?reviewStatus=pending      autenticado; lista pendientes
PATCH  /patients/:id/review                autenticado; aprueba o resuelve revisión
```

El endpoint público nunca debe aceptar estados internos, identificadores de autor ni campos administrativos definidos por el cliente.

## Reglas de seguridad y consistencia

- Generar tokens con un generador criptográficamente seguro y suficiente entropía.
- Validar vencimiento y uso exclusivamente con la hora del servidor.
- No confiar en las validaciones del navegador.
- Consumir la invitación y crear el registro dentro de una transacción.
- Asegurar que dos envíos simultáneos no creen dos pacientes.
- Normalizar DNI, teléfono, correo y espacios antes de comparar o guardar.
- Detectar duplicados principalmente por DNI y usar teléfono/correo como señales secundarias.
- No revelar al formulario público datos de un paciente existente.
- Aplicar rate limiting al endpoint público y evaluar CAPTCHA solamente si aparece abuso.
- Registrar auditoría de generación, revocación, uso y revisión.
- Revisar el texto de consentimiento y el tratamiento de datos personales antes de publicar.
- Proteger todos los endpoints administrativos con autenticación y rol de doctora.
- Incorporar autenticación verificable en la app móvil; la biometría local no identifica al cliente ante la API.
- Cambiar en el dashboard web las operaciones de pacientes y turnos para que también envíen el token Firebase, no solo notas y estadísticas.
- Restringir CORS a los orígenes necesarios al publicar el formulario y no depender de CORS como mecanismo de autenticación.

## Notificaciones

La primera versión debe garantizar un aviso dentro de la aplicación:

- Contador de registros pendientes.
- Aviso visual al entrar al dashboard.
- Acceso directo a la ficha pendiente.

La notificación push requiere definir e implementar el mecanismo del dispositivo, por ejemplo Firebase Cloud Messaging, registrar tokens de dispositivo y gestionar permisos. Puede desarrollarse después del aviso interno sin bloquear el flujo principal.

## Roadmap de implementación

### Fase 0: confirmar alcance y contratos

1. Crear `dev` desde `main` en ambos repositorios y una rama de funcionalidad desde `dev`.
2. Crear `development` en `BK-MiConsultorio-adri2026` sin aprobar todavía el despliegue.
3. Cambiar los disparadores GitHub de los servicios duplicados a `dev`.
4. Crear un PostgreSQL exclusivo dentro de ese ambiente y reemplazar `DATABASE_URL`.
5. Configurar dominios y variables de desarrollo, revisar el cambio completo y recién entonces desplegar.
6. Crear una APK de desarrollo separada que consuma la nueva API.
7. Revisar el repositorio y esquema del backend desplegado en Railway.
8. Documentar el modelo actual de pacientes y sus restricciones.
9. Definir la autenticación administrativa compartida por app móvil, dashboard web y API.
10. Definir campos obligatorios y opcionales.
11. Decidir compatibilidad entre `name` y nombre/apellido separados.
12. Definir cómo se resolverán pacientes duplicados.
13. Acordar el texto de consentimiento y confirmación.

### Fase 1: backend y base de datos

1. Implementar autenticación verificable para la app móvil.
2. Proteger las rutas administrativas de pacientes y turnos sin romper móvil ni web.
3. Crear la entidad y migración de invitaciones.
4. Añadir campos de cobertura, origen y revisión al paciente.
5. Implementar generación autenticada de enlaces.
6. Implementar consulta pública segura del estado del token.
7. Implementar registro público transaccional.
8. Implementar vencimiento lógico a los 30 minutos y revocación.
9. Implementar detección de duplicados.
10. Implementar listado y revisión de pendientes.
11. Añadir rate limiting, auditoría y pruebas automatizadas.

### Fase 2: formulario público

1. Agregar la ruta pública sin `ProtectedRoute`.
2. Crear las pantallas de enlace inválido, vencido, usado y error recuperable.
3. Construir el primer paso de datos personales.
4. Construir el paso condicional de cobertura.
5. Añadir transición, navegación, validaciones y accesibilidad.
6. Integrar los endpoints públicos.
7. Crear la tarjeta final de confirmación.
8. Verificar comportamiento en teléfonos pequeños y con teclado visible.

### Fase 3: generador y revisión en la aplicación

1. Agregar funciones de invitaciones a `src/services/api.js`.
2. Incorporar el botón Generar enlace de registro.
3. Mostrar el enlace, vencimiento, copia y revocación.
4. Crear el contador y la bandeja de registros pendientes.
5. Crear la vista de revisión y edición.
6. Implementar la resolución de duplicados.
7. Conectar Crear turno con Agenda y precargar el paciente.
8. Mantener y adaptar el formulario manual existente.

### Fase 4: notificaciones

1. Implementar avisos internos y actualización del contador.
2. Evaluar actualización por polling, eventos en tiempo real o al recuperar foco.
3. Configurar notificaciones push si se incluyen en esta entrega.
4. Gestionar permiso, token del dispositivo y apertura de la ficha desde la notificación.

### Fase 5: pruebas y publicación

1. Probar enlace válido, vencido, usado, revocado e inexistente.
2. Probar particular y obra social.
3. Probar campos inválidos, doble clic y solicitudes concurrentes.
4. Probar duplicados por DNI y coincidencias secundarias.
5. Probar revisión y creación de turno con paciente precargado.
6. Probar alta manual para asegurar que no haya regresiones.
7. Probar diseño en varios tamaños de pantalla y accesibilidad con teclado.
8. Configurar variables, migraciones y despliegue de backend/frontend.
9. Realizar una prueba completa con Adriana antes de habilitarlo a pacientes.

## Criterios mínimos de aceptación

- Adriana genera y copia un enlace sin ingresar datos del paciente.
- El enlace vence a los 30 minutos según la hora del servidor.
- El enlace se utiliza una sola vez.
- Un enlace inválido no permite enviar ni consultar datos.
- Un paciente particular completa un solo paso de datos.
- Un paciente con obra social completa ambos pasos.
- Los datos obligatorios son validados en frontend y backend.
- No se crean duplicados silenciosamente ni por envíos simultáneos.
- El paciente ve que el registro fue recibido, pero no que el turno está confirmado.
- Adriana ve el registro pendiente aunque no reciba una notificación push.
- El botón Crear turno abre el flujo existente con el paciente seleccionado.
- El alta manual continúa funcionando.

## Fuera de alcance inicial

- Reserva automática del horario.
- Confirmación automática por WhatsApp.
- Edición de fichas existentes mediante enlaces públicos.
- Fotografía de credencial.
- Campañas de cumpleaños o marketing.
- Portal permanente para pacientes.
