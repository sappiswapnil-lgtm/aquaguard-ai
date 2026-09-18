# AquaGuard AI

A community-powered early-warning demo for water-borne health risks. It combines anonymous community reports, field water-quality readings and rainfall into an **explainable** 0–100 risk score per area, with early-warning alerts, a cluster map, analytics and a demo authority console.

> Decision support only — not a medical diagnosis. All data is synthetic/demo data generated in the browser.

**No build step, no dependencies.** Plain HTML, CSS and vanilla JavaScript.

## Run it

- Open `index.html` directly in a browser, **or**
- `python3 -m http.server 8000` and visit http://localhost:8000

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository (branch `main`).
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The included workflow (`.github/workflows/pages.yml`) publishes the site on every push.

## Pages

| Route | What it does |
|---|---|
| `#/` | Landing page with live district signal |
| `#/dashboard` | Public dashboard: district score, KPIs, latest reports |
| `#/map` | Cluster map with per-area risk profile |
| `#/warnings` | Early Warning Center with reasons and recommended steps |
| `#/analytics` | Trends, water-quality indicators, rainfall correlation |
| `#/report` | Anonymous community report form |
| `#/water-quality` | Field-worker water-quality entry with live status |
| `#/simulator` | Five scenarios + reset |
| `#/authority` | Triage queue, team assignment, CSV export, sampling plan |
| `#/privacy` | Privacy & safety |

## Risk model

| Factor | Weight |
|---|---|
| Symptom increase | 30% |
| Geographic clustering | 20% |
| Water-quality signal | 25% |
| Affected households | 15% |
| Environmental conditions | 10% |

Each factor is scored 0–100 and combined by weight. Levels: Low < 25, Moderate 25–49, High 50–74, Critical ≥ 75. Every alert shows its factor breakdown. Logic lives in `js/engine.js`; thresholds and demo data in `js/data.js`.

## Data & privacy

Nothing leaves the browser. Reports, readings and authority actions are stored in `localStorage` (key `aquaguard.demo.v1`); use **Demo → Reset demo data** to clear them.

## Structure

```
index.html
css/styles.css
js/core.js  data.js  engine.js  store.js  ui.js  charts.js  app.js
js/pages/   home dashboard map warnings analytics report waterquality simulator authority privacy
```
