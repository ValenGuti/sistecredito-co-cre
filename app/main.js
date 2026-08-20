import { clearAuthSession, createRegisteredAuthUser, loadAuthSession, loadAuthUsers, roleLabels, saveAuthSession, saveAuthUsers, updateAuthUser, validateLogin } from "../src/auth.mjs";
import { approveFromStore, approveSyntheticCalibration, completeCommunityProfile, createMission, createRealSyntheticComparison, createRegisteredParticipant, duplicateMission, loadState, proposeSyntheticCalibration, recordBehaviorEvent, rejectParticipation, rejectSyntheticCalibration, resetState, revertSyntheticCalibration, runSyntheticSimulation, sendInvitations, setRole, setSessionRole, submitMission } from "../src/store.mjs";
import { detectFatigue, filterEligibleParticipants, levelProgress, matchParticipant, recommendInvitations, separateEvidenceMetrics, summarizeBehaviorEvents } from "../src/domain.mjs";
import { percentage } from "../src/synthetic-aggregation.mjs";
import { cocreaAllyQuestions, cocreaClientQuestions, cocreaCollaboratorQuestions, defaultSyntheticTemplate, summarizeSyntheticSimulation, syntheticDisclaimer } from "../src/synthetic-engine.mjs";

let state = loadState();
let view = "inicio";
let selectedMissionId = null;
let missionStep = "detail";
let runStep = 0;
let wizardStep = 0;
let syntheticWizardStep = 0;
let syntheticLabView = "summary";
let draftMission = defaultMissionDraft();
let draftSynthetic = defaultSyntheticDraft();
let filters = { duration: "todas", type: "todas", benefit: "todos" };
let behaviorTrackingReady = false;
let prototypeTaskStatus = {};
let authUsers = loadAuthUsers();
let currentAuthUser = loadAuthSession();
let isAuthenticated = Boolean(currentAuthUser);
let loginError = "";
let authMode = "login";
let generatedCredentials = null;
let profileConsentError = "";
let adminParticipantQuery = "";
let profileMenuOpen = false;
let loginDraft = {
  email: "",
  password: "",
};
let registrationDraft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  role: "cliente",
};
let passwordDraft = {
  password: "",
  confirm: "",
};
let communityProfileDraft = {
  city: "",
  department: "",
  municipality: "",
  age: "",
  gender: "M",
  digitalExperience: "Basica",
  device: "Android",
  isSistecreditoUser: "Si",
  storeRole: "vendedor",
  storeName: "",
  operationCity: "",
  area: "",
  position: "",
};

const participantTabs = [
  ["inicio", "Inicio"],
  ["catalogo", "Catalogo"],
  ["redimir", "Redimir puntos"],
  ["perfil", "Perfil"],
  ["impacto", "Tu voz genera cambios"],
];
const adminTabs = [
  ["admin-dashboard", "Dashboard"],
  ["admin-laboratorio", "Laboratorio sintetico"],
  ["admin-participantes", "Participantes"],
  ["admin-misiones", "Misiones"],
  ["admin-crear", "Crear mision"],
  ["admin-invitaciones", "Invitaciones"],
  ["admin-comunidad", "Comunidad"],
  ["admin-revision", "Revision"],
  ["admin-comportamiento", "Comportamiento"],
];

export function renderApp() {
  if (typeof document === "undefined") return;
  const app = document.querySelector("#app");
  if (!isAuthenticated) {
    app.innerHTML = renderLogin();
    bindEvents(app);
    return;
  }
  if (currentAuthUser?.mustChangePassword) {
    app.innerHTML = renderPasswordChange();
    bindEvents(app);
    return;
  }
  app.innerHTML = shell();
  bindEvents(app);
  initBehaviorTracking();
}

function renderLogin() {
  return `
    <main class="login-screen">
      <section class="login-brand-panel">
        <div class="brand-lockup login-lockup" aria-label="Sistecredito Co-crea">
          <strong class="siste-logo"><span>siste</span><span>cr&eacute;dito</span></strong>
          <span class="brand-product">Co-crea</span>
        </div>
        <div class="login-copy">
          <p class="login-kicker">Comunidad de investigacion</p>
          <h1>Entra a tu portal Co-crea</h1>
          <p>Gestiona misiones, responde invitaciones y consulta beneficios desde un solo lugar.</p>
        </div>
        <div class="login-benefits">
          <span><strong>01</strong> Misiones y prototipos</span>
          <span><strong>02</strong> Comunidad segmentada</span>
          <span><strong>03</strong> Analitica de comportamiento</span>
          <span><strong>04</strong> Redencion de puntos</span>
        </div>
      </section>
      <section class="login-form-panel">
        <div class="login-card">
          <p class="demo-tag">Modo demostracion</p>
          <div class="auth-switch" role="tablist" aria-label="Tipo de acceso">
            <button class="${authMode === "login" ? "active" : ""}" data-auth-mode="login" type="button">Iniciar sesion</button>
            <button class="${authMode === "register" ? "active" : ""}" data-auth-mode="register" type="button">Registrarse</button>
          </div>
          ${authMode === "register" ? renderRegistrationForm() : authMode === "credentials" ? renderGeneratedCredentials() : renderLoginForm()}
        </div>
      </section>
    </main>
  `;
}

function renderLoginForm() {
  return `
    <form data-action="login-form" class="auth-panel">
      <h2>Iniciar sesion</h2>
      <p class="muted">Ingresa con un usuario de demostracion o con el usuario creado en el registro.</p>
      <label>Usuario
        <input data-login-field="email" value="${loginDraft.email}" autocomplete="username">
      </label>
      <label>Contrasena
        <input data-login-field="password" type="password" value="${loginDraft.password || ""}" autocomplete="current-password">
      </label>
      ${loginError ? `<p class="pill bad">${loginError}</p>` : ""}
      <button type="submit">Ingresar</button>
    </form>
  `;
}

function renderRegistrationForm() {
  return `
    <form data-action="register-form" class="auth-panel">
      <h2>Registrarse</h2>
      <p class="muted">Crea un acceso de demostracion. No se solicitan documentos ni informacion financiera.</p>
      <label>Nombre<input data-register-field="firstName" value="${registrationDraft.firstName}"></label>
      <label>Apellidos<input data-register-field="lastName" value="${registrationDraft.lastName}"></label>
      <label>Celular<input data-register-field="phone" value="${registrationDraft.phone}"></label>
      <label>Correo electronico<input data-register-field="email" value="${registrationDraft.email}"></label>
      <label>Rol
        <select data-register-field="role">
          <option value="cliente" ${registrationDraft.role === "cliente" ? "selected" : ""}>Cliente</option>
          <option value="aliado" ${registrationDraft.role === "aliado" ? "selected" : ""}>Aliado</option>
          <option value="empleado" ${registrationDraft.role === "empleado" ? "selected" : ""}>Empleado Sistecredito</option>
        </select>
      </label>
      ${loginError ? `<p class="pill bad">${loginError}</p>` : ""}
      <button type="submit">Crear usuario</button>
    </form>
  `;
}

function renderGeneratedCredentials() {
  if (!generatedCredentials) return renderRegistrationForm();
  return `
    <section class="auth-panel">
      <h2>Usuario creado</h2>
      <p class="muted">Guarda estos datos para iniciar sesion en la demo.</p>
      <div class="credential-box">
        <p><strong>Usuario:</strong> ${generatedCredentials.email}</p>
        <p><strong>Contrasena:</strong> ${generatedCredentials.password}</p>
        <p><strong>Rol:</strong> ${roleLabels[generatedCredentials.role]}</p>
      </div>
      <button data-action="go-login-with-generated">Ir a iniciar sesion</button>
    </section>
  `;
}

function renderPasswordChange() {
  return `
    <main class="registration-screen">
      <section class="card registration-card narrow">
        <p class="demo-tag">Primer ingreso</p>
        <h1>Cambia tu contrasena</h1>
        <p class="muted">Este paso aparece la primera vez que entras con un usuario creado desde registro.</p>
        <label>Nueva contrasena<input data-password-field="password" type="password" value="${passwordDraft.password}"></label>
        <label>Confirmar contrasena<input data-password-field="confirm" type="password" value="${passwordDraft.confirm}"></label>
        ${loginError ? `<p class="pill bad">${loginError}</p>` : ""}
        <div class="pill-row">
          <button data-action="change-password">Guardar contrasena</button>
          <button class="secondary" data-action="skip-password-change">Cambiar despues</button>
        </div>
      </section>
    </main>
  `;
}

function shell() {
  const isAdmin = isCurrentAdmin();
  const baseTabs = isAdmin ? adminTabs : participantTabs;
  const tabs = currentAuthUser?.profileCompleted ? baseTabs : [["complete-profile", "Completar mi perfil"], ...baseTabs];
  const profile = sessionProfile(isAdmin);
  if (!tabs.some(([id]) => id === view)) view = isAdmin ? "admin-dashboard" : "inicio";
  return `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <div class="brand-lockup" aria-label="Sistecredito Co-crea">
            <strong class="siste-logo topbar-logo"><span>siste</span><span>cr&eacute;dito</span></strong>
            <span class="brand-product">Co-crea</span>
          </div>
          <span class="demo-tag">Modo demostracion</span>
        </div>
        <div class="demo-controls">
          ${isAdmin ? `<label class="admin-search"><span class="sr-only">Buscar participantes</span>
            <input data-action="admin-search" value="${adminParticipantQuery}" placeholder="Buscar estudios, participante">
          </label>` : `<button class="topbar-catalog-link" data-view="redimir">Catalogo Luegopago</button>`}
          <button class="utility-action" data-action="notifications" aria-label="Ver notificaciones">
            <span aria-hidden="true"></span>
            <small>Notificaciones</small>
          </button>
          <button class="utility-action" data-action="help" aria-label="Abrir ayuda">
            <strong aria-hidden="true">?</strong>
            <small>Ayuda</small>
          </button>
          <div class="profile-menu">
            <button class="profile-trigger" data-action="toggle-profile-menu" aria-expanded="${profileMenuOpen}">
              <span class="profile-avatar" aria-hidden="true">${profile.initials}</span>
              <span class="profile-copy"><strong>${profile.name}</strong><small>${profile.subtitle}</small></span>
              <span class="profile-caret" aria-hidden="true">v</span>
            </button>
            ${profileMenuOpen ? `<div class="profile-dropdown">
              <button data-action="reset">Restablecer demo</button>
              <button data-action="logout">Cerrar sesion</button>
            </div>` : ""}
          </div>
        </div>
      </header>
      <p class="privacy-note">Tu participacion es voluntaria y no afecta tus productos, cupos ni condiciones con Sistecredito. Todos los datos de este prototipo son simulados.</p>
      <div class="layout">
        <aside class="sidebar">
          <nav aria-label="Navegacion principal">
            ${tabs.map(([id, label]) => `<button class="nav-button ${view === id ? "active" : ""}" data-view="${id}">${label}</button>`).join("")}
          </nav>
        </aside>
        <main class="main" id="app" tabindex="-1">${isAdmin ? renderAdmin() : renderParticipant()}</main>
      </div>
    </div>
  `;
}

function sessionProfile(isAdmin) {
  const participant = isAdmin ? null : currentParticipant();
  const name = currentAuthUser?.displayName || (isAdmin ? "Valentina Demo" : participant?.name || "Participante demo");
  const subtitle = currentAuthUser ? `${roleLabels[currentAuthUser.role]} Co-crea` : isAdmin ? "Administrador Co-crea" : state.currentRole === "aliado" ? "Aliado Co-crea" : "Cliente Co-crea";
  return {
    name,
    subtitle,
    initials: name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
  };
}

function renderParticipant() {
  const participant = currentParticipant();
  if (view === "complete-profile") return renderCompleteProfile();
  if (selectedMissionId) return renderMissionFlow(participant, missionById(selectedMissionId));
  if (view === "catalogo") return renderCatalog(participant);
  if (view === "redimir") return renderRewardsCatalog(participant);
  if (view === "perfil") return renderProfile(participant);
  if (view === "impacto") return renderImpact();
  return renderParticipantHome(participant);
}

function renderParticipantHome(participant) {
  const recommended = availableMissions(participant).filter((mission) => matchParticipant(participant, mission).eligible).slice(0, 3);
  const pending = state.participations.filter((item) => item.participantId === participant.id && item.status === "pendiente_revision");
  return `
    <section class="hero">
      <div class="hero-panel">
        <div class="hero-copy">
          <p class="demo-tag">Comunidad beta</p>
          <h1>Prueba antes que nadie y ayudanos a mejorar</h1>
          <p>Hola, ${participant.name}. Tu opinion ayuda a crear experiencias mas claras, simples y utiles para clientes y aliados.</p>
          <button class="hero-action" data-view="catalogo">Ver misiones disponibles</button>
        </div>
        <figure class="hero-brand-image">
          <img src="./assets/brand-extracted/image2.png" alt="Imagen de marca Sistecredito" />
        </figure>
      </div>
      <div class="quick-card">
        <h2>${participant.level}</h2>
        <p class="muted">${participant.xp} XP acumulada</p>
        <div class="progress" aria-label="Progreso de nivel"><span style="width:${levelProgress(participant.xp)}%"></span></div>
        <div class="grid two" style="margin-top:1rem">
          ${metric("Puntos", participant.points)}
          ${metric("Pendientes", participant.pendingPoints)}
        </div>
      </div>
    </section>
    <section class="grid three">
      ${metricCard("Nivel actual", participant.level, "Sigue participando para desbloquear insignias.")}
      ${metricCard("Confiabilidad", `${participant.reliability}/100`, "Independiente de si tu opinion es positiva o critica.")}
      ${metricCard("Proxima actividad", pending[0] ? "Revision pendiente" : "Sin agenda", pending[0] ? "El equipo validara tu aporte." : "Explora misiones recomendadas.")}
    </section>
    <div class="section-title"><h2>Misiones recomendadas</h2><button class="secondary" data-view="catalogo">Abrir catalogo</button></div>
    <section class="grid three">${recommended.map((mission) => missionCard(mission, participant)).join("")}</section>
    <div class="section-title"><h2>Beneficios disponibles</h2><button class="secondary" data-view="redimir">Ir a redimir</button></div>
    <section class="grid two">
      <article class="card reward-callout">
        <p class="demo-tag">Catalogo Luegopago</p>
        <h3>Usa tus puntos cuando termines misiones aprobadas</h3>
        <p class="muted">Este catalogo es provisional y simulado. Cuando compartas el catalogo real de Luegopago lo conecto con sus categorias y valores.</p>
      </article>
      ${metricCard("Puntos para redimir", participant.points, participant.type === "aliado" ? "Puntos Sonadores simulados" : "Puntos Co-crea")}
    </section>
    <div class="section-title"><h2>Resumen de impacto</h2></div>
    <section class="grid three">${state.impactStories.slice(0, 3).map(impactCard).join("")}</section>
  `;
}

function renderCatalog(participant) {
  const missions = availableMissions(participant).filter((mission) => {
    if (filters.duration === "corta" && mission.durationMinutes > 15) return false;
    if (filters.duration === "media" && (mission.durationMinutes <= 15 || mission.durationMinutes > 35)) return false;
    if (filters.duration === "larga" && mission.durationMinutes <= 35) return false;
    if (filters.type !== "todas" && mission.type !== filters.type) return false;
    if (filters.benefit === "alto" && mission.points < 1500) return false;
    return true;
  });
  return `
    <div class="section-title"><h1>Catalogo de misiones</h1></div>
    <div class="filters card">
      <label>Duracion
        <select data-filter="duration">
          ${option("todas", "Todas", filters.duration)}${option("corta", "Hasta 15 min", filters.duration)}${option("media", "16 a 35 min", filters.duration)}${option("larga", "Mas de 35 min", filters.duration)}
        </select>
      </label>
      <label>Tipo
        <select data-filter="type">
          ${option("todas", "Todos", filters.type)}${[...new Set(state.missions.map((m) => m.type))].map((type) => option(type, type, filters.type)).join("")}
        </select>
      </label>
      <label>Beneficio
        <select data-filter="benefit">${option("todos", "Todos", filters.benefit)}${option("alto", "1.500 puntos o mas", filters.benefit)}</select>
      </label>
      <button data-action="clear-filters">Limpiar filtros</button>
    </div>
    <section class="grid three" style="margin-top:1rem">${missions.map((mission) => missionCard(mission, participant)).join("")}</section>
  `;
}

function renderMissionFlow(participant, mission) {
  if (!mission) return `<div class="empty">La mision no esta disponible.</div>`;
  if (missionStep === "consent") return renderConsent(participant, mission);
  if (missionStep === "run") return renderRunMission(participant, mission);
  if (missionStep === "confirmation") return renderConfirmation(participant, mission);
  const match = matchParticipant(participant, mission);
  return `
    <button class="ghost" data-action="back-catalog">Volver</button>
    <div class="detail-layout" style="margin-top:1rem">
      <section class="card">
        <div class="pill-row">${missionPills(mission, match)}</div>
        <h1>${mission.name}</h1>
        <p>${mission.description}</p>
        <h2>Que se probara</h2>
        <p>${mission.internalObjective}</p>
        <h2>Que debes hacer</h2>
        <p>${mission.instructions}</p>
        <div class="prototype-box">${prototypePreview(mission, participant)}</div>
      </section>
      <aside class="card">
        <h2>Antes de aceptar</h2>
        <p><strong>Duracion:</strong> ${mission.durationMinutes} minutos</p>
        <p><strong>Beneficio:</strong> ${mission.benefit}</p>
        <p><strong>Fecha limite:</strong> ${mission.deadline}</p>
        <p><strong>Grabacion:</strong> ${mission.recording ? "Si, simulada para la demo" : "No"}</p>
        <p><strong>Confidencialidad:</strong> ${mission.confidentiality ? "Si" : "No"}</p>
        <p class="muted">Tratamiento de informacion: solo se usaran respuestas simuladas para aprender de esta prueba. Participar o no participar no afecta productos, cupos ni condiciones de credito.</p>
        ${match.eligible ? `<button data-action="start-consent">Quiero participar</button>` : `<div class="empty"><strong>No elegible por ahora</strong><br>${match.reasons.join("<br>")}</div>`}
      </aside>
    </div>
  `;
}

function renderConsent(participant, mission) {
  return `
    <button class="ghost" data-action="mission-detail">Volver al detalle</button>
    <section class="card" style="margin-top:1rem">
      <h1>Consentimiento de demostracion</h1>
      <p class="muted">Para continuar debes aceptar los puntos obligatorios de esta mision.</p>
      <div class="checks">
        ${check("voluntary", "Acepto participar de manera voluntaria.")}
        ${check("data", "Acepto el tratamiento de informacion de demostracion.")}
        ${mission.confidentiality ? check("confidentiality", "Acepto mantener confidencialidad sobre la prueba.") : ""}
        ${mission.recording ? check("recording", "Acepto la grabacion simulada para este prototipo.") : ""}
        ${check("adult", "Confirmo que soy mayor de edad para este prototipo.")}
      </div>
      <p id="consent-error" class="pill bad" hidden>Faltan consentimientos obligatorios.</p>
      <button data-action="accept-consent" data-mission="${mission.id}">Continuar a la prueba</button>
    </section>
  `;
}

function renderRunMission(participant, mission) {
  const titles = ["Introduccion", "Instrucciones", "Tarea o preguntas", "Evidencia simulada", "Comentario final", "Calificacion", "Confirmacion"];
  return `
    <button class="ghost" data-action="mission-detail">Volver al detalle</button>
    <section class="card" style="margin-top:1rem">
      <h1>${titles[runStep]}</h1>
      <div class="stepper">${titles.map((_, index) => `<span class="step ${index <= runStep ? "active" : ""}"></span>`).join("")}</div>
      ${runStepContent(mission, participant)}
      <div class="pill-row" style="margin-top:1rem">
        <button class="secondary" data-action="prev-run" ${runStep === 0 ? "disabled" : ""}>Anterior</button>
        ${runStep < titles.length - 1 ? `<button data-action="next-run">Siguiente</button>` : `<button data-action="submit-mission">Enviar feedback</button>`}
      </div>
    </section>
  `;
}

function runStepContent(mission, participant) {
  if (runStep === 0) return `<p>Gracias por aportar a ${mission.name}. Tu respuesta honesta es lo mas valioso.</p>`;
  if (runStep === 1) return `<p>${mission.instructions}</p><p class="muted">No compartas informacion personal, financiera ni documentos.</p>`;
  if (runStep === 2) return `${taskBrief(mission)}${prototypePreview(mission, participant)}<div class="form-grid" style="margin-top:1rem">${mission.questions.map((q, index) => `<label>${q.label}<textarea data-answer="${index}" placeholder="Escribe tu respuesta"></textarea></label>`).join("")}</div>`;
  if (runStep === 3) return `<label>Carga de evidencia simulada<input id="evidence" value="captura-demo-${mission.id}.png" /></label><p class="muted">No se sube ningun archivo real en esta version.</p>`;
  if (runStep === 4) return `<label>Comentario final<textarea id="final-comment" placeholder="Cuentanos que mejorarias"></textarea></label>`;
  if (runStep === 5) return `<label>Como calificas la experiencia?<select id="rating">${[1,2,3,4,5].map((n) => `<option value="${n}" ${n === 4 ? "selected" : ""}>${n} de 5</option>`).join("")}</select></label>`;
  return `<p>Tu aporte quedara en revision. Los puntos se asignaran cuando el equipo valide la participacion.</p>`;
}

function renderConfirmation(participant, mission) {
  const participation = state.participations.filter((item) => item.participantId === participant.id && item.missionId === mission.id).at(-1);
  return `
    <section class="card">
      <p class="pill warn">En revision</p>
      <h1>Tu aporte fue enviado</h1>
      <p>Gracias, ${participant.name}. El equipo revisara tu participacion antes de entregar ${mission.benefit} y ${mission.xp} XP.</p>
      <div class="grid two">
        ${metricCard("Estado", participation?.status.replace("_", " ") || "En revision", "Los puntos no se entregan inmediatamente.")}
        ${metricCard("Resumen", participation?.comments || "Feedback enviado", "Evidencia simulada registrada.")}
      </div>
      <button data-action="go-home">Regresar al inicio</button>
    </section>
  `;
}

function renderProfile(participant) {
  const history = state.participations.filter((item) => item.participantId === participant.id);
  return `
    <div class="section-title"><h1>Perfil, nivel y beneficios</h1></div>
    <section class="grid three">
      ${metricCard("Nivel", participant.level, `${participant.xp} XP acumulada`)}
      ${metricCard("Confiabilidad", `${participant.reliability}/100`, "No depende de opiniones favorables.")}
      ${metricCard("Puntos disponibles", participant.points, participant.type === "aliado" ? "Puntos Sonadores simulados" : "Puntos Co-crea")}
    </section>
    <section class="grid two" style="margin-top:1rem">
      <div class="card">
        <h2>Informacion de perfil</h2>
        <p><strong>Tipo:</strong> ${participant.type}</p>
        <p><strong>Ciudad:</strong> ${participant.city}, ${participant.department}</p>
        <p><strong>Dispositivo:</strong> ${participant.device.type} - ${participant.device.os}</p>
        <p><strong>Disponibilidad:</strong> ${participant.availability}</p>
        <p><strong>Preferencias:</strong> ${participant.preferredMissionTypes.join(", ")}</p>
        <button class="secondary" data-action="toggle-pause">${participant.status === "pausado" ? "Reactivar invitaciones" : "Pausar temporalmente invitaciones"}</button>
      </div>
      <div class="card">
        <h2>Historial</h2>
        ${history.length ? history.map((item) => `<p><span class="pill ${item.status === "aprobada" ? "ok" : item.status === "rechazada" ? "bad" : "warn"}">${item.status.replace("_", " ")}</span> ${missionById(item.missionId)?.name || "Mision"}</p>`).join("") : `<p class="empty">Aun no hay misiones completadas.</p>`}
        <h3>Insignias</h3>
        <div class="pill-row">${(participant.badges.length ? participant.badges : ["Nuevo cocreador"]).map((badge) => `<span class="pill info">${badge}</span>`).join("")}</div>
      </div>
    </section>
    <section class="card reward-strip" style="margin-top:1rem">
      <div>
        <p class="demo-tag">Luegopago</p>
        <h2>Redime tus puntos disponibles</h2>
        <p class="muted">Consulta beneficios, bonos o experiencias simuladas disponibles para tu perfil.</p>
      </div>
      <button data-view="redimir">Abrir catalogo</button>
    </section>
  `;
}

function renderCompleteProfile() {
  const role = currentAuthUser?.role || "cliente";
  const title = role === "aliado" ? "Completa tu perfil de aliado" : role === "empleado" ? "Completa tu perfil de empleado Sistecredito" : "Completa tu perfil de cliente";
  return `
    <div class="section-title">
      <div>
        <h1>${title}</h1>
        <p class="muted">Estos datos ayudan a invitarte a pruebas y misiones acordes con tu perfil.</p>
      </div>
      <span class="demo-tag">${roleLabels[role]}</span>
    </div>
    <section class="card">
      <form data-action="complete-profile-form">
        ${role === "aliado" ? renderAllyProfileFields() : role === "empleado" ? renderEmployeeProfileFields() : renderClientProfileFields()}
        <div class="checks profile-consents" style="margin-top:1rem">
          <label class="check"><input type="checkbox" data-profile-consent="voluntary"> Acepto participar de forma voluntaria.</label>
          <label class="check"><input type="checkbox" data-profile-consent="invitations"> Acepto recibir invitaciones de pruebas y misiones.</label>
          <label class="check"><input type="checkbox" data-profile-consent="conditions"> Entiendo que esto no afecta productos, cupos ni condiciones.</label>
        </div>
        ${profileConsentError ? `<p class="pill bad">${profileConsentError}</p>` : ""}
        <div class="pill-row" style="margin-top:1rem">
          <button type="submit">Guardar perfil</button>
        </div>
      </form>
    </section>
  `;
}

function renderClientProfileFields() {
  return `
    <div class="form-grid">
      <label>Departamento<input data-profile-field="department" value="${communityProfileDraft.department}"></label>
      <label>Municipio de residencia<input data-profile-field="municipality" value="${communityProfileDraft.municipality}"></label>
      <label>Edad<input data-profile-field="age" value="${communityProfileDraft.age}"></label>
      <label>Genero<select data-profile-field="gender">${option("M", "M", communityProfileDraft.gender)}${option("F", "F", communityProfileDraft.gender)}</select></label>
      <label>Experiencia digital<select data-profile-field="digitalExperience">${option("Basica", "Basica", communityProfileDraft.digitalExperience)}${option("Media", "Media", communityProfileDraft.digitalExperience)}${option("Alta", "Alta", communityProfileDraft.digitalExperience)}</select></label>
      <label>Dispositivo principal<select data-profile-field="device">${option("Android", "Android", communityProfileDraft.device)}${option("iOS", "IOS", communityProfileDraft.device)}${option("Computador", "Computador", communityProfileDraft.device)}</select></label>
      <label>Eres usuario Sistecredito<select data-profile-field="isSistecreditoUser">${option("Si", "Si", communityProfileDraft.isSistecreditoUser)}${option("No", "No", communityProfileDraft.isSistecreditoUser)}</select></label>
    </div>
  `;
}

function renderAllyProfileFields() {
  return `
    <div class="form-grid">
      <label>Rol en la tienda<select data-profile-field="storeRole">${option("vendedor", "vendedor", communityProfileDraft.storeRole)}${option("Administrador", "Administrador", communityProfileDraft.storeRole)}${option("supervisor", "supervisor", communityProfileDraft.storeRole)}</select></label>
      <label>Nombre de la tienda<input data-profile-field="storeName" value="${communityProfileDraft.storeName}"></label>
      <label>Ciudad de operacion<input data-profile-field="operationCity" value="${communityProfileDraft.operationCity}"></label>
    </div>
  `;
}

function renderEmployeeProfileFields() {
  return `
    ${renderClientProfileFields()}
    <div class="form-grid" style="margin-top:0.8rem">
      <label>Area a la que perteneces<input data-profile-field="area" value="${communityProfileDraft.area}"></label>
      <label>Cargo<input data-profile-field="position" value="${communityProfileDraft.position}"></label>
    </div>
  `;
}

function renderRewardsCatalog(participant) {
  return `
    <div class="section-title">
      <div>
        <h1>Catalogo Luegopago</h1>
        <p class="muted">Referencia visual del catalogo de redencion para la demo.</p>
      </div>
      <span class="session-pill">${participant.points} puntos disponibles</span>
    </div>
    <section class="catalog-reference">
      <img src="./assets/luegopago-catalog.svg" alt="Catalogo Luegopago de beneficios para redimir puntos" />
    </section>
    <p class="empty" style="margin-top:1rem">Esta vista es demostrativa. No descuenta puntos reales ni genera transacciones reales.</p>
  `;
}

function renderImpact() {
  return `
    <section class="impact-hero">
      <div>
        <p class="demo-tag">Impacto de la comunidad</p>
        <h1>Tu voz genera cambios</h1>
        <p>Cada respuesta ayuda a priorizar mejoras, aclarar dudas y probar experiencias antes de lanzarlas.</p>
      </div>
      <img src="./assets/brand-extracted/image0.png" alt="Imagen de marca sobre comunidad y confianza" />
    </section>
    <section class="grid three">${state.impactStories.map(impactCard).join("")}</section>
  `;
}

function renderAdmin() {
  if (view === "complete-profile") return renderCompleteProfile();
  if (view === "admin-participantes") return renderAdminParticipants();
  if (view === "admin-misiones") return renderAdminMissions();
  if (view === "admin-crear") return renderWizard();
  if (view === "admin-invitaciones") return renderInvitations();
  if (view === "admin-comunidad") return renderCommunity();
  if (view === "admin-revision") return renderReview();
  if (view === "admin-comportamiento") return renderBehaviorAnalytics();
  if (view === "admin-laboratorio") return renderSyntheticLab();
  return renderAdminDashboard();
}

function renderAdminDashboard() {
  const activeParticipants = state.participants.filter((p) => p.status === "activo").length;
  const pending = state.participations.filter((p) => p.status === "pendiente_revision").length;
  const points = state.rewardTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const evidence = separateEvidenceMetrics(state);
  return `
    <div class="section-title"><h1>Dashboard administrativo</h1></div>
    <section class="card synthetic-entry-card">
      <div>
        <p class="demo-tag">Nuevo modulo</p>
        <h2>Laboratorio sintetico</h2>
        <p>Simula entrevistas con arquetipos de clientes y aliados para preparar mejor una prueba real.</p>
      </div>
      <button data-view="admin-laboratorio">Abrir laboratorio</button>
    </section>
    <section class="grid four">
      ${metricCard("Testers registrados", state.participants.length, "Clientes y aliados ficticios")}
      ${metricCard("Activos ultimos 90 dias", activeParticipants, "Disponibles para invitar")}
      ${metricCard("Misiones activas", state.missions.filter((m) => m.status === "activa").length, "En ejecucion")}
      ${metricCard("Pendientes de revision", pending, "Requieren decision")}
      ${metricCard("Tasa de aceptacion", "48%", "Dato simulado")}
      ${metricCard("Finalizacion", "67%", "Dato simulado")}
      ${metricCard("Tiempo de muestra", "3,2 dias", "Promedio simulado")}
      ${metricCard("Puntos entregados", points, "Beneficios simulados")}
    </section>
    <div class="section-title"><h2>Separacion de evidencia</h2><span class="demo-tag">No mezclar metricas</span></div>
    <section class="grid three">
      <article class="card"><h3>Evidencia real</h3><p><strong>${evidence.realEvidence.participants}</strong> participantes reales de demo</p><p><strong>${evidence.realEvidence.completed}</strong> participaciones aprobadas</p><p><strong>${evidence.realEvidence.pointsDelivered.toLocaleString("es-CO")}</strong> puntos entregados</p></article>
      <article class="card"><h3>Exploracion sintetica</h3><p><strong>${evidence.syntheticExploration.simulations}</strong> simulaciones</p><p><strong>${evidence.syntheticExploration.scenarios}</strong> escenarios generados</p><p><strong>${evidence.syntheticExploration.pendingContrast}</strong> pendientes de contraste real</p></article>
      <article class="card"><h3>Datos de demostracion</h3><p><strong>${evidence.demoData.seedMissions}</strong> misiones seed</p><p><strong>${evidence.demoData.localBehaviorEvents}</strong> eventos locales</p><p class="muted">Datos ficticios para probar el prototipo.</p></article>
    </section>
    <section class="grid two" style="margin-top:1rem">
      ${chart("Participaciones por semana", [["Sem 1", 18], ["Sem 2", 26], ["Sem 3", 34], ["Sem 4", 29]])}
      ${chart("Participantes por nivel", [["Explorador", 9], ["Cocreador", 12], ["Especialista", 7], ["Embajador", 2]])}
      ${chart("Misiones por estado", [["Activa", 3], ["Reclutando", 1], ["Cerrada", 1], ["Borrador", state.missions.filter((m) => m.status === "borrador").length]])}
      ${chart("Calidad promedio del feedback", [["Util", 82], ["Claro", 76], ["Completo", 69], ["Con evidencia", 58]])}
    </section>
    <div class="section-title"><h2>Comportamiento en prototipos</h2><button class="secondary" data-view="admin-comportamiento">Ver mapa de calor</button></div>
    ${behaviorSummaryCard()}
    <div class="section-title"><h2>Busqueda rapida</h2><button class="secondary" data-view="admin-participantes">Buscar participantes</button></div>
    ${participantSearchSummary()}
  `;
}

function renderSyntheticLab() {
  const latest = state.syntheticSimulations?.[0];
  return `
    <div class="section-title">
      <div>
        <h1>Laboratorio sintetico</h1>
        <p class="muted">Explora escenarios con arquetipos sin mezclar resultados con evidencia real.</p>
      </div>
      <span class="demo-tag">Motor local</span>
    </div>
    <p class="synthetic-disclaimer">${syntheticDisclaimer}</p>
    <div class="tabs synthetic-tabs">
      ${[
        ["summary", "Resumen"],
        ["new", "Nueva simulacion"],
        ["simulations", "Simulaciones"],
        ["archetypes", "Biblioteca de arquetipos"],
        ["profiles", "Cohortes y perfiles"],
        ["weighted", "Resultados ponderados"],
        ["compare", "Comparador real vs. sintetico"],
        ["calibration", "Centro de calibracion"],
        ["quality", "Calidad del modelo"],
        ["trace", "Trazabilidad"],
      ].map(([id, label]) => `<button class="${syntheticLabView === id ? "active" : ""}" data-synthetic-view="${id}">${label}</button>`).join("")}
    </div>
    ${syntheticLabView === "new" ? renderSyntheticWizard() : syntheticLabView === "simulations" ? renderSyntheticSimulations() : syntheticLabView === "archetypes" ? renderSyntheticArchetypes() : syntheticLabView === "profiles" ? renderSyntheticProfiles() : syntheticLabView === "weighted" ? renderSyntheticWeighted(latest) : syntheticLabView === "compare" ? renderSyntheticComparator(latest) : syntheticLabView === "calibration" ? renderSyntheticCalibration() : syntheticLabView === "quality" ? renderSyntheticQuality() : syntheticLabView === "trace" ? renderSyntheticTrace(latest) : renderSyntheticSummary(latest)}
  `;
}

function renderSyntheticSummary(simulation) {
  const summary = simulation ? summarizeSyntheticSimulation(simulation) : null;
  return `
    <section class="grid four">
      ${metricCard("Simulaciones", state.syntheticSimulations?.length || 0, "Exploracion sintetica")}
      ${metricCard("Escenarios generados", state.syntheticSessions?.length || 0, "No son muestra estadistica")}
      ${metricCard("Arquetipos", state.syntheticArchetypes?.length || 0, "Biblioteca versionada")}
      ${metricCard("Pendientes de contraste", (state.syntheticFindings || []).filter((f) => f.requiresRealValidation).length, "Validacion real requerida")}
    </section>
    <section class="grid two" style="margin-top:1rem">
      <article class="card">
        <h2>${simulation?.name || "Sin simulaciones"}</h2>
        <p>${simulation?.objective || "Ejecuta una simulacion para generar escenarios sinteticos."}</p>
        ${summary ? `<p><strong>${summary.acceptedScenarios} de ${summary.totalSessions} escenarios generados</strong> muestran aceptacion simulada.</p><p><strong>${summary.abandonedScenarios} de ${summary.totalSessions} escenarios generados</strong> muestran abandono simulado.</p>` : ""}
        <button data-synthetic-view="new">Crear nueva simulacion</button>
      </article>
      <article class="card">
        <h2>Lectura metodologica</h2>
        <p>Los hallazgos sinteticos sirven para preparar mejores preguntas, detectar riesgos y anticipar objeciones plausibles.</p>
        <p class="muted">No confirman disposicion real de clientes, aliados o colaboradores para participar.</p>
      </article>
    </section>
    ${simulation ? `<div class="section-title"><h2>Hallazgos sinteticos</h2></div><section class="grid three">${simulation.findings.map(syntheticFindingCard).join("")}</section>` : ""}
  `;
}

function renderSyntheticWizard() {
  const steps = ["Objetivo", "Instrumento", "Perfiles", "Pesos", "Variaciones", "Preguntas", "Revision", "Ejecucion", "Resultados"];
  const selectedProfiles = (state.syntheticProfiles || []).filter((item) => draftSynthetic.profileIds.includes(item.id));
  const selectedArchetypes = state.syntheticArchetypes.filter((item) => draftSynthetic.archetypeIds.includes(item.id));
  return `
    <section class="card">
      <h2>Nueva simulacion</h2>
      <div class="stepper">${steps.map((_, index) => `<span class="step ${index <= syntheticWizardStep ? "active" : ""}"></span>`).join("")}</div>
      ${syntheticWizardStep === 0 ? `
        <div class="form-grid">
          <label>Nombre<input data-synthetic-draft="name" value="${draftSynthetic.name}"></label>
          <label>Iniciativa<input data-synthetic-draft="initiativeName" value="${draftSynthetic.initiativeName}"></label>
          <label>Objetivo<textarea data-synthetic-draft="objective">${draftSynthetic.objective}</textarea></label>
          <label>Responsable<input value="Administrador demo" disabled></label>
        </div>` : ""}
      ${syntheticWizardStep === 1 ? `<div class="form-grid"><label>Tipo de instrumento<select data-synthetic-draft="instrumentType">${["Entrevista","Encuesta","Pulso rapido","Prueba de mensaje","Evaluacion de prototipo","Evaluacion de flujo","Escenario narrativo","Simulacion tecnica"].map((item) => option(item, item, draftSynthetic.instrumentType)).join("")}</select></label><label>Contexto<textarea data-synthetic-scenario="context">${draftSynthetic.scenario.context}</textarea></label></div>` : ""}
      ${syntheticWizardStep === 2 ? `<p class="empty">Selecciona perfiles parametrizados. Puedes tener varias cohortes dentro del mismo arquetipo.</p><section class="grid three">${(state.syntheticProfiles || []).map((profile) => `<article class="card compact-card"><label class="check"><input type="checkbox" data-synthetic-profile="${profile.id}" ${draftSynthetic.profileIds.includes(profile.id) ? "checked" : ""}> ${profile.name}</label><p class="muted">${profile.audience} | ${profile.archetypeId} | v${profile.version}</p><p>${profile.attributes.city?.value || "Sin ciudad"} | ${profile.attributes.ageBand?.value || "Sin edad"}</p></article>`).join("")}</section>` : ""}
      ${syntheticWizardStep === 3 ? `<div class="table-wrap"><table><thead><tr><th>Perfil</th><th>Peso</th><th>Escenarios</th><th>Fuente</th></tr></thead><tbody>${selectedProfiles.map((profile) => { const weight = draftSynthetic.profileWeights.find((item) => item.profileId === profile.id); return `<tr><td>${profile.name}</td><td><input class="table-input" type="number" min="0" max="100" data-synthetic-weight="${profile.id}" value="${Math.round((weight?.configuredWeight ?? profile.defaultWeight ?? 0.1) * 100)}"> %</td><td><input class="table-input" type="number" min="1" max="20" data-synthetic-generated="${profile.id}" value="${weight?.generatedCount || 3}"></td><td>${weight?.weightSource || "estimated"}</td></tr>`; }).join("")}</tbody></table></div><p class="muted">Los pesos se normalizan para sumar 100 %. No implican representatividad estadistica.</p>` : ""}
      ${syntheticWizardStep === 4 ? `<div class="table-wrap"><table><thead><tr><th>Perfil</th><th>Seed</th><th>Humanizacion</th><th>Revision</th></tr></thead><tbody>${selectedProfiles.map((item) => `<tr><td>${item.name}</td><td>Deterministico por perfil</td><td>Tiempo, dudas, abandono y profundidad</td><td>Manual posible antes de calibrar</td></tr>`).join("")}</tbody></table></div>` : ""}
      ${syntheticWizardStep === 5 ? `<div class="section-title"><div><h3>Preguntas de esta iniciativa</h3><p class="muted">Pega aqui el guion de la entrevista, encuesta o prueba que quieres simular. Las plantillas son solo ejemplos editables.</p></div><div class="button-row"><button class="secondary" data-action="load-cocrea-script" type="button">Cargar plantilla clientes y aliados</button><button class="secondary" data-action="load-collaborator-script" type="button">Cargar plantilla colaboradores</button></div></div><div class="form-grid three"><label>Guion para clientes<textarea data-synthetic-questions="clientQuestions">${(draftSynthetic.clientQuestions || []).map((item, index) => `${index + 1}. ${item}`).join("\n")}</textarea></label><label>Guion para aliados<textarea data-synthetic-questions="allyQuestions">${(draftSynthetic.allyQuestions || []).map((item, index) => `${index + 1}. ${item}`).join("\n")}</textarea></label><label>Guion para colaboradores<textarea data-synthetic-questions="collaboratorQuestions">${(draftSynthetic.collaboratorQuestions || []).map((item, index) => `${index + 1}. ${item}`).join("\n")}</textarea></label></div>` : ""}
      ${syntheticWizardStep === 6 ? `<section class="grid two"><article class="card"><h3>Alcance</h3><p>${selectedProfiles.length} perfiles seleccionados.</p><p>${selectedArchetypes.length} arquetipos base asociados.</p></article><article class="card"><h3>Advertencias</h3><p>${syntheticDisclaimer}</p><p class="muted">Motor IA: No configurado - usando simulacion local.</p></article></section>` : ""}
      ${syntheticWizardStep === 7 ? `<article class="card"><h3>Listo para ejecutar</h3><p>Se generaran sesiones individuales, resultados ponderados, comparacion y trazabilidad.</p><button data-action="run-synthetic-simulation">Ejecutar simulacion local</button></article>` : ""}
      ${syntheticWizardStep === 8 ? `<article class="card"><h3>Resultados</h3><p>Despues de ejecutar, el laboratorio abre automaticamente resultados ponderados.</p></article>` : ""}
      <div class="pill-row" style="margin-top:1rem">
        <button class="secondary" data-action="prev-synthetic-step" ${syntheticWizardStep === 0 ? "disabled" : ""}>Anterior</button>
        ${syntheticWizardStep < steps.length - 1 ? `<button data-action="next-synthetic-step">Siguiente</button>` : ""}
      </div>
    </section>
  `;
}

function renderSyntheticSimulations() {
  return `<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Iniciativa</th><th>Motor</th><th>Escenarios</th><th>Estado evidencia</th><th>Fecha</th></tr></thead><tbody>${(state.syntheticSimulations || []).map((simulation) => `<tr><td>${simulation.name}</td><td>${simulation.initiativeName}</td><td>${simulation.engineMode}</td><td>${simulation.sessions.length}</td><td><span class="pill warn">${simulation.realValidationStatus}</span></td><td>${simulation.createdAt.slice(0, 10)}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderSyntheticArchetypes() {
  return `<section class="grid three">${(state.syntheticArchetypes || []).map((archetype) => `<article class="card"><p class="demo-tag">${archetype.audience} | v${archetype.version}</p><h3>${archetype.name}</h3><p>${archetype.description}</p><p><strong>Fuente:</strong> ${archetype.sourceStudy} (${archetype.sourceYear})</p><p><strong>Vigencia:</strong> ${archetype.sourceValidity}</p><div class="pill-row">${(archetype.possibleBarriers || []).slice(0, 3).map((barrier) => `<span class="pill warn">${barrier}</span>`).join("")}</div></article>`).join("")}</section>`;
}

function renderSyntheticProfiles() {
  return `
    <section class="grid three">
      ${(state.syntheticProfiles || []).map((profile) => `<article class="card"><p class="demo-tag">${profile.audience} | v${profile.version}</p><h3>${profile.name}</h3><p>${profile.attributes.city?.value || "Sin ciudad"} | ${profile.attributes.ageBand?.value || "Sin edad"} | ${profile.attributes.territoryType?.value || "Sin zona"}</p><p><strong>Canal:</strong> ${profile.attributes.channelPreference?.value || "Sin dato"}</p><p><strong>Peso base:</strong> ${percentage(profile.defaultWeight || 0)}</p><div class="pill-row"><span class="pill warn">${profile.attributes.trustInBrand?.sourceType || "manual"}</span><span class="pill">${profile.attributes.trustInBrand?.confidence || "medium"}</span></div></article>`).join("")}
    </section>
  `;
}

function renderSyntheticWeighted(simulation) {
  if (!simulation?.aggregate) return `<p class="empty">Ejecuta una simulacion para ver resultados ponderados.</p>`;
  const aggregate = simulation.aggregate;
  const decisions = aggregate.weightedDecisionDistribution || {};
  return `
    <section class="grid four">
      ${metricCard("Escenarios", aggregate.totalGeneratedScenarios, "Generados")}
      ${metricCard("Perfiles", simulation.profileIds?.length || 0, "Parametrizados")}
      ${metricCard("Cohortes", simulation.cohortIds?.length || 0, "Seleccionadas")}
      ${metricCard("Validacion", "Pendiente", "Con personas reales")}
    </section>
    <section class="grid two" style="margin-top:1rem">
      <article class="card">
        <h2>Decision ponderada</h2>
        <p><strong>Participaria:</strong> ${percentage(decisions.accept)}</p>
        <p><strong>Participaria con condiciones:</strong> ${percentage(decisions.conditional)}</p>
        <p><strong>No participaria:</strong> ${percentage(decisions.reject)}</p>
        <p><strong>Abandonaria:</strong> ${percentage(decisions.abandon)}</p>
        <p class="muted">Estos porcentajes corresponden a los pesos configurados para esta simulacion. No son una medicion de la poblacion real.</p>
      </article>
      <article class="card">
        <h2>Barreras y motivaciones</h2>
        <p><strong>Barreras:</strong> ${(aggregate.weightedBarriers || []).slice(0, 4).map((item) => `${item.label} ${percentage(item.weight)}`).join(" | ") || "Sin dato"}</p>
        <p><strong>Motivaciones:</strong> ${(aggregate.weightedMotivations || []).slice(0, 4).map((item) => `${item.label} ${percentage(item.weight)}`).join(" | ") || "Sin dato"}</p>
        <p><strong>Canales:</strong> ${Object.entries(aggregate.weightedChannels || {}).map(([key, value]) => `${key} ${percentage(value)}`).join(" | ")}</p>
      </article>
    </section>
    <div class="section-title"><h2>Resultados por perfil</h2></div>
    <div class="table-wrap"><table><thead><tr><th>Perfil</th><th>Escenarios</th><th>Acepta</th><th>Condicional</th><th>Rechaza</th><th>Abandona</th></tr></thead><tbody>${Object.entries(aggregate.resultsByProfile || {}).map(([profileId, row]) => { const profile = (state.syntheticProfiles || []).find((item) => item.id === profileId); return `<tr><td>${profile?.name || profileId}</td><td>${row.count}</td><td>${percentage(row.weightedDecisionDistribution.accept)}</td><td>${percentage(row.weightedDecisionDistribution.conditional)}</td><td>${percentage(row.weightedDecisionDistribution.reject)}</td><td>${percentage(row.weightedDecisionDistribution.abandon)}</td></tr>`; }).join("")}</tbody></table></div>
  `;
}

function renderSyntheticComparator(simulation) {
  if (!simulation) return `<p class="empty">Ejecuta una simulacion para comparar respuestas.</p>`;
  const comparison = state.realSyntheticComparisons?.[0];
  if (comparison) {
    return `<section class="grid two"><article class="card"><h2>Comparacion real vs. sintetico</h2><p><strong>Decision:</strong> ${percentage(comparison.decisionMatch)}</p><p><strong>Temas:</strong> ${percentage(comparison.topicMatch)}</p><p><strong>Canal:</strong> ${percentage(comparison.channelMatch)}</p><p><strong>Incentivo:</strong> ${percentage(comparison.incentiveMatch)}</p><p><strong>Esfuerzo:</strong> ${percentage(comparison.effortMatch)}</p><p class="muted">${comparison.disclaimer}</p></article><article class="card"><h2>Diferencia de distribucion</h2><p><strong>Promedio:</strong> ${percentage(comparison.distributionDistance)}</p>${Object.entries(comparison.differencesByOption || {}).map(([key, value]) => `<p>${key}: ${percentage(value)}</p>`).join("")}<button data-action="propose-calibration">Usar para calibrar perfiles sinteticos</button></article></section>`;
  }
  return `<article class="card"><h2>Comparador real vs. sintetico</h2><p>Usa respuestas reales ficticias y desidentificadas de demostracion para comparar decisiones, temas, canal, incentivo y esfuerzo.</p><p class="muted">Ninguna respuesta real alimenta automaticamente el sistema.</p><button data-action="create-real-synthetic-comparison" data-simulation-id="${simulation.simulationId}">Crear comparacion demo</button></article>`;
}

function renderSyntheticCalibration() {
  const proposals = state.calibrationProposals || [];
  const latest = proposals[0];
  return `
    <section class="grid two">
      <article class="card"><h2>Centro de calibracion</h2><p>Estados: draft, pending_review, approved, rejected, applied y reverted.</p><p class="muted">Toda calibracion requiere revision humana, trazabilidad, nueva version y posibilidad de reversion.</p><button data-action="propose-calibration">Crear propuesta desde comparacion</button></article>
      <article class="card"><h2>Versiones</h2><p>${(state.syntheticProfileVersions || []).length} registros de version.</p><p>${(state.calibrationHistory || []).length} calibraciones aplicadas.</p>${latest ? `<button class="secondary" data-action="approve-calibration" data-proposal-id="${latest.id}">Aprobar y aplicar</button><button class="secondary" data-action="reject-calibration" data-proposal-id="${latest.id}">Rechazar</button>` : ""}</article>
    </section>
    <div class="table-wrap" style="margin-top:1rem"><table><thead><tr><th>Perfil</th><th>Estado</th><th>Version anterior</th><th>Version propuesta</th><th>Diferencia</th><th>Cambios</th></tr></thead><tbody>${proposals.map((proposal) => { const profile = (state.syntheticProfiles || []).find((item) => item.id === proposal.profileId); return `<tr><td>${profile?.name || proposal.profileId}</td><td><span class="pill warn">${proposal.status}</span></td><td>${proposal.previousVersion}</td><td>${proposal.proposedVersion}</td><td>${proposal.differenceObserved ?? "Sin dato"}</td><td>${proposal.changes.map((change) => change.attribute).join(", ")}</td></tr>`; }).join("")}</tbody></table></div>
    <div class="section-title"><h2>Reversion</h2></div>
    <section class="grid three">${(state.syntheticProfiles || []).slice(0, 6).map((profile) => `<article class="card compact-card"><h3>${profile.name}</h3><p>Version ${profile.version}</p><button class="secondary" data-action="revert-calibration" data-profile-id="${profile.id}">Revertir ultima calibracion</button></article>`).join("")}</section>
  `;
}

function renderSyntheticQuality() {
  const metrics = state.modelQualityMetrics || {};
  return `<section class="grid four">${metricCard("Nivel", metrics.level || "uncalibrated", "Modelo")}${metricCard("Comparaciones", metrics.comparisonCount || 0, "Real vs. sintetico")}${metricCard("Score", percentage(metrics.overallCalibrationScore || 0), "Promedio operativo")}${metricCard("Ultima calibracion", metrics.updatedAt?.slice(0, 10) || "Sin dato", "Fecha")}</section><section class="card" style="margin-top:1rem"><h2>Umbrales provisionales</h2><p>Moderada: ${percentage(metrics.thresholds?.moderate || 0.68)} | Alta: ${percentage(metrics.thresholds?.high || 0.86)} con minimo ${metrics.thresholds?.minimumComparisonsForHigh || 8} comparaciones.</p><p class="muted">No marcar calibracion alta con una sola comparacion.</p></section>`;
}

function renderSyntheticSessionTable(simulation) {
  const rows = simulation.sessions.map((session) => {
    const archetype = state.syntheticArchetypes.find((item) => item.id === session.archetypeId);
    const accepted = session.responses.filter((response) => response.observableBehavior === "aceptacion").length;
    const doubts = session.responses.filter((response) => response.observableBehavior === "aclaracion").length;
    return `<tr><td>${archetype?.name || session.archetypeId}</td><td>${session.status}</td><td>${accepted} de ${session.responses.length} escenarios generados</td><td>${doubts} aclaraciones simuladas</td><td>${session.responses[0]?.answer || ""}</td></tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Arquetipo</th><th>Resultado</th><th>Aceptacion simulada</th><th>Dudas</th><th>Primera respuesta</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderSyntheticTrace(simulation) {
  if (!simulation) return `<p class="empty">Sin trazabilidad sintetica todavia.</p>`;
  return `<section class="grid two"><article class="card"><h2>Trazabilidad</h2><p><strong>ID:</strong> ${simulation.simulationId}</p><p><strong>Prompt:</strong> ${simulation.promptVersions.join(", ")}</p><p><strong>Motor:</strong> ${simulation.engineMode}</p><p><strong>Fecha:</strong> ${simulation.createdAt}</p><p><strong>Estado contraste:</strong> ${simulation.realValidationStatus}</p></article><article class="card"><h2>Limitaciones</h2>${simulation.limitations.map((item) => `<p>${item}</p>`).join("")}</article></section><div class="section-title"><h2>Seeds</h2></div><section class="card"><p class="muted">${simulation.variantSeeds.join(", ")}</p></section>`;
}

function syntheticFindingCard(finding) {
  return `<article class="card"><p class="pill warn">${finding.category}</p><h3>${finding.title}</h3><p>${finding.sessionCount} escenarios generados.</p><p class="muted">Requiere validacion real: ${finding.requiresRealValidation ? "si" : "no"}</p></article>`;
}

function renderAdminParticipants() {
  const results = filteredParticipants();
  return `
    <div class="section-title">
      <div>
        <h1>Participantes</h1>
        <p class="muted">Busca clientes y aliados por nombre, ciudad, tipo, comercio o nivel.</p>
      </div>
      <span class="session-pill">${results.length} resultado(s)</span>
    </div>
    <section class="card participant-search-card">
      <label>Buscar estudios, participante
        <input data-action="participant-search" value="${adminParticipantQuery}" placeholder="Ej: Valentina, aliado, Medellin, Moda Aurora">
      </label>
    </section>
    <div class="table-wrap" style="margin-top:1rem">
      <table><thead><tr><th>Participante</th><th>Tipo</th><th>Ciudad</th><th>Perfil</th><th>Nivel</th><th>Puntos</th><th>Confiabilidad</th><th>Estado</th><th>Ultima actividad</th></tr></thead>
      <tbody>${results.map((p) => `<tr><td><strong>${p.name}</strong></td><td>${p.type}</td><td>${p.city}</td><td>${participantProfileLabel(p)}</td><td>${p.level}</td><td>${p.points}</td><td>${p.reliability}/100</td><td><span class="pill ${p.status === "activo" ? "ok" : p.status === "pausado" ? "warn" : "bad"}">${p.status}</span></td><td>${p.lastParticipationAt.slice(0,10)}</td></tr>`).join("")}</tbody></table>
    </div>
  `;
}

function renderAdminMissions() {
  return `
    <div class="section-title"><h1>Gestion de misiones</h1><button data-view="admin-crear">Crear nueva mision</button></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nombre</th><th>Tipo</th><th>Audiencia</th><th>Estado</th><th>Responsable</th><th>Requeridos</th><th>Invitados</th><th>Aceptados</th><th>Completados</th><th>Presupuesto</th><th>Limite</th><th>Acciones</th></tr></thead>
        <tbody>${state.missions.map((m) => `<tr><td>${m.name}</td><td>${m.type}</td><td>${m.audience}</td><td><span class="pill info">${m.status}</span></td><td>${m.owner}</td><td>${m.requiredParticipants}</td><td>${m.invited}</td><td>${m.accepted}</td><td>${m.completed}</td><td>$${m.budget.toLocaleString("es-CO")}</td><td>${m.deadline}</td><td><button class="secondary" data-duplicate="${m.id}">Duplicar</button></td></tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function renderWizard() {
  const compatible = estimateCompatible(draftMission);
  const recommended = recommendInvitations(Number(draftMission.requiredParticipants || 10), 0.4);
  const risk = compatible < recommended ? "Riesgo medio de no completar la muestra" : "Muestra saludable";
  return `
    <div class="section-title"><h1>Asistente para crear una mision</h1></div>
    <section class="card wizard">
      <div class="stepper">${[0,1,2,3,4].map((i) => `<span class="step ${i <= wizardStep ? "active" : ""}"></span>`).join("")}</div>
      ${wizardContent(compatible, recommended, risk)}
      <div class="pill-row">
        <button class="secondary" data-action="prev-wizard" ${wizardStep === 0 ? "disabled" : ""}>Anterior</button>
        ${wizardStep < 4 ? `<button data-action="next-wizard">Siguiente</button>` : `<button data-action="save-mission">Publicar mision</button>`}
      </div>
    </section>
  `;
}

function wizardContent(compatible, recommended, risk) {
  if (wizardStep === 0) return `
    <div class="form-grid">
      ${input("name", "Nombre", draftMission.name)}
      ${selectField("type", "Tipo de mision", draftMission.type, ["Pulso rapido","Encuesta","Prueba de prototipo","Entrevista","Prueba de aplicacion beta","Prueba de Credinet","Piloto de varios dias","Verificacion de una correccion"])}
      ${selectField("audience", "Audiencia", draftMission.audience, ["clientes","aliados","ambos"])}
      ${input("owner", "Responsable interno", draftMission.owner)}
      ${input("startDate", "Fecha de inicio", draftMission.startDate, "date")}
      ${input("deadline", "Fecha limite", draftMission.deadline, "date")}
    </div>
    <label>Descripcion<textarea data-draft="description">${draftMission.description}</textarea></label>
    <label>Objetivo interno<textarea data-draft="internalObjective">${draftMission.internalObjective}</textarea></label>`;
  if (wizardStep === 1) return `
    <div class="empty"><strong>Confiabilidad minima:</strong> puntaje interno de 0 a 100 que resume cumplimiento, asistencia, claridad del feedback y calidad de evidencia. No mide si la opinion fue positiva para Sistecredito.</div>
    <div class="grid three">
      ${metricCard("Compatibles", compatible, "Segun filtros actuales")}
      ${metricCard("Invitaciones sugeridas", recommended, "Requeridos / 40% finalizacion")}
      ${metricCard("Riesgo", risk, "Formula documentada en codigo")}
    </div>
    <div class="form-grid">
      ${selectField("audience", "Audiencia de la mision", draftMission.audience, ["clientes","aliados","ambos"])}
      ${selectField("city", "Ciudad", draftMission.city, ["Todas","Medellin","Bogota","Cali","Barranquilla","Bucaramanga"])}
      ${selectField("os", "Sistema operativo", draftMission.os, ["Todos","Android","iOS","Windows"])}
      ${participantProfileFilter()}
      ${selectField("minLevel", "Nivel minimo", draftMission.minLevel, ["Explorador","Cocreador","Especialista","Embajador"])}
      ${input("requiredParticipants", "Participantes requeridos", draftMission.requiredParticipants, "number")}
      ${inputWithHelp("reliability", "Confiabilidad minima", draftMission.reliability, "number", "Ejemplo: 70 muestra personas con buen historial. 40 abre mas la convocatoria para una prueba exploratoria.")}
    </div>`;
  if (wizardStep === 2) return `
    <label>Instrucciones<textarea data-draft="instructions">${draftMission.instructions}</textarea></label>
    <div class="form-grid">
      ${input("question0", "Pregunta 1", draftMission.questions[0])}
      ${input("question1", "Pregunta 2", draftMission.questions[1])}
      ${input("question2", "Pregunta 3", draftMission.questions[2])}
    </div>`;
  if (wizardStep === 3) return `
    <div class="form-grid">
      ${input("benefit", "Beneficio ofrecido", draftMission.benefit)}
      ${input("points", "Puntos", draftMission.points, "number")}
      ${input("xp", "XP", draftMission.xp, "number")}
      ${input("budget", "Presupuesto estimado", draftMission.budget, "number")}
      ${input("durationMinutes", "Duracion estimada", draftMission.durationMinutes, "number")}
      ${selectField("channel", "Canal de ejecucion", draftMission.channel, ["remota","videollamada","presencial","beta"])}
    </div>
    <label class="check"><input type="checkbox" data-draft-check="confidentiality" ${draftMission.confidentiality ? "checked" : ""}> Requiere confidencialidad</label>
    <label class="check"><input type="checkbox" data-draft-check="recording" ${draftMission.recording ? "checked" : ""}> Requiere grabacion</label>`;
  return `
    <div class="grid two">
      ${metricCard("Mision", draftMission.name || "Sin nombre", `${draftMission.type} para ${draftMission.audience}`)}
      ${metricCard("Muestra", `${draftMission.requiredParticipants} requeridos`, `${recommended} invitaciones sugeridas`)}
      ${metricCard("Beneficio", draftMission.benefit, `${draftMission.points} puntos y ${draftMission.xp} XP`)}
      ${metricCard("Estado inicial", "Reclutando", "Lista para seleccionar cohorte")}
    </div>`;
}

function renderInvitations() {
  const mission = state.missions.find((item) => item.status === "reclutando") || state.missions[0];
  const eligible = filterEligibleParticipants(state.participants, mission);
  return `
    <div class="section-title"><h1>Seleccion y envio de invitaciones</h1></div>
    <section class="card">
      <h2>${mission.name}</h2>
      <p class="muted">${eligible.length} participantes compatibles. Sugerencia: invitar ${recommendInvitations(mission.requiredParticipants, 0.4)} personas.</p>
      <button data-action="auto-invite" data-mission="${mission.id}">Seleccion automatica y enviar invitaciones</button>
    </section>
    <div class="table-wrap" style="margin-top:1rem">
      <table><thead><tr><th>Participante</th><th>Tipo</th><th>Ciudad</th><th>Nivel</th><th>Confiabilidad</th><th>Ultima participacion</th><th>Alertas</th></tr></thead>
      <tbody>${eligible.slice(0, 18).map((p) => {
        const fatigue = detectFatigue(p, state.invitations, state.participations, mission);
        return `<tr><td>${p.name}</td><td>${p.type}</td><td>${p.city}</td><td>${p.level}</td><td>${p.reliability}/100</td><td>${p.lastParticipationAt.slice(0,10)}</td><td>${fatigue.hasRisk ? `<span class="pill warn">${fatigue.alerts[0]}</span>` : `<span class="pill ok">Sin alerta</span>`}</td></tr>`;
      }).join("")}</tbody></table>
    </div>
  `;
}

function renderCommunity() {
  const clients = state.participants.filter((p) => p.type === "cliente");
  const allies = state.participants.filter((p) => p.type === "aliado");
  const active = state.participants.filter((p) => p.status === "activo");
  const paused = state.participants.filter((p) => p.status === "pausado");
  return `
    <div class="section-title"><h1>Comunidad</h1><span class="demo-tag">Datos simulados</span></div>
    <section class="community-hero">
      <div>
        <p class="demo-tag">Modelo de captacion</p>
        <h2>Asi se crea la comunidad Co-crea</h2>
        <p>La comunidad nace desde invitaciones voluntarias en canales propios de Sistecredito. Cada persona decide si quiere participar, acepta consentimientos y completa un perfil de preferencias para recibir misiones adecuadas.</p>
      </div>
      <div class="community-hero-side">
        <img class="community-people-image" src="./assets/brand-extracted/community-people.png" alt="Personas de la comunidad Sistecredito Co-crea" />
        <div class="community-hero-metrics">
          ${metric("Total", state.participants.length)}
          ${metric("Clientes", clients.length)}
          ${metric("Aliados", allies.length)}
        </div>
      </div>
    </section>
    <section class="grid four" style="margin-top:1rem">
      ${metricCard("Activos", active.length, "Pueden recibir invitaciones")}
      ${metricCard("Pausados", paused.length, "No se invitan temporalmente")}
      ${metricCard("Alta confiabilidad", state.participants.filter((p) => p.reliability >= 90).length, "90 puntos o mas")}
      ${metricCard("Nuevos", state.participants.filter((p) => p.completedMissions <= 1).length, "Aun estan aprendiendo la dinamica")}
    </section>
    <div class="section-title"><h2>Canales para formar la comunidad</h2></div>
    <section class="grid three">
      ${communitySourceCard("App Sistecredito", "Invitacion dentro de la app para clientes activos.", ["Nombre ficticio", "Ciudad", "Dispositivo", "Preferencias", "Disponibilidad"])}
      ${communitySourceCard("Credinet para aliados", "Mensaje en Credinet para comercios y roles operativos.", ["Comercio ficticio", "Rol", "Sector", "Experiencia Credinet", "Horario disponible"])}
      ${communitySourceCard("Campanas controladas", "QR, correo o WhatsApp simulado para convocatorias puntuales.", ["Tipo de participante", "Canal preferido", "Consentimiento", "Temas de interes"])}
    </section>
    <div class="section-title"><h2>Flujo de ingreso</h2></div>
    <section class="community-flow">
      ${processStep("1", "Invitacion voluntaria", "La persona recibe una invitacion clara. Participar no afecta productos, cupos ni condiciones.")}
      ${processStep("2", "Perfilamiento minimo", "Se recolectan solo datos utiles para segmentar misiones, sin documentos ni informacion financiera.")}
      ${processStep("3", "Consentimiento", "Acepta tratamiento de informacion de investigacion, confidencialidad o grabacion cuando aplique.")}
      ${processStep("4", "Activacion", "La persona queda disponible para invitaciones segun preferencias, fatiga y confiabilidad.")}
    </section>
    <section class="grid two" style="margin-top:1rem">
      <article class="card">
        <h2>Formulario de ingreso simulado</h2>
        <div class="form-grid">
          <label>Tipo de comunidad<select><option>Cliente</option><option>Aliado</option></select></label>
          <label>Ciudad<input value="Medellin" readonly></label>
          <label>Dispositivo principal<select><option>Android</option><option>iOS</option><option>Computador</option></select></label>
          <label>Disponibilidad<select><option>Tarde</option><option>Noche</option><option>Fin de semana</option></select></label>
        </div>
        <div class="checks" style="margin-top:1rem">
          <label class="check"><input type="checkbox" checked disabled> Acepta participar de forma voluntaria</label>
          <label class="check"><input type="checkbox" checked disabled> Acepta recibir invitaciones de prueba</label>
        </div>
        <p class="muted">Este formulario es demostrativo. No solicita documentos, creditos, ingresos ni datos financieros.</p>
      </article>
      <article class="card">
        <h2>Datos que alimentan el matching</h2>
        <div class="pill-row">
          ${["Ciudad", "Departamento", "Dispositivo", "Sistema operativo", "Nivel digital", "Preferencias", "Disponibilidad", "Ultima participacion", "Confiabilidad", "Fatiga"].map((item) => `<span class="pill info">${item}</span>`).join("")}
        </div>
        <h3>Reglas de cuidado</h3>
        <p>La plataforma evita sobreinvitar, respeta pausas temporales y muestra alertas cuando alguien tiene demasiadas invitaciones o participaciones recientes.</p>
      </article>
    </section>
    <div class="section-title"><h2>Personas registradas</h2></div>
    <div class="table-wrap">
      <table><thead><tr><th>Nombre</th><th>Tipo</th><th>Ciudad</th><th>Perfil</th><th>Nivel</th><th>XP</th><th>Confiabilidad</th><th>Ultima actividad</th><th>Completadas</th><th>Asistencia</th><th>Estado</th><th>Disponibilidad</th></tr></thead>
      <tbody>${state.participants.map((p) => `<tr><td>${p.name}</td><td>${p.type}</td><td>${p.city}</td><td>${p.type === "aliado" ? `${p.allyProfile.businessName}, ${p.allyProfile.role}` : `${p.device.os}, ${p.clientProfile.digitalExperience}`}</td><td>${p.level}</td><td>${p.xp}</td><td>${p.reliability}/100</td><td>${p.lastParticipationAt.slice(0,10)}</td><td>${p.completedMissions}</td><td>${p.attendanceRate}%</td><td><span class="pill ${p.status === "activo" ? "ok" : p.status === "pausado" ? "warn" : "bad"}">${p.status}</span></td><td>${p.availability}</td></tr>`).join("")}</tbody></table>
    </div>
  `;
}

function renderReview() {
  const pending = state.participations.filter((item) => item.status === "pendiente_revision");
  return `
    <div class="section-title"><h1>Revision de participaciones</h1></div>
    <section class="grid two">
      ${pending.length ? pending.map(reviewCard).join("") : `<div class="empty">No hay participaciones pendientes por revisar.</div>`}
    </section>
  `;
}

function renderBehaviorAnalytics() {
  const mission = state.missions.find((item) => item.id === selectedMissionId) || state.missions.find((item) => item.type.includes("prototipo")) || state.missions[0];
  const summary = summarizeBehaviorEvents(state.behaviorEvents || [], mission.id);
  return `
    <div class="section-title"><h1>Comportamiento en prototipos</h1></div>
    <section class="card">
      <div class="form-grid">
        <label>Mision analizada
          <select data-action="behavior-mission">
            ${state.missions.map((item) => `<option value="${item.id}" ${item.id === mission.id ? "selected" : ""}>${item.name}</option>`).join("")}
          </select>
        </label>
        <div>
          <p class="demo-tag">Analitica local de demostracion</p>
          <p class="muted">Registra clics y zonas de interaccion dentro del prototipo. No captura textos escritos, documentos, datos financieros ni informacion sensible.</p>
        </div>
      </div>
    </section>
    <section class="grid four" style="margin-top:1rem">
      ${metricCard("Clics registrados", summary.totalClicks, "Eventos locales de la demo")}
      ${metricCard("Co-creadores", summary.uniqueParticipants, "Participantes ficticios")}
      ${metricCard("Zona mas usada", summary.topZones[0]?.[0] || "Sin datos", `${summary.topZones[0]?.[1] || 0} clics`)}
      ${metricCard("Boton mas usado", summary.topButtons[0]?.[0] || "Sin datos", `${summary.topButtons[0]?.[1] || 0} clics`)}
    </section>
    <section class="grid two" style="margin-top:1rem">
      <article class="card">
        <h2>Mapa de calor del prototipo</h2>
        ${heatmap(summary)}
      </article>
      <article class="card">
        <h2>Botones y zonas usadas</h2>
        ${behaviorBars("Botones", summary.topButtons)}
        ${behaviorBars("Zonas", summary.topZones)}
      </article>
    </section>
    <section class="card" style="margin-top:1rem">
      <h2>Linea de tiempo reciente</h2>
      ${summary.timeline.length ? `<div class="table-wrap"><table><thead><tr><th>Hora</th><th>Participante</th><th>Interaccion</th><th>Zona</th><th>Paso</th></tr></thead><tbody>${summary.timeline.map((event) => {
        const participant = state.participants.find((item) => item.id === event.participantId);
        return `<tr><td>${new Date(event.createdAt).toLocaleString("es-CO")}</td><td>${participant?.name || "Participante demo"}</td><td>${event.label}</td><td>${event.zone || "General"}</td><td>${event.step || "Navegacion"}</td></tr>`;
      }).join("")}</tbody></table></div>` : `<p class="empty">Aun no hay interacciones para esta mision. Entra como cliente, abre una mision y haz clic dentro del prototipo.</p>`}
    </section>
  `;
}

function reviewCard(participation) {
  const participant = state.participants.find((p) => p.id === participation.participantId);
  const mission = missionById(participation.missionId);
  return `
    <article class="card">
      <p class="pill warn">Pendiente de revision</p>
      <h2>${participant?.name}</h2>
      <p><strong>Mision:</strong> ${mission?.name}</p>
      <p><strong>Fecha:</strong> ${participation.createdAt.slice(0,10)}</p>
      <p><strong>Comentarios:</strong> ${participation.comments}</p>
      <p><strong>Evidencia:</strong> ${participation.evidence}</p>
      <p><strong>Duracion:</strong> ${participation.durationMinutes} minutos | <strong>Calificacion:</strong> ${participation.rating}/5</p>
      <div class="pill-row">
        <button data-approve="${participation.id}">Aprobar y entregar puntos</button>
        <button class="secondary" data-reject="${participation.id}">Rechazar</button>
        <button class="ghost" data-clarify="${participation.id}">Solicitar aclaracion</button>
      </div>
    </article>
  `;
}

function bindEvents(app) {
  app.querySelector("[data-action='login-form']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.querySelector("[data-login-field='email']")?.value.trim() || "";
    const password = form.querySelector("[data-login-field='password']")?.value || "";
    loginDraft = { ...loginDraft, email, password };
    const result = validateLogin(authUsers, email, password);
    if (!result.ok) {
      loginError = result.message;
      renderApp();
      return;
    }
    startSession(result.user);
  });
  app.querySelectorAll("[data-login-field]").forEach((input) => input.addEventListener("change", () => {
    loginDraft = { ...loginDraft, [input.dataset.loginField]: input.value };
  }));
  app.querySelector("[data-action='register-form']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = registrationDraft.email.trim() || `usuario${Date.now()}@cocrea.test`;
    if (authUsers.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      loginError = "Este usuario ya existe. Puedes iniciar sesion con ese correo.";
      renderApp();
      return;
    }
    const user = createRegisteredAuthUser({ ...registrationDraft, email });
    state = createRegisteredParticipant(state, user);
    const finalUser = { ...user, participantId: user.role === "empleado" ? null : state.currentParticipantId };
    authUsers = saveAuthUsers([...authUsers, finalUser]);
    generatedCredentials = finalUser;
    loginDraft = { email: finalUser.email, password: finalUser.password };
    registrationDraft = { firstName: "", lastName: "", phone: "", email: "", role: "cliente" };
    loginError = "";
    authMode = "credentials";
    renderApp();
  });
  app.querySelectorAll("[data-register-field]").forEach((input) => {
    const update = () => { registrationDraft = { ...registrationDraft, [input.dataset.registerField]: input.value }; };
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });
  app.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => {
    authMode = button.dataset.authMode;
    loginError = "";
    renderApp();
  }));
  app.querySelector("[data-action='go-login-with-generated']")?.addEventListener("click", () => {
    authMode = "login";
    renderApp();
  });
  app.querySelectorAll("[data-password-field]").forEach((input) => input.addEventListener("input", () => {
    passwordDraft = { ...passwordDraft, [input.dataset.passwordField]: input.value };
  }));
  app.querySelector("[data-action='change-password']")?.addEventListener("click", () => {
    if (!passwordDraft.password || passwordDraft.password !== passwordDraft.confirm) {
      loginError = "La nueva contrasena y la confirmacion deben coincidir.";
      renderApp();
      return;
    }
    authUsers = saveAuthUsers(updateAuthUser(authUsers, currentAuthUser.email, { password: passwordDraft.password, mustChangePassword: false, firstLogin: false }));
    currentAuthUser = { ...currentAuthUser, password: passwordDraft.password, mustChangePassword: false, firstLogin: false };
    saveAuthSession(currentAuthUser);
    passwordDraft = { password: "", confirm: "" };
    loginError = "";
    view = currentAuthUser.profileCompleted ? (currentAuthUser.role === "admin" ? "admin-dashboard" : "inicio") : "complete-profile";
    toast("Contrasena actualizada.");
    renderApp();
  });
  app.querySelector("[data-action='skip-password-change']")?.addEventListener("click", () => {
    authUsers = saveAuthUsers(updateAuthUser(authUsers, currentAuthUser.email, { mustChangePassword: false, firstLogin: false }));
    currentAuthUser = { ...currentAuthUser, mustChangePassword: false, firstLogin: false };
    saveAuthSession(currentAuthUser);
    view = currentAuthUser.profileCompleted ? (currentAuthUser.role === "admin" ? "admin-dashboard" : "inicio") : "complete-profile";
    renderApp();
  });
  app.querySelectorAll("[data-profile-field]").forEach((input) => {
    const update = () => { communityProfileDraft = { ...communityProfileDraft, [input.dataset.profileField]: input.value }; };
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });
  app.querySelector("[data-action='complete-profile-form']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const consents = [...app.querySelectorAll("[data-profile-consent]")];
    if (!consents.every((input) => input.checked)) {
      profileConsentError = "Debes aceptar las tres condiciones para hacer parte de la comunidad de testeo.";
      renderApp();
      return;
    }
    state = completeCommunityProfile(state, currentAuthUser, communityProfileDraft);
    authUsers = saveAuthUsers(updateAuthUser(authUsers, currentAuthUser.email, { profileCompleted: true, profile: communityProfileDraft }));
    currentAuthUser = { ...currentAuthUser, profileCompleted: true, profile: communityProfileDraft };
    saveAuthSession(currentAuthUser);
    profileConsentError = "";
    view = currentAuthUser.role === "admin" ? "admin-dashboard" : "inicio";
    toast("Perfil completado. Ya haces parte de la comunidad de testeo.");
    renderApp();
  });
  app.querySelector("[data-action='toggle-profile-menu']")?.addEventListener("click", () => {
    profileMenuOpen = !profileMenuOpen;
    renderApp();
  });
  app.querySelector("[data-action='logout']")?.addEventListener("click", () => {
    isAuthenticated = false;
    currentAuthUser = null;
    selectedMissionId = null;
    loginError = "";
    profileMenuOpen = false;
    clearAuthSession();
    renderApp();
  });
  app.querySelector("[data-action='notifications']")?.addEventListener("click", () => {
    toast("Notificaciones de demostracion.");
  });
  app.querySelector("[data-action='help']")?.addEventListener("click", () => {
    toast("Centro de ayudas simulado para el prototipo.");
  });
  app.querySelectorAll("[data-action='admin-search'], [data-action='participant-search']").forEach((input) => {
    const runSearch = () => {
      adminParticipantQuery = input.value.trim();
      view = "admin-participantes";
      selectedMissionId = null;
      renderApp();
    };
    input.addEventListener("change", runSearch);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") runSearch();
    });
  });
  app.querySelector("[data-action='role']")?.addEventListener("change", (event) => {
    profileMenuOpen = false;
    state = setRole(state, event.target.value);
    selectedMissionId = null;
    view = isCurrentAdmin() ? "admin-dashboard" : "inicio";
    renderApp();
  });
  app.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { profileMenuOpen = false; view = button.dataset.view; selectedMissionId = null; renderApp(); }));
  app.querySelector("[data-action='reset']")?.addEventListener("click", () => { profileMenuOpen = false; state = resetState(); selectedMissionId = null; view = "inicio"; toast("Datos de demostracion restablecidos."); renderApp(); });
  app.querySelectorAll("[data-open-mission]").forEach((button) => button.addEventListener("click", () => { selectedMissionId = button.dataset.openMission; missionStep = "detail"; renderApp(); }));
  app.querySelector("[data-action='back-catalog']")?.addEventListener("click", () => { selectedMissionId = null; view = "catalogo"; renderApp(); });
  app.querySelector("[data-action='start-consent']")?.addEventListener("click", () => { missionStep = "consent"; renderApp(); });
  app.querySelector("[data-action='mission-detail']")?.addEventListener("click", () => { missionStep = "detail"; renderApp(); });
  app.querySelector("[data-action='accept-consent']")?.addEventListener("click", () => {
    const required = [...app.querySelectorAll("[data-consent]")];
    if (required.some((input) => !input.checked)) {
      app.querySelector("#consent-error").hidden = false;
      return;
    }
    missionStep = "run";
    runStep = 0;
    renderApp();
  });
  app.querySelector("[data-action='next-run']")?.addEventListener("click", () => {
    const mission = missionById(selectedMissionId);
    if (runStep === 2 && mission?.type === "Prueba de prototipo" && !prototypeTaskStatus[mission.id]) {
      toast("Primero toca el boton del prototipo para completar la tarea.");
      return;
    }
    runStep += 1;
    renderApp();
  });
  app.querySelector("[data-action='prev-run']")?.addEventListener("click", () => { runStep = Math.max(0, runStep - 1); renderApp(); });
  app.querySelector("[data-action='submit-mission']")?.addEventListener("click", () => {
    const mission = missionById(selectedMissionId);
    state = submitMission(state, currentParticipant().id, mission.id, {
      consentType: `voluntario+datos${mission.confidentiality ? "+confidencialidad" : ""}${mission.recording ? "+grabacion" : ""}`,
      durationMinutes: mission.durationMinutes,
      rating: 4,
      comment: "La experiencia fue clara. Sugiero reforzar el texto del boton principal antes del lanzamiento.",
      evidence: `captura-demo-${mission.id}.png`,
      answers: ["Facil de completar", "El mensaje principal fue claro", "Mejoraria la explicacion final"],
    });
    missionStep = "confirmation";
    renderApp();
  });
  app.querySelector("[data-action='go-home']")?.addEventListener("click", () => { selectedMissionId = null; view = "inicio"; renderApp(); });
  app.querySelectorAll("[data-filter]").forEach((input) => input.addEventListener("change", () => { filters[input.dataset.filter] = input.value; renderApp(); }));
  app.querySelector("[data-action='clear-filters']")?.addEventListener("click", () => { filters = { duration: "todas", type: "todas", benefit: "todos" }; renderApp(); });
  app.querySelectorAll("[data-approve]").forEach((button) => button.addEventListener("click", () => { state = approveFromStore(state, button.dataset.approve); toast("Participacion aprobada. Puntos y XP entregados."); renderApp(); }));
  app.querySelectorAll("[data-reject]").forEach((button) => button.addEventListener("click", () => { state = rejectParticipation(state, button.dataset.reject, "La evidencia simulada no coincide con la tarea."); toast("Participacion rechazada con razon registrada."); renderApp(); }));
  app.querySelectorAll("[data-clarify]").forEach((button) => button.addEventListener("click", () => { toast(`Aclaracion simulada enviada para ${button.dataset.clarify}.`); }));
  app.querySelectorAll("[data-redeem]").forEach((button) => button.addEventListener("click", () => { toast(`Redencion simulada solicitada: ${button.dataset.redeem}.`); }));
  app.querySelectorAll("[data-duplicate]").forEach((button) => button.addEventListener("click", () => { state = duplicateMission(state, button.dataset.duplicate); toast("Mision duplicada como borrador."); renderApp(); }));
  app.querySelector("[data-action='auto-invite']")?.addEventListener("click", (event) => {
    const mission = missionById(event.target.dataset.mission);
    const selected = filterEligibleParticipants(state.participants, mission).filter((p) => p.status !== "pausado").slice(0, recommendInvitations(mission.requiredParticipants, 0.4)).map((p) => p.id);
    state = sendInvitations(state, mission.id, selected, mission.audience === "aliados" ? "Credinet" : "Aplicacion");
    toast(`${selected.length} invitaciones simuladas enviadas.`);
    renderApp();
  });
  app.querySelector("[data-action='toggle-pause']")?.addEventListener("click", () => {
    const current = currentParticipant();
    state = { ...state, participants: state.participants.map((p) => p.id === current.id ? { ...p, status: p.status === "pausado" ? "activo" : "pausado" } : p) };
    localStorage.setItem("sistecredito-cocrea-state", JSON.stringify(state));
    renderApp();
  });
  app.querySelector("[data-action='behavior-mission']")?.addEventListener("change", (event) => {
    selectedMissionId = event.target.value;
    renderApp();
  });
  app.querySelectorAll("[data-synthetic-view]").forEach((button) => button.addEventListener("click", () => {
    syntheticLabView = button.dataset.syntheticView;
    view = "admin-laboratorio";
    renderApp();
  }));
  app.querySelectorAll("[data-synthetic-draft]").forEach((input) => input.addEventListener("input", () => {
    draftSynthetic = { ...draftSynthetic, [input.dataset.syntheticDraft]: input.value };
  }));
  app.querySelectorAll("[data-synthetic-scenario]").forEach((input) => input.addEventListener("input", () => {
    draftSynthetic = { ...draftSynthetic, scenario: { ...draftSynthetic.scenario, [input.dataset.syntheticScenario]: input.value } };
  }));
  app.querySelectorAll("[data-synthetic-questions]").forEach((input) => input.addEventListener("input", () => {
    draftSynthetic = { ...draftSynthetic, [input.dataset.syntheticQuestions]: parseQuestionText(input.value) };
  }));
  app.querySelector("[data-action='load-cocrea-script']")?.addEventListener("click", () => {
    draftSynthetic = { ...draftSynthetic, clientQuestions: cocreaClientQuestions, allyQuestions: cocreaAllyQuestions };
    toast("Plantilla Co-crea cargada. Puedes editarla antes de ejecutar.");
    renderApp();
  });
  app.querySelector("[data-action='load-collaborator-script']")?.addEventListener("click", () => {
    draftSynthetic = { ...draftSynthetic, collaboratorQuestions: cocreaCollaboratorQuestions };
    toast("Plantilla de colaboradores cargada. Puedes editarla antes de ejecutar.");
    renderApp();
  });
  app.querySelectorAll("[data-synthetic-archetype]").forEach((input) => input.addEventListener("change", () => {
    const id = input.dataset.syntheticArchetype;
    draftSynthetic = {
      ...draftSynthetic,
      archetypeIds: input.checked ? [...new Set([...draftSynthetic.archetypeIds, id])] : draftSynthetic.archetypeIds.filter((item) => item !== id),
    };
    renderApp();
  }));
  app.querySelectorAll("[data-synthetic-profile]").forEach((input) => input.addEventListener("change", () => {
    const id = input.dataset.syntheticProfile;
    const profile = (state.syntheticProfiles || []).find((item) => item.id === id);
    draftSynthetic = {
      ...draftSynthetic,
      profileIds: input.checked ? [...new Set([...draftSynthetic.profileIds, id])] : draftSynthetic.profileIds.filter((item) => item !== id),
      archetypeIds: input.checked && profile ? [...new Set([...draftSynthetic.archetypeIds, profile.archetypeId])] : draftSynthetic.archetypeIds,
    };
    renderApp();
  }));
  app.querySelectorAll("[data-synthetic-weight]").forEach((input) => input.addEventListener("input", () => {
    draftSynthetic = upsertSyntheticWeight(draftSynthetic, input.dataset.syntheticWeight, { configuredWeight: Math.max(0, Number(input.value) || 0) / 100, weightSource: "manual" });
  }));
  app.querySelectorAll("[data-synthetic-generated]").forEach((input) => input.addEventListener("input", () => {
    draftSynthetic = upsertSyntheticWeight(draftSynthetic, input.dataset.syntheticGenerated, { generatedCount: Math.max(1, Number(input.value) || 1) });
  }));
  app.querySelectorAll("[data-synthetic-count]").forEach((input) => input.addEventListener("change", () => {
    draftSynthetic = {
      ...draftSynthetic,
      variantsByArchetype: { ...draftSynthetic.variantsByArchetype, [input.dataset.syntheticCount]: Math.max(1, Number(input.value) || 1) },
    };
    renderApp();
  }));
  app.querySelector("[data-action='next-synthetic-step']")?.addEventListener("click", () => { syntheticWizardStep = Math.min(8, syntheticWizardStep + 1); renderApp(); });
  app.querySelector("[data-action='prev-synthetic-step']")?.addEventListener("click", () => { syntheticWizardStep = Math.max(0, syntheticWizardStep - 1); renderApp(); });
  app.querySelector("[data-action='run-synthetic-simulation']")?.addEventListener("click", () => {
    state = runSyntheticSimulation(state, { ...draftSynthetic, id: `syn_sim_${Date.now()}` });
    syntheticLabView = "weighted";
    syntheticWizardStep = 0;
    draftSynthetic = defaultSyntheticDraft();
    toast("Simulacion sintetica ejecutada con motor local.");
    renderApp();
  });
  app.querySelector("[data-action='create-real-synthetic-comparison']")?.addEventListener("click", (event) => {
    state = createRealSyntheticComparison(state, event.currentTarget.dataset.simulationId);
    syntheticLabView = "compare";
    toast("Comparacion demo creada con evidencia ficticia desidentificada.");
    renderApp();
  });
  app.querySelector("[data-action='propose-calibration']")?.addEventListener("click", () => {
    const profileId = state.syntheticProfiles?.[0]?.id;
    state = proposeSyntheticCalibration(state, profileId);
    syntheticLabView = "calibration";
    toast("Propuesta de calibracion creada para revision humana.");
    renderApp();
  });
  app.querySelector("[data-action='approve-calibration']")?.addEventListener("click", (event) => {
    state = approveSyntheticCalibration(state, event.currentTarget.dataset.proposalId);
    toast("Calibracion aprobada y versionada.");
    renderApp();
  });
  app.querySelector("[data-action='reject-calibration']")?.addEventListener("click", (event) => {
    state = rejectSyntheticCalibration(state, event.currentTarget.dataset.proposalId);
    toast("Calibracion rechazada.");
    renderApp();
  });
  app.querySelectorAll("[data-action='revert-calibration']").forEach((button) => button.addEventListener("click", () => {
    state = revertSyntheticCalibration(state, button.dataset.profileId);
    toast("Se intento revertir la ultima calibracion disponible.");
    renderApp();
  }));
  bindWizard(app);
}

function bindWizard(app) {
  app.querySelectorAll("[data-draft]").forEach((input) => input.addEventListener("input", () => {
    const key = input.dataset.draft;
    if (key.startsWith("question")) draftMission.questions[Number(key.replace("question", ""))] = input.value;
    else draftMission[key] = input.value;
  }));
  app.querySelectorAll("select[data-draft]").forEach((input) => input.addEventListener("change", () => {
    draftMission[input.dataset.draft] = input.value;
    if (["audience", "city", "os", "role", "digitalExperience", "minLevel"].includes(input.dataset.draft)) renderApp();
  }));
  app.querySelectorAll("[data-draft-check]").forEach((input) => input.addEventListener("change", () => { draftMission[input.dataset.draftCheck] = input.checked; }));
  app.querySelector("[data-action='next-wizard']")?.addEventListener("click", () => { wizardStep += 1; renderApp(); });
  app.querySelector("[data-action='prev-wizard']")?.addEventListener("click", () => { wizardStep = Math.max(0, wizardStep - 1); renderApp(); });
  app.querySelector("[data-action='save-mission']")?.addEventListener("click", () => {
    draftMission.publish = true;
    draftMission.requiredProfile = {
      cities: draftMission.city === "Todas" ? [] : [draftMission.city],
      os: draftMission.os === "Todos" ? [] : [draftMission.os],
      roles: draftMission.audience === "clientes" || draftMission.role === "Todos" ? [] : [draftMission.role],
      digitalExperience: draftMission.audience === "aliados" || draftMission.digitalExperience === "Todos" ? [] : [draftMission.digitalExperience],
    };
    state = createMission(state, draftMission);
    draftMission = defaultMissionDraft();
    wizardStep = 0;
    view = "admin-invitaciones";
    toast("Mision creada y lista para invitar participantes.");
    renderApp();
  });
}

function currentParticipant() {
  if (currentAuthUser?.role === "empleado") {
    return {
      id: `emp_${currentAuthUser.id}`,
      name: currentAuthUser.displayName,
      type: "empleado",
      city: currentAuthUser.profile?.municipality || "Por completar",
      department: currentAuthUser.profile?.department || "Por completar",
      ageRange: currentAuthUser.profile?.age || "Por completar",
      device: { type: currentAuthUser.profile?.device || "Por completar", os: currentAuthUser.profile?.device || "Por completar" },
      availability: "Por completar",
      preferredMissionTypes: ["Entrevista", "Prueba de prototipo", "Revision interna"],
      level: "Explorador",
      levelRank: 0,
      xp: 0,
      points: 0,
      pendingPoints: 0,
      reliability: 80,
      status: "activo",
      completedMissions: 0,
      attendanceRate: 0,
      badges: ["Colaborador interno"],
      contactPreferences: ["Correo"],
      clientProfile: { digitalExperience: currentAuthUser.profile?.digitalExperience || "Por completar" },
    };
  }
  return state.participants.find((p) => p.id === state.currentParticipantId) || state.participants[0];
}

function isCurrentAdmin() {
  return currentAuthUser ? currentAuthUser.role === "admin" : state.currentRole === "admin";
}

function startSession(user) {
  currentAuthUser = user;
  isAuthenticated = true;
  loginError = "";
  profileMenuOpen = false;
  saveAuthSession(user);
  state = setSessionRole(state, user);
  selectedMissionId = null;
  view = user.mustChangePassword ? "complete-profile" : user.role === "admin" ? "admin-dashboard" : "inicio";
  renderApp();
}

function missionById(id) { return state.missions.find((mission) => mission.id === id); }
function availableMissions(participant) {
  return state.missions.filter((mission) => ["activa", "reclutando"].includes(mission.status) && (mission.audience === "ambos" || mission.audience === `${participant.type}s`));
}
function metric(label, value) { return `<div class="metric"><span class="muted">${label}</span><strong>${value}</strong></div>`; }
function metricCard(label, value, note) { return `<article class="card metric"><span class="muted">${label}</span><strong>${value}</strong><small class="muted">${note}</small></article>`; }
function participantProfileLabel(participant) {
  if (participant.type === "aliado") return `${participant.allyProfile.businessName}, ${participant.allyProfile.role}`;
  return `${participant.device.os}, experiencia ${participant.clientProfile.digitalExperience}`;
}
function filteredParticipants() {
  const query = adminParticipantQuery.trim().toLowerCase();
  if (!query) return state.participants;
  return state.participants.filter((participant) => {
    const text = [
      participant.name,
      participant.type,
      participant.city,
      participant.department,
      participant.level,
      participant.status,
      participantProfileLabel(participant),
    ].join(" ").toLowerCase();
    return text.includes(query);
  });
}
function participantSearchSummary() {
  const results = filteredParticipants().slice(0, 4);
  return `<section class="card participant-mini-search">
    <label>Buscar participante
      <input data-action="participant-search" value="${adminParticipantQuery}" placeholder="Buscar por nombre, ciudad, tipo o comercio">
    </label>
    <div class="participant-result-list">
      ${results.map((p) => `<button class="participant-result" data-view="admin-participantes">
        <strong>${p.name}</strong>
        <span>${p.type} | ${p.city} | ${participantProfileLabel(p)}</span>
      </button>`).join("") || `<p class="empty">No hay coincidencias.</p>`}
    </div>
  </section>`;
}
function missionCard(mission, participant) {
  const match = matchParticipant(participant, mission);
  return `<article class="card mission-card"><div class="pill-row">${missionPills(mission, match)}</div><h3>${mission.name}</h3><p>${mission.description}</p><p><strong>${mission.durationMinutes} min</strong> | ${mission.benefit} | ${mission.deadline}</p>${match.eligible ? "" : `<div class="empty">${match.reasons.join(" ")}</div>`}<button data-open-mission="${mission.id}">Ver detalle</button></article>`;
}
function missionPills(mission, match) {
  return `<span class="pill info">${mission.type}</span><span class="pill">${mission.channel}</span><span class="pill ${match.eligible ? "ok" : "warn"}">${match.eligible ? "Recomendada" : "No elegible"}</span><span class="pill">${mission.requiredParticipants - mission.completed} por completar</span>`;
}
function prototypePreview(mission, participant) {
  if (mission.type === "Prueba de aplicacion beta") {
    const label = participant.device.os === "iOS" ? "Abrir en TestFlight" : participant.device.os === "Android" ? "Abrir en Google Play Testing" : "Abrir en Firebase App Distribution";
    const opened = prototypeTaskStatus[mission.id];
    return `<div class="tracked-prototype" data-prototype-surface><p class="pill warn">Enlace de demostracion</p><button class="secondary" type="button" data-track-label="${label}" data-prototype-zone="enlace beta" data-prototype-action="beta-abierta">${opened ? "Enlace abierto en demo" : label}</button><p class="muted" data-track-label="Aviso de enlace demo" data-prototype-zone="mensaje secundario">No se conecta con APIs reales.</p>${opened ? `<p class="task-success">Listo. Ahora puedes contar como fue la experiencia de abrir el canal beta.</p>` : ""}</div>`;
  }
  if (mission.type === "Entrevista") return `<div class="tracked-prototype" data-prototype-surface><p data-track-label="Fecha de entrevista" data-prototype-zone="agenda">Videollamada simulada: 2026-08-01, 10:00 a. m.</p><button class="secondary" type="button" data-track-label="Abrir enlace simulado" data-prototype-zone="enlace videollamada">Abrir enlace simulado</button></div>`;
  const consulted = prototypeTaskStatus[mission.id];
  return `<div class="prototype-workbench">
    <div class="phone-mock tracked-prototype" data-prototype-surface>
      <strong data-track-label="Cupo disponible" data-prototype-zone="cabecera de cupo">${consulted ? "Resultado de consulta" : "Consulta de cupo"}</strong>
      ${consulted ? `<div class="result-card" data-track-label="Resultado de cupo" data-prototype-zone="resultado">Tu cupo disponible se mostraria aqui</div><p class="phone-help">Mensaje simulado: revisa si se entiende y si genera confianza.</p>` : `<div class="line" data-track-label="Linea superior" data-prototype-zone="contenido superior"></div><div class="line" style="width:72%" data-track-label="Texto principal" data-prototype-zone="contenido principal"></div>`}
      <button class="cta" type="button" data-track-label="Consultar ahora" data-prototype-zone="boton principal" data-prototype-action="consulta-cupo">${consulted ? "Volver a consultar" : "Consultar ahora"}</button>
      ${consulted ? `<p class="task-success">Tarea completada. Ahora responde las preguntas de abajo.</p>` : `<div class="line" style="width:54%" data-track-label="Texto de ayuda" data-prototype-zone="mensaje secundario"></div>`}
    </div>
  </div>`;
}
function taskBrief(mission) {
  if (mission.type === "Prueba de prototipo") {
    const done = prototypeTaskStatus[mission.id];
    return `<div class="task-brief">
      <div>
        <p class="demo-tag">${done ? "Tarea completada" : "Tarea del cliente"}</p>
        <h2>Toca el boton del prototipo</h2>
        <p>Haz clic en <strong>Consultar ahora</strong>. Observa el mensaje que aparece y luego responde que tan facil, claro y confiable se siente la experiencia.</p>
      </div>
      <span class="pill ${done ? "ok" : "warn"}">${done ? "Ya interactuaste" : "Pendiente por hacer clic"}</span>
    </div>`;
  }
  if (mission.type === "Prueba de aplicacion beta") {
    return `<div class="task-brief"><div><p class="demo-tag">Tarea del cliente</p><h2>Abre el enlace simulado</h2><p>Usa el boton de TestFlight, Google Play Testing o Firebase y luego cuentanos como fue la experiencia.</p></div></div>`;
  }
  return `<div class="task-brief"><div><p class="demo-tag">Tarea del cliente</p><h2>Responde la prueba</h2><p>Lee la actividad y comparte tu opinion con sinceridad.</p></div></div>`;
}
function impactCard(story) {
  return `<article class="card"><p class="pill ok">${story.participants} participantes</p><h3>${story.title}</h3><p><strong>Se probo:</strong> ${story.tested}</p><p><strong>Aprendimos:</strong> ${story.learned}</p><p><strong>Cambio:</strong> ${story.changed}</p><small class="muted">${story.date}</small></article>`;
}
function chart(title, rows) {
  const max = Math.max(...rows.map(([, value]) => value), 1);
  return `<article class="card"><h3>${title}</h3><div class="chart">${rows.map(([label, value]) => `<div class="bar"><span>${label}</span><span class="track"><i style="width:${Math.round((value / max) * 100)}%"></i></span><strong>${value}</strong></div>`).join("")}</div></article>`;
}
function behaviorSummaryCard() {
  const summary = summarizeBehaviorEvents(state.behaviorEvents || []);
  return `<section class="grid three">
    ${metricCard("Clics en prototipos", summary.totalClicks, "Datos locales de comportamiento")}
    ${metricCard("Botones distintos", summary.topButtons.length, "Interacciones registradas")}
    ${metricCard("Zona con mas clics", summary.topZones[0]?.[0] || "Sin datos", "Mapa de calor disponible")}
  </section>`;
}
function heatmap(summary) {
  if (!summary.heatmapPoints.length) return `<p class="empty">Sin clics suficientes para pintar el mapa.</p>`;
  return `<div class="heatmap" aria-label="Mapa de calor de clics">${summary.heatmapPoints.map((point, index) => `<span class="heat-dot heat-${Math.min(4, index % 5)}" title="${point.label}" style="left:${point.x}%; top:${point.y}%"></span>`).join("")}<div class="heat-phone"><strong>Prototipo</strong><span></span><span></span><em>Boton principal</em><span></span></div></div>`;
}
function behaviorBars(title, rows) {
  const max = Math.max(...rows.map(([, value]) => value), 1);
  return `<h3>${title}</h3><div class="chart">${rows.length ? rows.slice(0, 6).map(([label, value]) => `<div class="bar"><span>${label}</span><span class="track"><i style="width:${Math.round((value / max) * 100)}%"></i></span><strong>${value}</strong></div>`).join("") : `<p class="empty">Sin datos.</p>`}</div>`;
}
function communitySourceCard(title, description, fields) {
  return `<article class="card source-card">
    <span class="source-icon"></span>
    <h3>${title}</h3>
    <p>${description}</p>
    <div class="pill-row">${fields.map((field) => `<span class="pill">${field}</span>`).join("")}</div>
  </article>`;
}
function processStep(number, title, description) {
  return `<article class="process-step">
    <strong>${number}</strong>
    <h3>${title}</h3>
    <p>${description}</p>
  </article>`;
}
function check(id, text) { return `<label class="check"><input type="checkbox" data-consent="${id}"> ${text}</label>`; }
function option(value, label, selected) { return `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`; }
function input(key, label, value, type = "text") { return `<label>${label}<input type="${type}" data-draft="${key}" value="${value ?? ""}"></label>`; }
function inputWithHelp(key, label, value, type, help) { return `<label>${label}<input type="${type}" data-draft="${key}" value="${value ?? ""}"><small class="field-help">${help}</small></label>`; }
function selectField(key, label, value, options) { return `<label>${label}<select data-draft="${key}">${options.map((item) => option(item, item, value)).join("")}</select></label>`; }
function participantProfileFilter() {
  if (draftMission.audience === "clientes") {
    return selectField("digitalExperience", "Experiencia digital del cliente", draftMission.digitalExperience, ["Todos","Basica","Media","Alta"]);
  }
  if (draftMission.audience === "aliados") {
    return selectField("role", "Rol en el comercio aliado", draftMission.role, ["Todos","cajero","vendedor","administrador","dueno","encargado de tecnologia"]);
  }
  return `${selectField("digitalExperience", "Experiencia digital cliente", draftMission.digitalExperience, ["Todos","Basica","Media","Alta"])}${selectField("role", "Rol en comercio aliado", draftMission.role, ["Todos","cajero","vendedor","administrador","dueno","encargado de tecnologia"])}`;
}
function defaultMissionDraft() {
  return {
    name: "Validemos una mejora de onboarding",
    description: "Queremos probar si el nuevo flujo se entiende sin ayuda.",
    internalObjective: "Reducir dudas antes del lanzamiento controlado.",
    type: "Prueba de prototipo",
    audience: "clientes",
    owner: "Equipo Producto Digital",
    startDate: "2026-07-25",
    deadline: "2026-08-08",
    city: "Todas",
    os: "Todos",
    role: "Todos",
    digitalExperience: "Todos",
    minLevel: "Explorador",
    reliability: 70,
    requiredParticipants: 10,
    instructions: "Completa la tarea y responde con sinceridad.",
    questions: ["Que tan claro fue el paso principal?", "Donde dudaste?", "Que cambiarias?"],
    benefit: "1.200 puntos",
    points: 1200,
    xp: 90,
    budget: 12000,
    durationMinutes: 20,
    channel: "remota",
    confidentiality: false,
    recording: false,
    requiredProfile: {},
    publish: false,
  };
}
function defaultSyntheticDraft() {
  const template = defaultSyntheticTemplate();
  return {
    ...template,
    id: "syn_sim_nueva",
    name: "Nueva simulacion sintetica",
    initiativeName: "",
    objective: "",
    scenario: {
      name: "",
      context: "",
    },
    clientQuestions: [],
    allyQuestions: [],
    collaboratorQuestions: [],
    profileIds: template.profileIds || [],
    profileWeights: [],
  };
}

function upsertSyntheticWeight(draft, profileId, patch) {
  const current = draft.profileWeights.find((item) => item.profileId === profileId) || { profileId, generatedCount: 3, configuredWeight: 0.1, weightSource: "manual", confidence: "medium" };
  return {
    ...draft,
    profileWeights: [...draft.profileWeights.filter((item) => item.profileId !== profileId), { ...current, ...patch }],
  };
}
function parseQuestionText(value) {
  return String(value)
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[\).\-\s]+/, "").trim())
    .filter(Boolean);
}
function estimateCompatible(draft) {
  return state.participants.filter((participant) => {
    if (draft.audience !== "ambos" && `${participant.type}s` !== draft.audience) return false;
    if (draft.city !== "Todas" && participant.city !== draft.city) return false;
    if (draft.os !== "Todos" && participant.device.os !== draft.os) return false;
    if (draft.role !== "Todos" && participant.type === "aliado" && participant.allyProfile?.role !== draft.role) return false;
    if (draft.digitalExperience !== "Todos" && participant.type === "cliente" && participant.clientProfile?.digitalExperience !== draft.digitalExperience) return false;
    if (participant.reliability < Number(draft.reliability || 0)) return false;
    return true;
  }).length;
}
function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  window.setTimeout(() => node.remove(), 2600);
}

function initBehaviorTracking() {
  if (behaviorTrackingReady || typeof document === "undefined") return;
  behaviorTrackingReady = true;
  document.addEventListener("click", (event) => {
    if (isCurrentAdmin() || !selectedMissionId || !(event.target instanceof Element)) return;
    const target = event.target.closest("[data-track-label], button");
    if (!target) return;
    const surface = event.target.closest("[data-prototype-surface]");
    const rect = surface?.getBoundingClientRect();
    const x = rect ? ((event.clientX - rect.left) / rect.width) * 100 : null;
    const y = rect ? ((event.clientY - rect.top) / rect.height) * 100 : null;
    const label = target.dataset.trackLabel || target.textContent.trim() || "Interaccion";
    state = recordBehaviorEvent(state, {
      participantId: currentParticipant().id,
      missionId: selectedMissionId,
      label,
      zone: target.dataset.prototypeZone || (surface ? "prototipo" : "navegacion"),
      step: missionStep === "run" ? `paso ${runStep + 1}` : missionStep,
      x: Number.isFinite(x) ? x : null,
      y: Number.isFinite(y) ? y : null,
    });
    if (target.dataset.prototypeAction) {
      prototypeTaskStatus = { ...prototypeTaskStatus, [selectedMissionId]: target.dataset.prototypeAction };
      toast("Interaccion registrada en el prototipo.");
      renderApp();
    }
  });
}

if (typeof document !== "undefined") renderApp();
