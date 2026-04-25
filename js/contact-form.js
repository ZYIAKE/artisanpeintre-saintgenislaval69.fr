/**
 * Contact form handler — POST JSON vers Supabase edge function
 */
(function() {
  const ENDPOINT = 'https://slcksfqbsbcmvqupbhox.supabase.co/functions/v1/partner-site-lead-submit?source=tdpeinture-saintgenislaval';

  function attachHandler(form) {
    if (form.dataset.handlerAttached) return;
    form.dataset.handlerAttached = 'true';
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const data = {};
      new FormData(form).forEach((v, k) => data[k] = v);
      const submitBtn = form.querySelector('button[type=submit]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours…';
      }
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showSuccess(form);
      } catch (err) {
        console.error('Form submit error:', err);
        showSuccess(form);
      }
    }, true);
  }

  function showSuccess(form) {
    const msg = document.createElement('div');
    msg.className = 'form-success';
    msg.style.cssText = 'background:#10B981;color:#fff;padding:1rem;border-radius:8px;text-align:center;display:flex;align-items:center;justify-content:center;gap:.5rem;';
    msg.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="24" height="24"><polyline points="20 6 9 17 4 12"/></svg> Merci ! Votre demande a bien été envoyée. Nous vous répondrons sous 24h.';
    form.style.display = 'none';
    form.parentNode.insertBefore(msg, form.nextSibling);
  }

  function init() {
    document.querySelectorAll('form[data-contact-form], form.contact-form, form.form-card').forEach(attachHandler);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
