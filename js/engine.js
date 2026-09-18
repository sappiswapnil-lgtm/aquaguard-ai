/* AquaGuard AI — transparent risk engine.
   Every score is a weighted sum of five factor scores (each 0–100), so any alert can show exactly how it was built.
     Symptom increase ........ 30 %
     Geographic clustering ... 20 %
     Water-quality signal .... 25 %
     Affected households ..... 15 %
     Environmental conditions . 10 %
*/
(function () {
  'use strict';
  var AG = window.AG;

  AG.FACTORS = [
    { key: 'symptom', label: 'Symptom increase', weight: 0.30, color: '#0E7C86' },
    { key: 'cluster', label: 'Geographic clustering', weight: 0.20, color: '#3B82C4' },
    { key: 'water', label: 'Water-quality signal', weight: 0.25, color: '#27A9B8' },
    { key: 'households', label: 'Affected households', weight: 0.15, color: '#6C7BD1' },
    { key: 'environment', label: 'Environmental conditions', weight: 0.10, color: '#8FB8A0' }
  ];

  AG.LEVELS = {
    low: { key: 'low', label: 'Low', color: '#2E9E6B', soft: '#E1F4EA', ink: '#1B6E49', rank: 0 },
    moderate: { key: 'moderate', label: 'Moderate', color: '#D9A21B', soft: '#FBF1D4', ink: '#8A6408', rank: 1 },
    high: { key: 'high', label: 'High', color: '#E0702B', soft: '#FCE6D6', ink: '#A2470F', rank: 2 },
    critical: { key: 'critical', label: 'Critical', color: '#D2413D', soft: '#FADDDB', ink: '#9C2521', rank: 3 }
  };
  AG.levelFor = function (score) {
    return score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'moderate' : 'low';
  };

  var RECENT_FROM = 83;          // last 7 days = indices 83..89
  var BASE_FROM = 55;            // baseline = the 28 days before that (55..82)
  var HOUSEHOLD_SIZE = 4.5;      // demo assumption (people per household)

  function countBy(list, fn) {
    var m = {};
    list.forEach(function (x) { var k = fn(x); m[k] = (m[k] || 0) + 1; });
    return m;
  }

  function analyzeArea(a, ds, dist) {
    var rep = ds.reports.filter(function (r) { return r.areaId === a.id; });
    var recent = rep.filter(function (r) { return r.di >= RECENT_FROM; });
    var prior = rep.filter(function (r) { return r.di >= BASE_FROM && r.di < RECENT_FROM; });
    var baselineWeekly = prior.length / 4;

    /* 1 — symptom increase */
    var ratio = recent.length / Math.max(baselineWeekly, 4);
    var S = AG.clamp(((ratio - 1) / 2) * 100, 0, 100);

    /* 2 — geographic clustering (share of district reports vs usual share) */
    var share = recent.length / Math.max(1, dist.recentTotal);
    var baseShare = prior.length / Math.max(1, dist.priorTotal);
    var C = AG.clamp(((share - baseShare) / 0.3) * 100, 0, 100);
    if (recent.length < 8) C *= recent.length / 8;

    /* 3 — water-quality signal (latest reading per source this week) */
    var latest = {};
    ds.readings.forEach(function (r) {
      if (r.areaId !== a.id || r.di < RECENT_FROM) return;
      var key = r.sourceId || 'u:' + r.id;
      if (!latest[key] || r.di >= latest[key].di) latest[key] = r;
    });
    var lr = Object.keys(latest).map(function (k) { return latest[k]; });
    var nConcern = lr.filter(function (r) { return r.status === 'concern'; }).length;
    var nWatch = lr.filter(function (r) { return r.status === 'watch'; }).length;
    var nEcoli = lr.filter(function (r) { return r.ecoli; }).length;
    var f = lr.length ? (2 * nConcern + nWatch) / (2 * lr.length) : 0;
    var W = AG.clamp((f / 0.35) * 100, 0, 100);
    if (nEcoli > 0) W = Math.max(W, Math.min(100, 35 + 15 * nEcoli));

    /* 4 — affected households (people reported per 1,000 residents this week) */
    var affected = AG.sum(recent, function (r) { return r.affected; });
    var rate = (affected / a.pop) * 1000;
    var H = AG.clamp(((rate - 2) / 10) * 100, 0, 100);

    /* 5 — environmental conditions (5-day rainfall + sanitation mentions) */
    var rain5 = AG.sum(ds.rain[a.id].slice(85), function (v) { return v; });
    var rainScore = AG.clamp((rain5 / 120) * 100, 0, 100) * (a.lowLying ? 1 : 0.8);
    var sanShare = recent.length ? recent.filter(function (r) { return r.sanitation && r.sanitation !== 'None'; }).length / recent.length : 0;
    var sanScore = AG.clamp((sanShare / 0.5) * 100, 0, 100);
    var E = AG.clamp(0.6 * rainScore + 0.4 * sanScore, 0, 100);

    var scores = { symptom: S, cluster: C, water: W, households: H, environment: E };
    var factors = AG.FACTORS.map(function (fc) {
      return { key: fc.key, label: fc.label, weight: fc.weight, color: fc.color, score: scores[fc.key], points: scores[fc.key] * fc.weight };
    });
    var total = AG.sum(factors, function (x) { return x.points; });
    var score = Math.round(total);

    var symCounts = countBy([].concat.apply([], recent.map(function (r) { return r.symptoms; })), function (s) { return s; });
    var topSymptoms = Object.keys(symCounts).map(function (k) { return { name: k, count: symCounts[k] }; })
      .sort(function (x, y) { return y.count - x.count; });

    return {
      area: a, score: score, level: AG.levelFor(score), factors: factors,
      recentCount: recent.length, baselineWeekly: baselineWeekly, ratio: ratio,
      share: share, baseShare: baseShare,
      affected: affected, households: Math.ceil(affected / HOUSEHOLD_SIZE), ratePer1000: rate,
      rain5: rain5, sanShare: sanShare,
      nReadings: lr.length, nConcern: nConcern, nWatch: nWatch, nEcoli: nEcoli,
      flaggedReadings: lr.filter(function (r) { return r.status !== 'normal'; })
        .sort(function (x, y) { return (y.status === 'concern') - (x.status === 'concern'); }),
      topSymptoms: topSymptoms,
      recentReports: recent.slice().sort(function (x, y) { return y.di - x.di; })
    };
  }

  var ACTIONS = {
    symptom: [
      'Check report volume against clinic and sub-centre records to confirm the increase is real.',
      'Send a field team to speak with affected households and look for a shared exposure such as a source, event or meal.',
      'Make sure oral rehydration salts (ORS) and hydration guidance are available locally.'
    ],
    cluster: [
      'Map the reporting households to find a shared street, source or pipeline.',
      'Inspect the water source and pipeline segment serving the cluster.'
    ],
    water: [
      'Collect confirmatory laboratory samples from the flagged sources.',
      'Check residual chlorine at distribution end-points and tanks.',
      'Consider an interim safe-water advisory (boil, chlorinate or alternative supply) while results are pending.'
    ],
    households: [
      'Estimate the number of households affected and plan door-to-door awareness on safe water and hygiene.'
    ],
    environment: [
      'Inspect open drains, sewage overflow and garbage near water sources.',
      'Increase chlorination checks after heavy rain and avoid drawing from flooded sources.'
    ]
  };
  var TITLES = {
    symptom: 'Unusual rise in symptom reports',
    cluster: 'Geographic cluster of reports',
    water: 'Water-quality readings outside reference ranges',
    households: 'Large number of households affected',
    environment: 'Rainfall run-off and sanitation risk'
  };

  function reasonsFor(an) {
    var out = {};
    out.symptom = an.recentCount + ' reports in the last 7 days against a usual ' + Math.round(an.baselineWeekly) +
      ' per week (' + an.ratio.toFixed(1) + '×).' +
      (an.topSymptoms.length ? ' Most reported: ' + an.topSymptoms.slice(0, 3).map(function (s) { return s.name.toLowerCase() + ' (' + s.count + ')'; }).join(', ') + '.' : '');
    out.cluster = Math.round(an.share * 100) + '% of all district reports this week came from ' + an.area.name +
      ', against a usual ' + Math.round(an.baseShare * 100) + '%.';
    out.water = an.nConcern + ' of ' + an.nReadings + ' readings this week are in Concern and ' + an.nWatch + ' in Watch' +
      (an.nEcoli ? '; the E. coli indicator is present at ' + an.nEcoli + ' source' + (an.nEcoli > 1 ? 's' : '') : '') + '.';
    out.households = 'About ' + an.households + ' households (' + an.affected + ' people) reported affected — ' +
      an.ratePer1000.toFixed(1) + ' per 1,000 residents.';
    out.environment = Math.round(an.rain5) + ' mm of rain in the last 5 days' + (an.area.lowLying ? ' in a low-lying area' : '') + '; ' +
      Math.round(an.sanShare * 100) + '% of this week’s reports mention a nearby sanitation issue.';
    return out;
  }

  AG.analyze = function (ds) {
    var recentAll = ds.reports.filter(function (r) { return r.di >= RECENT_FROM; });
    var priorAll = ds.reports.filter(function (r) { return r.di >= BASE_FROM && r.di < RECENT_FROM; });
    var dist = { recentTotal: recentAll.length, priorTotal: priorAll.length };

    var areas = AG.AREAS.map(function (a) { return analyzeArea(a, ds, dist); });
    var byId = {};
    areas.forEach(function (x) { byId[x.area.id] = x; });

    /* District score blends the worst area with the population-weighted mean */
    var totalPop = AG.sum(AG.AREAS, function (a) { return a.pop; });
    var wmean = AG.sum(areas, function (x) { return x.score * x.area.pop; }) / totalPop;
    var maxScore = Math.max.apply(null, areas.map(function (x) { return x.score; }));
    var dScore = Math.round(0.5 * maxScore + 0.5 * wmean);

    /* Warnings */
    var warnings = areas.filter(function (x) { return x.level !== 'low'; }).map(function (an) {
      var ranked = an.factors.slice().sort(function (x, y) { return y.points - x.points; });
      var reasons = reasonsFor(an);
      var drivers = ranked.filter(function (f) { return f.score >= 20; }).slice(0, 3);
      if (!drivers.length) drivers = ranked.slice(0, 1);
      var actions = [];
      drivers.forEach(function (d) { ACTIONS[d.key].forEach(function (t) { if (actions.indexOf(t) < 0) actions.push(t); }); });
      actions.push('Escalate to the district public-health team for professional investigation and laboratory confirmation — this is an indicator, not a confirmed outbreak.');
      return {
        id: 'w-' + an.area.id, areaId: an.area.id, area: an.area, level: an.level, score: an.score,
        title: TITLES[ranked[0].key] + ' — ' + an.area.name,
        primary: ranked[0].key, factors: an.factors,
        drivers: drivers.map(function (d) { return { key: d.key, label: d.label, score: d.score, weight: d.weight, points: d.points, text: reasons[d.key] }; }),
        actions: actions, an: an
      };
    }).sort(function (x, y) { return y.score - x.score; });

    /* Per-source status (latest reading) */
    var sourceState = {};
    ds.sources.forEach(function (s) { sourceState[s.id] = { status: 'normal', reading: null }; });
    ds.readings.forEach(function (r) {
      if (!r.sourceId) return;
      var cur = sourceState[r.sourceId];
      if (!cur.reading || r.di >= cur.reading.di) sourceState[r.sourceId] = { status: r.status, reading: r };
    });
    var flaggedSources = ds.sources.filter(function (s) { return sourceState[s.id].status !== 'normal'; });

    var districtRecent = recentAll.length;
    var baselineWeekly = priorAll.length / 4;
    var symCounts = countBy([].concat.apply([], recentAll.map(function (r) { return r.symptoms; })), function (s) { return s; });

    return {
      areas: areas, byId: byId, warnings: warnings, sourceState: sourceState, flaggedSources: flaggedSources,
      district: { score: dScore, level: AG.levelFor(dScore) },
      totals: {
        reports: ds.reports.length, recent: districtRecent, baselineWeekly: baselineWeekly,
        change: baselineWeekly ? (districtRecent - baselineWeekly) / baselineWeekly : 0,
        affected: AG.sum(recentAll, function (r) { return r.affected; }),
        sources: ds.sources.length, flagged: flaggedSources.length,
        areasWatch: areas.filter(function (x) { return x.level !== 'low'; }).length,
        symptoms: Object.keys(symCounts).map(function (k) { return { name: k, count: symCounts[k] }; }).sort(function (a, b) { return b.count - a.count; })
      }
    };
  };
})();
