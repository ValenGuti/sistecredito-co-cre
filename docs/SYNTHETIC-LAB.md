# Laboratorio sintetico

El Laboratorio sintetico es un modulo administrativo de Sistecredito Co-crea para preparar pruebas con escenarios generados desde arquetipos, cohortes y perfiles parametrizables. La especificacion V2 completa esta en `docs/SYNTHETIC-LAB-V2.md`.

## Regla principal

Todo resultado del laboratorio es exploracion sintetica:

> Resultado sintetico. Esta simulacion ayuda a explorar escenarios y preparar pruebas, pero no sustituye evidencia obtenida con clientes, aliados o colaboradores reales.

Los resultados no validan hipotesis, no representan porcentajes de clientes, aliados o colaboradores, no se mezclan con metricas reales y siempre quedan pendientes de contraste con personas reales.

## Que permite hacer

- Crear simulaciones con arquetipos de clientes, aliados y colaboradores internos.
- Crear cohortes y perfiles dentro del mismo arquetipo.
- Configurar pesos y cantidades por perfil.
- Pegar o escribir preguntas propias por iniciativa.
- Cargar plantillas editables solo cuando apliquen a esa iniciativa.
- Generar variantes reproducibles por `seed`.
- Ejecutar sesiones con motor local deterministico.
- Ver resultados ponderados.
- Comparar evidencia ficticia desidentificada real vs. sintetica.
- Proponer, aprobar, versionar y revertir calibraciones.
- Comparar respuestas por arquetipo.
- Detectar barreras plausibles, riesgos anticipados e hipotesis.
- Ver trazabilidad de fuente, vigencia, prompt, motor y semillas.
- Convertir hallazgos en preguntas para una futura mision real.

## Arquetipos iniciales

Clientes:

- Novato.
- Amante.
- Cauteloso.
- Calculador.
- Malabarista.

Aliados:

- Todero.
- Visionario.
- Comerciante.

Colaboradores:

- Mercadeo.
- Producto.
- Tecnologia.

Cada arquetipo tiene version, fuente, vigencia, rasgos estables, rasgos variables, barreras, contexto plausible y limitaciones.

## Motor local

El MVP usa `runLocalSyntheticSession`, que no depende de servicios externos ni de IA configurada. Las preguntas se toman del instrumento configurado en cada simulacion. Si una simulacion no tiene preguntas, se usa una pregunta generica minima; el guion Co-crea no se aplica automaticamente a todas las iniciativas.

El mismo `seed` genera la misma variante. Seeds diferentes producen variaciones controladas.

## Separacion de metricas

El laboratorio no afecta:

- Participantes reales.
- Puntos.
- XP.
- Rankings.
- Control de fatiga.
- Tasas reales de aceptacion o finalizacion.

El dashboard separa:

- Evidencia real.
- Exploracion sintetica.
- Datos de demostracion.

## Archivos principales

- `src/synthetic-archetypes.mjs`: biblioteca de arquetipos.
- `src/synthetic-prompts.mjs`: prompts versionados y contrato para IA futura.
- `src/synthetic-engine.mjs`: motor local y resumen de simulaciones.
- `tests/synthetic.test.mjs`: pruebas de separacion y reproducibilidad.
- `app/main.js`: interfaz administrativa.
