import { env } from 'cloudflare:workers';
import { cues, cueReady, defaultSettings, effectiveCue, elapsedMs, phaseInfo, phases, reportTypes, type Bucket, type EventSettings } from './scenario';

type RawState = {id:number;table_count:number;phase:string;started_at:number|null;elapsed_before_pause:number;paused:number;revision:number;settings_json:string};
const db = () => {
  if (!env.DB) throw new Error('Event database unavailable');
  return env.DB;
};
export async function loadState() {
  const d = db();
  await d.prepare('INSERT OR IGNORE INTO event_state (id, table_count, phase, elapsed_before_pause, paused, revision) VALUES (1,8,\'intro\',0,1,0)').run();
  const row = await d.prepare('SELECT * FROM event_state WHERE id = 1').first<RawState>();
  if (!row) throw new Error('Event state unavailable');
  const defaults=defaultSettings();
  let saved:Partial<EventSettings>={};
  try {saved=JSON.parse(row.settings_json) as Partial<EventSettings>} catch {}
  const settings:EventSettings={durations:{...defaults.durations,...saved.durations},triggers:{...defaults.triggers,...saved.triggers},displayMessage:saved.displayMessage ?? '',eventNumber:typeof saved.eventNumber==='string'?saved.eventNumber:'',eventName:typeof saved.eventName==='string'?saved.eventName:'',language:saved.language==='ru'?'ru':'en',colorScheme:['original','adventure','minimal'].includes(saved.colorScheme??'')?saved.colorScheme!:defaults.colorScheme};
  return {tableCount:row.table_count,phase:row.phase,startedAt:row.started_at,elapsedBeforePause:row.elapsed_before_pause,paused:!!row.paused,revision:row.revision,settings};
}
export async function snapshot() {
  const state = await loadState();
  const d = db();
  const [r,a] = await Promise.all([
    d.prepare('SELECT table_no, report_key, count FROM reports WHERE table_no <= ?').bind(state.tableCount).all<{table_no:number;report_key:string;count:number}>(),
    d.prepare('SELECT key, announced_at FROM announcements').all<{key:string;announced_at:number}>(),
  ]);
  const counts:Record<string,number> = {};
  const totals:Record<string,number> = {act1:0,act2:0,first:0,act3:0,second:0,act4:0,third:0};
  for (const row of r.results) {
    const type = reportTypes.find(x => x.key === row.report_key);
    if (!type) continue;
    counts[`${row.table_no}:${row.report_key}`]=row.count;
    totals[type.bucket as Bucket]+=row.count*type.weight;
  }
  const done:Record<string,number> = Object.fromEntries(a.results.map(x=>[x.key,x.announced_at]));
  const now=Date.now();
  return {state,counts,totals,done,ready:Object.fromEntries(cues.map(x=>[x.key,cueReady(effectiveCue(x,state.settings),state,totals,now)])),now,durationMs:(state.settings.durations[state.phase]??phaseInfo(state.phase).minutes)*60000,elapsedMs:elapsedMs(state,now)};
}
export async function mutate(input:Record<string,unknown>) {
  const d=db(); const state=await loadState(); const now=Date.now();
  const action=input.action;
  if(action==='reset') {
    await d.batch([
      d.prepare('DELETE FROM reports'),
      d.prepare('DELETE FROM announcements'),
      d.prepare("UPDATE event_state SET table_count=8,phase='intro',started_at=NULL,elapsed_before_pause=0,paused=1,settings_json='{}',revision=revision+1 WHERE id=1"),
    ]);
  } else if(action==='configure') {
    const n=Number(input.tableCount);
    if(!Number.isInteger(n)||n<1||n>20) throw new Error('Table count must be from 1 to 20');
    const active=await d.prepare('SELECT 1 FROM reports WHERE table_no > ? AND count > 0 LIMIT 1').bind(n).first();
    if(active) throw new Error('Clear reports from the removed tables first');
    await d.prepare('UPDATE event_state SET table_count=?, revision=revision+1 WHERE id=1').bind(n).run();
  } else if(action==='settings') {
    const raw=input.settings as EventSettings;
    if(!raw||typeof raw!=='object'||!raw.durations||!raw.triggers||typeof raw.displayMessage!=='string'||raw.displayMessage.length>180||typeof raw.eventNumber!=='string'||raw.eventNumber.length>40||typeof raw.eventName!=='string'||raw.eventName.length>120||!['en','ru'].includes(raw.language)||!['original','adventure','minimal'].includes(raw.colorScheme)) throw new Error('Invalid settings');
    const durations:Record<string,number>={};
    for(const phase of phases) {
      const n=Number(raw.durations[phase.key]);
      if(!Number.isInteger(n)||n<1||n>240) throw new Error('Phase lengths must be whole minutes from 1 to 240');
      durations[phase.key]=n;
    }
    const triggers:EventSettings['triggers']={};
    for(const cue of cues) {
      const item=raw.triggers[cue.key];
      if(!item||typeof item!=='object') throw new Error('A cue setting is missing');
      const entry:{factor?:number;at?:number}={};
      if(cue.factor!==undefined) {
        const factor=Number(item.factor);
        if(!Number.isFinite(factor)||factor<0.25||factor>5) throw new Error('Success thresholds must be 25% to 500%');
        entry.factor=factor;
      }
      if(cue.at!==undefined) {
        const at=Number(item.at);
        if(!Number.isInteger(at)||at<0||at>240) throw new Error('Cue times must be whole minutes from 0 to 240');
        entry.at=at;
      }
      triggers[cue.key]=entry;
    }
    await d.prepare('UPDATE event_state SET settings_json=?,revision=revision+1 WHERE id=1').bind(JSON.stringify({durations,triggers,displayMessage:raw.displayMessage.trim(),eventNumber:raw.eventNumber.trim(),eventName:raw.eventName.trim(),language:raw.language,colorScheme:raw.colorScheme})).run();
  } else if(action==='position') {
    const phase=String(input.phase), elapsedMinutes=Number(input.elapsedMinutes);
    if(!phases.some(p=>p.key===phase)||!Number.isInteger(elapsedMinutes)||elapsedMinutes<0||elapsedMinutes>240) throw new Error('Choose a valid phase and elapsed minute');
    await d.prepare('UPDATE event_state SET phase=?,elapsed_before_pause=?,started_at=?,revision=revision+1 WHERE id=1')
      .bind(phase,elapsedMinutes*60000,state.paused?null:now).run();
  } else if(action==='report') {
    const tableNo=Number(input.tableNo); const key=String(input.key); const delta=Number(input.delta);
    const type=reportTypes.find(x=>x.key===key);
    if(!type||!Number.isInteger(tableNo)||tableNo<1||tableNo>state.tableCount||![1,-1].includes(delta)) throw new Error('Invalid report');
    const max='repeat' in type ? 99 : 1;
    await d.prepare('INSERT INTO reports (table_no,report_key,count) VALUES (?,?,?) ON CONFLICT(table_no,report_key) DO UPDATE SET count=MIN(?,MAX(0,reports.count+?))')
      .bind(tableNo,key,delta===1?1:0,max,delta).run();
    await d.prepare('UPDATE event_state SET revision=revision+1 WHERE id=1').run();
  } else if(action==='timer') {
    if(input.mode==='resume' && state.paused) await d.prepare('UPDATE event_state SET started_at=?,paused=0,revision=revision+1 WHERE id=1').bind(now).run();
    else if(input.mode==='pause' && !state.paused) await d.prepare('UPDATE event_state SET elapsed_before_pause=?,started_at=NULL,paused=1,revision=revision+1 WHERE id=1').bind(elapsedMs(state,now)).run();
    else throw new Error('Timer is already in that state');
  } else if(action==='phase') {
    const phases=['intro','act1','act2','act3','act4','conclusion'];
    const next=String(input.phase);
    if(phases.indexOf(next)!==phases.indexOf(state.phase)+1) throw new Error('Advance one phase at a time');
    await d.prepare('UPDATE event_state SET phase=?,started_at=?,elapsed_before_pause=0,revision=revision+1 WHERE id=1').bind(next,state.paused?null:now).run();
  } else if(action==='announce') {
    const key=String(input.key); const cue=cues.find(x=>x.key===key);
    if(!cue) throw new Error('Invalid announcement');
    const snap=await snapshot();
    if(!snap.ready[key]) throw new Error('Announcement trigger has not been reached');
    await d.prepare('INSERT OR IGNORE INTO announcements (key,announced_at) VALUES (?,?)').bind(key,now).run();
    await d.prepare('UPDATE event_state SET revision=revision+1 WHERE id=1').run();
  } else if(action==='undoAnnouncement') {
    const key=String(input.key);
    if(!cues.some(x=>x.key===key)) throw new Error('Invalid announcement');
    await d.prepare('DELETE FROM announcements WHERE key=?').bind(key).run();
    await d.prepare('UPDATE event_state SET revision=revision+1 WHERE id=1').run();
  } else throw new Error('Unknown action');
  return snapshot();
}
