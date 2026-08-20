import assert from "node:assert/strict";
import { aggregateSyntheticResults, normalizeProfileWeights } from "../src/synthetic-aggregation.mjs";
import { initialSyntheticProfiles } from "../src/synthetic-profiles.mjs";

export function runSyntheticAggregationTests() {
  const profiles = initialSyntheticProfiles.slice(0, 2);
  const weights = normalizeProfileWeights(profiles, [
    { profileId: profiles[0].id, configuredWeight: 80, generatedCount: 1 },
    { profileId: profiles[1].id, configuredWeight: 20, generatedCount: 1 },
  ]);
  assert.equal(Number(weights.reduce((sum, item) => sum + item.configuredWeight, 0).toFixed(2)), 1);

  const simulation = {
    simulationId: "syn_weighted",
    profileWeights: weights,
    sessions: [
      { profileId: profiles[0].id, finalDecision: "accept", themes: ["beneficio"], barriers: ["privacyConcern"], motivations: ["redeemablePoints"], preferredChannel: "WhatsApp", responses: [{ question: "q", observableBehavior: "aceptacion", answer: "si" }] },
      { profileId: profiles[1].id, finalDecision: "reject", themes: ["tiempo"], barriers: ["lackOfTime"], motivations: ["economicReward"], preferredChannel: "llamada", responses: [{ question: "q", observableBehavior: "rechazo", answer: "no" }] },
    ],
  };
  const aggregate = aggregateSyntheticResults(simulation);
  assert.equal(aggregate.rawDecisionDistribution.accept, 1);
  assert.equal(aggregate.rawDecisionDistribution.reject, 1);
  assert.equal(aggregate.weightedDecisionDistribution.accept, 0.8);
  assert.equal(aggregate.weightedDecisionDistribution.reject, 0.2);
  assert.ok(aggregate.resultsByProfile[profiles[0].id]);
}
