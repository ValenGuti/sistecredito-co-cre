export const LEVELS = [
  { name: "Explorador", minXp: 0, nextXp: 300 },
  { name: "Cocreador", minXp: 300, nextXp: 1000 },
  { name: "Especialista", minXp: 1000, nextXp: 2500 },
  { name: "Embajador", minXp: 2500, nextXp: null },
];

export const defaultSyntheticEvidencePolicy = {
  evidenceType: "syntheticExploration",
  requiresRealValidation: true,
  realValidationStatus: "pending",
};

export const defaultRealEvidencePolicy = {
  evidenceType: "realEvidence",
  requiresRealValidation: false,
  realValidationStatus: "not_required",
};

export function calculateLevel(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  return [...LEVELS].reverse().find((level) => safeXp >= level.minXp) || LEVELS[0];
}

export function levelProgress(xp) {
  const level = calculateLevel(xp);
  if (!level.nextXp) return 100;
  return Math.round(((xp - level.minXp) / (level.nextXp - level.minXp)) * 100);
}

export function assignExperience(participant, xp) {
  const nextXp = Math.max(0, participant.xp + Math.max(0, xp));
  return { ...participant, xp: nextXp, level: calculateLevel(nextXp).name };
}

export function deliverPoints(participant, mission, participation) {
  if (participation.status !== "aprobada") {
    return { participant, transaction: null };
  }
  const amount = Number(mission.points) || 0;
  return {
    participant: {
      ...participant,
      points: participant.points + amount,
      pendingPoints: Math.max(0, participant.pendingPoints - amount),
    },
    transaction: {
      id: cryptoId("reward"),
      participantId: participant.id,
      missionId: mission.id,
      type: "entrega",
      amount,
      label: participant.type === "aliado" ? "Puntos Sonadores simulados" : "Puntos Co-crea",
      createdAt: now(),
    },
  };
}

export function calculateReliability(metrics) {
  const values = [
    metrics.attendance ?? 80,
    metrics.compliance ?? 80,
    metrics.evidenceQuality ?? 80,
    metrics.feedbackClarity ?? 80,
    metrics.instructionRespect ?? 80,
    metrics.confidentiality ?? 100,
  ];
  return Math.max(0, Math.min(100, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)));
}

// Formula de invitaciones: requeridos / tasa estimada de finalizacion.
// Ejemplo: 10 requeridos / 0.4 = 25 invitaciones sugeridas.
export function recommendInvitations(requiredParticipants, estimatedCompletionRate = 0.4) {
  const required = Math.max(1, Number(requiredParticipants) || 1);
  const rate = Math.max(0.1, Math.min(0.95, Number(estimatedCompletionRate) || 0.4));
  return Math.ceil(required / rate);
}

export function matchParticipant(participant, mission) {
  const reasons = [];
  if (participant.status === "pausado") reasons.push("Tiene invitaciones pausadas temporalmente.");
  if (participant.status === "suspendido") reasons.push("No esta disponible para nuevas misiones.");
  if (mission.audience !== "ambos" && participant.type !== mission.audience.slice(0, -1)) {
    reasons.push(participant.type === "cliente" ? "Esta mision esta dirigida a aliados." : "Esta mision esta dirigida a clientes.");
  }
  if (participant.levelRank < mission.minLevelRank) reasons.push(`Requiere nivel minimo ${mission.minLevel}.`);
  const required = mission.requiredProfile || {};
  if (required.os?.length && !required.os.includes(participant.device.os)) reasons.push(`Requiere sistema ${required.os.join(" o ")}.`);
  if (required.roles?.length && !required.roles.includes(participant.allyProfile?.role)) reasons.push("El rol del comercio no coincide con el perfil requerido.");
  if (required.digitalExperience?.length && !required.digitalExperience.includes(participant.clientProfile?.digitalExperience)) {
    reasons.push("Busca otro nivel de experiencia digital.");
  }
  if (required.cities?.length && !required.cities.includes(participant.city)) reasons.push("La ciudad no hace parte de esta muestra.");
  return { eligible: reasons.length === 0, reasons };
}

export function filterEligibleParticipants(participants, mission) {
  return participants
    .map((participant) => ({ participant, result: matchParticipant(participant, mission) }))
    .filter((entry) => entry.result.eligible)
    .map((entry) => entry.participant);
}

export function detectFatigue(participant, invitations, participations, mission) {
  const alerts = [];
  const nowDate = new Date("2026-07-22T12:00:00-05:00");
  const sevenDaysAgo = daysBefore(nowDate, 7);
  const thirtyDaysAgo = daysBefore(nowDate, 30);
  const recentInvitations = invitations.filter((item) => item.participantId === participant.id && new Date(item.createdAt) >= sevenDaysAgo);
  const recentCompleted = participations.filter(
    (item) => item.participantId === participant.id && item.status === "aprobada" && new Date(item.updatedAt) >= thirtyDaysAgo,
  );
  const pending = invitations.filter((item) => item.participantId === participant.id && item.status === "pendiente");
  const similar = participations.some((item) => item.participantId === participant.id && item.missionType === mission.type && new Date(item.updatedAt) >= thirtyDaysAgo);
  if (recentInvitations.length > 3) alerts.push("Recibio mas de tres invitaciones en siete dias.");
  if (recentCompleted.length > 4) alerts.push("Completo mas de cuatro misiones en treinta dias.");
  if (similar) alerts.push("Participo recientemente en una prueba similar.");
  if (pending.length) alerts.push("Tiene invitaciones pendientes sin responder.");
  return { hasRisk: alerts.length > 0, alerts };
}

export function changeParticipationStatus(participation, nextStatus, reason = "") {
  const valid = ["pendiente_revision", "aprobada", "aclaracion", "rechazada", "duplicada"];
  if (!valid.includes(nextStatus)) throw new Error("Estado de participacion no valido");
  if (nextStatus === "rechazada" && !reason.trim()) throw new Error("La razon es obligatoria al rechazar");
  return { ...participation, status: nextStatus, decisionReason: reason, updatedAt: now() };
}

export function summarizeBehaviorEvents(events, missionId) {
  const filtered = events.filter((event) => !missionId || event.missionId === missionId);
  const byLabel = countBy(filtered, (event) => event.label || "Interaccion sin etiqueta");
  const byZone = countBy(filtered.filter((event) => event.zone), (event) => event.zone);
  const heatmapPoints = filtered
    .filter((event) => Number.isFinite(event.x) && Number.isFinite(event.y))
    .map((event) => ({
      x: Math.max(0, Math.min(100, Math.round(event.x))),
      y: Math.max(0, Math.min(100, Math.round(event.y))),
      label: event.label,
      zone: event.zone,
      createdAt: event.createdAt,
    }));
  return {
    totalClicks: filtered.length,
    uniqueParticipants: new Set(filtered.map((event) => event.participantId)).size,
    topButtons: Object.entries(byLabel).sort((a, b) => b[1] - a[1]),
    topZones: Object.entries(byZone).sort((a, b) => b[1] - a[1]),
    heatmapPoints,
    timeline: filtered.slice(-12).reverse(),
  };
}

export function approveParticipation(state, participationId, quality = 4) {
  const participation = state.participations.find((item) => item.id === participationId);
  if (!participation) throw new Error("Participacion no encontrada");
  const mission = state.missions.find((item) => item.id === participation.missionId);
  const participant = state.participants.find((item) => item.id === participation.participantId);
  if (!mission || !participant) throw new Error("Datos incompletos para aprobar");
  const approved = changeParticipationStatus({ ...participation, quality }, "aprobada");
  const withXp = assignExperience(participant, mission.xp);
  const pointsResult = deliverPoints(withXp, mission, approved);
  return {
    ...state,
    participants: state.participants.map((item) => (item.id === participant.id ? pointsResult.participant : item)),
    participations: state.participations.map((item) => (item.id === participationId ? approved : item)),
    rewardTransactions: pointsResult.transaction ? [...state.rewardTransactions, pointsResult.transaction] : state.rewardTransactions,
    experienceTransactions: [
      ...state.experienceTransactions,
      { id: cryptoId("xp"), participantId: participant.id, missionId: mission.id, amount: mission.xp, createdAt: now() },
    ],
    auditEvents: [
      ...state.auditEvents,
      { id: cryptoId("audit"), actor: "Administrador demo", action: "aprobo_participacion", targetId: participationId, createdAt: now() },
    ],
  };
}

export function separateEvidenceMetrics(state) {
  const syntheticSimulations = state.syntheticSimulations || [];
  const syntheticSessions = state.syntheticSessions || [];
  const syntheticFindings = state.syntheticFindings || [];
  return {
    realEvidence: {
      participants: state.participants.length,
      accepted: state.invitations.filter((item) => item.status === "aceptada").length,
      completed: state.participations.filter((item) => item.status === "aprobada").length,
      qualityReviewed: state.participations.filter((item) => Number.isFinite(item.quality)).length,
      pointsDelivered: state.rewardTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    },
    syntheticExploration: {
      simulations: syntheticSimulations.length,
      scenarios: syntheticSessions.length,
      archetypes: (state.syntheticArchetypes || []).length,
      anticipatedRisks: syntheticFindings.filter((item) => item.category === "anticipated_risk").length,
      generatedHypotheses: syntheticFindings.filter((item) => item.category === "generated_hypothesis").length,
      pendingContrast: syntheticFindings.filter((item) => item.requiresRealValidation && item.realValidationStatus !== "completed").length,
    },
    demoData: {
      seedParticipants: state.participants.length,
      seedMissions: state.missions.length,
      localBehaviorEvents: (state.behaviorEvents || []).length,
    },
  };
}

export function buildParticipantResponseExport(state, participantId, exportedAt) {
  const participant = state.participants.find((item) => item.id === participantId);
  const participations = state.participations.filter((item) => item.participantId === participantId);
  return {
    exportVersion: 1,
    exportedAt,
    notice: "Archivo de demostracion. No contiene credenciales ni informacion financiera.",
    participant: {
      id: participantId,
      name: participant?.name || "Participante demo",
      type: participant?.type || "participante",
    },
    responses: participations.map((participation) => {
      const mission = state.missions.find((item) => item.id === participation.missionId);
      const submission = state.submissions.find((item) => item.participationId === participation.id);
      return {
        participationId: participation.id,
        missionId: participation.missionId,
        missionName: mission?.name || "Mision",
        missionType: participation.missionType || mission?.type || "Sin tipo",
        status: participation.status,
        submittedAt: participation.createdAt,
        updatedAt: participation.updatedAt,
        durationMinutes: participation.durationMinutes,
        rating: participation.rating,
        comments: participation.comments || "",
        evidence: participation.evidence || "",
        answers: submission?.answers || [],
      };
    }),
  };
}

export function participantResponseExportToCsv(exportData) {
  const header = ["participationId", "missionId", "missionName", "missionType", "status", "submittedAt", "updatedAt", "durationMinutes", "rating", "comments", "evidence", "answers"];
  const rows = exportData.responses.map((item) => header.map((key) => csvCell(key === "answers" ? item.answers.join(" | ") : item[key])).join(","));
  return [header.join(","), ...rows].join("\n");
}

export function now() {
  return new Date().toISOString();
}

export function cryptoId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[\",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function daysBefore(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}
