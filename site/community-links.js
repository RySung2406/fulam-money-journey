// Only enable a real participant-community invitation. Never infer membership from a click.
(() => {
  let invite = '';
  try {
    const url = new URL(window.FULIN_CONFIG?.whatsappCommunityUrl || '');
    if (url.protocol === 'https:' && url.hostname === 'chat.whatsapp.com' &&
        !url.username && !url.password && !url.port && /^\/[A-Za-z0-9]+\/?$/.test(url.pathname)) {
      invite = url.href;
    }
  } catch { /* An empty or invalid invite leaves the honest pending state visible. */ }
  document.querySelectorAll('[data-community-invite]').forEach(link => {
    link.hidden = !invite;
    if (invite) {
      link.href = invite;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.removeAttribute('href');
    }
  });
  document.querySelectorAll('[data-community-pending]').forEach(note => { note.hidden = Boolean(invite); });
})();
