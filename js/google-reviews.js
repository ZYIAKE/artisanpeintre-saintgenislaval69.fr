// google-reviews.js — Widget avis Google officiel (généré automatiquement)
// Appelle l'edge function site-google-reviews avec ?domain={hostname} (§0.14 guide v3).
// Rend un widget visuellement proche du widget Google officiel : logo G multicolore,
// note + étoiles, cards avis avec photo profil + date relative, fallback CTA si 0 avis.
(function () {
  var DOMAIN = window.location.hostname || "artisanpeintre-saintgenislaval69.fr";
  var ENDPOINT = 'https://slcksfqbsbcmvqupbhox.supabase.co/functions/v1/site-google-reviews?domain=' + encodeURIComponent(DOMAIN);

  // Logo G Google officiel (SVG inline, multicolore, optimisé)
  var GOOGLE_G_SVG = '<svg class="gr-google-g" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>' +
    '<path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>' +
    '<path fill="#FBBC04" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>' +
    '<path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>' +
    '</svg>';

  var GOOGLE_G_MINI = '<svg class="gr-google-g-mini" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>' +
    '<path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>' +
    '<path fill="#FBBC04" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>' +
    '<path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>' +
    '</svg>';

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Map relative_time anglais Google → français (best-effort, MVP)
  function frRelativeTime(s) {
    if (!s) return '';
    var t = String(s).toLowerCase().trim();
    var m;
    if ((m = t.match(/^a (week|month|year|day|hour|minute) ago$/))) {
      var map = { day: 'jour', week: 'semaine', month: 'mois', year: 'an', hour: 'heure', minute: 'minute' };
      return 'il y a 1 ' + map[m[1]];
    }
    if ((m = t.match(/^(\d+)\s+(weeks?|months?|years?|days?|hours?|minutes?)\s+ago$/))) {
      var n = m[1], u = m[2].replace(/s$/, '');
      var umap = { day: 'jour', week: 'semaine', month: 'mois', year: 'an', hour: 'heure', minute: 'minute' };
      var fr = umap[u] || u;
      var num = parseInt(n, 10);
      if (num > 1) {
        if (fr === 'an') fr = 'ans';
        else if (fr !== 'mois') fr = fr + 's';
      }
      return 'il y a ' + n + ' ' + fr;
    }
    return s;
  }

  function starsSvg(n) {
    var html = '<span class="gr-stars" aria-label="' + n + ' étoiles sur 5">';
    for (var i = 1; i <= 5; i++) {
      var filled = i <= n;
      html += '<svg viewBox="0 0 24 24" class="gr-star ' + (filled ? 'filled' : 'empty') + '" aria-hidden="true">' +
        '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>';
    }
    html += '</span>';
    return html;
  }

  function avatarHtml(photoUrl, name) {
    var safeName = escapeHtml(name || 'Anonyme');
    var initial = (name || 'A').charAt(0).toUpperCase();
    if (photoUrl) {
      return '<img class="gr-avatar" src="' + escapeHtml(photoUrl) + '" alt="' + safeName + '" referrerpolicy="no-referrer" loading="lazy" onerror="this.outerHTML=\'<div class=\\\'gr-avatar gr-avatar-fallback\\\'>' + escapeHtml(initial) + '</div>\'">';
    }
    return '<div class="gr-avatar gr-avatar-fallback">' + escapeHtml(initial) + '</div>';
  }

  function reviewCard(r) {
    var name = r.author || r.author_name || r.reviewer_name || 'Anonyme';
    var photo = r.photoUrl || r.profile_photo_url || null;
    var rating = parseInt(r.rating || r.star_rating || 5, 10);
    var when = frRelativeTime(r.relativeTime || r.relative_time_description || '');
    var text = String(r.text || r.comment || '').trim();
    var truncated = false;
    if (text.length > 280) {
      var cut = text.substring(0, 280);
      var lastSp = cut.lastIndexOf(' ');
      text = (lastSp > 240 ? cut.substring(0, lastSp) : cut) + '…';
      truncated = true;
    }
    return '<article class="gr-card">' +
      '<header class="gr-card-head">' +
        avatarHtml(photo, name) +
        '<div class="gr-card-id">' +
          '<div class="gr-author">' + escapeHtml(name) + '</div>' +
          '<div class="gr-card-meta">' + starsSvg(rating) + (when ? '<span class="gr-date">' + escapeHtml(when) + '</span>' : '') + '</div>' +
        '</div>' +
        '<span class="gr-card-g" title="Avis Google">' + GOOGLE_G_MINI + '</span>' +
      '</header>' +
      '<p class="gr-text">' + escapeHtml(text) + (truncated ? ' <span class="gr-readmore">Lire plus</span>' : '') + '</p>' +
    '</article>';
  }

  function summaryHtml(rating, total, gmapsUrl) {
    var ratingTxt = rating > 0 ? rating.toFixed(1) : '—';
    var totalTxt = total > 0 ? (total + ' avis Google') : 'Pas encore d\'avis publiés';
    return '<div class="gr-summary">' +
      '<div class="gr-summary-logo">' + GOOGLE_G_SVG + '</div>' +
      '<div class="gr-summary-info">' +
        '<div class="gr-rating-row">' +
          '<span class="gr-rating-badge">' + ratingTxt + '</span>' +
          starsSvg(Math.round(rating)) +
        '</div>' +
        '<div class="gr-summary-count">' + totalTxt + '</div>' +
        '<div class="gr-summary-sub">basé sur les avis Google</div>' +
      '</div>' +
      (gmapsUrl ? '<a class="gr-summary-cta" href="' + escapeHtml(gmapsUrl) + '" target="_blank" rel="noopener">Voir sur Google →</a>' : '') +
    '</div>';
  }

  function emptyStateHtml(gmapsUrl) {
    return '<div class="gr-empty">' +
      '<div class="gr-empty-icon">' + GOOGLE_G_SVG + '</div>' +
      '<h3 class="gr-empty-title">Pas encore d\'avis publiés sur Google</h3>' +
      '<p class="gr-empty-text">Soyez le premier à partager votre expérience. Votre avis aide d\'autres clients à nous découvrir.</p>' +
      (gmapsUrl ? '<a class="gr-empty-cta" href="' + escapeHtml(gmapsUrl) + '" target="_blank" rel="noopener">Laisser un avis sur Google →</a>' : '') +
    '</div>';
  }

  function footerHtml() {
    return '<div class="gr-footer">' + GOOGLE_G_MINI +
      '<span>Avis vérifiés via Google Business Profile</span>' +
    '</div>';
  }

  function render(data) {
    var widget = document.getElementById('google-reviews-widget');
    if (!widget) return;
    var reviews = (data && Array.isArray(data.reviews)) ? data.reviews : [];
    var rating = (data && typeof data.rating === 'number') ? data.rating : 0;
    var total = (data && (data.total || data.totalReviews || data.reviews_count)) || reviews.length;
    var gmapsUrl = (data && data.googleMapsUrl) || '';

    var html = summaryHtml(rating, total, gmapsUrl);

    if (reviews.length > 0) {
      html += '<div class="gr-grid">';
      for (var i = 0; i < Math.min(6, reviews.length); i++) {
        html += reviewCard(reviews[i]);
      }
      html += '</div>';
    } else {
      html += emptyStateHtml(gmapsUrl);
    }

    html += footerHtml();
    widget.innerHTML = html;
    widget.classList.add('gr-loaded');

    // "Lire plus" → ouvre la fiche Google (texte tronqué côté API, expansion impossible localement)
    widget.querySelectorAll('.gr-readmore').forEach(function (el) {
      el.addEventListener('click', function () {
        if (gmapsUrl) window.open(gmapsUrl, '_blank', 'noopener');
      });
      el.style.cursor = 'pointer';
    });
  }

  function renderError() {
    var widget = document.getElementById('google-reviews-widget');
    if (!widget) return;
    widget.innerHTML = summaryHtml(0, 0, '') + footerHtml();
    widget.classList.add('gr-loaded');
  }

  fetch(ENDPOINT)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { if (data) render(data); else renderError(); })
    .catch(function () { renderError(); });
})();
