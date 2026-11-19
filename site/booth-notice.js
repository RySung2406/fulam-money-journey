(() => {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Hong_Kong' }).format(new Date());
  if (today > '2026-11-30' || typeof HTMLDialogElement === 'undefined' ||
      typeof HTMLDialogElement.prototype.showModal !== 'function') return;
  if (document.body.classList.contains('account-page') && location.hash) return;

  // Remember this event across the site. Session storage also works when persistent storage is blocked.
  const key = 'fulam-booth-notice-2026-11';
  let remembered = false;
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      const storage = window[name];
      if (storage.getItem(key)) return;
      storage.setItem(key, 'seen');
      remembered = true;
      break;
    } catch { /* Try the next available store. */ }
  }
  if (!remembered) return;

  const boothSection = document.querySelector('.directory #booth');
  if (boothSection && ['#booth', '#rewards'].includes(location.hash)) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'booth-notice';
  dialog.setAttribute('aria-labelledby', 'booth-notice-title');
  dialog.innerHTML = `
    <header class="booth-notice-header">
      <p class="booth-notice-team">港大學生團隊「搏富臨」</p>
      <h2 id="booth-notice-title" autofocus tabindex="-1">校園聖誕攤位</h2>
      <button type="button" class="booth-notice-language" data-no-i18n lang="en">English</button>
      <button type="button" class="booth-notice-close" aria-label="關閉攤位通知">×</button>
    </header>
    <div class="booth-notice-body">
      <p class="booth-notice-dates">
        <time datetime="2026-11-20">11 月 20 日（五）</time>
        <span>及</span>
        <time datetime="2026-11-30">11 月 30 日（一）</time>
      </p>
      <p class="booth-notice-place">邵逸夫樓平台（鄰近 Subway）</p>
      <p class="booth-notice-invite">歡迎港大同學到場參與理財小遊戲。</p>
      <div class="booth-notice-actions">
        <a class="booth-notice-details">查看攤位安排</a>
        <button type="button" class="booth-notice-dismiss">繼續瀏覽</button>
      </div>
    </div>`;
  if (today > '2026-11-20') {
    dialog.querySelector('time[datetime="2026-11-20"]').remove();
    dialog.querySelector('.booth-notice-dates span').remove();
  }

  const details = dialog.querySelector('.booth-notice-details');
  details.href = boothSection ? '#booth' : new URL('hub/#booth', document.currentScript.src).href;
  details.addEventListener('click', () => {
    dialog.close();
    boothSection?.focus({ preventScroll: true });
  });
  dialog.querySelector('.booth-notice-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.booth-notice-dismiss').addEventListener('click', () => dialog.close());

  const languageButton = dialog.querySelector('.booth-notice-language');
  function updateLanguageButton() {
    const english = window.FuLamI18n.getLanguage() === 'en';
    languageButton.lang = english ? 'zh-Hant' : 'en';
    languageButton.textContent = english ? '繁中' : 'English';
    languageButton.setAttribute('aria-label', english ? '切換至繁體中文' : 'Switch to English');
  }
  updateLanguageButton();
  languageButton.addEventListener('click', () => window.FuLamI18n.setLanguage(languageButton.lang));
  document.addEventListener('fulam-language-change', updateLanguageButton);
  dialog.addEventListener('close', () => {
    document.removeEventListener('fulam-language-change', updateLanguageButton);
    dialog.remove();
  }, { once: true });

  document.body.append(dialog);
  dialog.showModal();
})();
