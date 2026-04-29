#!/usr/bin/env node
/**
 * scrape-relations.mjs
 * 
 * Scrapes English Wikipedia pages for Three Kingdoms figures
 * to extract family relationships from infoboxes and Family sections.
 *
 * Usage: node scripts/scrape-relations.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');

// ─── Config ────────────────────────────────────────────────────────────────────
const TOP_N = 100;
const FETCH_DELAY_MS = 2000;
const MAX_RELATIONS_PER_PERSON = 10;
const SAVE_EVERY = 10;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Strip HTML tags */
function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract Wikipedia link paths from HTML fragment.
 * Returns unique paths (e.g. "Cao_Pi").
 */
function extractWikiLinkPaths(html) {
  const paths = [];
  const seen = new Set();
  const re = /<a\s+[^>]*href="\/wiki\/([^"#]+)"[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const path = decodeURIComponent(m[1]);
    // Skip special/meta pages
    if (path.includes(':')) continue;
    if (!seen.has(path)) {
      seen.add(path);
      paths.push(path);
    }
  }
  return paths;
}

/**
 * Parse ALL infobox-label → infobox-data rows from the ENTIRE page.
 * This avoids nested table issues with regex-based infobox extraction.
 */
function parseInfoboxRows(html) {
  const result = {};
  // Match th.infobox-label followed by td.infobox-data
  const rowRe = /<th[^>]*class="infobox-label"[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*class="infobox-data"[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const label = stripTags(m[1]).toLowerCase().trim();
    const valueHtml = m[2];
    // Only keep first occurrence of each label
    if (!result[label]) {
      result[label] = valueHtml;
    }
  }
  return result;
}

/**
 * Extract the Family section content (between <h2 id="Family"> and next <h2>).
 */
function extractFamilySection(html) {
  const idx = html.indexOf('id="Family"');
  if (idx === -1) return '';
  const afterH2 = html.indexOf('</h2>', idx);
  if (afterH2 === -1) return '';
  const start = afterH2 + 5;
  
  // Find next h2 section
  let end = html.length;
  const nextHeading = html.indexOf('<div class="mw-heading mw-heading2">', start);
  const nextH2 = html.indexOf('<h2', start);
  if (nextHeading !== -1) end = Math.min(end, nextHeading);
  if (nextH2 !== -1) end = Math.min(end, nextH2);
  
  return html.substring(start, end);
}

/**
 * Extract sub-sections within the Family section.
 * Returns { "wives": html, "sons": html, ... }
 */
function extractFamilySubsections(familyHtml) {
  const subs = {};
  // Match h3 headings
  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let m;
  const headings = [];
  while ((m = h3Re.exec(familyHtml)) !== null) {
    headings.push({ label: stripTags(m[1]).toLowerCase().trim(), idx: m.index + m[0].length });
  }
  
  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].idx;
    const end = i + 1 < headings.length ? headings[i + 1].idx - 100 : familyHtml.length;
    subs[headings[i].label] = familyHtml.substring(start, end);
  }
  
  return subs;
}

/**
 * Build Wikipedia path → person ID map.
 */
function buildWikiToIdMap(persons) {
  const map = new Map();
  for (const p of persons) {
    for (const url of (p.source_urls || [])) {
      const m = url.match(/wikipedia\.org\/wiki\/(.+)/);
      if (m) {
        const path = decodeURIComponent(m[1]);
        map.set(path, p.id);
        // Without parenthetical disambiguation
        const noParens = path.replace(/\s*\([^)]*\)\s*$/, '');
        if (noParens !== path && !map.has(noParens)) {
          map.set(noParens, p.id);
        }
      }
    }
  }
  return map;
}

/** Build set of existing relation keys for dedup */
function buildExistingRelKeys(rels) {
  const keys = new Set();
  for (const r of rels) {
    keys.add(`${r.source}|${r.target}|${r.type}`);
    if (r.bidirectional) keys.add(`${r.target}|${r.source}|${r.type}`);
  }
  return keys;
}

/** Resolve a Wikipedia path to a person ID */
function resolvePersonId(wikiPath, wikiToId) {
  if (wikiToId.has(wikiPath)) return wikiToId.get(wikiPath);
  const noParens = wikiPath.replace(/\s*\([^)]*\)\s*$/, '');
  if (noParens !== wikiPath && wikiToId.has(noParens)) return wikiToId.get(noParens);
  const decoded = decodeURIComponent(wikiPath);
  if (decoded !== wikiPath && wikiToId.has(decoded)) return wikiToId.get(decoded);
  return null;
}

/**
 * Check if any family-type relation already exists between two persons.
 */
function hasFamilyRelation(a, b, existingKeys) {
  const types = ['father-son', 'mother-son', 'husband-wife', 'brothers', 'siblings', 'in-law'];
  return types.some(t =>
    existingKeys.has(`${a}|${b}|${t}`) || existingKeys.has(`${b}|${a}|${t}`)
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📖 Loading data files...');
  const persons = JSON.parse(readFileSync(resolve(DATA_DIR, 'persons.json'), 'utf8'));
  const existingRels = JSON.parse(readFileSync(resolve(DATA_DIR, 'relationships.json'), 'utf8'));
  console.log(`  Persons: ${persons.length}, Existing relations: ${existingRels.length}`);

  const personById = new Map(persons.map(p => [p.id, p]));
  const wikiToId = buildWikiToIdMap(persons);
  const existingKeys = buildExistingRelKeys(existingRels);
  console.log(`  Wiki→ID mappings: ${wikiToId.size}`);

  // Importance scoring
  const relCount = {};
  existingRels.forEach(r => {
    relCount[r.source] = (relCount[r.source] || 0) + 1;
    relCount[r.target] = (relCount[r.target] || 0) + 1;
  });
  const roleWeights = {
    emperor: 50, warlord: 40, regent: 30, strategist: 25,
    general: 20, politician: 15, scholar: 10, official: 5, poet: 5,
  };

  const candidates = persons
    .filter(p => p.source_urls?.some(u => u.includes('wikipedia.org/wiki/')))
    .map(p => {
      const roleScore = (p.roles || []).reduce((s, r) => s + (roleWeights[r] || 0), 0);
      const wikiUrl = p.source_urls.find(u => u.includes('wikipedia.org/wiki/'));
      return { id: p.id, name: p.name, score: (relCount[p.id] || 0) + roleScore, wikiUrl };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);

  console.log(`\n🎯 Processing top ${candidates.length} persons (score ${candidates[0]?.score} → ${candidates[candidates.length - 1]?.score})`);

  const newRelations = [];
  let totalSkipped = 0;
  let totalErrors = 0;

  /** Try to add a new relation; returns true if added */
  function tryAddRelation(src, tgt, type, label, desc, bidir, wikiUrl) {
    if (src === tgt) return false;
    if (!personById.has(src) || !personById.has(tgt)) return false;
    
    const key = `${src}|${tgt}|${type}`;
    if (existingKeys.has(key)) { totalSkipped++; return false; }
    // For bidirectional, also check reverse
    if (bidir && existingKeys.has(`${tgt}|${src}|${type}`)) { totalSkipped++; return false; }

    const rel = {
      id: `wiki-${src}-${tgt}-${type}`,
      source: src,
      target: tgt,
      type,
      label,
      description: desc,
      bidirectional: bidir,
      source_urls: [wikiUrl],
    };
    newRelations.push(rel);
    existingKeys.add(key);
    if (bidir) existingKeys.add(`${tgt}|${src}|${type}`);
    return true;
  }

  for (let i = 0; i < candidates.length; i++) {
    const person = candidates[i];
    console.log(`\n[${i + 1}/${candidates.length}] ${person.name} (${person.id}) score=${person.score}`);

    try {
      const resp = await fetch(person.wikiUrl, {
        headers: {
          'User-Agent': 'HistoricHeroBot/1.0 (research; Three Kingdoms family relations)',
          'Accept': 'text/html',
        },
      });

      if (!resp.ok) {
        console.log(`  ⚠️ HTTP ${resp.status} - skipping`);
        totalErrors++;
        // Don't continue - fall through to save checkpoint
      } else {

      const html = await resp.text();
      console.log(`  📄 Fetched ${(html.length / 1024).toFixed(0)}KB`);

      const infobox = parseInfoboxRows(html);
      let pRelCount = 0;

      // ── Infobox: Father ──
      if (infobox['father'] && pRelCount < MAX_RELATIONS_PER_PERSON) {
        for (const path of extractWikiLinkPaths(infobox['father'])) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const fid = resolvePersonId(path, wikiToId);
          if (fid && tryAddRelation(fid, person.id, 'father-son', '父子',
            `${personById.get(fid)?.name || fid}为${person.name}之父`, false, person.wikiUrl)) {
            pRelCount++;
            console.log(`  ✅ father-son (infobox): ${fid} → ${person.id}`);
          }
        }
      }

      // ── Infobox: Mother ──
      if (infobox['mother'] && pRelCount < MAX_RELATIONS_PER_PERSON) {
        for (const path of extractWikiLinkPaths(infobox['mother'])) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const mid = resolvePersonId(path, wikiToId);
          if (mid && tryAddRelation(mid, person.id, 'mother-son', '母子',
            `${personById.get(mid)?.name || mid}为${person.name}之母`, false, person.wikiUrl)) {
            pRelCount++;
            console.log(`  ✅ mother-son (infobox): ${mid} → ${person.id}`);
          }
        }
      }

      // ── Infobox: Parents (combined) ──
      if (infobox['parents'] && pRelCount < MAX_RELATIONS_PER_PERSON) {
        for (const path of extractWikiLinkPaths(infobox['parents'])) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const pid = resolvePersonId(path, wikiToId);
          if (!pid || pid === person.id) continue;
          // Determine if father or mother based on the person data
          const parentPerson = personById.get(pid);
          const isFemale = parentPerson?.roles?.includes('empress') || parentPerson?.roles?.includes('consort');
          const type = isFemale ? 'mother-son' : 'father-son';
          const label = isFemale ? '母子' : '父子';
          if (tryAddRelation(pid, person.id, type, label,
            `${parentPerson?.name || pid}为${person.name}之${isFemale ? '母' : '父'}`, false, person.wikiUrl)) {
            pRelCount++;
            console.log(`  ✅ ${type} (infobox parents): ${pid} → ${person.id}`);
          }
        }
      }

      // ── Infobox: Parent (singular) ──
      if (infobox['parent'] && pRelCount < MAX_RELATIONS_PER_PERSON) {
        for (const path of extractWikiLinkPaths(infobox['parent'])) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const pid = resolvePersonId(path, wikiToId);
          if (pid && tryAddRelation(pid, person.id, 'father-son', '父子',
            `${personById.get(pid)?.name || pid}为${person.name}之父`, false, person.wikiUrl)) {
            pRelCount++;
            console.log(`  ✅ father-son (infobox parent): ${pid} → ${person.id}`);
          }
        }
      }

      // ── Infobox: Spouse / Consorts ──
      const spouseFields = ['spouse', 'spouse(s)', 'spouses', 'consort', 'consorts',
                            'queen consort', 'domestic partners'];
      for (const sf of spouseFields) {
        if (!infobox[sf] || pRelCount >= MAX_RELATIONS_PER_PERSON) continue;
        for (const path of extractWikiLinkPaths(infobox[sf])) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const sid = resolvePersonId(path, wikiToId);
          if (!sid || sid === person.id) continue;
          const [s, t] = [person.id, sid].sort();
          if (tryAddRelation(s, t, 'husband-wife', '夫妻',
            `${personById.get(s)?.name || s}与${personById.get(t)?.name || t}为夫妻`, true, person.wikiUrl)) {
            pRelCount++;
            console.log(`  ✅ husband-wife (infobox): ${s} ↔ ${t}`);
          }
        }
      }

      // ── Infobox: Issue / Children ──
      const childFields = ['issue', 'children'];
      for (const cf of childFields) {
        if (!infobox[cf] || pRelCount >= MAX_RELATIONS_PER_PERSON) continue;
        // Filter out self-referencing links (like "#Family")
        for (const path of extractWikiLinkPaths(infobox[cf])) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const cid = resolvePersonId(path, wikiToId);
          if (!cid || cid === person.id) continue;
          // Check that the child isn't actually a parent (sanity check via birth year)
          const childPerson = personById.get(cid);
          const personData = personById.get(person.id);
          if (childPerson?.birth_year && personData?.birth_year && 
              childPerson.birth_year < personData.birth_year) continue;
          if (tryAddRelation(person.id, cid, 'father-son', '父子',
            `${person.name}之子${childPerson?.name || cid}`, false, person.wikiUrl)) {
            pRelCount++;
            console.log(`  ✅ father-son (infobox child): ${person.id} → ${cid}`);
          }
        }
      }

      // ── Infobox: "issue(among others)" and similar compound labels ──
      for (const [label, val] of Object.entries(infobox)) {
        if (!label.startsWith('issue') || label === 'issue') continue;
        if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
        for (const path of extractWikiLinkPaths(val)) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const cid = resolvePersonId(path, wikiToId);
          if (!cid || cid === person.id) continue;
          const childPerson = personById.get(cid);
          const personData = personById.get(person.id);
          if (childPerson?.birth_year && personData?.birth_year && 
              childPerson.birth_year < personData.birth_year) continue;
          // Skip links that just point to section headers (e.g. "Cao_Wei_family_trees")
          if (path.includes('family_tree')) continue;
          if (tryAddRelation(person.id, cid, 'father-son', '父子',
            `${person.name}之子${childPerson?.name || cid}`, false, person.wikiUrl)) {
            pRelCount++;
            console.log(`  ✅ father-son (infobox issue+): ${person.id} → ${cid}`);
          }
        }
      }

      // ── Infobox: Allegiance → lord-vassal ──
      if (infobox['allegiance'] && pRelCount < MAX_RELATIONS_PER_PERSON) {
        for (const path of extractWikiLinkPaths(infobox['allegiance'])) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const lordId = resolvePersonId(path, wikiToId);
          if (!lordId || lordId === person.id) continue;
          if (tryAddRelation(lordId, person.id, 'lord-vassal', '君臣',
            `${person.name}效忠于${personById.get(lordId)?.name || lordId}`, false, person.wikiUrl)) {
            pRelCount++;
            console.log(`  ✅ lord-vassal (infobox): ${lordId} → ${person.id}`);
          }
        }
      }

      // ── Family Section: structured sub-sections ──
      const familyHtml = extractFamilySection(html);
      if (familyHtml && pRelCount < MAX_RELATIONS_PER_PERSON) {
        const subs = extractFamilySubsections(familyHtml);
        
        // Process "Wives" / "Consorts" subsections
        for (const [subLabel, subHtml] of Object.entries(subs)) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          if (/\b(wiv|wife|consort|spouse)\b/i.test(subLabel)) {
            for (const path of extractWikiLinkPaths(subHtml)) {
              if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
              const sid = resolvePersonId(path, wikiToId);
              if (!sid || sid === person.id) continue;
              const [s, t] = [person.id, sid].sort();
              if (tryAddRelation(s, t, 'husband-wife', '夫妻',
                `${personById.get(s)?.name || s}与${personById.get(t)?.name || t}为夫妻`, true, person.wikiUrl)) {
                pRelCount++;
                console.log(`  ✅ husband-wife (family sub): ${s} ↔ ${t}`);
              }
            }
          }
          // Process "Sons" / "Daughters" / "Children" subsections
          if (/\b(son|daughter|child|heir)\b/i.test(subLabel)) {
            for (const path of extractWikiLinkPaths(subHtml)) {
              if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
              const cid = resolvePersonId(path, wikiToId);
              if (!cid || cid === person.id) continue;
              const cp = personById.get(cid);
              const pp = personById.get(person.id);
              if (cp?.birth_year && pp?.birth_year && cp.birth_year < pp.birth_year) continue;
              if (tryAddRelation(person.id, cid, 'father-son', '父子',
                `${person.name}之子女${cp?.name || cid}`, false, person.wikiUrl)) {
                pRelCount++;
                console.log(`  ✅ father-son (family sub): ${person.id} → ${cid}`);
              }
            }
          }
        }

        // ── Family section: look for structured lists with clear relationship labels ──
        // Parse <li> items that explicitly state relationships
        const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let liMatch;
        while ((liMatch = liRe.exec(familyHtml)) !== null) {
          if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
          const liHtml = liMatch[1];
          const liText = stripTags(liHtml).toLowerCase();
          const liLinks = extractWikiLinkPaths(liHtml);
          
          if (liLinks.length === 0) continue;
          
          // Only process list items with clear relationship keywords
          for (const path of liLinks) {
            if (pRelCount >= MAX_RELATIONS_PER_PERSON) break;
            const rid = resolvePersonId(path, wikiToId);
            if (!rid || rid === person.id) continue;
            if (hasFamilyRelation(person.id, rid, existingKeys)) continue;
            
            const rp = personById.get(rid);
            
            // Father patterns: "father: X", "X, his father"
            if (/\bfather\b/.test(liText) && !(/\bfather-in-law\b/.test(liText))) {
              if (tryAddRelation(rid, person.id, 'father-son', '父子',
                `${rp?.name || rid}为${person.name}之父`, false, person.wikiUrl)) {
                pRelCount++;
                console.log(`  ✅ father-son (family li): ${rid} → ${person.id}`);
              }
            }
            // Mother patterns
            else if (/\bmother\b/.test(liText) && !(/\bmother-in-law\b/.test(liText))) {
              if (tryAddRelation(rid, person.id, 'mother-son', '母子',
                `${rp?.name || rid}为${person.name}之母`, false, person.wikiUrl)) {
                pRelCount++;
                console.log(`  ✅ mother-son (family li): ${rid} → ${person.id}`);
              }
            }
            // Wife/spouse patterns
            else if (/\b(wife|wives|spouse|consort|married|concubine)\b/.test(liText)) {
              const [s, t] = [person.id, rid].sort();
              if (tryAddRelation(s, t, 'husband-wife', '夫妻',
                `${personById.get(s)?.name || s}与${personById.get(t)?.name || t}为夫妻`, true, person.wikiUrl)) {
                pRelCount++;
                console.log(`  ✅ husband-wife (family li): ${s} ↔ ${t}`);
              }
            }
            // Son/daughter patterns - must be clearly stated
            else if (/\b(eldest son|second son|third son|youngest son|son,|sons:|daughter)\b/.test(liText)) {
              const cp = personById.get(rid);
              const pp = personById.get(person.id);
              if (cp?.birth_year && pp?.birth_year && cp.birth_year < pp.birth_year) continue;
              if (tryAddRelation(person.id, rid, 'father-son', '父子',
                `${person.name}之子女${cp?.name || rid}`, false, person.wikiUrl)) {
                pRelCount++;
                console.log(`  ✅ father-son (family li): ${person.id} → ${rid}`);
              }
            }
            // Brother/sister patterns
            else if (/\b(brother|sister|sibling|half-brother|half-sister)\b/.test(liText)) {
              const [s, t] = [person.id, rid].sort();
              if (tryAddRelation(s, t, 'brothers', '兄弟',
                `${personById.get(s)?.name || s}与${personById.get(t)?.name || t}为兄弟`, true, person.wikiUrl)) {
                pRelCount++;
                console.log(`  ✅ brothers (family li): ${s} ↔ ${t}`);
              }
            }
          }
        }
      }

      console.log(`  📊 ${pRelCount} new relations from this page`);

      } // end else (resp.ok)
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      totalErrors++;
    }

    // Save progress
    if ((i + 1) % SAVE_EVERY === 0 || i === candidates.length - 1) {
      const outPath = resolve(DATA_DIR, 'relationships-new.json');
      writeFileSync(outPath, JSON.stringify(newRelations, null, 2), 'utf8');
      console.log(`\n💾 Saved ${newRelations.length} new relations to relationships-new.json`);
    }

    if (i < candidates.length - 1) await sleep(FETCH_DELAY_MS);
  }

  // Post-process: remove obviously wrong relations
  console.log('\n🔍 Post-processing: removing obviously wrong relations...');
  let removed = 0;
  const filtered = newRelations.filter(r => {
    const src = personById.get(r.source);
    const tgt = personById.get(r.target);
    
    // father-son: parent died before child was born (with 1-year tolerance)
    if (r.type === 'father-son') {
      if (src?.death_year && tgt?.birth_year && src.death_year < tgt.birth_year - 1) {
        console.log(`  ❌ Removing: ${r.source} (d.${src.death_year}) → ${r.target} (b.${tgt.birth_year}) [parent died before child born]`);
        removed++;
        return false;
      }
    }
    // husband-wife: both clearly male (warlord/general/emperor)
    if (r.type === 'husband-wife') {
      const maleRoles = ['warlord', 'general', 'emperor', 'politician', 'strategist'];
      const srcMale = maleRoles.some(mr => src?.roles?.includes(mr));
      const tgtMale = maleRoles.some(mr => tgt?.roles?.includes(mr));
      if (srcMale && tgtMale) {
        console.log(`  ❌ Removing: ${r.source} ↔ ${r.target} [both male - likely false positive]`);
        removed++;
        return false;
      }
    }
    return true;
  });
  console.log(`  Removed ${removed} suspicious relations`);

  // Save cleaned results
  const finalPath = resolve(DATA_DIR, 'relationships-new.json');
  writeFileSync(finalPath, JSON.stringify(filtered, null, 2), 'utf8');

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Persons processed: ${candidates.length}`);
  console.log(`  Relations found (raw): ${newRelations.length}`);
  console.log(`  Relations after cleanup: ${filtered.length}`);
  console.log(`  Duplicates skipped: ${totalSkipped}`);
  console.log(`  Errors: ${totalErrors}`);
  const typeCounts = {};
  filtered.forEach(r => { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });
  console.log('  By type:');
  for (const [t, c] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t}: ${c}`);
  }
  console.log(`\n✅ Output: data/relationships-new.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
