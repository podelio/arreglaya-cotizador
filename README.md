# ArreglaYa Cotizador V3.2

Cambios principales:

- Selector superior: Residencial / Comercial / Industrial.
- Catálogo compatible con columnas: Sell_Residencial, Sell_Comercial, Sell_Industrial.
- Ítem manual con opción “Registrar como sugerencia para catálogo”.
- Campo de configuración para URL Web App de Google Apps Script.
- Feedback manual hacia hoja FEEDBACK_MANUAL.

## Publicación del catálogo

En Google Sheets:

1. Hoja CATALOG.
2. Archivo → Compartir → Publicar en la web.
3. Seleccionar CATALOG y CSV.
4. Copiar el enlace publicado CSV.
5. Pegar en la app: Config → ID del Google Sheet o enlace CSV publicado.

## Feedback manual

1. Abre el Google Sheet del catálogo.
2. Extensiones → Apps Script.
3. Pega el contenido de apps_script_feedback.gs.
4. Implementar/Deploy → Nueva implementación → Web App.
5. Ejecutar como: Yo.
6. Acceso: Cualquier persona / Anyone.
7. Copiar URL /exec y pegar en la app: Config → URL Web App para feedback manual.
