# Puente CRM — PRUEBA

Esta rama contiene un puente de prueba para guardar cotizaciones y partidas en la copia de Base Central CRM.

## Alcance

- Guarda el encabezado en `Cotizaciones` y sus partidas en `CotizacionPartidas`.
- Busca el cliente existente por `Clientes.NombreComercial`; no crea clientes.
- Usa `IDExternoCotizador` para que un reintento no duplique la cotización.
- Asigna folios desde AY-2026-0359 o el siguiente consecutivo disponible, con bloqueo para evitar asignaciones simultáneas.
- Solo escribe en la hoja indicada por la propiedad privada del script.

## Configuración en Google Apps Script

1. Abre la **copia de PRUEBA** de Base Central CRM y selecciona **Extensiones → Apps Script**. Así el proyecto queda separado del script actual de feedback.
2. Sustituye el contenido del editor por `apps_script_crm_bridge_test.gs`.
3. En **Configuración del proyecto → Propiedades del script**, agrega `CRM_SPREADSHEET_ID` con el ID de la copia de PRUEBA solamente. No lo agregues al código público de GitHub.
4. Guarda y selecciona **Implementar → Nueva implementación → Aplicación web**.
5. Configura **Ejecutar como: Yo** y **Quién tiene acceso: Solo yo**. No elijas “cualquier usuario” ni “cualquier usuario con cuenta Google”.
6. Implementa desde la cuenta propietaria de la copia de prueba y copia la URL que termina en `/exec`.
7. En el cotizador de prueba, abre **Config** y pega la URL en **URL Web App del CRM de PRUEBA**. Se guarda en el almacenamiento local de ese navegador.
8. Al pulsar **Guardar borrador en CRM**, Google abrirá otra pestaña con la respuesta. Confirma `"ok": true` y copia el campo `folio` al cotizador antes de generar el PDF. Si solicita iniciar sesión, usa la misma cuenta Google que implementó el script.

## Límite de acceso

El cotizador es código público estático; por eso no contiene el ID de la hoja, tokens ni credenciales. Google limitará la ejecución al usuario que implemente el Web App. Codex puede editar el código de la rama, pero no iniciar sesión en Google ni implementar el Apps Script como si fuera tu cuenta. El script no crea pestañas ni cambia encabezados.

## Estado

Los cambios están en `chatgpt/puente-crm-prueba`, sin combinar a `main` ni publicar el cotizador. No se ha escrito ningún dato del CRM mediante este puente.
