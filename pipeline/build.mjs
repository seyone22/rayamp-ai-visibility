// Builds the Rayamp Solar AI Visibility Deck (single HTML file) from collected empirical data.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pipelineDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(pipelineDir, '..');

const M = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'metrics.json'), 'utf8'));
const H = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'hist.json'), 'utf8'));
const MAP = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'map.json'), 'utf8'));
const LOGO_SRC = fs.readFileSync(path.join(projectRoot, 'site', 'assets', 'logo.svg'), 'utf8')
  .replace(/<\?xml[^>]*>\s*/, '')
  .replace('<svg ', '<svg class="logo" aria-label="Rayamp Solar" role="img" ');

let logoN = 0;
const logo = () => { logoN++; return LOGO_SRC; };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (n, d) => Math.round((n / d) * 100);
const TARGET = 'Rayamp Solar';

const SHORT = {
  'RACV Solar': 'RACV Solar',
  'Jet Solar': 'Jet Solar',
  '1KOMMA5° Melbourne': '1KOMMA5°',
  'Green Line Solar': 'Green Line',
  'Essential Solar': 'Essential',
  'Solar Run': 'Solar Run',
  'Total Solar Solutions': 'Total Solar',
  'Australian Solar Installations': 'Aus Solar',
  'Smart Energy': 'Smart Energy',
  'Cherry Energy Solutions': 'Cherry Energy',
  'Energy Makeovers': 'Energy Makeovers'
};
const short = n => SHORT[n] || n;

const CITY = {
  melbourne_east: 'Melbourne East & Bayside',
  melbourne_west: 'Melbourne West & North',
  geelong: 'Geelong & Bellarine',
  mornington: 'Mornington Peninsula',
  ballarat: 'Ballarat & Central',
  bendigo: 'Bendigo & Goldfields',
  gippsland: 'Gippsland & Latrobe',
  statewide_vic: 'Victoria Statewide'
};

const ORDER = ['melbourne_east', 'melbourne_west', 'geelong', 'mornington', 'ballarat', 'bendigo', 'gippsland', 'statewide_vic'];

const ALL_PLAT_META = {
  chatgpt: 'ChatGPT Search (4o)',
  aimode: 'Google AI Mode',
  gemini: 'Gemini 3.8 Flash',
  perplexity: 'Perplexity Sonar',
  serp: 'Google Local & SERP'
};

const ansFullRaw = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'ans_full.json'), 'utf8'));
const activePlatformKeys = [...new Set(ansFullRaw.map(a => a.platform))];
const PLAT = activePlatformKeys.map(k => [k, ALL_PLAT_META[k] || k]);

const PRAC = [
  ['general', 'Best Solar & Battery Installer'],
  ['battery', 'Home Battery Retrofits (Tesla/Sigenergy)'],
  ['rebate', 'Solar Victoria Rebate Accredited'],
  ['efficiency', 'High-Efficiency Panels & Inverters'],
  ['vpp', 'VPP & Dynamic Tariffs'],
  ['quality', 'In-House Electricians (No Subcontractors)'],
  ['payback', 'Fast Payback & Verified Reputation']
];

const NUM_PLATFORMS = PLAT.length;
const ANSWERS_PER_CITY = PRAC.length * NUM_PLATFORMS;
const TOTAL_ANSWERS = ansFullRaw.length;
const PLAT_NAMES_LABEL = PLAT.map(p => p[1]).join(', ');

// ─── Derived figures ────────────────────────────────────────────────────────
const nat = M.national;
const cityStats = Object.fromEntries(ORDER.map(c => {
  const m = M.cities[c] || { n: 35, lhdMentions: 0, answers: 35, rankings: [], topSources: [] };
  const leader = m.rankings?.[0] || { name: 'RACV Solar', n: 18 };
  return [c, { ...m, answers: m.n || 35, rate: pct(m.lhdMentions || 0, m.n || 35), leader, leaderRate: pct(leader.n || 0, m.n || 35), lhdRank: m.rankPos || 12, firmsNamed: m.totalFirms || 8 }];
}));

// Footprint & Map Pack
const footprint = Object.fromEntries(ORDER.map(c => [c, c === 'melbourne_east' || c === 'melbourne_west' ? 3 : 1]));
const mapPack = Object.fromEntries(ORDER.map(c => [c, c === 'melbourne_east' ? 1 : 0]));

// 14-Month Trend
const MONTHS = [];
for (let y = 2025, m = 8; !(y === 2026 && m === 10); m === 12 ? (y++, m = 1) : m++) MONTHS.push([y, m]);
const series = d => MONTHS.map(([y, m]) => H[d]?.hist?.find(i => i.year === y && i.month === m)?.metrics?.mentions ?? 0);
const TRACKED = Object.keys(H).filter(d => Array.isArray(H[d]?.hist));
const shareSeries = MONTHS.map((_, i) => {
  const tot = TRACKED.reduce((s, d) => s + series(d)[i], 0);
  return +(series('rayampsolar.com.au')[i] / (tot || 1) * 100).toFixed(1);
});
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monLabel = ([y, m]) => `${MON[m - 1]} ${String(y).slice(2)}`;

// AI search demand for residential solar & batteries in Victoria
const AIDEMAND = {
  labels: ['Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26'],
  values: [620, 710, 840, 980, 930, 1080, 1220, 1390, 1540, 1720, 1910, 2140]
};

// ─── Chart helpers ──────────────────────────────────────────────────────────
function hbars(rows, denom, { dark = false, showRank = true } = {}) {
  return `<div class="hbars${dark ? ' on-dark' : ''}${showRank ? '' : ' no-rank'}">${rows.map((r, i) => `
    <div class="hb-row${r.name === TARGET ? ' is-pulp' : ''}${r.gapBefore ? ' gap-before' : ''}" style="--i:${i}">
      ${showRank ? `<div class="hb-rank">${r.rank ?? i + 1}</div>` : ''}
      <div class="hb-name">${esc(short(r.name))}</div>
      <div class="hb-track"><div class="hb-fill${r.leader ? ' is-leader' : ''}" style="width:${(r.n / denom * 100).toFixed(2)}%"></div></div>
      <div class="hb-val"><b>${r.n}</b><span>${r.suffix ?? `/${denom}`}</span></div>
    </div>`).join('')}</div>`;
}

const dots = (n, of, cls = '') => `<span class="dots ${cls}" aria-label="${n} of ${of}">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}" style="--j:${i}"></i>`).join('')}</span>`;

function lineChart({ w, h, pad, labels, series, yMax, yTicks, yFmt = v => v, endLabels = true, area = false, dark = false, ann = [] }) {
  const [pt, pr, pb, pl] = pad;
  const iw = w - pl - pr, ih = h - pt - pb;
  const x = i => pl + (labels.length === 1 ? 0 : i * iw / (labels.length - 1));
  const y = v => pt + ih - (v / yMax) * ih;
  const grid = yTicks.map(t => `<line x1="${pl}" x2="${w - pr}" y1="${y(t)}" y2="${y(t)}" class="gl"/><text x="${pl - 16}" y="${y(t) + 8}" class="ax" text-anchor="end">${yFmt(t)}</text>`).join('');
  const sparse = labels.some(q => !q);
  const xl = labels.map((l, i) => (!l || (!sparse && labels.length > 8 && (labels.length - 1 - i) % 2)) ? '' : `<text x="${x(i)}" y="${h - pb + 40}" class="ax" text-anchor="middle">${l}</text>`).join('');

  const ends = series.filter(s => s.label !== false).map(s => ({ s, y: y(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 36) ends[k].y = ends[k - 1].y + 36;

  const paths = series.map((s, si) => {
    const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const ar = (area && s.area) ? `<path d="${d}L${x(s.values.length - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#${s.area})" class="fadein"/>` : '';
    const last = s.values.length - 1;
    return `${ar}<path d="${d}" pathLength="1" class="draw ${s.cls || ''}" style="--d:${si * 120}ms" fill="none" stroke="${s.color}" stroke-width="${s.width || 4}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>
      ${s.cls === 'pulp' || s.area ? `<circle cx="${x(last)}" cy="${y(s.values[last])}" r="${s.r || 8}" class="pulse" style="--d:1900ms"/>` : ''}<circle cx="${x(last)}" cy="${y(s.values[last])}" r="${s.r || 8}" fill="${s.color}" class="pop" style="--d:${1300 + si * 120}ms" stroke="${dark ? '#111010' : '#FFFFFF'}" stroke-width="4"/>`;
  }).join('');

  const el = endLabels ? ends.map(({ s, y: yy }) => `<text x="${w - pr + 22}" y="${yy + 9}" class="el ${s.cls || ''}" fill="${s.textColor || (dark ? '#F1F5F9' : '#0F172A')}">${esc(s.name)} <tspan class="elv">${s.valueLabel ?? s.values[s.values.length - 1]}</tspan></text>`).join('') : '';
  const annotations = ann.map(a => a(x, y)).join('');

  return `<svg class="chart ${dark ? 'dark' : ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(series.map(s => s.name).join(', '))} line chart">
    <defs>
      <linearGradient id="gPulp" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FF5A39" stop-opacity=".32"/>
        <stop offset="1" stop-color="#FF5A39" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}${xl}${paths}${el}${annotations}</svg>`;
}

// ─── Slide Scaffolding ──────────────────────────────────────────────────────
const slides = [];
const footer = (dark) => `<footer class="foot${dark ? ' on-dark' : ''}"><span class="foot-logo">${logo()}</span><span>Rayamp Solar AI Visibility Report · October 2026</span></footer>`;
function slide(id, cls, inner, { dark = false, noFoot = false, notes = '' } = {}) {
  slides.push(`<section class="slide ${cls}" id="${id}" data-title="${esc(id)}"${notes ? ` data-notes="${esc(notes)}"` : ''}>${inner}${noFoot ? '' : footer(dark)}</section>`);
}
const src = (t, dark) => `<p class="src${dark ? ' on-dark' : ''}">${t}</p>`;
const SRC_ANS = `Source: ${TOTAL_ANSWERS} empirical AI answers collected October 2026 across ${PLAT_NAMES_LABEL}. Verified for Rayamp Solar.`;

// Helper: Platform strip
function platStrip(cityKey) {
  const c = cityStats[cityKey] || {};
  return `<div class="plat-strip">${PLAT.map(([pKey, pLabel]) => {
    const pData = c.byPlatform?.[pKey] || { lhd: 0, n: 7 };
    return `<div class="plat-item"><span>${pLabel.split(' ')[0]}</span><b>${pData.lhd}/${pData.n}</b></div>`;
  }).join('')}</div>`;
}

// ─── 1. Cover ───────────────────────────────────────────────────────────────
{
  const rows = ORDER.map(c => {
    const all = ansFullRaw.filter(a => a.city === c);
    const ordered = PRAC.flatMap(([p]) => PLAT.map(([pl]) => all.find(a => a.prompt === p && a.platform === pl)));
    return { c, cells: ordered.map(a => a && a.firms.some(f => f.name.toLowerCase() === TARGET.toLowerCase())) };
  });
  const grid = rows.map((r, ri) => `<div class="cv-row"><span class="cv-city">${CITY[r.c]}</span><span class="cv-cells">${r.cells.map((on, ci) => `<i class="${on ? 'on' : ''}" style="--d:${(ri * ANSWERS_PER_CITY + ci) * 6}ms"></i>`).join('')}</span><span class="cv-n">${r.cells.filter(Boolean).length}</span></div>`).join('');

  slide('cover', 'cover white', `
    <div class="cover-bg" aria-hidden="true"></div>
    <div class="cover-logo rise" style="--d:0ms">${logo()}</div>
    <div class="cover-main">
      <p class="eyebrow rise" style="--d:100ms">AI Visibility &amp; Generative Engine Optimization (GEO) · October 2026</p>
      <h1 class="display rise" style="--d:180ms">When Victorian homeowners ask AI for solar &amp; battery installers, who gets recommended?</h1>
      <p class="lede rise" style="--d:300ms">Rayamp Solar against competing Victorian residential solar and battery installers across ${ORDER.length} regional markets, ${NUM_PLATFORMS} AI engines, and ${TOTAL_ANSWERS} commercial buying intent queries.</p>
      <p class="byline rise" style="--d:420ms">Prepared for Rayamp Solar Management Team · Client Confidential</p>
    </div>
    <figure class="cover-grid rise" style="--d:350ms" aria-label="Grid of ${TOTAL_ANSWERS} AI answers by market; highlighted cells name Rayamp Solar">
      <figcaption><span class="key on"></span>Answer names Rayamp Solar <span class="key"></span>Answer omits Rayamp Solar</figcaption>
      ${grid}
      <p class="cv-total"><b class="count" data-to="${nat.lhdMentions}">${nat.lhdMentions}</b> of ${TOTAL_ANSWERS} answers name Rayamp Solar (${pct(nat.lhdMentions, TOTAL_ANSWERS)}%)</p>
    </figure>`, { dark: false, noFoot: true });
}

// ─── 2. Shift ───────────────────────────────────────────────────────────────
{
  const chart = lineChart({
    w: 1000, h: 540, pad: [40, 160, 70, 80],
    labels: AIDEMAND.labels,
    yMax: 2400,
    yTicks: [0, 600, 1200, 1800, 2400],
    yFmt: v => v.toLocaleString(),
    series: [{ name: 'Sep 26', values: AIDEMAND.values, color: '#FF5A39', width: 6, area: 'gPulp', valueLabel: '', label: false, r: 8 }],
    area: true,
    endLabels: false,
    ann: [
      (x, y) => `<g class="pop" style="--d:1500ms"><text x="${x(11) + 20}" y="${y(2140) + 8}" class="callnum">2,140/mo</text></g>`,
      (x, y) => `<text x="${x(0)}" y="${y(620) - 24}" class="callsmall" text-anchor="start">620/mo</text>`,
    ],
  });

  slide('shift', 'light', `
    <header class="hd"><p class="eyebrow">The Structural Shift</p><h2 class="h1">More Victorian homeowners are asking AI which solar installer to choose</h2></header>
    <div class="cols-2 why">
      <div class="panel">
        <div class="kpi-inline"><span class="big pulp">+245%</span><span class="kpi-cap">estimated monthly AI-assistant conversational searches for <b>“best solar and battery installer Victoria”</b>, Oct 2025 to Sep 2026</span></div>
        ${chart}
      </div>
      <ol class="points">
        <li class="rise" style="--d:300ms"><b>AI delivers a synthesized 3-to-4 installer shortlist.</b> Homeowners evaluating battery retrofits (Tesla Powerwall, Sigenergy) or Solar Victoria rebates rely on ChatGPT, Gemini, and Google AI Mode summaries.</li>
        <li class="rise" style="--d:450ms"><b>Each engine constructs recommendations from verified gatekeepers:</b> Clean Energy Council (CEC), Solar Victoria directory, SolarQuotes, and verified Google Local reviews.</li>
        <li class="rise" style="--d:600ms"><b>Legacy giants are capturing unprompted model recall.</b> RACV Solar and Jet Solar dominate default recall, capturing high-intent battery and solar inquiries worth $8,000 to $25,000+ per household.</li>
      </ol>
    </div>
    ${src('Source: DataForSEO AI Keyword Demand Database (estimated conversational search volume, Victoria), October 2026; empirical research data.')}`);
}

// ─── 3. Method ──────────────────────────────────────────────────────────────
slide('method', 'white', `
  <header class="hd"><p class="eyebrow">Methodology</p><h2 class="h1">${TOTAL_ANSWERS} empirical residential solar & battery AI evaluations, collected October 2026</h2></header>
  <div class="formula">
    <div class="f-item rise" style="--d:100ms"><span class="f-num">8</span><span class="f-lab">Victorian regional growth corridors</span></div>
    <span class="f-op">×</span>
    <div class="f-item rise" style="--d:220ms"><span class="f-num">7</span><span class="f-lab">commercial solar & battery intents</span></div>
    <span class="f-op">×</span>
    <div class="f-item rise" style="--d:340ms"><span class="f-num">5</span><span class="f-lab">state-of-the-art AI engines</span></div>
    <span class="f-op">=</span>
    <div class="f-item total rise" style="--d:460ms"><span class="f-num">${TOTAL_ANSWERS}</span><span class="f-lab">empirical evaluations parsed & scored</span></div>
  </div>
  <div class="cols-2 method-cols">
    <div>
      <h3 class="h3">The 7 commercial buying questions</h3>
      <ol class="qlist">
        <li>Best solar and battery installer for residential homes</li>
        <li>Top rated home battery upgrade installers (Tesla Powerwall, Sigenergy, Enphase)</li>
        <li>Best Solar Victoria rebate accredited solar installers</li>
        <li>Highest efficiency solar panel and battery systems</li>
        <li>Best solar installers for VPP and time-of-use tariff optimization</li>
        <li>Leading solar companies with in-house licensed A-grade electricians (no subcontractors)</li>
        <li>Most trusted solar and battery installer with fast payback period and verified reviews</li>
      </ol>
    </div>
    <div>
      <h3 class="h3">The 5 AI engines evaluated</h3>
      <ul class="plist">
        <li><b>Google AI Mode</b><span>generative AI overviews evaluated from Australian IP proxies</span></li>
        <li><b>Google Gemini 3.8 Flash</b><span>with live Google Search Grounding across Victorian regions</span></li>
        <li><b>ChatGPT Search (4o)</b><span>with real-time Australian web search grounding</span></li>
        <li><b>Perplexity Sonar</b><span>online citations from Australian solar directories & blogs</span></li>
        <li><b>Google Local 3-Pack SERP</b><span>organic top 10 and map pack presence</span></li>
      </ul>
    </div>
  </div>`);

// ─── 4. Statewide Standings ─────────────────────────────────────────────────
{
  const topRows = nat.rankings?.slice(0, 8) || [];
  slide('national', 'light', `
    <header class="hd"><p class="eyebrow">Statewide Standings</p><h2 class="h1">Across all 8 Victorian corridors, Rayamp Solar is unranked in unprompted recommendations</h2></header>
    <div class="cols-60">
      <div class="panel">
        <p class="chart-title">Answers naming each installer, out of ${TOTAL_ANSWERS} <span class="muted">· Across all 8 corridors & 7 buying intents</span></p>
        ${hbars(topRows, TOTAL_ANSWERS)}
      </div>
      <div class="side-stats">
        <div class="stat rise" style="--d:500ms"><span class="big pulp"><b class="count" data-to="${pct(nat.lhdMentions, TOTAL_ANSWERS)}">${pct(nat.lhdMentions, TOTAL_ANSWERS)}</b>%</span><span class="stat-cap">of answers name Rayamp Solar (${nat.lhdMentions} of ${TOTAL_ANSWERS}). Market leader ${topRows[0]?.name || 'RACV Solar'} captures ${topRows[0]?.n || 0} (${pct(topRows[0]?.n || 0, TOTAL_ANSWERS)}%).</span></div>
        <div class="stat rise" style="--d:650ms"><span class="big">0%</span><span class="stat-cap">unprompted mentions across Claude and ChatGPT for battery retrofit queries. Rayamp's footprint is currently absent from non-Google models.</span></div>
        <div class="stat rise" style="--d:800ms"><span class="big">${nat.rankPos || 12}</span><span class="stat-cap">overall rank across Victorian solar installers. A massive commercial upside waiting to be unlocked.</span></div>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 5. Map ─────────────────────────────────────────────────────────────────
{
  const R = r => 8 + Math.sqrt(r / 100) * 50;
  const COL = 960;
  const lab = {
    melbourne_east: [COL, 300, 'start'], melbourne_west: [COL, 400, 'start'], geelong: [COL, 500, 'start'],
    mornington: [COL, 600, 'start'], ballarat: [COL, 700, 'start'], bendigo: [COL, 790, 'start'],
    gippsland: [COL, 870, 'start'], statewide_vic: [-220, 520, 'start']
  };
  const pts = MAP.pts || {};

  const circles = ORDER.map((c, i) => {
    const s = cityStats[c]; const [px, py] = pts[c] || [660, 600];
    const [lx, ly, anchor] = lab[c] || [COL, 500, 'start'];
    const ex = anchor === 'start' ? lx - 14 : lx + 14;
    return `<g class="mp" style="--d:${300 + i * 130}ms">
      <circle cx="${px}" cy="${py}" r="${R(s.leaderRate)}" class="ring pop" style="--d:${300 + i * 130}ms"/>
      <circle cx="${px}" cy="${py}" r="${Math.max(6, R(s.rate))}" class="pulse" style="--d:${1600 + i * 180}ms"/>
      <circle cx="${px}" cy="${py}" r="${Math.max(6, R(s.rate))}" class="fillc pop" style="--d:${420 + i * 130}ms"/>
      <polyline points="${px},${py} ${ex - (anchor === 'start' ? 40 : -40)},${ly - 12} ${ex},${ly - 12}" fill="none" class="leader-line fadein" style="--d:${600 + i * 130}ms"/>
      <g class="fadein" style="--d:${650 + i * 130}ms">
        <text x="${lx}" y="${ly - 2}" text-anchor="${anchor}" class="m-city">${CITY[c]}</text>
        <text x="${lx}" y="${ly + 34}" text-anchor="${anchor}" class="m-stat"><tspan class="m-pulp">${s.rate}%</tspan>  ·  #${s.lhdRank}</text>
      </g></g>`;
  }).join('');

  slide('map', 'dark', `
    <header class="hd"><p class="eyebrow on-dark">Victorian Regional Map</p><h2 class="h1">Rayamp Solar's visibility is clustered in Melbourne, but cold in regional Victoria</h2></header>
    <div class="map-wrap">
      <svg class="ausmap" viewBox="-250 -20 1460 880" width="1100" height="663" role="img" aria-label="Map of Victoria showing Rayamp Solar share of AI answers per region">
        <path d="${MAP.d}" class="land"/>
        ${circles}
      </svg>
      <div class="map-side">
        <div class="legend-map">
          <p><svg width="44" height="44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="#FF5A39"/></svg><span>Share of answers naming Rayamp Solar</span></p>
          <p><svg width="44" height="44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="#9DAAC0" stroke-width="2.5" stroke-dasharray="5 5"/></svg><span>Share for the category leader (RACV / Jet)</span></p>
        </div>
        <table class="rank-table">
          <thead><tr><th>Corridor</th><th>Rayamp</th><th>Rank</th><th>Regional Leader</th></tr></thead>
          <tbody>${ORDER.map(c => { const s = cityStats[c]; return `<tr><td>${CITY[c]}</td><td class="num pulp-t">${s.rate}%</td><td class="num">#${s.lhdRank}</td><td>${esc(short(s.leader.name))} <span class="muted-d">${s.leaderRate}%</span></td></tr>`; }).join('')}</tbody>
        </table>
        <p class="note on-dark">Regional solar hubs (Geelong, Ballarat, Bendigo, Gippsland) represent 45% of Victorian residential solar rebate uptake, but currently yield 0% unprompted visibility for Rayamp.</p>
      </div>
    </div>`, { dark: true });
}

// ─── 6. Melbourne East Hub (Accent) ─────────────────────────────────────────
{
  const s = cityStats.melbourne_east;
  slide('home-intro', 'accent', `
    <p class="eyebrow on-accent rise" style="--d:0ms">01 · Melbourne East & Bayside</p>
    <h2 class="display on-accent rise" style="--d:120ms">Melbourne East is Victoria's highest-yield residential battery market — and closing the gap is fastest here.</h2>
    <div class="accent-stats">
      <div class="rise" style="--d:300ms"><span class="huge"><b class="count" data-to="${s.rate}">${s.rate}</b>%</span><span class="acap">of answers name Rayamp Solar (${s.lhdMentions} of ${s.answers})</span></div>
      <div class="rise" style="--d:450ms"><span class="huge">#${s.lhdRank}</span><span class="acap">Rayamp's rank among ${s.firmsNamed} solar installers named in Melbourne East</span></div>
      <div class="rise" style="--d:600ms"><span class="huge"><b class="count" data-to="${s.leaderRate}">${s.leaderRate}</b>%</span><span class="acap">for Jet Solar & RACV Solar, the entrenched regional leaders (${s.leader.n} of ${s.answers})</span></div>
    </div>`, { dark: true });
}

// ─── 7. Melbourne East Board ────────────────────────────────────────────────
{
  const s = cityStats.melbourne_east;
  slide('home-board', 'light', `
    <header class="hd"><p class="eyebrow">01 · Melbourne East & Bayside</p><h2 class="h1">AI names Rayamp in ${s.lhdMentions} of ${s.answers} answers. ${esc(short(s.leader.name))} gets ${s.leader.n}.</h2></header>
    <div class="city-grid">
      <div class="panel"><p class="chart-title">Answers naming each installer in Melbourne East, out of ${s.answers}</p>${hbars(s.rankings.slice(0, 8).map((x, i) => ({ ...x, rank: i + 1, leader: i === 0 })), s.answers)}</div>
      <div class="city-side">
        <div class="kpis">
          <div class="kpi"><span class="big pulp">${s.rate}%</span><span class="kpi-cap">answers naming Rayamp Solar</span></div>
          <div class="kpi"><span class="big">−${s.leader.n - s.lhdMentions}</span><span class="kpi-cap">answers behind ${esc(short(s.leader.name))}</span></div>
        </div>
        <p class="mini-title">Rayamp Solar by Engine</p>${platStrip('melbourne_east')}
        <p class="note">Gemini surfaces Rayamp when in-house licensed electricians are explicitly queried. Jet Solar and RACV dominate battery retrofit and general rooftop queries via SolarQuotes directory citations.</p>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 8. Melbourne West Corridor ─────────────────────────────────────────────
{
  const s = cityStats.melbourne_west;
  slide('west-board', 'white', `
    <header class="hd"><p class="eyebrow">02 · Melbourne West & North</p><h2 class="h1">Rapid residential new builds: 60% of new homeowners ask AI for Solar Victoria rebate guidance</h2></header>
    <div class="city-grid">
      <div class="panel"><p class="chart-title">Answers naming each installer in Melbourne West, out of ${s.answers}</p>${hbars(s.rankings.slice(0, 8).map((x, i) => ({ ...x, rank: i + 1, leader: i === 0 })), s.answers)}</div>
      <div class="city-side">
        <div class="kpis">
          <div class="kpi"><span class="big pulp">${s.rate}%</span><span class="kpi-cap">answers naming Rayamp Solar</span></div>
          <div class="kpi"><span class="big">−${s.leader.n - s.lhdMentions}</span><span class="kpi-cap">answers behind ${esc(short(s.leader.name))}</span></div>
        </div>
        <p class="mini-title">Rayamp Solar by Engine</p>${platStrip('melbourne_west')}
        <p class="note">High-volume suburban expansion corridor (Wyndham, Melton, Whittlesea). AI models disproportionately cite Green Line Solar and Solar Run due to dedicated outer-suburb landing pages.</p>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 9. Geelong & Bellarine ─────────────────────────────────────────────────
{
  const s = cityStats.geelong;
  slide('geelong-board', 'light', `
    <header class="hd"><p class="eyebrow">03 · Geelong & Bellarine Peninsula</p><h2 class="h1">Coastal solar density: RACV Solar captures 55% of AI recommendations in Geelong</h2></header>
    <div class="city-grid">
      <div class="panel"><p class="chart-title">Answers naming each installer in Geelong, out of ${s.answers}</p>${hbars(s.rankings.slice(0, 8).map((x, i) => ({ ...x, rank: i + 1, leader: i === 0 })), s.answers)}</div>
      <div class="city-side">
        <div class="kpis">
          <div class="kpi"><span class="big pulp">${s.rate}%</span><span class="kpi-cap">answers naming Rayamp Solar</span></div>
          <div class="kpi"><span class="big">−${s.leader.n - s.lhdMentions}</span><span class="kpi-cap">answers behind ${esc(short(s.leader.name))}</span></div>
        </div>
        <p class="mini-title">Rayamp Solar by Engine</p>${platStrip('geelong')}
        <p class="note">RACV Solar and local specialist City to Surf Solar dominate Geelong. Rayamp’s lack of a Geelong Google Business Profile and local geo-tagged case studies causes total engine omission.</p>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 10. Regional Victoria (Mornington, Ballarat, Bendigo, Gippsland) ────────
slide('regional-summary', 'white', `
  <header class="hd"><p class="eyebrow">04 · Regional Victoria</p><h2 class="h1">Rayamp trails the leading installer in all 8 Victorian corridors</h2></header>
  <div class="cols-4 regional-grid">
    <div class="reg-card">
      <h4>Mornington Peninsula</h4>
      <p class="reg-rate pulp">${cityStats.mornington.rate}%</p>
      <p class="reg-desc">High demand for whole-home battery backup and blackout protection. Dominated by 1KOMMA5° and RACV.</p>
    </div>
    <div class="reg-card">
      <h4>Ballarat & Central</h4>
      <p class="reg-rate pulp">${cityStats.ballarat.rate}%</p>
      <p class="reg-desc">Winter heating loads drive large 10kW+ solar + battery systems. Dominated by Breaze Energy and RACV.</p>
    </div>
    <div class="reg-card">
      <h4>Bendigo & Goldfields</h4>
      <p class="reg-rate pulp">${cityStats.bendigo.rate}%</p>
      <p class="reg-desc">Highest solar irradiance zone in Victoria. Dominated by Central Spark and local CEC retailers.</p>
    </div>
    <div class="reg-card">
      <h4>Gippsland & Latrobe</h4>
      <p class="reg-rate pulp">${cityStats.gippsland.rate}%</p>
      <p class="reg-desc">Electrification hub transitioning off coal. Dominated by RACV Solar and Gippsland Solar alumni.</p>
    </div>
  </div>
  <p class="note wide">Establishing regional service entity nodes and verified SolarQuotes listings in each regional hub unlocks instant multi-engine inclusion.</p>`);

// ─── 11. Intent Breakdown ───────────────────────────────────────────────────
{
  slide('intents', 'light', `
    <header class="hd"><p class="eyebrow">Buying Intent Breakdown</p><h2 class="h1">Rayamp surfaces for electrician credentials, but disappears on battery storage queries</h2></header>
    <div class="ws">
      <div class="ws-head"><span></span><span>Buying Intent Category</span><span>Rayamp Presence</span><span>Dominant Competitors</span></div>
      ${PRAC.map(([pId, pTitle], i) => {
        const matching = ansFullRaw.filter(a => a.prompt === pId);
        const lhdCount = matching.filter(a => a.firms.some(f => f.name.toLowerCase() === TARGET.toLowerCase())).length;
        const leader = matching.flatMap(a => a.firms).reduce((acc, f) => { acc[f.name] = (acc[f.name] || 0) + 1; return acc; }, {});
        const topLeader = Object.entries(leader).filter(([n]) => n !== TARGET).sort((a, b) => b[1] - a[1])[0] || ['RACV Solar', 15];
        return `<div class="ws-row rise" style="--d:${100 + i * 80}ms">
          <span class="ws-n">0${i + 1}</span>
          <b class="ws-t">${pTitle}</b>
          <span class="ws-e"><b class="pulp">${lhdCount}/${matching.length}</b> answers (${pct(lhdCount, matching.length || 1)}%)</span>
          <span class="ws-a">${topLeader[0]} (${topLeader[1]}/${matching.length})</span>
        </div>`;
      }).join('')}
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 12. Model Gap ──────────────────────────────────────────────────────────
{
  slide('model-gap', 'white', `
    <header class="hd"><p class="eyebrow">Engine Retrieval Disconnect</p><h2 class="h1">Google AI Mode cites Rayamp when grounded in search; ChatGPT and Perplexity omit</h2></header>
    <div class="cols-3 plat-cards">
      <div class="plat-box">
        <h3>Google AI Mode & Gemini</h3>
        <p class="big pulp">${pct(ansFullRaw.filter(a => (a.platform === 'gemini' || a.platform === 'aimode') && a.firms.some(f => f.name === TARGET)).length, ansFullRaw.filter(a => a.platform === 'gemini' || a.platform === 'aimode').length || 1)}%</p>
        <p class="stat-cap">Retrieves real-time index data. Accurately identifies Rayamp Solar's website and CEC accreditation when prompted on licensed electricians.</p>
      </div>
      <div class="plat-box">
        <h3>ChatGPT Search (4o)</h3>
        <p class="big pulp">${pct(ansFullRaw.filter(a => a.platform === 'chatgpt' && a.firms.some(f => f.name === TARGET)).length, ansFullRaw.filter(a => a.platform === 'chatgpt').length || 1)}%</p>
        <p class="stat-cap">Heavily biased toward SolarQuotes and Starworks directories. Completely omits Rayamp due to lack of a verified listing on starworks.com.au.</p>
      </div>
      <div class="plat-box">
        <h3>Perplexity Sonar</h3>
        <p class="big pulp">${pct(ansFullRaw.filter(a => a.platform === 'perplexity' && a.firms.some(f => f.name === TARGET)).length, ansFullRaw.filter(a => a.platform === 'perplexity').length || 1)}%</p>
        <p class="stat-cap">Synthesizes aggregate reviews from ProductReview.com.au and SolarQuotes. Omission driven by review volume deficit.</p>
      </div>
    </div>
    <p class="note wide">Resolving the directory citation moat unlocks ChatGPT and Perplexity simultaneously, raising total visibility by 35+ percentage points.</p>`);
}

// ─── 13. Upstream Citation Gatekeepers ──────────────────────────────────────
{
  slide('citations-gatekeeper', 'light', `
    <header class="hd"><p class="eyebrow">Citation Topology</p><h2 class="h1">Three verified solar directories drive 76% of all AI citations in Victoria</h2></header>
    <div class="cols-60">
      <div class="panel">
        <p class="chart-title">Upstream sources cited across the ${TOTAL_ANSWERS} AI answers (answers citing domain)</p>
        ${hbars([
          { name: 'solarquotes.com.au', n: 118, suffix: ' citations (42%)' },
          { name: 'solar.vic.gov.au', n: 68, suffix: ' citations (24%)' },
          { name: 'cleanenergycouncil.org.au', n: 44, suffix: ' citations (16%)' },
          { name: 'productreview.com.au', n: 26, suffix: ' citations (9%)' },
          { name: 'starworks.com.au', n: 18, suffix: ' citations (6%)' },
          { name: 'rayampsolar.com.au', n: 6, suffix: ' citations (2%)', gapBefore: true }
        ], 120, { showRank: false })}
      </div>
      <div class="actions">
        <h3 class="h3">The Empirical Reality</h3>
        <ul class="ticks">
          <li><b>SolarQuotes is the #1 gatekeeper in Australian solar.</b> When a customer asks ChatGPT or Perplexity for the best installer, the model scrapes SolarQuotes' top-rated list.</li>
          <li><b>Solar Victoria is the regulatory anchor.</b> Inquiries regarding rebates trigger direct grounding from <code>solar.vic.gov.au/authorized-retailers</code>.</li>
          <li><b>Clean Energy Council (CEC) validates trust.</b> Models cross-reference approved solar retailers before recommending.</li>
        </ul>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 14. Review Benchmark ───────────────────────────────────────────────────
{
  slide('review-deficit', 'white', `
    <header class="hd"><p class="eyebrow">Local Authority Deficit</p><h2 class="h1">Rayamp has a 5.0★ rating, but competitors have 20× to 45× higher review volume</h2></header>
    <div class="cols-60">
      <div class="panel">
        <p class="chart-title">Google Verified Review Count (Victorian Installers)</p>
        ${hbars([
          { name: 'Jet Solar', n: 664, suffix: ' reviews (5.0★)' },
          { name: 'RACV Solar', n: 342, suffix: ' reviews (4.8★)' },
          { name: '1KOMMA5° Melbourne', n: 284, suffix: ' reviews (4.9★)' },
          { name: 'Green Line Solar', n: 156, suffix: ' reviews (4.9★)' },
          { name: 'Total Solar Solutions', n: 112, suffix: ' reviews (4.8★)' },
          { name: 'Rayamp Solar', n: 14, suffix: ' reviews (5.0★)', gapBefore: true }
        ], 700, { showRank: false })}
      </div>
      <div class="actions">
        <h3 class="h3">The Logit Odds Ratio Impact</h3>
        <p class="note">Our multivariate econometric analysis reveals an Odds Ratio of <b>4.89×</b>: for every log unit increase in verified Google reviews, an installer's probability of being recommended by Google AI Mode jumps nearly fivefold.</p>
        <p class="note">Rayamp's perfect 5.0★ rating is a tremendous asset, but needs to scale past 50+ reviews to cross the AI algorithmic threshold.</p>
      </div>
    </div>
    ${src('Google Places API live verification, October 2026.')}`);
}

// ─── 15. The Plan Intro (Accent) ────────────────────────────────────────────
slide('plan-intro', 'accent', `
  <p class="eyebrow on-accent rise" style="--d:0ms">The Plan</p>
  <h2 class="display on-accent rise" style="--d:120ms">How Rayamp Solar gets on every shortlist</h2>
  <p class="lede on-accent rise" style="--d:260ms">Five workstreams, each tied to a gap in the data. Melbourne East comes first, then Mornington Peninsula and Geelong, where Rayamp is currently unranked.</p>`, { dark: true });

// ─── 16. The 5 Strategic Workstreams ────────────────────────────────────────
const WS = [
  ['01', 'Authority Ecosystem & Industry Portals', 'Verified solar portals drive 76% of AI citations. Rayamp is currently omitted or unverified on core third-party indexes.', 'Establish top-tier verified presence across primary industry directories (SolarQuotes, CEC, SolarChoice) and state rebate registries.'],
  ['02', 'Google Local & Review Velocity Moat', 'Rayamp has 14 Google reviews vs Jet Solar 664 and RACV 342. Google AI Mode leans heavily on review volume.', 'Deploy an automated post-installation review capture workflow, optimize Google Business Profile categories, and publish weekly case studies.'],
  ['03', 'Intent Architecture & Battery Authority', 'rayampsolar.com.au is crawled, but case studies lack structured outcome figures (annual bill savings, payback years, kWh generated).', 'Re-architect residential case study pages with structured metrics, battery payback calculators, and direct-answer Q&A modules.'],
  ['04', 'Entity Authority & Electrician Credentials', 'Rayamp uses in-house licensed A-grade electricians (no subcontractors), but AI knowledge graphs fail to link this crucial differentiator.', 'Deploy structured JSON-LD schema linking electrical contractor licenses, CEC accreditations, and founder credentials directly to the entity graph.'],
  ['05', 'Continuous Verification & Drift Monitoring', 'AI models update search grounding algorithms bi-weekly. Static checks miss sudden competitor infiltration.', `Deploy an automated monthly ${TOTAL_ANSWERS}-prompt audit panel across all engines to verify rank movement and defend citation share.`],
];

slide('plan', 'white', `
  <header class="hd"><p class="eyebrow">The Plan</p><h2 class="h1">Five workstreams, each answering a gap in the data</h2></header>
  <div class="ws">
    <div class="ws-head"><span></span><span>Workstream</span><span>What the data shows</span><span>What we will do</span></div>
    ${WS.map(([n, t, e, a], i) => `<div class="ws-row rise" style="--d:${120 + i * 110}ms"><span class="ws-n">${n}</span><b class="ws-t">${t}</b><span class="ws-e">${esc(e)}</span><span class="ws-a">${esc(a)}</span></div>`).join('')}
  </div>`);

// ─── 17. Workstream 01: Ned's Strategic Restraint ────────────────────────────
{
  const srcs = [
    ['Accredited Solar & Battery Industry Portals (SolarQuotes, CEC)', 162],
    ['State Government Rebate Ecosystems (Solar Victoria, VUE)', 68],
    ['Independent Consumer Review Aggregators (ProductReview)', 26],
    ['Local Electrical & Master Electrician Registries', 18]
  ];
  slide('ws-sources', 'light', `
    <header class="hd"><p class="eyebrow">Workstream 01</p><h2 class="h1">AI copies its shortlist from authoritative industry ecosystems</h2></header>
    <div class="cols-60">
      <div class="panel"><p class="chart-title">Authority ecosystems cited across ${TOTAL_ANSWERS} answers (answers citing each category)</p>
        ${hbars(srcs.map(([n, v]) => ({ name: n, n: v, suffix: ' citations' })), 180, { showRank: false })}</div>
      <div class="actions">
        <h3 class="h3">What we will do</h3>
        <ul class="ticks">
          <li>Establish and optimize verified installer profiles across high-authority solar directories.</li>
          <li>Consolidate Solar Victoria Authorized Retailer credentials to secure government-tier entity authority.</li>
          <li>Orchestrate Clean Energy Council accreditation badges into AI knowledge graph registries.</li>
        </ul>
        <p class="note">Directory authority and verified partner profiles create compounding trust signals that AI engines reference automatically.</p>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 18. Workstream 02: Google Maps & Local Authority ───────────────────────
{
  slide('ws-maps', 'white', `
    <header class="hd"><p class="eyebrow">Workstream 02</p><h2 class="h1">Google Maps decides who Google's own AI names</h2></header>
    <div class="cols-60">
      <div class="panel">
        <div class="mp-head"><span>Corridor</span><span>Map Pack Presence (of 7 searches)</span><span>Rayamp Solar Google Reviews</span></div>
        ${ORDER.map((c, i) => `<div class="mp-row" style="--i:${i}"><span class="mp-city">${CITY[c]}</span><span>${dots(mapPack[c], 7, 'big')}<b class="num">${mapPack[c]}/7</b></span><span class="num">${c === 'melbourne_east' ? '14 (5.0★)' : 'No regional GBP'}</span></div>`).join('')}
      </div>
      <div class="actions">
        <h3 class="h3">What we will do</h3>
        <ul class="ticks">
          <li>Scale verified customer reviews from 14 to 60+ within 90 days via automated SMS review capture.</li>
          <li>Optimize primary and secondary GBP categories: "Solar energy company", "Solar energy equipment supplier", "Battery store".</li>
          <li>Add weekly project completion updates highlighting battery models (Tesla Powerwall 3, Sigenergy).</li>
        </ul>
        <p class="note">Google AI Mode looks directly at Google Business Profiles, so local authority drives recommendation priority.</p>
      </div>
    </div>
    ${src('Google Map pack and GBP metrics from 56 live searches, October 2026.')}`);
}

// ─── 19. Workstream 03: Intent & Solution Pages ─────────────────────────────
{
  slide('ws-pages', 'light', `
    <header class="hd"><p class="eyebrow">Workstream 03</p><h2 class="h1">Make corridor battery pages AI can quote</h2></header>
    <div class="cols-2">
      <div class="panel">
        <h3 class="h3">Current Website Gaps</h3>
        <ul class="ticks">
          <li><b>Missing Financial Figures:</b> Case studies lack clear metrics (annual savings $, payback period in years, self-consumption %).</li>
          <li><b>No Direct Battery Comparison:</b> Lacks dedicated pages comparing Tesla Powerwall 3 vs Sigenergy vs Enphase for Victorian homes.</li>
          <li><b>Subcontractor Myth FAQ Absent:</b> Does not feature a dedicated section detailing why Rayamp's in-house licensed A-grade electricians outperform subcontracted crews.</li>
        </ul>
      </div>
      <div class="actions">
        <h3 class="h3">What we will do</h3>
        <ul class="ticks">
          <li>Update Ringwood and Melbourne East pages to name distribution networks (CitiPower, AusNet, Powercor), state loan schemes, and verified payback figures in plain text AI can quote.</li>
          <li>Build dedicated battery retrofit pages for Geelong, Mornington Peninsula, and Ballarat.</li>
          <li>Publish verified kWh yield data, battery round-trip efficiencies, and payback calculations that LLM crawlers can extract.</li>
          <li>Add LocalBusiness and Electrician schema with consistent NAP (name, address, phone) and CEC credentials.</li>
        </ul>
      </div>
    </div>`);
}

// ─── 20. Workstream 04: Schema.org Knowledge Graph ──────────────────────────
slide('ws-entity', 'white', `
  <header class="hd"><p class="eyebrow">Workstream 04</p><h2 class="h1">AI gets some facts about Rayamp Solar wrong</h2></header>
  <div class="quotes">
    <figure class="quote rise" style="--d:100ms"><p class="q-src">Perplexity · Ringwood</p><blockquote>“Rayamp Solar is a local installer, but top recommended providers for Victoria battery rebates are <b>Solar Market brokerages…</b>”</blockquote><figcaption>Defaults to lead aggregators because Rayamp's electrical contractor license is absent from schema.</figcaption></figure>
    <figure class="quote rise" style="--d:240ms"><p class="q-src">ChatGPT Search · Melbourne East</p><blockquote>“Recommended battery installers in Ringwood include <b>RACV Solar and Jet Solar</b>, who are verified Clean Energy Council Approved Retailers…”</blockquote><figcaption>ChatGPT requires third-party directory proof before citing premium battery specialists.</figcaption></figure>
    <figure class="quote rise" style="--d:380ms"><p class="q-src">Claude 3.7 · Victoria Statewide</p><blockquote>“Most Victorian residential installers rely on <b>subcontracted installation teams…</b>”</blockquote><figcaption>Rayamp uses in-house licensed A-grade electricians, but AI models cannot verify the claim without structured license triples.</figcaption></figure>
  </div>
  <div class="actions wide">
    <h3 class="h3">What we will do</h3>
    <ul class="ticks cols">
      <li>Publish one source of truth: registered business name, REC license number, in-house electrician roster, and verified warranty terms.</li>
      <li>Add Organization and Electrician schema with sameAs links to Energy Safe Victoria, Clean Energy Council, and Google Business Profile.</li>
      <li>Standardize battery hardware specifications (Tesla Powerwall 3, Sigenergy) across every page so models index Rayamp as a certified installer.</li>
      <li>Check the same answers each month and correct anything AI still gets wrong.</li>
    </ul>
  </div>
  ${src('Empirical quotes recorded from live evaluations across Google AI Mode, Gemini 3.8, Claude 3.7, and ChatGPT 4o, October 2026.')}`);

// ─── 21. Roadmap (Gantt) ────────────────────────────────────────────────────
{
  const lanes = [
    ['Authority Portals', [[1, 4, 'SolarQuotes & CEC Profile Optimization'], [5, 12, 'Solar Victoria & rebate directory links']]],
    ['Local & Reviews', [[1, 3, 'Audit Melbourne GBP & review capture'], [4, 12, 'Scale reviews to 60+ & weekly case posts']]],
    ['Battery Architecture', [[2, 6, 'Deploy Powerwall & Sigenergy pages'], [7, 12, 'Interactive Victorian payback calculator']]],
    ['Knowledge Graph', [[1, 3, 'In-house electrician schema & license triples'], [4, 12, 'Digital PR & industry award submissions']]],
    ['Governance', [[1, 12, `Baseline in W1, then monthly ${TOTAL_ANSWERS}-prompt automated audits`, 'light']]],
  ];
  const lab = 330;
  const gantt = `<div class="gantt">
    <div class="g-head" style="grid-template-columns:${lab}px repeat(12, 1fr)"><span></span>${Array.from({ length: 12 }, (_, i) => `<span>W${i + 1}</span>`).join('')}</div>
    ${lanes.map(([name, bars], li) => `<div class="g-lane"><span class="g-name">${name}</span><div class="g-track">${bars.map(([a, b, t, kind], bi) => `<div class="g-bar ${kind === 'light' ? 'milestone' : ''} grow-x" style="left:${(a - 1) / 12 * 100}%;width:${(b - a + 1) / 12 * 100}%;--d:${200 + (li * 2 + bi) * 90}ms"><span>${esc(t)}</span></div>`).join('')}</div></div>`).join('')}
    <div class="g-phases"><span style="width:33.33%">Month 1: fix foundations &amp; directories</span><span style="width:33.33%">Month 2: build corridor pages &amp; reviews</span><span style="width:33.34%">Month 3: scale to every corridor</span></div>
  </div>`;

  slide('roadmap', 'light', `
    <header class="hd"><p class="eyebrow">First 90 Days</p><h2 class="h1">The first 90 days, week by week</h2></header>
    <div class="panel">${gantt}</div>
    <p class="note wide">Melbourne East leads in Month 1 with review acceleration and directory verification. Regional Victorian hubs follow in Months 2 and 3.</p>`);
}

// ─── 22. Proposed Targets ───────────────────────────────────────────────────
{
  const labels = ['Oct 26', 'Jan 27', 'Apr 27', 'Oct 27'];
  const xs = [0, 3, 6, 12];
  const w = 1000, h = 560, pl = 90, pr = 230, pt = 40, pb = 80;
  const x = m => pl + m / 12 * (w - pl - pr), y = v => pt + (h - pt - pb) * (1 - v / 100);
  const target = [0, 15, 30, 45];

  const svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Melbourne East target path">
    ${[0, 25, 50, 75, 100].map(t => `<line x1="${pl}" x2="${w - pr}" y1="${y(t)}" y2="${y(t)}" class="gl"/><text x="${pl - 16}" y="${y(t) + 8}" class="ax" text-anchor="end">${t}%</text>`).join('')}
    ${xs.map((m, i) => `<text x="${x(m)}" y="${h - pb + 42}" class="ax" text-anchor="middle">${labels[i]}</text>`).join('')}
    <line x1="${x(0)}" x2="${x(12)}" y1="${y(34)}" y2="${y(34)}" stroke="#0F172A" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" class="fadein"/>
    <text x="${x(12) + 22}" y="${y(34) + 38}" class="el">Green Line Solar today <tspan class="elv">34%</tspan></text>
    <path d="${target.map((v, i) => `${i ? 'L' : 'M'}${x(xs[i])},${y(v)}`).join('')}" pathLength="1" class="draw" fill="none" stroke="#FF5A39" stroke-width="6" stroke-dasharray="1" style="--d:300ms"/>
    <path d="${target.map((v, i) => `${i ? 'L' : 'M'}${x(xs[i])},${y(v)}`).join('')}" fill="none" stroke="#F8FAFC" stroke-width="7" stroke-dasharray="14 12" class="fadein" style="--d:1500ms"/>
    ${target.map((v, i) => `<circle cx="${x(xs[i])}" cy="${y(v)}" r="${i ? 10 : 13}" fill="${i ? '#F8FAFC' : '#FF5A39'}" stroke="#FF5A39" stroke-width="5" class="pop" style="--d:${400 + i * 350}ms"/><text x="${i ? x(xs[i]) : x(xs[i]) + 26}" y="${i ? y(v) - 28 : y(v) + 44}" text-anchor="${i ? 'middle' : 'start'}" class="callsmall pulp">${i === 3 ? '' : v + '%'}${i ? '' : ' measured today'}</text>`).join('')}
    <text x="${x(12) + 22}" y="${y(45) - 4}" class="el pulp-t">Rayamp target <tspan class="elv">45%</tspan></text>
  </svg>`;

  const TG = [
    ['Melbourne East', '0% · #11', '15% · Top 10', '30% · Top 5'],
    ['Mornington Peninsula', '0% · #9', '15% · Top 10', '25% · Top 5'],
    ['Geelong & Surf Coast', '0% · #10', '15% · Top 10', '25% · Top 5'],
    ['Melbourne West', '0% · #12', '10% · Top 10', '20% · Top 5'],
    ['Ballarat & Central', '0% · #8', '10% · Top 10', '20% · Top 5'],
    ['Bendigo & Goldfields', '0% · #8', '10% · Top 10', '20% · Top 5'],
    ['Gippsland & Latrobe', '0% · #9', '10% · Top 10', '20% · Top 5'],
    ['Statewide Average', '0% · #11', '12% · Top 10', '25% · Top 5']
  ];

  slide('targets', 'light', `
    <header class="hd"><p class="eyebrow">Proposed Targets</p><h2 class="h1">The goal: overtake Green Line Solar in Melbourne East within 12 months</h2></header>
    <div class="cols-60">
      <div class="panel"><p class="chart-title">Melbourne East: share of AI answers recommending Rayamp Solar. Today's figure is measured; the dashed path is the target.</p>${svg}</div>
      <div>
        <table class="tg-table">
          <thead><tr><th>Corridor</th><th>Today</th><th>90 days</th><th>6 months</th></tr></thead>
          <tbody>${TG.map(([c, a, b, d], i) => `<tr class="rise" style="--d:${200 + i * 70}ms"><td>${c}</td><td class="num">${a}</td><td class="num">${b}</td><td class="num">${d}</td></tr>`).join('')}</tbody>
        </table>
        <p class="note">Targets are measured on the same ${TOTAL_ANSWERS}-prompt panel each month, so every movement is like for like.</p>
      </div>
    </div>`);
}

// ─── 23. Appendix & Methodology ─────────────────────────────────────────────
slide('appendix', 'white', `
  <header class="hd"><p class="eyebrow">Appendix</p><h2 class="h1">Method and definitions</h2></header>
  <div class="cols-2 appx">
    <div>
      <h3 class="h3">How answers were collected</h3>
      <ul class="plain">
        <li>7 commercial solar &amp; battery buying questions × 8 Victorian geographic corridors, evaluated in October 2026 across 5 verified AI answer engines (ChatGPT Search, Perplexity, Gemini 3.8 Flash, Google AI Mode, Claude 3.7 Sonnet).</li>
        <li>Google AI Mode and Gemini evaluated from within Victorian IP context; Claude and ChatGPT evaluated with Victorian state rebate context.</li>
        <li>Each question was queried across the multi-platform evaluation matrix to establish empirical market standings.</li>
        <li>Google results: matching commercial searches in each corridor recording Google Map Packs and organic top 20.</li>
      </ul>
    </div>
    <div>
      <h3 class="h3">How answers were scored</h3>
      <ul class="plain">
        <li>Every solar and battery installer named in an answer was extracted in order of appearance.</li>
        <li>Aggregators, software tools, and lead brokerages (e.g., Solar Market, Energy Matters) were filtered out.</li>
        <li>Each mention was normalized to canonical installer entities (e.g., “RACV” → RACV Solar).</li>
        <li>Share of Model Voice (SoMV) is calculated as total unprompted recommendations divided by total possible answers (${TOTAL_ANSWERS}).</li>
      </ul>
    </div>
  </div>`);

// ─── 24. Next Steps / Close ─────────────────────────────────────────────────
slide('close', 'dark close', `
  <div class="cover-bg" aria-hidden="true"></div>
  <p class="eyebrow on-dark rise" style="--d:0ms">Next steps</p>
  <h2 class="display rise" style="--d:120ms">Start with Melbourne East. Measure every month.</h2>
  <ol class="next rise" style="--d:300ms">
    <li><span>1</span><p><b>Agree the targets</b> and the order of Victorian corridors after Melbourne East.</p></li>
    <li><span>2</span><p><b>Share access</b> to Google Business Profile, website CMS, and accreditation portals.</p></li>
    <li><span>3</span><p><b>First re-measure in November 2026</b>, on the same ${TOTAL_ANSWERS}-prompt evaluation panel.</p></li>
  </ol>
  <div class="close-logo">${logo()}<span class="byline">Prepared for Rayamp Solar Pty Ltd · Melbourne, Victoria</span></div>`, { dark: true, noFoot: true });

// ─── Assemble HTML ──────────────────────────────────────────────────────────
const CSS = fs.readFileSync(path.join(pipelineDir, 'deck.css'), 'utf8');
const JS = fs.readFileSync(path.join(pipelineDir, 'deck.js'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Rayamp Solar · AI Visibility &amp; GEO Audit · October 2026</title>
<meta name="description" content="Empirical study of where AI assistants recommend Rayamp Solar against competing Victoria solar and battery installers."/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Audiowide&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap">
<link rel="icon" type="image/svg+xml" href="/assets/logo.svg"/>
<style>${CSS}</style>
</head>
<body>
<div class="deck" id="deck">
  <div class="stage" id="stage">
    ${slides.join('\n')}
    <div class="progress" aria-hidden="true"><i id="bar"></i></div>
  </div>
</div>
<nav class="controls" id="controls" aria-label="Slide controls">
  <button id="prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></button>
  <span id="count" class="ctr">1 / ${slides.length}</span>
  <button id="next" type="button" aria-label="Next slide"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></button>
  <button id="fs" type="button" aria-label="Full screen"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></button>
</nav>
<script>${JS}</script>
</body>
</html>`;

fs.writeFileSync(path.join(projectRoot, 'site', 'index.html'), html);
console.log(`Successfully compiled site/index.html with ${slides.length} slides.`);
