(() => {
  'use strict';
  const store = window.FuLamStation;
  const params = new URLSearchParams(location.search);
  const review = params.get('review');
  const view = review !== null ? 'review' : params.get('view') || 'entry';
  const postTest = 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=dY4N6LlSOUijWIeruTs1Z-VOzApBm_VOvTm0gGA8MWtUM1Q3UVlZQlpZTlZVV05HVlo1WTNJR0JNMS4u';
  const names = {knife: ['富臨一刀', 'One Slice'], fishing: ['捕財達人', 'FuLam Catch'], fleet: ['財富戰機', 'Wealth Wings']};
  const $ = id => document.getElementById(id);
  const panel = $('panel');
  let english = false;
  let staffOpen = false;
  let entryGrant = null;
  try { english = localStorage.getItem('fulam-language') === 'en'; } catch {}
  const t = (zh, en) => english ? en : zh;
  const title = (value) => { $('heading').textContent = value; document.title = value + ' · FuLam'; };
  const gameName = game => t(...names[game]);
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const error = text => { $('message').textContent = text; };
  const storageError = () => error(t('無法讀寫這個瀏覽器的紀錄。請工作人員檢查儲存空間。','This browser could not read or save booth records. Ask staff to check its storage.'));
  const pinInput = (label, newPin = false) => `<label>${label}<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required autocomplete="${newPin ? 'new-password' : 'off'}"></label>`;
  const submit = label => `<button type="submit" class="play">${label}</button>`;
  function onSubmit(id, action) {
    $(id).onsubmit = async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button[type=submit]');
      if (button.disabled) return;
      button.disabled = true;
      error('');
      try { await action(form); } catch { storageError(); } finally { button.disabled = false; }
    };
  }
  async function authorized(form) {
    const pin = form.elements.pin;
    const ok = await store.checkPin(pin.value);
    pin.value = '';
    if (!ok) { error(t('工作人員 PIN 不正確。','Incorrect staff PIN.')); pin.focus(); }
    return ok;
  }
  async function entryRpc(method, args) {
    const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
    const endpoint = local ? location.origin : window.FULIN_CONFIG.supabaseUrl;
    try {
      const reply = await fetch(endpoint + '/rest/v1/rpc/booth_entry_' + method, {
        method:'POST', cache:'no-store', credentials:'omit',
        headers:{'Content-Type':'application/json', apikey:window.FULIN_CONFIG.supabasePublishableKey},
        body:JSON.stringify(args)
      });
      if (reply.status === 429) { error(t('嘗試次數過多，請於一分鐘後再試。','Too many attempts. Try again in one minute.')); return; }
      if (!reply.ok) throw new Error();
      return await reply.json();
    } catch { error(t('暫時無法連接驗證服務，請再試一次。','Cannot reach the verification service. Please try again.')); }
  }
  function entry() {
    title(t('攤位 UID 登記','Booth UID entry'));
    if (!entryGrant) {
      panel.innerHTML = `<section class="station-card"><form id="entry-lock"><label>${t('工作人員入口密碼','Staff entry password')}<input type="password" name="password" inputmode="numeric" required maxlength="64" autocomplete="off"></label>${submit(t('進入 UID 登記','Open UID entry'))}</form></section>`;
      onSubmit('entry-lock', async form => {
        const field = form.elements.password;
        const grant = await entryRpc('unlock', {p_password:field.value});
        field.value = '';
        if (grant) { entryGrant = grant; render(); }
        else if (grant === null) { error(t('入口密碼不正確。','Incorrect entry password.')); field.focus(); }
      });
      return;
    }
    if (!store.hasPin()) {
      panel.innerHTML = `<section class="station-card"><h2>${t('工作人員首次設定','Staff device setup')}</h2><p>${t('請為這部裝置設定 4 至 8 位數字 PIN，用於核對後測及匯出成績。','Choose a 4–8 digit staff PIN for this device. Staff use it to confirm post-tests and export scores.')}</p><form id="setup">${pinInput(t('設定 PIN','Choose a PIN'),true)}${submit(t('啟用攤位裝置','Set up this device'))}</form></section>`;
      onSubmit('setup', async form => { await store.setupPin(form.elements.pin.value); render(); });
      return;
    }
    panel.innerHTML = `<section class="station-card"><p>${t('以 UID 作為玩家名稱。遊戲後請在後測填寫相同的 UID 和聯絡方法，以便得獎時通知你。','Your UID is your player name. Use the same UID in the post-test and leave a contact method so we can reach you if you win.')}</p><form id="join" autocomplete="off">
      <label>${t('玩家 UID','Player UID')}<input name="uid" type="text" inputmode="numeric" required pattern="${store.uidPattern}" placeholder="303xxxxxxx" spellcheck="false" aria-describedby="uid-hint"></label>
      <small id="uid-hint">${t('請輸入以 303 開頭的 10 位數字，例如 3031234567。','Enter 10 digits starting with 303, for example 3031234567.')}</small>
      <label>${t('選擇遊戲','Choose a game')}<select name="game">${Object.keys(names).map(key => `<option value="${key}">${gameName(key)}</option>`).join('')}</select></label>
      ${submit(t('開始挑戰','Start game'))}</form></section><div class="station-actions"><a class="station-link" href="?view=ranking" target="_blank" rel="noopener">${t('另開排行榜 ↗','Open ranking display ↗')}</a><a class="station-link" href="?view=staff">${t('工作人員紀錄','Staff records')}</a></div>`;
    onSubmit('join', async form => {
      const attempt = await entryRpc('redeem', {p_token:entryGrant});
      if (attempt === undefined) return;
      entryGrant = null;
      if (!attempt) { render(); error(t('請重新輸入入口密碼。','Please enter the staff password again.')); return; }
      try { location.assign(store.launch(form.elements.game.value, form.elements.uid.value, attempt)); }
      catch { render(); storageError(); }
    });
  }
  function knifeReceipt(row) {
    const confirmed = row.confirmed;
    const uid = esc(row.uid);
    return `<section class="slice-receipt" aria-labelledby="slip-title">
      <div class="slip-score">
        <div class="slip-top"><h2 id="slip-title">${gameName('knife')}</h2>
          <span class="slip-status${confirmed ? ' is-confirmed' : ''}">${confirmed ? t('已核對','Confirmed') : t('待核對','Pending')}</span></div>
        <div class="slip-points"><strong>${row.score.toLocaleString('en-HK')}</strong><span>${t('分','pts')}</span></div>
        <div class="slip-uid"><span>UID</span> <b>${uid}</b></div>
      </div>
      ${confirmed ? '' : `<div class="slip-posttest station-qr">
        <img src="post-test-qr.svg" width="171" height="171" alt="${t('後測問卷 QR 碼','Post-test QR code')}">
        <div><h3>${t('掃碼填後測','Scan for the post-test')}</h3>
          <p>${t('填寫上方 UID 和聯絡方法，再請工作人員核對。','Enter your UID and contact details, then ask staff to verify.')}</p>
          <a href="${postTest}" target="_blank" rel="noopener noreferrer">${t('開啟問卷 ↗','Open form ↗')}</a></div>
      </div>
      <details class="slip-staff"><summary>${t('工作人員核對','Staff verification')}</summary>
        <p>${t('核對後測內的 UID 及聯絡方法。','Match the UID and contact details in the post-test response.')}</p>
        <form id="verify" autocomplete="off">${pinInput(t('工作人員 PIN','Staff PIN'))}${submit(t('確認並加入排名','Confirm score'))}</form>
      </details>`}
      <div class="slip-actions"><a class="${confirmed ? 'play' : 'slip-link'}" id="slip-next" href="station.html">${confirmed ? t('下一位參加者','Next player') : t('稍後核對，下一位','Keep pending · Next player')}</a>
        <a class="slip-link" href="?view=ranking">${t('排行榜','Rankings')} ↗</a></div>
    </section>`;
  }
  function receipt(rows) {
    const row = rows.find(item => item.id === review);
    if (!row) {
      title(t('找不到這局成績','Score unavailable'));
      panel.innerHTML = `<p>${t('請在遊玩時使用的裝置及瀏覽器開啟紀錄。','Open this record on the device and browser used for the game.')}</p>`;
      return;
    }
    if (!store.validUID(row.uid)) {
      title(t('舊有攤位紀錄','Archived booth score'));
      panel.innerHTML = `<section class="station-card"><strong>${gameName(row.game)} · UID ${esc(row.uid)}</strong><div class="station-score">${row.score.toLocaleString()}</div><p>${t('此成績使用舊格式 UID，已保留在工作人員紀錄內。','This score uses the previous UID format and is available in staff records.')}</p><a class="station-link" href="station.html">${t('下一位參加者','Next participant')}</a></section>`;
      return;
    }
    const confirmed = row.confirmed;
    if (row.game === 'knife') {
      title(t('攤位成績','Booth score'));
      panel.innerHTML = knifeReceipt(row);
    } else {
      title(confirmed ? t('成績已確認','Score confirmed') : t('完成後測，登上排行榜','Finish the post-test to join the rankings'));
      panel.innerHTML = `<section class="station-card"><strong>${gameName(row.game)} · UID ${esc(row.uid)}</strong><div class="station-score">${row.score.toLocaleString()}</div>
      ${confirmed ? `<p>${t('這局成績已獲確認。排行榜會顯示你在這款遊戲的最高分。','Your score is confirmed. The ranking shows your best score for this game.')}</p>` : `
      <p>${t('成績已儲存在本機。請用手機填寫後測，輸入上方的 UID 和聯絡方法，再請工作人員核對。如已提交，只需告知工作人員你的 UID。','Your score is saved on this device. Complete the post-test on your phone using the UID above and a contact method. If you already submitted it, give staff your UID to find your entry.')}</p>
      <div class="station-qr"><img src="post-test-qr.svg" alt="${t('後測問卷 QR 碼','Post-test QR code')}" width="164" height="164"><a class="station-link" href="${postTest}" target="_blank" rel="noopener noreferrer">${t('開啟後測問卷 ↗','Open post-test ↗')}</a></div>
      <details><summary>${t('工作人員核對','Staff verification')}</summary><p>${t('在後測回覆中找出 UID ' + row.uid + '，核對該回覆已填寫聯絡方法，再輸入工作人員 PIN。','Find UID ' + row.uid + ' in the submitted post-tests. Check that the matching entry includes a contact method, then enter your staff PIN.')}</p>
      <form id="verify" autocomplete="off">${pinInput(t('工作人員 PIN','Staff PIN'))}${submit(t('確認並加入排名','Confirm and rank score'))}</form></details>`}
      <div class="station-actions"><a class="${confirmed ? 'play' : 'station-link'}" href="station.html">${confirmed ? t('下一位參加者','Next participant') : t('稍後核對，下一位','Keep pending and start next player')}</a>
      ${confirmed ? `<a class="station-link" href="?view=ranking">${t('查看排行榜','See rankings')}</a>` : ''}</div></section>`;
    }
    if (!confirmed) onSubmit('verify', async form => {
      if (!await authorized(form)) return;
      store.confirm(localStorage, review);
      render();
      if (row.game === 'knife') $('slip-next')?.focus();
    });
  }
  function ranking(rows) {
    title(t('攤位排行榜','Booth rankings'));
    panel.innerHTML = `<div class="ranking-intro"><p>${t('每款遊戲各自排名，取每位玩家在本機已核對的最高分。同分並列。','Each game shows every player’s best confirmed score on this device. Equal scores share a rank.')}</p>${document.fullscreenEnabled ? '<button type="button" id="display">'+t('全螢幕顯示','Full screen')+'</button>' : ''}</div><div class="ranks">${Object.keys(names).map(game => {
      const leaders = store.leaderboard(rows, game);
      return `<section class="rank-card"><h2>${gameName(game)}</h2>${leaders.length ? `<table><thead><tr><th>${t('名次','Rank')}</th><th>UID</th><th>${t('分數','Score')}</th></tr></thead><tbody>${leaders.map(r => `<tr class="${r.rank === 1 ? 'first' : ''}"><td>#${r.rank}</td><td>${esc(r.player)}</td><td>${r.score.toLocaleString()}</td></tr>`).join('')}</tbody></table>` : `<p>${t('等候第一個已確認的成績。','Waiting for the first confirmed score.')}</p>`}</section>`;
    }).join('')}</div>`;
    if ($('display')) $('display').onclick = async () => {
      try { await document.documentElement.requestFullscreen(); }
      catch { error(t('請使用瀏覽器的全螢幕功能。','Use the browser’s full-screen control.')); }
    };
  }
  function exportCSV(rows) {
    const url = URL.createObjectURL(new Blob(['\uFEFF',store.toCSV(rows)], {type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'booth-marks-' + new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Hong_Kong'}) + '.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function staff() {
    title(t('本機攤位紀錄','Device score records'));
    if (!staffOpen) {
      panel.innerHTML = `<section class="station-card"><form id="unlock">${pinInput(t('工作人員 PIN','Staff PIN'))}${submit(t('檢視成績','View scores'))}</form></section>`;
      onSubmit('unlock', async form => { if (await authorized(form)) { staffOpen = true; render(); } });
      return;
    }
    const rows = store.records(localStorage);
    panel.innerHTML = `<div class="station-actions"><button id="export">${t('匯出全部成績 CSV','Export all scores as CSV')}</button><button id="lock">${t('鎖定','Lock')}</button></div>
    <details class="station-card"><summary>${t('合併不同裝置的成績','Combine scores from other devices')}</summary><p>${t('選取其他攤位裝置匯出的原始 CSV。相同的局數只會計算一次。','Choose original CSV exports from the other booth devices. Each attempt is counted once.')}</p>
    <form id="merge"><label>${t('攤位 CSV 檔案','Booth CSV files')}<input type="file" name="files" accept=".csv,text/csv" required multiple></label>${submit(t('合併到本機排行榜','Merge into this device’s rankings'))}</form></details><p id="import-status" role="status"></p>
    <div class="staff-table"><table><thead><tr><th>UID</th><th>${t('遊戲','Game')}</th><th>${t('分數','Score')}</th><th>${t('後測','Post-test')}</th></tr></thead><tbody>${rows.map(r => {
      let status = t('已核對','Confirmed');
      if (!store.validUID(r.uid)) status = t('舊格式 UID（已封存）','Archived UID');
      else if (!r.confirmed) status = `<a href="?review=${encodeURIComponent(r.id)}">${t('待核對','Review pending score')}</a>`;
      return `<tr><td>${esc(r.uid)}</td><td>${gameName(r.game)}</td><td>${r.score}</td><td>${status}</td></tr>`;
    }).join('')}</tbody></table></div>`;
    $('export').onclick = () => exportCSV(store.records(localStorage));
    $('lock').onclick = () => { staffOpen = false; render(); };
    onSubmit('merge', async form => {
      const files = await Promise.all(Array.from(form.elements.files.files, file => file.text()));
      try {
        const count = store.importExports(localStorage, files);
        render();
        $('import-status').textContent = t('已新增或更新 ' + count + ' 筆成績。', count + ' scores added or updated.');
      } catch (err) {
        if (err.name === 'QuotaExceededError' || err.name === 'SecurityError') storageError();
        else error(t('無法合併。請使用攤位匯出的原始 CSV，並檢查同一局的成績是否一致。','Could not merge. Use original booth CSV exports and check that duplicate attempts have matching scores.'));
      }
    });
  }
  function render() {
    error('');
    document.documentElement.lang = english ? 'en' : 'zh-Hant';
    $('back').textContent = t('← 聖誕攤位','← Christmas Booth');
    $('language').textContent = t('English','繁中');
    $('entry-tab').textContent = t('攤位 UID 登記','Booth UID entry');
    $('ranking-tab').textContent = t('排行榜','Rankings');
    for (const [id, active] of [['entry-tab', view === 'entry'], ['ranking-tab', view === 'ranking']]) {
      if (active) $(id).setAttribute('aria-current','page'); else $(id).removeAttribute('aria-current');
    }
    try {
      if (view === 'ranking') ranking(store.records(localStorage));
      else if (view === 'review') receipt(store.records(localStorage));
      else if (view === 'staff') staff();
      else entry();
    } catch { panel.replaceChildren(); storageError(); }
  }
  $('language').onclick = () => {
    english = !english;
    try { localStorage.setItem('fulam-language', english ? 'en' : 'zh-Hant'); } catch {}
    render();
  };
  window.addEventListener('storage', event => {
    if ((view === 'ranking' || (view === 'staff' && staffOpen)) && (!event.key || event.key.startsWith(store.prefix))) render();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { entryGrant = null; staffOpen = false; render(); } });
  if (view === 'review') document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link && !link.target && link.origin === location.origin && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      location.replace(link.href);
    }
  });
  render();
})();
