import { cloneProfileWithVersion } from "./synthetic-profiles.mjs";

export function createCalibrationProposal({ comparison, profile, evidenceIds = [], createdBy = "Administrador demo" }) {
  const changes = proposeChanges(profile, comparison);
  return {
    id: `cal_${profile.id}_${String(Date.now()).slice(-6)}`,
    profileId: profile.id,
    status: "draft",
    previousVersion: profile.version,
    proposedVersion: nextVersion(profile.version),
    evidenceIds,
    differenceObserved: comparison?.distributionDistance ?? null,
    comparisonId: comparison?.id,
    changes,
    createdBy,
    createdAt: "2026-08-03T12:00:00-05:00",
    reviewedBy: null,
    reviewedAt: null,
    justification: "Ajuste propuesto desde comparacion real desidentificada vs. simulacion sintetica.",
    rollbackAvailable: false,
  };
}

export function submitCalibrationProposal(proposal) {
  return { ...proposal, status: "pending_review" };
}

export function approveCalibrationProposal(proposal, reviewer = "Administrador demo") {
  if (proposal.status !== "pending_review" && proposal.status !== "draft") return proposal;
  return {
    ...proposal,
    status: "approved",
    reviewedBy: reviewer,
    reviewedAt: "2026-08-03T12:00:00-05:00",
  };
}

export function rejectCalibrationProposal(proposal, reviewer = "Administrador demo", reason = "No aplica para esta iniciativa") {
  return {
    ...proposal,
    status: "rejected",
    reviewedBy: reviewer,
    reviewedAt: "2026-08-03T12:00:00-05:00",
    rejectionReason: reason,
  };
}

export function applyCalibrationProposal(profile, proposal, reviewer = "Administrador demo") {
  if (proposal.status !== "approved") {
    return { profile, proposal };
  }
  const nextProfile = cloneProfileWithVersion(profile, proposal.changes, reviewer);
  return {
    profile: nextProfile,
    proposal: {
      ...proposal,
      status: "applied",
      appliedAt: "2026-08-03T12:00:00-05:00",
      rollbackAvailable: true,
    },
    versionRecord: {
      profileId: profile.id,
      version: nextProfile.version,
      previousVersion: profile.version,
      changes: proposal.changes,
      calibrationSources: proposal.evidenceIds,
      approvedBy: reviewer,
      approvedAt: "2026-08-03T12:00:00-05:00",
      rollbackAvailable: true,
    },
  };
}

export function revertCalibration(profile, versionRecord, history = []) {
  if (!versionRecord?.rollbackAvailable) return { profile, history };
  const previous = [...history].reverse().find((item) => item.profileId === profile.id && item.version === versionRecord.previousVersion);
  if (!previous) return { profile, history };
  return {
    profile: {
      ...profile,
      version: previous.version,
      previousVersion: previous.previousVersion,
      updatedAt: "2026-08-03T12:00:00-05:00",
    },
    history: history.map((item) => item === versionRecord ? { ...item, revertedAt: "2026-08-03T12:00:00-05:00", rollbackAvailable: false } : item),
  };
}

export function modelQualityLevel(metrics) {
  const comparisons = metrics?.comparisonCount || 0;
  const score = metrics?.overallCalibrationScore || 0;
  if (comparisons < 1) return "uncalibrated";
  if (comparisons < 3) return "initial_calibration";
  if (score >= 0.86 && comparisons >= 8) return "high_calibration";
  if (score >= 0.68) return "moderate_calibration";
  return "needs_review";
}

function proposeChanges(profile, comparison) {
  const changes = [];
  if ((comparison?.differencesByOption?.reject || 0) > 0.15) {
    changes.push({ attribute: "privacyConcern", from: profile.attributes.privacyConcern?.value ?? 50, to: 70, reason: "La evidencia real muestra mas rechazo que la simulacion." });
  }
  if ((comparison?.channelMatch || 0) < 0.7) {
    changes.push({ attribute: "channelPreference", from: profile.attributes.channelPreference?.value ?? "sin dato", to: "llamada", reason: "El canal real difiere del sintetico en la comparacion demo." });
  }
  if (!changes.length) {
    changes.push({ attribute: "clarificationNeed", from: profile.attributes.clarificationNeed?.value ?? "medium", to: "medium", reason: "Mantener perfil y registrar revision humana sin cambio fuerte." });
  }
  return changes;
}

function nextVersion(version = "1.0") {
  const [major, minor] = String(version).split(".").map((item) => Number(item));
  return `${major || 1}.${(minor || 0) + 1}`;
}
