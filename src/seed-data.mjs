import { calculateLevel } from "./domain.mjs";
import { demoRealSyntheticEvidence } from "./synthetic-comparison.mjs";
import { initialSyntheticArchetypes } from "./synthetic-archetypes.mjs";
import { createSyntheticSimulation } from "./synthetic-engine.mjs";
import { initialSyntheticCohorts, initialSyntheticProfileVersions, initialSyntheticProfiles } from "./synthetic-profiles.mjs";

const today = "2026-07-22T12:00:00-05:00";
const cities = [
  ["Medellin", "Antioquia"],
  ["Bogota", "Cundinamarca"],
  ["Cali", "Valle del Cauca"],
  ["Barranquilla", "Atlantico"],
  ["Bucaramanga", "Santander"],
  ["Cartagena", "Bolivar"],
  ["Pereira", "Risaralda"],
  ["Manizales", "Caldas"],
  ["Ibague", "Tolima"],
  ["Monteria", "Cordoba"],
];

function participant(id, type, name, index, extras = {}) {
  const [city, department] = cities[index % cities.length];
  const xp = extras.xp ?? (index * 135 + (type === "aliado" ? 240 : 90));
  const level = calculateLevel(xp).name;
  const base = {
    id,
    userId: `user_${id}`,
    name,
    type,
    city,
    department,
    ageRange: ["18-24", "25-34", "35-44", "45-54"][index % 4],
    device: {
      id: `device_${id}`,
      type: index % 3 === 0 ? "Android gama media" : index % 3 === 1 ? "iPhone" : "Computador",
      os: index % 3 === 1 ? "iOS" : index % 3 === 2 ? "Windows" : "Android",
    },
    availability: ["Manana", "Tarde", "Noche", "Fin de semana"][index % 4],
    preferredMissionTypes: ["Pulso rapido", "Encuesta", "Prueba de prototipo", "Entrevista", "Prueba de aplicacion beta"].slice(index % 3, (index % 3) + 3),
    lastParticipationAt: `2026-07-${String(2 + (index % 18)).padStart(2, "0")}T10:00:00-05:00`,
    level,
    levelRank: ["Explorador", "Cocreador", "Especialista", "Embajador"].indexOf(level),
    xp,
    points: extras.points ?? index * 120,
    pendingPoints: extras.pendingPoints ?? 0,
    reliability: extras.reliability ?? Math.min(99, 58 + index * 2),
    status: extras.status ?? (index % 9 === 0 ? "inactivo" : "activo"),
    completedMissions: extras.completedMissions ?? (index % 6),
    attendanceRate: extras.attendanceRate ?? Math.min(100, 72 + index),
    badges: extras.badges ?? [],
    contactPreferences: ["Aplicacion", "Correo"],
    createdAt: "2026-05-01T08:00:00-05:00",
    updatedAt: today,
  };
  if (type === "cliente") {
    base.clientProfile = {
      digitalExperience: ["Basica", "Media", "Alta"][index % 3],
      appUseFrequency: ["Diaria", "Semanal", "Mensual"][index % 3],
      shoppingCategories: ["Moda", "Tecnologia", "Hogar", "Salud"].slice(0, 2 + (index % 3)),
    };
  } else {
    base.allyProfile = {
      businessName: extras.businessName ?? `Comercio Aliado ${index + 1}`,
      sector: ["Moda", "Motos", "Tecnologia", "Hogar", "Opticas", "Calzado"][index % 6],
      size: ["Pequeno", "Mediano", "Grande"][index % 3],
      role: ["dueno", "administrador", "cajero", "vendedor", "encargado de tecnologia"][index % 5],
      credinetExperience: ["Inicial", "Media", "Avanzada"][index % 3],
    };
  }
  return base;
}

export function createSeedState() {
  const clients = [
    participant("cli_01", "cliente", "Valentina Rios", 0, { xp: 285, points: 940, reliability: 96, badges: ["Feedback claro"] }),
    participant("cli_02", "cliente", "Mateo Arango", 1, { xp: 780, points: 2100, reliability: 88 }),
    participant("cli_03", "cliente", "Camila Torres", 2, { xp: 1140, points: 3500, reliability: 91 }),
    participant("cli_04", "cliente", "Santiago Ruiz", 3, { xp: 80, points: 120, reliability: 64 }),
    participant("cli_05", "cliente", "Laura Mejia", 4, { xp: 2440, points: 5000, reliability: 99, badges: ["Embajadora beta"] }),
    participant("cli_06", "cliente", "Nicolas Perez", 5, { status: "pausado", xp: 430, reliability: 79 }),
    participant("cli_07", "cliente", "Isabella Gomez", 6, { xp: 620, reliability: 84 }),
    participant("cli_08", "cliente", "Andres Moreno", 7, { xp: 1320, reliability: 93 }),
    participant("cli_09", "cliente", "Daniela Castro", 8, { status: "inactivo", xp: 170, reliability: 70 }),
    participant("cli_10", "cliente", "Juan Esteban Gil", 9, { xp: 2550, reliability: 98 }),
    participant("cli_11", "cliente", "Sara Ospina", 10, { xp: 340, reliability: 81 }),
    participant("cli_12", "cliente", "Felipe Munoz", 11, { xp: 910, reliability: 76 }),
    participant("cli_13", "cliente", "Manuela Cardenas", 12, { xp: 35, reliability: 67 }),
    participant("cli_14", "cliente", "Sebastian Arias", 13, { xp: 1510, reliability: 90 }),
    participant("cli_15", "cliente", "Juliana Restrepo", 14, { xp: 760, reliability: 86 }),
    participant("cli_16", "cliente", "Tomas Salazar", 15, { xp: 430, reliability: 74 }),
    participant("cli_17", "cliente", "Mariana Lopez", 16, { xp: 1210, reliability: 89 }),
    participant("cli_18", "cliente", "David Quintero", 17, { xp: 260, reliability: 72 }),
  ];
  const allies = [
    participant("ali_01", "aliado", "Carolina Herrera", 0, { businessName: "Moda Aurora", xp: 460, points: 1800, reliability: 92 }),
    participant("ali_02", "aliado", "Oscar Valencia", 1, { businessName: "Tecno Norte", xp: 1350, points: 4100, reliability: 95 }),
    participant("ali_03", "aliado", "Paola Medina", 2, { businessName: "Hogar Central", xp: 220, reliability: 73 }),
    participant("ali_04", "aliado", "Ricardo Builes", 3, { businessName: "Motos Caribe", xp: 710, reliability: 82 }),
    participant("ali_05", "aliado", "Natalia Franco", 4, { businessName: "Optica Prisma", xp: 1060, reliability: 87 }),
    participant("ali_06", "aliado", "Mauricio Cano", 5, { businessName: "Calzado Punto", status: "pausado", xp: 300, reliability: 71 }),
    participant("ali_07", "aliado", "Alejandra Soto", 6, { businessName: "Electro Ya", xp: 2510, reliability: 97 }),
    participant("ali_08", "aliado", "Diego Naranjo", 7, { businessName: "Casa Viva", xp: 540, reliability: 80 }),
    participant("ali_09", "aliado", "Luisa Robledo", 8, { businessName: "Moto Facil", status: "inactivo", xp: 145, reliability: 68 }),
    participant("ali_10", "aliado", "Jorge Pineda", 9, { businessName: "Moda Plaza", xp: 930, reliability: 86 }),
    participant("ali_11", "aliado", "Claudia Marin", 10, { businessName: "Tecno Centro", xp: 1880, reliability: 91 }),
    participant("ali_12", "aliado", "Hector Suarez", 11, { businessName: "Hogar Nube", xp: 650, reliability: 83 }),
  ];

  const missions = [
    mission("mis_01", "Nueva consulta de cupo", "Prueba de prototipo", "clientes", "activa", 1500, 100, 20, {
      description: "Ayudanos a probar una nueva forma de consultar el cupo disponible antes de lanzarla.",
      requiredProfile: { os: ["Android", "iOS"], digitalExperience: ["Basica", "Media", "Alta"] },
      instructions: "Toca el boton Consultar ahora en el prototipo, revisa el mensaje de resultado y cuentanos si la experiencia es clara, facil y confiable.",
      questions: [
        { id: "mis_01_q1", label: "Despues de tocar Consultar ahora, que tan facil fue entender el resultado?", type: "text" },
        { id: "mis_01_q2", label: "Que parte del mensaje te dio mas claridad o te genero duda?", type: "text" },
        { id: "mis_01_q3", label: "Que cambiarias antes de lanzar esta consulta?", type: "text" },
      ],
      channel: "remota",
      confidentiality: true,
      recording: false,
    }),
    mission("mis_02", "Mejoremos la experiencia de Credinet", "Prueba de Credinet", "aliados", "reclutando", 2500, 150, 30, {
      description: "Queremos entender si los pasos principales de Credinet son claros para roles operativos.",
      requiredProfile: { roles: ["cajero", "vendedor", "administrador"] },
      channel: "remota",
      benefit: "2.500 puntos Sonadores simulados",
    }),
    mission("mis_03", "Cual mensaje es mas claro", "Pulso rapido", "clientes", "activa", 300, 25, 5, {
      description: "Elige entre dos mensajes y cuentanos cual se entiende mejor.",
      requiredProfile: {},
      channel: "remota",
    }),
    mission("mis_04", "Prueba anticipada de la aplicacion", "Prueba de aplicacion beta", "clientes", "activa", 3000, 200, 45, {
      description: "Prueba una version anticipada de la app y comparte tu experiencia.",
      requiredProfile: { os: ["Android", "iOS"] },
      channel: "beta",
      confidentiality: true,
      recording: true,
    }),
    mission("mis_05", "Piloto cerrado de beneficios", "Piloto de varios dias", "ambos", "cerrada", 1800, 120, 60, {
      description: "Piloto finalizado para validar beneficios simulados.",
      requiredProfile: {},
      channel: "remota",
    }),
  ];

  const invitations = [
    invite("inv_01", "cli_01", "mis_01", "aceptada", "Aplicacion", -4),
    invite("inv_02", "cli_01", "mis_03", "pendiente", "Correo", -2),
    invite("inv_03", "cli_01", "mis_04", "pendiente", "WhatsApp", -1),
    invite("inv_04", "cli_01", "mis_05", "cerrada", "Aplicacion", -6),
    invite("inv_05", "ali_02", "mis_02", "pendiente", "Credinet", -1),
  ];

  const participations = [
    participation("par_01", "cli_03", "mis_05", "Piloto de varios dias", "aprobada", -12),
    participation("par_02", "ali_02", "mis_02", "Prueba de Credinet", "pendiente_revision", -1),
    participation("par_03", "cli_04", "mis_03", "Pulso rapido", "rechazada", -7),
  ];

  const syntheticSimulation = createSyntheticSimulation({ archetypes: initialSyntheticArchetypes, cohorts: initialSyntheticCohorts, profiles: initialSyntheticProfiles });

  return {
    schemaVersion: 3,
    currentRole: "cliente",
    currentParticipantId: "cli_01",
    participants: [...clients, ...allies],
    missions,
    invitations,
    participations,
    submissions: [
      { id: "sub_01", participationId: "par_02", answers: ["El boton principal se entiende.", "Faltaria explicar mejor el cierre."], rating: 4, evidence: "captura-simulada.png", createdAt: today },
    ],
    consents: [
      { id: "con_01", participantId: "cli_03", missionId: "mis_05", type: "voluntario+datos", acceptedAt: "2026-07-10T09:00:00-05:00" },
    ],
    rewardTransactions: [
      { id: "rew_01", participantId: "cli_03", missionId: "mis_05", type: "entrega", amount: 1800, label: "Puntos Co-crea", createdAt: "2026-07-11T10:00:00-05:00" },
    ],
    experienceTransactions: [
      { id: "xp_01", participantId: "cli_03", missionId: "mis_05", amount: 120, createdAt: "2026-07-11T10:00:00-05:00" },
    ],
    impactStories: [
      story("imp_01", "Gracias a 18 cocreadores, simplificamos el mensaje de confirmacion", "Mensaje de confirmacion", "El texto parecia largo en pantallas pequenas.", "Reducimos el mensaje y dejamos una accion principal.", 18, "2026-07-08"),
      story("imp_02", "Los aliados nos ayudaron a reducir pasos en una consulta de Credinet", "Consulta en Credinet", "Los cajeros necesitaban menos cambios de pantalla.", "Agrupamos dos pasos y mejoramos los nombres de botones.", 12, "2026-07-12"),
      story("imp_03", "Identificamos dificultades de navegacion en algunos dispositivos Android", "Menu de la app", "La ubicacion del acceso no era evidente.", "Movimos el acceso a una zona mas visible.", 21, "2026-07-16"),
    ],
    behaviorEvents: [
      behavior("beh_01", "cli_01", "mis_01", "Cupo disponible", "cabecera de cupo", 50, 18, -2),
      behavior("beh_02", "cli_01", "mis_01", "Consultar ahora", "boton principal", 50, 62, -2),
      behavior("beh_03", "cli_02", "mis_01", "Ver detalle", "tarjeta de mision", 72, 44, -2),
      behavior("beh_04", "cli_03", "mis_01", "Consultar ahora", "boton principal", 48, 64, -1),
      behavior("beh_05", "cli_05", "mis_01", "Texto de ayuda", "mensaje secundario", 45, 79, -1),
      behavior("beh_06", "cli_08", "mis_04", "Abrir en Google Play Testing", "enlace beta", 52, 52, -1),
      behavior("beh_07", "cli_10", "mis_04", "Abrir en TestFlight", "enlace beta", 50, 50, -1),
    ],
    auditEvents: [
      { id: "aud_01", actor: "Sistema demo", action: "seed_creado", targetId: "demo", createdAt: today },
    ],
    syntheticArchetypes: initialSyntheticArchetypes,
    syntheticCohorts: initialSyntheticCohorts,
    syntheticProfiles: initialSyntheticProfiles,
    syntheticProfileVersions: initialSyntheticProfileVersions,
    syntheticVariants: syntheticSimulation.sessions.map((session) => session.profile),
    syntheticSimulations: [syntheticSimulation],
    syntheticAggregates: [syntheticSimulation.aggregate],
    syntheticSessions: syntheticSimulation.sessions,
    syntheticFindings: syntheticSimulation.findings,
    realSyntheticDemoEvidence: demoRealSyntheticEvidence,
    realSyntheticComparisons: [],
    calibrationProposals: [],
    calibrationHistory: [],
    modelQualityMetrics: {
      comparisonCount: 0,
      overallCalibrationScore: 0,
      level: "uncalibrated",
      thresholds: { moderate: 0.68, high: 0.86, minimumComparisonsForHigh: 8 },
      updatedAt: today,
    },
  };
}

function mission(id, name, type, audience, status, points, xp, durationMinutes, options = {}) {
  return {
    id,
    name,
    description: options.description,
    internalObjective: "Aprender rapido con una muestra pequena antes de escalar la decision.",
    type,
    audience,
    startDate: "2026-07-22",
    deadline: id === "mis_05" ? "2026-07-14" : "2026-08-05",
    durationMinutes,
    requiredParticipants: id === "mis_03" ? 50 : 10,
    benefit: options.benefit ?? `${points.toLocaleString("es-CO")} puntos`,
    points,
    xp,
    minLevel: "Explorador",
    minLevelRank: 0,
    requiredProfile: options.requiredProfile,
    instructions: options.instructions ?? "Lee el contexto, realiza la tarea propuesta y comparte comentarios sinceros.",
    questions: options.questions ?? [
      { id: `${id}_q1`, label: "Que tan facil fue completar la tarea?", type: "scale" },
      { id: `${id}_q2`, label: "Que fue lo mas claro o confuso?", type: "text" },
      { id: `${id}_q3`, label: "Que cambiarias antes del lanzamiento?", type: "text" },
    ],
    confidentiality: options.confidentiality ?? false,
    recording: options.recording ?? false,
    channel: options.channel ?? "remota",
    status,
    participantMode: "real",
    evidencePolicy: {
      evidenceType: "realEvidence",
      requiresRealValidation: false,
      realValidationStatus: "not_required",
    },
    owner: "Equipo Co-crea",
    budget: points * 10,
    invited: id === "mis_02" ? 18 : 12,
    accepted: id === "mis_02" ? 7 : 6,
    completed: id === "mis_05" ? 10 : 3,
    createdAt: "2026-07-01T09:00:00-05:00",
    updatedAt: today,
  };
}

function invite(id, participantId, missionId, status, channel, days) {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return { id, participantId, missionId, status, channel, createdAt: date.toISOString(), updatedAt: date.toISOString() };
}

function participation(id, participantId, missionId, missionType, status, days) {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return {
    id,
    participantId,
    missionId,
    missionType,
    status,
    durationMinutes: 24,
    rating: 4,
    quality: status === "aprobada" ? 5 : null,
    comments: "Comentario de demostracion con hallazgos accionables.",
    evidence: "Evidencia simulada",
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
  };
}

function story(id, title, tested, learned, changed, participants, date) {
  return { id, title, tested, learned, changed, participants, date, createdAt: `${date}T10:00:00-05:00` };
}

function behavior(id, participantId, missionId, label, zone, x, y, days) {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return {
    id,
    participantId,
    missionId,
    type: "click",
    label,
    zone,
    x,
    y,
    step: "prototipo",
    createdAt: date.toISOString(),
  };
}
