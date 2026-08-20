# Convenciones del proyecto

- No usar datos reales de clientes, aliados, empleados, documentos, creditos ni informacion financiera.
- Mantener toda la interfaz en espanol de Colombia.
- Separar reglas de negocio en funciones puras dentro de `src/domain.mjs`.
- Mantener componentes y renderizado de UI en `app/main.js`.
- Centralizar tokens visuales en `app/styles.css`.

## Validacion

Ejecutar antes de finalizar cambios:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## TypeScript y JavaScript

- La version actual usa JavaScript modular por limitaciones de instalacion de paquetes.
- Documentar tipos con JSDoc cuando una funcion sea compartida o probada.
- Evitar estados globales implicitos fuera del repositorio local.

## Componentes

- Preferir secciones pequenas, reutilizables y con nombres claros.
- No mezclar reglas de negocio con transformaciones visuales complejas.
- Mantener botones y formularios con etiquetas accesibles.

## Accesibilidad

- Todo control interactivo debe ser accesible por teclado.
- Usar contraste suficiente.
- Mantener mensajes de error y exito visibles.
- No depender solo del color para comunicar estados.

## Seguridad del prototipo

- No guardar secretos.
- No incluir credenciales.
- No pedir documentos de identidad.
- No pedir informacion financiera.
- Mostrar que la participacion es voluntaria y no afecta productos, cupos ni condiciones.
