# Sistecredito Co-crea

Primer prototipo beta funcional de una plataforma web para reclutar, motivar y reconocer clientes y aliados que participan en pruebas de producto, experiencia y pilotos controlados.

Todos los datos son ficticios. El prototipo no usa clientes, aliados, empleados, documentos, informacion financiera, crediticia ni credenciales reales.

## Objetivo

Demostrar de principio a fin el flujo principal:

1. Un administrador crea una mision.
2. Define filtros de participantes.
3. La plataforma muestra personas compatibles.
4. Se simula el envio de invitaciones.
5. Un participante entra, revisa una mision y acepta consentimientos.
6. Completa la prueba y envia feedback.
7. El administrador revisa la participacion.
8. Al aprobarla, se entregan puntos y XP.
9. El participante ve el reconocimiento en su inicio y perfil.

## Tecnologias

Esta entrega usa una aplicacion web local con HTML, CSS y JavaScript modular, mas pruebas con el runner nativo de Node.js. El encargo pedia Next.js, React, Tailwind, Zod y Playwright; el entorno de ejecucion no pudo descargar paquetes del registro publico, asi que se implemento una base sin dependencias externas para dejar un beta demostrable y validado. La arquitectura esta separada en dominio, datos y UI para migrarla despues a Next.js sin rehacer las reglas.

## Requisitos

- Node.js 20 o superior.
- Un navegador moderno.

## Instalacion

```bash
npm install
```

No hay dependencias externas en esta version, por lo que la instalacion solo prepara el proyecto local.

## Comandos

```bash
npm run dev
npm run flux:sync
npm run lint
npm run typecheck
npm run test
npm run build
```

## Libreria Flux de Sistecredito

El proyecto esta preparado para usar el paquete privado `@sc-ingenieria/flux` desde GitHub Packages sin guardar tokens en el repositorio. Flux queda como integracion opcional para no bloquear el prototipo cuando aun no hay token configurado.

Configura el token solo en tu maquina, en tu `.npmrc` de usuario, no en el `.npmrc` del proyecto:

```bash
npm config set @sc-ingenieria:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken TU_TOKEN
npm install --no-save @sc-ingenieria/flux
npm run flux:sync
```

No pegues el token en este README, en el chat, en `.npmrc` del proyecto ni en codigo fuente.

`npm run flux:sync` busca los tokens CSS publicados por Flux y actualiza `app/flux-tokens.generated.css`. El prototipo consume ese archivo antes de `app/styles.css`, de modo que colores, radios y estados visuales puedan alinearse con el sistema de diseno.

## Como iniciar

```bash
npm run dev
```

Abre la URL local que imprime la terminal. Normalmente es:

```text
http://localhost:3000
```

## Como cambiar de rol

En la parte superior aparece el selector marcado como **Modo demostracion**. Permite cambiar entre:

- Cliente: muestra el portal del participante con misiones de cliente.
- Aliado: muestra el portal del participante con misiones de aliado.
- Administrador interno: muestra dashboard, misiones, comunidad, invitaciones, revision y comportamiento en prototipos.

## Flujo recomendado para la demo

1. Entra como **Cliente**.
2. Abre **Catalogo**.
3. Selecciona **Nueva consulta de cupo**.
4. Revisa el detalle y pulsa **Quiero participar**.
5. Acepta los consentimientos obligatorios.
6. Completa los pasos de la mision y envia el feedback.
7. Confirma que la participacion queda **En revision** y que los puntos no se entregan aun.
8. Cambia a **Administrador interno**.
9. Abre **Revision**.
10. Selecciona la participacion pendiente y pulsa **Aprobar y entregar puntos**.
11. Cambia de nuevo a **Cliente**.
12. Verifica que aumentaron los puntos, la XP y el historial.
13. Vuelve a **Administrador interno** y abre **Comportamiento** para ver clics, botones usados, zonas calientes y linea de tiempo.
14. Abre **Laboratorio sintetico** para revisar perfiles, ejecutar una simulacion local, ver resultados ponderados y comparar real vs. sintetico.

## Datos de prueba

Incluye 30 participantes ficticios:

- 18 clientes.
- 12 aliados.
- Ciudades y departamentos de Colombia.
- Dispositivos, sistemas operativos, niveles, confiabilidad y disponibilidad variados.
- Personas activas, inactivas, pausadas, nuevas, con alta confiabilidad y con riesgo de fatiga.

Misiones precargadas:

- Nueva consulta de cupo.
- Mejoremos la experiencia de Credinet.
- Cual mensaje es mas claro.
- Prueba anticipada de la aplicacion.
- Piloto cerrado de beneficios para mostrar estados cerrados.

Tambien incluye una simulacion sintetica precargada:

- Validacion exploratoria de la propuesta Sistecredito Co-crea.
- Arquetipos: Amante, Cauteloso, Novato, Todero, Visionario y Comerciante.
- Resultados marcados como exploracion sintetica pendiente de validacion real.

## Restablecer datos

Usa el boton **Restablecer demo** en la barra superior. Borra el estado local del navegador y vuelve a cargar los datos seed.

## Pruebas

Las pruebas unitarias cubren:

- Calculo de niveles.
- Entrega de puntos solo despues de aprobacion.
- Recomendacion de invitaciones.
- Filtros de elegibilidad.
- Deteccion de fatiga.
- Cambio de estado de participacion.
- Resumen de comportamiento, botones usados y puntos de mapa de calor.
- Reproducibilidad de variantes sinteticas por seed.
- Separacion entre metricas reales y exploracion sintetica.
- Garantia de que simulaciones no entregan puntos ni XP.

Tambien existe una prueba de integracion que simula el flujo end-to-end pedido. Playwright queda fuera de esta version porque no fue posible instalarlo en el entorno sin acceso al registro de paquetes.

## Funcionalidades simuladas

- Envio de invitaciones por aplicacion, WhatsApp, correo o Credinet.
- Enlaces a TestFlight, Google Play Testing y Firebase App Distribution.
- Evidencias de prueba.
- Mapa de calor y analitica de comportamiento local.
- Videollamadas de entrevistas.
- Puntos Co-crea y Puntos Sonadores simulados.
- Presupuesto y metricas administrativas.
- Laboratorio sintetico V2 con cohortes, perfiles parametrizables, pesos, resultados ponderados, comparacion demo y calibracion controlada.

## Limitaciones del prototipo

- No tiene autenticacion real.
- No usa base de datos productiva.
- No se integra con Credinet, Sonadores, Firebase, TestFlight, Google Play ni WhatsApp.
- La libreria Flux se consume como tokens CSS cuando el paquete privado esta instalado localmente.
- No maneja canjes reales ni transferencias monetarias.
- No toma decisiones crediticias.
- El laboratorio sintetico no reemplaza evidencia de clientes, aliados o colaboradores reales.
- El estado persiste solo en `localStorage` del navegador.

## Proximos pasos

- Migrar la UI modular a Next.js con App Router cuando el entorno permita instalar dependencias.
- Reemplazar el repositorio local por servicios reales o SQLite/Prisma.
- Agregar autenticacion interna y roles productivos.
- Integrar adaptadores reales para invitaciones, beta distribution y beneficios.
- Ejecutar pruebas E2E con Playwright en CI.
