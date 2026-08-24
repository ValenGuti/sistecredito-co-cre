# Arquitectura

## Vista general

El prototipo esta construido como una aplicacion web local sin dependencias externas para garantizar ejecucion en el entorno disponible. La separacion principal es:

- `app/`: interfaz, estilos y comportamiento del navegador.
- `src/`: datos seed, repositorio local y reglas puras de negocio.
- `src/synthetic-*.mjs`: codigo historico de compatibilidad; no se expone en la navegacion actual.
- `tests/`: pruebas unitarias e integracion del flujo principal.
- `scripts/`: servidor local, build, lint y verificacion.

## Modelo de datos

El seed incluye entidades equivalentes a:

- User / AdminUser.
- ParticipantProfile.
- ClientProfile.
- AllyProfile.
- Device.
- Mission.
- MissionQuestion.
- EligibilityRule.
- Invitation.
- Participation.
- Submission.
- Evidence.
- Consent.
- RewardTransaction.
- ExperienceTransaction.
- Badge.
- ParticipantBadge.
- ImpactStory.
- AuditEvent.
- SyntheticArchetype.
- SyntheticProfile.
- SyntheticSimulation.
- SyntheticSession.
- SyntheticFinding.

Cada registro relevante contiene identificador, fechas y estados tipados por convencion.

## Decisiones tecnicas

- Persistencia en `localStorage` para que la demo conserve cambios sin servidor.
- Funciones puras para nivel, puntos, XP, fatiga, elegibilidad y estados.
- Adaptadores simulados para invitaciones, enlaces beta y beneficios.
- Motor sintetico local deterministico, sin llamadas externas ni secretos.
- Las metricas visibles del dashboard se calculan desde participantes, misiones y participaciones de la plataforma.
- Copia en espanol de Colombia y mensajes visibles de voluntariedad.
- UI responsive con foco mobile-first para participantes y desktop para administracion.

## Reemplazo de mocks por servicios reales

1. Mantener las funciones de dominio en `src/domain.mjs`.
2. Cambiar `src/store.mjs` por un repositorio HTTP o base de datos.
3. Mover validaciones de formularios a esquemas compartidos.
4. Agregar autenticacion y permisos por rol.
5. Registrar auditoria en backend.

## Integraciones futuras

- TestFlight: crear un adaptador que genere invitaciones por grupo beta y guarde estado de acceso.
- Google Play Testing: conectar grupos de testers y enlaces cerrados por sistema operativo.
- Firebase App Distribution: manejar releases, testers e invitaciones desde un servicio interno.
- Credinet: integrar misiones para aliados, roles operativos y canales de notificacion.
- Sonadores: registrar transacciones de puntos simulados contra el sistema real de beneficios cuando exista aprobacion.
- IA para laboratorio sintetico: usar un backend seguro que consuma el contrato de `src/synthetic-prompts.mjs`; nunca llamar servicios con claves desde el navegador.

Estas integraciones no estan implementadas en esta version y se muestran como enlaces o acciones de demostracion.

