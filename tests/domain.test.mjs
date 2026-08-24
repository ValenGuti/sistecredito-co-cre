import assert from "node:assert/strict";
import { analyzeFeedbackQuality, approveParticipation, buildParticipantResponseExport, calculateLevel, changeParticipationStatus, detectFatigue, filterEligibleParticipants, missionExecutionAverage, missionStateActions, missionSummary, normalizeMissionStatus, participantResponseExportToCsv, recommendInvitations, summarizeBehaviorEvents, transitionMissionStatus } from "../src/domain.mjs";
import { createSeedState } from "../src/seed-data.mjs";

export function runDomainTests() {
  assert.equal(calculateLevel(0).name, "Explorador");
  assert.equal(calculateLevel(300).name, "Cocreador");
  assert.equal(calculateLevel(1000).name, "Especialista");
  assert.equal(calculateLevel(2500).name, "Embajador");

  const state = createSeedState();
  const before = state.participants.find((p) => p.id === "ali_02").points;
  const next = approveParticipation(state, "par_02");
  const after = next.participants.find((p) => p.id === "ali_02").points;
  assert.equal(after - before, 2500);
  assert.equal(next.rewardTransactions.at(-1).amount, 2500);

  assert.equal(recommendInvitations(10, 0.4), 25);
  assert.equal(recommendInvitations(7, 0.5), 14);

  const mission = state.missions.find((m) => m.id === "mis_01");
  const eligible = filterEligibleParticipants(state.participants, mission);
  assert.ok(eligible.some((p) => p.id === "cli_01"));
  assert.ok(eligible.every((p) => p.type === "cliente"));
  assert.ok(eligible.every((p) => ["Android", "iOS"].includes(p.device.os)));

  const participant = state.participants.find((p) => p.id === "cli_01");
  const fatigue = detectFatigue(participant, state.invitations, state.participations, mission);
  assert.equal(fatigue.hasRisk, true);
  assert.ok(fatigue.alerts.some((alert) => alert.includes("tres invitaciones")));

  const participation = state.participations.find((p) => p.id === "par_02");
  assert.equal(changeParticipationStatus(participation, "aclaracion").status, "aclaracion");
  assert.throws(() => changeParticipationStatus(participation, "rechazada"), /razon/i);

  const behavior = summarizeBehaviorEvents(state.behaviorEvents, "mis_01");
  assert.ok(behavior.totalClicks > 0);
  assert.equal(behavior.topButtons[0][0], "Consultar ahora");
  assert.ok(behavior.heatmapPoints.every((point) => point.x >= 0 && point.x <= 100));

  assert.equal(normalizeMissionStatus("activa"), "activo");
  assert.ok(missionStateActions("creado").includes("cancelar"));
  assert.ok(!missionStateActions("activo").includes("cancelar"));
  assert.equal(transitionMissionStatus({ status: "creado" }, "reclutando").status, "reclutando");
  assert.throws(() => transitionMissionStatus({ status: "activo" }, "cancelado"), /No es posible/);

  const execution = missionExecutionAverage(state.missions);
  assert.ok(execution.count >= 1);
  assert.ok(execution.days >= 0);
  const summary = missionSummary(state, "mis_01");
  assert.ok(summary.invited >= summary.accepted);
  const quality = analyzeFeedbackQuality(state.participations, state.submissions);
  assert.ok(quality.score >= 0 && quality.score <= 100);
  assert.equal(quality.provisional, true);
  const exported = buildParticipantResponseExport(state, "ali_02", "2026-08-24T12:00:00.000Z");
  assert.ok(exported.responses.length > 0);
  assert.equal(Object.hasOwn(exported.participant, "password"), false);
  assert.match(participantResponseExportToCsv(exported), /missionName/);
}

