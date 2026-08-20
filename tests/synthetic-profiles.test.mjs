import assert from "node:assert/strict";
import { initialSyntheticProfiles } from "../src/synthetic-profiles.mjs";
import { createSyntheticSimulation } from "../src/synthetic-engine.mjs";

export function runSyntheticProfilesTests() {
  const amanteProfiles = initialSyntheticProfiles.filter((item) => item.archetypeId === "arch_cliente_amante");
  assert.ok(amanteProfiles.length >= 2);
  assert.notEqual(amanteProfiles[0].attributes.ageBand.value, amanteProfiles[1].attributes.ageBand.value);
  assert.notEqual(amanteProfiles[0].attributes.channelPreference.value, amanteProfiles[1].attributes.channelPreference.value);

  const simulation = createSyntheticSimulation({
    template: {
      id: "syn_profiles_test",
      name: "Perfiles test",
      initiativeName: "V2",
      objective: "Validar perfiles por arquetipo",
      instrumentType: "Entrevista",
      scenario: { name: "Test", context: "Test" },
      archetypeIds: ["arch_cliente_amante"],
      profileIds: amanteProfiles.map((item) => item.id),
      profileWeights: amanteProfiles.map((item, index) => ({ profileId: item.id, configuredWeight: index === 0 ? 0.7 : 0.3, generatedCount: 2 })),
      clientQuestions: ["Participarias?"],
    },
  });
  assert.equal(simulation.profileIds.length, 2);
  assert.equal(simulation.sessions.length, 4);
  assert.ok(simulation.sessions.every((session) => session.profileId));
  assert.notEqual(simulation.sessions[0].preferredChannel, simulation.sessions.at(-1).preferredChannel);
}
