const AUTH_KEY = "sistecredito-cocrea-auth-users";
const SESSION_KEY = "sistecredito-cocrea-auth-session";

export const roleLabels = {
  admin: "Administrador interno",
  cliente: "Cliente",
  aliado: "Aliado",
  empleado: "Empleado Sistecredito",
};

export const demoAuthUsers = [
  demoUser("admin.demo1@cocrea.test", "AdminDemo1", "admin", "Admin Demo Uno"),
  demoUser("admin.demo2@cocrea.test", "AdminDemo2", "admin", "Admin Demo Dos"),
  demoUser("cliente.demo1@cocrea.test", "ClienteDemo1", "cliente", "Cliente Demo Uno"),
  demoUser("cliente.demo2@cocrea.test", "ClienteDemo2", "cliente", "Cliente Demo Dos"),
  demoUser("aliado.demo1@cocrea.test", "AliadoDemo1", "aliado", "Aliado Demo Uno"),
  demoUser("aliado.demo2@cocrea.test", "AliadoDemo2", "aliado", "Aliado Demo Dos"),
  demoUser("empleado.demo1@cocrea.test", "EmpleadoDemo1", "empleado", "Empleado Demo Uno"),
  demoUser("empleado.demo2@cocrea.test", "EmpleadoDemo2", "empleado", "Empleado Demo Dos"),
];

export function loadAuthUsers() {
  if (typeof localStorage === "undefined") return demoAuthUsers;
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return saveAuthUsers(demoAuthUsers);
  try {
    return mergeAuthUsers(JSON.parse(stored));
  } catch {
    return saveAuthUsers(demoAuthUsers);
  }
}

export function saveAuthUsers(users) {
  if (typeof localStorage !== "undefined") localStorage.setItem(AUTH_KEY, JSON.stringify(users));
  return users;
}

export function loadAuthSession() {
  if (typeof sessionStorage === "undefined") return null;
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveAuthSession(session) {
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAuthSession() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("sistecredito-cocrea-auth");
  }
}

export function validateLogin(users, email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user || user.password !== password) {
    return { ok: false, message: "Usuario o contrasena incorrectos." };
  }
  return { ok: true, user };
}

export function createRegisteredAuthUser({ firstName, lastName, phone, email, role }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const id = `auth_${Date.now()}`;
  const password = generatePassword(firstName, role);
  return {
    id,
    email: cleanEmail,
    password,
    role,
    firstName: String(firstName || "").trim(),
    lastName: String(lastName || "").trim(),
    phone: String(phone || "").trim(),
    displayName: `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim() || roleLabels[role],
    participantId: null,
    firstLogin: true,
    mustChangePassword: true,
    profileCompleted: false,
    createdAt: now(),
  };
}

export function updateAuthUser(users, email, patch) {
  return users.map((user) => user.email.toLowerCase() === String(email).toLowerCase() ? { ...user, ...patch, updatedAt: now() } : user);
}

function demoUser(email, password, role, displayName) {
  return {
    id: `auth_${role}_${email.split("@")[0].replace(".", "_")}`,
    email,
    password,
    role,
    firstName: displayName.split(" ")[0],
    lastName: displayName.split(" ").slice(1).join(" "),
    phone: "3000000000",
    displayName,
    participantId: role === "cliente" ? "cli_01" : role === "aliado" ? "ali_01" : null,
    firstLogin: false,
    mustChangePassword: false,
    profileCompleted: true,
    createdAt: "2026-08-19T09:00:00-05:00",
  };
}

function mergeAuthUsers(stored) {
  const byEmail = new Map(demoAuthUsers.map((user) => [user.email.toLowerCase(), user]));
  (Array.isArray(stored) ? stored : []).forEach((user) => byEmail.set(user.email.toLowerCase(), { ...byEmail.get(user.email.toLowerCase()), ...user }));
  return saveAuthUsers([...byEmail.values()]);
}

function generatePassword(firstName, role) {
  const base = String(firstName || roleLabels[role] || "Cocrea").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "Cocrea";
  return `${base}${String(Date.now()).slice(-4)}`;
}

function now() {
  return "2026-08-19T09:00:00-05:00";
}
