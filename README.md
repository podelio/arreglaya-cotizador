# ArreglaYa Cotizador — PWA

Esta carpeta contiene la app lista para subir a GitHub Pages.

## Archivos incluidos

- `index.html`: app principal.
- `manifest.json`: permite instalarla como app en celular.
- `sw.js`: cache local para abrir más rápido y poder cargar aun con señal limitada.
- `icon-192.png` y `icon-512.png`: íconos de instalación.
- `.nojekyll`: evita procesamiento innecesario en GitHub Pages.

## Cómo subir a GitHub Pages

1. Entra a GitHub y crea un repositorio nuevo, por ejemplo: `arreglaya-cotizador`.
2. Sube todos los archivos de esta carpeta a la raíz del repositorio. El archivo principal debe llamarse exactamente `index.html`.
3. En el repositorio entra a `Settings` → `Pages`.
4. En `Build and deployment`, selecciona `Deploy from a branch`.
5. En `Branch`, selecciona `main` y carpeta `/root`, luego guarda.
6. Espera unos minutos. GitHub te mostrará una liga tipo `https://usuario.github.io/arreglaya-cotizador/`.
7. Abre esa liga en tu celular.

## Instalar en celular

### Android / Chrome

Abre la liga, toca el menú `⋮` y selecciona `Agregar a pantalla principal` o `Instalar app`.

### iPhone / Safari

Abre la liga en Safari, toca `Compartir` y selecciona `Agregar a inicio`.

## Notas

- La app funciona como cotizador rápido y envía el texto por WhatsApp.
- Las partidas se guardan localmente en el navegador del celular mediante `localStorage`.
- Esta versión no genera PDF/Word todavía; eso se puede agregar en una siguiente fase.
