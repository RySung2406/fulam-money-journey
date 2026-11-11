// Questions are public. The correct choice stays in private.check_in_answers
// and is revealed only after a member submits. Day 1 opens immediately after
// submission. Later days open at 06:00 Hong Kong time the next morning.
export { CHECK_IN_DAYS } from './check-in-days.js';

function wallClock(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  let hour = value('hour');
  const day = new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
  if (hour === 24) {
    hour = 0;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, value('minute'), value('second'));
}

function programmeStamp(dayOffset, hour) {
  const start = new Date(Date.UTC(2026, 10, 8));
  start.setUTCDate(start.getUTCDate() + dayOffset);
  return Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), hour, 0, 0);
}

export function questionOpensAt(dayNumber) {
  return dayNumber <= 2 ? programmeStamp(0, 0) : programmeStamp(dayNumber - 1, 6);
}

export function answerOpensAt(dayNumber) {
  return programmeStamp(dayNumber, 6);
}

export function questionIsOpen(dayNumber, now = new Date()) {
  return wallClock(now) >= questionOpensAt(dayNumber);
}

export function answerIsOpen(dayNumber, now = new Date()) {
  return wallClock(now) >= answerOpensAt(dayNumber);
}

// Day 1 is published now, and only to someone who already submitted an answer.
// Later days stay hidden until 06:00 Hong Kong time the morning after that day.
export function answerVisible(dayNumber, completed, now = new Date()) {
  if (!completed) return false;
  if (dayNumber === 1) return true;
  return answerIsOpen(dayNumber, now);
}
