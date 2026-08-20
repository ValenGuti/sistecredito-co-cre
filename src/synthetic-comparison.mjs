export const demoRealSyntheticEvidence = [
  {
    id: "real_demo_01",
    sourceType: "real_desidentified_demo",
    profileId: "prof_amante_urbano_25_45",
    consentVerified: true,
    desidentified: true,
    finalDecision: "conditional",
    themes: ["beneficio", "claridad", "canal"],
    barriers: ["privacyConcern"],
    motivations: ["redeemablePoints", "helpingImproveProduct"],
    preferredChannel: "WhatsApp",
    acceptedDurationMinutes: 15,
  },
  {
    id: "real_demo_02",
    sourceType: "real_desidentified_demo",
    profileId: "prof_amante_municipio_46_60",
    consentVerified: true,
    desidentified: true,
    finalDecision: "reject",
    themes: ["tiempo", "confianza"],
    barriers: ["lackOfTime", "privacyConcern"],
    motivations: ["economicReward"],
    preferredChannel: "llamada",
    acceptedDurationMinutes: 10,
  },
  {
    id: "real_demo_03",
    sourceType: "real_desidentified_demo",
    profileId: "prof_todero_rural",
    consentVerified: true,
    desidentified: true,
    finalDecision: "conditional",
    themes: ["operacion", "tiempo"],
    barriers: ["lackOfTime", "connectivity"],
    motivations: ["commercialBenefit"],
    preferredChannel: "llamada",
    acceptedDurationMinutes: 10,
  },
];

export function compareRealVsSynthetic(simulation, realEvidence = demoRealSyntheticEvidence) {
  const synthetic = simulation?.sessions || [];
  const eligibleReal = realEvidence.filter((item) => item.consentVerified && item.desidentified);
  const syntheticDistribution = distribution(synthetic, "finalDecision");
  const realDistribution = distribution(eligibleReal, "finalDecision");
  return {
    id: `cmp_${simulation?.simulationId || "sin_simulacion"}`,
    simulationId: simulation?.simulationId,
    realEvidenceCount: eligibleReal.length,
    syntheticSessionCount: synthetic.length,
    decisionMatch: matchScore(realDistribution, syntheticDistribution),
    topicMatch: listMatch(eligibleReal.flatMap((item) => item.themes || []), synthetic.flatMap((item) => item.themes || [])),
    channelMatch: matchScore(distribution(eligibleReal, "preferredChannel"), distribution(synthetic, "preferredChannel")),
    incentiveMatch: listMatch(eligibleReal.flatMap((item) => item.motivations || []), synthetic.flatMap((item) => item.motivations || [])),
    effortMatch: effortMatch(eligibleReal, synthetic),
    semanticSimilarity: null,
    overallCalibrationScore: 0,
    distributionDistance: distributionDistance(realDistribution, syntheticDistribution),
    differencesByOption: differencesByOption(realDistribution, syntheticDistribution),
    eligibleForCalibration: eligibleReal.length > 0 && synthetic.length > 0,
    disclaimer: "Metrica operativa inicial, no validacion cientifica.",
  };
}

export function finalizeComparison(comparison) {
  const parts = [comparison.decisionMatch, comparison.topicMatch, comparison.channelMatch, comparison.incentiveMatch, comparison.effortMatch];
  return {
    ...comparison,
    overallCalibrationScore: Number((parts.reduce((sum, item) => sum + item, 0) / parts.length).toFixed(2)),
  };
}

export function distributionDistance(realDistribution, syntheticDistribution) {
  const keys = [...new Set([...Object.keys(realDistribution), ...Object.keys(syntheticDistribution)])];
  if (!keys.length) return 0;
  const total = keys.reduce((sum, key) => sum + Math.abs((realDistribution[key] || 0) - (syntheticDistribution[key] || 0)), 0);
  return Number((total / keys.length).toFixed(2));
}

function differencesByOption(realDistribution, syntheticDistribution) {
  return Object.fromEntries([...new Set([...Object.keys(realDistribution), ...Object.keys(syntheticDistribution)])].map((key) => [
    key,
    Number(((realDistribution[key] || 0) - (syntheticDistribution[key] || 0)).toFixed(2)),
  ]));
}

function distribution(items, key) {
  const counts = {};
  items.forEach((item) => {
    counts[item[key] || "sin dato"] = (counts[item[key] || "sin dato"] || 0) + 1;
  });
  const total = items.length || 1;
  return Object.fromEntries(Object.entries(counts).map(([label, count]) => [label, Number((count / total).toFixed(2))]));
}

function matchScore(realDistribution, syntheticDistribution) {
  return Number((1 - distributionDistance(realDistribution, syntheticDistribution)).toFixed(2));
}

function listMatch(realItems, syntheticItems) {
  const real = new Set(realItems);
  const synthetic = new Set(syntheticItems);
  if (!real.size && !synthetic.size) return 0;
  const intersection = [...real].filter((item) => synthetic.has(item)).length;
  const union = new Set([...real, ...synthetic]).size;
  return Number((intersection / union).toFixed(2));
}

function effortMatch(realEvidence, synthetic) {
  const realAverage = average(realEvidence.map((item) => item.acceptedDurationMinutes));
  const syntheticAverage = average(synthetic.map((item) => item.acceptedDurationMinutes));
  if (!realAverage || !syntheticAverage) return 0.5;
  return Number(Math.max(0, 1 - Math.abs(realAverage - syntheticAverage) / 60).toFixed(2));
}

function average(values) {
  const valid = values.filter((item) => Number.isFinite(Number(item)));
  return valid.length ? valid.reduce((sum, item) => sum + Number(item), 0) / valid.length : 0;
}
