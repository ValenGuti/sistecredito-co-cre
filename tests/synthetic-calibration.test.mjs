import assert from "node:assert/strict";
import { applyCalibrationProposal, approveCalibrationProposal, createCalibrationProposal, revertCalibration, submitCalibrationProposal } from "../src/synthetic-calibration.mjs";
import { compareRealVsSynthetic, demoRealSyntheticEvidence, distributionDistance, finalizeComparison } from "../src/synthetic-comparison.mjs";
import { initialSyntheticProfiles } from "../src/synthetic-profiles.mjs";

export function runSyntheticCalibrationTests() {
  const simulation = {
    simulationId: "syn_compare",
    sessions: [
      { profileId: "prof_amante_urbano_25_45", finalDecision: "accept", themes: ["beneficio"], motivations: ["redeemablePoints"], preferredChannel: "app", acceptedDurationMinutes: 20 },
      { profileId: "prof_amante_municipio_46_60", finalDecision: "conditional", themes: ["tiempo"], motivations: ["economicReward"], preferredChannel: "WhatsApp", acceptedDurationMinutes: 15 },
    ],
  };
  const comparison = finalizeComparison(compareRealVsSynthetic(simulation, demoRealSyntheticEvidence));
  assert.ok(comparison.decisionMatch <= 1);
  assert.ok(comparison.topicMatch <= 1);
  assert.equal(distributionDistance({ accept: 0.5 }, { accept: 0.25, reject: 0.25 }) >= 0, true);

  const profile = initialSyntheticProfiles[0];
  const proposal = submitCalibrationProposal(createCalibrationProposal({ comparison, profile, evidenceIds: ["real_demo_01"] }));
  assert.equal(proposal.status, "pending_review");
  const notApplied = applyCalibrationProposal(profile, proposal);
  assert.equal(notApplied.profile.version, "1.0");

  const approved = approveCalibrationProposal(proposal);
  const applied = applyCalibrationProposal(profile, approved);
  assert.equal(applied.proposal.status, "applied");
  assert.equal(applied.profile.version, "1.1");
  assert.equal(applied.versionRecord.previousVersion, "1.0");

  const reverted = revertCalibration(applied.profile, applied.versionRecord, [{ profileId: profile.id, version: "1.0", previousVersion: null }, applied.versionRecord]);
  assert.equal(reverted.profile.version, "1.0");
}
