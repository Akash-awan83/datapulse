/* ═══════════════════════════════════════════════════════════
   DataPulse — Chart Engine
   All Chart.js visualisations with consistent dark theme
═══════════════════════════════════════════════════════════ */

'use strict';

// ─── GLOBAL CHART DEFAULTS ───────────────────────────────────
Chart.defaults.color = '#64748B';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Space Grotesk', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = '#1A1D2E';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.12)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleColor = '#F1F5F9';
Chart.defaults.plugins.tooltip.bodyColor = '#94A3B8';
Chart.defaults.plugins.tooltip.cornerRadius = 8;

// Registry of active charts for cleanup
const CHARTS = {};

function destroyChart(key) {
  if (CHARTS[key]) { CHARTS[key].destroy(); delete CHARTS[key]; }
}

function formatINR(val) {
  if (val >= 10000000) return '₹' + (val / 10000000).toFixed(1) + 'Cr';
  if (val >= 100000)   return '₹' + (val / 100000).toFixed(1) + 'L';
  if (val >= 1000)     return '₹' + (val / 1000).toFixed(0) + 'K';
  return '₹' + val.toFixed(0);
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function getMonthLabels(count, startOffset = 0) {
  const now = new Date().getMonth();
  return Array.from({ length: count }, (_, i) => MONTH_NAMES[(now + startOffset + i) % 12]);
}
function getPastMonthLabels(count) {
  const now = new Date().getMonth();
  return Array.from({ length: count }, (_, i) => MONTH_NAMES[(now - count + 1 + i + 12) % 12]);
}

// ─── SEGMENT COLORS ──────────────────────────────────────────
const SEG_COLORS = ['#6366F1','#06B6D4','#10B981','#F59E0B','#EF4444','#A855F7'];
const SEG_COLORS_ALPHA = SEG_COLORS.map(c => c + '33');

// ─── 1. REVENUE TREND CHART ──────────────────────────────────
function drawRevenueTrendChart(canvasId, historical, fitted) {
  destroyChart(canvasId);
  const labels = getPastMonthLabels(historical.length);
  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Actual Revenue',
          data: historical,
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#6366F1',
          pointBorderColor: '#0F1117',
          pointBorderWidth: 2,
          order: 1
        },
        {
          label: 'OLS Trendline',
          data: fitted,
          borderColor: '#06B6D4',
          borderDash: [6, 3],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
          order: 2
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: ctx => ' ' + ctx.dataset.label + ': ' + formatINR(ctx.raw) } }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: formatINR } }
      }
    }
  });
}

// ─── 2. SEGMENT DONUT ────────────────────────────────────────
function drawSegmentDonut(canvasId, segments) {
  destroyChart(canvasId);
  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels: segments.map(s => s.name),
      datasets: [{
        data: segments.map(s => s.count),
        backgroundColor: SEG_COLORS,
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#0F1117'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '66%',
      animation: { animateRotate: true, duration: 900 },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} customers (${Math.round(ctx.parsed / ctx.dataset.data.reduce((a,b)=>a+b,0)*100)}%)` } }
      }
    }
  });
}

// ─── 3. SEGMENT REVENUE BAR ──────────────────────────────────
function drawSegmentRevBar(canvasId, segments) {
  destroyChart(canvasId);
  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: segments.map(s => s.name),
      datasets: [{
        label: 'Revenue Contribution (₹)',
        data: segments.map(s => s.revenueContrib),
        backgroundColor: SEG_COLORS.map(c => c + 'BB'),
        borderColor: SEG_COLORS,
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900 },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' Revenue: ' + formatINR(ctx.raw) } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: formatINR } }
      }
    }
  });
}

// ─── 4. 12-MONTH FORECAST CHART ──────────────────────────────
function drawForecastChart(canvasId, fc, historical) {
  destroyChart(canvasId);
  const histLen = historical.length;
  const allLabels = [
    ...getPastMonthLabels(histLen),
    ...getMonthLabels(fc.forecast.length, 1)
  ];
  const histData = [...historical, ...Array(fc.forecast.length).fill(null)];
  const fcData   = [...Array(histLen).fill(null), ...fc.forecast];
  const lowerD   = [...Array(histLen).fill(null), ...fc.lower];
  const upperD   = [...Array(histLen).fill(null), ...fc.upper];

  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        {
          label: 'Historical',
          data: histData,
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#6366F1',
          pointBorderColor: '#0F1117',
          pointBorderWidth: 2,
          order: 1
        },
        {
          label: 'Forecast',
          data: fcData,
          borderColor: '#06B6D4',
          borderDash: [8, 4],
          backgroundColor: 'rgba(6,182,212,0.05)',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#06B6D4',
          order: 2
        },
        {
          label: 'Upper CI (90%)',
          data: upperD,
          borderColor: 'rgba(16,185,129,0.35)',
          borderDash: [3, 3],
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          order: 3
        },
        {
          label: 'Lower CI (90%)',
          data: lowerD,
          borderColor: 'rgba(239,68,68,0.35)',
          borderDash: [3, 3],
          borderWidth: 1,
          pointRadius: 0,
          fill: '+1',
          backgroundColor: 'rgba(99,102,241,0.05)',
          order: 4
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1000 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.raw === null) return null;
              return ' ' + ctx.dataset.label + ': ' + formatINR(ctx.raw);
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: formatINR } }
      }
    }
  });
}

// ─── 5. DECOMPOSITION CHART ───────────────────────────────────
function drawDecompChart(canvasId, historical) {
  destroyChart(canvasId);
  const reg = linearRegression(historical);
  const trend = reg.fitted;
  const detrended = historical.map((v, i) => v - trend[i]);
  const labels = getPastMonthLabels(historical.length);

  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Trend Component',
          data: trend.map(Math.round),
          type: 'line',
          borderColor: '#6366F1',
          borderWidth: 2,
          pointRadius: 3,
          fill: false,
          yAxisID: 'y',
          order: 1
        },
        {
          label: 'Residual / Noise',
          data: detrended.map(Math.round),
          backgroundColor: detrended.map(v => v >= 0 ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.6)'),
          borderRadius: 4,
          yAxisID: 'y2',
          order: 2
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 800 },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => ' ' + ctx.dataset.label + ': ' + formatINR(Math.abs(ctx.raw)) } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B' } },
        y: { position: 'left', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: formatINR } },
        y2: { position: 'right', grid: { display: false }, ticks: { color: '#64748B', callback: formatINR } }
      }
    }
  });
}

// ─── 6. SEGMENT PIE (Segments page) ──────────────────────────
function drawSegPieChart(canvasId, segments) {
  destroyChart(canvasId);
  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'pie',
    data: {
      labels: segments.map(s => s.name),
      datasets: [{
        data: segments.map(s => s.count),
        backgroundColor: SEG_COLORS,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900 },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} customers` } }
      }
    }
  });
}

// ─── 7. SEGMENT REVENUE PIE ──────────────────────────────────
function drawSegRevPie(canvasId, segments) {
  destroyChart(canvasId);
  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels: segments.map(s => s.name),
      datasets: [{
        data: segments.map(s => s.revenueContrib),
        backgroundColor: SEG_COLORS,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '58%',
      animation: { duration: 900 },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatINR(ctx.raw)}` } }
      }
    }
  });
}

// ─── 8. LTV vs CAC BUBBLE ────────────────────────────────────
function drawLtvCacChart(canvasId, segments) {
  destroyChart(canvasId);
  const datasets = segments.map((s, i) => ({
    label: s.name,
    data: [{ x: s.cac || (s.avgValue * 0.3), y: s.ltv, r: Math.sqrt(s.count) * 1.5 }],
    backgroundColor: SEG_COLORS[i] + '88',
    borderColor: SEG_COLORS[i],
    borderWidth: 1.5
  }));

  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'bubble',
    data: { datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900 },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label} — CAC: ${formatINR(ctx.raw.x)} | LTV: ${formatINR(ctx.raw.y)}` } }
      },
      scales: {
        x: { title: { display: true, text: 'Est. CAC (₹)', color: '#64748B' }, ticks: { color: '#64748B', callback: formatINR }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { title: { display: true, text: 'Est. LTV (₹)', color: '#64748B' }, ticks: { color: '#64748B', callback: formatINR }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

// ─── 9. ROI MATRIX BUBBLE ────────────────────────────────────
function drawRoiMatrix(canvasId, recs) {
  destroyChart(canvasId);
  const effortMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
  const impactMap = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  const colors = ['#6366F1','#10B981','#F59E0B','#06B6D4','#A855F7','#EF4444','#F59E0B'];

  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'bubble',
    data: {
      datasets: recs.map((r, i) => ({
        label: r.title.substring(0, 28) + (r.title.length > 28 ? '…' : ''),
        data: [{
          x: effortMap[r.effort] || 2,
          y: impactMap[r.impact] || 2,
          r: Math.sqrt(r.revenueImpact / 3000) + 6
        }],
        backgroundColor: (colors[i] || '#6366F1') + '66',
        borderColor: colors[i] || '#6366F1',
        borderWidth: 1.5
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900 },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 8 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label} | Impact: ${formatINR(recs[ctx.datasetIndex].revenueImpact)}/mo` } }
      },
      scales: {
        x: {
          min: 0.5, max: 3.5,
          title: { display: true, text: '← Low Effort   High Effort →', color: '#64748B' },
          ticks: { callback: v => ['','Low','Medium','High'][v] || '', color: '#64748B' },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          min: 0.5, max: 4.5,
          title: { display: true, text: 'Revenue Impact →', color: '#64748B' },
          ticks: { callback: v => ['','Low','Medium','High','Very High'][v] || '', color: '#64748B' },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

// ─── 10. REVENUE LEVERS BAR ───────────────────────────────────
function drawRevLevers(canvasId, recs) {
  destroyChart(canvasId);
  const sorted = [...recs].sort((a, b) => b.revenueImpact - a.revenueImpact).slice(0, 6);
  CHARTS[canvasId] = new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: sorted.map(r => r.title.substring(0, 24) + (r.title.length > 24 ? '…' : '')),
      datasets: [{
        label: 'Est. Monthly Revenue Uplift (₹)',
        data: sorted.map(r => r.revenueImpact),
        backgroundColor: ['#6366F1BB','#10B981BB','#06B6D4BB','#F59E0BBB','#A855F7BB','#EF4444BB'],
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900 },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' Potential: ' + formatINR(ctx.raw) + '/month' } }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: formatINR } },
        y: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11 } } }
      }
    }
  });
}
