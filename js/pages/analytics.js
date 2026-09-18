/* Time-series analytics */
(function () {
  'use strict';
  var AG = window.AG;
  var ui = { range: 30, area: '', param: 'turbidity' };

  var TYPE_COLORS = {
    'Borewell': '#0E7C86', 'Municipal supply': '#3B82C4', 'Open well': '#D9A21B',
    'Hand pump': '#6C7BD1', 'Tanker water': '#E0702B', 'Community tank': '#5FA37E'
  };
  var PARAMS = [
    { key: 'turbidity', label: 'Turbidity (NTU)' },
    { key: 'ph', label: 'pH' },
    { key: 'tds', label: 'TDS (mg/L)' },
    { key: 'chlorine', label: 'Chlorine (mg/L)' }
  ];

  function series(ds, from, to, areaId) {
    var out = [];
    for (var d = from; d <= to; d++) out.push(0);
    ds.reports.forEach(function (r) {
      if (r.di >= from && r.di <= to && (!areaId || r.areaId === areaId)) out[r.di - from]++;
    });
    return out;
  }
  function rainSeries(ds, from, to, areaId) {
    var ids = areaId ? [areaId] : AG.AREAS.map(function (a) { return a.id; });
    var out = [];
    for (var d = from; d <= to; d++) {
      out.push(AG.round(AG.avg(ids.map(function (id) { return ds.rain[id][d]; })), 1));
    }
    return out;
  }
  function movingAvg(v, n) {
    return v.map(function (_, i) {
      var s = Math.max(0, i - n + 1), sl = v.slice(s, i + 1);
      return AG.round(AG.avg(sl), 1);
    });
  }

  AG.pages.analytics = {
    title: 'Time-Series Analytics — AquaGuard AI',
    render: function (root) {
      var st = AG.store.get(), ds = st.ds, an = st.an;
      var R = ui.range, from = 90 - R, to = 89, area = ui.area || null;
      var labels = ds.days.slice(from).map(AG.fmtShort);
      var counts = series(ds, from, to, area);

      /* baseline daily level from the 28 days before the last 7 */
      var prior = series(ds, 55, 82, area);
      var usual = AG.round(AG.sum(prior) / 28, 2);
      var ma = R > 7 ? movingAvg(counts, 7) : null;
      var symptomSeries = [{ name: 'Reports per day', color: '#0E7C86', values: counts, area: true }];
      if (ma) symptomSeries.push({ name: '7-day average', color: '#3B82C4', values: ma, width: 2 });
      symptomSeries.push({ name: 'Usual level', color: '#8AA0AB', values: counts.map(function () { return usual; }), dashed: true, width: 1.6 });

      /* symptom mix */
      var mix = {};
      ds.reports.forEach(function (r) {
        if (r.di < from || (area && r.areaId !== area)) return;
        r.symptoms.forEach(function (s) { mix[s] = (mix[s] || 0) + 1; });
      });
      var mixList = Object.keys(mix).map(function (k) { return { name: k, count: mix[k] }; }).sort(function (a, b) { return b.count - a.count; });
      var mixMax = Math.max.apply(null, mixList.map(function (m) { return m.count; }).concat([1]));

      /* water quality by source type */
      var bucket = R <= 7 ? 1 : R <= 30 ? 3 : 7;
      var nb = Math.ceil(R / bucket), wqLabels = [], acc = {};
      AG.SOURCE_TYPES.forEach(function (t) { acc[t] = []; for (var b = 0; b < nb; b++) acc[t].push([]); });
      for (var b = 0; b < nb; b++) wqLabels.push(AG.fmtShort(ds.days[from + b * bucket]));
      ds.readings.forEach(function (r) {
        if (r.di < from || (area && r.areaId !== area) || !acc[r.sourceType]) return;
        var v = r[ui.param];
        if (v == null) return;
        var bi = Math.min(nb - 1, Math.floor((r.di - from) / bucket));
        acc[r.sourceType][bi].push(v);
      });
      var wqSeries = AG.SOURCE_TYPES.map(function (t) {
        return {
          name: t, color: TYPE_COLORS[t], dots: true, width: 2,
          values: acc[t].map(function (l) { return l.length ? AG.round(AG.avg(l), ui.param === 'tds' ? 0 : 2) : null; })
        };
      }).filter(function (s) { return s.values.some(function (v) { return v != null; }); });
      var th = AG.THRESHOLDS[ui.param];
      var wqOpts = { labels: wqLabels, series: wqSeries, band: { min: th.min, max: th.max }, ariaLabel: 'Water quality trend by source type', h: 270 };
      if (ui.param === 'ph') { wqOpts.yMin = 5.5; wqOpts.yMax = 9.5; }
      if (ui.param === 'chlorine') { wqOpts.yMin = 0; }
      if (!wqSeries.length) wqSeries.push({ name: 'No readings', color: '#ccc', values: wqLabels.map(function () { return null; }) });

      /* reports by area */
      var byArea = AG.AREAS.map(function (a) {
        var c = ds.reports.filter(function (r) { return r.areaId === a.id && r.di >= from; }).length;
        return { a: a, c: c, per: (c / a.pop) * 1000, level: an.byId[a.id].level };
      }).sort(function (x, y) { return y.c - x.c; });
      var maxArea = Math.max.apply(null, byArea.map(function (x) { return x.c; }).concat([1]));

      /* rainfall vs reports */
      var rain = rainSeries(ds, from, to, area);
      var lag = 1, corr = 0;
      if (counts.length > 4) corr = AG.charts.correlation(rain.slice(0, counts.length - lag), counts.slice(lag));
      var strength = Math.abs(corr) < 0.2 ? 'little to no' : Math.abs(corr) < 0.5 ? 'a moderate' : 'a strong';
      var corrText = 'Rainfall and next-day reports show ' + strength + (corr >= 0 ? ' positive' : ' negative') + ' relationship (r = ' + corr.toFixed(2) + ').';
      if (Math.abs(corr) < 0.2) corrText = 'Rainfall and next-day reports show little to no relationship (r = ' + corr.toFixed(2) + ').';

      root.innerHTML = '<div class="wrap page">' +
        AG.pageHead('Analytics', 'Time-series analytics', 'Compare community health signals against water quality, geography and rainfall.', AG.scenarioBadge()) +
        '<div class="toolbar card">' +
          '<div class="seg-group" role="group" aria-label="Time range">' + [7, 30, 90].map(function (d) {
            return '<button type="button" class="seg' + (R === d ? ' is-on' : '') + '" data-range="' + d + '">' + d + ' days</button>';
          }).join('') + '</div>' +
          '<label class="field-inline"><span>Area</span><select id="an-area">' + AG.areaOptions(ui.area, 'All areas') + '</select></label>' +
        '</div>' +

        '<div class="grid-2 grid-wide-left">' +
          '<section class="card"><h2 class="card-title">Symptom reports over time</h2>' +
            '<div class="legend">' + symptomSeries.map(function (s) { return '<span><i' + (s.dashed ? ' class="dash"' : ' style="background:' + s.color + '"') + '></i>' + s.name + '</span>'; }).join('') + '</div>' +
            AG.charts.line({ labels: labels, series: symptomSeries, ariaLabel: 'Symptom reports per day' }) + '</section>' +
          '<section class="card"><h2 class="card-title">Symptom mix</h2>' +
            (mixList.length ? '<ul class="hbars">' + mixList.map(function (s) {
              return '<li><span>' + AG.esc(s.name) + '</span><div class="bar"><span style="width:' + Math.max(2, (s.count / mixMax) * 100) + '%"></span></div><b>' + s.count + '</b></li>';
            }).join('') + '</ul>' : '<p class="muted">No reports in this range.</p>') + '</section>' +
        '</div>' +

        '<section class="card"><div class="card-row"><h2 class="card-title">Water-quality trends by source</h2>' +
          '<label class="field-inline"><span>Indicator</span><select id="an-param">' + AG.options(PARAMS.map(function (p) { return { value: p.key, label: p.label }; }), ui.param) + '</select></label></div>' +
          '<div class="legend">' + wqSeries.filter(function (s) { return TYPE_COLORS[s.name]; }).map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + s.name + '</span>'; }).join('') +
            '<span><i class="band-key"></i>Reference range ' + th.min + '–' + th.max + (th.unit ? ' ' + th.unit : '') + '</span></div>' +
          AG.charts.line(wqOpts) + '</section>' +

        '<div class="grid-2">' +
          '<section class="card"><h2 class="card-title">Reports by area</h2><ul class="hbars hbars-area">' + byArea.map(function (x) {
            return '<li><span>' + AG.esc(x.a.name) + '</span><div class="bar"><span style="width:' + Math.max(2, (x.c / maxArea) * 100) + '%;background:' + AG.LEVELS[x.level].color + '"></span></div>' +
              '<b>' + x.c + '</b><small>' + x.per.toFixed(1) + ' per 1,000</small></li>';
          }).join('') + '</ul></section>' +
          '<section class="card"><h2 class="card-title">Rainfall versus health signals</h2>' +
            '<div class="legend"><span><i style="background:#3B82C4;opacity:.5"></i>Rainfall (mm, right axis)</span><span><i style="background:#0E7C86"></i>Reports per day (left axis)</span></div>' +
            AG.charts.dual({ labels: labels, bars: { values: rain, color: '#3B82C4', name: 'Rainfall' }, line: { values: counts, color: '#0E7C86', name: 'Reports' }, ariaLabel: 'Rainfall versus reports' }) +
            '<p class="insight">' + corrText + (R === 7 ? ' Seven days is a short window — use 30 or 90 days for a steadier reading.' : '') + '</p></section>' +
        '</div>' + AG.disclaimer() + '</div>';

      root.querySelectorAll('[data-range]').forEach(function (b) {
        b.addEventListener('click', function () { ui.range = +b.getAttribute('data-range'); AG.rerender(); });
      });
      root.querySelector('#an-area').addEventListener('change', function (e) { ui.area = e.target.value; AG.rerender(); });
      root.querySelector('#an-param').addEventListener('change', function (e) { ui.param = e.target.value; AG.rerender(); });
    }
  };
})();
