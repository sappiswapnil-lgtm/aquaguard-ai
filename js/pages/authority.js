/* Authority demo console — how a district health team might work through the alerts */
(function () {
  'use strict';
  var AG = window.AG;
  var STATUSES = [
    { value: 'new', label: 'New' }, { value: 'ack', label: 'Acknowledged' }, { value: 'field', label: 'Field team dispatched' },
    { value: 'sampling', label: 'Sampling in progress' }, { value: 'resolved', label: 'Resolved / monitoring' }
  ];
  var TEAMS = ['Team A — Sanitary inspectors', 'Team B — Lab sampling', 'Team C — Community health workers'];
  var open = {};

  function csvEscape(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }

  function exportCsv(an) {
    var head = ['Area', 'Risk level', 'Score', 'Primary signal', 'Status', 'Assigned team', 'Note', 'Reports (7d)', 'Usual per week', 'People affected', 'Readings in concern', 'Readings on watch'];
    var rows = an.warnings.map(function (w) {
      var a = AG.store.actionFor(w.areaId);
      var stLabel = STATUSES.filter(function (s) { return s.value === a.status; })[0].label;
      return [w.area.name, AG.LEVELS[w.level].label, w.score, w.title, stLabel, a.team, a.note, w.an.recentCount, Math.round(w.an.baselineWeekly), w.an.affected, w.an.nConcern, w.an.nWatch];
    });
    var csv = [head].concat(rows).map(function (r) { return r.map(csvEscape).join(','); }).join('\r\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'aquaguard-briefing-' + AG.dayKey(AG.today()) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function queueRow(w) {
    var a = AG.store.actionFor(w.areaId), L = AG.LEVELS[w.level], isOpen = !!open[w.areaId];
    return '<article class="queue-item lv-' + w.level + (a.status === 'resolved' ? ' is-done' : '') + '" data-area="' + w.areaId + '">' +
      '<div class="queue-main">' +
        '<div class="alert-score" style="--c:' + L.color + '"><b>' + w.score + '</b><span>/100</span></div>' +
        '<div class="queue-title"><div class="alert-chips">' + AG.levelChip(w.level) + '</div><h3>' + AG.esc(w.area.name) + '</h3><p>' + AG.esc(w.title.split(' — ')[0]) + '</p></div>' +
        '<label class="field"><span class="sr">Status</span><select data-k="status" aria-label="Status for ' + AG.esc(w.area.name) + '">' +
          STATUSES.map(function (s) { return '<option value="' + s.value + '"' + (a.status === s.value ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') + '</select></label>' +
        '<label class="field"><span class="sr">Assigned team</span><select data-k="team" aria-label="Assigned team for ' + AG.esc(w.area.name) + '">' +
          AG.options(TEAMS, a.team, 'Assign a team') + '</select></label>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-toggle="' + w.areaId + '" aria-expanded="' + isOpen + '">' + AG.icon('chevron', 16) + ' Details</button>' +
      '</div>' +
      (isOpen ? '<div class="queue-detail">' +
        '<div><h4>Why this alert</h4><ul class="reasons">' + w.drivers.map(function (d) { return '<li><b>' + d.label + '.</b> ' + AG.esc(d.text) + '</li>'; }).join('') + '</ul>' +
          '<h4>Recommended steps</h4><ol class="steps">' + w.actions.map(function (t) { return '<li>' + AG.esc(t) + '</li>'; }).join('') + '</ol>' +
          '<label class="field"><span>Action note</span><input type="text" maxlength="200" data-k="note" value="' + AG.esc(a.note) + '" placeholder="e.g. Sanitary team visiting Thursday morning"></label></div>' +
        '<div><h4>How the score was built</h4>' + AG.factorBars(w.factors) + '</div></div>' : '') +
    '</article>';
  }

  AG.pages.authority = {
    title: 'Authority Demo — AquaGuard AI',
    render: function (root) {
      var st = AG.store.get(), an = st.an, ws = an.warnings;
      var newCount = ws.filter(function (w) { return AG.store.actionFor(w.areaId).status === 'new'; }).length;
      var urgent = ws.filter(function (w) { return w.level === 'high' || w.level === 'critical'; }).length;
      var flagged = an.flaggedSources.slice().sort(function (a, b) {
        var sa = an.sourceState[a.id].status === 'concern' ? 0 : 1, sb = an.sourceState[b.id].status === 'concern' ? 0 : 1;
        return sa - sb || (a.id > b.id ? 1 : -1);
      });

      root.innerHTML = '<div class="wrap page">' +
        AG.pageHead('Authority Demo', 'District health team console',
          'A demo of how a ward, panchayat or district health team could triage alerts, assign follow-up and plan sampling. Nothing here is sent anywhere.',
          AG.scenarioBadge() + '<span class="role-pill">' + AG.icon('users', 14) + ' Demo role: District health officer</span>') +

        '<div class="kpis kpis-4">' +
          '<div class="card kpi"><span class="kpi-label">Active alerts</span><b class="kpi-val">' + ws.length + '</b><span class="delta delta-flat">across ' + AG.AREAS.length + ' areas</span></div>' +
          '<div class="card kpi"><span class="kpi-label">High or critical</span><b class="kpi-val">' + urgent + '</b><span class="delta ' + (urgent ? 'delta-up' : 'delta-flat') + '">' + (urgent ? 'Prioritise today' : 'None right now') + '</span></div>' +
          '<div class="card kpi"><span class="kpi-label">Awaiting acknowledgement</span><b class="kpi-val">' + newCount + '</b><span class="delta delta-flat">status “New”</span></div>' +
          '<div class="card kpi"><span class="kpi-label">Sources to sample</span><b class="kpi-val">' + flagged.length + '</b><span class="delta delta-flat">Watch or Concern</span></div>' +
        '</div>' +

        '<section class="card"><div class="card-row"><h2 class="card-title">Priority queue</h2><div class="btn-row">' +
          '<button type="button" class="btn btn-outline btn-sm" id="csv"' + (ws.length ? '' : ' disabled') + '>' + AG.icon('download', 16) + ' Export briefing (CSV)</button>' +
          '<button type="button" class="btn btn-outline btn-sm" id="print">' + AG.icon('printer', 16) + ' Print</button></div></div>' +
          (ws.length ? '<div class="queue">' + ws.map(queueRow).join('') + '</div>'
            : '<div class="empty">' + AG.icon('check', 28) + '<h2>Nothing in the queue</h2><p>No area is above Low risk. Run a scenario in the simulator to see the console in action.</p><a class="btn btn-primary" href="#/simulator">Open the demo simulator</a></div>') +
        '</section>' +

        '<section class="card"><div class="card-row"><h2 class="card-title">Sampling plan</h2><span class="fine">Tick a source once a sample has been collected</span></div>' +
          (flagged.length ? '<div class="table-scroll"><table class="data"><thead><tr><th>Sampled</th><th>Source</th><th>Area</th><th>Flagged for</th><th>Status</th></tr></thead><tbody>' + flagged.slice(0, 30).map(function (s) {
            var rd = an.sourceState[s.id].reading, done = AG.store.flag('sample:' + s.id);
            return '<tr class="' + (done ? 'is-done' : '') + '"><td data-l="Sampled"><input type="checkbox" data-sample="' + s.id + '"' + (done ? ' checked' : '') + ' aria-label="Sample collected for ' + AG.esc(s.name) + '"></td>' +
              '<td data-l="Source">' + AG.esc(s.name) + '<small>' + s.id + '</small></td><td data-l="Area">' + AG.esc(AG.AREA_BY_ID[s.areaId].short) + '</td>' +
              '<td data-l="Flagged for">' + AG.esc(rd.issues.map(function (i) { return i.param === 'ecoli' ? 'E. coli present' : i.label + ' ' + i.value + (i.unit ? ' ' + i.unit : ''); }).join(' · ')) + '</td>' +
              '<td data-l="Status">' + AG.statusChip(rd.status) + '</td></tr>';
          }).join('') + '</tbody></table></div>' + (flagged.length > 30 ? '<p class="fine pad">Showing the 30 highest-priority sources of ' + flagged.length + '.</p>' : '')
            : '<p class="muted">Every registered source is inside the demo reference ranges — no sampling needed.</p>') +
        '</section>' + AG.disclaimer() + '</div>';

      root.querySelectorAll('.queue-item').forEach(function (item) {
        var id = item.getAttribute('data-area');
        item.querySelectorAll('select[data-k]').forEach(function (sel) {
          sel.addEventListener('change', function () {
            var patch = {}; patch[sel.getAttribute('data-k')] = sel.value;
            AG.store.setAction(id, patch);
            if (sel.getAttribute('data-k') === 'status') AG.rerender();
          });
        });
        var note = item.querySelector('input[data-k=note]');
        if (note) note.addEventListener('change', function () { AG.store.setAction(id, { note: note.value }); AG.toast('Note saved.'); });
        item.querySelector('[data-toggle]').addEventListener('click', function () { open[id] = !open[id]; AG.rerender(); });
      });
      root.querySelectorAll('[data-sample]').forEach(function (c) {
        c.addEventListener('change', function () { AG.store.setFlag('sample:' + c.getAttribute('data-sample'), c.checked); c.closest('tr').classList.toggle('is-done', c.checked); });
      });
      var csv = root.querySelector('#csv');
      if (csv) csv.addEventListener('click', function () { exportCsv(an); AG.toast('Briefing exported.'); });
      root.querySelector('#print').addEventListener('click', function () { window.print(); });
    }
  };
})();
