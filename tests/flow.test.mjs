import assert from "node:assert/strict";
import { approveParticipation } from "../src/domain.mjs";
import { createSeedState } from "../src/seed-data.mjs";
import { acceptInvitation, createMission, sendInvitations } from "../src/store.mjs";

export function runFlowTests() {
  const state = createSeedState();
  const client = state.participants.find((p) => p.id === "cli_01");
  const mission = state.missions.find((m) => m.id === "mis_03");
  const participation = {
    id: "par_demo",
    participantId: client.id,
    missionId: mission.id,
    missionType: mission.type,
    status: "pendiente_revision",
    durationMinutes: mission.durationMinutes,
    rating: 5,
    comments: "El mensaje B se entiende mejor.",
    evidence: "captura-demo.png",
    createdAt: "2026-07-22T12:00:00-05:00",
    updatedAt: "2026-07-22T12:00:00-05:00",
  };
  const pendingState = {
    ...state,
    participations: [...state.participations, participation],
    participants: state.participants.map((p) => (p.id === client.id ? { ...p, pendingPoints: p.pendingPoints + mission.points } : p)),
  };
  const pendingClient = pendingState.participants.find((p) => p.id === client.id);
  assert.equal(pendingClient.points, client.points);
  assert.equal(pendingClient.pendingPoints, client.pendingPoints + mission.points);
  const approved = approveParticipation(pendingState, "par_demo");
  const updatedClient = approved.participants.find((p) => p.id === client.id);
  assert.equal(updatedClient.points, client.points + mission.points);
  assert.equal(updatedClient.xp, client.xp + mission.xp);
  assert.equal(approved.participations.find((p) => p.id === "par_demo").status, "aprobada");

  const withSurvey = createMission(state, {
    name: "Encuesta de claridad", description: "Encuesta funcional", internalObjective: "Validar claridad", type: "Encuesta", audience: "ambos",
    startDate: "2026-08-24", deadline: "2026-09-05", durationMinutes: 8, requiredParticipants: 1, benefit: "500 puntos", points: 500, xp: 40,
    minLevel: "Explorador", levels: ["Explorador", "Cocreador", "Especialista", "Embajador"], requiredProfile: {}, instructions: "Responde las preguntas",
    questions: ["Que entendiste?", "Que mejorarias?"], recording: false, channel: "remota", publish: false, owner: "Equipo Producto", budget: 500,
  });
  const survey = withSurvey.missions[0];
  assert.equal(survey.status, "creado");
  const invited = sendInvitations(withSurvey, survey.id, ["cli_01"], "Correo");
  assert.equal(invited.invitations.filter((item) => item.missionId === survey.id).length, 1);
  assert.equal(invited.missions.find((item) => item.id === survey.id).status, "reclutando");
  const acceptedInvitation = acceptInvitation(invited, "cli_01", survey.id);
  assert.equal(acceptedInvitation.invitations.find((item) => item.missionId === survey.id).status, "aceptada");
}

