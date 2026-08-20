import assert from "node:assert/strict";
import { separateEvidenceMetrics } from "../src/domain.mjs";
import { createSyntheticVariant, convertSyntheticFindingsToRealMissionQuestions, runLocalSyntheticSession } from "../src/synthetic-engine.mjs";
import { initialSyntheticArchetypes } from "../src/synthetic-archetypes.mjs";
import { createSeedState } from "../src/seed-data.mjs";
import { runSyntheticSimulation } from "../src/store.mjs";

export function runSyntheticTests() {
  const state = createSeedState();
  const archetype = initialSyntheticArchetypes.find((item) => item.id === "arch_cliente_amante");
  const first = createSyntheticVariant(archetype, "seed-uno");
  const same = createSyntheticVariant(archetype, "seed-uno");
  const other = createSyntheticVariant(archetype, "seed-dos");
  assert.deepEqual(first.variation, same.variation);
  assert.notDeepEqual(first.variation, other.variation);
  assert.ok(first.inheritedAttributes.includes("valuesTrust"));

  const session = runLocalSyntheticSession({
    archetype,
    variant: first,
    scenario: { name: "Prueba" },
    instrument: { questions: ["Participarias en una prueba corta?"] },
    seed: "session-seed",
  });
  assert.equal(session.participantOrigin, "synthetic");
  assert.equal(session.responses[0].requiresRealValidation, true);
  assert.ok(!/% de los clientes|por ciento del mercado/i.test(JSON.stringify(session.responses)));

  const beforeMetrics = separateEvidenceMetrics(state);
  const next = runSyntheticSimulation(state);
  const afterMetrics = separateEvidenceMetrics(next);
  assert.equal(next.participants.length, state.participants.length);
  assert.equal(next.rewardTransactions.length, state.rewardTransactions.length);
  assert.equal(next.experienceTransactions.length, state.experienceTransactions.length);
  assert.equal(afterMetrics.realEvidence.participants, beforeMetrics.realEvidence.participants);
  assert.ok(afterMetrics.syntheticExploration.simulations > beforeMetrics.syntheticExploration.simulations);
  assert.ok(next.syntheticFindings.every((finding) => finding.requiresRealValidation));

  const custom = runSyntheticSimulation(state, {
    id: "syn_custom",
    name: "Prueba de entrevista propia",
    initiativeName: "Iniciativa distinta",
    objective: "Probar preguntas especificas de otra iniciativa.",
    instrumentType: "Entrevista",
    scenario: { name: "Escenario propio", context: "Nuevo prototipo" },
    archetypeIds: ["arch_cliente_amante"],
    variantsByArchetype: { arch_cliente_amante: 1 },
    clientQuestions: ["Que entiendes de este nuevo prototipo?"],
    allyQuestions: ["Que impacto tendria en tu comercio?"],
  });
  assert.equal(custom.syntheticSimulations[0].questions[0], "Que entiendes de este nuevo prototipo?");
  assert.equal(custom.syntheticSessions.at(-1).questions[0], "Que entiendes de este nuevo prototipo?");

  const collaborator = initialSyntheticArchetypes.find((item) => item.id === "arch_colaborador_producto");
  assert.equal(collaborator.audience, "colaborador");
  const collaboratorOnly = runSyntheticSimulation(state, {
    id: "syn_colaboradores",
    name: "Revision interna de iniciativa",
    initiativeName: "Prueba con equipo interno",
    objective: "Explorar riesgos internos antes de invitar participantes reales.",
    instrumentType: "Entrevista",
    scenario: { name: "Revision interna", context: "Iniciativa en discovery" },
    archetypeIds: ["arch_colaborador_producto"],
    variantsByArchetype: { arch_colaborador_producto: 1 },
    collaboratorQuestions: ["Que riesgo ves antes de probar esta iniciativa con personas reales?"],
  });
  assert.equal(collaboratorOnly.syntheticSimulations[0].questions[0], "Que riesgo ves antes de probar esta iniciativa con personas reales?");
  assert.equal(collaboratorOnly.syntheticSessions.at(-1).profile.audience, "colaborador");
  assert.match(collaboratorOnly.syntheticSessions.at(-1).profile.displayName, /^Colaborador S-/);

  const questions = convertSyntheticFindingsToRealMissionQuestions(next.syntheticSimulations[0]);
  assert.ok(questions.length > 0);
  assert.ok(questions.every((question) => question.requiresRealValidation));
}
