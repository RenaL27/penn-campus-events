const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dateRange, campusNow, upcoming, rankEvents, eventFields } = require('../src/services/discovery');
test('campus dates stay correct across UTC midnight and daylight saving boundaries', () => {
  assert.equal(campusNow(new Date('2026-10-09T02:00:00Z')).date, '2026-10-08');
  assert.equal(campusNow(new Date('2026-11-01T06:30:00Z')).time, '01:30');
  assert.equal(dateRange('tomorrow', '', new Date('2026-10-09T02:00:00Z')).$gte.toISOString(), '2026-10-09T00:00:00.000Z');
  const week = dateRange('week', '', new Date('2026-10-08T15:00:00Z'));
  assert.equal(week.$lt.toISOString().slice(0, 10), '2026-10-12');
  const weekend = dateRange('weekend', '', new Date('2026-10-11T15:00:00Z'));
  assert.equal(weekend.$gte.toISOString().slice(0, 10), '2026-10-10');
  assert.equal(weekend.$lt.toISOString().slice(0, 10), '2026-10-12');
  assert.throws(() => dateRange('date', '2026-02-30'), /valid date/);
});
test('upcoming uses event time in Philadelphia, not the server timezone', () => {
  const now = new Date('2026-10-08T20:30:00Z');
  assert.equal(upcoming({ date: '2026-10-08', time: '16:00' }, now), false);
  assert.equal(upcoming({ date: '2026-10-08', time: '17:00' }, now), true);
});
test('interests, searches and attendance independently influence recommendations', () => {
  const events = [
    { _id: '1', title: 'Career fair', category: 'Academic & Career', date: '2027-01-01', attendees: [] },
    { _id: '2', title: 'Jazz night', category: 'Arts & Media', date: '2027-01-02', attendees: [] },
    { _id: '3', title: 'Yoga', category: 'Fitness & Wellness', date: '2027-01-03', attendees: [] },
  ];
  assert.equal(rankEvents(events, { user: { interests: ['Arts & Media'] } })[0]._id, '2');
  assert.equal(rankEvents(events, { user: { searchHistory: [{ query: 'yoga' }] } })[0]._id, '3');
  assert.equal(rankEvents(events, { past: [{ category: 'Academic & Career' }] })[0]._id, '1');
  assert.equal(rankEvents(events, { query: 'Jazz' })[0]._id, '2');
});
test('event input rejects invalid dates and capacities', () => {
  for (const capacity of [0, -1, 2.5, 'bad']) assert.throws(() => eventFields({ capacity }));
  assert.throws(() => eventFields({ eventType: 'Unlisted' }));
  assert.throws(() => eventFields({ time: '25:00' }));
  assert.equal(eventFields({ capacity: '30' }).capacity, 30);
});
