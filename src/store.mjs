import { approveParticipation, cryptoId, normalizeMissionStatus, now, transitionMissionStatus } from "./domain.mjs";
import { createSeedState } from "./seed-data.mjs";
import { initialSyntheticArchetypes } from "./synthetic-archetypes.mjs";
import { approveCalibrationProposal, applyCalibrationProposal, createCalibrationProposal, rejectCalibrationProposal, revertCalibration, submitCalibrationProposal } from "./synthetic-calibration.mjs";
import { compareRealVsSynthetic, demoRealSyntheticEvidence, finalizeComparison } from "./synthetic-comparison.mjs";
import { createSyntheticSimulation } from "./synthetic-engine.mjs";
import { initialSyntheticCohorts, initialSyntheticProfileVersions, initialSyntheticProfiles } from "./synthetic-profiles.mjs";

const KEY = "sistecredito-cocrea-state";

export function loadState() {
  if (typeof localStorage === "undefined") return normalizeState(createSeedState());
  const stored = localStorage.getItem(KEY);
  if (!stored) return saveState(normalizeState(createSeedState()));
  try {
    return normalizeState(JSON.parse(stored));
  } catch {
    return saveState(createSeedState());
  }
}

export function saveState(state) {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function resetState() {
  return saveState(createSeedState());
}

export function setRole(state, role) {
  const currentParticipantId = role === "aliado" ? "ali_01" : role === "cliente" ? "cli_01" : state.currentParticipantId;
  return saveState({ ...state, currentRole: role, currentParticipantId });
}

export function setSessionRole(state, account) {
  const role = account.role === "admin" ? "admin" : account.role;
  const currentParticipantId = account.participantId || (role === "aliado" ? "ali_01" : role === "cliente" ? "cli_01" : state.currentParticipantId);
  return saveState({ ...state, currentRole: role, currentParticipantId });
}

export function createRegisteredParticipant(state, account) {
  if (!["cliente", "aliado"].includes(account.role)) return state;
  if (account.participantId && state.participants.some((participant) => participant.id === account.participantId)) return state;
  const id = `${account.role === "aliado" ? "ali" : "cli"}_${cryptoId("reg").slice(-8)}`;
  const participant = {
    id,
    userId: `user_${id}`,
    name: account.displayName || `${account.firstName} ${account.lastName}`,
    type: account.role,
    city: "Por completar",
    department: "Por completar",
    ageRange: "Por completar",
    device: {
      id: `device_${id}`,
      type: "Por completar",
      os: "Por completar",
    },
    availability: "Por completar",
    preferredMissionTypes: ["Encuesta", "Entrevista", "Prueba de prototipo"],
    lastParticipationAt: null,
    level: "Explorador",
    levelRank: 0,
    xp: 0,
    points: 0,
    pendingPoints: 0,
    reliability: 60,
    status: "activo",
    completedMissions: 0,
    attendanceRate: 0,
    badges: ["Nuevo cocreador"],
    contactPreferences: ["Correo"],
    profileCompleted: false,
    createdAt: now(),
    updatedAt: now(),
    ...(account.role === "aliado"
      ? { allyProfile: { businessName: "Por completar", sector: "Por completar", size: "Por completar", role: "Por completar", credinetExperience: "Por completar" } }
      : { clientProfile: { digitalExperience: "Por completar", appUseFrequency: "Por completar", shoppingCategories: [] } }),
  };
  return saveState({ ...state, participants: [...state.participants, participant], currentRole: account.role, currentParticipantId: id });
}

export function completeCommunityProfile(state, account, profile) {
  if (account.role === "empleado") {
    const employeeProfile = {
      email: account.email,
      name: account.displayName,
      role: account.role,
      profile,
      profileCompleted: true,
      updatedAt: now(),
    };
    const internalProfiles = [
      ...(state.internalProfiles || []).filter((item) => item.email !== account.email),
      employeeProfile,
    ];
    return saveState({ ...state, internalProfiles, currentRole: "empleado" });
  }
  const participantId = account.participantId || state.currentParticipantId;
  return saveState({
    ...state,
    participants: state.participants.map((participant) => {
      if (participant.id !== participantId) return participant;
      const base = {
        ...participant,
        city: profile.municipality || participant.city,
        department: profile.department || participant.department,
        ageRange: profile.age || participant.ageRange,
        device: { ...participant.device, os: profile.device || participant.device.os, type: profile.device || participant.device.type },
        profileCompleted: true,
        updatedAt: now(),
      };
      if (account.role === "aliado") {
        return {
          ...base,
          allyProfile: {
            ...(participant.allyProfile || {}),
            role: profile.storeRole,
            businessName: profile.storeName,
          },
        };
      }
      return {
        ...base,
        clientProfile: {
          ...(participant.clientProfile || {}),
          digitalExperience: profile.digitalExperience,
          isSistecreditoUser: profile.isSistecreditoUser,
          gender: profile.gender,
        },
      };
    }),
  });
}

export function submitMission(state, participantId, missionId, payload) {
  const mission = state.missions.find((item) => item.id === missionId);
  const participationId = cryptoId("par");
  const consent = {
    id: cryptoId("con"),
    participantId,
    missionId,
    type: payload.consentType,
    acceptedAt: now(),
  };
  const participation = {
    id: participationId,
    participantId,
    missionId,
    missionType: mission.type,
    status: "pendiente_revision",
    durationMinutes: payload.durationMinutes,
    rating: payload.rating,
    quality: null,
    comments: payload.comment,
    evidence: payload.evidence,
    createdAt: now(),
    updatedAt: now(),
  };
  const submission = {
    id: cryptoId("sub"),
    participationId,
    answers: payload.answers,
    rating: payload.rating,
    evidence: payload.evidence,
    createdAt: now(),
  };
  return saveState({
    ...state,
    consents: [...state.consents, consent],
    participations: [...state.participations, participation],
    submissions: [...state.submissions, submission],
    participants: state.participants.map((participant) =>
      participant.id === participantId ? { ...participant, pendingPoints: participant.pendingPoints + mission.points } : participant,
    ),
  });
}

export function approveFromStore(state, participationId) {
  return saveState(approveParticipation(state, participationId));
}

export function rejectParticipation(state, participationId, reason) {
  return saveState({
    ...state,
    participations: state.participations.map((item) =>
      item.id === participationId ? { ...item, status: "rechazada", decisionReason: reason, updatedAt: now() } : item,
    ),
    auditEvents: [...state.auditEvents, { id: cryptoId("audit"), actor: "Administrador demo", action: "rechazo_participacion", targetId: participationId, createdAt: now() }],
  });
}

export function createMission(state, form) {
  const points = Number(form.points || 800);
  const mission = {
    id: cryptoId("mis"),
    name: form.name.trim(),
    description: form.description.trim(),
    internalObjective: form.internalObjective.trim(),
    type: form.type,
    audience: form.audience || "ambos",
    startDate: form.startDate,
    deadline: form.deadline,
    durationMinutes: Number(form.durationMinutes || 20),
    requiredParticipants: Number(form.requiredParticipants || 10),
    benefit: form.benefit.trim(),
    points,
    xp: Number(form.xp || 80),
    minLevel: form.minLevel,
    minLevelRank: ["Explorador", "Cocreador", "Especialista", "Embajador"].indexOf(form.minLevel),
    levels: form.levels?.length ? form.levels : ["Explorador", "Cocreador", "Especialista", "Embajador"],
    requiredProfile: form.requiredProfile,
    instructions: form.instructions.trim(),
    questions: form.questions.filter(Boolean).map((label, index) => ({ id: `q_${index}`, label, type: "text" })),
    recording: form.recording,
    channel: form.channel,
    status: form.publish ? "reclutando" : "creado",
    owner: form.owner.trim(),
    budget: Number(form.budget || points * Number(form.requiredParticipants || 10)),
    invited: 0,
    accepted: 0,
    completed: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  return saveState({ ...state, missions: [mission, ...state.missions] });
}

export function updateMissionDetails(state, missionId, form) {
  return saveState({
    ...state,
    missions: state.missions.map((mission) => mission.id === missionId ? {
      ...mission,
      name: form.name.trim(),
      description: form.description.trim(),
      internalObjective: form.internalObjective.trim(),
      type: form.type,
      owner: form.owner.trim(),
      startDate: form.startDate,
      deadline: form.deadline,
      durationMinutes: Number(form.durationMinutes || mission.durationMinutes),
      requiredParticipants: Number(form.requiredParticipants || mission.requiredParticipants),
      benefit: form.benefit.trim(),
      points: Number(form.points || mission.points),
      xp: Number(form.xp || mission.xp),
      levels: form.levels?.length ? form.levels : mission.levels,
      instructions: form.instructions.trim(),
      questions: form.questions.filter(Boolean).map((label, index) => ({ id: `q_${index}`, label, type: "text" })),
      recording: form.recording,
      channel: form.channel,
      budget: Number(form.budget || mission.budget),
      updatedAt: now(),
    } : mission),
  });
}

export function updateMissionStatus(state, missionId, nextStatus) {
  return saveState({
    ...state,
    missions: state.missions.map((mission) => mission.id === missionId ? transitionMissionStatus(mission, nextStatus) : mission),
    auditEvents: [...state.auditEvents, { id: cryptoId("audit"), actor: "Administrador demo", action: `cambio_mision_${nextStatus}`, targetId: missionId, createdAt: now() }],
  });
}

export function sendInvitations(state, missionId, participantIds, channel) {
  const existing = new Set(state.invitations.filter((item) => item.missionId === missionId).map((item) => item.participantId));
  const invitations = participantIds.filter((participantId) => !existing.has(participantId)).map((participantId) => ({
    id: cryptoId("inv"),
    participantId,
    missionId,
    status: "pendiente",
    channel,
    createdAt: now(),
    updatedAt: now(),
  }));
  return saveState({
    ...state,
    invitations: [...state.invitations, ...invitations],
    missions: state.missions.map((mission) =>
      mission.id === missionId ? { ...mission, status: "reclutando", invited: mission.invited + invitations.length, updatedAt: now() } : mission,
    ),
    auditEvents: [...state.auditEvents, { id: cryptoId("audit"), actor: "Administrador demo", action: "envio_invitaciones", targetId: missionId, createdAt: now() }],
  });
}

export function acceptInvitation(state, participantId, missionId) {
  const invitation = state.invitations.find((item) => item.participantId === participantId && item.missionId === missionId && item.status === "pendiente");
  if (!invitation) return state;
  return saveState({
    ...state,
    invitations: state.invitations.map((item) => item.id === invitation.id ? { ...item, status: "aceptada", updatedAt: now() } : item),
    missions: state.missions.map((mission) => mission.id === missionId ? { ...mission, accepted: mission.accepted + 1, updatedAt: now() } : mission),
    auditEvents: [...state.auditEvents, { id: cryptoId("audit"), actor: participantId, action: "acepto_invitacion", targetId: missionId, createdAt: now() }],
  });
}

export function duplicateMission(state, missionId) {
  const mission = state.missions.find((item) => item.id === missionId);
  if (!mission) return state;
  const copy = { ...mission, id: cryptoId("mis"), name: `${mission.name} (copia)`, status: "creado", invited: 0, accepted: 0, completed: 0, createdAt: now(), updatedAt: now() };
  return saveState({ ...state, missions: [copy, ...state.missions] });
}

export function recordBehaviorEvent(state, event) {
  return saveState({
    ...state,
    behaviorEvents: [
      ...(state.behaviorEvents || []),
      {
        id: cryptoId("beh"),
        type: "click",
        createdAt: now(),
        ...event,
      },
    ].slice(-250),
  });
}

export function runSyntheticSimulation(state, template) {
  const syntheticArchetypes = mergeSyntheticArchetypes(state.syntheticArchetypes);
  const syntheticCohorts = mergeById(initialSyntheticCohorts, state.syntheticCohorts);
  const syntheticProfiles = mergeById(initialSyntheticProfiles, state.syntheticProfiles);
  const simulation = createSyntheticSimulation({
    archetypes: syntheticArchetypes,
    cohorts: syntheticCohorts,
    profiles: syntheticProfiles,
    template,
  });
  return saveState({
    ...state,
    schemaVersion: 3,
    syntheticArchetypes,
    syntheticCohorts,
    syntheticProfiles,
    syntheticVariants: [...(state.syntheticVariants || []), ...simulation.sessions.map((session) => session.profile)],
    syntheticSimulations: [simulation, ...(state.syntheticSimulations || [])],
    syntheticAggregates: [simulation.aggregate, ...(state.syntheticAggregates || [])],
    syntheticSessions: [...(state.syntheticSessions || []), ...simulation.sessions],
    syntheticFindings: [...(state.syntheticFindings || []), ...simulation.findings],
    auditEvents: [...(state.auditEvents || []), { id: cryptoId("audit"), actor: "Administrador demo", action: "ejecuto_simulacion_sintetica", targetId: simulation.simulationId, createdAt: now() }],
  });
}

export function createRealSyntheticComparison(state, simulationId) {
  const simulation = (state.syntheticSimulations || []).find((item) => item.simulationId === simulationId) || state.syntheticSimulations?.[0];
  if (!simulation) return state;
  const comparison = finalizeComparison(compareRealVsSynthetic(simulation, state.realSyntheticDemoEvidence || demoRealSyntheticEvidence));
  return saveState({
    ...state,
    schemaVersion: 3,
    realSyntheticComparisons: [comparison, ...(state.realSyntheticComparisons || [])],
    modelQualityMetrics: updateModelQuality(state, comparison),
    auditEvents: [...(state.auditEvents || []), { id: cryptoId("audit"), actor: "Administrador demo", action: "comparo_real_vs_sintetico", targetId: comparison.id, createdAt: now() }],
  });
}

export function proposeSyntheticCalibration(state, profileId) {
  const profile = (state.syntheticProfiles || []).find((item) => item.id === profileId) || state.syntheticProfiles?.[0];
  const comparison = state.realSyntheticComparisons?.[0];
  if (!profile || !comparison) return state;
  const proposal = submitCalibrationProposal(createCalibrationProposal({ comparison, profile, evidenceIds: (state.realSyntheticDemoEvidence || []).map((item) => item.id) }));
  return saveState({
    ...state,
    calibrationProposals: [proposal, ...(state.calibrationProposals || [])],
    auditEvents: [...(state.auditEvents || []), { id: cryptoId("audit"), actor: "Administrador demo", action: "propuso_calibracion", targetId: proposal.id, createdAt: now() }],
  });
}

export function approveSyntheticCalibration(state, proposalId) {
  const proposal = (state.calibrationProposals || []).find((item) => item.id === proposalId);
  const profile = (state.syntheticProfiles || []).find((item) => item.id === proposal?.profileId);
  if (!proposal || !profile) return state;
  const approved = approveCalibrationProposal(proposal);
  const applied = applyCalibrationProposal(profile, approved);
  return saveState({
    ...state,
    syntheticProfiles: state.syntheticProfiles.map((item) => item.id === profile.id ? applied.profile : item),
    calibrationProposals: state.calibrationProposals.map((item) => item.id === proposalId ? applied.proposal : item),
    syntheticProfileVersions: [applied.versionRecord, ...(state.syntheticProfileVersions || [])],
    calibrationHistory: [applied.proposal, ...(state.calibrationHistory || [])],
  });
}

export function rejectSyntheticCalibration(state, proposalId) {
  return saveState({
    ...state,
    calibrationProposals: (state.calibrationProposals || []).map((item) => item.id === proposalId ? rejectCalibrationProposal(item) : item),
  });
}

export function revertSyntheticCalibration(state, profileId) {
  const profile = (state.syntheticProfiles || []).find((item) => item.id === profileId);
  const version = (state.syntheticProfileVersions || []).find((item) => item.profileId === profileId && item.rollbackAvailable);
  if (!profile || !version) return state;
  const reverted = revertCalibration(profile, version, state.syntheticProfileVersions || []);
  return saveState({
    ...state,
    syntheticProfiles: state.syntheticProfiles.map((item) => item.id === profileId ? reverted.profile : item),
    syntheticProfileVersions: reverted.history,
  });
}

function normalizeState(state) {
  const missions = (state.missions || []).map((mission) => {
    const normalizedMission = mission.id === "mis_01"
      ? {
          ...mission,
          requiredProfile: {
            ...(mission.requiredProfile || {}),
            os: ["Android", "iOS"],
            digitalExperience: ["Basica", "Media", "Alta"],
          },
          instructions: "Toca el boton Consultar ahora en el prototipo, revisa el mensaje de resultado y cuentanos si la experiencia es clara, facil y confiable.",
          questions: [
            { id: "mis_01_q1", label: "Despues de tocar Consultar ahora, que tan facil fue entender el resultado?", type: "text" },
            { id: "mis_01_q2", label: "Que parte del mensaje te dio mas claridad o te genero duda?", type: "text" },
            { id: "mis_01_q3", label: "Que cambiarias antes de lanzar esta consulta?", type: "text" },
          ],
        }
      : mission;
    return {
      ...normalizedMission,
      status: normalizeMissionStatus(normalizedMission.status),
      levels: normalizedMission.levels?.length ? normalizedMission.levels : [normalizedMission.minLevel || "Explorador"],
      participantMode: normalizedMission.participantMode || "real",
      evidencePolicy: normalizedMission.evidencePolicy || {
        evidenceType: "realEvidence",
        requiresRealValidation: false,
        realValidationStatus: "not_required",
      },
    };
  });
  const seed = createSeedState();
  const comparisonMission = seed.missions.find((mission) => mission.id === "mis_06");
  if (comparisonMission && !missions.some((mission) => mission.id === comparisonMission.id)) missions.push(comparisonMission);
  const invitations = [...(state.invitations || [])];
  const comparisonInvitation = seed.invitations.find((invitation) => invitation.id === "inv_06");
  if (comparisonInvitation && !invitations.some((invitation) => invitation.id === comparisonInvitation.id)) invitations.push(comparisonInvitation);
  return {
    ...state,
    schemaVersion: 3,
    missions,
    invitations,
    behaviorEvents: state.behaviorEvents || [],
    auditEvents: state.auditEvents || [],
    impactStories: state.impactStories || [],
    syntheticArchetypes: mergeSyntheticArchetypes(state.syntheticArchetypes),
    syntheticCohorts: mergeById(initialSyntheticCohorts, state.syntheticCohorts),
    syntheticProfiles: mergeById(initialSyntheticProfiles, state.syntheticProfiles),
    syntheticProfileVersions: state.syntheticProfileVersions || initialSyntheticProfileVersions,
    syntheticVariants: state.syntheticVariants || [],
    syntheticSimulations: state.syntheticSimulations || [],
    syntheticAggregates: state.syntheticAggregates || (state.syntheticSimulations || []).map((item) => item.aggregate).filter(Boolean),
    syntheticSessions: state.syntheticSessions || [],
    syntheticFindings: state.syntheticFindings || [],
    realSyntheticDemoEvidence: state.realSyntheticDemoEvidence || demoRealSyntheticEvidence,
    realSyntheticComparisons: state.realSyntheticComparisons || [],
    calibrationProposals: state.calibrationProposals || [],
    calibrationHistory: state.calibrationHistory || [],
    modelQualityMetrics: state.modelQualityMetrics || {
      comparisonCount: 0,
      overallCalibrationScore: 0,
      level: "uncalibrated",
      thresholds: { moderate: 0.68, high: 0.86, minimumComparisonsForHigh: 8 },
      updatedAt: now(),
    },
  };
}

function mergeSyntheticArchetypes(stored = []) {
  const byId = new Map(initialSyntheticArchetypes.map((item) => [item.id, item]));
  stored.forEach((item) => byId.set(item.id, { ...byId.get(item.id), ...item }));
  return [...byId.values()];
}

function mergeById(initial, stored = []) {
  const byId = new Map((initial || []).map((item) => [item.id, item]));
  (stored || []).forEach((item) => byId.set(item.id, { ...byId.get(item.id), ...item }));
  return [...byId.values()];
}

function updateModelQuality(state, comparison) {
  const previous = state.modelQualityMetrics || { comparisonCount: 0, overallCalibrationScore: 0 };
  const comparisonCount = previous.comparisonCount + 1;
  const overallCalibrationScore = Number((((previous.overallCalibrationScore || 0) * previous.comparisonCount + comparison.overallCalibrationScore) / comparisonCount).toFixed(2));
  return {
    comparisonCount,
    overallCalibrationScore,
    decisionMatch: comparison.decisionMatch,
    topicMatch: comparison.topicMatch,
    channelMatch: comparison.channelMatch,
    incentiveMatch: comparison.incentiveMatch,
    effortMatch: comparison.effortMatch,
    distributionDistance: comparison.distributionDistance,
    level: comparisonCount < 1 ? "uncalibrated" : comparisonCount < 3 ? "initial_calibration" : overallCalibrationScore >= 0.68 ? "moderate_calibration" : "needs_review",
    updatedAt: now(),
    thresholds: { moderate: 0.68, high: 0.86, minimumComparisonsForHigh: 8 },
  };
}
