# CRM Bridge — PRUEBA

This feature branch contains a test-only CRM bridge for the ArreglaYa quote app.

## Scope

- Writes one draft quote to `Cotizaciones` and its line items to `CotizacionPartidas`.
- Matches an existing client by `Clientes.NombreComercial`; it does not create clients.
- Uses `IDExternoCotizador` for safe retries.
- Starts numbering at AY-2026-0359 or above, and serializes folio assignment with a script lock.
- Writes to the test CRM only when the script property points to the test spreadsheet.

## Setup in Google Apps Script

1. Open the **test copy** of Base Central CRM, then open **Extensions → Apps Script**. This creates a separate script project bound to the test spreadsheet. Do not use the production CRM or the feedback script project.
2. Replace the editor contents with `apps_script_crm_bridge_test.gs`.
3. Open **Project Settings → Script Properties** and add `CRM_SPREADSHEET_ID` with the ID of the test CRM copy only.
4. Save, then select **Deploy → New deployment → Web app**.
5. Set **Execute as: Me** and **Who has access: Only myself**. Do not select an option that allows anyone or all signed-in users.
6. Deploy and copy the URL ending in `/exec`. This deployment must be made from the Google account that owns the test CRM.
7. In the test cotizador, open **Config** and paste that URL into **URL Web App del CRM de PRUEBA**. The URL is saved in that browser only.
8. When you click **Guardar borrador en CRM**, Google opens a response tab. Confirm `ok: true` and copy its `folio` into the quote before creating the PDF. If the browser asks you to sign in, use the same Google account that deployed the script.

## Access boundary

The cotizador is public static code, so it contains no spreadsheet ID, access token, or credential. The endpoint is configured for the deploying user only. Codex can edit the branch source but cannot log into Google or deploy the Apps Script as the user. The CRM script does not add tabs or change headers.

## Current state

The branch code is not merged into `main` and has not been deployed to the public cotizador. No CRM data has been written by this bridge.
