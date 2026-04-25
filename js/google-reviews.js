/**
 * Google Reviews Widget — TD PEINTURE RENOVATION
 * Fetch + render avis Google via edge function Supabase.
 * NB: l'edge function attend ?domain= (pas ?place_id=).
 *     Le lookup domain → client_id → place_id est fait côté serveur.
 */
(function() {
  const PLACE_ID = 'ChIJc8u4JvKCDogRurf-P2grNjE';
  const DOMAIN = 'artisanpeintre-saintgenislaval69.fr';
  const ENDPOINT = 'https://slcksfqbsbcmvqupbhox.supabase.co/functions/v1/site-google-reviews?domain=' + window.location.hostname;
  const WRITE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=' + PLACE_ID;

  function relativeDate(timestamp) {
    if (!timestamp) return '';
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    const months = Math.floor(diff / (30 * 86400));
    if (months < 1) return 'récemment';
    if (months === 1) return 'il y a 1 mois';
    if (months < 12) return 'il y a ' + months + ' mois';
    const years = Math.floor(months / 12);
    return years === 1 ? 'il y a 1 an' : 'il y a ' + years + ' ans';
  }

  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function formatRating(r) {
    if (typeof r !== 'number' || isNaN(r)) return '—';
    return r.toFixed(1);
  }

  function renderSummary(data, ratingEl, countEl) {
    if (!ratingEl || !countEl) return;
    const rating = data.rating || (data.review && data.review.rating) || null;
    const total = data.user_ratings_total || (data.reviews ? data.reviews.length : 0);
    if (typeof rating === 'number') {
      ratingEl.textContent = formatRating(rating) + '/5';
    } else {
      ratingEl.textContent = '—';
    }
    countEl.textContent = total > 0 ? 'basé sur ' + total + ' avis Google' : 'Avis à venir';
  }

  function renderCarousel(reviews, container) {
    if (!container) return;
    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<div class="avis-slide active" style="display:block;"><p class="avis-quote">Soyez le premier à laisser un avis sur Google !</p></div>';
      return;
    }
    const html = reviews.slice(0, 6).map((r, i) => {
      const initials = getInitials(r.author_name || r.author);
      const text = escapeHtml(r.text || '');
      const author = escapeHtml(r.author_name || r.author || 'Client');
      const date = relativeDate(r.time);
      const rating = r.rating || 5;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const active = i === 0 ? ' active' : '';
      const display = i === 0 ? '' : 'style="display:none;"';
      return `<div class="avis-slide${active}" ${display}>
        <p class="avis-quote">"${text}"</p>
        <div class="avis-author-row">
          <div class="avis-avatar">${initials}</div>
          <div>
            <div class="avis-author-name">${author}</div>
            <div class="avis-author-meta">${stars} • ${date}</div>
          </div>
        </div>
      </div>`;
    }).join('');
    container.innerHTML = html;

    const slides = container.querySelectorAll('.avis-slide');
    let cur = 0;
    function showSlide(n) {
      if (n < 0) n = slides.length - 1;
      if (n >= slides.length) n = 0;
      slides.forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
      slides[n].classList.add('active');
      slides[n].style.display = 'block';
      cur = n;
    }
    const prev = document.getElementById('avis-prev');
    const next = document.getElementById('avis-next');
    if (prev) prev.addEventListener('click', () => showSlide(cur - 1));
    if (next) next.addEventListener('click', () => showSlide(cur + 1));
    if (slides.length > 1) setInterval(() => showSlide(cur + 1), 7000);
  }

  function renderFullList(reviews, container) {
    if (!container) return;
    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<p style="text-align:center;opacity:.7;">Aucun avis pour le moment. <a href="' + WRITE_REVIEW_URL + '" target="_blank" rel="noopener">Soyez le premier !</a></p>';
      return;
    }
    const html = reviews.map(r => {
      const initials = getInitials(r.author_name || r.author);
      const text = escapeHtml(r.text || '');
      const author = escapeHtml(r.author_name || r.author || 'Client');
      const date = relativeDate(r.time);
      const rating = r.rating || 5;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      return `<div class="avis-slide" style="display:block;margin-bottom:1.5rem;background:rgba(255,255,255,.05);padding:1.5rem;border-radius:12px;">
        <div style="color:#F59E0B;margin-bottom:.5rem;font-size:1.1rem;">${stars}</div>
        <p class="avis-quote" style="margin-bottom:1rem;">"${text}"</p>
        <div class="avis-author-row">
          <div class="avis-avatar">${initials}</div>
          <div>
            <div class="avis-author-name">${author}</div>
            <div class="avis-author-meta">${date}</div>
          </div>
        </div>
      </div>`;
    }).join('');
    container.innerHTML = html;
  }

  function init() {
    fetch(ENDPOINT)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        const reviews = data.reviews || data.result?.reviews || [];
        renderSummary(data, document.getElementById('reviews-rating'), document.getElementById('reviews-count'));
        renderSummary(data, document.getElementById('reviews-rating-full'), document.getElementById('reviews-count-full'));
        renderCarousel(reviews, document.getElementById('reviews-carousel'));
        renderFullList(reviews, document.getElementById('reviews-list-full'));
      })
      .catch(err => {
        console.error('Reviews fetch error:', err);
        const ratingEl = document.getElementById('reviews-rating') || document.getElementById('reviews-rating-full');
        const countEl = document.getElementById('reviews-count') || document.getElementById('reviews-count-full');
        if (ratingEl) ratingEl.textContent = '—';
        if (countEl) countEl.textContent = 'Avis disponibles sur Google';
        const carousel = document.getElementById('reviews-carousel');
        if (carousel) carousel.innerHTML = '<div style="text-align:center;opacity:.7;"><a href="' + WRITE_REVIEW_URL + '" target="_blank" rel="noopener" style="color:#F59E0B;">Voir les avis sur Google</a></div>';
        const list = document.getElementById('reviews-list-full');
        if (list) list.innerHTML = '<div style="text-align:center;opacity:.7;"><a href="' + WRITE_REVIEW_URL + '" target="_blank" rel="noopener" style="color:#F59E0B;">Voir les avis sur Google</a></div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
