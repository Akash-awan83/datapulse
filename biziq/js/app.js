/* ═══════════════════════════════════════════════════════════
   DataPulse — Application Controller
   UI orchestration · Event handling · Page logic
═══════════════════════════════════════════════════════════ */

'use strict';

// ─── STATE ────────────────────────────────────────────────────
let APP = {
  analysisResult: null,
  csvData: null,
  isLoading: false
};

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initDragDrop();
  setStatus('ready');
});

// ─── NAVIGATION ──────────────────────────────────────────────
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });
}

function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  const btn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── STATUS DOT ──────────────────────────────────────────────
function setStatus(state) {
  const dot = document.getElementById('status-dot');
  if (!dot) return;
  dot.style.background = state === 'ready' ? '#10B981' : state === 'loading' ? '#F59E0B' : '#EF4444';
  dot.style.boxShadow = `0 0 6px ${dot.style.background}`;
  dot.title = state === 'ready' ? 'Ready' : state === 'loading' ? 'Analyzing...' : 'Error';
}

// ─── TOAST ───────────────────────────────────────────────────
let toastTimeout;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-msg');
  if (!t) return;
  icon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  msgEl.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3800);
}

// ─── DRAG & DROP ─────────────────────────────────────────────
function initDragDrop() {
  const area = document.getElementById('drop-area');
  if (!area) return;
  ['dragenter','dragover'].forEach(e => area.addEventListener(e, ev => { ev.preventDefault(); area.classList.add('dragging'); }));
  ['dragleave','dragend'].forEach(e => area.addEventListener(e, () => area.classList.remove('dragging')));
  area.addEventListener('drop', ev => {
    ev.preventDefault();
    area.classList.remove('dragging');
    const file = ev.dataTransfer.files[0];
    if (file) processFile(file);
  });
}

// ─── FILE HANDLING ───────────────────────────────────────────
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  if (!file.name.match(/\.(csv|txt|tsv)$/i)) {
    showToast('Please upload a CSV, TSV, or TXT file.', 'error');
    return;
  }
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (!results.data || results.data.length === 0) {
        showToast('File appears empty or unreadable.', 'error');
        return;
      }
      APP.csvData = results.data;
      populateFromCSV(results.data, results.meta.fields || []);
      document.getElementById('file-loaded').classList.remove('hidden');
      document.getElementById('file-name').textContent = file.name;
      document.getElementById('file-rows').textContent = `${results.data.length} rows · ${results.meta.fields?.length || 0} columns detected`;
      showToast(`CSV loaded — ${results.data.length} rows parsed ✓`);
    },
    error: () => showToast('Failed to parse CSV.', 'error')
  });
}

function clearFile() {
  APP.csvData = null;
  document.getElementById('file-loaded').classList.add('hidden');
  document.getElementById('fileInput').value = '';
  showToast('File cleared', 'info');
}

function populateFromCSV(data, fields) {
  // Auto-detect column names
  const lower = fields.map(f => f.toLowerCase().trim());
  const get = (keywords) => {
    const col = lower.findIndex(f => keywords.some(k => f.includes(k)));
    return col >= 0 ? fields[col] : null;
  };

  const revCol  = get(['revenue','sales','amount','turnover','income','gmv']);
  const custCol = get(['customer','clients','buyers','users','orders','count']);
  const aovCol  = get(['aov','average','avg_order','order_value']);
  const retCol  = get(['retention','repeat','churn','returning']);

  if (revCol) {
    const vals = data.map(r => parseFloat((r[revCol]+'').replace(/[₹$,\s]/g,'')))
                     .filter(v => !isNaN(v) && v > 0);
    if (vals.length) {
      const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
      document.getElementById('f-revenue').value = avg;
      // Last 6 as history
      const hist = vals.slice(-6).join(', ');
      document.getElementById('f-revhistory').value = hist;
    }
  }
  if (custCol) {
    const vals = data.map(r => parseFloat(r[custCol])).filter(v => !isNaN(v) && v > 0);
    if (vals.length) document.getElementById('f-customers').value = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  }
  if (aovCol) {
    const vals = data.map(r => parseFloat((r[aovCol]+'').replace(/[₹$,]/g,''))).filter(v => !isNaN(v) && v > 0);
    if (vals.length) document.getElementById('f-aov').value = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  }
  if (retCol) {
    const vals = data.map(r => parseFloat(r[retCol])).filter(v => !isNaN(v) && v >= 0 && v <= 100);
    if (vals.length) document.getElementById('f-retention').value = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  }
}

// ─── DEMO DATA ───────────────────────────────────────────────
function loadDemoData() {
  const d = DEMO_DATA;
  document.getElementById('f-name').value       = d.bizName;
  document.getElementById('f-industry').value   = d.industry;
  document.getElementById('f-stage').value      = d.stage;
  document.getElementById('f-revenue').value    = d.revenue;
  document.getElementById('f-customers').value  = d.customers;
  document.getElementById('f-aov').value        = d.aov;
  document.getElementById('f-retention').value  = d.retention;
  document.getElementById('f-adspend').value    = d.adspend;
  document.getElementById('f-product').value    = d.product;
  document.getElementById('f-challenge').value  = d.challenge;
  document.getElementById('f-revhistory').value = d.revHistory.join(', ');
  showToast('Demo data loaded — click Analyze to run!', 'info');
}

// ─── FORM DATA COLLECTION ────────────────────────────────────
function collectFormData() {
  const rev     = parseFloat(document.getElementById('f-revenue').value) || 500000;
  const cust    = parseFloat(document.getElementById('f-customers').value) || 250;
  const aov     = parseFloat(document.getElementById('f-aov').value) || (rev / cust);
  const ret     = parseFloat(document.getElementById('f-retention').value) || 35;
  const adsp    = parseFloat(document.getElementById('f-adspend').value) || 0;
  const rawHist = document.getElementById('f-revhistory').value;
  const revHist = rawHist
    ? rawHist.split(',').map(v => parseFloat(v.trim().replace(/[₹$,\s]/g,''))).filter(v => !isNaN(v) && v > 0)
    : [rev];

  return {
    bizName:    document.getElementById('f-name').value.trim() || 'Your Business',
    industry:   document.getElementById('f-industry').value || 'retail',
    stage:      document.getElementById('f-stage').value || 'growth',
    product:    document.getElementById('f-product').value.trim() || 'Main Product',
    challenge:  document.getElementById('f-challenge').value.trim(),
    revenue:    rev,
    customers:  cust,
    aov:        aov,
    retention:  ret,
    adspend:    adsp,
    revHistory: revHist
  };
}

// ─── LOADING STEPS ───────────────────────────────────────────
const PIPELINE_STEPS = [
  'Ingesting & validating data',
  'Running OLS regression',
  'Applying Holt\'s exponential smoothing',
  'Building ensemble forecast',
  'Computing RFM segmentation',
  'Scoring customer cohorts',
  'Calculating LTV & CAC',
  'Generating strategic recommendations',
  'Rendering visualisations'
];

function startLoading() {
  APP.isLoading = true;
  setStatus('loading');
  document.getElementById('analyze-btn').disabled = true;
  document.getElementById('analyze-btn').querySelector('.mega-btn-text').textContent = 'Analyzing…';
  document.getElementById('loading-overlay').classList.remove('hidden');
  document.getElementById('results-section').classList.add('hidden');

  const list = document.getElementById('loading-steps-list');
  list.innerHTML = PIPELINE_STEPS.map((s, i) => `
    <div class="ls-item" id="ls-${i}">
      <span class="ls-icon">⏳</span>
      <span>${s}</span>
    </div>
  `).join('');
  document.getElementById('loading-bar').style.width = '0%';
}

function updateLoadingStep(index) {
  const step = PIPELINE_STEPS[index];
  document.getElementById('loading-step').textContent = step || 'Finalizing…';
  document.getElementById('loading-bar').style.width = Math.round((index + 1) / PIPELINE_STEPS.length * 100) + '%';
  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    const el = document.getElementById('ls-' + i);
    if (!el) continue;
    if (i < index) { el.classList.add('done'); el.querySelector('.ls-icon').textContent = '✅'; }
    else if (i === index) { el.classList.add('active'); el.querySelector('.ls-icon').textContent = '⚡'; }
    else { el.classList.remove('done','active'); el.querySelector('.ls-icon').textContent = '⏳'; }
  }
}

function stopLoading() {
  APP.isLoading = false;
  setStatus('ready');
  document.getElementById('analyze-btn').disabled = false;
  document.getElementById('analyze-btn').querySelector('.mega-btn-text').textContent = 'Run Full Data Science Analysis';
  document.getElementById('loading-overlay').classList.add('hidden');
}

// ─── MAIN ANALYSIS PIPELINE ──────────────────────────────────
async function runAnalysis() {
  const data = collectFormData();
  startLoading();

  // Artificial step delays for visual feedback (real compute is instant in JS)
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  await delay(200); updateLoadingStep(0);
  await delay(300); updateLoadingStep(1);

  const forecast = buildForecast(data.revHistory, 12);
  await delay(250); updateLoadingStep(2);
  await delay(200); updateLoadingStep(3);

  const segments = computeRFMSegments(data);
  await delay(300); updateLoadingStep(4);
  await delay(250); updateLoadingStep(5);

  const kpis = computeKPIs(data);
  await delay(200); updateLoadingStep(6);

  const recs   = generateRecommendations(data, kpis, segments);
  const risks  = generateRisks(data, kpis);
  const report = generateInsightReport(data, kpis, segments, forecast);
  await delay(300); updateLoadingStep(7);
  await delay(200); updateLoadingStep(8);

  // Store result
  APP.analysisResult = { data, kpis, segments, forecast, recs, risks, report };

  await delay(200);
  stopLoading();

  renderResults(APP.analysisResult);
  populatePredictionsPage(APP.analysisResult);
  populateSegmentsPage(APP.analysisResult);
  populateStrategyPage(APP.analysisResult);

  document.getElementById('results-section').classList.remove('hidden');
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Analysis complete — ' + segments.length + ' segments · ' + recs.length + ' recommendations');
}

// ─── RENDER RESULTS (Analyze tab) ────────────────────────────
function renderResults({ data, kpis, segments, forecast, recs, report }) {
  renderKPIRibbon('kpi-ribbon', kpis, data);
  renderSegTable(segments, data);
  renderRecCards('recs-grid', recs.slice(0, 6));

  // Charts
  const hist = data.revHistory;
  const reg  = linearRegression(hist);
  drawRevenueTrendChart('revChart', hist, reg.fitted);
  drawSegmentDonut('segDonut', segments);
  drawSegmentRevBar('segRevBar', segments);

  // Insight report
  document.getElementById('insight-content').innerHTML = report;

  // Animate fade-in
  document.querySelectorAll('.kpi-card, .chart-panel, .rec-card').forEach((el, i) => {
    el.style.opacity = '0';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }, i * 30);
  });
}

// ─── KPI RIBBON ──────────────────────────────────────────────
function renderKPIRibbon(containerId, kpis, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const cards = [
    {
      label: 'Monthly Revenue', val: formatINR(kpis.revenue),
      change: forecast && APP.analysisResult?.forecast ? `→ ${formatINR(APP.analysisResult.forecast.forecast[0])} next mo` : '—',
      changeClass: 'up', klass: 'k-purple'
    },
    {
      label: 'Customer LTV', val: formatINR(kpis.ltv),
      change: kpis.ltvCac ? `LTV:CAC = ${kpis.ltvCac}x` : 'Est. lifetime value',
      changeClass: parseFloat(kpis.ltvCac) >= 3 ? 'up' : 'dn', klass: 'k-green'
    },
    {
      label: 'Ad ROAS', val: kpis.roas ? kpis.roas + 'x' : 'N/A',
      change: kpis.roas ? (parseFloat(kpis.roas) >= 3.5 ? '✅ Above benchmark' : '⚠️ Below 3.5x target') : 'No ad spend',
      changeClass: kpis.roas && parseFloat(kpis.roas) >= 3.5 ? 'up' : 'dn', klass: 'k-blue'
    },
    {
      label: 'Customer Acq. Cost', val: kpis.cac ? formatINR(kpis.cac) : 'N/A',
      change: `AOV: ${formatINR(kpis.aov)}`,
      changeClass: 'neutral', klass: 'k-amber'
    }
  ];
  el.innerHTML = cards.map(c => `
    <div class="kpi-card ${c.klass}">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-val ${c.klass}">${c.val}</div>
      <div class="kpi-change ${c.changeClass}">${c.change}</div>
    </div>
  `).join('');
}

// ─── SEGMENTATION TABLE ───────────────────────────────────────
function renderSegTable(segments, data) {
  const tbody = document.getElementById('seg-tbody');
  if (!tbody) return;
  const priorityBadge = (p) => {
    if (p <= 2) return '<span class="badge badge-red">Critical</span>';
    if (p <= 4) return '<span class="badge badge-amber">High</span>';
    return '<span class="badge badge-blue">Medium</span>';
  };
  const actionMap = {
    'Champions': 'VIP Program + Upsell',
    'Loyal Customers': 'Cross-sell Bundles',
    'Potential Loyalists': 'Nurture Drip Sequence',
    'At-Risk Customers': 'Win-Back Campaign',
    'Lost Customers': 'Reactivation Email',
    'New Customers': 'Onboarding Flow'
  };
  tbody.innerHTML = segments.map((s, i) => `
    <tr>
      <td><span style="color:${s.color};font-weight:600;">${s.icon} ${s.name}</span></td>
      <td class="score-cell" style="color:${s.color}">${s.rfmScore}/100</td>
      <td><strong>${s.count.toLocaleString('en-IN')}</strong></td>
      <td>${Math.round(s.pct * 100)}%</td>
      <td class="score-cell">${formatINR(s.avgValue)}</td>
      <td><span class="badge ${s.retRate >= 0.5 ? 'badge-green' : s.retRate >= 0.25 ? 'badge-amber' : 'badge-red'}">${Math.round(s.retRate*100)}%</span></td>
      <td class="score-cell" style="color:#06B6D4">${formatINR(s.ltv)}</td>
      <td>${priorityBadge(i+1)}</td>
      <td style="color:#94A3B8;font-size:12px;">${actionMap[s.name] || '—'}</td>
    </tr>
  `).join('');
}

// ─── REC CARDS ───────────────────────────────────────────────
function renderRecCards(containerId, recs) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const colorMap = { red: 'green', green: 'green', amber: 'amber', blue: 'blue', purple: 'purple' };
  el.innerHTML = recs.map(r => `
    <div class="rec-card">
      <div class="rec-icon-box ${colorMap[r.color] || 'purple'}">${r.icon}</div>
      <div class="rec-body">
        <div class="rec-header">
          <div class="rec-title">${r.title}</div>
          <span class="badge ${r.impact === 'Very High' || r.impact === 'High' ? 'badge-green' : 'badge-amber'}">${r.impact}</span>
        </div>
        <div class="rec-desc">${r.desc}</div>
        <div class="rec-meta">
          ${r.tags.map(t=>`<span class="rec-tag">${t}</span>`).join('')}
          <span class="rec-tag">⏱ ${r.timeframe}</span>
          <span class="rec-tag">+${formatINR(r.revenueImpact)}/mo</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── PREDICTIONS PAGE ─────────────────────────────────────────
function populatePredictionsPage({ data, kpis, forecast }) {
  if (!forecast) return;
  document.getElementById('pred-empty').classList.add('hidden');
  document.getElementById('pred-content').classList.remove('hidden');

  // KPIs
  const pred = document.getElementById('pred-kpi');
  const m1 = forecast.forecast[0];
  const m3total = forecast.forecast.slice(0, 3).reduce((a, b) => a + b, 0);
  const annual  = forecast.forecast.reduce((a, b) => a + b, 0);
  pred.innerHTML = [
    { label: 'Next Month Forecast', val: formatINR(m1), change: `vs ${formatINR(data.revenue)} current`, cc: m1 > data.revenue ? 'up' : 'dn', k: 'k-purple' },
    { label: '3-Month Total', val: formatINR(m3total), change: `Avg: ${formatINR(Math.round(m3total/3))}/mo`, cc: 'neutral', k: 'k-green' },
    { label: '12-Month Projection', val: formatINR(annual), change: `Annual run rate`, cc: 'up', k: 'k-blue' },
    { label: 'Model Confidence', val: forecast.confidence + '%', change: `R² = ${forecast.r2}% · ${data.revHistory.length} data pts`, cc: parseFloat(forecast.r2) > 70 ? 'up' : 'neutral', k: 'k-amber' }
  ].map(c => `
    <div class="kpi-card ${c.k}">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-val ${c.k}">${c.val}</div>
      <div class="kpi-change ${c.cc}">${c.change}</div>
    </div>
  `).join('');

  // Forecast + decomp charts
  drawForecastChart('forecastChart', forecast, data.revHistory);
  drawDecompChart('decompChart', data.revHistory);

  // Forecast table
  const tbody = document.getElementById('forecast-tbody');
  if (tbody) {
    const months = getMonthLabels(12, 1);
    const base = data.revHistory[data.revHistory.length - 1] || data.revenue;
    tbody.innerHTML = forecast.forecast.map((v, i) => {
      const prev = i === 0 ? base : forecast.forecast[i - 1];
      const mom = ((v - prev) / prev * 100).toFixed(1);
      const conf = Math.max(60, forecast.confidence - i * 2);
      return `
        <tr>
          <td>${months[i]}</td>
          <td class="score-cell" style="color:#6366F1">${formatINR(v)}</td>
          <td style="color:#64748B">${formatINR(forecast.lower[i])}</td>
          <td style="color:#10B981">${formatINR(forecast.upper[i])}</td>
          <td><span class="badge ${parseFloat(mom)>=0?'badge-green':'badge-red'}">${mom>=0?'+':''}${mom}%</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;height:4px;background:#1A1D2E;border-radius:2px;overflow:hidden;">
                <div style="width:${conf}%;height:100%;background:#6366F1;border-radius:2px;"></div>
              </div>
              <span style="font-size:11px;color:#64748B">${conf}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Insight
  document.getElementById('pred-insight-content').innerHTML = `
    <h3>📐 Methodology</h3>
    <p>Forecast uses an <strong>ensemble model</strong>: 60% weight on OLS linear regression and 40% on Holt's Double Exponential Smoothing (α=0.25, β=0.15). Seasonal components use an additive decomposition with period=3. Confidence intervals are at 90% (±1.645σ), widening with forecast horizon.</p>
    <h3>📊 Model Statistics</h3>
    <p>Historical data points: <strong class="num">${data.revHistory.length}</strong> · R² = <strong class="num">${forecast.r2}%</strong> · Trend slope: <strong class="num">${formatINR(Math.round(forecast.slope))}/month</strong> · Std Error: <strong class="num">${formatINR(Math.round(forecast.stdErr || 0))}</strong></p>
    <h3>⚠️ Forecast Limitations</h3>
    <p>Forecasts assume no major market disruption and continuation of current growth trajectory. ${data.revHistory.length < 6 ? `<strong>Note:</strong> Accuracy improves significantly with 6+ months of data (currently ${data.revHistory.length} months).` : 'Model has sufficient historical data for reliable near-term forecasts.'} Always combine quantitative forecasts with qualitative business judgment.</p>
  `;
}

// ─── SEGMENTS PAGE ────────────────────────────────────────────
function populateSegmentsPage({ data, segments }) {
  document.getElementById('seg-empty').classList.add('hidden');
  document.getElementById('seg-content').classList.remove('hidden');

  drawSegPieChart('segPieChart', segments);
  drawSegRevPie('segRevPie', segments);
  drawLtvCacChart('ltvCacChart', segments);

  // Segment cards
  const grid = document.getElementById('seg-cards-grid');
  if (grid) {
    grid.innerHTML = segments.map(s => `
      <div class="seg-card">
        <div class="seg-card-icon">${s.icon}</div>
        <div class="seg-card-name" style="color:${s.color}">${s.name}</div>
        <div class="seg-card-count" style="color:${s.color}">${s.count.toLocaleString('en-IN')}</div>
        <div class="seg-card-pct">${Math.round(s.pct*100)}% of customer base</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748B;margin-bottom:8px;">
          <span>Avg Value: <strong style="color:#CBD5E1">${formatINR(s.avgValue)}</strong></span>
          <span>LTV: <strong style="color:#06B6D4">${formatINR(s.ltv)}</strong></span>
        </div>
        <div class="seg-card-bar"><div class="seg-card-fill" style="width:${Math.round(s.pct*100)}%;background:${s.color}"></div></div>
        <div class="seg-card-desc">${s.desc}</div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
          <span class="badge ${s.churnRisk==='Low'?'badge-green':s.churnRisk==='Medium'?'badge-amber':'badge-red'}">Churn: ${s.churnRisk}</span>
          <span class="badge badge-purple">Channel: ${s.channel}</span>
        </div>
      </div>
    `).join('');
  }

  // RFM table
  const rfmTbody = document.getElementById('rfm-tbody');
  if (rfmTbody) {
    rfmTbody.innerHTML = segments.map(s => `
      <tr>
        <td><span style="color:${s.color};font-weight:600">${s.icon} ${s.name}</span></td>
        <td class="score-cell" style="color:${s.rScore>=4?'#10B981':s.rScore>=3?'#F59E0B':'#EF4444'}">${s.rScore}/5</td>
        <td class="score-cell" style="color:${s.fScore>=4?'#10B981':s.fScore>=3?'#F59E0B':'#EF4444'}">${s.fScore}/5</td>
        <td class="score-cell" style="color:${s.mScore>=4?'#10B981':s.mScore>=3?'#F59E0B':'#EF4444'}">${s.mScore}/5</td>
        <td><span class="badge" style="background:${s.color}22;color:${s.color}">${s.rfmScore}/100</span></td>
        <td><span class="badge ${s.churnRisk==='Low'?'badge-green':s.churnRisk==='Medium'||s.churnRisk==='High'?'badge-amber':'badge-red'}">${s.churnRisk}</span></td>
        <td><span class="badge ${s.upsell==='Very High'||s.upsell==='High'?'badge-green':'badge-gray'}">${s.upsell}</span></td>
        <td style="color:#94A3B8;font-size:12px">${s.channel}</td>
      </tr>
    `).join('');
  }
}

// ─── STRATEGY PAGE ────────────────────────────────────────────
function populateStrategyPage({ data, kpis, recs, risks, segments }) {
  document.getElementById('strat-empty').classList.add('hidden');
  document.getElementById('strat-content').classList.remove('hidden');

  drawRoiMatrix('roiMatrix', recs);
  drawRevLevers('revLevers', recs);

  // Full rec list
  const fullRecs = document.getElementById('strat-recs-full');
  if (fullRecs) {
    fullRecs.innerHTML = '<div class="panel-header" style="margin-bottom:16px;"><h2 class="panel-title">All Recommendations</h2><span class="panel-tag">Ranked by Priority</span></div>' +
      recs.map((r, i) => `
        <div class="strat-rec-item">
          <div class="strat-num">#${i+1}</div>
          <div class="strat-body">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px;">
              <div class="strat-title">${r.icon} ${r.title}</div>
              <div style="display:flex;gap:6px;flex-shrink:0;">
                <span class="badge ${r.impact==='Very High'||r.impact==='High'?'badge-green':'badge-amber'}">${r.impact} Impact</span>
                <span class="badge badge-blue">+${formatINR(r.revenueImpact)}/mo</span>
              </div>
            </div>
            <div class="strat-desc">${r.desc}</div>
            <div class="strat-tags">
              ${r.tags.map(t=>`<span class="strat-tag">${t}</span>`).join('')}
              <span class="strat-tag">⏱ ${r.timeframe}</span>
              <span class="strat-tag">💪 ${r.effort} Effort</span>
            </div>
          </div>
        </div>
      `).join('');
  }

  // Risk panel
  const riskPanel = document.getElementById('risk-panel');
  if (riskPanel) {
    riskPanel.innerHTML = `
      <div class="risk-title">⚠️ Risk Analysis</div>
      <div class="risk-items">
        ${risks.map(r => `
          <div class="risk-item">
            <span class="risk-level ${r.level}">${r.level.toUpperCase()}</span>
            <div class="risk-body">
              <div class="risk-name">${r.name}</div>
              <div class="risk-desc">${r.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// ─── COPY REPORT ─────────────────────────────────────────────
function copyInsights() {
  const el = document.getElementById('insight-content');
  if (!el) return;
  const text = el.innerText;
  navigator.clipboard.writeText(text)
    .then(() => showToast('Report copied to clipboard!'))
    .catch(() => showToast('Copy failed — please select and copy manually.', 'error'));
}

// ─── HELPER EXPOSED TO CHARTS ─────────────────────────────────
function formatINR(val) {
  if (!val && val !== 0) return '—';
  if (val >= 10000000) return '₹' + (val / 10000000).toFixed(1) + 'Cr';
  if (val >= 100000)   return '₹' + (val / 100000).toFixed(1) + 'L';
  if (val >= 1000)     return '₹' + (val / 1000).toFixed(0) + 'K';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}
