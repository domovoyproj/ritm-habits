import { dateKey, shiftDay, validDate, validId } from './shared.js';
export const icons=['leaf','book','sun','moon','water'];
export const colors=['sage','clay','lavender','sky'];
export function validState(s){
  return s && Array.isArray(s.habits) && s.habits.length<=100 &&
    new Set(s.habits.map(h=>h.id)).size===s.habits.length && s.habits.every(h=>
      validId(h.id)&&typeof h.title==='string'&&h.title.trim().length>0&&h.title.length<=100&&
      typeof h.note==='string'&&h.note.length<=180&&icons.includes(h.icon)&&colors.includes(h.color)&&
      validDate(h.created)&&Array.isArray(h.dates)&&h.dates.length<=20000&&new Set(h.dates).size===h.dates.length&&h.dates.every(d=>validDate(d)&&d>=h.created&&d<=dateKey()));
}
export function streak(habit, today=dateKey()){
  let day=habit.dates.includes(today)?today:shiftDay(today,-1), count=0;
  const dates=new Set(habit.dates);
  while(dates.has(day)){count++;day=shiftDay(day,-1);}
  return count;
}
export function daily(habits,key){
  const active=habits.filter(h=>h.created<=key),done=active.filter(h=>h.dates.includes(key)).length;
  return {total:active.length,done,percent:active.length?Math.round(done/active.length*100):0};
}
export function monday(key){
  const day=new Date(key+'T12:00:00').getDay();return shiftDay(key,-((day+6)%7));
}
export function weekKeys(key){const start=monday(key);return Array.from({length:7},(_,i)=>shiftDay(start,i));}

