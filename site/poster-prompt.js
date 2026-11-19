(() => {
  const poster = document.getElementById('poster-prompt');
  if (location.hash || typeof poster?.showModal !== 'function') return;

  const storageKey = 'fulam-programme-poster-seen';
  try {
    if (sessionStorage.getItem(storageKey)) return;
  } catch { /* Allow the prompt when browser storage is unavailable. */ }

  poster.querySelector('.poster-close').addEventListener('click', () => poster.close());
  poster.querySelector('.poster-cta').addEventListener('click', () => {
    poster.close();
    document.getElementById('play').focus({ preventScroll: true });
  });

  poster.showModal();
  try { sessionStorage.setItem(storageKey, 'seen'); }
  catch { /* The close button remains available. */ }
})();
