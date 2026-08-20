import { initialSyntheticArchetypes } from "./synthetic-archetypes.mjs";
import { aggregateSyntheticResults, normalizeProfileWeights } from "./synthetic-aggregation.mjs";
import { initialSyntheticCohorts, initialSyntheticProfiles } from "./synthetic-profiles.mjs";
import { SYNTHETIC_PROMPT_VERSION, buildSyntheticPromptContract } from "./synthetic-prompts.mjs";

export const syntheticDisclaimer = "Resultado sintetico. Representa escenarios generados con los perfiles y ponderaciones configurados. No sustituye evidencia obtenida con clientes, aliados o colaboradores reales.";

const variantOptions = {
  trustInBrand: ["low", "medium", "high"],
  availableTime: ["very_low", "low", "medium", "high"],
  incentiveSensitivity: ["low", "medium", "high"],
  privacyConcern: ["low", "medium", "high"],
  digitalConfidence: ["low", "medium", "high"],
  priorTestingExperience: ["none", "informal", "frequent"],
  currentMood: ["calm", "rushed", "skeptical", "curious"],
  connectivity: ["unstable", "average", "stable"],
  relationshipWithSistecredito: ["weak", "functional", "strong"],
  responseDepth: ["brief", "moderate", "detailed"],
};

export const cocreaClientQuestions = [
  "Si Sistecredito te invitara a probar cosas nuevas antes de que salgan y te diera algo a cambio, te llamaria la atencion participar?",
  "Que tendria que darte a cambio para que valga la pena tu tiempo?",
  "Si pudieras canjear el beneficio en LuegoPago, te pareceria atractivo o te daria igual?",
  "Si participaras una vez, volverias el mes siguiente? Por que?",
  "Que te haria decidir que no quieres participar?",
  "Que medio preferirias: llamada, mensaje, presencial o video?",
];

export const cocreaAllyQuestions = [
  "Si Sistecredito te pidiera probar algo antes de lanzarlo, que esperarias recibir a cambio?",
  "Te resultaria mas util un beneficio comercial, visibilidad, formacion o acompanamiento?",
  "En que momento podrias dedicar entre 15 y 20 minutos sin afectar las ventas?",
  "Quien podria participar sin afectar la atencion?",
  "Que haria que no valiera la pena?",
  "Has vivido un cambio de Sistecredito en el punto de venta sin que te preguntaran antes?",
];

export const cocreaCollaboratorQuestions = [
  "Desde tu rol, que parte de esta iniciativa se entiende con mas claridad?",
  "Que riesgo ves si esto se prueba con clientes o aliados?",
  "Que informacion falta para tomar una decision sobre la iniciativa?",
  "Que cambiarias del mensaje, flujo o prototipo antes de llevarlo a personas reales?",
  "Que indicador o evidencia esperarias ver despues de la prueba?",
  "Que equipo deberia participar antes de avanzar?",
];

const genericQuestions = ["Que opinas de esta iniciativa y que dudas tendrias antes de participar?"];

export function createSyntheticVariant(archetype, seed, overrides = {}) {
  const random = seededRandom(`${archetype.id}-${seed}`);
  const profileAttributes = archetype.attributes ? valueMap(archetype.attributes) : {};
  const variation = Object.fromEntries(
    Object.entries(variantOptions).map(([key, values]) => [key, pick(values, random)]),
  );
  if (profileAttributes.trustInBrand) variation.trustInBrand = mapTrust(profileAttributes.trustInBrand);
  if (profileAttributes.digitalAdoption) variation.digitalConfidence = mapDigital(profileAttributes.digitalAdoption);
  if (profileAttributes.connectivity) variation.connectivity = profileAttributes.connectivity;
  if (profileAttributes.responseDepth) variation.responseDepth = profileAttributes.responseDepth;
  if (profileAttributes.lackOfTime >= 80) variation.availableTime = "very_low";
  if (profileAttributes.privacyConcern >= 70) variation.privacyConcern = "high";
  if (archetype.stableTraits?.timeConstrained) variation.availableTime = pick(["very_low", "low"], random);
  if (archetype.stableTraits?.valuesTrust) variation.privacyConcern = pick(["medium", "high"], random);
  if (archetype.stableTraits?.analytical) variation.responseDepth = pick(["moderate", "detailed"], random);
  const finalVariation = { ...variation, ...overrides };
  return {
    variantSeed: seed,
    variation: finalVariation,
    inheritedAttributes: Object.keys(archetype.stableTraits || {}),
    variedAttributes: Object.keys(finalVariation),
    humanVariation: {
      hesitationRate: finalVariation.currentMood === "skeptical" ? 0.45 : 0.22,
      clarificationRate: finalVariation.digitalConfidence === "low" ? 0.38 : 0.16,
      contradictionRate: 0.05,
      abandonmentProbability: finalVariation.availableTime === "very_low" ? 0.38 : 0.12,
      verbosity: finalVariation.responseDepth,
      tone: finalVariation.currentMood === "rushed" ? "rushed" : finalVariation.currentMood === "skeptical" ? "skeptical" : "neutral",
    },
  };
}

export function createSyntheticProfile(archetype, variant, index = 1) {
  if (archetype.attributes) {
    return {
      id: `syn_${archetype.id}_${String(index).padStart(3, "0")}`,
      participantOrigin: "synthetic",
      displayName: `Perfil sintetico ${archetype.name}-${String(index).padStart(3, "0")}`,
      audience: archetype.audience,
      profileId: archetype.id,
      cohortId: archetype.cohortId,
      archetypeId: archetype.archetypeId,
      archetypeVersion: archetype.archetypeVersion || "1.0",
      profileVersion: archetype.version,
      variantSeed: variant.variantSeed,
      variableState: variant.variation,
      scenarioContext: {},
      sourceDocuments: archetype.sourceReferences || [],
      confidenceLevel: sourceConfidence(archetype),
      calibrationLevel: archetype.calibrationLevel || "uncalibrated",
      generatedAt: fixedNow(),
      limitations: archetype.limitations,
      requiresRealValidation: true,
    };
  }
  const prefix = archetype.audience === "aliado" ? "Comercio S" : archetype.audience === "colaborador" ? "Colaborador S" : "Persona S";
  return {
    id: `syn_${archetype.name.toLowerCase()}_${String(index).padStart(3, "0")}`,
    participantOrigin: "synthetic",
    displayName: `${prefix}-${String(index).padStart(3, "0")}`,
    audience: archetype.audience,
    archetypeId: archetype.archetypeId || archetype.id,
    archetypeVersion: archetype.archetypeVersion || archetype.version,
    variantSeed: variant.variantSeed,
    variation: variant.variation,
    scenarioContext: {},
    sourceDocuments: archetype.sourceReferences,
    confidenceLevel: archetype.confidence,
    generatedAt: fixedNow(),
    limitations: archetype.knownLimits,
    requiresRealValidation: true,
  };
}

export function runLocalSyntheticSession({ archetype, variant, scenario, instrument, seed }) {
  const random = seededRandom(`${seed}-${archetype.id}-${variant.variantSeed}`);
  const questions = instrument.questions?.length ? instrument.questions : genericQuestions;
  const profile = createSyntheticProfile(archetype, variant, Math.ceil(random() * 99));
  const responses = questions.map((question, index) => responseForQuestion({ archetype, variant, question, index, random }));
  const abandoned = responses.some((response) => response.observableBehavior === "abandono");
  const accepted = !abandoned && responses.some((response) => response.observableBehavior === "aceptacion");
  const finalDecision = abandoned ? "abandon" : accepted && responses.some((response) => response.observableBehavior === "aclaracion") ? "conditional" : accepted ? "accept" : responses.some((response) => response.observableBehavior === "rechazo") ? "reject" : "conditional";
  return {
    id: `sess_${hash(`${seed}-${archetype.id}-${variant.variantSeed}`).slice(0, 8)}`,
    participantOrigin: "synthetic",
    profile,
    profileId: profile.profileId,
    cohortId: profile.cohortId,
    archetypeId: archetype.id,
    archetypeVersion: archetype.version,
    variantSeed: variant.variantSeed,
    engineMode: "local",
    promptVersion: SYNTHETIC_PROMPT_VERSION,
    promptContract: buildSyntheticPromptContract({ archetype, variant, scenario, instrument }),
    status: abandoned ? "abandono_simulado" : accepted ? "aceptacion_simulada" : "rechazo_o_duda_simulada",
    questions,
    responses,
    answers: responses,
    finalDecision,
    themes: inferThemes(responses),
    barriers: inferBarriers(responses, archetype, variant),
    motivations: inferMotivations(archetype, variant),
    preferredChannel: preferredChannel(archetype),
    acceptedDurationMinutes: acceptedDuration(archetype, variant),
    sourceConfidence: sourceConfidence(archetype),
    calibrationLevel: archetype.calibrationLevel || "uncalibrated",
    requiresRealValidation: true,
    createdAt: fixedNow(),
  };
}

export function createSyntheticSimulation({ archetypes = initialSyntheticArchetypes, cohorts = initialSyntheticCohorts, profiles = initialSyntheticProfiles, template = defaultSyntheticTemplate(), createdBy = "Administrador demo" } = {}) {
  const selected = template.archetypeIds.map((id) => archetypes.find((item) => item.id === id)).filter(Boolean);
  const selectedProfiles = selectProfiles({ profiles, template, selectedArchetypes: selected });
  const profileWeights = normalizeProfileWeights(selectedProfiles, template.profileWeights);
  const clientQuestions = normalizeQuestions(template.clientQuestions);
  const allyQuestions = normalizeQuestions(template.allyQuestions);
  const collaboratorQuestions = normalizeQuestions(template.collaboratorQuestions);
  const selectedAudiences = new Set((selectedProfiles.length ? selectedProfiles : selected).map((item) => item.audience));
  const archetypeById = new Map(archetypes.map((item) => [item.id, item]));
  const sessions = (selectedProfiles.length ? selectedProfiles : selected).flatMap((profileOrArchetype) => {
    const isProfile = Boolean(profileOrArchetype.attributes);
    const archetype = isProfile ? { ...archetypeById.get(profileOrArchetype.archetypeId), ...profileOrArchetype, id: profileOrArchetype.id } : profileOrArchetype;
    const generatedCount = profileWeights.find((item) => item.profileId === profileOrArchetype.id)?.generatedCount || template.variantsByArchetype[profileOrArchetype.id] || 1;
    const weight = profileWeights.find((item) => item.profileId === profileOrArchetype.id)?.configuredWeight || 0;
    return Array.from({ length: generatedCount || 1 }, (_, index) => {
      const seed = `${template.id}-${profileOrArchetype.id}-${index + 1}`;
      const variant = createSyntheticVariant(archetype, seed);
      const session = runLocalSyntheticSession({
        archetype,
        variant,
        scenario: template.scenario,
        instrument: { type: template.instrumentType, questions: questionsForAudience(archetype.audience, { clientQuestions, allyQuestions, collaboratorQuestions }) },
        seed,
      });
      return { ...session, weight };
    }).map((session) => ({ ...session, weight }));
  });
  const findings = generateSyntheticFindings(sessions);
  const simulation = {
    simulationId: template.id,
    missionId: template.missionId,
    name: template.name,
    initiativeName: template.initiativeName,
    objective: template.objective,
    participantMode: "synthetic",
    evidencePolicy: {
      evidenceType: "syntheticExploration",
      requiresRealValidation: true,
      realValidationStatus: "pending",
    },
    archetypeIds: selected.map((item) => item.id),
    archetypeVersions: Object.fromEntries(selected.map((item) => [item.id, item.version])),
    cohortIds: [...new Set(selectedProfiles.map((item) => item.cohortId).filter(Boolean))],
    profileIds: selectedProfiles.map((item) => item.id),
    profileWeights,
    sourceReferences: [...new Set(selected.flatMap((item) => item.sourceReferences))],
    variantSeeds: sessions.map((session) => session.variantSeed),
    promptVersions: [SYNTHETIC_PROMPT_VERSION],
    engineMode: "local",
    questions: questionsForSelectedAudiences(selectedAudiences, { clientQuestions, allyQuestions, collaboratorQuestions }),
    responses: sessions.flatMap((session) => session.responses),
    sessions,
    findings,
    limitations: [
      "No sustituye entrevistas, encuestas ni pruebas con clientes, aliados o colaboradores reales.",
      "No genera porcentajes representativos.",
      "Depende de arquetipos documentados que requieren revision de vigencia.",
    ],
    conclusion: "La simulacion permitio anticipar escenarios y mejorar el instrumento. No confirma la disposicion real de clientes, aliados o colaboradores para participar. La hipotesis sobre motivacion y recurrencia permanece pendiente de evidencia humana directa",
    createdBy,
    createdAt: fixedNow(),
    requiresRealValidation: true,
    realValidationStatus: "pending",
    disclaimer: syntheticDisclaimer,
  };
  return { ...simulation, aggregate: aggregateSyntheticResults(simulation) };
}

export function summarizeSyntheticSimulation(simulation) {
  const sessions = simulation.sessions || [];
  const countStatus = (name) => sessions.filter((session) => session.status === name).length;
  const barriers = countResponseTerms(sessions, ["tiempo", "datos", "claro", "beneficio", "ventas", "canje"]);
  return {
    totalSessions: sessions.length,
    archetypesUsed: [...new Set(sessions.map((session) => session.archetypeId))],
    acceptedScenarios: countStatus("aceptacion_simulada"),
    rejectedOrDoubtScenarios: countStatus("rechazo_o_duda_simulada"),
    abandonedScenarios: countStatus("abandono_simulado"),
    plausibleBarriers: barriers,
    requiresRealValidation: true,
  };
}

export function convertSyntheticFindingsToRealMissionQuestions(simulation) {
  return (simulation.findings || []).map((finding, index) => ({
    id: `real_validation_q_${index + 1}`,
    label: `Validar con personas reales: ${finding.title}`,
    type: "text",
    sourceFindingId: finding.id,
    requiresRealValidation: true,
  }));
}

export const syntheticEngine = {
  mode: "local",
  runSession(input) {
    return runLocalSyntheticSession(input);
  },
};

export function defaultSyntheticTemplate() {
  return {
    id: "syn_sim_cocrea_001",
    missionId: "mis_01",
    name: "Validacion exploratoria de la propuesta Sistecredito Co-crea",
    initiativeName: "Comunidad de testeo",
    objective: "Explorar motivaciones, barreras, incentivos y canales plausibles antes de realizar entrevistas con clientes y aliados reales.",
    instrumentType: "Entrevista",
    scenario: {
      name: "Co-crea - motivacion y participacion",
      context: "Invitacion a probar productos y experiencias antes de lanzarlas, con beneficios canjeables.",
    },
    clientQuestions: cocreaClientQuestions,
    allyQuestions: cocreaAllyQuestions,
    collaboratorQuestions: cocreaCollaboratorQuestions,
    profileIds: [
      "prof_amante_urbano_25_45",
      "prof_amante_municipio_46_60",
      "prof_cauteloso_ocasional",
      "prof_todero_rural",
      "prof_visionario_equipo",
    ],
    archetypeIds: [
      "arch_cliente_amante",
      "arch_cliente_cauteloso",
      "arch_cliente_novato",
      "arch_aliado_todero",
      "arch_aliado_visionario",
      "arch_aliado_comerciante",
    ],
    variantsByArchetype: {
      arch_cliente_amante: 2,
      arch_cliente_cauteloso: 2,
      arch_cliente_novato: 2,
      arch_aliado_todero: 2,
      arch_aliado_visionario: 2,
      arch_aliado_comerciante: 2,
    },
  };
}

function selectProfiles({ profiles, template, selectedArchetypes }) {
  if (template.profileIds?.length) return template.profileIds.map((id) => profiles.find((item) => item.id === id)).filter(Boolean);
  const selectedIds = new Set(selectedArchetypes.map((item) => item.id));
  return profiles.filter((profile) => selectedIds.has(profile.archetypeId)).slice(0, 6);
}

function valueMap(attributes = {}) {
  return Object.fromEntries(Object.entries(attributes).map(([key, item]) => [key, item?.value ?? item]));
}

function mapTrust(value) {
  if (value === "alta") return "high";
  if (value === "baja") return "low";
  return "medium";
}

function mapDigital(value) {
  if (value === "alta") return "high";
  if (value === "baja") return "low";
  return "medium";
}

function questionsForAudience(audience, questionSets) {
  if (audience === "aliado") return questionSets.allyQuestions;
  if (audience === "colaborador") return questionSets.collaboratorQuestions;
  return questionSets.clientQuestions;
}

function questionsForSelectedAudiences(audiences, questionSets) {
  return [
    ...(audiences.has("cliente") ? questionSets.clientQuestions : []),
    ...(audiences.has("aliado") ? questionSets.allyQuestions : []),
    ...(audiences.has("colaborador") ? questionSets.collaboratorQuestions : []),
  ];
}

function normalizeQuestions(questions) {
  const normalized = (Array.isArray(questions) ? questions : [])
    .map((question) => String(question).replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  return normalized.length ? normalized : genericQuestions;
}

function responseForQuestion({ archetype, variant, question, index, random }) {
  const variation = variant.variation;
  const lowTime = ["very_low", "low"].includes(variation.availableTime);
  const highPrivacy = variation.privacyConcern === "high";
  const lowDigital = variation.digitalConfidence === "low";
  const benefitSensitive = variation.incentiveSensitivity === "high";
  const isAlly = archetype.audience === "aliado";
  const isCollaborator = archetype.audience === "colaborador";
  let observableBehavior = "aclaracion";
  let answer = "Depende de que tan claro sea y cuanto tiempo me tome.";
  if (lowTime && random() < variant.humanVariation.abandonmentProbability) {
    observableBehavior = "abandono";
    answer = isAlly ? "Si me toca dejar la atencion del negocio, prefiero no hacerlo en ese momento." : "Si son muchos pasos, la verdad lo dejaria para despues.";
  } else if (highPrivacy && /datos|grabacion|invitar|participar/i.test(question)) {
    observableBehavior = "aclaracion";
    answer = "Antes de aceptar preguntaria para que van a usar mis datos y si eso queda grabado.";
  } else if (benefitSensitive && /beneficio|cambio|LuegoPago|canjear|recibir/i.test(question)) {
    observableBehavior = "aceptacion";
    answer = isAlly ? "Me sonaria si el beneficio ayuda al negocio o al equipo, no solo por participar." : "Si entiendo como usar el beneficio y me sirve en algo concreto, si me llamaria la atencion.";
  } else if (isCollaborator && /riesgo|equipo|indicador|evidencia|decision|prototipo|flujo|mensaje/i.test(question)) {
    observableBehavior = "aclaracion";
    answer = "Primero aclararia que decision quieren tomar con esta prueba y que evidencia necesitan para no quedarse solo en opiniones internas.";
  } else if (lowDigital && /medio|canal|prototipo|flujo|mensaje/i.test(question)) {
    observableBehavior = "aclaracion";
    answer = "Preferiria que me lo expliquen por WhatsApp o llamada, porque si el paso no es claro me puedo perder.";
  } else if (variation.currentMood === "skeptical") {
    observableBehavior = "rechazo";
    answer = "No diria que no de una, pero tendrian que explicarme muy bien para que sirve y que gano yo.";
  } else if (index % 3 === 0) {
    observableBehavior = "aceptacion";
    answer = isAlly ? "Si esta bien organizado y no afecta la venta, podria participar o delegarlo." : "Si es corto y claro, si podria probarlo una vez.";
  }
  return {
    question,
    answer: adaptDepth(answer, variation.responseDepth),
    observableBehavior,
    rationale: "Respuesta generada desde rasgos configurados del arquetipo y la variante; requiere contraste con personas reales.",
    archetypeTraitsUsed: Object.keys(archetype.stableTraits || {}).slice(0, 4),
    variantTraitsUsed: ["availableTime", "privacyConcern", "digitalConfidence", "incentiveSensitivity"].filter((key) => variation[key]),
    inferredElements: ["reaccion plausible no representativa"],
    confidence: archetype.confidence || "medium",
    contradictions: [],
    followUpSuggestions: followUps(observableBehavior),
    requiresRealValidation: true,
  };
}

function inferThemes(responses) {
  const text = responses.map((item) => `${item.question} ${item.answer}`).join(" ").toLowerCase();
  return [
    ["beneficio", /beneficio|puntos|canje|recibir/],
    ["privacidad", /datos|grabado|privacidad/],
    ["tiempo", /tiempo|pasos|despues|dura/],
    ["claridad", /claro|explicar|entiendo|mensaje/],
    ["canal", /whatsapp|llamada|app|presencial/],
    ["operacion", /venta|negocio|equipo|delegarlo/],
  ].filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function inferBarriers(responses, archetype, variant) {
  const text = responses.map((item) => item.answer).join(" ").toLowerCase();
  const barriers = [];
  if (/tiempo|pasos|despues|dura/.test(text) || variant.variation.availableTime === "very_low") barriers.push("lackOfTime");
  if (/datos|grabado|privacidad/.test(text) || variant.variation.privacyConcern === "high") barriers.push("privacyConcern");
  if (/explicar|perder|claro/.test(text)) barriers.push("complexity");
  if (variant.variation.connectivity === "unstable") barriers.push("connectivity");
  if (valueMap(archetype.attributes).operationalInterruptionRisk >= 75) barriers.push("operationalInterruptionRisk");
  return [...new Set(barriers)];
}

function inferMotivations(archetype, variant) {
  const attributes = valueMap(archetype.attributes);
  const motivations = [];
  if ((attributes.redeemablePoints || 0) >= 60 || variant.variation.incentiveSensitivity === "high") motivations.push("redeemablePoints");
  if ((attributes.economicReward || 0) >= 60) motivations.push("economicReward");
  if ((attributes.earlyAccess || 0) >= 60) motivations.push("earlyAccess");
  if ((attributes.commercialBenefit || 0) >= 60) motivations.push("commercialBenefit");
  if ((attributes.helpingImproveProduct || 0) >= 60) motivations.push("helpingImproveProduct");
  return motivations.length ? motivations : ["claridad"];
}

function preferredChannel(archetype) {
  const attrs = valueMap(archetype.attributes);
  return attrs.preferredContactChannel || attrs.channelPreference || archetype.communicationStyle?.channelPreference?.[0] || "mensaje";
}

function acceptedDuration(archetype, variant) {
  const max = Number(valueMap(archetype.attributes).maximumSessionMinutes || 20);
  if (variant.variation.availableTime === "very_low") return Math.min(10, max);
  if (variant.variation.availableTime === "low") return Math.min(15, max);
  return max;
}

function sourceConfidence(archetype) {
  if (!archetype.attributes) return archetype.confidence || "medium";
  const values = Object.values(archetype.attributes);
  if (values.some((item) => item.confidence === "low")) return "low";
  if (values.every((item) => item.confidence === "high")) return "high";
  return "medium";
}

function generateSyntheticFindings(sessions) {
  const findings = [
    ["syn_find_time", "El tiempo disponible aparece como barrera transversal", "anticipated_risk"],
    ["syn_find_privacy", "La privacidad y el uso de datos requieren explicacion temprana", "generated_hypothesis"],
    ["syn_find_benefit", "El beneficio debe ser concreto y facil de redimir", "design_finding"],
  ];
  return findings.map(([id, title, category]) => ({
    id,
    title,
    category,
    evidenceSource: "synthetic_exploration",
    sessionCount: sessions.length,
    requiresRealValidation: true,
    realValidationStatus: "pending",
  }));
}

function countResponseTerms(sessions, terms) {
  const text = sessions.flatMap((session) => session.responses.map((response) => response.answer)).join(" ").toLowerCase();
  return terms.map((term) => [term, text.split(term).length - 1]).filter(([, count]) => count > 0);
}

function adaptDepth(answer, depth) {
  if (depth === "brief") return answer.split(",")[0] || answer;
  if (depth === "detailed") return `${answer} Tambien preguntaria cuanto dura y que pasa despues con mi respuesta.`;
  return answer;
}

function followUps(behavior) {
  if (behavior === "abandono") return ["Validar horarios y longitud maxima de la actividad."];
  if (behavior === "rechazo") return ["Probar mensajes con beneficio y esfuerzo mas explicitos."];
  if (behavior === "aclaracion") return ["Agregar explicacion sobre datos, duracion y canal."];
  return ["Contrastar motivacion real con entrevistas o prueba piloto."];
}

function pick(values, random) {
  return values[Math.floor(random() * values.length)];
}

function seededRandom(seed) {
  let value = Number.parseInt(hash(seed).slice(0, 8), 16);
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function hash(input) {
  return String(input).split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) >>> 0, 2166136261).toString(16);
}

function fixedNow() {
  return "2026-08-03T12:00:00-05:00";
}
