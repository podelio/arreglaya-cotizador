/**
 * ArreglaYa CRM Bridge — TEST ONLY
 *
 * Deploy as a Google Apps Script web app with:
 *   Execute as: Me
 *   Who has access: Only myself
 *
 * Set Script Property CRM_SPREADSHEET_ID to the TEST CRM spreadsheet ID.
 * Never put that ID, a token, or OAuth credentials in the public cotizador.
 *
 * This script writes only Cotizaciones and CotizacionPartidas.
 */
const CRM_BRIDGE_VERSION = '0.1.0-test';
const FIRST_CRM_FOLIO = 359;
const CRM_SHEET_QUOTES = 'Cotizaciones';
const CRM_SHEET_LINES = 'CotizacionPartidas';
const CRM_SHEET_CLIENTS = 'Clientes';

function doGet() {
  return jsonOutput_({ ok: true, service: 'ArreglaYa CRM Bridge', version: CRM_BRIDGE_VERSION });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const payload = readPayload_(e);
    validatePayload_(payload);

    const ss = getCrmSpreadsheet_();
    const quotes = requireSheet_(ss, CRM_SHEET_QUOTES);
    const lines = requireSheet_(ss, CRM_SHEET_LINES);
    const clients = requireSheet_(ss, CRM_SHEET_CLIENTS);

    const quoteHeaders = getHeaders_(quotes);
    const lineHeaders = getHeaders_(lines);
    requireHeaders_(quoteHeaders, ['CotizacionID', 'Folio', 'Año', 'Consecutivo', 'FechaCotizacion', 'ClienteID', 'Cliente', 'TipoCliente', 'ProyectoServicio', 'CanalOrigen', 'Estatus', 'Subtotal', 'IVA', 'Total', 'VigenciaDias', 'FechaVencimiento', 'IDExternoCotizador', 'FechaActualizacion', 'OrigenRegistro']);
    requireHeaders_(lineHeaders, ['PartidaID', 'CotizacionID', 'Orden', 'Concepto', 'Descripcion', 'Unidad', 'Cantidad', 'PrecioUnitario', 'Importe', 'IVA', 'Total', 'Origen', 'ServiceCode', 'NivelPrecio']);

    const existing = findByValue_(quotes, quoteHeaders, 'IDExternoCotizador', payload.externalId);
    if (existing) {
      return jsonOutput_({ ok: true, duplicate: true, folio: existing.Folio || '', cotizacionId: existing.CotizacionID || '' });
    }

    const totals = calculateTotals_(payload.items);
    const today = parseLocalDate_(payload.quote.date);
    const validDays = positiveInteger_(payload.quote.validityDays, 15);
    const expiration = new Date(today.getFullYear(), today.getMonth(), today.getDate() + validDays);
    const client = findClient_(clients, payload.quote.client);
    const year = today.getFullYear();
    const consecutive = Math.max(FIRST_CRM_FOLIO, getMaxConsecutive_(quotes, quoteHeaders) + 1);
    const folio = 'AY-' + year + '-' + String(consecutive).padStart(4, '0');
    const quoteId = 'REG-' + year + '-' + String(consecutive).padStart(4, '0');
    const updatedAt = new Date();

    const quoteValues = objectToRow_(quoteHeaders, {
      CotizacionID: quoteId,
      Folio: folio,
      'Año': year,
      Consecutivo: consecutive,
      FechaCotizacion: today,
      ClienteID: client.id,
      Cliente: payload.quote.client,
      RFC: client.rfc,
      TipoCliente: normalizeLine_(payload.quote.line),
      ProyectoServicio: payload.quote.description || 'Por definir',
      CanalOrigen: 'Cotizador Web',
      Estatus: 'Borrador',
      Subtotal: totals.subtotal,
      IVA: totals.iva,
      Total: totals.total,
      VigenciaDias: validDays,
      FechaVencimiento: expiration,
      Responsable: payload.quote.owner || '',
      IDExternoCotizador: payload.externalId,
      FechaActualizacion: updatedAt,
      Observaciones: payload.quote.notes || '',
      RequiereFactura: false,
      TotalCobrado: 0,
      SaldoPendiente: totals.total,
      EstatusCobro: 'No iniciado',
      OrigenRegistro: 'Cotizador Web - PRUEBA'
    });

    const lineValues = payload.items.map((item, index) => {
      const amount = money_(Number(item.quantity) * Number(item.unitPrice));
      const iva = money_(amount * 0.16);
      return objectToRow_(lineHeaders, {
        PartidaID: Utilities.getUuid(),
        CotizacionID: quoteId,
        Orden: index + 1,
        Concepto: item.category || item.description,
        Descripcion: item.description,
        Unidad: item.unit,
        Cantidad: Number(item.quantity),
        PrecioUnitario: money_(Number(item.unitPrice)),
        Importe: amount,
        IVA: iva,
        Total: money_(amount + iva),
        Origen: item.manual ? 'Manual' : 'Catalogo',
        ServiceCode: item.serviceCode || '',
        NivelPrecio: normalizeLine_(item.line || payload.quote.line)
      });
    });

    const quoteRow = quotes.getLastRow() + 1;
    const lineStartRow = lines.getLastRow() + 1;
    quotes.getRange(quoteRow, 1, 1, quoteValues.length).setValues([quoteValues]);
    try {
      lines.getRange(lineStartRow, 1, lineValues.length, lineValues[0].length).setValues(lineValues);
    } catch (lineError) {
      quotes.getRange(quoteRow, 1, 1, quoteValues.length).clearContent();
      throw lineError;
    }

    return jsonOutput_({ ok: true, duplicate: false, folio: folio, cotizacionId: quoteId, partidas: lineValues.length });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function readPayload_(e) {
  if (e && e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  if (e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  throw new Error('No se recibió payload.');
}

function validatePayload_(data) {
  if (!data || !data.externalId || !data.quote || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Payload incompleto: se requiere externalId, quote y al menos una partida.');
  }
  if (!String(data.quote.client || '').trim()) throw new Error('Falta el nombre del cliente.');
  if (!['Residencial', 'Comercial', 'Industrial'].includes(normalizeLine_(data.quote.line))) {
    throw new Error('La línea debe ser Residencial, Comercial o Industrial.');
  }
  parseLocalDate_(data.quote.date);
  data.items.forEach((item, i) => {
    if (!item || !String(item.description || '').trim()) throw new Error('Falta la descripción de la partida ' + (i + 1) + '.');
    if (!(Number(item.quantity) > 0) || !(Number(item.unitPrice) >= 0)) {
      throw new Error('Cantidad o precio inválido en la partida ' + (i + 1) + '.');
    }
    if (!String(item.unit || '').trim()) throw new Error('Falta la unidad en la partida ' + (i + 1) + '.');
  });
}

function getCrmSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('CRM_SPREADSHEET_ID');
  if (!id) throw new Error('Configura CRM_SPREADSHEET_ID en las propiedades del script.');
  return SpreadsheetApp.openById(id);
}

function requireSheet_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('No existe la pestaña requerida: ' + name);
  return sheet;
}

function getHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) throw new Error('La pestaña ' + sheet.getName() + ' no tiene encabezados.');
  return sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(String);
}

function requireHeaders_(headers, required) {
  const missing = required.filter(name => headers.indexOf(name) === -1);
  if (missing.length) throw new Error('Faltan encabezados: ' + missing.join(', '));
}

function objectToRow_(headers, values) {
  return headers.map(header => Object.prototype.hasOwnProperty.call(values, header) ? values[header] : '');
}

function findByValue_(sheet, headers, keyName, keyValue) {
  const col = headers.indexOf(keyName) + 1;
  const lastRow = sheet.getLastRow();
  if (col < 1 || lastRow < 2) return null;
  const found = sheet.getRange(2, col, lastRow - 1, 1).createTextFinder(String(keyValue)).matchEntireCell(true).findNext();
  if (!found) return null;
  const row = sheet.getRange(found.getRow(), 1, 1, headers.length).getValues()[0];
  return rowToObject_(headers, row);
}

function rowToObject_(headers, row) {
  return headers.reduce((result, header, i) => { result[header] = row[i]; return result; }, {});
}

function findClient_(sheet, clientName) {
  const headers = getHeaders_(sheet);
  const idCol = headers.indexOf('ClienteID');
  const nameCol = headers.indexOf('NombreComercial');
  const rfcCol = headers.indexOf('RFC');
  if (idCol < 0 || nameCol < 0 || sheet.getLastRow() < 2) return { id: '', rfc: '' };
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  const target = normalizeText_(clientName);
  const match = rows.find(row => normalizeText_(row[nameCol]) === target);
  return match ? { id: match[idCol] || '', rfc: rfcCol >= 0 ? (match[rfcCol] || '') : '' } : { id: '', rfc: '' };
}

function getMaxConsecutive_(sheet, headers) {
  const col = headers.indexOf('Consecutivo') + 1;
  const lastRow = sheet.getLastRow();
  if (col < 1 || lastRow < 2) return FIRST_CRM_FOLIO - 1;
  return sheet.getRange(2, col, lastRow - 1, 1).getValues().reduce((max, row) => {
    const n = parseInt(row[0], 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, FIRST_CRM_FOLIO - 1);
}

function calculateTotals_(items) {
  const subtotal = money_(items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0));
  const iva = money_(subtotal * 0.16);
  return { subtotal: subtotal, iva: iva, total: money_(subtotal + iva) };
}

function parseLocalDate_(value) {
  const text = String(value || '').trim();
  let m = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!m) {
    m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) throw new Error('Fecha inválida. Usa DD/MM/AAAA o AAAA-MM-DD.');
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function positiveInteger_(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function money_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizeText_(value) {
  return String(value || '').trim().toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeLine_(value) {
  const v = String(value || '').trim().toLocaleLowerCase('es-MX');
  if (v === 'res' || v === 'residencial') return 'Residencial';
  if (v === 'ind' || v === 'industrial') return 'Industrial';
  if (v === 'com' || v === 'comercial') return 'Comercial';
  return String(value || '').trim();
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
