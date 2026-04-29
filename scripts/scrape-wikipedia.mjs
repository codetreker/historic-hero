#!/usr/bin/env node
/**
 * scrape-wikipedia.mjs
 *
 * Scrapes Three Kingdoms person data from English Wikipedia A–Z list pages.
 * URL pattern: https://en.wikipedia.org/wiki/List_of_people_of_the_Three_Kingdoms_(X)
 *
 * Outputs new persons (not in data/persons.json) to data/persons-new.json.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── URL list ────────────────────────────────────────────────────────────────
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const BASE = 'https://en.wikipedia.org/wiki/List_of_people_of_the_Three_Kingdoms_';
const urls = LETTERS.map(l => `${BASE}(${l})`);

// ── Allegiance → faction mapping ────────────────────────────────────────────
function mapFaction(allegiance) {
  if (!allegiance) return 'other';
  const a = allegiance.toLowerCase();
  if (/cao wei|cao cao/.test(a)) return 'wei';
  if (/shu han|liu bei/.test(a)) return 'shu';
  if (/eastern wu|sun quan|sun ce|sun jian|sun wu/.test(a)) return 'wu';
  if (/han dynasty|eastern han|han empire/.test(a)) return 'han';
  if (/jin dynasty|jin\b/.test(a)) return 'jin';
  // Some entries list multiple allegiances separated by comma
  // Try individual parts
  const parts = a.split(/[,;]/);
  for (const p of parts) {
    const pt = p.trim();
    if (/cao wei|cao cao/.test(pt)) return 'wei';
    if (/shu han|liu bei/.test(pt)) return 'shu';
    if (/eastern wu|sun quan|sun ce|sun jian/.test(pt)) return 'wu';
    if (/han dynasty|eastern han/.test(pt)) return 'han';
    if (/jin dynasty|jin$/.test(pt)) return 'jin';
  }
  return 'other';
}

// ── Generate kebab-case ID from pinyin name ─────────────────────────────────
function makeId(pinyinName) {
  return pinyinName
    .toLowerCase()
    .replace(/[''ʼ]/g, '')          // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '')   // keep only alphanumeric, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-');
}

// ── Strip HTML tags ─────────────────────────────────────────────────────────
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// ── Parse one table row into a person object ────────────────────────────────
function parseRow(trHtml) {
  // Extract <td> contents (not <th>)
  const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const cells = [];
  let m;
  while ((m = tdPattern.exec(trHtml)) !== null) {
    cells.push(stripHtml(m[1]));
  }

  if (cells.length < 7) return null; // need at least: name, courtesy, birth, death, home, role, allegiance

  // Column mapping (from the Wikipedia table):
  // 0: Name (pinyin\nChinese)
  // 1: Courtesy name
  // 2: Birth year
  // 3: Death year
  // 4: Ancestral home
  // 5: Role
  // 6: Allegiance
  // 7: Previous allegiance(s)  (optional)
  // 8: Notes (optional)

  const nameRaw = cells[0];
  // Split pinyin from Chinese characters
  const nameLines = nameRaw.split('\n').map(s => s.trim()).filter(Boolean);
  const pinyinName = nameLines[0] || '';
  // Chinese name: look for CJK characters
  const chineseName = nameLines.find(l => /[\u4e00-\u9fff]/.test(l)) || '';

  if (!pinyinName) return null;

  const id = makeId(pinyinName);
  if (!id) return null;

  const courtesyRaw = cells[1] || '';
  // Courtesy name may also have pinyin + Chinese
  const courtesyLines = courtesyRaw.split('\n').map(s => s.trim()).filter(Boolean);
  const courtesyChinese = courtesyLines.find(l => /[\u4e00-\u9fff]/.test(l)) || courtesyLines[0] || '';

  const birthYear = parseInt(cells[2], 10) || null;
  const deathYear = parseInt(cells[3], 10) || null;
  const ancestralHome = cells[4] || null;
  const role = cells[5] || '';
  const allegiance = cells[6] || '';
  const notes = cells[8] || '';

  const faction = mapFaction(allegiance);

  // Build roles array from Role cell
  const roles = role
    ? role.split(/[,;/]/).map(r => r.trim().toLowerCase()).filter(Boolean)
    : [];

  return {
    id,
    name: chineseName || pinyinName,
    courtesy_name: courtesyChinese || null,
    title: null,
    faction,
    roles,
    birth_year: birthYear,
    death_year: deathYear,
    birth_place: ancestralHome,
    description: notes || '',
    source_urls: [
      `https://en.wikipedia.org/wiki/${encodeURIComponent(pinyinName.replace(/ /g, '_'))}`
    ],
    _pinyin: pinyinName,
    _allegiance: allegiance
  };
}

// ── Extract all rows from all wikitables in a page ──────────────────────────
function extractPersons(html) {
  const persons = [];
  // Find all wikitable blocks
  const tablePattern = /<table class="wikitable[^"]*"[\s\S]*?<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tablePattern.exec(html)) !== null) {
    const tableHtml = tableMatch[0];
    // Extract all <tr> blocks (skip header rows that contain <th>)
    const trPattern = /<tr>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trPattern.exec(tableHtml)) !== null) {
      const trContent = trMatch[1];
      // Skip header rows
      if (/<th[\s>]/i.test(trContent)) continue;
      const person = parseRow(trMatch[0]);
      if (person) persons.push(person);
    }
  }
  return persons;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // Load existing IDs
  let existingIds = new Set();
  try {
    const raw = await readFile(join(ROOT, 'data/persons.json'), 'utf-8');
    const existing = JSON.parse(raw);
    existingIds = new Set(existing.map(p => p.id));
    console.log(`Loaded ${existingIds.size} existing person IDs`);
  } catch (e) {
    console.warn('Could not load existing persons.json, starting fresh');
  }

  const allNew = [];
  const seenIds = new Set();

  for (const url of urls) {
    const letter = url.match(/\(([A-Z])\)$/)?.[1] || '?';
    try {
      console.log(`Fetching ${letter}...`);
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'HistoricHeroBot/1.0 (scraping Three Kingdoms person list)',
          'Accept': 'text/html'
        }
      });
      if (!resp.ok) {
        console.warn(`  ⚠ ${letter}: HTTP ${resp.status}, skipping`);
        continue;
      }
      const html = await resp.text();
      const persons = extractPersons(html);
      let added = 0;
      for (const p of persons) {
        if (existingIds.has(p.id) || seenIds.has(p.id)) continue;
        seenIds.add(p.id);
        allNew.push(p);
        added++;
      }
      console.log(`  ✓ ${letter}: found ${persons.length} rows, ${added} new`);

      // Be polite — small delay between requests
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`  ✗ ${letter}: ${err.message}, skipping`);
    }
  }

  // Remove internal helper fields before saving
  for (const p of allNew) {
    delete p._pinyin;
    delete p._allegiance;
  }

  const outPath = join(ROOT, 'data/persons-new.json');
  await writeFile(outPath, JSON.stringify(allNew, null, 2) + '\n', 'utf-8');
  console.log(`\nDone! Wrote ${allNew.length} new persons to data/persons-new.json`);

  // Print faction breakdown
  const factionCounts = {};
  for (const p of allNew) {
    factionCounts[p.faction] = (factionCounts[p.faction] || 0) + 1;
  }
  console.log('Faction breakdown:', factionCounts);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
