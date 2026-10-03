export const phases = [
  { key: 'intro', label: 'Introduction', minutes: 15 },
  { key: 'act1', label: 'Act 1 · Seeking the Centipede Queen', minutes: 40 },
  { key: 'act2', label: 'Act 2 · Lair of the Kaiju', minutes: 60 },
  { key: 'act3', label: 'Act 3 · Cutting Down the Cult', minutes: 90 },
  { key: 'act4', label: 'Act 4 · Freeing the Kaiju', minutes: 70 },
  { key: 'conclusion', label: 'Conclusion', minutes: 15 },
] as const;
export type Phase = typeof phases[number]['key'];
export const phaseIndex = (p: string) => phases.findIndex(x => x.key === p);
export const phaseInfo = (p: string) => phases.find(x => x.key === p) ?? phases[0];

export const reportTypes = [
  { key:'thistle', phase:'act1', title:'Encampment Survivor', trigger:'Heal Thistle Foot and learn at least one fact', bucket:'act1', weight:1 },
  { key:'shard', phase:'act1', title:'Burrows and Beasts', trigger:'Survive at least one venom shard', bucket:'act1', weight:1 },
  { key:'tracks', phase:'act1', title:'Tracks in the Sands', trigger:'Follow both sets of tracks', bucket:'act1', weight:1 },
  { key:'dust', phase:'act2', title:'Arriving at the Lair', trigger:'Disable or traverse the shard dust', bucket:'act2', weight:1 },
  { key:'scout', phase:'act2', title:'Scouting the Lair', trigger:'Earn LP at least equal to the number of PCs', bucket:'act2', weight:1 },
  { key:'bodies', phase:'act2', title:'Zimibra’s Leftovers', trigger:'Discover information about the humanoid bodies', bucket:'act2', weight:1 },
  { key:'amir', phase:'act2', title:'First Emissary', trigger:'Defeat Amir Yedilov', bucket:'first', weight:1 },
  { key:'crystal', phase:'act3', title:'Ripe for the Taking', trigger:'Disrupt the crystallization operation', bucket:'act3', weight:1 },
  { key:'combust', phase:'act3', title:'Zimibra’s Quaking', trigger:'Disable the combusting venom hazard', bucket:'act3', weight:1 },
  { key:'drum', phase:'act3', title:'Drum Circle', trigger:'Disrupt the rite', bucket:'act3', weight:1 },
  { key:'chaos', phase:'act3', title:'Sowing Chaos', trigger:'Earn at least 12 Chaos Points', bucket:'act3', weight:1 },
  { key:'amirbag', phase:'act3', title:'Amir’s Tent', trigger:'Open at least one of Amir’s bags', bucket:'act3', weight:1 },
  { key:'slittent', phase:'act3', title:'Slit Throat’s Tent', trigger:'Enter Slit Throat’s tent', bucket:'act3', weight:1 },
  { key:'pact', phase:'act3', title:'Ildrea’s Tent', trigger:'Recover the draconic pact', bucket:'act3', weight:2 },
  { key:'slit', phase:'act3', title:'Second Emissary', trigger:'Defeat Slit Throat or another qualifying wave', bucket:'second', weight:1, repeat:true },
  { key:'cultists', phase:'act4', title:'Clearing Out Cultists', trigger:'Defeat a cultist encounter', bucket:'act4', weight:2, repeat:true },
  { key:'dance', phase:'act4', title:'Breaking the Dance', trigger:'Undo all aspects of the ritual', bucket:'act4', weight:1 },
  { key:'yorak', phase:'act4', title:'Yorak’s Dance', trigger:'Calm Yorak by disabling the hazard', bucket:'act4', weight:1 },
  { key:'ildrea', phase:'act4', title:'Third Emissary', trigger:'Defeat the creatures in the encounter', bucket:'third', weight:1 },
  { key:'chain', phase:'act4', title:'Freeing Zimibra', trigger:'Remove one chain (each chain counts)', bucket:'third', weight:1, repeat:true },
] as const;
export type Bucket = typeof reportTypes[number]['bucket'];
export const bucketLabels: Record<Bucket,string> = {act1:'Act 1',act2:'Act 2',first:'First Emissary',act3:'Act 3',second:'Second Emissary',act4:'Act 4',third:'Third Emissary'};

export type Cue = {key:string;phase:Phase;label:string;when:string;text:string;threshold?:Bucket;factor?:number;at?:number;effect?:string};
export type EventSettings = {
  durations: Record<string,number>;
  triggers: Record<string,{factor?:number;at?:number}>;
  displayMessage: string;
  eventNumber: string;
  eventName: string;
  language: 'en'|'ru';
  colorScheme: 'original'|'adventure'|'minimal';
};
export const defaultSettings = ():EventSettings => ({
  durations: Object.fromEntries(phases.map(p=>[p.key,p.minutes])),
  triggers: Object.fromEntries(cues.map(c=>[c.key,{...('factor' in c?{factor:c.factor}:{}),...('at' in c?{at:c.at}:{})}])),
  displayMessage:'',
  eventNumber:'',
  eventName:'',
  language:'en',
  colorScheme:'adventure',
});
export function effectiveCue(c:Cue, settings:EventSettings):Cue {
  return {...c,...settings.triggers[c.key]};
}
export const cues: Cue[] = [
  {key:'a1_75', phase:'act1', label:'The cause is known', when:'75% of tables · Act 1 successes', threshold:'act1', factor:.75, effect:'+1 circumstance bonus to skill checks for the rest of Act 1.', text:'The Society identifies Zimibra as the cause of the encampment’s destruction.'},
  {key:'a1_warn', phase:'act1', label:'Five minutes to Act 2', when:'150% of tables or 35 min', threshold:'act1', factor:1.5, at:35, text:'Zimibra is waking. Burnt Rice leads the Society toward her lair. Five minutes remain in Act 1.'},
  {key:'a2_open', phase:'act2', label:'First Emissary opens', when:'Act 2 successes = tables or 15 min', threshold:'act2', factor:1, at:15, text:'An alarm draws the Society back. Amir Yedilov blocks the way. Table GMs: begin Confronting the First Emissary.'},
  {key:'a2_warn', phase:'act2', label:'Five minutes to Act 3', when:'First Emissary successes = tables or 55 min', threshold:'first', factor:1, at:55, text:'Gray smoke rises to the west. Five minutes remain in Act 2.'},
  {key:'a3_100', phase:'act3', label:'Chaos in the camp', when:'Act 3 successes = tables', threshold:'act3', factor:1, effect:'Each player’s next success becomes a critical success.', text:'Chaos spreads through the cult camp. Each player’s next success becomes a critical success.'},
  {key:'a3_200', phase:'act3', label:'Cultists turn on each other', when:'Act 3 successes = twice tables', threshold:'act3', factor:2, effect:'+2 circumstance bonus to all skill checks for the rest of Act 3.', text:'The Emissaries cannot tell friend from foe. Players gain a +2 circumstance bonus to all skill checks for the rest of Act 3.'},
  {key:'a3_open', phase:'act3', label:'Second Emissary opens', when:'45 min into Act 3', at:45, text:'Slit Throat arrives at the camp with her many-legged companion. Table GMs: begin Confronting the Second Emissary.'},
  {key:'a3_warn', phase:'act3', label:'Five minutes to Act 4', when:'Second Emissary successes = tables or 85 min', threshold:'second', factor:1, at:85, text:'Yorak, the Horned Thunder, approaches the camp. Five minutes remain until Act 4.'},
  {key:'a4_100', phase:'act4', label:'Prison area secured', when:'Act 4 successes = tables', threshold:'act4', factor:1, effect:'+2 circumstance bonus to all skill checks for the rest of Act 4.', text:'The Society presses the cult from Zimibra’s prison. Players gain a +2 circumstance bonus to all skill checks for the rest of Act 4.'},
  {key:'a4_open', phase:'act4', label:'Third Emissary opens', when:'Act 4 successes = twice tables or 25 min', threshold:'act4', factor:2, at:25, text:'Ildrea calls out from the canyon. Table GMs: begin Confronting the Third Emissary.'},
  {key:'a4_warn', phase:'act4', label:'Zimibra breaks free', when:'Third Emissary successes = tables or 65 min', threshold:'third', factor:1, at:65, text:'Zimibra breaks her chains and shakes free the bamboo shunts. Five minutes remain in Act 4.'},
];
export function threshold(n:number, factor:number) { return Math.floor(n*factor); }
export function elapsedMs(s:{startedAt:number|null;elapsedBeforePause:number;paused:boolean}, now=Date.now()) {
  return s.elapsedBeforePause + (!s.paused && s.startedAt ? Math.max(0,now-s.startedAt) : 0);
}
export function cueReady(c: Cue, s:{tableCount:number;phase:string;startedAt:number|null;elapsedBeforePause:number;paused:boolean}, totals:Record<string,number>, now=Date.now()) {
  if (phaseIndex(s.phase)!==phaseIndex(c.phase)) return false;
  const byScore = 'threshold' in c && c.threshold ? (totals[c.threshold] ?? 0)>=threshold(s.tableCount,c.factor ?? 0) : false;
  const byTime = 'at' in c && c.at !== undefined ? elapsedMs(s,now)>=c.at*60000 : false;
  return byScore || byTime;
}
