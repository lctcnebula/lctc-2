import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALL_DATES, calendarDay, resolveDateRange, withinDateRange, recordDate, dateRangeError } from '../lib/date-range';
const now = new Date('2026-11-11T03:00:00Z'); // Still November 10 in Illinois.
test('presets use Central calendar days, rather than the server time zone', () => {
  assert.deepEqual(resolveDateRange({...ALL_DATES, preset:'today'},now), {from:'2026-11-10',to:'2026-11-10'});
  assert.deepEqual(resolveDateRange({...ALL_DATES, preset:'7days'},now), {from:'2026-11-04',to:'2026-11-10'});
  assert.deepEqual(resolveDateRange({...ALL_DATES, preset:'month'},now), {from:'2026-10-01',to:'2026-10-31'});
  assert.deepEqual(resolveDateRange({...ALL_DATES, preset:'3months'},now), {from:'2026-08-01',to:'2026-10-31'});
  assert.deepEqual(resolveDateRange({...ALL_DATES, preset:'6months'},now), {from:'2026-05-01',to:'2026-10-31'});
});
test('ranges include entire final day and handle DST and date-only values', () => {
  const range = {from:'2026-11-01',to:'2026-11-01'};
  assert.equal(withinDateRange('2026-11-01T05:00:00Z',range),true);
  assert.equal(withinDateRange('2026-11-02T05:59:59.999Z',range),true);
  assert.equal(withinDateRange('2026-11-02T06:00:00Z',range),false);
  assert.equal(withinDateRange('2026-11-01',range),true);
  assert.equal(calendarDay('2026-03-08T07:59:00Z'),'2026-03-08');
});
test('invalid and reversed dates do not silently export all records', () => {
  assert.ok(dateRangeError({from:'2026-02-30',to:''}));
  assert.ok(dateRangeError({from:'2026-11-12',to:'2026-11-10'}));
  assert.equal(withinDateRange('2026-11-11',{from:'2026-11-12',to:'2026-11-10'}),false);
  assert.equal(withinDateRange('',{from:'2026-01-01',to:''}),false);
  assert.equal(withinDateRange('',{from:'',to:''}),true);
});
test('open ranges and leap-year month boundaries work', () => {
  assert.equal(withinDateRange('2026-11-11',{from:'2026-11-01',to:''}),true);
  assert.equal(withinDateRange('2026-11-11',{from:'',to:'2026-11-10'}),false);
  assert.deepEqual(resolveDateRange({...ALL_DATES,preset:'month'},new Date('2024-03-02T12:00:00Z')), {from:'2024-02-01',to:'2024-02-29'});
});
test('submission dates take priority, with database timestamps as fallback', () => {
  assert.equal(recordDate({submittedAt:'2026-10-10',createdAt:'2026-11-10'}),'2026-10-10');
  assert.equal(recordDate({createdAt:'',recordedAt:'2026-11-10'}),'2026-11-10');
  assert.equal(recordDate({name:'Legacy content'}),'');
});
