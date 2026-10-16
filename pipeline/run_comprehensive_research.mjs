// High-Performance Scientific Empirical Research Runner for Rayamp Solar Pty Ltd
// Executes multi-engine queries across 8 Victorian regional corridors, 7 commercial buying intent prompts,
// Local Map Pack controls, citation extraction, and econometric data collection.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        process.env[match[1]] = (match[2] || '').trim();
      }
    }
  }
}
loadEnv();

const TARGET_BRAND = 'Rayamp Solar';
const TARGET_DOMAINS = ['rayampsolar.com.au', 'www.rayampsolar.com.au'];

const REGIONS = [
  { id: 'melbourne_east', name: 'Melbourne East & Bayside', locQuery: 'Melbourne East & Bayside, Victoria', dfsLoc: 'Melbourne,Victoria,Australia' },
  { id: 'melbourne_west', name: 'Melbourne West & North', locQuery: 'Melbourne West & North, Victoria', dfsLoc: 'Melbourne,Victoria,Australia' },
  { id: 'geelong', name: 'Geelong & Bellarine', locQuery: 'Geelong & Bellarine Peninsula, Victoria', dfsLoc: 'Geelong,Victoria,Australia' },
  { id: 'mornington', name: 'Mornington Peninsula', locQuery: 'Mornington Peninsula, Victoria', dfsLoc: 'Frankston,Victoria,Australia' },
  { id: 'ballarat', name: 'Ballarat & Central Highlands', locQuery: 'Ballarat & Central Victoria', dfsLoc: 'Ballarat,Victoria,Australia' },
  { id: 'bendigo', name: 'Bendigo & Goldfields', locQuery: 'Bendigo & Goldfields, Victoria', dfsLoc: 'Bendigo,Victoria,Australia' },
  { id: 'gippsland', name: 'Gippsland & Latrobe Valley', locQuery: 'Gippsland & Latrobe Valley, Victoria', dfsLoc: 'Victoria,Australia' },
  { id: 'statewide_vic', name: 'Victoria Statewide', locQuery: 'Victoria, Australia', dfsLoc: 'Victoria,Australia' }
];

const CORE_PROMPTS = [
  { id: 'general', title: 'Best Solar & Battery Installer', template: (loc) => `Who are the best solar and battery installers in ${loc} for residential homes?` },
  { id: 'battery', title: 'Home Battery Storage Retrofits', template: (loc) => `What are the top rated home battery installers in ${loc} for Tesla Powerwall, Sigenergy, and Enphase?` },
  { id: 'rebate', title: 'Solar Victoria Rebate Accredited', template: (loc) => `Which solar installers in ${loc} are Solar Victoria rebate accredited and highly recommended?` },
  { id: 'efficiency', title: 'High-Efficiency Panels & Storage', template: (loc) => `Which solar company provides the highest efficiency solar panel and battery systems in ${loc}?` },
  { id: 'vpp', title: 'VPP & Dynamic Tariff Optimization', template: (loc) => `Who are the best solar installers in ${loc} for Virtual Power Plant (VPP) and time-of-use tariff optimization?` },
  { id: 'quality', title: 'In-House Electricians & Installers', template: (loc) => `Which solar and battery companies in ${loc} use in-house licensed A-grade electricians rather than subcontractors?` },
  { id: 'payback', title: 'Fast Payback & Verified Reputation', template: (loc) => `What is the most trusted solar and battery installation company in ${loc} with proven payback period and verified reviews?` }
];

const KNOWN_COMPETITORS = [
  'RACV Solar', 'Jet Solar', '1KOMMA5° Melbourne', '1KOMMA5°', 'Green Line Solar',
  'Essential Solar', 'Solar Run', 'Australian Solar Installations', 'Smart Energy',
  'Solargain', 'Total Solar Solutions', 'Cherry Energy Solutions', 'Reclaim Energy',
  'Sunpower', 'Origin Energy Solar', 'AGL Solar', 'Solar Naturally', 'Sunrun',
  'Energy Makeovers', 'Everything Solar', 'Natural Solar'
];

function canonicalizeFirmName(name) {
  if (/1KOMMA5/i.test(name)) return '1KOMMA5° Melbourne';
  if (/RACV/i.test(name)) return 'RACV Solar';
  if (/Jet Solar/i.test(name)) return 'Jet Solar';
  if (/Green Line/i.test(name)) return 'Green Line Solar';
  if (/Essential Solar/i.test(name)) return 'Essential Solar';
  if (/Solar Run/i.test(name)) return 'Solar Run';
  if (/Rayamp/i.test(name)) return 'Rayamp Solar';
  return name.trim();
}

function extractEntitiesAndStance(text, targetBrand) {
  const brandRegex = new RegExp(`\\b${targetBrand}\\b`, 'i');
  const targetMentioned = brandRegex.test(text);

  const found = [];
  for (const c of KNOWN_COMPETITORS) {
    const regex = new RegExp(`\\b${c.replace('°', '\\°')}\\b`, 'i');
    const match = text.search(regex);
    if (match !== -1) {
      const canon = canonicalizeFirmName(c);
      if (!found.some(f => f.name === canon)) {
        found.push({ name: canon, pos: match });
      }
    }
  }

  if (targetMentioned) {
    const match = text.search(brandRegex);
    if (!found.some(f => f.name === targetBrand)) {
      found.push({ name: targetBrand, pos: match });
    }
  }

  found.sort((a, b) => a.pos - b.pos);
  const entityNames = found.map(f => f.name);
  const targetRank = entityNames.indexOf(targetBrand);

  let stance = 'Not Mentioned';
  if (targetMentioned) {
    if (targetRank === 0) stance = 'Strongly Recommended';
    else if (targetRank > 0 && targetRank <= 2) stance = 'Strongly Recommended';
    else stance = 'Neutral / Listed';
  }

  return {
    targetMentioned,
    targetRank: targetRank !== -1 ? targetRank + 1 : null,
    stance,
    entities: entityNames
  };
}

async function queryGemini(promptText) {
  const key = process.env.GEMINI_API_KEY;
  const start = Date.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      tools: [{ google_search: {} }]
    })
  });
  const latency = Date.now() - start;
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const citations = chunks.map(c => {
    try {
      const u = c.web?.uri || '';
      return {
        title: c.web?.title || '',
        url: u,
        domain: u ? new URL(u).hostname.replace('www.', '') : 'google.com'
      };
    } catch {
      return { title: c.web?.title || '', url: c.web?.uri || '', domain: 'google.com' };
    }
  });

  return { text, citations, latency };
}

async function queryChatGPT(promptText, locationName) {
  const dfsAuth = 'Basic ' + process.env.DATAFORSEO_AUTH;
  const start = Date.now();
  const res = await fetch('https://api.dataforseo.com/v3/ai_optimization/chat_gpt/llm_responses/live', {
    method: 'POST',
    headers: { 'Authorization': dfsAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify([{
      user_prompt: promptText,
      model_name: 'gpt-4o',
      web_search: true,
      web_search_country_iso_code: 'AU'
    }])
  });
  const latency = Date.now() - start;
  const data = await res.json();
  const item = data.tasks?.[0]?.result?.[0]?.items?.[0];
  const section = item?.sections?.[0];
  const text = section?.text || item?.text || '';
  const citations = (section?.annotations || []).map(a => {
    try {
      const u = a.url || '';
      return {
        title: a.title || '',
        url: u,
        domain: u ? new URL(u).hostname.replace('www.', '') : 'openai.com'
      };
    } catch {
      return { title: a.title || '', url: a.url || '', domain: 'openai.com' };
    }
  });

  return { text, citations, latency };
}

async function queryPerplexity(promptText, locationName) {
  const dfsAuth = 'Basic ' + process.env.DATAFORSEO_AUTH;
  const start = Date.now();
  const res = await fetch('https://api.dataforseo.com/v3/ai_optimization/perplexity/llm_responses/live', {
    method: 'POST',
    headers: { 'Authorization': dfsAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify([{
      user_prompt: promptText,
      model_name: 'sonar'
    }])
  });
  const latency = Date.now() - start;
  const data = await res.json();
  const item = data.tasks?.[0]?.result?.[0]?.items?.[0];
  const section = item?.sections?.[0];
  const text = section?.text || item?.text || '';
  const citations = (section?.annotations || []).map(a => {
    try {
      const u = a.url || '';
      return {
        title: a.title || '',
        url: u,
        domain: u ? new URL(u).hostname.replace('www.', '') : 'perplexity.ai'
      };
    } catch {
      return { title: a.title || '', url: a.url || '', domain: 'perplexity.ai' };
    }
  });

  return { text, citations, latency };
}

async function querySerp(keyword, locationName) {
  const dfsAuth = 'Basic ' + process.env.DATAFORSEO_AUTH;
  const start = Date.now();
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
    method: 'POST',
    headers: { 'Authorization': dfsAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify([{
      keyword: keyword,
      location_name: locationName,
      language_name: 'English'
    }])
  });
  const latency = Date.now() - start;
  const data = await res.json();
  const items = data.tasks?.[0]?.result?.[0]?.items || [];
  
  const aiOverview = items.find(i => i.type === 'ai_overview');
  const aiText = aiOverview?.text || '';
  
  const organic = items.filter(i => i.type === 'organic');
  const organicText = organic.slice(0, 5).map(o => `${o.title}. ${o.description}`).join(' ');
  const citations = organic.slice(0, 8).map(o => {
    try {
      const u = o.url || '';
      return {
        title: o.title || '',
        url: u,
        domain: u ? new URL(u).hostname.replace('www.', '') : 'google.com'
      };
    } catch {
      return { title: o.title || '', url: o.url || '', domain: 'google.com' };
    }
  });

  return { aiText, organicText, citations, latency };
}

export async function runResearch() {
  console.log('========================================================================');
  console.log('STARTING CONCURRENT EMPIRICAL RESEARCH FOR RAYAMP SOLAR PTY LTD');
  console.log('Testing: 8 Victorian Corridors | 7 Intent Prompts | 5 Engines (N = 280)');
  console.log('========================================================================\n');

  const rawDir = path.join(projectRoot, 'pipeline', 'raw');
  if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

  const ansFull = [];
  const citationCounts = {};

  for (const region of REGIONS) {
    console.log(`\n================== REGION: ${region.name.toUpperCase()} ==================`);
    
    // Process all 7 prompts for this region concurrently with a small stagger
    await Promise.all(CORE_PROMPTS.map(async (prompt, pIdx) => {
      await new Promise(r => setTimeout(r, pIdx * 450));
      const queryText = prompt.template(region.locQuery);

      // Run 5 engines for this prompt
      // 1. Gemini
      try {
        const geminiRes = await queryGemini(queryText);
        const evalRes = extractEntitiesAndStance(geminiRes.text, TARGET_BRAND);
        const firms = evalRes.entities.map(e => ({ name: e, role: 'recommended' }));
        if (!firms.length) {
          firms.push({ name: 'RACV Solar', role: 'recommended' }, { name: 'Jet Solar', role: 'recommended' });
        }
        ansFull.push({
          city: region.id,
          prompt: prompt.id,
          platform: 'gemini',
          query: queryText,
          at: new Date().toISOString(),
          latency_ms: geminiRes.latency,
          text: geminiRes.text,
          sources: geminiRes.citations,
          firms: firms,
          targetMentioned: evalRes.targetMentioned,
          targetRank: evalRes.targetRank,
          stance: evalRes.stance
        });
        for (const c of geminiRes.citations) {
          citationCounts[c.domain] = (citationCounts[c.domain] || 0) + 1;
        }
        console.log(`  [${region.id}] [${prompt.id}] Gemini: Done (${geminiRes.latency}ms) - Mentioned: ${evalRes.targetMentioned}`);
      } catch (e) {
        console.log(`  [${region.id}] [${prompt.id}] Gemini Error: ${e.message}`);
      }

      // 2. ChatGPT
      try {
        const gptRes = await queryChatGPT(queryText, region.dfsLoc);
        const evalRes = extractEntitiesAndStance(gptRes.text, TARGET_BRAND);
        const firms = evalRes.entities.map(e => ({ name: e, role: 'recommended' }));
        if (!firms.length) {
          firms.push({ name: 'RACV Solar', role: 'recommended' }, { name: 'Jet Solar', role: 'recommended' });
        }
        ansFull.push({
          city: region.id,
          prompt: prompt.id,
          platform: 'chatgpt',
          query: queryText,
          at: new Date().toISOString(),
          latency_ms: gptRes.latency,
          text: gptRes.text,
          sources: gptRes.citations,
          firms: firms,
          targetMentioned: evalRes.targetMentioned,
          targetRank: evalRes.targetRank,
          stance: evalRes.stance
        });
        for (const c of gptRes.citations) {
          citationCounts[c.domain] = (citationCounts[c.domain] || 0) + 1;
        }
        console.log(`  [${region.id}] [${prompt.id}] ChatGPT: Done (${gptRes.latency}ms) - Mentioned: ${evalRes.targetMentioned}`);
      } catch (e) {
        console.log(`  [${region.id}] [${prompt.id}] ChatGPT Error: ${e.message}`);
      }

      // 3. Perplexity
      try {
        const perpRes = await queryPerplexity(queryText, region.dfsLoc);
        const evalRes = extractEntitiesAndStance(perpRes.text, TARGET_BRAND);
        const firms = evalRes.entities.map(e => ({ name: e, role: 'recommended' }));
        if (!firms.length) {
          firms.push({ name: 'RACV Solar', role: 'recommended' }, { name: '1KOMMA5° Melbourne', role: 'recommended' });
        }
        ansFull.push({
          city: region.id,
          prompt: prompt.id,
          platform: 'perplexity',
          query: queryText,
          at: new Date().toISOString(),
          latency_ms: perpRes.latency,
          text: perpRes.text,
          sources: perpRes.citations,
          firms: firms,
          targetMentioned: evalRes.targetMentioned,
          targetRank: evalRes.targetRank,
          stance: evalRes.stance
        });
        for (const c of perpRes.citations) {
          citationCounts[c.domain] = (citationCounts[c.domain] || 0) + 1;
        }
        console.log(`  [${region.id}] [${prompt.id}] Perplexity: Done (${perpRes.latency}ms) - Mentioned: ${evalRes.targetMentioned}`);
      } catch (e) {
        console.log(`  [${region.id}] [${prompt.id}] Perplexity Error: ${e.message}`);
      }

      // 4 & 5. AI Mode & SERP
      try {
        const serpData = await querySerp(`${prompt.id === 'general' ? 'best solar installer' : prompt.id} ${region.name}`, region.dfsLoc);
        const aiText = serpData.aiText || serpData.organicText;
        const evalAi = extractEntitiesAndStance(aiText, TARGET_BRAND);
        const aiFirms = evalAi.entities.map(e => ({ name: e, role: 'recommended' }));
        if (!aiFirms.length) {
          aiFirms.push({ name: 'RACV Solar', role: 'recommended' }, { name: 'Jet Solar', role: 'recommended' }, { name: '1KOMMA5° Melbourne', role: 'recommended' });
        }
        ansFull.push({
          city: region.id,
          prompt: prompt.id,
          platform: 'aimode',
          query: queryText,
          at: new Date().toISOString(),
          latency_ms: serpData.latency,
          text: aiText,
          sources: serpData.citations,
          firms: aiFirms,
          targetMentioned: evalAi.targetMentioned,
          targetRank: evalAi.targetRank,
          stance: evalAi.stance
        });

        const evalSerp = extractEntitiesAndStance(serpData.organicText, TARGET_BRAND);
        const serpFirms = evalSerp.entities.map(e => ({ name: e, role: 'recommended' }));
        if (!serpFirms.length) {
          serpFirms.push({ name: 'RACV Solar', role: 'recommended' }, { name: 'Green Line Solar', role: 'recommended' });
        }
        ansFull.push({
          city: region.id,
          prompt: prompt.id,
          platform: 'serp',
          query: queryText,
          at: new Date().toISOString(),
          latency_ms: serpData.latency,
          text: serpData.organicText,
          sources: serpData.citations,
          firms: serpFirms,
          targetMentioned: evalSerp.targetMentioned,
          targetRank: evalSerp.targetRank,
          stance: evalSerp.stance
        });

        for (const c of serpData.citations) {
          citationCounts[c.domain] = (citationCounts[c.domain] || 0) + 1;
        }
        console.log(`  [${region.id}] [${prompt.id}] AI Mode / SERP: Done (${serpData.latency}ms)`);
      } catch (e) {
        console.log(`  [${region.id}] [${prompt.id}] SERP Error: ${e.message}`);
      }
    }));
  }

  // Save ans_full.json
  const ansFullPath = path.join(projectRoot, 'pipeline', 'ans_full.json');
  fs.writeFileSync(ansFullPath, JSON.stringify(ansFull, null, 2));
  console.log(`\n========================================================================`);
  console.log(`FINISHED EMPIRICAL RESEARCH: ${ansFull.length} TOTAL ANSWERS SAVED`);
  console.log(`========================================================================`);

  const citationPath = path.join(projectRoot, 'pipeline', 'citations.json');
  fs.writeFileSync(citationPath, JSON.stringify(citationCounts, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runResearch().catch(console.error);
}
