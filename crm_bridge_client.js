/* ArreglaYa Cotizador — CRM bridge client (TEST branch only)
 * The endpoint URL is stored in this browser's localStorage, not in the public source.
 * The endpoint must be deployed by the owner with access restricted to "Only myself".
 */
(() => {
  const CFG_KEY = 'ay_cfg';
  const EXT_KEY = 'ay_crm_external_id';
  const MESSAGE_TYPE = 'AY_CRM_BRIDGE_RESULT';

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function saveConfig(config) {
    localStorage.setItem(CFG_KEY, JSON.stringify(config));
  }

  function showStatus(message) {
    if (typeof window.showToast === 'function') window.showToast(message);
    else alert(message);
  }

  function injectConfigField() {
    const feedback = document.getElementById('cfg-feedback-url');
    const parent = feedback && feedback.closest('.cfg-field');
    if (!parent || document.getElementById('cfg-crm-bridge-url')) return;

    const field = document.createElement('div');
    field.className = 'cfg-field';
    field.innerHTML = '<label for="cfg-crm-bridge-url">URL Web App del CRM de PRUEBA</label>' +
      '<input type="url" id="cfg-crm-bridge-url" placeholder="https://script.google.com/macros/s/.../exec">' +
      '<div class="hint-text">Endpoint exclusivo de pruebas. Implementa con “Ejecutar como: yo” y “Acceso: solo yo”. Se guarda solo en este navegador.</div>';
    parent.insertAdjacentElement('afterend', field);
    document.getElementById('cfg-crm-bridge-url').value = getConfig().crmBridgeUrl || '';

    const originalSave = window.guardarConfig;
    if (typeof originalSave === 'function') {
      window.guardarConfig = function() {
        const crmBridgeUrl = document.getElementById('cfg-crm-bridge-url')?.value.trim() || '';
        originalSave();
        const config = getConfig();
        config.crmBridgeUrl = crmBridgeUrl;
        saveConfig(config);
      };
    }
  }

  function injectSaveButton() {
    const actions = document.querySelector('#cot-actions .cot-actions');
    if (!actions || document.getElementById('btn-save-crm-draft')) return;
    const button = document.createElement('button');
    button.id = 'btn-save-crm-draft';
    button.className = 'btn-new';
    button.type = 'button';
    button.textContent = 'Guardar borrador en CRM';
    button.addEventListener('click', saveQuoteToCrm);
    actions.insertBefore(button, actions.firstChild);
  }

  function getQuotePayload() {
    const quoteItems = typeof items !== 'undefined' && Array.isArray(items) ? items : [];
    if (!quoteItems.length) throw new Error('Agrega al menos una partida.');
    const client = document.getElementById('c-cliente')?.value.trim();
    if (!client) throw new Error('Escribe el nombre del cliente.');

    const line = document.getElementById('c-linea')?.value.trim() || window.lineaNombre?.() || '';
    const description = document.getElementById('c-desc')?.value.trim() || '';
    const date = document.getElementById('c-fecha')?.value.trim() || '';
    const validityDays = Number(document.getElementById('c-vigencia')?.value || 15);
    const notes = document.getElementById('c-anticipo')?.value
      ? 'Condición comercial: ' + document.getElementById('c-anticipo').value
      : '';

    return {
      quote: {
        client,
        line,
        description,
        date,
        validityDays,
        owner: getConfig().responsable || '',
        notes
      },
      items: quoteItems.map(item => {
        const service = (typeof catalog !== 'undefined' && Array.isArray(catalog) ? catalog : [])
          .find(row => row.name === item.desc);
        return {
          description: item.desc,
          category: item.cat || '',
          unit: item.unit || 'serv',
          quantity: Number(item.cant),
          unitPrice: Number(item.precio),
          line: item.linea || line,
          manual: Boolean(item.manual),
          serviceCode: service?.code || ''
        };
      })
    };
  }

  function getExternalId(snapshot) {
    const fingerprint = JSON.stringify(snapshot);
    try {
      const saved = JSON.parse(sessionStorage.getItem(EXT_KEY) || 'null');
      if (saved && saved.fingerprint === fingerprint && saved.id) return saved.id;
      const id = 'WEB-' + crypto.randomUUID();
      sessionStorage.setItem(EXT_KEY, JSON.stringify({ id, fingerprint }));
      return id;
    } catch (_) {
      return 'WEB-' + crypto.randomUUID();
    }
  }

  function saveQuoteToCrm() {
    const endpoint = getConfig().crmBridgeUrl;
    if (!endpoint) {
      showStatus('Configura la URL del Web App del CRM de PRUEBA en Config.');
      return;
    }

    let snapshot;
    try { snapshot = getQuotePayload(); }
    catch (error) { showStatus('⚠️ ' + error.message); return; }

    const externalId = getExternalId(snapshot);
    const payload = { ...snapshot, externalId, requestId: externalId };
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = endpoint;
    form.target = '_blank';
    form.rel = 'noopener';
    form.style.display = 'none';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = JSON.stringify(payload);
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 3000);

    showStatus('Solicitud enviada a Google. Revisa la pestaña de respuesta y confirma el folio antes de generar el PDF.');
  }

  function wrapNewQuote() {
    const original = window.nuevaCotizacion;
    if (typeof original !== 'function' || original.__crmWrapped) return;
    const wrapped = function() {
      try { sessionStorage.removeItem(EXT_KEY); } catch (_) {}
      const button = document.getElementById('btn-save-crm-draft');
      if (button) { button.disabled = false; button.textContent = 'Guardar borrador en CRM'; }
      return original.apply(this, arguments);
    };
    wrapped.__crmWrapped = true;
    window.nuevaCotizacion = wrapped;
  }

  function init() {
    injectConfigField();
    injectSaveButton();
    wrapNewQuote();
    new MutationObserver(() => {
      injectConfigField();
      injectSaveButton();
      wrapNewQuote();
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
