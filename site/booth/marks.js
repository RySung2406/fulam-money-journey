/* Shared by the booth desk and the three games. All storage is on this browser. */
(function (root) {
  'use strict';
  const prefix = 'fulam.booth.mark.v1.';
  const ticketKey = 'fulam.booth.ticket.v1';
  const pinKey = 'fulam.booth.staff.v1';
  const games = {knife: 'game', fishing: 'fishing', fleet: 'fleet'};
  const titles = {knife: 'One Slice', fishing: 'FuLam Catch', fleet: 'Wealth Wings'};
  const csvFields = ['UID', 'Game', 'Score', 'Finished (UTC)', 'Status', 'Attempt ID'];
  const legacyHeader = '"UID","Game","Score","Finished (UTC)","Status","Forms response ID","Attempt ID"';
  const uidPattern = '303[0-9]{7}';
  const uidRegex = new RegExp('^' + uidPattern + '$');
  const validUID = uid => typeof uid === 'string' && uid.length === 10 && uidRegex.test(uid);
  const previousUID = uid => typeof uid === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(uid);
  const validID = id => typeof id === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id);

  function records(storage) {
    const rows = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const row = JSON.parse(storage.getItem(key));
      if (row && key === prefix + row.id && previousUID(row.uid) && Object.hasOwn(games, row.game) && Number.isSafeInteger(row.score)) {
        // Earlier previews used the Forms response number as the confirmation flag.
        const {responseId, ...mark} = row;
        rows.push({...mark, confirmed: mark.confirmed === true || Boolean(responseId)});
      }
    }
    return rows.sort((a, b) => b.finished.localeCompare(a.finished) || a.id.localeCompare(b.id));
  }

  function leaderboard(rows, game) {
    const best = new Map();
    for (const row of rows) {
      if (row.game !== game || !row.confirmed || !validUID(row.uid)) continue;
      if (!best.has(row.uid) || row.score > best.get(row.uid).score) best.set(row.uid, row);
    }
    let rank = 0, last;
    return [...best.values()].sort((a, b) => b.score - a.score || a.finished.localeCompare(b.finished) || a.id.localeCompare(b.id)).map((row, i) => {
      if (row.score !== last) rank = i + 1;
      last = row.score;
      return {rank, player: '•••• ' + row.uid.slice(-4), score: row.score};
    });
  }

  function launch(game, uid) {
    if (!validUID(uid) || !Object.hasOwn(games, game)) throw new Error('Invalid booth entry');
    const id = root.crypto.randomUUID();
    const probe = prefix + 'probe.' + id;
    root.localStorage.setItem(probe, 'null');
    root.localStorage.removeItem(probe);
    root.sessionStorage.setItem(ticketKey, JSON.stringify({id, uid, game}));
    return '../' + games[game] + '/?station=' + id;
  }

  function gameAttempt(game) {
    const id = new URLSearchParams(root.location.search).get('station');
    if (id === null) return null;
    const desk = '../booth/station.html';
    const review = desk + '?review=' + encodeURIComponent(id);
    let player, mark;
    function begin() {
      try {
        if (validID(id) && root.localStorage.getItem(prefix + id)) {
          root.location.replace(review);
          return false;
        }
        const ticket = JSON.parse(root.sessionStorage.getItem(ticketKey));
        if (validID(id) && ticket?.id === id && ticket.game === game && validUID(ticket.uid)) {
          root.sessionStorage.removeItem(ticketKey);
          player = ticket.uid;
          return true;
        }
      } catch { /* Return to the desk so staff can recover. */ }
      root.location.replace(desk);
      return false;
    }
    function finish(score) {
      if (!player) return false;
      mark ??= {id, game, uid: player, score, finished: new Date().toISOString(), confirmed: false};
      try {
        if (!root.localStorage.getItem(prefix + id)) root.localStorage.setItem(prefix + id, JSON.stringify(mark));
      } catch { return false; }
      root.location.replace(review);
      return true;
    }
    root.document.addEventListener('click', event => {
      if (mark && event.target.closest('[data-retry-booth-save]')) finish(mark.score);
    });
    return {begin, finish, get uid() { return player; }};
  }

  function confirm(storage, id) {
    if (!validID(id)) throw new Error('Invalid attempt');
    const row = JSON.parse(storage.getItem(prefix + id));
    if (!row || !validUID(row.uid)) throw new Error('Missing score or invalid UID');
    if (row.confirmed !== true) {
      const {id, uid, game, score, finished} = row;
      storage.setItem(prefix + id, JSON.stringify({id, uid, game, score, finished, confirmed: true}));
    }
  }

  function toCSV(rows) {
    const fields = [csvFields, ...rows.map(r => {
      const status = (validUID(r.uid) ? '' : 'Archived: ') + (r.confirmed ? 'Confirmed' : 'Pending');
      return [r.uid, titles[r.game], r.score, r.finished, status, r.id];
    })];
    return fields.map(row => row.map(value => '"' + String(value).replaceAll('"','""') + '"').join(',')).join('\r\n');
  }

  function importExports(storage, files) {
    const existing = records(storage);
    const byId = new Map(existing.map(row => [row.id, row]));
    const changes = new Map();
    for (const file of files) {
      const [header, ...lines] = file.replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);
      const legacy = header === legacyHeader;
      if (!legacy && header !== toCSV([])) throw new Error('Invalid export');
      for (const line of lines) {
        if (!/^"[^"]*"(?:,"[^"]*")+$/.test(line)) throw new Error('Invalid export');
        const columns = line.slice(1,-1).split('","');
        if (columns.length !== (legacy ? 7 : 6)) throw new Error('Invalid export');
        const [uid, title, points, finished, status] = columns;
        const id = columns.at(-1);
        const archived = !validUID(uid);
        const statusPrefix = !legacy && archived ? 'Archived: ' : '';
        const confirmed = status === statusPrefix + 'Confirmed';
        const game = Object.keys(titles).find(key => titles[key] === title);
        const score = Number(points);
        if (!previousUID(uid) || !validID(id) || !game || !/^\d+$/.test(points) || !Number.isSafeInteger(score) ||
            !Number.isFinite(Date.parse(finished)) || new Date(finished).toISOString() !== finished ||
            (!confirmed && status !== statusPrefix + 'Pending')) throw new Error('Invalid export');
        if (legacy && (confirmed ? !/^[1-9]\d{0,14}$/.test(columns[5]) : columns[5] !== '')) throw new Error('Invalid export');
        const old = byId.get(id);
        if (old && (old.uid !== uid || old.game !== game || old.score !== score || old.finished !== finished)) throw new Error('Conflicting attempt');
        if (!old || (!old.confirmed && confirmed)) {
          const row = {id, uid, game, score, finished, confirmed};
          byId.set(id, row);
          changes.set(id, row);
        }
      }
    }
    for (const [id, row] of changes) storage.setItem(prefix + id, JSON.stringify(row));
    return changes.size;
  }

  async function pinHash(pin, salt) {
    const bytes = new TextEncoder().encode(pin);
    const key = await root.crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveBits']);
    const digest = await root.crypto.subtle.deriveBits({name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256'}, key, 256);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  async function setupPin(pin) {
    if (!/^\d{4,8}$/.test(pin)) throw new Error('Invalid PIN');
    const salt = root.crypto.randomUUID();
    const hash = await pinHash(pin, salt);
    if (hasPin()) return false;
    root.localStorage.setItem(pinKey, JSON.stringify({salt, hash}));
    return true;
  }
  function hasPin() { return !!root.localStorage.getItem(pinKey); }
  async function checkPin(pin) {
    const saved = JSON.parse(root.localStorage.getItem(pinKey));
    return !!saved && saved.hash === await pinHash(pin, saved.salt);
  }
  root.FuLamStation = {prefix, uidPattern, validUID, records, leaderboard, launch, gameAttempt, confirm, setupPin, hasPin, checkPin, toCSV, importExports};
})(typeof window === 'undefined' ? globalThis : window);
