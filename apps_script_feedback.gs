/**
 * ArreglaYa Cotizador V3.3 — Feedback manual hacia Google Sheets
 * Recomendado: crea este Apps Script desde el mismo Google Sheet del catálogo.
 * Despliegue: Implementar → Nueva implementación → Web App
 * Ejecutar como: Tú
 * Acceso: Cualquier persona
 */
const SHEET_NAME = 'FEEDBACK_MANUAL';

// Opcional: si el script NO está vinculado al Google Sheet, pega aquí el ID del Sheet.
// Si lo creas desde Extensiones → Apps Script dentro del Sheet, déjalo vacío.
const SPREADSHEET_ID = '';

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, app: 'ArreglaYa Feedback', version: '3.3' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = getSpreadsheet_();
    const sheet = getOrCreateFeedbackSheet_(ss);
    const data = getPayload_(e);

    sheet.appendRow([
      new Date(),
      data.folio || '',
      data.cliente || '',
      data.linea || '',
      data.categoria || '',
      data.servicioManual || data.servicio || '',
      data.unidad || '',
      Number(data.cantidad || 0),
      Number(data.precioUnitario || 0),
      Number(data.importe || 0),
      data.observaciones || '',
      data.origen || 'ArreglaYa Cotizador',
      'Pendiente'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No se encontró Spreadsheet activo. Crea el script desde el Sheet o llena SPREADSHEET_ID.');
  return ss;
}

function getPayload_(e) {
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (err) {}
  }
  return (e && e.parameter) ? e.parameter : {};
}

function getOrCreateFeedbackSheet_(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const headers = [
    'Timestamp', 'Folio', 'Cliente', 'Linea', 'Categoria', 'ServicioManual',
    'Unidad', 'Cantidad', 'PrecioUnitario', 'Importe', 'Observaciones', 'Origen', 'Estado'
  ];

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.some(value => String(value || '').trim() !== '');

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}
