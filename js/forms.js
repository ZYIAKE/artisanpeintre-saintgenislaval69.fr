/* ═══════════════════════════════════════════════════════════════
   forms.js — Validation + submit (contact + devis multi-étapes)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ────────────────────────────────────────
  // Form multi-étapes (devis)
  // ────────────────────────────────────────
  const devisForm = document.getElementById('devisForm');
  if (devisForm) {
    const steps = devisForm.querySelectorAll('.form-step');
    const indicators = document.querySelectorAll('#stepIndicator .step-dot');

    function goToStep(n) {
      steps.forEach(s => s.classList.toggle('is-active', +s.dataset.step === n));
      indicators.forEach(i => {
        const step = +i.dataset.step;
        i.classList.toggle('is-active', step === n);
        i.classList.toggle('is-done', step < n);
      });
      // Scroll vers le haut du form
      devisForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    devisForm.querySelectorAll('[data-next-step]').forEach(btn => {
      btn.addEventListener('click', function () {
        const currentStep = this.closest('.form-step');
        // Valider les champs required de l'étape courante
        const requiredInputs = currentStep.querySelectorAll('[required]');
        let valid = true;
        requiredInputs.forEach(input => {
          if (!input.checkValidity()) {
            input.classList.add('is-error');
            valid = false;
          } else {
            input.classList.remove('is-error');
          }
        });
        if (!valid) {
          const firstInvalid = currentStep.querySelector('.is-error');
          if (firstInvalid) firstInvalid.focus();
          return;
        }
        goToStep(+this.dataset.nextStep);
      });
    });

    devisForm.querySelectorAll('[data-prev-step]').forEach(btn => {
      btn.addEventListener('click', function () {
        goToStep(+this.dataset.prevStep);
      });
    });
  }

  // ────────────────────────────────────────
  // Submit handler générique (contact + devis)
  // ────────────────────────────────────────
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const statusEl = form.querySelector('#formStatus');
      const formType = form.dataset.form;

      // Honeypot check
      const honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) {
        // Spam détecté — on fait semblant d'envoyer mais on ne fait rien
        console.warn('[forms] Honeypot triggered');
        window.location.href = '/merci?form=' + encodeURIComponent(formType);
        return;
      }

      // Validation finale
      if (!form.checkValidity()) {
        form.querySelectorAll(':invalid').forEach(el => el.classList.add('is-error'));
        const firstInvalid = form.querySelector('.is-error');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // UI loading
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Envoi en cours...';
      }

      // Préparer les données
      const formData = new FormData(form);
      const payload = {};
      formData.forEach((value, key) => {
        if (key.startsWith('photos')) return; // photos traitées séparément
        payload[key] = value;
      });

      // Track soumission GA4 (avant envoi, pour choper même les échecs réseau)
      if (typeof gtag === 'function') {
        gtag('event', 'form_submit', {
          form_type: formType,
          form_name: form.id
        });
      }

      try {
        const actionUrl = form.getAttribute('action');
        const res = await fetch(actionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Erreur ${res.status}`);

        // Succès → redirection vers /merci
        const service = payload.service || payload.subject || '';
        window.location.href = '/merci?form=' + encodeURIComponent(formType) +
                              (service ? '&service=' + encodeURIComponent(service) : '');
      } catch (err) {
        console.error('[forms] Submit error:', err);
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.background = '#FEE2E2';
          statusEl.style.color = '#991B1B';
          statusEl.innerHTML = 'Une erreur est survenue. Merci de réessayer ou de nous appeler directement.';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText;
        }
      }
    });

    // Retirer la classe is-error quand l'utilisateur corrige
    form.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', function () {
        if (this.checkValidity()) this.classList.remove('is-error');
      });
    });
  });
})();
