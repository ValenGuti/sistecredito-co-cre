# Laboratorio Sintetico V2

Esta version agrega perfiles parametrizables, cohortes, resultados ponderados, comparacion real vs. sintetico, calibracion controlada, versionamiento y reversion.

## Modelo

Arquetipo -> cohorte -> perfil parametrizado -> variantes sinteticas -> sesiones -> resultados ponderados -> comparacion real vs. sintetico -> calibracion aprobada -> nueva version del perfil.

## Reglas

- Un usuario sintetico no es evidencia real.
- No se mezclan metricas reales, sinteticas ni ficticias de demostracion.
- No se usa la palabra clon para perfiles.
- Ninguna respuesta real alimenta automaticamente el sistema.
- Toda calibracion requiere consentimiento, desidentificacion, revision humana, aprobacion, version y posibilidad de reversion.

## Pantallas

- Resumen.
- Nueva simulacion.
- Simulaciones.
- Biblioteca de arquetipos.
- Cohortes y perfiles.
- Resultados ponderados.
- Comparador real vs. sintetico.
- Centro de calibracion.
- Calidad del modelo.
- Trazabilidad.

## Perfiles iniciales

Incluye perfiles de demostracion para Amante urbano 25-45, Amante municipio 46-60, Cauteloso uso ocasional, Novato joven, Calculador digital, Malabarista, Todero rural, Visionario con equipo y Comerciante multilocal.

## Pesos

Los pesos configurados se normalizan para sumar 100 %. Los resultados ponderados usan:

```js
weightedResult = sum(profileResult * configuredWeight)
```

Estos porcentajes no son una medicion de la poblacion real.

## Comparacion y calibracion

El comparador usa evidencia ficticia desidentificada de demostracion. La calibracion se crea como propuesta, queda en revision, se aprueba o rechaza manualmente y solo al aprobarse genera una nueva version del perfil.

## Local vs. futuro

Funciona localmente:

- Motor deterministico.
- Perfiles y cohortes.
- Pesos.
- Resultados ponderados.
- Comparacion demo.
- Propuesta y aprobacion de calibracion.
- Versionamiento y reversion.

Requiere backend o IA para produccion:

- Persistencia multiusuario.
- Consentimientos reales auditables.
- Desidentificacion productiva.
- Modelos de lenguaje externos.
- Similitud semantica real.
- Gobierno de aprobaciones.
