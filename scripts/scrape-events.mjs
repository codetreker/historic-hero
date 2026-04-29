#!/usr/bin/env node
/**
 * scrape-events.mjs
 * 从英文维基百科 Timeline of the Three Kingdoms period 页面提取事件数据
 * 输出到 data/events-new.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');

const WIKI_URL = 'https://en.wikipedia.org/wiki/Timeline_of_the_Three_Kingdoms_period';
const SOURCE_URLS = [WIKI_URL];

// ── helpers ────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function stripHtml(html) {
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gs, '')       // remove footnotes
    .replace(/<\/?[^>]+>/g, '')                    // strip tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\[\d+\]/g, '')                       // remove [1] refs
    .trim();
}

// ── classify event type ────────────────────────────────────────────

function classifyEvent(text) {
  const t = text.toLowerCase();
  if (/\bbattle\b|siege|campaign|invasion|conquest|attack|defeat|repel|war\b/.test(t)) return 'battle';
  if (/\bdies?\b|\bkill|death|assassinat|execut|murder|massacre/.test(t)) return 'death';
  if (/\brebellion\b|\brebels?\b|\brevolt/.test(t)) return 'rebellion';
  if (/\bemperor\b|\bking\b|\bcrown prince|abdicate|enthrone|proclaim|depos|succeed|regent/.test(t)) return 'succession';
  if (/\bsurrender|\balliance|\benvoy|\btreaty|\btribut|\bpeace/.test(t)) return 'diplomatic';
  if (/\bpolitical|government|system|establish|abolish/.test(t)) return 'political';
  return 'other';
}

// ── translate event to Chinese (basic mapping + template) ──────────

const EN_TO_CN = {
  'Yellow Turban Rebellion': '黄巾之乱',
  'Liang Province rebellion': '凉州之乱',
  'Battle of Guandu': '官渡之战',
  'Battle of Red Cliffs': '赤壁之战',
  'Battle of Changban': '长坂坡之战',
  'Battle of Xiaoting': '夷陵之战',
  'Battle of Fancheng': '樊城之战',
  'Battle of Tong Pass': '潼关之战',
  'Battle of Hefei': '合肥之战',
  'Battle of Xingshi': '兴势之战',
  'Battle of Wuzhang Plains': '五丈原之战',
  'Battle of Dongxing': '东兴之战',
  'Battle of Xiling': '西陵之战',
  'Battle of Shiting': '石亭之战',
  'Battle of White Wolf Mountain': '白狼山之战',
  'Battle of Mount Dingjun': '定军山之战',
  'Battle of Xiapi': '下邳之战',
  'Battle of Yijing': '易京之战',
  'Battle of Bowang': '博望之战',
  'Battle of Jiangxia': '江夏之战',
  'Battle of Xingyang': '荥阳之战',
  'Battle of Yangcheng': '阳城之战',
  'Battle of Xiangyang': '襄阳之战',
  "Battle of Chang'an": '长安之战',
  'Battle of Quebei': '芍陂之战',
  'Battle of Didao': '狄道之战',
  'Conquest of Shu by Wei': '魏灭蜀之战',
  'Conquest of Wu by Jin': '晋灭吴之战',
  "Zhuge Liang's Northern Expeditions": '诸葛亮北伐',
  "Zhuge Liang's Southern Campaign": '诸葛亮南征',
  "Jiang Wei's Northern Expeditions": '姜维北伐',
  "Lü Meng's invasion of Jing Province": '吕蒙袭荆州',
  "Liu Bei's takeover of Yi Province": '刘备入蜀',
  "Cao Pi's invasions of Eastern Wu": '曹丕伐吴',
  "Sun Ce's conquests in Jiangdong": '孙策平定江东',
  'Incident at the Gaoping Tombs': '高平陵之变',
  "Zhong Hui's Rebellion": '钟会之乱',
  'Three Rebellions in Shouchun': '寿春三叛',
  'Xincheng Rebellion': '新城之叛',
  'Campaign against Dong Zhuo': '讨伐董卓',
  'Ziwu Campaign': '子午谷之战',
  "Sima Yi's Liaodong campaign": '司马懿征辽东',
  "Sima Zhao's Regicide": '司马昭弑君',
  'Jiao Province Campaign': '交州之战',
  "Tufa Shujineng's Rebellion": '秃发树机能之乱',
  'Goguryeo–Wei War': '魏征高句丽',
  'Campaign against Yuan Shu': '讨伐袁术',
  "Cao Cao's invasion of Xu Province": '曹操征徐州',
  'Incident at Guangling': '广陵之役',
  'Siege of Yong\'an': '永安之围',
  'Ten Eunuchs': '十常侍之乱',
};

// Person name mapping: English name → person_id
// We build this from persons.json
function buildPersonIndex(persons) {
  const index = new Map(); // lowercase name → person_id

  for (const p of persons) {
    // Chinese name
    if (p.name) index.set(p.name, p.id);
    // ID as-is (e.g. "cao-cao")
    index.set(p.id, p.id);

    // Build English name from id: cao-cao → Cao Cao
    const engName = p.id
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    index.set(engName.toLowerCase(), p.id);
  }

  return index;
}

function findParticipants(text, personIndex) {
  const found = new Map();
  const lowerText = text.toLowerCase();

  // Try matching longer names first (avoid "Sun" matching before "Sun Quan")
  const names = [...personIndex.keys()].sort((a, b) => b.length - a.length);

  for (const name of names) {
    if (name.length < 3) continue; // skip very short names to avoid false matches
    const lName = name.toLowerCase();
    if (lowerText.includes(lName)) {
      const personId = personIndex.get(name);
      if (!found.has(personId)) {
        found.set(personId, { person_id: personId, role: '参与者' });
      }
    }
  }

  return [...found.values()];
}

function translateEventName(engText) {
  // Try to match known event names
  for (const [eng, cn] of Object.entries(EN_TO_CN)) {
    if (engText.includes(eng)) return cn;
  }
  // Fallback: simple template-based translation
  return translateBasic(engText);
}

function translateBasic(text) {
  // Extract the main subject before ":"
  const colonIdx = text.indexOf(':');
  const mainPart = colonIdx > 0 ? text.slice(0, colonIdx).trim() : text;

  // Battle of X
  const battleMatch = mainPart.match(/Battle of (.+)/);
  if (battleMatch) return `${battleMatch[1]}之战`;

  // Siege of X
  const siegeMatch = mainPart.match(/Siege of (.+)/);
  if (siegeMatch) return `${siegeMatch[1]}之围`;

  // X dies
  if (/dies/.test(text)) {
    const whoMatch = text.match(/^(.+?)\s+dies/);
    if (whoMatch) return `${whoMatch[1]}去世`;
  }

  // X is killed / assassinated
  if (/killed|assassinated|executed/.test(text)) {
    const whoMatch = text.match(/^(.+?)\s+(?:is\s+)?(?:killed|assassinated|executed)/);
    if (whoMatch) return `${whoMatch[1]}被杀`;
  }

  return mainPart;
}

function translateDescription(text) {
  // For the description, we do a basic Chinese summary
  // In production this would use an LLM; here we provide the English with a Chinese prefix
  // But let's do some common translations
  const desc = text.replace(/\[\d+\]/g, '').trim();
  return desc; // Keep English for now, the existing events have Chinese descriptions
  // We'll provide a minimal Chinese wrapper
}

// Better Chinese description generation
function generateChineseDesc(year, eventText) {
  const clean = eventText.replace(/\[\d+\]/g, '').trim();

  // Known event descriptions (manual translations for key events)
  const knownDescs = {
    'imperial palace is damaged by fire': `${year}年，帝宫被火灾损毁，朝廷征收特别税进行重建。`,
    'Governors are appointed to unify': `${year}年，朝廷任命州牧统一各州行政管理。`,
    'Emperor Ling of Han dies': `${year}年，汉灵帝驾崩，何皇后与其兄何进拥立刘辩并建立摄政政府。`,
    'Coalition breaks up': `${year}年，讨董联盟瓦解，各地官员割据自立。`,
    'Han dynasty scholar Cai Yong dies': `${year}年，东汉学者蔡邕去世。`,
    'Nine-rank system is implemented': `${year}年，九品中正制开始实施。`,
    'Zhuge Liang presents the Chu Shi Biao': `${year}年，诸葛亮向刘禅上《出师表》。`,
    'Zhuge Liang invents the wooden ox': `${year}年，诸葛亮发明木牛流马。`,
    'Cao Zhi dies': `${year}年，曹魏诗人曹植去世。`,
    'Emperor Xian of Han dies': `${year}年，汉献帝刘协去世。`,
    'Zheng Xuan dies': `${year}年，经学大师郑玄去世。`,
    'Yuan Shu dies': `${year}年，袁术去世。`,
    'south-pointing chariot': `${year}年，曹魏机械工程师马钧发明指南车。`,
    'Kebineng': `${year}年，曹魏刺杀鲜卑首领轲比能。`,
    'Shi Xie dies': `${year}年，交州军阀士燮去世，孙权将交州部分地区设为广州。`,
    'Xuanxue': `${year}年，曹魏正始年间（240-249），玄学、清谈等哲学运动兴起，竹林七贤活跃于此时期。`,
    'Sun Deng': `${year}年，孙权太子孙登去世。`,
    'Sun He becomes Crown Prince': `${year}年，孙和被立为东吴太子，与孙霸争位，吴廷分裂为两派。`,
    'Lu Xun dies': `${year}年，东吴丞相陆逊去世。`,
    'Baekje attacks': `${year}年，百济进攻曹魏乐浪、带方二郡，后求和。`,
    'Wang Bi dies': `${year}年，曹魏哲学家王弼去世。`,
    'Sun Quan exiles Sun He': `${year}年，孙权流放孙和、赐死孙霸，立孙亮为太子。`,
    'Great General': `${year}年，司马师获封大将军。`,
    'Zhuge Ke assumes regency': `${year}年，孙权去世，孙亮继位，诸葛恪摄政。`,
    'Fei Yi is assassinated': `${year}年，费祎被刺杀，姜维继任。`,
    'Wang Su dies': `${year}年，曹魏学者王肃去世。`,
    'Chen Zhi dies': `${year}年，陈祗去世，其盟友宦官黄皓开始把持蜀汉朝政。`,
    'Sun Xiu kills Sun Chen': `${year}年，孙休诛杀孙綝。`,
    'Sima Zhao kills Cao Mao': `${year}年，司马昭弑杀曹髦，改立曹奂。`,
    'Sun Liang dies': `${year}年，孙亮去世。`,
    'Tuoba Liwei': `${year}年，拓跋鲜卑首领拓跋力微归附曹魏。`,
    'Ji Kang': `${year}年，司马昭杀嵇康（竹林七贤之一）。`,
    'Cao Wei establishes Liangzhou': `${year}年，曹魏设立梁州。`,
    'Guangzhou': `${year}年，东吴重新设立广州。`,
    'Sun Xiu dies': `${year}年，孙休去世，孙皓继位。`,
    'Sima Zhao dies': `${year}年，司马昭去世，司马炎继位。`,
    'Sima Yan deposes Cao Huan': `${year}年，司马炎废曹奂，建立西晋，曹魏灭亡。`,
    'Qiao Zhou dies': `${year}年，蜀汉学者谯周去世。`,
    'Liu Shan dies': `${year}年，蜀后主刘禅去世。`,
    'Xiongnu rebellion in Bingzhou': `${year}年，西晋平定并州匈奴叛乱。`,
    'Cao Fang dies': `${year}年，曹芳去世。`,
    'Tufa Shujineng surrenders': `${year}年，秃发树机能投降西晋。`,
    'Tufa Shujineng rebels again': `${year}年，秃发树机能再次叛乱。`,
    'Himiko': `${year}年，曹魏接待倭国卑弥呼使者。`,
  };

  for (const [key, desc] of Object.entries(knownDescs)) {
    if (clean.includes(key)) return desc;
  }

  // Generic fallback: provide year + sanitized English text
  return `${year}年，${clean}`;
}

// ── extract location from event text ───────────────────────────────

function extractLocation(text) {
  // Known location patterns
  const locPatterns = [
    /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /in\s+(Jing\s+Province|Yi\s+Province|Yan\s+Province|You\s+Province|Liang\s+Province)/i,
    /in\s+(Luoyang|Chang'an|Xuchang|Chengdu|Jianye|Nanjing|Shouchun)/i,
    /(?:near|present-day)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
  ];

  const locationMap = {
    'luoyang': '洛阳', "chang'an": '长安', 'xuchang': '许昌', 'chengdu': '成都',
    'jianye': '建业', 'nanjing': '南京', 'shouchun': '寿春', 'guandu': '官渡',
    'chibi': '赤壁', 'changban': '长坂', 'xiaoting': '夷陵', 'fancheng': '樊城',
    'tong pass': '潼关', 'hefei': '合肥', 'xingshi': '兴势', 'wuzhang': '五丈原',
    'dongxing': '东兴', 'xiling': '西陵', 'shiting': '石亭', 'xiapi': '下邳',
    'yijing': '易京', 'bowang': '博望', 'jiangxia': '江夏', 'xingyang': '荥阳',
    'yangcheng': '阳城', 'xiangyang': '襄阳', 'dingjun': '定军山',
    'white wolf mountain': '白狼山', 'hanzhong': '汉中', 'nanzhong': '南中',
    'quebei': '芍陂', 'didao': '狄道', 'yangping': '阳平',
    'jing province': '荆州', 'yi province': '益州', 'yan province': '兖州',
    'you province': '幽州', 'liang province': '凉州', 'jiaozhou': '交州',
    'guangling': '广陵', "yong'an": '永安', 'liaodong': '辽东',
    'qinzhou': '秦州', 'liangzhou': '梁州', 'bingzhou': '并州',
    'danyang': '丹阳',
  };

  const lower = text.toLowerCase();
  for (const [eng, cn] of Object.entries(locationMap)) {
    if (lower.includes(eng)) return cn;
  }

  return null;
}

// ── parse the Wikipedia HTML ───────────────────────────────────────

function parseTimelineHtml(html) {
  const events = [];

  // The timeline is in wikitable format: <table class="wikitable">
  // Each row has: <td>Year</td> <td>Date</td> <td>Event</td>
  // Year cell may span multiple rows via rowspan

  // Extract all wikitable tables
  const tableRegex = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;

  let currentYear = null;
  let yearRowsRemaining = 0;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];

    // Extract rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];

      // Skip header rows
      if (/<th/i.test(rowHtml)) continue;

      // Extract all <td> cells
      const cells = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
        cells.push(tdMatch);
      }

      if (cells.length === 0) continue;

      let eventText = '';
      let dateText = '';

      if (yearRowsRemaining > 0) {
        // Year cell is from previous row (rowspan)
        yearRowsRemaining--;
        if (cells.length >= 2) {
          dateText = stripHtml(cells[0][1]);
          eventText = stripHtml(cells[1][1]);
        } else if (cells.length === 1) {
          eventText = stripHtml(cells[0][1]);
        }
      } else {
        // First cell might be year
        const firstCellFull = cells[0][0]; // full <td...>content</td>
        const rowspanMatch = firstCellFull.match(/rowspan="?(\d+)"?/i);
        const yearCandidate = stripHtml(cells[0][1]);

        if (/^\d{3,4}$/.test(yearCandidate.trim())) {
          currentYear = parseInt(yearCandidate.trim());
          if (rowspanMatch) {
            yearRowsRemaining = parseInt(rowspanMatch[1]) - 1;
          }

          if (cells.length >= 3) {
            dateText = stripHtml(cells[1][1]);
            eventText = stripHtml(cells[2][1]);
          } else if (cells.length === 2) {
            eventText = stripHtml(cells[1][1]);
          }
        } else {
          // Not a year, treat as continuation
          if (cells.length >= 2) {
            dateText = stripHtml(cells[0][1]);
            eventText = stripHtml(cells[1][1]);
          } else {
            eventText = stripHtml(cells[0][1]);
          }
        }
      }

      if (!eventText || !currentYear) continue;
      if (eventText.length < 5) continue; // skip empty/trivial

      events.push({
        year: currentYear,
        date: dateText || null,
        text: eventText,
      });
    }
  }

  return events;
}

// ── main ───────────────────────────────────────────────────────────

async function main() {
  console.log('📥 Fetching Wikipedia Timeline of the Three Kingdoms...');

  const res = await fetch(WIKI_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const html = await res.text();
  console.log(`   HTML fetched: ${(html.length / 1024).toFixed(0)} KB`);

  // Parse the timeline
  const rawEvents = parseTimelineHtml(html);
  console.log(`📋 Parsed ${rawEvents.length} raw event entries from HTML`);

  // Load existing events
  const existingEventsPath = resolve(DATA_DIR, 'events.json');
  const existingEvents = JSON.parse(readFileSync(existingEventsPath, 'utf-8'));
  const existingIds = new Set(existingEvents.map(e => e.id));
  console.log(`📦 Existing events: ${existingEvents.length} (will skip duplicates)`);

  // Load persons for participant matching
  const personsPath = resolve(DATA_DIR, 'persons.json');
  const persons = JSON.parse(readFileSync(personsPath, 'utf-8'));
  const personIndex = buildPersonIndex(persons);
  console.log(`👥 Loaded ${persons.length} persons for participant matching`);

  // Generate new events
  const newEvents = [];
  const seenIds = new Set();

  for (const raw of rawEvents) {
    const slug = slugify(raw.text.slice(0, 80));
    let eventId = `event-${raw.year}-${slug}`;

    // Deduplicate within this batch
    if (seenIds.has(eventId)) {
      eventId = `${eventId}-2`;
    }
    if (seenIds.has(eventId) || existingIds.has(eventId)) {
      continue;
    }
    seenIds.add(eventId);

    const name = translateEventName(raw.text);
    const type = classifyEvent(raw.text);
    const location = extractLocation(raw.text);
    const participants = findParticipants(raw.text, personIndex);
    const description = generateChineseDesc(raw.year, raw.text);

    // Extract result if there's a clear outcome mentioned
    let result = null;
    if (/defeated|repelled|surrenders|killed|dies|ends|succeeded/.test(raw.text.toLowerCase())) {
      // Try to extract a brief result
      const resultPatterns = [
        /;\s*so ends (.+?)\.?$/i,
        /but (?:is |are )?(.+?)\.?$/i,
      ];
      for (const p of resultPatterns) {
        const m = raw.text.match(p);
        if (m) { result = m[0].replace(/^;\s*/, '').replace(/^\s*but\s+/, ''); break; }
      }
    }

    newEvents.push({
      id: eventId,
      name,
      year: raw.year,
      end_year: null,
      location,
      type,
      description,
      participants,
      result,
      source_urls: SOURCE_URLS,
    });
  }

  // Write output
  const outputPath = resolve(DATA_DIR, 'events-new.json');
  writeFileSync(outputPath, JSON.stringify(newEvents, null, 2), 'utf-8');

  console.log(`\n✅ Generated ${newEvents.length} new events → data/events-new.json`);
  console.log(`   (Skipped events already in events.json)`);

  // Summary by type
  const typeCounts = {};
  for (const e of newEvents) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }
  console.log('\n📊 Event types:');
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${type}: ${count}`);
  }

  // Show year range
  if (newEvents.length > 0) {
    const years = newEvents.map(e => e.year);
    console.log(`\n📅 Year range: ${Math.min(...years)} – ${Math.max(...years)}`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
