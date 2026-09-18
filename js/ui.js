/* AquaGuard AI — shared UI helpers */
(function () {
  'use strict';
  var AG = window.AG;

  AG.DISCLAIMER = 'This platform uses anonymized/synthetic data for demonstration and early-warning research. It does not diagnose individuals or replace professional medical/public-health investigation.';

  var ICONS = {
    droplet: '<path d="M12 2.7c3.6 4.2 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.4-6.4 6-10.6z"/>',
    map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13M15 6.5v13"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="m8 15 3.5-4 3 2.5L20 7"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9.5 12h5M9.5 16h5"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3"/><path d="M7.5 15h9"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.8c1.8.8 3 2.6 3 5.2"/>',
    alert: '<path d="M12 3.5 2.8 19.5h18.4L12 3.5z"/><path d="M12 10v4.5M12 17.4v.1"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.5L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.5L20 15.5M20 20v-4.5h-4.5"/>',
    trend: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
    rain: '<path d="M7 15a4.5 4.5 0 0 1-.5-8.9A6 6 0 0 1 18 7.5a3.8 3.8 0 0 1-.5 7.5H7z"/><path d="m8 18.5-1 2M12 18.5l-1 2M16 18.5l-1 2"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    printer: '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6" rx="1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.7v.1"/>',
    home: '<path d="m3.5 11 8.5-7 8.5 7"/><path d="M6 9.5V20h12V9.5"/>'
  };
  AG.icon = function (name, size) {
    var s = size || 20;
    return '<svg class="ico" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };

  AG.levelChip = function (key) {
    var L = AG.LEVELS[key];
    return '<span class="chip chip-' + key + '"><i></i>' + L.label + '</span>';
  };
  var STATUS = { normal: ['Normal', 'low'], watch: ['Watch', 'moderate'], concern: ['Concern', 'critical'] };
  AG.statusChip = function (st) {
    var s = STATUS[st] || STATUS.normal;
    return '<span class="chip chip-' + s[1] + '"><i></i>' + s[0] + '</span>';
  };

  AG.scenarioBadge = function () {
    var sc = AG.store.scenario();
    return sc.id === 'normal' ? '' : '<span class="scenario-pill">' + AG.icon('play', 12) + AG.esc(sc.name) + '</span>';
  };

  /* Breakdown of the weighted scoring model for one area */
  AG.factorBars = function (factors) {
    var total = Math.round(AG.sum(factors, function (f) { return f.points; }));
    return '<ul class="factors">' + factors.map(function (f) {
      return '<li><div class="factor-head"><span>' + f.label + ' <em>' + Math.round(f.weight * 100) + '% weight</em></span>' +
        '<b>' + f.points.toFixed(1) + ' pts</b></div>' +
        '<div class="bar"><span style="width:' + Math.max(2, f.score).toFixed(0) + '%;background:' + f.color + '"></span></div>' +
        '<small>Factor score ' + Math.round(f.score) + ' / 100</small></li>';
    }).join('') + '</ul><p class="factor-total">Total risk score <b>' + total + ' / 100</b> = sum of weighted factor points.</p>';
  };

  AG.weightStrip = function () {
    return '<div class="weight-strip" role="img" aria-label="Scoring weights">' + AG.FACTORS.map(function (f) {
      return '<span style="flex:' + f.weight * 100 + ';background:' + f.color + '">' + Math.round(f.weight * 100) + '%</span>';
    }).join('') + '</div>';
  };

  /* Stylised district map. opts: {an, ds, selected, sources, clusters, mini} */
  AG.mapSvg = function (opts) {
    var an = opts.an, ds = opts.ds, mini = !!opts.mini;
    var showSources = !!opts.sources, showClusters = opts.clusters !== false;
    var s = '<svg class="district-map' + (mini ? ' is-mini' : '') + '" viewBox="0 0 900 540" role="' + (mini ? 'img' : 'group') + '" aria-label="District map of ' + AG.AREAS.length + ' areas">';
    s += '<rect x="0" y="0" width="900" height="540" rx="24" class="map-bg"/>';
    /* river + roads live in the gaps between cells */
    s += '<path d="M-10 268 C 120 246, 230 292, 380 270 S 700 244, 910 276" class="map-river"/>';
    s += '<path d="M-10 268 C 120 246, 230 292, 380 270 S 700 244, 910 276" class="map-river-core"/>';
    s += '<path d="M310 20 V520 M600 20 V520" class="map-road"/>';
    AG.AREAS.forEach(function (a) {
      var x = an.byId[a.id], c = a.cell, L = AG.LEVELS[x.level];
      var sel = opts.selected === a.id;
      var fill = x.level === 'low' ? '#EEF5F6' : L.soft;
      var cx = c.x + c.w / 2, cy = c.y + c.h / 2 + 14;
      var r = 15 + Math.sqrt(x.recentCount) * 4.3;
      s += '<g class="map-area' + (sel ? ' is-selected' : '') + '" data-area="' + a.id + '"' + (mini ? '' : ' tabindex="0" role="button" aria-label="' +
        AG.esc(a.name + ', ' + L.label + ' risk, score ' + x.score + ', ' + x.recentCount + ' reports this week') + '"') + '>';
      s += '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" rx="26" fill="' + fill + '" class="map-cell"/>';
      if (!mini) {
        s += '<text x="' + (c.x + 20) + '" y="' + (c.y + 32) + '" class="map-name">' + AG.esc(a.name) + '</text>';
        s += '<text x="' + (c.x + 20) + '" y="' + (c.y + 52) + '" class="map-sub">' + a.kind + ' · ' + AG.fmtNum(a.pop) + ' residents</text>';
      } else {
        s += '<text x="' + (c.x + 18) + '" y="' + (c.y + 34) + '" class="map-name">' + AG.esc(a.short) + '</text>';
      }
      if (showClusters) {
        if (x.level === 'high' || x.level === 'critical') {
          s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" fill="' + L.color + '" class="map-pulse"/>';
        }
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" fill="' + L.color + '" fill-opacity=".82" stroke="#fff" stroke-width="3" class="map-bubble"/>';
        s += '<text x="' + cx + '" y="' + (cy + 6) + '" text-anchor="middle" class="map-count">' + x.recentCount + '</text>';
      }
      s += '</g>';
    });
    if (showSources) {
      var COL = { normal: '#3E9BA8', watch: '#D9A21B', concern: '#D2413D' };
      ds.sources.forEach(function (src) {
        var st = an.sourceState[src.id].status;
        s += '<circle cx="' + src.x + '" cy="' + src.y + '" r="' + (st === 'normal' ? 5 : 7) + '" fill="' + COL[st] + '" stroke="#fff" stroke-width="2" class="map-src"><title>' +
          AG.esc(src.name + ' — ' + STATUS[st][0]) + '</title></circle>';
      });
    }
    return s + '</svg>';
  };

  /* Toasts */
  AG.toast = function (msg) {
    var host = document.getElementById('toasts');
    if (!host) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 3200);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3700);
  };

  AG.disclaimer = function () {
    return '<aside class="disclaimer">' + AG.icon('info', 18) + '<p>' + AG.DISCLAIMER + '</p></aside>';
  };

  AG.pageHead = function (label, title, sub, actionHtml) {
    return '<header class="page-head"><div><p class="page-label">' + label + '</p><h1>' + title + '</h1>' +
      (sub ? '<p class="page-sub">' + sub + '</p>' : '') + '</div>' + (actionHtml ? '<div class="page-actions">' + actionHtml + '</div>' : '') + '</header>';
  };

  /* Select helper */
  AG.options = function (list, selected, placeholder) {
    var out = placeholder ? '<option value="">' + placeholder + '</option>' : '';
    list.forEach(function (o) {
      var v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label;
      out += '<option value="' + AG.esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + AG.esc(l) + '</option>';
    });
    return out;
  };
  AG.areaOptions = function (selected, placeholder) {
    return AG.options(AG.AREAS.map(function (a) { return { value: a.id, label: a.name }; }), selected, placeholder);
  };
})();
