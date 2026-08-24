# Ajustes funcionales - agosto de 2026

## Navegacion

El portal administrativo presenta cinco modulos principales:

- Dashboard.
- Misiones.
- Comunidad.
- Analitica.
- Configuracion.

Participantes, Invitaciones y Revision se consolidaron en Comunidad y Misiones. El Laboratorio sintetico se retiro de la navegacion y del dashboard. Sus datos historicos permanecen en el estado para no romper sesiones locales existentes.

## Estados de mision

- `creado`: editar, duplicar, seleccionar participantes, enviar invitaciones o cancelar.
- `reclutando`: ver seleccion, enviar o reenviar invitaciones, activar, duplicar o cancelar.
- `activo`: ver avance, duplicar o cerrar. No se puede cancelar.
- `cerrado`: ver resultados o duplicar.
- `cancelado`: ver detalle o duplicar.

Los estados antiguos `borrador`, `activa`, `cerrada` y `cancelada` se normalizan al cargar datos guardados.

## Calidad del feedback

`feedbackQualityAnalyzer` define una interfaz desacoplada. La implementacion actual es una regla local provisional basada en completitud, extension, evidencia y calificacion. No representa un agente de inteligencia artificial.

## Comportamiento

Pendiente de homologacion con metricas de prototipos definidas en la linea de Discovery. La interfaz queda preparada para clics, recorrido, abandono, errores, tiempo, tarea completada y puntos de friccion.

## Pendientes de producto

- Validar el catalogo definitivo de tipos de mision con Caro Angel.
- Homologar comportamiento en prototipos con Discovery.
- Definir e integrar un agente real para analisis de calidad y contenido del feedback.
- Conectar el catalogo real y la transaccion de redencion de LuegoPago.

