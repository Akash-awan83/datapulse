# DataPulse — AI Business Intelligence Platform
### Data Science Portfolio Project

> A production-grade, client-side business analytics application demonstrating end-to-end Data Science pipeline: CSV ingestion → statistical modelling → ML forecasting → customer segmentation → strategic recommendations.

---

## 🚀 Live Demo Setup (3 Methods)

### Method 1 — Open Locally (Zero Setup)
```bash
# Just double-click index.html in your file browser
# OR drag index.html into Chrome/Firefox/Edge
```
That's it. No server needed. Works 100% offline.

---

### Method 2 — Deploy on GitHub Pages (FREE, permanent URL)

**Step 1: Create GitHub account** at github.com (free)

**Step 2: Create a new repository**
- Click "+" → "New repository"
- Name: `datapulse` (or anything)
- Set to **Public**
- Click "Create repository"

**Step 3: Upload your files**
```
Option A — GitHub Website:
  - Click "uploading an existing file"
  - Drag the entire datapulse folder contents
  - Commit changes

Option B — Git CLI:
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/datapulse.git
  git push -u origin main
```

**Step 4: Enable GitHub Pages**
- Go to repository Settings → Pages
- Source: "Deploy from a branch" → branch: main → folder: / (root)
- Save

**Your site is live at:** `https://YOUR_USERNAME.github.io/datapulse/`
*(Takes 1–2 minutes to go live)*

---

### Method 3 — Deploy on Netlify (FREE, custom domain support)

**Step 1:** Go to [netlify.com](https://netlify.com) → Sign up free

**Step 2:** Drag & drop your project folder onto the Netlify dashboard

**Step 3:** Your app is live instantly at a URL like `https://amazing-tesla-123.netlify.app`

**Optional — Custom Domain:**
- Buy domain on Namecheap/GoDaddy (~₹800/year)
- In Netlify: Site Settings → Domain management → Add custom domain
- Follow DNS instructions (15 minutes)
- **Free SSL/HTTPS** included automatically

---

### Method 4 — Deploy on Vercel (FREE, fastest CDN)

```bash
# Install Vercel CLI
npm install -g vercel

# In your project folder
vercel

# Follow prompts — live in 60 seconds
```

---

## 📁 Project Structure

```
datapulse/
├── index.html          # Main app — single entry point
├── css/
│   └── style.css       # Complete design system (dark theme)
├── js/
│   ├── analytics.js    # Data Science models (regression, RFM, forecasting)
│   ├── charts.js       # Chart.js visualisation engine
│   └── app.js          # UI controller, event handling, page logic
└── README.md           # This file
```

---

## 🔬 Data Science Models Implemented

| Model | Use Case | Location |
|-------|----------|----------|
| OLS Linear Regression | Revenue trend + trendline | `analytics.js → linearRegression()` |
| Holt's Exponential Smoothing | Time series smoothing | `analytics.js → exponentialSmoothing()` |
| Ensemble Forecast | 12-month prediction (60% OLS + 40% Holt's) | `analytics.js → buildForecast()` |
| Additive Seasonal Decomposition | Seasonal pattern isolation | `analytics.js → seasonalComponent()` |
| 90% Confidence Intervals | Forecast uncertainty bands | `analytics.js → buildForecast()` |
| RFM Segmentation | Customer value scoring | `analytics.js → computeRFMSegments()` |
| LTV Modelling | Customer lifetime value | `analytics.js → computeKPIs()` |
| LTV:CAC Ratio | Unit economics efficiency | `analytics.js → computeKPIs()` |
| ROAS Analysis | Ad spend efficiency | `analytics.js → computeKPIs()` |

---

## 📊 CSV Format Guide

Your CSV should have column headers in the first row. The app auto-detects common column names:

```csv
date,revenue,customers,aov,retention,adspend
2024-01,420000,180,2333,32,45000
2024-02,450000,195,2307,34,48000
2024-03,480000,210,2285,36,50000
2024-04,510000,225,2266,38,52000
2024-05,490000,215,2279,37,51000
2024-06,530000,240,2208,39,55000
```

**Supported column name variations:**
- Revenue: `revenue`, `sales`, `amount`, `turnover`, `income`, `gmv`
- Customers: `customers`, `clients`, `buyers`, `users`, `orders`, `count`
- AOV: `aov`, `average`, `avg_order`, `order_value`
- Retention: `retention`, `repeat`, `churn`, `returning`

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| HTML5 | Structure | — |
| CSS3 (Custom Properties) | Design System | — |
| Vanilla JavaScript | App Logic + DS Models | ES2020 |
| Chart.js | Data Visualisation | 4.4.1 |
| PapaParse | CSV Parsing | 5.4.1 |
| Space Grotesk | UI Font | Google Fonts |
| JetBrains Mono | Code/Numbers Font | Google Fonts |

**Zero backend required. No API keys. No cost to run.**

---

## 💼 Portfolio Talking Points

When presenting this project in interviews or portfolio reviews:

1. **"I implemented OLS regression from scratch"** — Show `linearRegression()` in analytics.js
2. **"Ensemble modelling for better accuracy"** — Explain 60/40 OLS + Holt's blend
3. **"RFM segmentation based on CLV theory"** — Discuss Recency/Frequency/Monetary scoring
4. **"Confidence intervals follow statistical theory"** — ±1.645σ for 90% CI
5. **"CSV auto-ingestion with fuzzy column matching"** — Show `populateFromCSV()` in app.js
6. **"Privacy-first architecture"** — All compute client-side, zero data leaves browser
7. **"Responsive, accessible UI"** — WCAG 2.1 AA, mobile to 4K

---

## ✏️ Customisation Guide

### Change Colour Scheme
Edit CSS variables in `css/style.css` (top of file):
```css
:root {
  --primary: #6366F1;   /* Change to your brand color */
  --accent:  #06B6D4;   /* Secondary accent */
  ...
}
```

### Add Your Own Industry Benchmarks
In `js/analytics.js → generateRecommendations()`, add industry-specific checks:
```js
if (data.industry === 'saas') {
  // SaaS-specific recommendation logic
}
```

### Extend the Forecast Model
In `js/analytics.js → buildForecast()`, you can tune:
```js
const alpha = 0.25;  // Holt's level smoothing (0–1)
const beta  = 0.15;  // Holt's trend smoothing (0–1)
```

---

## 📄 License

MIT License — free for personal and commercial use.

---

*Built as a Data Science portfolio project. All analysis is computed client-side using JavaScript implementations of standard statistical models.*
