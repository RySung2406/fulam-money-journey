import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../supabase/migrations');

function loadMigrations() {
  return readdirSync(migrationsDir)
    .filter(name => name.endsWith('.sql'))
    .sort()
    .map(name => readFileSync(path.join(migrationsDir, name), 'utf8'));
}

// Walk migrations in filename order and keep the check-in RPCs that would
// still exist after the full chain. A two-argument overload can insert a row
// with no answer, so it must not survive a later migration.
function checkInRpcState(sqlFiles) {
  const token = /create(?:\s+or\s+replace)?\s+function\s+(public|private)\.submit_check_in\(\s*p_day_number\s+integer\s*,\s*p_student_confirmed\s+boolean(\s*,\s*p_choice\s+text)?\s*\)|drop\s+function\s+(?:if\s+exists\s+)?(public|private)\.submit_check_in\(\s*integer\s*,\s*boolean(\s*,\s*text)?\s*\)|alter\s+table\s+public\.check_ins\s+alter\s+column\s+choice\s+(set|drop)\s+not\s+null/gi;
  const present = new Map();
  let choiceNotNull = false;
  const sql = sqlFiles.join('\n');
  for (const match of sql.matchAll(token)) {
    if (match[1]) {
      const signature = `${match[1]}(${match[2] ? 'integer, boolean, text' : 'integer, boolean'})`;
      const start = sql.indexOf('as $$', match.index);
      const end = sql.indexOf('$$', start + 4);
      present.set(signature, sql.slice(start, end));
    } else if (match[3]) {
      present.delete(`${match[3]}(${match[4] ? 'integer, boolean, text' : 'integer, boolean'})`);
    } else {
      choiceNotNull = match[5].toLowerCase() === 'set';
    }
  }
  return { present, choiceNotNull };
}

test('check-in cannot be recorded by the old RPC that omits the answer', () => {
  const { present, choiceNotNull } = checkInRpcState(loadMigrations());
  assert.equal(present.has('public(integer, boolean)'), false);
  assert.equal(present.has('private(integer, boolean)'), false);
  assert.equal(choiceNotNull, true);

  const publicBody = present.get('public(integer, boolean, text)');
  assert.match(publicBody, /private\.submit_check_in\(p_day_number, p_student_confirmed, p_choice\)/);

  const privateBody = present.get('private(integer, boolean, text)');
  assert.match(privateBody, /p_choice is null or p_choice not in \('A', 'B', 'C'\)/);
  assert.match(privateBody, /check_in_choice_invalid/);
  assert.match(privateBody, /insert into public\.check_ins\(user_id, day_number, checked_in_at, student_confirmed, choice\)/);
});
