/* Early Warning Center */
(function () {
  'use strict';
  var AG = window.AG;
  var filter = 'all';

  function card(w, open) {
    var L = AG.LEVELS[w.level];
    return '<article class="alert-card lv-' + w.level + '" id="' + w.id + '">' +
      '<header class="alert-head"><div class="alert-score" style="--c:' + L.color + '"><b>' + w.score + '</b><span>/100</span></div>' +
        '<div class="alert-title"><div class="alert-chips">' + AG.levelChip(w.level) + '<span class="muted">' + AG.esc(w.area.kind) + ' · ' + AG.fmtNum(w.area.pop) + ' residents</span></div>' +
        '<h2>' + AG.esc(w.title) + '</h2></div></header>' +
      '<div class="alert-body">' +
        '<section><h3>Why this alert</h3><ul class="reasons">' + w.drivers.map(function (d) {
          return '<li><b>' + d.label + '.</b> ' + AG.esc(d.text) + '</li>';
        }).join('') + '</ul></section>' +
        '<section><h3>Recommended investigation steps</h3><ol class="steps">' + w.actions.map(function (a) { return '<li>' + AG.esc(a) + '</li>'; }).join('') + '</ol></section>' +
      '</div>' +
      '<details class="how"' + (open ? ' open' : '') + '><summary>' + AG.icon('chevron', 16) + ' How this score was built</summary>' + AG.factorBars(w.factors) + '</details>' +
      '<footer class="alert-foot"><a class="btn btn-outline btn-sm" href="#/map?area=' + w.areaId + '">View on map</a>' +
        '<a class="btn btn-ghost btn-sm" href="#/authority">Open in authority console</a>' +
        '<span class="fine">A risk indicator for further investigation — not a confirmed outbreak.</span></footer>' +
    '</article>';
  }

  AG.pages.warnings = {
    title: 'Early Warning Center — AquaGuard AI',
    render: function (root) {
      var st = AG.store.get(), an = st.an, ws = an.warnings;
      var counts = { all: ws.length };
      ['critical', 'high', 'moderate'].forEach(function (k) { counts[k] = ws.filter(function (w) { return w.level === k; }).length; });
      if (filter !== 'all' && !counts[filter]) filter = 'all';

      function list() {
        var shown = ws.filter(function (w) { return filter === 'all' || w.level === filter; });
        if (!ws.length) {
          return '<div class="empty card">' + AG.icon('check', 28) + '<h2>No active warnings</h2><p>All ' + AG.AREAS.length +
            ' areas are at Low risk. Run a scenario in the demo simulator to see how alerts appear and explain themselves.</p>' +
            '<a class="btn btn-primary" href="#/simulator">Open the demo simulator</a></div>';
        }
        return shown.map(function (w, i) { return card(w, i === 0 && filter === 'all'); }).join('');
      }

      root.innerHTML = '<div class="wrap page">' +
        AG.pageHead('Early Warning Center', 'Signals that need a closer look',
          'Each alert is a risk indicator for further investigation — not a confirmed outbreak.', AG.scenarioBadge()) +
        '<div class="filters" role="tablist" aria-label="Filter by risk level">' + [['all', 'All'], ['critical', 'Critical'], ['high', 'High'], ['moderate', 'Moderate']].map(function (f) {
          return '<button type="button" role="tab" class="seg' + (filter === f[0] ? ' is-on' : '') + '" data-f="' + f[0] + '" aria-selected="' + (filter === f[0]) + '">' + f[1] + ' <span>' + counts[f[0]] + '</span></button>';
        }).join('') + '</div>' +
        '<div id="alert-list" class="alert-list">' + list() + '</div>' + AG.disclaimer() + '</div>';

      root.querySelectorAll('.seg').forEach(function (b) {
        b.addEventListener('click', function () {
          filter = b.getAttribute('data-f');
          AG.rerender();
        });
      });
    }
  };
})();
