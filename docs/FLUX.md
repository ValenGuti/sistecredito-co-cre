# Integracion con Flux

El prototipo puede consumir tokens visuales del paquete privado `@sc-ingenieria/flux` publicado en GitHub Packages.

## Seguridad del token

No guardar el token en el repositorio. Configuralo solo en tu maquina:

```bash
npm config set @sc-ingenieria:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken TU_TOKEN
```

## Sincronizar tokens

Instala el paquete de forma local y sincroniza los tokens:

```bash
npm install --no-save @sc-ingenieria/flux
npm run flux:sync
```

El comando genera `app/flux-tokens.generated.css`. El prototipo carga ese archivo antes de `app/styles.css`, por lo que los colores, radios y estados visuales quedan mapeados a variables locales:

- `--flux-brand-primary`
- `--flux-brand-secondary`
- `--flux-accent`
- `--flux-bg`
- `--flux-surface`
- `--flux-ink`
- `--flux-muted`
- `--flux-line`

Si Flux no esta instalado, se conservan valores fallback para que la demo siga funcionando.
