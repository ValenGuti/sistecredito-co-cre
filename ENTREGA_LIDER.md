# Prototipo Sistecredito Co-crea

Entrega para revision interna del prototipo beta funcional de la plataforma Sistecredito Co-crea.

Fecha de entrega: 2026-08-03

## Objetivo

El prototipo demuestra una plataforma para reclutar, invitar, motivar y reconocer clientes y aliados que participan voluntariamente en pruebas de producto, experiencia y pilotos controlados.

Todos los datos son simulados. No contiene informacion real de clientes, aliados, empleados, documentos, productos financieros, creditos ni credenciales.

## Que incluye

- Portal de administrador interno.
- Portal de cliente y aliado participante.
- Login demostrativo por rol.
- Catalogo de misiones.
- Creacion y duplicacion de misiones.
- Segmentacion de comunidad.
- Seleccion y envio simulado de invitaciones.
- Flujo de consentimiento y participacion.
- Revision de respuestas y aprobacion de puntos.
- Metricas de comportamiento del usuario, botones usados y zonas de clic.
- Catalogo visual de Luegopago para redencion de puntos.
- Guia de marca aplicada con colores, logo e imagenes entregadas durante la construccion.

## Como abrirlo

Requisitos:

- Node.js 20 o superior.
- Navegador moderno.

Pasos:

```bash
npm install
npm run dev
```

Luego abrir:

```text
http://localhost:3000
```

## Usuario de demostracion

Correo:

```text
vgutierr@sistecredito.com
```

Clave:

```text
Cualquier texto. No se guarda ni se valida contra un servicio real.
```

## Roles disponibles

- Administrador interno: gestiona dashboard, participantes, misiones, invitaciones, comunidad, revision y comportamiento.
- Cliente: consulta misiones, participa, ve puntos y redime beneficios.
- Aliado: consulta misiones para aliados, participa y redime beneficios.

## Comandos utiles

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Notas importantes

- Es un prototipo local, no una aplicacion productiva.
- No tiene autenticacion real.
- No se conecta a servicios reales de Sistecredito, Credinet, Luegopago, WhatsApp, Firebase, TestFlight o Google Play.
- El estado se guarda en el navegador de forma local para la demostracion.
- La integracion con la libreria Flux queda preparada, pero requiere token privado de GitHub Packages para instalarla en una maquina autorizada.

