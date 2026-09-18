/* AquaGuard AI — reference data and the deterministic synthetic dataset builder.
   Everything here is SYNTHETIC demo data. */
(function () {
  'use strict';
  var AG = window.AG;
  AG.WINDOW = 90; // days of history held in the demo dataset (index 89 = today)

  /* ---------- Areas (6 areas under watch) ---------- */
  AG.AREAS = [
    { id: 'hillcrest', name: 'Hillcrest Panchayat', short: 'Hillcrest', kind: 'Panchayat', pop: 11200, lowLying: false, total: 174, nSources: 13, rainFactor: 0.9, cell: { x: 30, y: 30, w: 270, h: 215 } },
    { id: 'greenpark', name: 'Green Park Layout', short: 'Green Park', kind: 'Layout', pop: 14300, lowLying: false, total: 174, nSources: 13, rainFactor: 1.0, cell: { x: 320, y: 30, w: 270, h: 200 } },
    { id: 'oldmarket', name: 'Old Market Ward', short: 'Old Market', kind: 'Ward', pop: 21800, lowLying: false, total: 252, nSources: 14, rainFactor: 1.0, cell: { x: 610, y: 30, w: 260, h: 235 } },
    { id: 'riverside', name: 'Riverside Colony', short: 'Riverside', kind: 'Colony', pop: 18400, lowLying: true, total: 240, nSources: 16, rainFactor: 1.15, cell: { x: 30, y: 300, w: 270, h: 210 } },
    { id: 'canal', name: 'Canal Road Colony', short: 'Canal Road', kind: 'Colony', pop: 17200, lowLying: true, total: 228, nSources: 15, rainFactor: 1.1, cell: { x: 320, y: 290, w: 270, h: 220 } },
    { id: 'lakeview', name: 'Lakeview Nagar', short: 'Lakeview', kind: 'Nagar', pop: 16100, lowLying: false, total: 216, nSources: 13, rainFactor: 1.0, cell: { x: 610, y: 300, w: 260, h: 210 } }
  ];
  AG.AREA_BY_ID = {};
  AG.AREAS.forEach(function (a) { AG.AREA_BY_ID[a.id] = a; });

  /* ---------- Form option lists ---------- */
  AG.SYMPTOMS = ['Diarrhoea', 'Vomiting', 'Abdominal pain', 'Fever', 'Nausea', 'Dehydration'];
  AG.SOURCE_TYPES = ['Borewell', 'Municipal supply', 'Open well', 'Hand pump', 'Tanker water', 'Community tank'];
  AG.APPEARANCE = ['Clear', 'Slightly cloudy', 'Muddy / turbid', 'Yellow-brown / discoloured', 'Foamy or oily'];
  AG.SMELL = ['None', 'Chlorine', 'Earthy / musty', 'Sewage / rotten-egg', 'Chemical'];
  AG.RAINFALL = ['None', 'Light', 'Moderate', 'Heavy'];
  AG.SANITATION = ['None', 'Open drain nearby', 'Sewage overflow', 'Garbage dumping', 'Leaking pipeline', 'Open defecation'];

  /* ---------- Demo reference thresholds (configurable — not medical standards) ---------- */
  AG.THRESHOLDS = {
    ph: { label: 'pH', min: 6.5, max: 8.5, unit: '', severeLo: 6.0, severeHi: 9.0 },
    turbidity: { label: 'Turbidity', min: 0, max: 5, unit: 'NTU', severeHi: 10 },
    tds: { label: 'TDS', min: 0, max: 600, unit: 'mg/L', severeHi: 900 },
    chlorine: { label: 'Chlorine (residual)', min: 0.2, max: 2, unit: 'mg/L', severeLo: 0.1, severeHi: 4 },
    temperature: { label: 'Temperature', min: 0, max: 35, unit: '°C', severeHi: 40 }
  };

  AG.evalReading = function (r) {
    var issues = [];
    ['ph', 'turbidity', 'tds', 'chlorine', 'temperature'].forEach(function (k) {
      var t = AG.THRESHOLDS[k], v = r[k];
      if (v == null || v === '' || isNaN(v)) return;
      var low = v < t.min, high = v > t.max;
      if (!low && !high) return;
      var severe = (low && t.severeLo != null && v < t.severeLo) || (high && t.severeHi != null && v > t.severeHi);
      issues.push({
        param: k, label: t.label, value: v, unit: t.unit, dir: low ? 'below' : 'above',
        range: t.min + '–' + t.max + (t.unit ? ' ' + t.unit : ''), severe: severe
      });
    });
    if (r.ecoli) {
      issues.push({ param: 'ecoli', label: 'E. coli indicator', value: 'present', unit: '', dir: '', range: 'should be absent', severe: true });
    }
    var status = 'normal';
    if (issues.length) {
      status = issues.length >= 2 || issues.some(function (i) { return i.severe; }) ? 'concern' : 'watch';
    }
    return { status: status, issues: issues };
  };

  AG.readingMessage = function (ev) {
    if (ev.status === 'normal') return 'All measured values sit inside the demo reference ranges.';
    var parts = ev.issues.map(function (i) {
      if (i.param === 'ecoli') return 'E. coli indicator is present (should be absent)';
      return i.label + ' ' + i.value + (i.unit ? ' ' + i.unit : '') + ' is ' + i.dir + ' the ' + i.range + ' reference range';
    });
    var lead = ev.status === 'concern' ? 'Needs follow-up: ' : 'Slightly outside range: ';
    return lead + parts.join('; ') + '.';
  };

  /* ---------- Scenarios (Demo simulator) ---------- */
  AG.SCENARIOS = [
    { id: 'normal', name: 'Normal Conditions', icon: 'check', desc: 'Reports follow the seasonal baseline and all sources sit inside reference thresholds.' },
    { id: 'rising', name: 'Rising Symptoms', icon: 'trend', desc: 'Gastrointestinal symptom reports climb sharply above the 7-day baseline.' },
    { id: 'contamination', name: 'Water Contamination Signal', icon: 'flask', desc: 'Multiple sources report abnormal turbidity, pH and an E. coli indicator.' },
    { id: 'rainfall', name: 'Heavy Rainfall', icon: 'rain', desc: 'Sustained rainfall raises run-off and contamination risk across low-lying wards.' },
    { id: 'cluster', name: 'Geographic Cluster', icon: 'pin', desc: 'Reports concentrate heavily inside one ward while the district stays flat.' }
  ];
  AG.SCENARIO_BY_ID = {};
  AG.SCENARIOS.forEach(function (s) { AG.SCENARIO_BY_ID[s.id] = s; });

  /* ---------- Registered water sources (84) ---------- */
  var TYPE_STATS = {
    'Borewell': { tds: 390, w: 0.25 },
    'Municipal supply': { tds: 240, w: 0.25 },
    'Open well': { tds: 330, w: 0.10 },
    'Hand pump': { tds: 360, w: 0.15 },
    'Tanker water': { tds: 280, w: 0.10 },
    'Community tank': { tds: 300, w: 0.15 }
  };
  function pad2(n) { return ('0' + n).slice(-2); }

  AG.SOURCES = (function () {
    var rand = AG.rng(7741), out = [];
    var typeItems = AG.SOURCE_TYPES.map(function (t) { return [t, TYPE_STATS[t].w]; });
    AG.AREAS.forEach(function (a) {
      var prefix = a.id.slice(0, 2).toUpperCase();
      for (var i = 1; i <= a.nSources; i++) {
        var type = AG.weighted(rand, typeItems), c = a.cell;
        out.push({
          id: prefix + '-' + pad2(i), areaId: a.id, type: type,
          name: a.short + ' ' + type + ' ' + pad2(i),
          x: Math.round(c.x + 34 + rand() * (c.w - 68)),
          y: Math.round(c.y + 62 + rand() * (c.h - 92))
        });
      }
    });
    return out;
  })();
  AG.SOURCE_BY_ID = {};
  AG.SOURCES.forEach(function (s) { AG.SOURCE_BY_ID[s.id] = s; });

  /* ---------- Dataset builder ---------- */
  function rainLabel(mm) { return mm < 2 ? 'None' : mm < 10 ? 'Light' : mm < 30 ? 'Moderate' : 'Heavy'; }

  var BASE_APPEAR = [['Clear', 0.86], ['Slightly cloudy', 0.09], ['Muddy / turbid', 0.05]];
  var BASE_SMELL = [['None', 0.88], ['Chlorine', 0.06], ['Earthy / musty', 0.06]];
  var BASE_SANIT = [['None', 0.84], ['Open drain nearby', 0.08], ['Garbage dumping', 0.05], ['Leaking pipeline', 0.03]];
  var BASE_SYM = [['Diarrhoea', 0.28], ['Fever', 0.18], ['Abdominal pain', 0.2], ['Nausea', 0.12], ['Vomiting', 0.14], ['Dehydration', 0.08]];
  var GI_SYM = [['Diarrhoea', 0.34], ['Vomiting', 0.22], ['Abdominal pain', 0.2], ['Nausea', 0.14], ['Dehydration', 0.05], ['Fever', 0.05]];

  function pickSymptoms(rand, table, count) {
    var chosen = [], guard = 0;
    while (chosen.length < count && guard++ < 20) {
      var s = AG.weighted(rand, table);
      if (chosen.indexOf(s) < 0) chosen.push(s);
    }
    return chosen;
  }

  AG.keyToIndex = function (key, days) {
    return Math.round((AG.parseKey(key) - AG.parseKey(days[0])) / 86400000);
  };

  AG.buildDataset = function (scenario, userReports, userReadings) {
    var N = AG.WINDOW, today = AG.today(), days = [];
    for (var i = 0; i < N; i++) days.push(AG.dayKey(AG.addDays(today, i - (N - 1))));

    var rand = AG.rng(20260919);                       // baseline stream — never depends on scenario
    var srand = AG.rng(AG.hash('scenario:' + scenario) + 17); // scenario stream

    /* Rainfall (mm/day) per area */
    var rainD = [];
    for (i = 0; i < N; i++) { var rr = rand(); rainD.push(rr < 0.10 ? 6 + rand() * 24 : rr < 0.32 ? rand() * 4 : 0); }
    var rain = {};
    AG.AREAS.forEach(function (a) {
      rain[a.id] = rainD.map(function (v) { return AG.round(v * a.rainFactor * (0.9 + rand() * 0.2), 1); });
    });
    if (scenario === 'rainfall') {
      var pat = [22, 48, 66, 74, 58, 41];
      AG.AREAS.forEach(function (a) {
        pat.forEach(function (mm, j) { rain[a.id][N - 6 + j] = AG.round(mm * a.rainFactor * (0.92 + srand() * 0.16), 1); });
      });
    }
    function rainAt(areaId, di) { return rainLabel(Math.max(rain[areaId][di], di > 0 ? rain[areaId][di - 1] : 0)); }

    /* Baseline reports — exactly 1,284 across 90 days */
    var reports = [], counter = 0;
    var areaSources = {};
    AG.AREAS.forEach(function (a) { areaSources[a.id] = AG.SOURCES.filter(function (s) { return s.areaId === a.id; }); });

    function makeReport(a, di, cfg, r) {
      var src = cfg.fixedSources && r() < 0.85 ? AG.pick(r, cfg.fixedSources) : AG.pick(r, areaSources[a.id]);
      return {
        id: 'R' + (++counter), areaId: a.id, date: days[di], di: di,
        affected: cfg.affected(r),
        symptoms: pickSymptoms(r, cfg.sym, AG.weighted(r, cfg.symCount)),
        sourceId: src.id, sourceType: src.type,
        appearance: AG.weighted(r, cfg.appear), smell: AG.weighted(r, cfg.smell),
        rainfall: rainAt(a.id, di), sanitation: AG.weighted(r, cfg.sanit),
        notes: '', origin: 'synthetic'
      };
    }
    var baseCfg = {
      affected: function (r) { return AG.pick(r, [1, 1, 2, 2, 2, 3, 3, 4, 5]); },
      sym: BASE_SYM, symCount: [[1, 0.5], [2, 0.35], [3, 0.15]],
      appear: BASE_APPEAR, smell: BASE_SMELL, sanit: BASE_SANIT
    };

    AG.AREAS.forEach(function (a) {
      var wts = days.map(function (_, d) { return (0.8 + 0.4 * rand()) * (1 + 0.18 * Math.sin((d / 90) * Math.PI * 3)); });
      var s = AG.sum(wts), acc = 0, prev = 0;
      wts.forEach(function (w, d) {
        acc += (a.total * w) / s;
        var c = Math.round(acc) - prev;
        prev += c;
        for (var k = 0; k < c; k++) reports.push(makeReport(a, d, baseCfg, rand));
      });
    });

    /* Scenario injection — extra reports over the last few days */
    function inject(areaId, startDi, pattern, weight, cfg) {
      var a = AG.AREA_BY_ID[areaId];
      pattern.forEach(function (n, j) {
        var count = Math.floor(n * weight + srand());
        for (var k = 0; k < count; k++) reports.push(makeReport(a, startDi + j, cfg, srand));
      });
    }
    var giCfg = {
      affected: function (r) { return AG.pick(r, [2, 3, 3, 4, 4, 5, 6, 7]); },
      sym: GI_SYM, symCount: [[1, 0.25], [2, 0.5], [3, 0.25]],
      appear: BASE_APPEAR, smell: BASE_SMELL, sanit: BASE_SANIT
    };
    if (scenario === 'rising') {
      var wRise = { riverside: 1, lakeview: 0.85, canal: 0.4, oldmarket: 0.3, greenpark: 0.12, hillcrest: 0.1 };
      Object.keys(wRise).forEach(function (id) { inject(id, N - 7, [3, 4, 5, 6, 7, 8, 9], wRise[id], giCfg); });
    }
    if (scenario === 'contamination') {
      var wCont = { canal: 1, riverside: 0.8, greenpark: 0.6 };
      var contCfg = {
        affected: giCfg.affected, sym: GI_SYM, symCount: giCfg.symCount,
        appear: [['Muddy / turbid', 0.4], ['Yellow-brown / discoloured', 0.3], ['Slightly cloudy', 0.2], ['Clear', 0.1]],
        smell: [['Sewage / rotten-egg', 0.4], ['Chemical', 0.1], ['Earthy / musty', 0.2], ['None', 0.3]],
        sanit: BASE_SANIT
      };
      Object.keys(wCont).forEach(function (id) { inject(id, N - 6, [2, 3, 4, 5, 6, 7], wCont[id], contCfg); });
    }
    if (scenario === 'rainfall') {
      var wRain = { riverside: 1, canal: 0.95, lakeview: 0.45, oldmarket: 0.3, greenpark: 0.15, hillcrest: 0.1 };
      var rainCfg = {
        affected: giCfg.affected, sym: GI_SYM, symCount: giCfg.symCount,
        appear: [['Muddy / turbid', 0.45], ['Slightly cloudy', 0.3], ['Yellow-brown / discoloured', 0.15], ['Clear', 0.1]],
        smell: [['Earthy / musty', 0.4], ['Sewage / rotten-egg', 0.2], ['None', 0.4]],
        sanit: [['Sewage overflow', 0.35], ['Open drain nearby', 0.3], ['None', 0.25], ['Garbage dumping', 0.1]]
      };
      Object.keys(wRain).forEach(function (id) { inject(id, N - 5, [3, 5, 8, 9, 10], wRain[id], rainCfg); });
    }
    if (scenario === 'cluster') {
      var om = areaSources.oldmarket;
      var fixed = [om[0], om[1], om[2]];
      var clCfg = {
        affected: function (r) { return AG.pick(r, [3, 4, 5, 6, 7, 8, 9]); },
        sym: GI_SYM, symCount: [[2, 0.5], [3, 0.5]],
        appear: BASE_APPEAR, smell: BASE_SMELL,
        sanit: [['Open drain nearby', 0.3], ['None', 0.5], ['Leaking pipeline', 0.2]],
        fixedSources: fixed
      };
      inject('oldmarket', N - 6, [6, 9, 11, 13, 15, 17], 1, clCfg);
    }

    /* Water-quality readings — 9 per source (latest within the last 7 days, then every 10 days) */
    var readings = [], rcounter = 0;
    function baseReading(src, di, latest) {
      var st = TYPE_STATS[src.type];
      return {
        id: 'Q' + (++rcounter), sourceId: src.id, areaId: src.areaId, sourceType: src.type,
        date: days[di], di: di, latest: latest,
        ph: AG.round(AG.clamp(AG.normal(rand, 7.35, 0.22), 6.8, 8.0), 1),
        turbidity: AG.round(AG.clamp(Math.abs(AG.normal(rand, 1.5, 0.7)), 0.2, 3.6), 1),
        tds: Math.round(AG.clamp(AG.normal(rand, st.tds, 40), 120, 560)),
        chlorine: AG.round(AG.clamp(AG.normal(rand, 0.75, 0.15), 0.4, 1.2), 2),
        temperature: AG.round(AG.normal(rand, 26, 1.8), 1),
        ecoli: false, origin: 'synthetic'
      };
    }
    AG.SOURCES.forEach(function (src) {
      var d0 = Math.floor(rand() * 7);
      for (var k = 0; k < 9; k++) {
        var di = N - 1 - (d0 + 10 * k);
        if (di < 0) break;
        readings.push(baseReading(src, di, k === 0));
      }
    });
    function latestOf(srcId) { return readings.filter(function (r) { return r.sourceId === srcId && r.latest; })[0]; }
    function degrade(src, mode) {
      var rd = latestOf(src.id);
      if (!rd) return;
      if (mode === 'mild') { rd.turbidity = AG.round(5.2 + srand() * 1.6, 1); return; }
      if (mode === 'rain') {
        rd.turbidity = AG.round(5.3 + srand() * 4, 1);
        rd.chlorine = AG.round(0.08 + srand() * 0.1, 2);
        rd.ecoli = srand() < 0.14;
        return;
      }
      /* severe contamination */
      rd.turbidity = AG.round(6 + srand() * 9, 1);
      rd.ph = srand() < 0.5 ? AG.round(5.8 + srand() * 0.6, 1) : AG.round(8.7 + srand() * 0.6, 1);
      rd.chlorine = AG.round(0.03 + srand() * 0.12, 2);
      if (srand() < 0.4) rd.tds = Math.round(620 + srand() * 280);
      rd.ecoli = srand() < 0.5;
    }
    if (scenario === 'contamination') {
      var fr = { canal: 0.75, riverside: 0.6, greenpark: 0.45 };
      Object.keys(fr).forEach(function (id) {
        areaSources[id].forEach(function (src) { if (srand() < fr[id]) degrade(src, srand() < 0.65 ? 'severe' : 'mild'); });
      });
    }
    if (scenario === 'rainfall') {
      var fr2 = { riverside: 0.55, canal: 0.55, lakeview: 0.25, oldmarket: 0.15 };
      Object.keys(fr2).forEach(function (id) {
        areaSources[id].forEach(function (src) { if (srand() < fr2[id]) degrade(src, srand() < 0.5 ? 'mild' : 'rain'); });
      });
    }
    if (scenario === 'rising') {
      ['riverside', 'lakeview'].forEach(function (id) { areaSources[id].slice(0, 2).forEach(function (src) { degrade(src, 'mild'); }); });
    }
    if (scenario === 'cluster') {
      areaSources.oldmarket.slice(0, 3).forEach(function (src) { degrade(src, 'mild'); });
    }

    /* Community-added data from this browser */
    (userReports || []).forEach(function (u) {
      var di = AG.keyToIndex(u.date, days);
      if (di < 0 || di >= N) return;
      reports.push(Object.assign({}, u, { di: di, origin: 'user' }));
    });
    (userReadings || []).forEach(function (u) {
      var di = AG.keyToIndex(u.date, days);
      if (di < 0 || di >= N) return;
      readings.push(Object.assign({}, u, { di: di, latest: false, origin: 'user' }));
    });

    readings.forEach(function (r) {
      var ev = AG.evalReading(r);
      r.status = ev.status;
      r.issues = ev.issues;
    });

    return { scenario: scenario, days: days, today: today, reports: reports, readings: readings, rain: rain, sources: AG.SOURCES };
  };
})();
