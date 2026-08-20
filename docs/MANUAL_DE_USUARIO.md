# Manual de usuario - Sistecredito Co-crea

Version: 1.0  
Prototipo: Sistecredito Co-crea  
Sitio: https://valenguti.github.io/sistecredito-co-cre/  
Repositorio: https://github.com/ValenGuti/sistecredito-co-cre

## 1. Objetivo

Este manual explica como utilizar el prototipo Sistecredito Co-crea desde los portales de participante y administrador. Cubre registro, perfilamiento, misiones, invitaciones, revision de aportes, puntos, comportamiento y laboratorio sintetico.

Co-crea demuestra una comunidad de testeo en la que clientes, aliados y empleados Sistecredito participan voluntariamente en entrevistas, pruebas de prototipos, validaciones de mensajes y otras iniciativas de investigacion.

## 2. Advertencias y alcance

- Todos los datos son ficticios o simulados.
- Participar no afecta productos, cupos ni condiciones con Sistecredito.
- No se solicitan documentos ni informacion financiera.
- Puntos, XP, beneficios, invitaciones y canjes son simulados.
- Las cuentas creadas se guardan solo en el navegador utilizado.
- No existe una base de datos productiva compartida.
- No use contrasenas personales o corporativas reales.
- Luegopago, Credinet, correo, WhatsApp, Firebase, TestFlight y Google Play no estan integrados realmente.
- El laboratorio sintetico no reemplaza pruebas con personas reales.

## 3. Abrir el prototipo

### Sitio publicado

1. Abra https://valenguti.github.io/sistecredito-co-cre/.
2. Espere la pantalla Sistecredito Co-crea.
3. Seleccione `Iniciar sesion` o `Registrarse`.

### Ejecucion local

Requiere Node.js 20 o superior. Desde la carpeta del proyecto ejecute:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## 4. Roles

### Administrador interno

Consulta el dashboard, busca participantes, gestiona misiones, selecciona personas, simula invitaciones, revisa aportes, entrega puntos, consulta comportamiento y usa el laboratorio sintetico. Este rol no se crea desde el registro publico.

### Cliente

Completa su perfil, consulta misiones para clientes, acepta consentimientos, ejecuta pruebas, envia feedback y consulta puntos, nivel, confiabilidad, beneficios e impacto.

### Aliado

Completa datos de su rol y tienda, consulta misiones operativas para aliados, participa en pruebas y consulta beneficios simulados.

### Empleado Sistecredito

Se registra como colaborador interno, completa su perfil y participa en entrevistas, pruebas de prototipo o revisiones internas disponibles.

## 5. Registrar una persona

1. Seleccione `Registrarse`.
2. Complete nombre, apellidos, celular y correo electronico.
3. Seleccione Cliente, Aliado o Empleado Sistecredito.
4. Pulse `Crear usuario`.
5. Guarde el usuario y la contrasena generados para la demo.
6. Pulse `Ir a iniciar sesion`.

La cuenta queda en el almacenamiento local del navegador. Puede perderse al borrar datos, cambiar de navegador o usar otro equipo.

## 6. Iniciar sesion y cambiar contrasena

1. Seleccione `Iniciar sesion`.
2. Escriba el usuario y la contrasena generados.
3. Pulse `Ingresar`.
4. Si los datos no coinciden, se muestra un error.
5. En el primer ingreso escriba una nueva contrasena dos veces.
6. Pulse `Guardar contrasena` o `Cambiar despues`.

## 7. Completar mi perfil

Una cuenta nueva muestra `Completar mi perfil`. Este paso incorpora a la persona a la comunidad de testeo.

Todos deben aceptar:

- Acepto participar de forma voluntaria.
- Acepto recibir invitaciones de pruebas y misiones.
- Entiendo que esto no afecta productos, cupos ni condiciones.

### Cliente

- Departamento.
- Municipio de residencia.
- Edad.
- Genero: M o F.
- Experiencia digital: Basica, media o alta.
- Dispositivo principal: Android, iOS o computador.
- Es usuario Sistecredito: Si o No.

### Aliado

- Rol en la tienda: Vendedor, administrador o supervisor.
- Nombre de la tienda.
- Ciudad de operacion.
- Tres consentimientos de participacion.

### Empleado Sistecredito

- Departamento y municipio de residencia.
- Edad y genero.
- Experiencia digital.
- Dispositivo principal.
- Es usuario Sistecredito: Si o No.
- Area a la que pertenece.
- Cargo.

Guarde el formulario. El sistema confirmara que ya hace parte de la comunidad.

## 8. Navegacion general

La aplicacion tiene encabezado, menu lateral, contenido principal y aviso permanente de participacion voluntaria. El menu de perfil ofrece:

- `Restablecer demo`: restaura los datos ficticios iniciales y puede borrar cuentas o respuestas locales.
- `Cerrar sesion`: termina la sesion actual.

## 9. Portal del participante

### Inicio

Muestra nivel, XP, puntos, pendientes, confiabilidad, proxima actividad, misiones recomendadas, acceso a Luegopago e historias de impacto.

### Catalogo de misiones

1. Abra `Catalogo` o `Ver misiones disponibles`.
2. Filtre por duracion, tipo o beneficio.
3. Use `Limpiar filtros` para ver todas.
4. Abra una mision compatible.

Las tarjetas muestran tipo, modalidad, elegibilidad, cupos, duracion, puntos y fecha limite. Los cupos representan la capacidad configurada; no significan necesariamente invitaciones aceptadas.

### Detalle y elegibilidad

El detalle explica que se probara, que debe hacer la persona, duracion, beneficio, fecha limite, grabacion y confidencialidad. Si cumple los filtros aparece `Quiero participar`; si no, se muestran las razones de no elegibilidad.

### Consentimientos de la mision

Marque todos los que aparezcan:

- Participacion voluntaria.
- Tratamiento de informacion de demostracion.
- Confidencialidad, si aplica.
- Grabacion simulada, si aplica.
- Mayoria de edad para el prototipo.

Pulse `Continuar a la prueba`.

### Ejecutar una mision

La mision tiene siete pasos:

1. Introduccion.
2. Instrucciones.
3. Tarea o preguntas.
4. Evidencia simulada.
5. Comentario final.
6. Calificacion.
7. Confirmacion.

Use `Anterior` y `Siguiente`. En una prueba de prototipo debe interactuar con el boton de la tarea antes de avanzar. No escriba informacion personal, financiera ni documentos. La evidencia es simulada y no carga un archivo real.

Al terminar pulse `Enviar feedback`. El aporte queda `En revision`; los puntos y XP llegan solo despues de la aprobacion administrativa.

### Perfil y beneficios

En `Perfil` se consultan nivel, XP, puntos, confiabilidad, insignias, preferencias e historial. La confiabilidad va de 0 a 100 y representa cumplimiento, asistencia y calidad del aporte; no mide si la opinion es favorable.

### Catalogo Luegopago

Abra `Catalogo Luegopago` o `Ir a redimir`. El catalogo es visual y simulado: no descuenta puntos ni genera un canje real.

### Tu voz genera cambios

Presenta historias simuladas sobre como los aportes pueden relacionarse con mejoras de productos, mensajes o experiencias.

## 10. Portal del administrador

### Dashboard

Resume misiones activas, comunidad, pendientes, puntos o presupuesto, participantes por nivel, misiones por estado, comportamiento y laboratorio sintetico.

### Buscar participantes

Escriba en el buscador del encabezado y presione Enter. La opcion `Participantes` filtra por nombre, tipo, ciudad o perfil disponible.

### Participantes

La tabla muestra participante, tipo, ciudad, perfil, nivel, puntos, confiabilidad, estado y ultima actividad. Todos los registros son simulados.

### Gestion de misiones

`Misiones` muestra nombre, tipo, audiencia, estado, responsable, requeridos, invitados, aceptados, completados, presupuesto, fecha limite y acciones. `Duplicar` reutiliza una mision como base.

### Crear una mision

1. Pulse `Crear nueva mision`.
2. Defina nombre, tipo, objetivo, descripcion e instrucciones.
3. Configure audiencia, modalidad, duracion, fecha limite y beneficio.
4. Escriba las preguntas.
5. Configure grabacion y confidencialidad.
6. Defina filtros de ciudad, dispositivo, rol, experiencia y nivel.
7. Indique participantes requeridos y confiabilidad minima.
8. Revise y guarde.

La confiabilidad minima es el puntaje minimo de reputacion para ser compatible. Un valor alto reduce la muestra; uno bajo la amplia.

El sistema calcula compatibles, invitaciones sugeridas y riesgo de no completar la muestra. Se sugieren mas invitaciones que participantes requeridos porque no todas las personas finalizaran.

### Invitaciones

1. Abra `Invitaciones`.
2. Seleccione la mision.
3. Revise personas compatibles y alertas.
4. Use la seleccion automatica cuando corresponda.
5. Simule el envio.

No se envian mensajes reales. Correo, WhatsApp, aplicacion y Credinet son canales demostrativos.

### Comunidad

Explica el modelo de captacion: convocatoria voluntaria, perfilamiento minimo, consentimientos, segmentacion, seguimiento y disponibilidad. La tabla muestra ubicacion, perfil, nivel, XP, confiabilidad, actividad, misiones, asistencia y estado.

### Revision

1. Abra `Revision`.
2. Revise mision, fecha, comentarios, evidencia simulada, duracion y calificacion.
3. Elija `Aprobar y entregar puntos`, `Rechazar` o `Solicitar aclaracion`.

Los puntos y XP se entregan solo al aprobar. Una opinion critica no debe ser motivo de rechazo.

### Comportamiento

1. Abra `Comportamiento`.
2. Seleccione la mision.
3. Consulte clics, participantes ficticios, zona mas usada, boton mas usado, mapa de calor, rankings y linea de tiempo.

La analitica es local y no captura textos, documentos, datos financieros ni informacion sensible. Para generar eventos, use una mision de prototipo como participante y haga clic en sus controles.

## 11. Laboratorio sintetico

Permite explorar hipotesis, ensayar entrevistas, comparar mensajes, probar escenarios e incluir colaboradores sinteticos de Mercadeo, Producto o Tecnologia.

### Crear una simulacion

El asistente tiene nueve pasos:

1. Objetivo.
2. Instrumento.
3. Perfiles.
4. Pesos.
5. Variaciones.
6. Preguntas.
7. Revision.
8. Ejecucion.
9. Resultados.

Seleccione arquetipos y perfiles, ajuste pesos y escenarios, revise las preguntas y ejecute. Los pesos se normalizan a 100 %, pero no implican representatividad estadistica.

Los resultados muestran decisiones ponderadas, resultados por perfil, barreras, trazabilidad, comparacion y calidad. La calibracion permite proponer, aprobar, rechazar y revertir cambios con revision humana.

Las simulaciones no suman participantes reales, puntos, XP, confiabilidad ni metricas reales.

## 12. Estados y metricas

### Mision

- `Borrador`: en configuracion.
- `Reclutando`: busca participantes.
- `Activa`: disponible o en ejecucion.
- `Cerrada`: no acepta participaciones.

### Participacion

- `Pendiente de revision`: espera decision.
- `Aprobada`: se validaron aporte, puntos y XP.
- `Rechazada`: no fue aprobada.
- `Aclaracion`: necesita informacion adicional.

### Puntos, XP y niveles

Los puntos son beneficios simulados; la XP determina el nivel. Para aliados pueden mostrarse Puntos Sonadores y para clientes Puntos Co-crea. Los niveles son Explorador, Cocreador, Especialista y Embajador. Nada representa dinero ni modifica condiciones financieras.

## 13. Demostracion recomendada

1. Registre una cuenta Cliente.
2. Inicie sesion, cambie contrasena y complete perfil.
3. Abra una mision elegible en `Catalogo`.
4. Acepte consentimientos y envie feedback.
5. Confirme `En revision`.
6. Cierre sesion e ingrese como Administrador interno.
7. Abra `Revision` y apruebe el aporte.
8. Regrese como Cliente y verifique puntos y XP.
9. Como administrador consulte `Comportamiento`.
10. Ejecute una exploracion en `Laboratorio sintetico`.

## 14. Solucion de problemas

### La URL publica no abre

- Use https://valenguti.github.io/sistecredito-co-cre/.
- Recargue con `Ctrl + F5`.
- Verifique que GitHub Actions este en verde.
- Espere uno o dos minutos despues de desplegar.

### Localhost rechaza la conexion

Ejecute `npm run dev` desde la carpeta del proyecto y abra `http://localhost:3000`.

### El usuario registrado no aparece

Use el mismo equipo, navegador y perfil. Si se limpio el almacenamiento local, registre otra cuenta ficticia.

### No puedo continuar la mision

- Marque todos los consentimientos.
- En pruebas de prototipo, toque primero el boton de la tarea.
- Verifique la elegibilidad del rol y perfil.

### No aparecen puntos

El administrador debe aprobar la participacion desde `Revision`.

### Comportamiento no tiene datos

Interactue con una mision de prototipo como participante y luego seleccionela como administrador.

### Quiero comenzar nuevamente

Use `Restablecer demo`. Esta accion puede borrar cuentas, respuestas y eventos locales.

## 15. Privacidad y uso responsable

- Use solo datos ficticios.
- No registre identificacion, documentos, informacion financiera o crediticia.
- No use contrasenas reales.
- No use resultados sinteticos como evidencia concluyente.
- No tome decisiones crediticias, laborales o comerciales con esta demo.
- Valide los hallazgos con investigacion real y consentimiento adecuado.

## 16. Despliegue y soporte tecnico

Para validar y construir:

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

La carpeta `dist` contiene el sitio estatico. GitHub Pages ejecuta este proceso automaticamente al actualizar `main`.

## 17. Limitaciones productivas

Antes de usar la plataforma con personas reales se requiere autenticacion segura, backend, base de datos, cifrado, auditoria, gestion formal de consentimientos, integraciones reales, controles de acceso, pruebas de seguridad y accesibilidad, y aprobaciones legales y de privacidad.
