/**
 * Contact form handler — MEGA-FIX
 * Submits to Supabase edge function + shows REAL errors (no fake success)
 */
(function() {
  const ENDPOINT = 'https://slcksfqbsbcmvqupbhox.supabase.co/functions/v1/partner-site-lead-submit?source=tdpeinture-saintgenislaval';

  function showError(form, msg) {
    // Remove any previous error/success
    form.parentNode.querySelectorAll('.form-error, .form-success').forEach(n => n.remove());
    const errMsg = document.createElement('div');
    errMsg.className = 'form-error';
    errMsg.style.cssText = 'background:#fee;color:#c33;padding:1rem;border-radius:8px;margin-top:1rem;border-left:4px solid #c33;';
    errMsg.innerHTML = msg || '<strong>Erreur de soumission.</strong><br>Réessayez ou appelez-nous directement au <a href="tel:+33214739816" style="color:#c33;font-weight:bold;">02 14 73 98 16</a>.';
    form.parentNode.insertBefore(errMsg, form.nextSibling);
  }

  function showSuccess(form) {
    form.parentNode.querySelectorAll('.form-error, .form-success').forEach(n => n.remove());
    const ok = document.createElement('div');
    ok.className = 'form-success';
    ok.style.cssText = 'background:#e8f5e9;color:#2e7d32;padding:1.25rem;border-radius:8px;margin-top:1rem;border-left:4px solid #2e7d32;font-weight:600;';
    ok.innerHTML = 'Merci ! Votre demande a bien été envoyée. Réponse sous 24h.';
    form.style.display = 'none';
    form.parentNode.insertBefore(ok, form.nextSibling);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.origText = submitBtn.textContent; submitBtn.textContent = 'Envoi en cours...'; }

    // Build payload from form fields
    const fd = new FormData(form);
    const payload = {};
    for (const [k, v] of fd.entries()) payload[k] = v;

    // RGPD must be checked
    if (!payload.rgpd) {
      showError(form, '<strong>Veuillez accepter la politique de confidentialité.</strong>');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.origText || 'Envoyer'; }
      return;
    }

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => {
      if (!r.ok) return r.text().then(t => { throw new Error('HTTP ' + r.status + ': ' + t); });
      return r.json().catch(() => ({}));
    })
    .then(() => {
      showSuccess(form);
    })
    .catch(err => {
      console.error('[contact-form] submit error:', err);
      showError(form);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.origText || 'Envoyer'; }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('form').forEach(form => {
      // Only attach to forms posting to our endpoint or that have name=email/firstname
      const action = (form.getAttribute('action') || '').toLowerCase();
      const hasOurFields = form.querySelector('[name="firstname"], [name="email"], [name="_client_id"]');
      if (action.includes('partner-site-lead-submit') || hasOurFields) {
        form.addEventListener('submit', handleSubmit);
      }
    });
  });
})();
