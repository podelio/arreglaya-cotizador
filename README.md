# ArreglaYa Cotizador V3.3

Cambios principales:

- Vigencia ahora es lista desplegable.
- Anticipo ahora es lista desplegable.
- Las observaciones del PDF usan variables: `{vigencia}` y `{anticipo}`.
- Categoría sugerida del ítem manual ahora es lista desplegable.
- Feedback manual usa envío por formulario oculto para funcionar mejor con Google Apps Script.
- Botón “Probar registro de feedback”.
- Botón “Nueva cotización / siguiente folio”.
- Folio se guarda como usado al generar PDF o enviar WhatsApp y la siguiente cotización toma el folio siguiente.

## Feedback manual

1. Abre tu Google Sheet del catálogo.
2. Ve a Extensiones → Apps Script.
3. Pega `apps_script_feedback.gs`.
4. Implementar → Nueva implementación → Web App.
5. Ejecutar como: Tú.
6. Acceso: Cualquier persona.
7. Copia la URL que termina en `/exec`.
8. Pégala en Config → URL Web App para feedback manual.
9. Usa “Probar registro de feedback”.
