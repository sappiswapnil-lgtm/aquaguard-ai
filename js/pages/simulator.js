/* Demo simulator */
(function () {
  'use strict';
  var AG = window.AG;
  var lastChange = null; // {from, to, before, after}

  function snapshot(an) {
    return {
      district: an.district.score, level: an.district.level, warnings: an.warnings.length,
      flagged: an.totals.flagged, reports: an.totals.reports,
      areas: an.areas.map(function (x) { return { name: x.area.name, id: x.area.id, score: x.score, level: x.level }; })
    };
  }

  function changePanel(c) {
    if (!c) return '';
    var top = c.after.areas.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
    var beforeById = {};
    c.before.areas.forEach(function (a) { beforeById[a.id] = a; });
    return '<section class="card change" id="change" tabindex="-1" aria-live="polite">' +
      '<h2 class="card-title">The risk engine responded</h2>' +
      '<p class="muted">' + AG.esc(AG.SCENARIO_BY_ID[c.from].name) + ' → <b>' + AG.esc(AG.SCENARIO_BY_ID[c.to].name) + '</b></p>' +
      '<div class="change-grid">' +
        '<div><span class="fine">District risk score</span><b class="big">' + c.before.district + ' <i>→</i> ' + c.after.district + '</b>' + AG.levelChip(c.after.level) + '</div>' +
        '<div><span class="fine">Active warnings</span><b class="big">' + c.before.warnings + ' <i>→</i> ' + c.after.warnings + '</b></div>' +
        '<div><span class="fine">Water sources flagged</span><b class="big">' + c.before.flagged + ' <i>→</i> ' + c.after.flagged + '</b></div>' +
        '<div><span class="fine">Community reports</span><b class="big">' + AG.fmtNum(c.before.reports) + ' <i>→</i> ' + AG.fmtNum(c.after.reports) + '</b></div>' +
      '</div>' +
      '<h3>Highest-scoring areas now</h3><ul class="pick-list">' + top.map(function (a) {
        return '<li><a class="pick" href="#/map?area=' + a.id + '"><span>' + AG.esc(a.name) + '</span><span class="pick-meta">' + beforeById[a.id].score + ' → ' + a.score + AG.levelChip(a.level) + '</span></a></li>';
      }).join('') + '</ul>' +
      '<div class="cta-row"><a class="btn btn-primary btn-sm" href="#/dashboard">Public dashboard</a><a class="btn btn-outline btn-sm" href="#/map">Map</a>' +
        '<a class="btn btn-outline btn-sm" href="#/warnings">Early warnings</a><a class="btn btn-outline btn-sm" href="#/analytics">Analytics</a></div>' +
    '</section>';
  }

  AG.pages.simulator = {
    title: 'Scenario Simulator — AquaGuard AI',
    render: function (root) {
      var st = AG.store.get(), active = AG.store.state.scenario;
      root.innerHTML = '<div class="wrap page">' +
        AG.pageHead('Demo Simulator', 'Simulate community conditions',
          'Each scenario changes the inputs to the transparent risk engine. Every dashboard, map and warning in the app reacts immediately.') +
        '<div class="scenarios">' + AG.SCENARIOS.map(function (s) {
          var on = s.id === active;
          return '<article class="scenario' + (on ? ' is-active' : '') + '"><span class="scenario-ico">' + AG.icon(s.icon, 24) + '</span>' +
            '<div><h2>' + s.name + '</h2><p>' + s.desc + '</p></div>' +
            (on ? '<span class="chip chip-low"><i></i>Active</span>' : '<button type="button" class="btn btn-outline btn-sm" data-run="' + s.id + '">' + AG.icon('play', 14) + ' Run</button>') +
          '</article>';
        }).join('') + '</div>' +
        '<div id="change-host">' + changePanel(lastChange) + '</div>' +
        '<section class="card reset"><div><h2 class="card-title">Reset the demo</h2><p class="muted">Clears the reports and water-quality readings you added in this browser and returns to Normal Conditions.</p></div>' +
          '<button type="button" class="btn btn-outline" id="reset">' + AG.icon('refresh', 16) + ' Reset demo data</button></section>' +
        AG.disclaimer() + '</div>';

      root.querySelectorAll('[data-run]').forEach(function (b) {
        b.addEventListener('click', function () {
          var to = b.getAttribute('data-run'), from = AG.store.state.scenario;
          var before = snapshot(AG.store.get().an);
          AG.store.setScenario(to);
          lastChange = { from: from, to: to, before: before, after: snapshot(AG.store.get().an) };
          AG.rerender();
          var el = document.getElementById('change');
          if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
          AG.toast('Scenario active: ' + AG.SCENARIO_BY_ID[to].name);
        });
      });
      root.querySelector('#reset').addEventListener('click', function () {
        if (!window.confirm('Reset all demo data added in this browser and return to Normal Conditions?')) return;
        lastChange = null;
        AG.store.resetDemo();
        AG.rerender();
        AG.toast('Demo data reset.');
      });
    }
  };
})();
