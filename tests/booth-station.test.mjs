import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const source = fs.readFileSync(new URL('../site/booth/marks.js', import.meta.url), 'utf8');
function memory() {
  const data = new Map();
  return {
    get length() { return data.size; },
    key: i => [...data.keys()][i],
    getItem: k => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: k => data.delete(k)
  };
}
function device() {
  const env = {localStorage:memory(), sessionStorage:memory(), crypto:webcrypto, TextEncoder, URLSearchParams,
    location:{search:'',replace(url) { this.to = url; }}, document:{addEventListener(){}}};
  vm.runInNewContext(source, env);
  return {...env, api:env.FuLamStation};
}
function open(d, game, uid) {
  const url = new URL(d.api.launch(game,uid,webcrypto.randomUUID()),'https://example.org/booth/');
  d.location.search = url.search;
  const attempt = d.api.gameAttempt(game);
  assert(attempt.begin());
  return {attempt, id:url.searchParams.get('station')};
}
test('Entry and game tickets accept only ten digits beginning with 303', () => {
  const d = device();
  for (const uid of ['303123456','30312345678','3021234567','303123456X','30312-4567','3031234567 ','３０３１２３４５６７']) {
    assert.throws(() => d.api.launch('knife',uid,webcrypto.randomUUID()));
    const id = webcrypto.randomUUID();
    d.sessionStorage.setItem('fulam.booth.ticket.v1',JSON.stringify({id, uid, game:'knife'}));
    d.location.search = '?station=' + id;
    assert.equal(d.api.gameAttempt('knife').begin(),false);
  }
  assert.equal(open(d,'knife','3030000000').attempt.uid,'3030000000');
});
test('Every booth finish is saved once, even below the top ten. Tickets are bound to a game and a single run.', () => {
  const d = device();
  assert.equal(d.api.gameAttempt('knife'), null);
  for (let i = 0; i < 12; i++) {
    const {attempt} = open(d,'knife','303' + String(i).padStart(7,'0'));
    assert(attempt.finish(i));
    assert(attempt.finish(i + 1000));
    assert.equal(d.api.gameAttempt('knife').begin(),false);
  }
  const rows = d.api.records(d.localStorage);
  assert.equal(rows.length, 12);
  assert(Math.max(...rows.map(r => r.score)) === 11);
  assert.equal(d.api.leaderboard(rows,'knife').length,0);
  const url = new URL(d.api.launch('fleet','3030000007',webcrypto.randomUUID()),'https://example.org/booth/');
  d.location.search = url.search;
  assert.equal(d.api.gameAttempt('fishing').begin(),false);
  const first = d.api.gameAttempt('fleet');
  assert(first.begin());
  assert.equal(d.api.gameAttempt('fleet').begin(),false);
});
test('Confirmation by UID match requires no response number. Rankings show masked personal bests and ties.', () => {
  const d = device();
  for (const [uid,game,score,confirmed] of [
    ['3030001234','knife',40,true],['3030001234','knife',70,true],['3030009876','knife',70,true],
    ['3030001234','fleet',300,true],['3030001122','knife',5,true],['3030007788','knife',800,false]
  ]) {
    const {attempt,id} = open(d,game,uid);
    attempt.finish(score);
    if (confirmed) d.api.confirm(d.localStorage,id);
    const stored = JSON.parse(d.localStorage.getItem(d.api.prefix+id));
    assert.equal(stored.confirmed,confirmed);
    assert(!Object.hasOwn(stored,'responseId'));
  }
  const rows = d.api.records(d.localStorage);
  const leaders = Array.from(d.api.leaderboard(rows,'knife'));
  assert.deepEqual(leaders.map(r => r.score),[70,70,5]);
  assert.deepEqual(leaders.map(r => r.rank),[1,1,3]);
  assert(leaders.some(r => r.player === '•••• 1234'));
  assert.equal(d.api.leaderboard(rows,'fleet')[0].score,300);
  assert.equal(d.api.leaderboard(rows,'fishing').length,0);
});
test('Staff PIN is device-specific and an unwriteable attempt is recoverable', async () => {
  const d = device();
  assert(await d.api.setupPin('4789'));
  assert.equal(await d.api.setupPin('5813'),false);
  assert.equal(await d.api.checkPin('5813'),false);
  assert(await d.api.checkPin('4789'));
  const {attempt} = open(d,'fishing','3031234567');
  const write = d.localStorage.setItem;
  d.localStorage.setItem = () => { throw Error('full'); };
  assert.equal(attempt.finish(0),false);
  d.localStorage.setItem = write;
  assert(attempt.finish(0));
  assert.equal(d.api.records(d.localStorage)[0].score,0);
});
test('Local exports merge once, promote pending entries, and reject conflicting batches before saving', () => {
  const a = device(), b = device(), display = device();
  const source = open(a,'fleet','3031234567');
  source.attempt.finish(608);
  const pending = a.api.toCSV(a.api.records(a.localStorage));
  a.api.confirm(a.localStorage,source.id);
  const confirmed = a.api.toCSV(a.api.records(a.localStorage));
  const second = open(b,'fleet','3039991001');
  second.attempt.finish(710);
  b.api.confirm(b.localStorage,second.id);
  const higher = b.api.toCSV(b.api.records(b.localStorage));
  const merge = (...files) => display.api.importExports(display.localStorage,files);
  assert.equal(merge('\uFEFF'+pending),1);
  assert.equal(merge(confirmed,higher),2);
  assert.equal(merge(pending,confirmed,higher),0);
  const leaders = display.api.leaderboard(display.api.records(display.localStorage),'fleet');
  assert.deepEqual(Array.from(leaders, r => r.score),[710,608]);
  const fresh = device();
  assert(!confirmed.includes('response ID'));
  assert.throws(() => fresh.api.importExports(fresh.localStorage,[confirmed,higher.replace('"3039991001"','"invalid"')]));
  assert.equal(fresh.api.records(fresh.localStorage).length,0);
  assert.throws(() => merge(confirmed.replace('"608"','"999"')));
  assert.equal(display.api.records(display.localStorage).length,2);
});
test('Older device records and CSVs retain their confirmation, while previous-format UIDs stay archived', () => {
  const d = device(), display = device();
  const header = '"UID","Game","Score","Finished (UTC)","Status","Forms response ID","Attempt ID"';
  const finished = '2026-11-19T10:00:00.000Z';
  const archived = {id:webcrypto.randomUUID(), uid:'old-name', game:'fleet', score:200, finished, responseId:'23'};
  d.localStorage.setItem(d.api.prefix + archived.id,JSON.stringify(archived));
  const id = webcrypto.randomUUID();
  const earlier = header + '\r\n"3030004455","Wealth Wings","80","' + finished + '","Confirmed","24","' + id + '"';
  d.api.importExports(d.localStorage,[earlier]);
  const rows = d.api.records(d.localStorage);
  assert.equal(rows.length,2);
  assert(rows.every(r => r.confirmed));
  const csv = d.api.toCSV(rows);
  assert(!csv.includes('Forms'));
  assert.equal(display.api.importExports(display.localStorage,[csv]),2);
  const leaders = display.api.leaderboard(display.api.records(display.localStorage),'fleet');
  assert.equal(leaders.length,1);
  assert.equal(leaders[0].player,'•••• 4455');
});
