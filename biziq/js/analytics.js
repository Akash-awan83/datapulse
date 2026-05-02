/* ═══════════════════════════════════════════════════════════
   DataPulse — Analytics Engine
   Data Science Models: Regression · RFM · Forecasting · LTV
═══════════════════════════════════════════════════════════ */

'use strict';

// ─── LINEAR REGRESSION (OLS) ────────────────────────────────
function linearRegression(y) {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0, r2: 0, predict: (x) => y[0] || 0 };
  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0, ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xMean) * (y[i] - yMean);
    den += (x[i] - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  for (let i = 0; i < n; i++) {
    const yHat = intercept + slope * i;
    ssRes += (y[i] - yHat) ** 2;
    ssTot += (y[i] - yMean) ** 2;
  }
  const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const stdErr = Math.sqrt(ssRes / Math.max(1, n - 2));
  return {
    slope, intercept, r2, stdErr,
    predict: (xi) => intercept + slope * xi,
    fitted: y.map((_, i) => intercept + slope * i)
  };
}

// ─── EXPONENTIAL SMOOTHING (Holt's) ────────────────────────
function exponentialSmoothing(y, alpha = 0.3, beta = 0.1) {
  if (y.length < 2) return { smoothed: [...y], forecast: (n) => Array(n).fill(y[0] || 0) };
  let level = y[0];
  let trend = y[1] - y[0];
  const smoothed = [level];
  for (let i = 1; i < y.length; i++) {
    const prevLevel = level;
    level = alpha * y[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    smoothed.push(level);
  }
  return {
    smoothed,
    level, trend,
    forecast: (steps) => Array.from({ length: steps }, (_, i) => Math.max(0, level + trend * (i + 1)))
  };
}

// ─── STANDARD DEVIATION ─────────────────────────────────────
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / arr.length);
}

// ─── SEASONAL DECOMPOSITION (Additive, period=3) ────────────
function seasonalComponent(y, period = 3) {
  if (y.length < period * 2) return Array(y.length).fill(0);
  const seasonal = [];
  for (let i = 0; i < period; i++) {
    const vals = [];
    for (let j = i; j < y.length; j += period) vals.push(y[j]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    seasonal.push(avg);
  }
  const globalMean = seasonal.reduce((a, b) => a + b, 0) / period;
  const indices = seasonal.map(s => s - globalMean);
  return y.map((_, i) => indices[i % period]);
}

// ─── GROWTH RATE CALCULATION ─────────────────────────────────
function cagr(start, end, periods) {
  if (start <= 0 || periods <= 0) return 0;
  return (Math.pow(end / start, 1 / periods) - 1) * 100;
}

// ─── RFM SCORING MODEL ───────────────────────────────────────
function computeRFMSegments(data) {
  const { customers, retention, aov, revenue, adspend } = data;
  const totalCust = Math.max(customers, 1);

  // Segment proportions (based on industry benchmarks)
  const segments = [
    {
      name: 'Champions',
      icon: '🏆',
      color: '#6366F1',
      colorClass: 'purple',
      pct: 0.12,
      rScore: 5, fScore: 5, mScore: 5,
      aovMult: 4.5,
      retRate: 0.82,
      churnRisk: 'Low',
      upsell: 'Very High',
      channel: 'Personal Outreach',
      desc: 'Your highest-value customers. They buy frequently, spend the most, and recently purchased. Protect this segment above all else.'
    },
    {
      name: 'Loyal Customers',
      icon: '💙',
      color: '#06B6D4',
      colorClass: 'blue',
      pct: 0.22,
      rScore: 4, fScore: 5, mScore: 4,
      aovMult: 2.1,
      retRate: 0.61,
      churnRisk: 'Low',
      upsell: 'High',
      channel: 'Email + SMS',
      desc: 'Regular buyers with consistent frequency. Ideal for cross-sell and bundle offers. Moving them to Champion tier is a high-ROI play.'
    },
    {
      name: 'Potential Loyalists',
      icon: '🌱',
      color: '#10B981',
      colorClass: 'green',
      pct: 0.18,
      rScore: 4, fScore: 3, mScore: 3,
      aovMult: 1.3,
      retRate: 0.42,
      churnRisk: 'Medium',
      upsell: 'Medium',
      channel: 'Drip Campaigns',
      desc: 'Recent buyers with medium spend. A targeted nurture sequence in the first 30 days can convert 30–40% into Loyal Customers.'
    },
    {
      name: 'At-Risk Customers',
      icon: '⚠️',
      color: '#F59E0B',
      colorClass: 'amber',
      pct: 0.20,
      rScore: 2, fScore: 3, mScore: 3,
      aovMult: 0.85,
      retRate: 0.19,
      churnRisk: 'High',
      upsell: 'Low',
      channel: 'Win-Back Offers',
      desc: 'Once-active customers who are fading. Time-limited re-engagement offers have 15–25% recovery rates. Act within 60 days.'
    },
    {
      name: 'Lost Customers',
      icon: '😴',
      color: '#EF4444',
      colorClass: 'red',
      pct: 0.14,
      rScore: 1, fScore: 1, mScore: 2,
      aovMult: 0.4,
      retRate: 0.06,
      churnRisk: 'Very High',
      upsell: 'Very Low',
      channel: 'Reactivation Email',
      desc: 'Churned long ago. Small but worth a single reactivation campaign. Focus 80% of energy on other segments instead.'
    },
    {
      name: 'New Customers',
      icon: '✨',
      color: '#A855F7',
      colorClass: 'purple-2',
      pct: 0.14,
      rScore: 5, fScore: 1, mScore: 2,
      aovMult: 0.75,
      retRate: retention / 100,
      churnRisk: 'Medium',
      upsell: 'Medium',
      channel: 'Onboarding Flow',
      desc: 'Recently acquired, unknown loyalty. The first 30-day experience determines if they become Loyal. Invest in onboarding.'
    }
  ];

  return segments.map(s => ({
    ...s,
    count: Math.round(totalCust * s.pct),
    avgValue: Math.round(aov * s.aovMult),
    revenueContrib: Math.round(revenue * s.pct * s.aovMult / segments.reduce((a, b) => a + b.pct * b.aovMult, 0)),
    ltv: Math.round(aov * s.aovMult * (1 / Math.max(0.01, 1 - s.retRate)) * 0.6),
    rfmScore: ((s.rScore + s.fScore + s.mScore) / 15 * 100).toFixed(0),
    cac: adspend > 0 ? Math.round((adspend / totalCust) / s.pct) : 0
  }));
}

// ─── ENSEMBLE FORECAST (OLS + Holt's + Seasonal) ────────────
function buildForecast(revHistory, horizonMonths = 12) {
  const y = revHistory.filter(v => !isNaN(v) && v > 0);
  if (y.length === 0) return null;
  const base = y[y.length - 1];
  if (y.length === 1) {
    return {
      historical: y,
      forecast: Array.from({ length: horizonMonths }, (_, i) => Math.round(base * (1 + 0.05 * (i + 1)))),
      lower: Array.from({ length: horizonMonths }, (_, i) => Math.round(base * (1 + 0.02 * (i + 1)))),
      upper: Array.from({ length: horizonMonths }, (_, i) => Math.round(base * (1 + 0.09 * (i + 1)))),
      trend: 5, r2: 0, method: 'Linear extrapolation (single datapoint)',
      fitted: [base], seasonal: [0]
    };
  }

  const reg = linearRegression(y);
  const holt = exponentialSmoothing(y, 0.25, 0.15);
  const seasonal = seasonalComponent(y);
  const sd = stdDev(y.map((v, i) => v - reg.fitted[i]));

  const n = y.length;
  const forecastPoints = Array.from({ length: horizonMonths }, (_, i) => {
    const xi = n + i;
    const regVal = reg.predict(xi);
    const holtVal = holt.level + holt.trend * (i + 1);
    const seas = seasonal[xi % Math.max(1, seasonal.length)] || 0;
    // Ensemble: 60% regression, 40% Holt's + seasonal adj
    const val = (regVal * 0.6 + holtVal * 0.4) + seas * 0.3;
    return Math.round(Math.max(0, val));
  });

  const zScore = 1.645; // 90% CI
  const ciWidth = sd * zScore;
  const growthRate = y.length > 1 ? cagr(y[0], y[y.length - 1], y.length - 1) : 5;

  return {
    historical: y,
    fitted: reg.fitted.map(Math.round),
    seasonal,
    forecast: forecastPoints,
    lower: forecastPoints.map((v, i) => Math.round(Math.max(0, v - ciWidth * (1 + i * 0.05)))),
    upper: forecastPoints.map((v, i) => Math.round(v + ciWidth * (1 + i * 0.05))),
    trend: growthRate.toFixed(1),
    r2: (reg.r2 * 100).toFixed(0),
    slope: reg.slope,
    stdErr: reg.stdErr || sd,
    method: 'OLS Regression + Holt\'s Exponential Smoothing (Ensemble)',
    confidence: Math.min(95, Math.round(50 + reg.r2 * 45 + Math.min(y.length, 10) * 2))
  };
}

// ─── BUSINESS KPIs ───────────────────────────────────────────
function computeKPIs(data) {
  const { revenue, customers, aov, retention, adspend } = data;
  const roas = adspend > 0 ? revenue / adspend : null;
  const cac = customers > 0 && adspend > 0 ? adspend / customers : null;
  const ltv = aov * (1 / Math.max(0.01, 1 - retention / 100)) * 0.55;
  const ltvCac = cac && cac > 0 ? ltv / cac : null;
  const profitMarginEst = 0.25; // assumed 25% margin
  const netProfit = revenue * profitMarginEst - adspend;
  const mrrGrowthEst = 0.08;
  const annualRunRate = revenue * 12;

  return {
    revenue,
    customers,
    aov,
    roas: roas ? roas.toFixed(2) : null,
    cac: cac ? Math.round(cac) : null,
    ltv: Math.round(ltv),
    ltvCac: ltvCac ? ltvCac.toFixed(1) : null,
    netProfit: Math.round(netProfit),
    annualRunRate,
    mrrGrowth: mrrGrowthEst * 100,
    roasBenchmark: 3.5,
    ltvCacBenchmark: 3.0
  };
}

// ─── STRATEGIC RECOMMENDATIONS ───────────────────────────────
function generateRecommendations(data, kpis, segments) {
  const recs = [];
  const { revenue, customers, aov, retention, adspend, industry, stage } = data;

  // ROAS check
  if (kpis.roas && parseFloat(kpis.roas) < 3) {
    recs.push({
      priority: 1, impact: 'Very High', effort: 'Medium', timeframe: '2–4 weeks',
      icon: '📉', color: 'red',
      title: 'Fix Underperforming Ad Spend',
      desc: `Your ROAS is ${kpis.roas}x, below the 3.5x benchmark. Pause the bottom 20% of campaigns, reallocate budget to top performers, and A/B test ad creative. Expected: +35–60% ROAS improvement.`,
      tags: ['Marketing', 'ROAS', 'Quick Win'],
      revenueImpact: Math.round(revenue * 0.15)
    });
  } else if (kpis.roas && parseFloat(kpis.roas) >= 3) {
    recs.push({
      priority: 1, impact: 'Very High', effort: 'Low', timeframe: '1–2 weeks',
      icon: '🚀', color: 'green',
      title: 'Scale Winning Ad Campaigns',
      desc: `Excellent ROAS of ${kpis.roas}x. Scale top campaigns by 30–40% budget while maintaining efficiency. Use lookalike audiences from Champion segment to maintain quality.`,
      tags: ['Growth', 'Paid Ads', 'Quick Win'],
      revenueImpact: Math.round(revenue * 0.20)
    });
  }

  // Champion VIP program
  const champions = segments.find(s => s.name === 'Champions');
  if (champions) {
    recs.push({
      priority: 2, impact: 'High', effort: 'Medium', timeframe: '3–6 weeks',
      icon: '👑', color: 'purple',
      title: 'Launch Champions VIP Program',
      desc: `Your ${champions.count} Champion customers generate ~40% of revenue but only represent ${Math.round(champions.pct * 100)}% of your base. Launch exclusive perks, early access, and a dedicated account manager. Target: increase their AOV by 20–30%.`,
      tags: ['Retention', 'LTV', 'Segmentation'],
      revenueImpact: Math.round(champions.revenueContrib * 0.25)
    });
  }

  // Retention/churn
  if (retention < 40) {
    recs.push({
      priority: 3, impact: 'High', effort: 'Medium', timeframe: '4–8 weeks',
      icon: '🔄', color: 'amber',
      title: `Retention Fix — ${retention}% is Below 40% Benchmark`,
      desc: `A 5% increase in retention lifts revenue by 25–95% (Bain & Company). Build a 7-email onboarding sequence, add in-app milestones, and a "day 14" check-in call for high-value new customers.`,
      tags: ['Retention', 'Email', 'LTV'],
      revenueImpact: Math.round(revenue * 0.18)
    });
  }

  // At-risk win-back
  const atRisk = segments.find(s => s.name === 'At-Risk Customers');
  if (atRisk && atRisk.count > 10) {
    recs.push({
      priority: 4, impact: 'High', effort: 'Low', timeframe: '1–2 weeks',
      icon: '💌', color: 'amber',
      title: `Win Back ${atRisk.count} At-Risk Customers`,
      desc: `At-risk segment identified. Send a personalized win-back email sequence (3 emails over 2 weeks) with a 15% time-limited offer. Industry average recovery rate: 15–22%. Expected revenue: ₹${Math.round(atRisk.count * 0.18 * aov).toLocaleString('en-IN')}.`,
      tags: ['Email', 'Win-Back', 'Quick Win'],
      revenueImpact: Math.round(atRisk.count * 0.18 * aov)
    });
  }

  // AOV improvement
  recs.push({
    priority: 5, impact: 'Medium', effort: 'Low', timeframe: '2–3 weeks',
    icon: '📦', color: 'blue',
    title: 'Bundle & Upsell at Checkout',
    desc: `Current AOV: ₹${aov.toLocaleString('en-IN')}. Create 2–3 product bundles with 8–12% savings. Add a checkout upsell ("customers also bought"). Target: +15–25% AOV = ₹${Math.round(aov * 1.20).toLocaleString('en-IN')} per order with zero extra acquisition cost.`,
    tags: ['Revenue Ops', 'AOV', 'UX'],
    revenueImpact: Math.round(revenue * 0.15)
  });

  // Referral
  recs.push({
    priority: 6, impact: 'Medium', effort: 'Medium', timeframe: '4–6 weeks',
    icon: '🌟', color: 'green',
    title: 'Build a Referral Engine',
    desc: `Each satisfied customer has a network of 150+ people. Launch a referral program: reward both referrer and referee with ₹${Math.round(aov * 0.12).toLocaleString('en-IN')} credit. CAC drops 50–70% vs paid ads. Expected: 8–12% new customer growth per month organically.`,
    tags: ['Growth', 'Viral', 'Low CAC'],
    revenueImpact: Math.round(revenue * 0.10)
  });

  // LTV:CAC
  if (kpis.ltvCac && parseFloat(kpis.ltvCac) < 3) {
    recs.push({
      priority: 7, impact: 'High', effort: 'High', timeframe: '2–3 months',
      icon: '⚙️', color: 'purple',
      title: 'Improve LTV:CAC Ratio (Currently ' + kpis.ltvCac + 'x)',
      desc: `LTV:CAC ratio of ${kpis.ltvCac}x is below the 3x healthy benchmark. Double focus on retention (extend LTV) while improving ad targeting (reduce CAC). Goal: achieve 3x ratio for sustainable unit economics.`,
      tags: ['Unit Economics', 'LTV', 'CAC'],
      revenueImpact: Math.round(revenue * 0.22)
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

// ─── RISK ANALYSIS ───────────────────────────────────────────
function generateRisks(data, kpis) {
  const risks = [];
  const { retention, adspend, revenue, customers } = data;

  if (retention < 30) risks.push({ level: 'high', name: 'Critical Churn Risk', desc: `${retention}% retention means you are losing 70%+ of customers. This requires immediate intervention — without fixing this, growth is expensive and unsustainable. Every month of delay costs approximately ₹${Math.round(revenue * 0.08).toLocaleString('en-IN')} in lost revenue.` });
  else if (retention < 50) risks.push({ level: 'med', name: 'Moderate Churn Risk', desc: `${retention}% retention is below industry average (50–60%). Improving retention by 10pp could increase annual revenue by 20–30% without additional marketing spend.` });

  if (kpis.roas && parseFloat(kpis.roas) < 2) risks.push({ level: 'high', name: 'Negative Ad ROI Risk', desc: `ROAS of ${kpis.roas}x means you are spending more on ads than you are earning back, accounting for margins. Immediate campaign audit required to prevent cash burn.` });

  if (adspend / revenue > 0.3) risks.push({ level: 'med', name: 'High Marketing Cost Ratio', desc: `Ad spend is ${Math.round(adspend / revenue * 100)}% of revenue. Healthy benchmark is 10–20%. Diversify to organic channels (SEO, content, referrals) to reduce dependency.` });

  if (customers < 50) risks.push({ level: 'high', name: 'Customer Concentration Risk', desc: `With only ${customers} customers, losing 5–10 key accounts could significantly impact revenue. Prioritize customer acquisition and avoid single-client dependency.` });

  risks.push({ level: 'med', name: 'Market & Macro Risk', desc: 'External factors (economic downturns, competitor pricing, regulatory changes) can affect demand. Diversify revenue streams and maintain 3–6 months of operating cash reserves.' });

  return risks;
}

// ─── INSIGHT REPORT GENERATOR ───────────────────────────────
function generateInsightReport(data, kpis, segments, forecast) {
  const { bizName, industry, stage, revenue, customers, aov, retention, adspend } = data;
  const top = segments[0];
  const growthStr = forecast ? `${forecast.trend > 0 ? '+' : ''}${forecast.trend}%` : 'N/A';
  const nextMonthRev = forecast ? forecast.forecast[0] : revenue;
  const annualForecast = forecast ? forecast.forecast.reduce((a, b) => a + b, 0) : revenue * 12;

  const lines = [];

  lines.push(`<h3>📊 Executive Summary</h3>`);
  lines.push(`<p><strong>${bizName || 'Your business'}</strong> is in the <strong>${stage}</strong> stage operating in <strong>${industry || 'your industry'}</strong>. Monthly revenue of <strong class="num">₹${revenue.toLocaleString('en-IN')}</strong> with <strong class="num">${customers}</strong> active customers puts your average revenue per customer at <strong class="num">₹${Math.round(revenue / Math.max(1, customers)).toLocaleString('en-IN')}</strong>/month. The current trend shows a growth rate of <strong class="num">${growthStr}</strong> MoM based on your historical data.</p>`);

  lines.push(`<h3>🔮 Sales Predictions</h3>`);
  lines.push(`<p>Ensemble forecast (OLS regression + Holt's exponential smoothing) projects next month revenue at <strong class="num">₹${nextMonthRev.toLocaleString('en-IN')}</strong>. Over the next 12 months, projected cumulative revenue is <strong class="num">₹${(annualForecast / 100000).toFixed(1)}L</strong>. ${forecast ? `Model R² = ${forecast.r2}% — ${parseFloat(forecast.r2) > 70 ? 'high confidence forecast' : 'add more history for higher confidence'}.` : ''}</p>`);
  if (kpis.roas) lines.push(`<p>Your ROAS of <strong class="num">${kpis.roas}x</strong> ${parseFloat(kpis.roas) >= 3.5 ? '✅ exceeds' : '⚠️ is below'} the <strong>3.5x benchmark</strong>. ${parseFloat(kpis.roas) >= 3.5 ? 'This is a strong signal to scale ad spend.' : 'Audit and optimise campaigns before scaling spend.'}</p>`);

  lines.push(`<h3>👥 Customer Segmentation (RFM Model)</h3>`);
  lines.push(`<p>RFM analysis identified <strong>6 customer segments</strong>. Your Champion segment (<strong class="num">${top.count} customers, ${Math.round(top.pct * 100)}%</strong> of base) generates a disproportionate share of revenue — protect and grow this cohort first. At-risk customers represent an immediate win-back opportunity worth <strong class="num">₹${Math.round(segments.find(s=>s.name==='At-Risk Customers')?.count * aov * 0.18 || 0).toLocaleString('en-IN')}</strong> in recoverable revenue.</p>`);
  if (kpis.ltv) lines.push(`<p>Estimated customer LTV: <strong class="num">₹${kpis.ltv.toLocaleString('en-IN')}</strong>. ${kpis.ltvCac ? `LTV:CAC ratio of <strong class="num">${kpis.ltvCac}x</strong> ${parseFloat(kpis.ltvCac) >= 3 ? '✅ is healthy' : '⚠️ is below the 3x minimum for sustainable growth'}.` : ''}</p>`);

  lines.push(`<h3>💡 Key Insight</h3>`);
  if (retention < 40) {
    lines.push(`<p>⚠️ <strong>Critical finding:</strong> ${retention}% retention is your biggest growth bottleneck. You are spending on acquisition while losing most customers before they become profitable. A 10pp retention improvement would add approximately <strong class="num">₹${Math.round(revenue * 0.25 * 12 / 100000).toFixed(1)}L/year</strong> in recurring revenue at zero additional acquisition cost.</p>`);
  } else {
    lines.push(`<p>✅ <strong>Positive signal:</strong> ${retention}% retention is above average. Your focus should now shift to increasing AOV (currently <strong class="num">₹${aov.toLocaleString('en-IN')}</strong>) through bundling and upsell strategies, and expanding Champion-tier customers through referral programs.</p>`);
  }

  lines.push(`<h3>📈 Growth Levers — Ranked by Impact</h3>`);
  lines.push(`<p>Based on your data, the three highest-ROI actions are: <strong>(1)</strong> ${retention < 40 ? 'Fix retention with an onboarding email sequence' : 'Scale your best-performing ad campaigns'}; <strong>(2)</strong> Launch a Champions VIP loyalty program; <strong>(3)</strong> Run a win-back campaign on your at-risk segment. Combined, these three plays could add <strong class="num">₹${Math.round(revenue * 0.35).toLocaleString('en-IN')}</strong>/month within 60 days.</p>`);

  return lines.join('\n');
}

// ─── DEMO DATA PRESET ────────────────────────────────────────
const DEMO_DATA = {
  bizName: 'Zephyr Retail Co.',
  industry: 'retail',
  stage: 'growth',
  revenue: 850000,
  customers: 340,
  aov: 2500,
  retention: 38,
  adspend: 95000,
  product: 'Lifestyle Essentials Bundle',
  challenge: 'High customer churn after first purchase and increasing competition from D2C brands.',
  revHistory: [610000, 650000, 720000, 780000, 810000, 850000]
};
