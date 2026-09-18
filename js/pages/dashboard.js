/* Public Dashboard */
(function () {
  'use strict';
  var AG = window.AG;

  function dailyCounts(ds, areaId, from, to) {
    var out = [];
    for (var d = from; d <= to; d++) out.push(0);
    ds.reports.forEach(function (r) {
      if (r.di >= from && r.di <= to && (!areaId || r.areaId === areaId)) out[r.di - from]++;
    });
    return out;
  }

  function reportItem(r) {
    var area = AG.AREA_BY_ID[r.areaId];
    var flags = [];
    if (r.appearance && r.appearance !== 'Clear') flags.push(r.appearance);
    if (r.smell && r.smell !== 'None') flags.push(r.smell + ' smell');
    return '<li class="feed-item"><div class="feed-top"><b>' + AG.esc(area.name) + '</b><time>' + AG.relDay(r.di) + '</time></div>' +
      '<p>' + r.symptoms.map(function (s) { return '<span class="tag">' + AG.esc(s) + '</span>'; }).join('') + '</p>' +
      '<small>' + r.affected + (r.affected === 1 ? ' person' : ' people') + ' affected · ' + AG.esc(r.sourceType || 'Source not stated') +
      (flags.length ? ' · ' + AG.esc(flags.join(', ')) : '') + '</small></li>';
  }

  AG.pages.dashboard = {
    title: 'Public Dashboard — AquaGuard AI',
    render: function (root) {
      var st = AG.store.get(), an = st.an, ds = st.ds, t = an.totals;
      var L = AG.LEVELS[an.district.level];
      var sorted = an.areas.slice().sort(function (a, b) { return b.score - a.score; });
      var hi = sorted[0];
      var last30 = dailyCounts(ds, null, 60, 89);
      var labels30 = ds.days.slice(60).map(AG.fmtShort);
      var usual = t.baselineWeekly / 7;
      var change = Math.round(t.change * 100);
      var trend = change > 10 ? 'up' : change < -10 ? 'down' : 'flat';

      var recent = ds.reports.filter(function (r) { return r.di >= 83; })
        .sort(function (a, b) { return b.di - a.di || (b.id > a.id ? 1 : -1); }).slice(0, 7);
      var maxSym = Math.max.apply(null, t.symptoms.map(function (s) { return s.count; }).concat([1]));

      root.innerHTML = '<div class="wrap page">' +
        AG.pageHead('Public Dashboard', 'Community water-health status',
          'Indicators built from anonymous community reports, water-quality observations and rainfall data.',
          AG.scenarioBadge() + '<a class="btn btn-primary" href="#/report">Report an issue</a>') +

        '<div class="dash-top">' +
          '<section class="card district-card" aria-labelledby="dc-h">' +
            '<h2 id="dc-h" class="card-title">District risk level</h2>' +
            AG.charts.gauge(an.district.score, an.district.level) +
            '<p class="district-note">' + (t.areasWatch
              ? '<b>' + t.areasWatch + ' of ' + AG.AREAS.length + ' areas</b> above Low risk. Highest: <a href="#/map?area=' + hi.area.id + '">' + AG.esc(hi.area.name) + '</a> (' + hi.score + ').'
              : 'All ' + AG.AREAS.length + ' areas are at Low risk. Reports and water quality are within their usual range.') + '</p>' +
          '</section>' +
          '<div class="kpis">' +
            '<div class="card kpi"><span class="kpi-label">Reports this week</span><b class="kpi-val">' + t.recent + '</b>' +
              '<span class="delta delta-' + trend + '">' + (change > 0 ? '+' : '') + change + '% vs usual</span>' +
              AG.charts.spark(dailyCounts(ds, null, 76, 89), L.color) + '</div>' +
            '<div class="card kpi"><span class="kpi-label">Water sources monitored</span><b class="kpi-val">' + t.sources + '</b>' +
              '<span class="delta ' + (t.flagged ? 'delta-up' : 'delta-flat') + '">' + (t.flagged ? t.flagged + ' outside reference ranges' : 'All within reference ranges') + '</span></div>' +
            '<div class="card kpi"><span class="kpi-label">Areas under watch</span><b class="kpi-val">' + t.areasWatch + '<small> / ' + AG.AREAS.length + '</small></b>' +
              '<span class="delta ' + (t.areasWatch ? 'delta-up' : 'delta-flat') + '">' + (t.areasWatch ? 'Moderate risk or higher' : 'Nothing above Low') + '</span></div>' +
            '<div class="card kpi"><span class="kpi-label">People reported affected</span><b class="kpi-val">' + t.affected + '</b>' +
              '<span class="delta delta-flat">≈ ' + Math.ceil(t.affected / 4.5) + ' households, last 7 days</span></div>' +
          '</div>' +
        '</div>' +

        '<div class="grid-2">' +
          '<section class="card"><h2 class="card-title">Risk by area</h2><ul class="area-list">' + sorted.map(function (x) {
            var Lx = AG.LEVELS[x.level];
            return '<li><a class="area-row" href="#/map?area=' + x.area.id + '">' +
              '<div class="area-row-main"><b>' + AG.esc(x.area.name) + '</b>' + AG.levelChip(x.level) + '</div>' +
              '<div class="bar bar-lg"><span style="width:' + Math.max(3, x.score) + '%;background:' + Lx.color + '"></span></div>' +
              '<div class="area-row-meta"><span>' + x.recentCount + ' reports this week</span><b>' + x.score + '</b></div></a></li>';
          }).join('') + '</ul></section>' +
          '<section class="card"><h2 class="card-title">Reports per day, last 30 days</h2>' +
            '<div class="legend"><span><i style="background:' + L.color + '"></i>Reports</span><span><i class="dash"></i>Usual level</span></div>' +
            AG.charts.line({
              labels: labels30, ariaLabel: 'Reports per day over the last 30 days',
              series: [{ name: 'Reports', color: '#0E7C86', values: last30, area: true },
                       { name: 'Usual level', color: '#8AA0AB', values: last30.map(function () { return AG.round(usual, 1); }), dashed: true, width: 1.6 }]
            }) + '</section>' +
        '</div>' +

        '<div class="grid-2">' +
          '<section class="card"><h2 class="card-title">Symptoms reported this week</h2><ul class="hbars">' + t.symptoms.map(function (s) {
            return '<li><span>' + AG.esc(s.name) + '</span><div class="bar"><span style="width:' + Math.max(2, (s.count / maxSym) * 100) + '%"></span></div><b>' + s.count + '</b></li>';
          }).join('') + '</ul></section>' +
          '<section class="card"><h2 class="card-title">Latest anonymous reports</h2><ul class="feed">' + recent.map(reportItem).join('') + '</ul></section>' +
        '</div>' +
        AG.disclaimer() +
      '</div>';
    }
  };
})();
