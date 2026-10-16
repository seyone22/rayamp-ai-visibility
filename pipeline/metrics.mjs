import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pipelineDir = path.join(projectRoot, 'pipeline');

export function computeMetrics() {
  const ansFullPath = path.join(pipelineDir, 'ans_full.json');
  if (!fs.existsSync(ansFullPath)) {
    console.log('ans_full.json does not exist yet.');
    return;
  }

  const ans = JSON.parse(fs.readFileSync(ansFullPath, 'utf8'));

  const REGIONS = ['melbourne_east', 'melbourne_west', 'geelong', 'mornington', 'ballarat', 'bendigo', 'gippsland', 'statewide_vic'];
  const PLAT = [...new Set(ans.map(a => a.platform))];
  const PROMPTS = [...new Set(ans.map(a => a.prompt))];
  const TARGET = 'Rayamp Solar';

  const out = {
    cities: {},
    national: {},
    platforms: PLAT,
    prompts: PROMPTS,
    totalSample: ans.length
  };

  const tally = list => {
    const t = {};
    for (const a of list) {
      a.firms.forEach((f, i) => {
        t[f.name] ??= { n: 0, pos: [], rec: 0 };
        t[f.name].n++;
        t[f.name].pos.push(i + 1);
        if (f.role === 'recommended') t[f.name].rec++;
      });
    }
    return t;
  };

  const rank = t => Object.entries(t).map(([name, v]) => ({
    name,
    n: v.n,
    rec: v.rec,
    avgPos: +(v.pos.reduce((a, b) => a + b, 0) / v.pos.length).toFixed(1)
  })).sort((a, b) => b.n - a.n || a.avgPos - b.avgPos);

  // Wilson score confidence interval
  function wilsonInterval(p, n, z = 1.96) {
    if (n === 0) return { lower: 0, upper: 0 };
    const denom = 1 + (z * z) / n;
    const center = (p + (z * z) / (2 * n)) / denom;
    const se = Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n) / denom;
    return {
      lower: Math.max(0, +(center - z * se).toFixed(4)),
      upper: Math.min(1, +(center + z * se).toFixed(4))
    };
  }

  // WVI
  function computeWVI(targetRank, stance) {
    if (!targetRank || stance === 'Not Mentioned') return 0;
    const stanceFactor = stance === 'Strongly Recommended' ? 1.0 : (stance === 'Neutral / Listed' ? 0.5 : -0.5);
    return +(stanceFactor / Math.log2(targetRank + 1)).toFixed(3);
  }

  for (const c of REGIONS) {
    const cs = ans.filter(a => a.city === c);
    const r = rank(tally(cs));
    const totalMentions = r.reduce((s, x) => s + x.n, 0);
    const targetIdx = r.findIndex(x => x.name.toLowerCase() === TARGET.toLowerCase());
    
    const byPlat = Object.fromEntries(PLAT.map(p => {
      const ps = cs.filter(a => a.platform === p);
      const rr = rank(tally(ps));
      return [p, {
        lhd: ps.filter(a => a.firms.some(f => f.name.toLowerCase() === TARGET.toLowerCase())).length,
        n: ps.length,
        leader: rr[0]?.name || 'RACV Solar',
        leaderN: rr[0]?.n || 0
      }];
    }));

    const byPrompt = Object.fromEntries(PROMPTS.map(p => {
      const ps = cs.filter(a => a.prompt === p);
      const rr = rank(tally(ps));
      return [p, {
        lhd: ps.filter(a => a.firms.some(f => f.name.toLowerCase() === TARGET.toLowerCase())).length,
        n: ps.length,
        leader: rr[0]?.name || 'RACV Solar',
        leaderN: rr[0]?.n || 0
      }];
    }));

    const top = r.slice(0, 6).map(x => x.name);
    if (!top.some(t => t.toLowerCase() === TARGET.toLowerCase())) top.push(TARGET);

    const matrix = Object.fromEntries(top.map(f => [
      f,
      Object.fromEntries(PLAT.map(p => [p, cs.filter(a => a.platform === p && a.firms.some(x => x.name.toLowerCase() === f.toLowerCase())).length]))
    ]));

    const cited = cs.filter(a => (a.sources || []).some(s => /rayampsolar\.com\.au/.test(s.domain || s.url || ''))).length;
    const srcCount = {};
    for (const a of cs) {
      for (const d of new Set((a.sources || []).map(s => s.domain).filter(Boolean))) {
        srcCount[d] = (srcCount[d] || 0) + 1;
      }
    }

    const targetN = targetIdx >= 0 ? r[targetIdx].n : 0;
    const somv = totalMentions > 0 ? +(targetN / totalMentions).toFixed(4) : 0;
    const wviList = cs.map(a => computeWVI(a.targetRank, a.stance));
    const meanWVI = wviList.length ? +(wviList.reduce((s, x) => s + x, 0) / wviList.length).toFixed(3) : 0;

    out.cities[c] = {
      n: cs.length,
      lhdMentions: targetN,
      totalMentions,
      somv,
      ci: wilsonInterval(somv, totalMentions || 1),
      wvi: meanWVI,
      rankPos: targetIdx >= 0 ? targetIdx + 1 : r.length + 1,
      totalFirms: r.length,
      leader: r[0]?.name || 'RACV Solar',
      leaderN: r[0]?.n || 0,
      leaderSomv: totalMentions > 0 ? +((r[0]?.n || 0) / totalMentions).toFixed(4) : 0,
      rankings: r,
      byPlatform: byPlat,
      byPrompt,
      matrix,
      citedAnswers: cited,
      topSources: Object.entries(srcCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
    };
  }

  // Aggregate Statewide
  const allMentions = rank(tally(ans));
  const totM = allMentions.reduce((s, x) => s + x.n, 0);
  const targetAllIdx = allMentions.findIndex(x => x.name.toLowerCase() === TARGET.toLowerCase());
  const targetTotN = targetAllIdx >= 0 ? allMentions[targetAllIdx].n : 0;
  const totSomv = totM > 0 ? +(targetTotN / totM).toFixed(4) : 0;

  out.national = {
    totalAnswers: ans.length,
    totalMentions: totM,
    lhdMentions: targetTotN,
    somv: totSomv,
    ci: wilsonInterval(totSomv, totM || 1),
    rankPos: targetAllIdx >= 0 ? targetAllIdx + 1 : allMentions.length + 1,
    leader: allMentions[0]?.name || 'RACV Solar',
    leaderN: allMentions[0]?.n || 0,
    leaderSomv: totM > 0 ? +((allMentions[0]?.n || 0) / totM).toFixed(4) : 0,
    rankings: allMentions.slice(0, 15)
  };

  fs.writeFileSync(path.join(pipelineDir, 'metrics.json'), JSON.stringify(out, null, 2));
  console.log('Successfully generated pipeline/metrics.json');

  // Also save answers.json (condensed for charts if needed)
  const answersCondensed = ans.map(a => ({
    city: a.city,
    prompt: a.prompt,
    platform: a.platform,
    firms: a.firms.map(f => f.name),
    targetMentioned: a.targetMentioned,
    targetRank: a.targetRank,
    stance: a.stance
  }));
  fs.writeFileSync(path.join(pipelineDir, 'answers.json'), JSON.stringify(answersCondensed, null, 2));
  console.log('Successfully generated pipeline/answers.json');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  computeMetrics();
}
