import { runAuthTests } from "../tests/auth.test.mjs";
import { runDomainTests } from "../tests/domain.test.mjs";
import { runFlowTests } from "../tests/flow.test.mjs";
import { runSyntheticAggregationTests } from "../tests/synthetic-aggregation.test.mjs";
import { runSyntheticCalibrationTests } from "../tests/synthetic-calibration.test.mjs";
import { runSyntheticProfilesTests } from "../tests/synthetic-profiles.test.mjs";
import { runSyntheticTests } from "../tests/synthetic.test.mjs";

const tests = [
  ["autenticacion de demo", runAuthTests],
  ["reglas de dominio", runDomainTests],
  ["flujo end-to-end simulado", runFlowTests],
  ["laboratorio sintetico", runSyntheticTests],
  ["perfiles sinteticos", runSyntheticProfilesTests],
  ["agregacion sintetica ponderada", runSyntheticAggregationTests],
  ["comparacion y calibracion sintetica", runSyntheticCalibrationTests],
];

let passed = 0;
for (const [name, run] of tests) {
  try {
    run();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`fallo - ${name}`);
    console.error(error);
    process.exit(1);
  }
}
console.log(`${passed} grupos de pruebas pasaron.`);
