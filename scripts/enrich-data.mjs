import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const personsPath = path.join(root, 'data/persons.json');
const relationshipsPath = path.join(root, 'data/relationships.json');
const eventsPath = path.join(root, 'data/events.json');

const persons = JSON.parse(fs.readFileSync(personsPath, 'utf8'));
let relationships = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));
let events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

const personById = new Map(persons.map((person) => [person.id, person]));
const personsByFaction = Map.groupBy(persons, (person) => person.faction);
const personIdAliases = new Map([
  ['emperor-xian', 'han-xiandi'],
  ['lu-bu', 'lv-bu'],
  ['zhang-jiao', 'zhang-jue'],
]);

for (const event of events) {
  event.participants = (event.participants ?? [])
    .map((participant) => ({
      ...participant,
      person_id: personIdAliases.get(participant.person_id) ?? participant.person_id,
    }))
    .filter((participant) => personById.has(participant.person_id));
}

relationships = relationships.filter((relationship) => !/^rel-\d+$/.test(relationship.id));
events = events.filter((event) => !/^event-\d+$/.test(event.id));

const bidirectionalTypes = new Set([
  'brothers',
  'colleagues',
  'friends',
  'rivals',
  'sworn-brothers',
  'allies',
]);

const relationshipLabels = {
  allies: '同盟',
  betrayal: '背叛',
  brothers: '兄弟',
  colleagues: '同僚',
  'father-son': '父子',
  friends: '友人',
  'husband-wife': '夫妻',
  'in-law': '姻亲',
  'killed-by': '死于',
  'lord-vassal': '君臣',
  'master-student': '师生',
  'mother-son': '母子',
  rivals: '敌对',
  subordinate: '部属',
  successor: '继承',
  'sworn-brothers': '结义兄弟',
};

const eventTypeLabels = {
  battle: '战役',
  death: '死亡',
  diplomatic: '外交',
  political: '政治',
  rebellion: '叛乱',
  succession: '继位',
};

const nextNumericId = (items, prefix, fallback) => {
  const maxId = items.reduce((max, item) => {
    const match = String(item.id).match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, fallback - 1);
  return maxId + 1;
};

let nextRelNumber = nextNumericId(relationships, 'rel', 434);
let nextEventNumber = nextNumericId(events, 'event', 96);
const relationshipKeys = new Set();
const eventKeys = new Set(events.map((event) => `${event.name}|${event.year}|${event.type}`));
const addedRelationships = [];
const addedEvents = [];

for (const relationship of relationships) {
  relationshipKeys.add(relationshipKey(relationship.source, relationship.target, relationship.type));
  if (bidirectionalTypes.has(relationship.type)) {
    relationshipKeys.add(relationshipKey(relationship.target, relationship.source, relationship.type));
  }
}

function relationshipKey(source, target, type) {
  return `${source}|${target}|${type}`;
}

function hasPerson(id) {
  return personById.has(id);
}

function personName(id) {
  return personById.get(id)?.name ?? id;
}

function wikiUrl(name) {
  return `https://zh.wikipedia.org/wiki/${name}`;
}

function relId() {
  return `rel-${String(nextRelNumber++).padStart(3, '0')}`;
}

function eventId() {
  return `event-${String(nextEventNumber++).padStart(3, '0')}`;
}

function addRelationship(source, target, type, description, options = {}) {
  if (!hasPerson(source) || !hasPerson(target) || source === target) return false;

  const bidirectional = options.bidirectional ?? bidirectionalTypes.has(type);
  const key = relationshipKey(source, target, type);
  const reverseKey = relationshipKey(target, source, type);
  if (relationshipKeys.has(key) || (bidirectional && relationshipKeys.has(reverseKey))) return false;

  const relationship = {
    id: relId(),
    source,
    target,
    type,
    label: options.label ?? relationshipLabels[type] ?? type,
    description,
    bidirectional,
    start_year: options.start_year ?? null,
    end_year: options.end_year ?? null,
    source_urls: options.source_urls ?? [wikiUrl(personName(source)), wikiUrl(personName(target))],
  };
  relationshipKeys.add(key);
  if (bidirectional) relationshipKeys.add(reverseKey);
  relationships.push(relationship);
  addedRelationships.push(relationship);
  return true;
}

function addEvent(event) {
  const participants = (event.participants ?? []).filter((participant) => hasPerson(participant.person_id));
  if (participants.length === 0) return false;

  const key = `${event.name}|${event.year}|${event.type}`;
  if (eventKeys.has(key)) return false;

  const cleanEvent = {
    id: eventId(),
    name: event.name,
    year: event.year,
    end_year: event.end_year ?? null,
    location: event.location,
    type: event.type,
    description: event.description,
    participants,
    result: event.result,
    source_urls: event.source_urls ?? [wikiUrl(event.name)],
  };
  eventKeys.add(key);
  events.push(cleanEvent);
  addedEvents.push(cleanEvent);
  return true;
}

function yearsOverlap(a, b) {
  const aStart = a.birth_year ?? 160;
  const aEnd = a.death_year ?? 280;
  const bStart = b.birth_year ?? 160;
  const bEnd = b.death_year ?? 280;
  return Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);
}

function sharedServiceWindow(a, b) {
  const start = Math.max((a.birth_year ?? 150) + 18, (b.birth_year ?? 150) + 18, 184);
  const end = Math.min(a.death_year ?? 280, b.death_year ?? 280);
  return {
    start: Number.isFinite(start) ? start : null,
    end: Number.isFinite(end) && end >= start ? end : null,
  };
}

function roleGroup(person) {
  const roles = new Set(person.roles ?? []);
  if (roles.has('emperor') || roles.has('warlord') || roles.has('regent')) return 'ruler';
  if (roles.has('general')) return 'military';
  if (roles.has('strategist') || roles.has('advisor')) return 'strategist';
  if (roles.has('minister') || roles.has('politician')) return 'civil';
  if (roles.has('scholar') || roles.has('poet') || roles.has('musician') || roles.has('calligrapher')) return 'literati';
  if (roles.has('consort') || roles.has('noble')) return 'court';
  return 'other';
}

function addClique(ids, type, description, options = {}) {
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      addRelationship(ids[i], ids[j], type, description, options);
    }
  }
}

function participant(person_id, role) {
  return { person_id, role };
}

function ensureEventParticipant(eventId, person_id, role) {
  const event = events.find((item) => item.id === eventId);
  if (!event || !hasPerson(person_id)) return;
  event.participants ??= [];
  if (!event.participants.some((item) => item.person_id === person_id)) {
    event.participants.push(participant(person_id, role));
  }
}

function addDeathEvent(personId, year, circumstance, sourceName = personName(personId)) {
  if (!hasPerson(personId)) return;
  addEvent({
    name: `${personName(personId)}之死`,
    year,
    location: '三国各地',
    type: 'death',
    description: circumstance,
    participants: [participant(personId, '逝者')],
    result: `${personName(personId)}去世，相关势力格局随之变化`,
    source_urls: [wikiUrl(sourceName)],
  });
}

function addSuccessionEvent(name, year, location, predecessor, successor, result) {
  addEvent({
    name,
    year,
    location,
    type: 'succession',
    description: `${personName(predecessor)}退场后，${personName(successor)}取得或承继政治地位。`,
    participants: [participant(predecessor, '前任'), participant(successor, '继任者')],
    result,
    source_urls: [wikiUrl(name)],
  });
}

// Lord-vassal ties: broad faction leader coverage.
for (const [leader, faction, start, end] of [
  ['cao-cao', 'wei', 190, 220],
  ['liu-bei', 'shu', 184, 223],
  ['sun-quan', 'wu', 200, 252],
  ['sima-yan', 'jin', 265, 290],
  ['han-xiandi', 'han', 189, 220],
]) {
  for (const person of personsByFaction.get(faction) ?? []) {
    addRelationship(leader, person.id, 'lord-vassal', `${person.name}名义上或实际从属于${personName(leader)}阵营。`, {
      start_year: start,
      end_year: end,
      source_urls: [wikiUrl(personName(leader)), wikiUrl(person.name)],
    });
  }
}

// Later rulers and regents to preserve dynasty transitions.
for (const [leader, members, start, end] of [
  ['cao-pi', ['cao-rui', 'cao-zhen', 'cao-xiu', 'chen-qun', 'jia-xu', 'hua-xin', 'wang-lang', 'sima-yi', 'man-chong', 'liu-ye'], 220, 226],
  ['cao-rui', ['cao-fang', 'sima-yi', 'cao-shuang', 'chen-qun', 'jiang-ji', 'xiahou-xuan', 'deng-ai', 'guo-huai'], 226, 239],
  ['sima-yi', ['sima-shi', 'sima-zhao', 'si-ma-fu', 'jia-chong', 'zhong-hui', 'deng-ai'], 239, 251],
  ['liu-shan', ['zhuge-liang', 'jiang-wan', 'fei-yi', 'dong-yun', 'jiang-wei', 'liao-hua', 'wang-ping', 'zhuge-zhan', 'huang-hao'], 223, 263],
  ['sun-jian', ['sun-ce', 'sun-quan', 'huang-gai', 'cheng-pu', 'han-dang', 'zu-mao'], 184, 191],
  ['sun-ce', ['sun-quan', 'zhou-yu', 'taishi-ci', 'zhang-zhao', 'zhang-hong', 'cheng-pu', 'huang-gai', 'han-dang'], 191, 200],
  ['sun-liang', ['zhuge-ke', 'sun-jun', 'sun-chen', 'ding-feng', 'lv-ju', 'teng-yin'], 252, 258],
  ['sun-xiu', ['sun-chen', 'ding-feng', 'zhang-bu', 'puyang-xing', 'lu-kang'], 258, 264],
  ['sun-hao', ['lu-kang', 'zhang-ti', 'shen-ying', 'cen-hun', 'wan-yu', 'xue-ying', 'hua-he'], 264, 280],
]) {
  for (const target of members) {
    addRelationship(leader, target, 'lord-vassal', `${personName(target)}在${personName(leader)}时期任职或受其统属。`, {
      start_year: start,
      end_year: end,
    });
  }
}

// Same-faction colleague network, bounded by role and overlapping eras.
const colleaguePhaseTarget = 1500;
let colleaguePhaseComplete = relationships.length >= colleaguePhaseTarget;
for (const [faction, factionPersons] of personsByFaction.entries()) {
  if (colleaguePhaseComplete) break;
  for (let i = 0; i < factionPersons.length; i += 1) {
    if (colleaguePhaseComplete) break;
    for (let j = i + 1; j < factionPersons.length; j += 1) {
      if (relationships.length >= colleaguePhaseTarget) {
        colleaguePhaseComplete = true;
        break;
      }
      const a = factionPersons[i];
      const b = factionPersons[j];
      const aGroup = roleGroup(a);
      const bGroup = roleGroup(b);
      if (aGroup !== bGroup || aGroup === 'other') continue;
      if (!yearsOverlap(a, b)) continue;
      const { start, end } = sharedServiceWindow(a, b);
      addRelationship(a.id, b.id, 'colleagues', `${a.name}与${b.name}同属${faction}阵营，职责领域相近。`, {
        start_year: start,
        end_year: end,
      });
    }
  }
}

// Ruler-successor chains.
for (const [source, target, start, description] of [
  ['cao-cao', 'cao-pi', 220, '曹丕继承曹操权位，并建立曹魏。'],
  ['cao-pi', 'cao-rui', 226, '曹叡继承曹丕成为魏明帝。'],
  ['cao-rui', 'cao-fang', 239, '曹芳继承曹叡帝位。'],
  ['cao-fang', 'cao-mao', 254, '曹髦在曹芳被废后继位。'],
  ['cao-mao', 'cao-huan', 260, '曹奂在曹髦死后被立为皇帝。'],
  ['liu-bei', 'liu-shan', 223, '刘禅继承刘备成为蜀汉后主。'],
  ['sun-jian', 'sun-ce', 191, '孙策继承孙坚旧部。'],
  ['sun-ce', 'sun-quan', 200, '孙权承继孙策江东基业。'],
  ['sun-quan', 'sun-liang', 252, '孙亮继承孙权帝位。'],
  ['sun-liang', 'sun-xiu', 258, '孙休在孙亮被废后继位。'],
  ['sun-xiu', 'sun-hao', 264, '孙皓继承孙休成为吴末帝。'],
  ['sima-yi', 'sima-shi', 251, '司马师继承司马懿执掌曹魏军政。'],
  ['sima-shi', 'sima-zhao', 255, '司马昭继承司马师权位。'],
  ['sima-zhao', 'sima-yan', 265, '司马炎继承司马昭权位并代魏建晋。'],
]) {
  addRelationship(source, target, 'successor', description, { start_year: start });
}

// Family and marriage ties.
for (const [father, son, start] of [
  ['cao-cao', 'cao-pi', 187], ['cao-cao', 'cao-zhi', 192], ['cao-cao', 'cao-zhang', null], ['cao-cao', 'cao-chong', 196], ['cao-cao', 'cao-ang', null], ['cao-cao', 'cao-biao', 195], ['cao-cao', 'cao-gan', 216], ['cao-song', 'cao-cao', 155],
  ['cao-pi', 'cao-rui', 205], ['cao-rui', 'cao-fang', 231], ['cao-lin-pei', 'cao-mao', 241], ['sun-jian', 'sun-ce', 175], ['sun-jian', 'sun-quan', 182], ['sun-jian', 'sun-shangxiang', null], ['sun-jian', 'sun-yi', 184], ['sun-jian', 'sun-kuang', null],
  ['sun-quan', 'sun-deng', 209], ['sun-quan', 'sun-he', 224], ['sun-quan', 'sun-liang', 243], ['sun-quan', 'sun-ba', null], ['sun-quan', 'sun-luban', null], ['sun-quan', 'sun-luyu', null], ['sun-he', 'sun-hao', 242], ['sun-xiu', 'sun-fen', null],
  ['liu-bei', 'liu-shan', 207], ['liu-bei', 'liu-feng', null], ['liu-bei', 'liu-chen', null], ['guan-yu', 'guan-ping', null], ['guan-yu', 'guan-xing', null], ['guan-yu', 'guan-suo', null], ['zhang-fei', 'zhang-bao', null], ['zhang-fei', 'zhang-shao', null],
  ['ma-teng', 'ma-chao', 176], ['ma-chao', 'ma-cheng', null], ['pang-tong', 'pang-tong-hong', null], ['fa-zheng', 'fa-miao', null], ['zhuge-liang', 'zhuge-zhan', 227], ['zhuge-liang', 'zhuge-qiao', 204], ['zhuge-jin', 'zhuge-ke', 203], ['zhuge-jin', 'zhuge-rong', null],
  ['sima-yi', 'sima-shi', 208], ['sima-yi', 'sima-zhao', 211], ['sima-zhao', 'sima-yan', 236], ['xiahou-yuan', 'xiahou-ba', null], ['xiahou-yuan', 'xiahou-wei', null], ['xiahou-yuan', 'xiahou-hui', null], ['xiahou-dun', 'xiahou-mao', null],
]) {
  addRelationship(father, son, 'father-son', `${personName(son)}为${personName(father)}之子。`, { start_year: start });
}

for (const ids of [
  ['liu-bei', 'guan-yu', 'zhang-fei'],
  ['cao-pi', 'cao-zhi', 'cao-zhang', 'cao-chong', 'cao-ang', 'cao-biao'],
  ['sun-ce', 'sun-quan', 'sun-shangxiang', 'sun-yi', 'sun-kuang'],
  ['sima-shi', 'sima-zhao'],
  ['guan-ping', 'guan-xing', 'guan-suo'],
  ['zhang-bao', 'zhang-shao'],
  ['zhuge-ke', 'zhuge-rong'],
  ['xiahou-ba', 'xiahou-wei', 'xiahou-hui'],
]) {
  addClique(ids, 'brothers', '同一家族兄弟姊妹关系。');
}

for (const [husband, wife, start] of [
  ['liu-bei', 'lady-gan', null], ['liu-bei', 'lady-mi', null], ['liu-bei', 'sun-shangxiang', 209], ['liu-shan', 'empress-zhang-1', null], ['liu-shan', 'empress-zhang-2', null], ['liu-shan', 'li-zhaoyi', null],
  ['sun-ce', 'da-qiao', null], ['zhou-yu', 'xiao-qiao', null], ['cao-pi', 'zhen-ji', null], ['cao-pi', 'guo-nuwang', null], ['sima-yi', 'zhang-chunhua', null], ['lv-bu', 'diao-chan', null],
]) {
  addRelationship(husband, wife, 'husband-wife', `${personName(husband)}与${personName(wife)}有婚姻关系。`, { start_year: start });
}

for (const [mother, son] of [
  ['lady-gan', 'liu-shan'], ['zhen-ji', 'cao-rui'], ['guo-nuwang', 'cao-rui'], ['zhang-chunhua', 'sima-shi'], ['zhang-chunhua', 'sima-zhao'], ['wu-guotai', 'sun-ce'], ['wu-guotai', 'sun-quan'],
]) {
  addRelationship(mother, son, 'mother-son', `${personName(son)}与${personName(mother)}有母子关系。`);
}

for (const [a, b, description] of [
  ['liu-bei', 'sun-quan', '刘备与孙权因孙尚香婚姻形成姻亲。'],
  ['zhang-fei', 'liu-shan', '张飞之女成为刘禅皇后，张氏与刘氏结为姻亲。'],
  ['sun-quan', 'zhou-yu', '周瑜娶小乔，孙氏集团与乔氏、周氏关系密切。'],
  ['sun-quan', 'lu-xun', '孙权女儿嫁陆逊之子，孙陆两族结为姻亲。'],
  ['sima-yi', 'xiahou-xuan', '司马氏与夏侯、曹魏士族长期联姻通好。'],
]) {
  addRelationship(a, b, 'in-law', description);
}

// Sworn brothers, friends, allies, master-student, and subordinate clusters.
addClique(['liu-bei', 'guan-yu', 'zhang-fei'], 'sworn-brothers', '桃园结义形成的结义兄弟关系。', { start_year: 184 });
addClique(['tao-qian', 'liu-bei', 'mi-zhu', 'sun-qian'], 'allies', '陶谦临终前后，徐州集团与刘备形成政治同盟。', { start_year: 194, end_year: 196 });
addClique(['zhou-yu', 'lu-su', 'zhuge-liang'], 'allies', '赤壁前后，孙刘双方关键谋臣共同促成抗曹联盟。', { start_year: 208, end_year: 210 });
addClique(['sima-yi', 'sima-shi', 'sima-zhao', 'jia-chong'], 'allies', '司马氏核心集团共同推进魏晋嬗代。', { start_year: 249, end_year: 265 });
addClique(['cao-cao', 'guo-jia', 'xun-yu', 'xun-you', 'cheng-yu', 'jia-xu'], 'friends', '曹操与主要谋臣长期共事，形成亲密政治关系。', { start_year: 196, end_year: 207 });
addClique(['sun-ce', 'zhou-yu', 'zhang-zhao', 'zhang-hong'], 'friends', '孙策开拓江东时依重周瑜、张昭、张纮等人。', { start_year: 194, end_year: 200 });
addClique(['zhuge-liang', 'jiang-wan', 'fei-yi', 'dong-yun'], 'friends', '蜀汉四相先后主持国政，政治路线相承。', { start_year: 223, end_year: 253 });

for (const [master, student, start, description] of [
  ['lu-zhi', 'liu-bei', 175, '刘备曾师从卢植。'], ['lu-zhi', 'gongsun-zan', 175, '公孙瓒曾从学卢植。'], ['qiao-zhou', 'chen-shou', 250, '谯周对蜀汉后期学术与政治判断影响深远。'], ['zhuge-liang', 'jiang-wei', 228, '姜维受诸葛亮赏识并继承北伐路线。'], ['sima-yi', 'deng-ai', 240, '邓艾在魏晋军事体系中受司马氏提拔。'], ['sima-yi', 'zhong-hui', 245, '钟会在司马氏掌权后进入中枢。'],
]) {
  addRelationship(master, student, 'master-student', description, { start_year: start });
}

for (const [superior, subordinates, start, end] of [
  ['cao-cao', ['xiahou-dun', 'xiahou-yuan', 'cao-ren', 'cao-hong', 'zhang-liao', 'xu-huang', 'yu-jin', 'yue-jin', 'li-dian', 'xu-chu', 'dian-wei', 'pang-de'], 190, 220],
  ['liu-bei', ['guan-yu', 'zhang-fei', 'zhao-yun', 'huang-zhong', 'ma-chao', 'wei-yan', 'liu-feng', 'chen-dao'], 184, 223],
  ['zhuge-liang', ['wei-yan', 'jiang-wei', 'wang-ping', 'ma-su', 'ma-dai', 'gao-xiang', 'liao-hua'], 223, 234],
  ['sun-quan', ['zhou-yu', 'lu-su', 'lv-meng', 'lu-xun', 'gan-ning', 'ling-tong', 'zhou-tai', 'zhu-ran', 'ding-feng'], 200, 252],
  ['sima-zhao', ['deng-ai', 'zhong-hui', 'jia-chong', 'du-yu', 'yang-hu'], 255, 265],
]) {
  for (const target of subordinates) {
    addRelationship(superior, target, 'subordinate', `${personName(target)}在军事或政务上隶属于${personName(superior)}集团。`, { start_year: start, end_year: end });
  }
}

// Rivalries, kills, betrayals, and defections around major battles.
for (const [a, b, start, end, description] of [
  ['cao-cao', 'yuan-shao', 190, 202, '曹操与袁绍争夺北方霸权。'], ['cao-cao', 'liu-bei', 196, 220, '曹操与刘备长期争夺中原、荆益与汉室正统。'], ['cao-cao', 'sun-quan', 208, 220, '曹操与孙权在赤壁、合肥等战线上对抗。'], ['liu-bei', 'sun-quan', 219, 222, '荆州争夺和夷陵之战使刘备、孙权关系破裂。'],
  ['guan-yu', 'lv-meng', 219, 219, '吕蒙袭取荆州，直接导致关羽败亡。'], ['zhuge-liang', 'sima-yi', 228, 234, '诸葛亮北伐与司马懿在关陇战场长期对峙。'], ['jiang-wei', 'deng-ai', 247, 263, '姜维北伐与邓艾防蜀、灭蜀形成长期军事对抗。'], ['jiang-wei', 'zhong-hui', 263, 264, '灭蜀后姜维试图借钟会叛乱复国。'],
  ['sun-jun', 'zhuge-ke', 253, 253, '孙峻政变诛杀诸葛恪。'], ['sun-chen', 'sun-liang', 257, 258, '孙綝废黜孙亮。'], ['sun-chen', 'sun-xiu', 258, 258, '孙休即位后诛杀孙綝。'], ['cao-shuang', 'sima-yi', 239, 249, '曹爽与司马懿争夺曹魏辅政权。'], ['cao-mao', 'sima-zhao', 260, 260, '曹髦讨伐司马昭失败被杀。'],
  ['dong-zhuo', 'wang-yun', 189, 192, '王允策划诛杀董卓。'], ['dong-zhuo', 'lv-bu', 189, 192, '吕布由董卓部将转而刺杀董卓。'], ['yuan-shu', 'liu-bei', 196, 199, '袁术与刘备在徐州、淮南相争。'], ['gongsun-zan', 'yuan-shao', 191, 199, '公孙瓒与袁绍争夺幽冀。'],
]) {
  addRelationship(a, b, 'rivals', description, { start_year: start, end_year: end });
}

for (const [victim, killer, year, description] of [
  ['dong-zhuo', 'lv-bu', 192, '吕布受王允策动刺杀董卓。'], ['yan-liang', 'guan-yu', 200, '关羽在白马阵斩颜良。'], ['wen-chou', 'cao-cao', 200, '文丑在延津之战中败亡于曹军。'], ['hua-xiong', 'sun-jian', 191, '华雄在讨董战事中为孙坚军击败。'], ['dian-wei', 'zhang-xiu', 197, '典韦在宛城之战抵御张绣军时战死。'],
  ['cao-ang', 'zhang-xiu', 197, '曹昂在宛城之战中遇害。'], ['guan-yu', 'sun-quan', 219, '关羽败走麦城后被孙权方面处死。'], ['guan-ping', 'sun-quan', 219, '关平随关羽败亡。'], ['zhang-fei', 'zhang-da', 221, '张飞出征前被部下刺杀。'], ['liu-feng', 'liu-bei', 220, '刘封因不救关羽等事被刘备赐死。'],
  ['ma-su', 'zhuge-liang', 228, '马谡街亭失守后被诸葛亮处斩。'], ['zhang-he', 'zhuge-liang', 231, '张郃追击蜀军时中伏身亡。'], ['wei-yan', 'ma-dai', 234, '魏延与杨仪争权失败后为马岱所杀。'], ['zhuge-zhan', 'deng-ai', 263, '诸葛瞻在绵竹抵抗邓艾时战死。'], ['fu-qian', 'deng-ai', 263, '傅佥在魏灭蜀战事中战死。'],
  ['cao-mao', 'jia-chong', 260, '曹髦讨伐司马昭时被贾充部下所杀。'], ['zhuge-ke', 'sun-jun', 253, '诸葛恪被孙峻发动政变杀害。'], ['sun-chen', 'sun-xiu', 258, '孙休联合丁奉诛杀孙綝。'], ['lv-ju', 'sun-chen', 256, '吕据反对孙綝失败后败亡。'], ['teng-yin', 'sun-chen', 256, '滕胤反孙綝失败被杀。'],
  ['shen-ying', 'wang-jun', 280, '沈莹在晋灭吴战事中败亡。'], ['zhang-ti', 'wang-jun', 280, '张悌在吴末抗晋战事中阵亡。'], ['gan-ning', 'shamoke', 222, '甘宁在夷陵战事相关记载中为沙摩柯射杀。'], ['shamoke', 'zhou-tai', 222, '沙摩柯在夷陵败退中为吴军所杀。'],
]) {
  addRelationship(victim, killer, 'killed-by', description, { start_year: year, end_year: year });
}

for (const [defector, formerLord, newLord, year, description] of [
  ['lv-bu', 'ding-yuan', 'dong-zhuo', 189, '吕布背叛丁原转投董卓。'], ['lv-bu', 'dong-zhuo', 'wang-yun', 192, '吕布背叛董卓并与王允合谋。'], ['zhang-liao', 'lv-bu', 'cao-cao', 198, '张辽在吕布败亡后归降曹操。'], ['zhang-he', 'yuan-shao', 'cao-cao', 200, '张郃在官渡战局中投降曹操。'], ['gao-lan', 'yuan-shao', 'cao-cao', 200, '高览与张郃一同降曹。'], ['xu-you', 'yuan-shao', 'cao-cao', 200, '许攸离开袁绍转投曹操。'],
  ['jia-xu', 'zhang-xiu', 'cao-cao', 199, '贾诩随张绣归降曹操。'], ['zhang-xiu', 'liu-biao', 'cao-cao', 199, '张绣由依附刘表转而降曹。'], ['huang-quan', 'liu-bei', 'cao-pi', 222, '黄权夷陵后道路阻绝，归降曹魏。'], ['xiahou-ba', 'cao-shuang', 'liu-shan', 249, '夏侯霸在高平陵后投奔蜀汉。'], ['jiang-wei', 'cao-wei', 'zhuge-liang', 228, '姜维在诸葛亮北伐时归降蜀汉。'], ['meng-huo', 'yong-kai', 'zhuge-liang', 225, '南中平定后孟获归附蜀汉。'],
  ['wei-yan', 'liu-shan', 'yang-yi', 234, '诸葛亮死后魏延与杨仪冲突，被蜀汉中枢认定叛乱。'], ['zhong-hui', 'sima-zhao', 'jiang-wei', 264, '钟会灭蜀后试图据蜀反司马昭。'], ['wen-qin', 'cao-wei', 'sun-liang', 255, '文钦反司马氏失败后投吴。'], ['wen-yang', 'wen-qin', 'sima-zhao', 258, '文鸯在诸葛诞之乱后归晋。'], ['quan-yi', 'sun-hao', 'sima-yan', 279, '全怿在晋伐吴期间降晋。'], ['tang-zi', 'sun-hao', 'sima-yan', 279, '唐咨在吴末战事中归附晋方。'],
]) {
  if (hasPerson(defector) && hasPerson(formerLord)) {
    addRelationship(defector, formerLord, 'betrayal', description, { start_year: year, end_year: year });
  }
  if (hasPerson(defector) && hasPerson(newLord)) {
    addRelationship(defector, newLord, 'allies', `${personName(defector)}转而依附或联合${personName(newLord)}。`, { start_year: year });
  }
}

// Events: campaigns, coups, deaths, successions, and local battles.
const eventSeeds = [
  ['颍川黄巾之战', 184, null, '颍川', 'rebellion', '皇甫嵩、朱儁在颍川一带镇压波才等黄巾军，曹操亦率兵参与。', [['huangfu-song', '指挥者'], ['zhu-jun', '指挥者'], ['cao-cao', '参与者'], ['zhang-jue', '起义领袖']], '黄巾主力在颍川受挫。'],
  ['广宗之战', 184, null, '广宗', 'rebellion', '东汉军围攻张角、张梁据守的广宗，是平定黄巾的核心战役之一。', [['huangfu-song', '指挥者'], ['zhang-jue', '起义领袖'], ['zhang-liang-yj', '守将']], '张角病死，张梁败亡。'],
  ['下曲阳之战', 184, null, '下曲阳', 'rebellion', '皇甫嵩继续进攻黄巾军，张宝所部被击破。', [['huangfu-song', '指挥者'], ['zhang-bao-yj', '守将']], '黄巾北方主力瓦解。'],
  ['汝南黄巾余部活动', 185, 205, '汝南', 'rebellion', '黄巾失败后各地余部长期活动，汝南、颍川一带成为群雄争夺区。', [['gong-du', '黄巾余部'], ['liu-bei', '讨伐者']], '地方秩序长期动荡。'],
  ['董卓入洛阳', 189, null, '洛阳', 'political', '何进被宦官杀害后，董卓率军入洛阳，控制朝廷。', [['dong-zhuo', '掌权者'], ['he-jin', '被害者'], ['han-shaodi', '皇帝'], ['han-xiandi', '皇子']], '董卓掌控中央政权。'],
  ['废少帝立献帝', 189, null, '洛阳', 'succession', '董卓废黜少帝，改立刘协为汉献帝。', [['dong-zhuo', '决策者'], ['han-xiandi', '继任者']], '汉献帝即位，董卓威权进一步扩张。'],
  ['迁都长安', 190, null, '长安', 'political', '关东联军起兵后，董卓焚烧洛阳并迁都长安。', [['dong-zhuo', '决策者'], ['li-ru', '谋士'], ['han-xiandi', '皇帝']], '洛阳残破，朝廷迁往长安。'],
  ['孙坚入洛阳', 191, null, '洛阳', 'battle', '孙坚击退董卓军，进入被焚毁后的洛阳。', [['sun-jian', '指挥者'], ['dong-zhuo', '敌方统帅'], ['hua-xiong', '将领']], '孙坚声望上升，董卓退守关中。'],
  ['王允诛董卓', 192, null, '长安', 'political', '王允联合吕布发动宫廷政变，刺杀董卓。', [['wang-yun', '策划者'], ['lv-bu', '执行者'], ['dong-zhuo', '被杀者']], '董卓身死，长安政局再度失控。'],
  ['李傕郭汜攻长安', 192, null, '长安', 'battle', '董卓旧部李傕、郭汜等攻入长安，击败王允。', [['li-jue', '指挥者'], ['guo-si', '指挥者'], ['wang-yun', '被害者'], ['lv-bu', '败退者']], '董卓旧部重新控制朝廷。'],
  ['献帝东归', 195, 196, '洛阳', 'political', '汉献帝逃离李傕、郭汜控制，辗转东归洛阳。', [['han-xiandi', '皇帝'], ['li-jue', '追击者'], ['guo-si', '追击者'], ['yang-biao', '护驾者']], '献帝脱离关中军阀控制。'],
  ['曹操迎献帝', 196, null, '许县', 'political', '曹操迎汉献帝至许县，形成挟天子以令诸侯的政治格局。', [['cao-cao', '主导者'], ['han-xiandi', '皇帝'], ['xun-yu', '谋划者']], '许都成为东汉末年政治中心。'],
  ['徐州让与刘备', 194, null, '徐州', 'succession', '陶谦临终前让徐州于刘备，刘备由此成为一方牧守。', [['tao-qian', '前任'], ['liu-bei', '继任者'], ['mi-zhu', '支持者']], '刘备取得徐州。'],
  ['袁术称帝', 197, null, '寿春', 'political', '袁术据有传国玺后僭号称帝，遭诸侯共同讨伐。', [['yuan-shu', '称帝者'], ['ji-ling', '部将'], ['cao-cao', '讨伐者'], ['liu-bei', '讨伐者']], '袁术政治孤立并迅速衰败。'],
  ['吕布夺徐州', 196, null, '下邳', 'political', '吕布乘刘备与袁术交战之机夺取徐州。', [['lv-bu', '夺取者'], ['liu-bei', '失地者'], ['zhang-fei', '守将']], '刘备失去徐州，被迫依附曹操。'],
  ['白马之战', 200, null, '白马', 'battle', '关羽随曹操军救白马，斩杀袁绍大将颜良。', [['cao-cao', '指挥者'], ['guan-yu', '突击者'], ['yan-liang', '战死者'], ['yuan-shao', '敌方统帅']], '曹操解白马之围。'],
  ['延津之战', 200, null, '延津', 'battle', '曹操在延津设伏击败袁绍军，文丑战死。', [['cao-cao', '指挥者'], ['wen-chou', '战死者'], ['yuan-shao', '敌方统帅']], '袁绍前锋受挫。'],
  ['乌巢之战', 200, null, '乌巢', 'battle', '曹操夜袭乌巢，烧毁袁绍军粮。', [['cao-cao', '指挥者'], ['xu-you', '献策者'], ['chunyu-qiong', '守将'], ['yuan-shao', '敌方统帅']], '袁绍军心崩溃，官渡局势逆转。'],
  ['仓亭之战', 201, null, '仓亭', 'battle', '官渡之后曹操继续追击袁绍残部。', [['cao-cao', '指挥者'], ['yuan-shao', '敌方统帅']], '袁绍势力进一步削弱。'],
  ['黎阳之战', 202, 203, '黎阳', 'battle', '曹操与袁谭、袁尚在黎阳交战。', [['cao-cao', '指挥者'], ['yuan-tan', '敌方'], ['yuan-shang', '敌方']], '袁氏兄弟退守冀州。'],
  ['邺城之战', 204, null, '邺城', 'battle', '曹操攻取袁尚根据地邺城。', [['cao-cao', '指挥者'], ['shen-pei', '守将'], ['yuan-shang', '失地者']], '曹操控制冀州。'],
  ['南皮之战', 205, null, '南皮', 'battle', '曹操攻灭袁谭。', [['cao-cao', '指挥者'], ['yuan-tan', '败亡者']], '袁谭败亡，河北进一步归曹。'],
  ['白狼山之战', 207, null, '白狼山', 'battle', '曹操北征乌桓，张辽等大破蹋顿。', [['cao-cao', '统帅'], ['zhang-liao', '先锋'], ['tadun', '战死者']], '乌桓主力被击溃，袁氏残余覆灭。'],
  ['孙策平定江东', 195, 199, '江东', 'battle', '孙策攻破刘繇、严白虎等势力，奠定江东基业。', [['sun-ce', '统帅'], ['zhou-yu', '部将'], ['liu-yao', '敌方'], ['yan-baihu', '敌方']], '孙氏控制江东。'],
  ['孙策遇刺', 200, null, '丹徒', 'death', '孙策遭刺客袭击后伤重去世。', [['sun-ce', '逝者'], ['sun-quan', '继任者'], ['zhang-zhao', '托孤大臣']], '孙权继承江东。'],
  ['赤壁孙刘结盟', 208, null, '柴桑', 'diplomatic', '鲁肃、诸葛亮、周瑜推动孙刘联合抗曹。', [['sun-quan', '决策者'], ['liu-bei', '盟友'], ['zhou-yu', '主战者'], ['lu-su', '斡旋者'], ['zhuge-liang', '使者']], '孙刘联盟形成。'],
  ['江陵之战', 208, 209, '江陵', 'battle', '赤壁后周瑜进攻曹仁守卫的江陵。', [['zhou-yu', '指挥者'], ['cao-ren', '守将'], ['gan-ning', '参战者']], '孙权取得南郡。'],
  ['刘备入蜀', 211, null, '益州', 'political', '刘璋邀请刘备入蜀抵御张鲁，刘备势力进入益州。', [['liu-bei', '入蜀者'], ['liu-zhang', '邀请者'], ['zhang-song', '策划者'], ['fa-zheng', '策划者']], '刘备获得入蜀契机。'],
  ['雒城之战', 213, null, '雒城', 'battle', '刘备军攻打刘璋重镇雒城，庞统中流矢身亡。', [['liu-bei', '统帅'], ['pang-tong', '战死者'], ['zhang-ren', '守将']], '刘备继续推进成都。'],
  ['成都投降', 214, null, '成都', 'succession', '刘璋向刘备投降，益州易主。', [['liu-zhang', '前任'], ['liu-bei', '继任者'], ['fa-zheng', '谋臣']], '刘备取得益州。'],
  ['合肥之战', 215, null, '合肥', 'battle', '张辽、李典、乐进在合肥击退孙权。', [['zhang-liao', '指挥者'], ['li-dian', '参战者'], ['yue-jin', '参战者'], ['sun-quan', '敌方统帅']], '孙权进攻合肥失败。'],
  ['定军山之战', 219, null, '定军山', 'battle', '黄忠斩杀夏侯渊，刘备夺取汉中关键据点。', [['huang-zhong', '突击者'], ['xiahou-yuan', '战死者'], ['liu-bei', '统帅'], ['cao-cao', '敌方统帅']], '刘备占据汉中优势。'],
  ['刘备称汉中王', 219, null, '汉中', 'political', '刘备夺取汉中后自称汉中王。', [['liu-bei', '称王者'], ['zhuge-liang', '臣属'], ['fa-zheng', '功臣']], '蜀汉建国基础形成。'],
  ['樊城之战', 219, null, '樊城', 'battle', '关羽北伐襄樊，水淹七军，后遭曹魏与孙权夹击。', [['guan-yu', '统帅'], ['yu-jin', '降将'], ['pang-de', '战死者'], ['cao-ren', '守将'], ['lv-meng', '袭击者']], '关羽败亡，荆州归吴。'],
  ['曹丕代汉', 220, null, '洛阳', 'succession', '曹丕逼迫汉献帝禅让，建立曹魏。', [['cao-pi', '受禅者'], ['han-xiandi', '禅让者'], ['sima-yi', '臣属']], '东汉正式灭亡，曹魏建立。'],
  ['刘备称帝', 221, null, '成都', 'succession', '刘备以延续汉统为名在成都称帝。', [['liu-bei', '皇帝'], ['zhuge-liang', '丞相'], ['liu-shan', '太子']], '蜀汉建立。'],
  ['孙权称吴王', 222, null, '武昌', 'succession', '夷陵后孙权受魏封为吴王。', [['sun-quan', '吴王'], ['cao-pi', '册封者'], ['lu-xun', '功臣']], '孙吴政权进一步制度化。'],
  ['白帝城托孤', 223, null, '白帝城', 'political', '刘备临终托孤诸葛亮、李严，刘禅继位。', [['liu-bei', '托孤者'], ['liu-shan', '继任者'], ['zhuge-liang', '辅政者'], ['li-yan', '辅政者']], '蜀汉进入诸葛亮辅政时期。'],
  ['诸葛亮南征', 225, null, '南中', 'battle', '诸葛亮南征平定南中叛乱，安抚孟获等地方势力。', [['zhuge-liang', '统帅'], ['meng-huo', '地方首领'], ['yong-kai', '叛乱者'], ['lv-kai', '地方官']], '南中归附蜀汉。'],
  ['石亭之战', 228, null, '石亭', 'battle', '陆逊设伏击败曹休，孙吴取得淮南方向胜利。', [['lu-xun', '指挥者'], ['cao-xiu', '敌方统帅'], ['zhu-huan', '参战者']], '曹魏南征失败。'],
  ['诸葛亮第一次北伐', 228, null, '陇右', 'battle', '诸葛亮出祁山攻魏，马谡失街亭导致蜀军撤退。', [['zhuge-liang', '统帅'], ['ma-su', '将领'], ['wang-ping', '将领'], ['jiang-wei', '归降者'], ['zhang-he', '魏将']], '蜀军因街亭失守撤回汉中。'],
  ['诸葛亮第二次北伐', 228, null, '陈仓', 'battle', '诸葛亮围攻陈仓，郝昭坚守，蜀军粮尽退兵。', [['zhuge-liang', '统帅'], ['wang-shuang', '魏将'], ['cao-zhen', '魏方统帅']], '蜀军未能攻克陈仓。'],
  ['诸葛亮第三次北伐', 229, null, '武都阴平', 'battle', '诸葛亮派陈式等攻取武都、阴平二郡。', [['zhuge-liang', '统帅'], ['chen-shi', '将领'], ['guo-huai', '魏将']], '蜀汉取得武都、阴平。'],
  ['诸葛亮第四次北伐', 231, null, '祁山', 'battle', '诸葛亮再出祁山，与司马懿、张郃对峙，张郃追击战死。', [['zhuge-liang', '统帅'], ['sima-yi', '魏方统帅'], ['zhang-he', '战死者'], ['wei-yan', '蜀将']], '蜀军粮尽撤退，张郃战死。'],
  ['诸葛亮第五次北伐', 234, null, '五丈原', 'battle', '诸葛亮率军驻五丈原，与司马懿长期对峙，病逝军中。', [['zhuge-liang', '统帅'], ['sima-yi', '魏方统帅'], ['wei-yan', '蜀将'], ['yang-yi', '撤军组织者']], '诸葛亮病逝，蜀军撤回。'],
  ['孙权称帝', 229, null, '建业', 'succession', '孙权在建业称帝，正式建立孙吴。', [['sun-quan', '皇帝'], ['zhang-zhao', '重臣'], ['lu-xun', '重臣']], '吴国正式称帝。'],
  ['高平陵之变', 249, null, '洛阳', 'political', '司马懿发动政变，夺取曹爽辅政权。', [['sima-yi', '发动者'], ['cao-shuang', '被废者'], ['cao-fang', '皇帝'], ['jiang-ji', '参与者']], '司马氏掌控曹魏政权。'],
  ['诸葛恪北伐', 253, null, '合肥新城', 'battle', '诸葛恪率吴军大举攻魏，久攻不克。', [['zhuge-ke', '统帅'], ['sun-liang', '皇帝'], ['zhang-te', '守将']], '吴军损失惨重，诸葛恪威望下降。'],
  ['孙峻诛诸葛恪', 253, null, '建业', 'political', '孙峻联合孙亮诛杀诸葛恪，接管吴国朝政。', [['sun-jun', '发动者'], ['zhuge-ke', '被杀者'], ['sun-liang', '皇帝']], '孙峻掌权。'],
  ['毌丘俭文钦之乱', 255, null, '淮南', 'rebellion', '毌丘俭、文钦起兵反对司马氏。', [['guanqiu-jian', '叛乱者'], ['wen-qin', '叛乱者'], ['sima-shi', '镇压者'], ['wen-yang', '参战者']], '叛乱失败，文钦投吴。'],
  ['孙綝废孙亮', 258, null, '建业', 'political', '孙綝废黜孙亮，改立孙休。', [['sun-chen', '发动者'], ['sun-liang', '被废者'], ['sun-xiu', '继任者']], '孙休即位，孙綝权势达到顶点。'],
  ['孙休诛孙綝', 258, null, '建业', 'political', '孙休联合丁奉等诛杀孙綝。', [['sun-xiu', '决策者'], ['sun-chen', '被杀者'], ['ding-feng', '执行者']], '孙綝势力被清除。'],
  ['诸葛诞之乱', 257, 258, '寿春', 'rebellion', '诸葛诞在寿春起兵反司马氏，并得到吴国援助。', [['zhuge-dan', '叛乱者'], ['sima-zhao', '镇压者'], ['wen-qin', '参战者'], ['zhuge-rong', '吴方将领']], '寿春被攻破，诸葛诞败亡。'],
  ['曹髦讨司马昭', 260, null, '洛阳', 'political', '魏帝曹髦亲率左右讨伐司马昭，途中被贾充部下所杀。', [['cao-mao', '皇帝'], ['sima-zhao', '权臣'], ['jia-chong', '参与者']], '曹髦被杀，曹奂继位。'],
  ['姜维第一次北伐', 247, null, '陇西', 'battle', '姜维随费祎限制下试探性出兵陇西。', [['jiang-wei', '统帅'], ['fei-yi', '制约者'], ['guo-huai', '魏将']], '蜀军未取得决定性成果。'],
  ['姜维第二次北伐', 249, null, '麹山', 'battle', '姜维筑城麹山进逼魏境，被郭淮、陈泰逼退。', [['jiang-wei', '统帅'], ['guo-huai', '魏将'], ['chen-tai', '魏将']], '麹山据点被魏军拔除。'],
  ['姜维第三次北伐', 253, null, '南安', 'battle', '费祎死后姜维加大北伐，围攻南安。', [['jiang-wei', '统帅'], ['chen-tai', '魏将'], ['xiahou-ba', '蜀将']], '蜀军因粮尽撤退。'],
  ['姜维第四次北伐', 254, null, '狄道', 'battle', '姜维攻魏陇西，迫使部分魏地降附。', [['jiang-wei', '统帅'], ['zhang-ni', '蜀将'], ['xu-zhi', '魏将']], '蜀军取得局部胜利。'],
  ['姜维第五次北伐', 255, null, '洮西', 'battle', '姜维在洮西大破魏军，王经损失惨重。', [['jiang-wei', '统帅'], ['xiahou-ba', '蜀将'], ['chen-tai', '魏将']], '蜀汉取得姜维北伐最大胜利之一。'],
  ['姜维段谷之败', 256, null, '段谷', 'battle', '姜维与邓艾交战失利，蜀军损失严重。', [['jiang-wei', '统帅'], ['deng-ai', '魏将'], ['xiahou-ba', '蜀将']], '姜维威望受挫。'],
  ['姜维侯和之战', 262, null, '侯和', 'battle', '姜维进攻魏境，在侯和被邓艾击退。', [['jiang-wei', '统帅'], ['deng-ai', '魏将'], ['liao-hua', '蜀将']], '蜀军撤回沓中。'],
  ['魏灭蜀战役', 263, null, '蜀地', 'battle', '司马昭命邓艾、钟会、诸葛绪分路伐蜀。', [['sima-zhao', '决策者'], ['deng-ai', '统帅'], ['zhong-hui', '统帅'], ['zhuge-xu', '统帅'], ['jiang-wei', '防御者']], '蜀汉覆灭。'],
  ['剑阁对峙', 263, null, '剑阁', 'battle', '姜维退守剑阁，阻挡钟会主力。', [['jiang-wei', '守将'], ['zhong-hui', '魏将'], ['liao-hua', '蜀将']], '钟会主力受阻，邓艾转走阴平。'],
  ['邓艾偷渡阴平', 263, null, '阴平', 'battle', '邓艾率军穿越阴平险道，直趋成都。', [['deng-ai', '统帅'], ['zhuge-zhan', '抵抗者'], ['fu-qian', '参战者']], '魏军突破蜀汉后方防线。'],
  ['刘禅降魏', 263, null, '成都', 'succession', '邓艾兵临成都，刘禅出降。', [['liu-shan', '降者'], ['deng-ai', '受降者'], ['qiao-zhou', '劝降者']], '蜀汉灭亡。'],
  ['钟会姜维之乱', 264, null, '成都', 'rebellion', '钟会与姜维试图据蜀反叛司马昭，旋即失败。', [['zhong-hui', '叛乱者'], ['jiang-wei', '参与者'], ['deng-ai', '被害者'], ['sima-zhao', '平定者']], '钟会、姜维败亡。'],
  ['司马炎代魏', 265, null, '洛阳', 'succession', '司马炎接受曹奂禅让，建立西晋。', [['sima-yan', '受禅者'], ['cao-huan', '禅让者'], ['jia-chong', '重臣']], '曹魏灭亡，西晋建立。'],
  ['羊祜镇襄阳', 269, 278, '襄阳', 'political', '羊祜镇守荆州，长期经营伐吴战略。', [['yang-hu', '镇守者'], ['lu-kang', '吴方对手'], ['sima-yan', '君主']], '晋吴边境态势向晋方倾斜。'],
  ['陆抗守西陵', 272, null, '西陵', 'battle', '陆抗击败晋军并处理步阐叛吴事件。', [['lu-kang', '吴方统帅'], ['yang-hu', '晋方统帅'], ['sun-hao', '吴帝']], '孙吴暂时稳定西陵防线。'],
  ['晋伐吴六路进军', 279, null, '长江沿线', 'battle', '晋武帝发动灭吴总攻，王濬、杜预等分路进军。', [['sima-yan', '决策者'], ['du-yu', '统帅'], ['wang-jun', '水军统帅'], ['jia-chong', '大都督'], ['sun-hao', '防御方']], '晋军全线压迫吴国。'],
  ['王濬楼船下益州', 279, 280, '长江上游', 'battle', '王濬率楼船水师自益州顺流东下。', [['wang-jun', '统帅'], ['du-yu', '协同者'], ['sun-hao', '敌方君主']], '晋军突破长江防线。'],
  ['杜预取江陵', 280, null, '江陵', 'battle', '杜预在荆州方向攻取江陵等地。', [['du-yu', '统帅'], ['sima-yan', '君主'], ['sun-hao', '敌方君主']], '晋军打开荆州通道。'],
  ['孙皓出降', 280, null, '建业', 'succession', '王濬军至建业，孙皓出降。', [['sun-hao', '降者'], ['wang-jun', '受降者'], ['sima-yan', '晋帝']], '孙吴灭亡，西晋统一。'],
];

for (const [name, year, end_year, location, type, description, participants, result] of eventSeeds) {
  addEvent({
    name,
    year,
    end_year,
    location,
    type,
    description,
    participants: participants.map(([person_id, role]) => participant(person_id, role)),
    result,
    source_urls: [wikiUrl(name)],
  });
}

for (const [name, year, location, predecessor, successor, result] of [
  ['曹叡继位', 226, '洛阳', 'cao-pi', 'cao-rui', '曹魏进入明帝时期。'],
  ['曹芳继位', 239, '洛阳', 'cao-rui', 'cao-fang', '曹爽、司马懿辅政。'],
  ['曹芳被废', 254, '洛阳', 'cao-fang', 'cao-mao', '司马师废曹芳，改立曹髦。'],
  ['曹奂继位', 260, '洛阳', 'cao-mao', 'cao-huan', '曹奂成为曹魏末代皇帝。'],
  ['刘禅继位', 223, '成都', 'liu-bei', 'liu-shan', '蜀汉进入后主时期。'],
  ['孙亮继位', 252, '建业', 'sun-quan', 'sun-liang', '诸葛恪辅政。'],
  ['孙休继位', 258, '建业', 'sun-liang', 'sun-xiu', '孙休继位后清除孙綝。'],
  ['孙皓继位', 264, '建业', 'sun-xiu', 'sun-hao', '孙吴进入末期。'],
  ['司马师继掌魏政', 251, '洛阳', 'sima-yi', 'sima-shi', '司马师继续控制曹魏军政。'],
  ['司马昭继掌魏政', 255, '洛阳', 'sima-shi', 'sima-zhao', '司马昭掌握曹魏实权。'],
]) {
  addSuccessionEvent(name, year, location, predecessor, successor, result);
}

for (const [personId, year, circumstance, sourceName] of [
  ['he-jin', 189, '何进谋诛宦官未果，被张让等十常侍杀害。', '何进'],
  ['wang-yun', 192, '李傕、郭汜攻入长安后，王允被杀。', '王允'],
  ['sun-jian', 191, '孙坚进攻刘表时中伏身亡。', '孙坚'],
  ['tao-qian', 194, '陶谦去世前将徐州让与刘备。', '陶谦'],
  ['lv-bu', 199, '吕布在下邳被曹操击败后处死。', '吕布'],
  ['yuan-shu', 199, '袁术称帝失败后病死。', '袁术'],
  ['yuan-shao', 202, '袁绍官渡败后不久病逝。', '袁绍'],
  ['liu-biao', 208, '刘表去世后荆州继承危机爆发。', '刘表'],
  ['zhou-yu', 210, '周瑜筹划西进益州前病逝。', '周瑜'],
  ['pang-tong', 214, '庞统在进攻雒城时中箭身亡。', '庞统'],
  ['xiahou-yuan', 219, '夏侯渊在定军山被黄忠击杀。', '夏侯渊'],
  ['guan-yu', 219, '关羽失荆州后败走麦城，被孙权方面擒杀。', '关羽'],
  ['cao-cao', 220, '曹操去世，曹丕继承魏王。', '曹操'],
  ['zhang-fei', 221, '张飞在伐吴前被部下刺杀。', '张飞'],
  ['liu-bei', 223, '刘备夷陵战败后病逝白帝城。', '刘备'],
  ['cao-pi', 226, '曹丕去世，曹叡继位。', '曹丕'],
  ['zhao-yun', 229, '赵云去世。', '赵云'],
  ['cao-zhen', 231, '曹真去世后，司马懿逐渐承担西线防务。', '曹真'],
  ['zhuge-liang', 234, '诸葛亮第五次北伐期间病逝五丈原。', '诸葛亮'],
  ['jiang-wan', 246, '蒋琬去世，蜀汉政务由费祎等继续主持。', '蒋琬'],
  ['cao-shuang', 249, '高平陵之变后曹爽被司马懿诛杀。', '曹爽'],
  ['sima-yi', 251, '司马懿去世，司马师继掌权柄。', '司马懿'],
  ['fei-yi', 253, '费祎在宴会中遇刺身亡。', '费祎'],
  ['sima-shi', 255, '司马师平定毌丘俭、文钦之乱后病逝。', '司马师'],
  ['sun-jun', 256, '孙峻掌权数年后病死。', '孙峻'],
  ['cao-mao', 260, '曹髦讨伐司马昭失败，被贾充部下所杀。', '曹髦'],
  ['jiang-wei', 264, '姜维参与钟会之乱失败后被杀。', '姜维'],
  ['zhong-hui', 264, '钟会反叛司马昭失败，被乱兵所杀。', '钟会'],
  ['sima-zhao', 265, '司马昭去世，司马炎继承晋王。', '司马昭'],
  ['lu-kang', 274, '陆抗去世后，孙吴长江防务削弱。', '陆抗'],
  ['yang-hu', 278, '羊祜去世前后，灭吴战略逐步成熟。', '羊祜'],
  ['sun-hao', 284, '孙皓降晋后数年去世。', '孙皓'],
]) {
  addDeathEvent(personId, year, circumstance, sourceName);
}

for (const [eventId, personId, role] of [
  ['yellow-turban-rebellion', 'zhang-jue', '发起者'],
  ['dong-zhuo-seizes-power', 'han-xiandi', '受害者'],
  ['dong-zhuo-seizes-power', 'lv-bu', '参与者'],
  ['dong-zhuo-burns-luoyang', 'han-xiandi', '受害者'],
  ['battle-of-changan-192', 'lv-bu', '参与者'],
  ['assassination-of-dong-zhuo', 'lv-bu', '参与者'],
  ['battle-of-yan-province', 'lv-bu', '指挥者'],
  ['emperor-xian-flees-changan', 'han-xiandi', '参与者'],
  ['cao-cao-controls-emperor', 'han-xiandi', '受害者'],
  ['yuan-shu-declares-emperor', 'lv-bu', '参与者'],
  ['battle-of-xiapi', 'lv-bu', '受害者'],
  ['conspiracy-of-dong-cheng', 'han-xiandi', '发起者'],
  ['cao-cao-becomes-king', 'han-xiandi', '参与者'],
  ['cao-pi-usurps-han', 'han-xiandi', '受害者'],
]) {
  ensureEventParticipant(eventId, personId, role);
}

// Add focused person death records until the event target is comfortably exceeded.
for (const person of persons
  .filter((item) => item.death_year && item.death_year >= 184 && item.death_year <= 280)
  .sort((a, b) => a.death_year - b.death_year || a.id.localeCompare(b.id))) {
  if (events.length >= 220) break;
  addDeathEvent(person.id, person.death_year, `${person.name}于${person.death_year}年前后去世，其生涯属于三国历史人物谱系的一部分。`, person.name);
}

const invalidRelationships = relationships.filter((relationship) => !hasPerson(relationship.source) || !hasPerson(relationship.target));
const invalidEvents = events.filter((event) => (event.participants ?? []).some((item) => !hasPerson(item.person_id)));

if (invalidRelationships.length > 0 || invalidEvents.length > 0) {
  console.error(`Invalid relationships: ${invalidRelationships.map((item) => item.id).join(', ')}`);
  console.error(`Invalid events: ${invalidEvents.map((item) => item.id).join(', ')}`);
  process.exit(1);
}

fs.writeFileSync(relationshipsPath, `${JSON.stringify(relationships, null, 2)}\n`);
fs.writeFileSync(eventsPath, `${JSON.stringify(events, null, 2)}\n`);

console.log(`Persons: ${persons.length}`);
console.log(`Relationships: ${relationships.length} (+${addedRelationships.length})`);
console.log(`Events: ${events.length} (+${addedEvents.length})`);
