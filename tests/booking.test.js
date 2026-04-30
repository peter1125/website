const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSlots, buildIcsEvent, escapeIcsText, zonedTimeToUtc } = require('../static/booking/booking.js');

const baseConfig = {
  ownerName: 'Eungang (Peter) Choi',
  ownerEmail: 'peter1125@gmail.com',
  timezone: 'America/New_York',
  slotIntervalMinutes: 30,
  minimumNoticeHours: 0,
  daysToShow: 3,
  bufferMinutes: 0,
  meetingTypes: [{ id: 'intro', name: 'Intro', durations: [30] }],
  weeklyAvailability: [{ day: 'Wednesday', start: '12:00', end: '13:00' }],
  unavailableDates: [],
  booked: []
};

test('zonedTimeToUtc converts New York noon to UTC during daylight saving time', () => {
  assert.equal(zonedTimeToUtc('2026-05-06', '12:00', 'America/New_York').toISOString(), '2026-05-06T16:00:00.000Z');
});

test('buildSlots creates slots from weekly availability windows', () => {
  const slots = buildSlots(baseConfig, { now: '2026-05-05T12:00:00.000Z', duration: 30 });
  assert.deepEqual(slots.map(slot => [slot.start, slot.end]), [
    ['2026-05-06T16:00:00.000Z', '2026-05-06T16:30:00.000Z'],
    ['2026-05-06T16:30:00.000Z', '2026-05-06T17:00:00.000Z']
  ]);
});

test('buildSlots excludes unavailable dates and booked meetings', () => {
  const config = {
    ...baseConfig,
    daysToShow: 10,
    unavailableDates: ['2026-05-06'],
    booked: [{ start: '2026-05-13T16:00:00.000Z', end: '2026-05-13T16:30:00.000Z' }]
  };
  const slots = buildSlots(config, { now: '2026-05-05T12:00:00.000Z', duration: 30 });
  assert.deepEqual(slots.map(slot => slot.start), ['2026-05-13T16:30:00.000Z']);
});

test('buildSlots respects minimum notice', () => {
  const config = { ...baseConfig, minimumNoticeHours: 2 };
  const slots = buildSlots(config, { now: '2026-05-06T15:00:00.000Z', duration: 30 });
  assert.deepEqual(slots.map(slot => slot.start), []);
});

test('buildIcsEvent emits a valid calendar request with escaped text', () => {
  const ics = buildIcsEvent({
    config: baseConfig,
    slot: { start: '2026-05-06T16:00:00.000Z', end: '2026-05-06T16:30:00.000Z' },
    meetingType: baseConfig.meetingTypes[0],
    attendeeName: 'Jane, Doe',
    attendeeEmail: 'jane@example.com',
    note: 'Discuss NLP; governance'
  });

  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /METHOD:REQUEST/);
  assert.match(ics, /DTSTART:20260506T160000Z/);
  assert.match(ics, /DTEND:20260506T163000Z/);
  assert.match(ics, /SUMMARY:Intro with Eungang \(Peter\) Choi/);
  assert.match(ics, /ATTENDEE;CN=Jane\\, Doe;RSVP=TRUE:mailto:jane@example.com/);
  assert.match(ics, /Notes: Discuss NLP\\; governance/);
});

test('escapeIcsText escapes reserved ICS characters and newlines', () => {
  assert.equal(escapeIcsText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
});
