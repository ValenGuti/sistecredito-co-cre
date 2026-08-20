import assert from "node:assert/strict";
import { createRegisteredAuthUser, demoAuthUsers, updateAuthUser, validateLogin } from "../src/auth.mjs";

export function runAuthTests() {
  const valid = validateLogin(demoAuthUsers, "cliente.demo1@cocrea.test", "ClienteDemo1");
  assert.equal(valid.ok, true);
  assert.equal(valid.user.role, "cliente");

  const admin = validateLogin(demoAuthUsers, "admin.demo1@cocrea.test", "AdminDemo1");
  assert.equal(admin.ok, true);
  assert.equal(admin.user.role, "admin");

  const employee = validateLogin(demoAuthUsers, "empleado.demo1@cocrea.test", "EmpleadoDemo1");
  assert.equal(employee.ok, true);
  assert.equal(employee.user.role, "empleado");

  const invalid = validateLogin(demoAuthUsers, "cliente.demo1@cocrea.test", "ClaveMala");
  assert.equal(invalid.ok, false);

  const created = createRegisteredAuthUser({
    firstName: "Persona",
    lastName: "Demo",
    phone: "3000000000",
    email: "persona.demo@cocrea.test",
    role: "empleado",
  });
  assert.equal(created.email, "persona.demo@cocrea.test");
  assert.equal(created.role, "empleado");
  assert.equal(created.mustChangePassword, true);
  assert.ok(created.password.length >= 8);

  const updated = updateAuthUser([created], created.email, { password: "NuevaClaveDemo", mustChangePassword: false });
  assert.equal(validateLogin(updated, created.email, "NuevaClaveDemo").ok, true);
}
