/* Water quality check */
(function () {
  'use strict';
  var AG = window.AG;
  var shown = 12;

  var FIELDS = [
    { id: 'ph', label: 'pH', step: '0.1', def: '7.2', min: 0, max: 14 },
    { id: 'turbidity', label: 'Turbidity (NTU)', step: '0.1', def: '1.5', min: 0, max: 1000 },
    { id: 'tds', label: 'TDS (mg/L)', step: '1', def: '320', min: 0, max: 50000 },
    { id: 'chlorine', label: 'Chlorine (mg/L)', step: '0.01', def: '0.6', min: 0, max: 50 },
    { id: 'temperature', label: 'Temperature (°C)', step: '0.1', def: '26', min: -5, max: 80 }
  ];

  function rowsHtml(ds, limit) {
    var all = ds.readings.slice().sort(function (a, b) {
      return b.di - a.di || (a.origin === 'user' ? -1 : 1) - (b.origin === 'user' ? -1 : 1);
    });
    var rows = all.slice(0, limit).map(function (r) {
      var area = AG.AREA_BY_ID[r.areaId];
      return '<tr><td data-l="Date">' + AG.fmtShort(r.date) + '</td>' +
        '<td data-l="Source type">' + AG.esc(r.sourceType) + '<small>' + AG.esc(area ? area.short : '') + (r.origin === 'user' ? ' · added by you' : '') + '</small></td>' +
        '<td data-l="pH" class="' + cls(r, 'ph') + '">' + r.ph + '</td>' +
        '<td data-l="Turbidity" class="' + cls(r, 'turbidity') + '">' + r.turbidity + '</td>' +
        '<td data-l="TDS" class="' + cls(r, 'tds') + '">' + r.tds + '</td>' +
        '<td data-l="Chlorine" class="' + cls(r, 'chlorine') + '">' + r.chlorine + '</td>' +
        '<td data-l="E. coli" class="' + (r.ecoli ? 'bad' : '') + '">' + (r.ecoli ? 'Present' : 'Absent') + '</td>' +
        '<td data-l="Status">' + AG.statusChip(r.status) + '</td></tr>';
    }).join('');
    return { html: rows, total: all.length };
  }
  function cls(r, k) {
    return r.issues && r.issues.some(function (i) { return i.param === k; }) ? 'bad' : '';
  }

  function readForm(root) {
    var v = {}, ok = true;
    FIELDS.forEach(function (f) {
      var el = root.querySelector('#q-' + f.id), n = parseFloat(el.value);
      v[f.id] = n;
      var bad = isNaN(n) || n < f.min || n > f.max;
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) ok = false;
    });
    v.ecoli = root.querySelector('#q-ecoli').value === 'present';
    return { v: v, ok: ok };
  }

  AG.pages.waterquality = {
    title: 'Water Quality Check — AquaGuard AI',
    render: function (root, params) {
      var st = AG.store.get(), ds = st.ds;
      var areaId = params.area && AG.AREA_BY_ID[params.area] ? params.area : '';
      var tbl = rowsHtml(ds, shown);

      root.innerHTML = '<div class="wrap page">' +
        AG.pageHead('Water Quality', 'Water Quality Check',
          'Field-worker entry for water-quality indicators. Thresholds below are configurable demo/reference values, not universal medical standards.', AG.scenarioBadge()) +
        '<div class="wq-layout">' +
          '<form id="wq-form" class="card form" novalidate>' +
            '<div class="form-grid">' +
              '<div class="field"><label for="q-area">Area</label><select id="q-area">' + AG.areaOptions(areaId, 'Select area') + '</select><p class="err" data-for="q-area"></p></div>' +
              '<div class="field"><label for="q-type">Water source type</label><select id="q-type">' + AG.options(AG.SOURCE_TYPES, '', 'Borewell, Municipal supply…') + '</select><p class="err" data-for="q-type"></p></div>' +
              '<div class="field span-2"><label for="q-src">Registered source <em>(optional)</em></label><select id="q-src"></select></div>' +
            '</div>' +
            '<div class="form-grid g3">' + FIELDS.map(function (f) {
              return '<div class="field"><label for="q-' + f.id + '">' + f.label + '</label><input id="q-' + f.id + '" type="number" inputmode="decimal" step="' + f.step + '" min="' + f.min + '" max="' + f.max + '" value="' + f.def + '"></div>';
            }).join('') +
              '<div class="field"><label for="q-ecoli">E. coli indicator</label><select id="q-ecoli"><option value="absent">Absent</option><option value="present">Present</option></select></div>' +
            '</div>' +
            '<div class="form-foot"><button class="btn btn-primary btn-lg" type="submit">Save water quality reading</button></div>' +
          '</form>' +

          '<div class="wq-side">' +
            '<section class="card status-card" id="wq-status" aria-live="polite"></section>' +
            '<section class="card"><h2 class="card-title">Demo reference thresholds</h2>' +
              '<p class="fine">Configurable demo/reference thresholds — not universal medical standards.</p>' +
              '<dl class="thresholds">' +
                '<div><dt>pH</dt><dd>6.5–8.5</dd></div><div><dt>Turbidity</dt><dd>0–5 NTU</dd></div><div><dt>TDS</dt><dd>0–600 mg/L</dd></div>' +
                '<div><dt>Chlorine (residual)</dt><dd>0.2–2 mg/L</dd></div><div><dt>Temperature</dt><dd>0–35 °C</dd></div><div><dt>E. coli indicator</dt><dd>Should be absent</dd></div>' +
              '</dl></section>' +
          '</div>' +
        '</div>' +

        '<section class="card table-card"><div class="card-row"><h2 class="card-title">Recent readings</h2><span class="fine">' + tbl.total + ' readings across ' + ds.sources.length + ' sources</span></div>' +
          '<div class="table-scroll"><table class="data" id="wq-table"><thead><tr><th>Date</th><th>Source type</th><th>pH</th><th>Turbidity</th><th>TDS</th><th>Chlorine</th><th>E. coli</th><th>Status</th></tr></thead>' +
          '<tbody>' + tbl.html + '</tbody></table></div>' +
          (tbl.total > shown ? '<div class="table-foot"><button type="button" class="btn btn-outline btn-sm" id="more">Show more readings</button></div>' : '') +
        '</section>' + AG.disclaimer() + '</div>';

      var areaSel = root.querySelector('#q-area'), typeSel = root.querySelector('#q-type'), srcSel = root.querySelector('#q-src');
      var statusEl = root.querySelector('#wq-status');

      function fillSources() {
        var list = ds.sources.filter(function (s) {
          return (!areaSel.value || s.areaId === areaSel.value) && (!typeSel.value || s.type === typeSel.value);
        });
        srcSel.innerHTML = '<option value="">Link to a monitored source</option>' + list.map(function (s) {
          return '<option value="' + s.id + '">' + AG.esc(s.name) + ' (' + s.id + ')</option>';
        }).join('');
      }
      function drawStatus() {
        var f = readForm(root);
        if (!f.ok) {
          statusEl.innerHTML = '<h2 class="card-title">Water Quality Status</h2><p class="muted">Enter a value for every indicator to see the status.</p>';
          return;
        }
        var ev = AG.evalReading(f.v);
        statusEl.className = 'card status-card st-' + ev.status;
        statusEl.innerHTML = '<h2 class="card-title">Water Quality Status</h2>' +
          '<div class="status-big">' + AG.statusChip(ev.status) + '</div><p>' + AG.esc(AG.readingMessage(ev)) + '</p>';
      }

      areaSel.addEventListener('change', fillSources);
      typeSel.addEventListener('change', fillSources);
      srcSel.addEventListener('change', function () {
        var s = AG.SOURCE_BY_ID[srcSel.value];
        if (!s) return;
        areaSel.value = s.areaId; typeSel.value = s.type;
        fillSources(); srcSel.value = s.id;
      });
      root.querySelectorAll('#wq-form input, #q-ecoli').forEach(function (el) { el.addEventListener('input', drawStatus); el.addEventListener('change', drawStatus); });

      var more = root.querySelector('#more');
      if (more) more.addEventListener('click', function () { shown += 12; AG.rerender(); });

      root.querySelector('#wq-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var f = readForm(root), ok = f.ok;
        var src = AG.SOURCE_BY_ID[srcSel.value];
        var area = src ? src.areaId : areaSel.value, type = src ? src.type : typeSel.value;
        var setErr = function (id, msg) {
          root.querySelector('.err[data-for="' + id + '"]').textContent = msg;
          root.querySelector('#' + id).setAttribute('aria-invalid', msg ? 'true' : 'false');
        };
        setErr('q-area', area ? '' : 'Choose an area.');
        setErr('q-type', type ? '' : 'Choose a water source type.');
        if (!area || !type) ok = false;
        if (!ok) { drawStatus(); return; }

        var before = AG.store.get().an.byId[area].score;
        var rec = Object.assign({}, f.v, { areaId: area, sourceType: type, sourceId: src ? src.id : null, date: AG.dayKey(AG.today()) });
        AG.store.addReading(rec);
        var after = AG.store.get().an.byId[area];
        var ev = AG.evalReading(f.v);
        AG.toast('Reading saved — status ' + ev.status + '. ' + after.area.short + ' risk score ' + before + ' → ' + after.score + '.');
        AG.rerender();
      });

      fillSources();
      if (areaId) areaSel.value = areaId;
      drawStatus();
    }
  };
})();
