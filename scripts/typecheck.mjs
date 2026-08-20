import("./../src/domain.mjs")
  .then(() => import("./../src/seed-data.mjs"))
  .then(() => import("./../src/store.mjs"))
  .then(() => import("./../app/main.js"))
  .then(() => {
    console.log("Modulos cargan correctamente.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
