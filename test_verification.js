import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTests() {
  console.log('========================================================================');
  console.log('RUNNING AUTOMATED VERIFICATION SUITE FOR RAYAMP SOLAR');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
    }
  }

  // 1. Check Artifacts & Pipeline Outputs
  console.log('--- 1. Pipeline Artifact Verification ---');
  const ansExists = fs.existsSync(path.join(__dirname, 'pipeline', 'ans_full.json'));
  assert(ansExists, 'pipeline/ans_full.json exists');
  if (ansExists) {
    const ans = JSON.parse(fs.readFileSync(path.join(__dirname, 'pipeline', 'ans_full.json'), 'utf8'));
    assert(ans.length >= 200, `pipeline/ans_full.json contains empirical answers (found ${ans.length})`);
  }

  const metricsExists = fs.existsSync(path.join(__dirname, 'pipeline', 'metrics.json'));
  assert(metricsExists, 'pipeline/metrics.json exists');
  if (metricsExists) {
    const m = JSON.parse(fs.readFileSync(path.join(__dirname, 'pipeline', 'metrics.json'), 'utf8'));
    assert(Object.keys(m.cities).length === 8, 'All 8 Victorian corridors modeled in metrics.json');
    assert(m.national?.somv !== undefined, 'Statewide SoMV calculated');
  }

  const indexExists = fs.existsSync(path.join(__dirname, 'site', 'index.html'));
  assert(indexExists, 'site/index.html (Tier 1 Deck) exists');
  if (indexExists) {
    const html = fs.readFileSync(path.join(__dirname, 'site', 'index.html'), 'utf8');
    assert(html.includes('id="stage"'), 'index.html contains #stage element');
    assert(html.includes('id="bar"'), 'index.html contains #bar progress element');
    assert(html.includes('id="count"'), 'index.html contains #count slide counter');
    assert(html.includes('id="controls"'), 'index.html contains #controls element');
    assert(html.includes('Rayamp Solar'), 'index.html contains Rayamp Solar brand copy');
    assert(html.includes('Accredited Solar &amp; Battery Industry Portals') || html.includes('Accredited Solar & Battery Industry Portals'), 'Slide 22 contains Ned strategic restraint authority tiers');
  }

  const techExists = fs.existsSync(path.join(__dirname, 'site', 'technical.html'));
  assert(techExists, 'site/technical.html (Tier 2 Dossier) exists');
  if (techExists) {
    const html = fs.readFileSync(path.join(__dirname, 'site', 'technical.html'), 'utf8');
    assert(html.includes('CLAIM-TO-PROOF VERIFICATION MATRIX'), 'technical.html contains 1:1 Claim-to-Proof Verification Matrix');
    assert(html.includes('Multivariate Logit'), 'technical.html contains Multivariate Logit specification');
    assert(html.includes('Odds Ratio'), 'technical.html contains econometric Odds Ratios');
    assert(html.includes('rayampsolar.com.au'), 'technical.html contains live crawl grounding telemetry');
  }

  // 2. HTTP Server Gated Access Control Test
  console.log('\n--- 2. Dual-PIN Server Access Control Verification ---');
  const testPort = 3891;
  process.env.PORT = testPort;
  process.env.CLIENT_PIN = '2026';
  process.env.INTERNAL_PIN = '9418';

  const serverProc = await import('./site/server.js');
  await new Promise(r => setTimeout(r, 600));

  const base = `http://localhost:${testPort}`;

  // Test Gatekeeper
  const gateRes = await fetch(`${base}/`);
  const gateHtml = await gateRes.text();
  assert(gateRes.status === 200, 'Gatekeeper returns HTTP 200 for unauthenticated request');
  assert(gateHtml.includes('Private page'), 'Gatekeeper displays minimalist "Private page" UI');
  assert(!gateHtml.includes('9418') && !gateHtml.includes('Client vs Internal'), 'Gatekeeper reveals zero internal role disclosures');

  // Test Invalid PIN
  const badAuthRes = await fetch(`${base}/api/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '0000', target: '/' })
  });
  assert(badAuthRes.status === 401, 'Invalid PIN returns HTTP 401 Unauthorized');

  // Test Client PIN (2026) for Root
  const clientAuthRes = await fetch(`${base}/api/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '2026', target: '/' })
  });
  const clientAuthData = await clientAuthRes.json();
  const clientCookie = clientAuthRes.headers.get('set-cookie');
  assert(clientAuthRes.status === 200 && clientAuthData.success, 'Client PIN (2026) authenticates successfully');
  assert(clientCookie && clientCookie.includes('rayamp_auth='), 'Client receives signed rayamp_auth cookie');

  // Test Client PIN accessing /technical (Must return 403 Forbidden)
  const clientTechAuth = await fetch(`${base}/api/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '2026', target: '/technical' })
  });
  assert(clientTechAuth.status === 403, 'Client PIN (2026) requesting /technical receives HTTP 403 Forbidden');

  const clientFetchTech = await fetch(`${base}/technical`, {
    headers: { 'Cookie': clientCookie }
  });
  assert(clientFetchTech.status === 403, 'Client Cookie attempting to access /technical receives HTTP 403 Forbidden');

  // Test Internal PIN (9418)
  const internalAuthRes = await fetch(`${base}/api/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '9418', target: '/technical' })
  });
  const internalCookie = internalAuthRes.headers.get('set-cookie');
  assert(internalAuthRes.status === 200, 'Internal PIN (9418) authenticates successfully');

  const internalFetchTech = await fetch(`${base}/technical`, {
    headers: { 'Cookie': internalCookie }
  });
  assert(internalFetchTech.status === 200, 'Internal PIN Cookie unlocks /technical with HTTP 200');

  const internalFetchRoot = await fetch(`${base}/`, {
    headers: { 'Cookie': internalCookie }
  });
  const internalRootHtml = await internalFetchRoot.text();
  assert(internalRootHtml.includes('id="tech-dossier-pill"'), 'Internal user receives floating Technical Dossier switch pill');

  console.log(`\n========================================================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log(`========================================================================\n`);

  serverProc.default?.close(() => {
    process.exit(passed === total ? 0 : 1);
  });
}

runTests().catch(err => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
