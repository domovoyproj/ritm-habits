import {test} from 'node:test';import assert from 'node:assert/strict';import {daily,streak,validState,weekKeys} from '../dist/model.js';import {dateKey,shiftDay} from '../dist/shared.js';
const today=dateKey(),yesterday=shiftDay(today,-1),before=shiftDay(today,-2),h={id:'a',title:'Читать',note:'',icon:'book',color:'sage',created:before,dates:[before,yesterday]};
test('unfinished today does not break yesterday streak',()=>assert.equal(streak(h,today),2));
test('today completion increments series',()=>assert.equal(streak({...h,dates:[...h.dates,today]},today),3));
test('missing yesterday breaks series',()=>assert.equal(streak({...h,dates:[before]},today),0));
test('habits are not counted before creation',()=>assert.deepEqual(daily([h],shiftDay(before,-1)),{total:0,done:0,percent:0}));
test('week starts Monday across year boundary',()=>assert.deepEqual(weekKeys('2027-01-01'),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']));
test('local day arithmetic handles leap day',()=>assert.equal(shiftDay('2024-03-01',-1),'2024-02-29'));
test('backup rejects duplicates, future checkins and malformed dates',()=>{assert.ok(validState({habits:[h]}));assert.ok(!validState({habits:[h,h]}));assert.ok(!validState({habits:[{...h,dates:[today,today]}]}));assert.ok(!validState({habits:[{...h,dates:[shiftDay(today,1)]}]}));});

