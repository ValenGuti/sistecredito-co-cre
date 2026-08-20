# Despliegue automatico con GitHub Pages

Este prototipo ya incluye el flujo `.github/workflows/deploy-pages.yml`.
Cuando el proyecto este en GitHub, cada cambio enviado a la rama `main` ejecutara:

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run build`
- publicacion de la carpeta `dist` en GitHub Pages

## 1. Crear el repositorio en GitHub

Crear un repositorio nuevo, por ejemplo:

`sistecredito-cocrea-prototipo`

Puede ser privado o publico segun la politica interna del equipo.

## 2. Preparar Git local

Si esta carpeta muestra errores como `not a git repository`, la carpeta `.git` local esta incompleta.
En ese caso, desde PowerShell y dentro de la carpeta del proyecto, ejecutar:

```powershell
Remove-Item -Recurse -Force .git
git init -b main
git add .
git commit -m "Prototipo inicial de Sistecredito Co-crea"
git remote add origin https://github.com/TU_USUARIO_O_ORG/sistecredito-cocrea-prototipo.git
git push -u origin main
```

Reemplazar `TU_USUARIO_O_ORG` y el nombre del repositorio por los datos reales.

## 3. Activar GitHub Pages

En GitHub:

1. Abrir el repositorio.
2. Entrar a `Settings`.
3. Entrar a `Pages`.
4. En `Source`, elegir `GitHub Actions`.
5. Esperar a que termine el workflow `Desplegar prototipo en GitHub Pages`.

GitHub mostrara una URL parecida a:

`https://TU_USUARIO_O_ORG.github.io/sistecredito-cocrea-prototipo/`

## 4. Publicar cambios futuros

Cada cambio se publica asi:

```powershell
git add .
git commit -m "Descripcion del cambio"
git push
```

Al hacer `push`, GitHub ejecuta el workflow y actualiza la URL publicada.
