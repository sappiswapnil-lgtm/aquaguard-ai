/* Geographic heatmap / district cluster map */
(function () {
  'use strict';
  var AG = window.AG;

  function profileHtml(x, st) {
    var a = x.area, L = AG.LEVELS[x.level];
    var sources = st.ds.sources.filter(function (s) { return s.areaId === a.id; });
    var flagged = sources.filter(function (s) { return st.an.sourceState[s.id].status !== 'normal'; });
    var maxSym = Math.max.apply(null, x.topSymptoms.map(function (s) { return s.count; }).concat([1]));
    return '<div class="profile-head"><div><h2>' + AG.esc(a.name) + '</h2><p>' + a.kind + ' · ' + AG.fmtNum(a.pop) + ' residents' +
        (a.lowLying ? ' · low-lying' : '') + '</p></div>' + AG.levelChip(x.level) + '</div>' +
      '<div class="profile-gauge">' + AG.charts.gauge(x.score, x.level) + '</div>' +
      '<div class="stat-grid">' +
        '<div><b>' + x.recentCount + '</b><span>Reports, 7 days</span></div>' +
        '<div><b>' + x.baselineWeekly.toFixed(0) + '</b><span>Usual per week</span></div>' +
        '<div><b>' + x.affected + '</b><span>People affected</span></div>' +
        '<div><b>' + flagged.length + ' / ' + sources.length + '</b><span>Sources flagged</span></div>' +
      '</div>' +
      '<h3>Why this score</h3>' + AG.factorBars(x.factors) +
      (x.topSymptoms.length ? '<h3>Symptoms this week</h3><ul class="hbars">' + x.topSymptoms.map(function (s) {
        return '<li><span>' + AG.esc(s.name) + '</span><div class="bar"><span style="width:' + Math.max(2, (s.count / maxSym) * 100) + '%"></span></div><b>' + s.count + '</b></li>';
      }).join('') + '</ul>' : '') +
      '<h3>Water sources needing attention</h3>' +
      (flagged.length ? '<ul class="src-list">' + flagged.slice(0, 6).map(function (s) {
        var r = st.an.sourceState[s.id].reading;
        return '<li><div><b>' + AG.esc(s.name) + '</b><small>' + AG.esc(r.issues.map(function (i) { return i.param === 'ecoli' ? 'E. coli present' : i.label + ' ' + i.value; }).join(' · ')) + '</small></div>' + AG.statusChip(r.status) + '</li>';
      }).join('') + '</ul>' + (flagged.length > 6 ? '<p class="fine">+ ' + (flagged.length - 6) + ' more flagged sources</p>' : '')
        : '<p class="muted">All ' + sources.length + ' registered sources are inside the demo reference ranges.</p>') +
      '<div class="profile-actions"><a class="btn btn-primary btn-sm" href="#/report?area=' + a.id + '">Report an issue here</a>' +
        '<a class="btn btn-outline btn-sm" href="#/water-quality?area=' + a.id + '">Log water quality</a></div>';
  }

  function emptyPanel(an) {
    var sorted = an.areas.slice().sort(function (a, b) { return b.score - a.score; });
    return '<div class="panel-empty"><h2>Select an area</h2><p>Open a full risk profile for any ward or colony — choose one on the map or from the list.</p>' +
      '<ul class="pick-list">' + sorted.map(function (x) {
        return '<li><button type="button" class="pick" data-area="' + x.area.id + '"><span>' + AG.esc(x.area.name) + '</span><span class="pick-meta">' + x.score + AG.levelChip(x.level) + '</span></button></li>';
      }).join('') + '</ul></div>';
  }

  AG.pages.map = {
    title: 'Geographic Heatmap — AquaGuard AI',
    render: function (root, params) {
      var st = AG.store.get();
      var sel = params.area && AG.AREA_BY_ID[params.area] ? params.area : null;
      var layers = { clusters: true, sources: false };

      root.innerHTML = '<div class="wrap page">' +
        AG.pageHead('Geographic Intelligence', 'District cluster map',
          'Bubble size shows report volume; colour shows the area’s current risk level. Select an area to open its full risk profile.', AG.scenarioBadge()) +
        '<div class="map-layout">' +
          '<section class="card map-card">' +
            '<div class="map-tools" role="group" aria-label="Map layers">' +
              '<label class="toggle"><input type="checkbox" id="lay-clusters" checked><span>Report clusters</span></label>' +
              '<label class="toggle"><input type="checkbox" id="lay-sources"><span>Water sources</span></label>' +
            '</div>' +
            '<div id="map-host"></div>' +
            '<div class="legend legend-map" id="map-legend"></div>' +
          '</section>' +
          '<aside class="card profile" id="profile" aria-live="polite"></aside>' +
        '</div>' + AG.disclaimer() +
      '</div>';

      var host = root.querySelector('#map-host'), panel = root.querySelector('#profile'), legend = root.querySelector('#map-legend');

      function drawLegend() {
        legend.innerHTML = ['low', 'moderate', 'high', 'critical'].map(function (k) {
          return '<span><i style="background:' + AG.LEVELS[k].color + '"></i>' + AG.LEVELS[k].label + '</span>';
        }).join('') + (layers.sources ? '<span><i class="dot" style="background:#3E9BA8"></i>Source normal</span><span><i class="dot" style="background:#D9A21B"></i>Watch</span><span><i class="dot" style="background:#D2413D"></i>Concern</span>' : '');
      }
      function drawPanel() {
        panel.innerHTML = sel ? profileHtml(st.an.byId[sel], st) : emptyPanel(st.an);
        panel.querySelectorAll('.pick').forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-area')); }); });
      }
      function drawMap() {
        host.innerHTML = AG.mapSvg({ an: st.an, ds: st.ds, selected: sel, sources: layers.sources, clusters: layers.clusters });
        host.querySelectorAll('.map-area').forEach(function (g) {
          var id = g.getAttribute('data-area');
          g.addEventListener('click', function () { select(id); });
          g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id); } });
        });
      }
      function select(id) {
        sel = id;
        try { history.replaceState(null, '', '#/map?area=' + id); } catch (e) { /* file:// fallback */ }
        drawMap(); drawPanel();
        if (window.matchMedia('(max-width: 900px)').matches) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      root.querySelector('#lay-clusters').addEventListener('change', function (e) { layers.clusters = e.target.checked; drawMap(); drawLegend(); });
      root.querySelector('#lay-sources').addEventListener('change', function (e) { layers.sources = e.target.checked; drawMap(); drawLegend(); });
      drawMap(); drawPanel(); drawLegend();
    }
  };
})();
