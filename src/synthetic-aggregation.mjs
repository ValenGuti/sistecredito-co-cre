export function normalizeProfileWeights(profiles, configured = []) {
  const selectedProfiles = profiles.filter(Boolean);
  const manual = new Map((configured || []).map((item) => [item.profileId, item]));
  const raw = selectedProfiles.map((profile) => ({
    profileId: profile.id,
    generatedCount: manual.get(profile.id)?.generatedCount || 1,
    configuredWeight: manual.has(profile.id) ? Number(manual.get(profile.id).configuredWeight) : Number(profile.defaultWeight || 0),
    weightSource: manual.has(profile.id) ? "manual" : profile.defaultWeight ? "estimated" : "uniform",
    sourceReference: manual.has(profile.id) ? "Configuracion de simulacion" : "Perfil inicial de demostracion",
    confidence: profile.defaultWeight ? "medium" : "low",
  }));
  const total = raw.reduce((sum, item) => sum + item.configuredWeight, 0);
  const denominator = total > 0 ? total : raw.length || 1;
  return raw.map((item) => ({
    ...item,
    configuredWeight: Number((item.configuredWeight / denominator).toFixed(4)),
  }));
}

export function aggregateSyntheticResults(simulation) {
  const sessions = simulation.sessions || [];
  const weights = new Map((simulation.profileWeights || []).map((item) => [item.profileId, item.configuredWeight]));
  const weightedDecisionDistribution = weightedCounts(sessions, (session) => session.finalDecision, weights);
  return {
    simulationId: simulation.simulationId,
    totalGeneratedScenarios: sessions.length,
    weightedDecisionDistribution,
    rawDecisionDistribution: rawCounts(sessions, (session) => session.finalDecision),
    weightedThemes: weightedList(sessions, "themes", weights),
    weightedBarriers: weightedList(sessions, "barriers", weights),
    weightedMotivations: weightedList(sessions, "motivations", weights),
    weightedChannels: weightedCounts(sessions, (session) => session.preferredChannel || "sin canal", weights),
    resultsByArchetype: groupWeighted(sessions, "archetypeId", weights),
    resultsByCohort: groupWeighted(sessions, "cohortId", weights),
    resultsByProfile: groupWeighted(sessions, "profileId", weights),
    resultsByQuestion: aggregateQuestions(sessions, weights),
    sourceConfidenceSummary: rawCounts(sessions, (session) => session.sourceConfidence || "medium"),
    limitations: [
      "Estos porcentajes corresponden a los pesos configurados para esta simulacion.",
      "No son una medicion de la poblacion real.",
      "La validacion real permanece pendiente.",
    ],
    realValidationStatus: "pending",
  };
}

export function percentage(value) {
  return `${Math.round((Number(value) || 0) * 100)} %`;
}

function sessionWeight(session, weights) {
  return Number(session.weight ?? weights.get(session.profileId) ?? 0);
}

function weightedCounts(sessions, getter, weights) {
  const result = {};
  sessions.forEach((session) => {
    const key = getter(session) || "sin dato";
    result[key] = (result[key] || 0) + sessionWeight(session, weights);
  });
  return roundObject(result);
}

function rawCounts(sessions, getter) {
  const result = {};
  sessions.forEach((session) => {
    const key = getter(session) || "sin dato";
    result[key] = (result[key] || 0) + 1;
  });
  return result;
}

function weightedList(sessions, key, weights) {
  const result = {};
  sessions.forEach((session) => {
    (session[key] || []).forEach((item) => {
      result[item] = (result[item] || 0) + sessionWeight(session, weights);
    });
  });
  return Object.entries(roundObject(result)).sort((a, b) => b[1] - a[1]).map(([label, weight]) => ({ label, weight }));
}

function groupWeighted(sessions, key, weights) {
  const grouped = {};
  sessions.forEach((session) => {
    const group = session[key] || "sin dato";
    grouped[group] ||= { count: 0, weightedDecisionDistribution: {} };
    grouped[group].count += 1;
    const decision = session.finalDecision || "sin dato";
    grouped[group].weightedDecisionDistribution[decision] = (grouped[group].weightedDecisionDistribution[decision] || 0) + sessionWeight(session, weights);
  });
  Object.values(grouped).forEach((item) => {
    item.weightedDecisionDistribution = roundObject(item.weightedDecisionDistribution);
  });
  return grouped;
}

function aggregateQuestions(sessions, weights) {
  const result = {};
  sessions.forEach((session) => {
    (session.responses || []).forEach((response, index) => {
      const questionId = `q_${index + 1}`;
      result[questionId] ||= { question: response.question, distribution: {}, examples: [], confidence: "medium" };
      result[questionId].distribution[response.observableBehavior] = (result[questionId].distribution[response.observableBehavior] || 0) + sessionWeight(session, weights);
      if (result[questionId].examples.length < 3) result[questionId].examples.push(response.answer);
    });
  });
  Object.values(result).forEach((item) => {
    item.distribution = roundObject(item.distribution);
  });
  return result;
}

function roundObject(input) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, Number(value.toFixed(4))]));
}
