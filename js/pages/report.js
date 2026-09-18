/* Community report form */
(function () {
  'use strict';
  var AG = window.AG;

  function formHtml(areaId) {
    var today = AG.dayKey(AG.today()), min = AG.dayKey(AG.addDays(AG.today(), -30));
    return '<form id="report-form" class="card form" novalidate>' +
      '<div class="form-grid">' +
        '<div class="field"><label for="f-area">Location (area)</label><select id="f-area" required>' + AG.areaOptions(areaId, 'Select your area') + '</select><p class="err" data-for="f-area"></p></div>' +
        '<div class="field"><label for="f-date">Date</label><input id="f-date" type="date" value="' + today + '" min="' + min + '" max="' + today + '" required><p class="err" data-for="f-date"></p></div>' +
        '<div class="field"><label for="f-count">Number of affected people</label><input id="f-count" type="number" min="1" max="500" step="1" value="1" inputmode="numeric" required><p class="err" data-for="f-count"></p></div>' +
      '</div>' +
      '<fieldset class="field"><legend>Symptoms observed</legend><div class="checks">' + AG.SYMPTOMS.map(function (s, i) {
        return '<label class="check"><input type="checkbox" name="symptom" value="' + s + '"><span>' + s + '</span></label>';
      }).join('') + '</div><p class="err" data-for="symptoms"></p></fieldset>' +
      '<div class="form-grid">' +
        '<div class="field"><label for="f-source">Water source</label><select id="f-source">' + AG.options(AG.SOURCE_TYPES.concat(['Not sure']), '', 'Select water source') + '</select></div>' +
        '<div class="field"><label for="f-appear">Water appearance</label><select id="f-appear">' + AG.options(AG.APPEARANCE, 'Clear') + '</select></div>' +
        '<div class="field"><label for="f-smell">Water smell</label><select id="f-smell">' + AG.options(AG.SMELL, 'None') + '</select></div>' +
        '<div class="field"><label for="f-rain">Recent rainfall</label><select id="f-rain">' + AG.options(AG.RAINFALL, 'None') + '</select></div>' +
        '<div class="field span-2"><label for="f-san">Nearby sanitation issue</label><select id="f-san">' + AG.options(AG.SANITATION, 'None') + '</select></div>' +
      '</div>' +
      '<div class="field"><label for="f-notes">Anything else <em>(optional)</em></label><textarea id="f-notes" rows="3" maxlength="300" placeholder="No names, phone numbers or ID numbers, please."></textarea>' +
        '<p class="count"><span id="notes-count">0</span> / 300</p></div>' +
      '<div class="form-foot"><button class="btn btn-primary btn-lg" type="submit">Submit report anonymously</button>' +
        '<p class="fine">' + AG.icon('shield', 14) + ' We never ask for your name, phone number, ID or medical records.</p></div>' +
    '</form>';
  }

  AG.pages.report = {
    title: 'Report a Health or Water Issue — AquaGuard AI',
    render: function (root, params) {
      var areaId = params.area && AG.AREA_BY_ID[params.area] ? params.area : '';
      root.innerHTML = '<div class="wrap page narrow">' +
        AG.pageHead('Community Reporting', 'Report a Health or Water Issue', 'Anonymous. We never ask for your name, phone number, ID or medical records.', AG.scenarioBadge()) +
        '<div id="report-body">' + formHtml(areaId) + '</div>' + AG.disclaimer() + '</div>';
      bind(root);
    }
  };

  function setErr(root, key, msg) {
    var el = root.querySelector('.err[data-for="' + key + '"]');
    if (el) el.textContent = msg || '';
    var input = root.querySelector('#' + key);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function bind(root) {
    var form = root.querySelector('#report-form');
    var notes = root.querySelector('#f-notes');
    notes.addEventListener('input', function () { root.querySelector('#notes-count').textContent = notes.value.length; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var area = form.querySelector('#f-area').value;
      var date = form.querySelector('#f-date').value;
      var count = parseInt(form.querySelector('#f-count').value, 10);
      var symptoms = Array.prototype.map.call(form.querySelectorAll('input[name=symptom]:checked'), function (c) { return c.value; });
      var appearance = form.querySelector('#f-appear').value, smell = form.querySelector('#f-smell').value;
      var ok = true;

      setErr(root, 'f-area', area ? '' : 'Choose the area where this happened.');
      if (!area) ok = false;
      var minKey = AG.dayKey(AG.addDays(AG.today(), -30)), maxKey = AG.dayKey(AG.today());
      var dateBad = !date || date < minKey || date > maxKey;
      setErr(root, 'f-date', dateBad ? 'Pick a date within the last 30 days (not in the future).' : '');
      if (dateBad) ok = false;
      var countBad = !(count >= 1 && count <= 500);
      setErr(root, 'f-count', countBad ? 'Enter a number between 1 and 500.' : '');
      if (countBad) ok = false;
      var nothing = !symptoms.length && appearance === 'Clear' && smell === 'None';
      setErr(root, 'symptoms', nothing ? 'Select at least one symptom, or describe a problem with the water.' : '');
      if (nothing) ok = false;
      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]') || form.querySelector('.err:not(:empty)');
        if (first && first.focus) first.focus();
        return;
      }

      var before = AG.store.get().an.byId[area];
      var src = form.querySelector('#f-source').value;
      AG.store.addReport({
        areaId: area, date: date, affected: count, symptoms: symptoms,
        sourceId: null, sourceType: src && src !== 'Not sure' ? src : '',
        appearance: appearance, smell: smell, rainfall: form.querySelector('#f-rain').value,
        sanitation: form.querySelector('#f-san').value, notes: notes.value.trim().slice(0, 300)
      });
      var after = AG.store.get().an.byId[area];
      var moved = after.score - before.score;

      root.querySelector('#report-body').innerHTML =
        '<section class="card success" tabindex="-1" id="report-success">' +
          '<span class="success-ico">' + AG.icon('check', 28) + '</span>' +
          '<h2>Report received — thank you</h2>' +
          '<p>Your anonymous report was added to <b>' + AG.esc(after.area.name) + '</b>. The risk engine has recalculated: the area is now at ' +
            AG.levelChip(after.level) + ' with a score of <b>' + after.score + '</b>' +
            (moved > 0 ? ' (up ' + moved + ')' : moved < 0 ? ' (down ' + Math.abs(moved) + ')' : ' (unchanged)') + '.</p>' +
          '<p class="fine">This is demo data stored only in this browser. One report rarely changes an area’s risk on its own — patterns across many reports do.</p>' +
          '<div class="cta-row"><a class="btn btn-primary" href="#/dashboard">View public dashboard</a>' +
            '<a class="btn btn-outline" href="#/map?area=' + area + '">See ' + AG.esc(after.area.short) + ' on the map</a>' +
            '<button type="button" class="btn btn-ghost" id="another">Submit another report</button></div>' +
        '</section>';
      var s = root.querySelector('#report-success');
      s.focus();
      root.querySelector('#another').addEventListener('click', function () {
        root.querySelector('#report-body').innerHTML = formHtml(area);
        bind(root);
        window.scrollTo({ top: 0 });
      });
    });
  }
})();
