/**
 * ArreglaYa Cotizador V3.2 — Feedback manual hacia Google Sheets
 * Uso recomendado: crear este Apps Script desde el mismo Google Sheet del catálogo.
 * Desplegar como Web App con acceso: Anyone / Cualquier persona.
 */
const SHEET_NAME = 'FEEDBACK_MANUAL';

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, app: 'ArreglaYa Feedback', version: '3.2' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Este script debe estar vinculado al Google Sheet del catálogo.');

    const sheet = getOrCreateFeedbackSheet_(ss);
    const data = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : '{}');

    sheet.appendRow([
      new Date(),
      data.folio || '',
      data.cliente || '',
      data.linea || '',
      data.categoria || '',
      data.servicioManual || '',
      data.unidad || '',
      Number(data.cantidad || 0),
      Number(data.precioUnitario || 0),
      Number(data.importe || 0),
      data.observaciones || '',
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

function getOrCreateFeedbackSheet_(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const headers = [
    'Timestamp', 'Folio', 'Cliente', 'Linea', 'Categoria', 'ServicioManual',
    'Unidad', 'Cantidad', 'PrecioUnitario', 'Importe', 'Observaciones', 'Estado'
  ];

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.some(value => String(value || '').trim() !== '');

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}
