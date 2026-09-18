/* Home / landing page */
(function () {
  'use strict';
  var AG = window.AG;

  function wavePath(amp, len, phase, baseY) {
    var d = 'M0 ' + baseY;
    for (var x = 0; x <= 2400; x += 40) {
      d += 'L' + x + ' ' + (baseY + Math.sin((x / len) * Math.PI * 2 + phase) * amp).toFixed(1);
    }
    return d + 'L2400 200L0 200Z';
  }

  AG.pages.home = {
    title: 'AquaGuard AI — Detect water-borne health risks before they become outbreaks',
    render: function (root) {
      var st = AG.store.get(), an = st.an, ds = st.ds;
      var top = an.warnings[0];
      var topLine = top
        ? 'Top signal: <b>' + AG.esc(top.area.name) + '</b> at ' + top.score + '/100'
        : 'No active warnings — all areas at Low risk';

      root.innerHTML =
        '<section class="hero">' +
          '<div class="hero-waves" aria-hidden="true">' +
            '<svg class="wave w1" viewBox="0 0 2400 200" preserveAspectRatio="none"><path d="' + wavePath(10, 300, 0, 60) + '"/></svg>' +
            '<svg class="wave w2" viewBox="0 0 2400 200" preserveAspectRatio="none"><path d="' + wavePath(8, 240, 1.6, 90) + '"/></svg>' +
          '</div>' +
          '<div class="wrap hero-grid">' +
            '<div class="hero-copy">' +
              '<span class="badge">' + AG.icon('shield', 16) + 'Decision support — not a medical diagnosis</span>' +
              '<h1>Detect water-borne health risks before they become outbreaks.</h1>' +
              '<p class="lede">A community-powered early warning platform combining health signals, water-quality observations and geographic intelligence.</p>' +
              '<div class="cta-row">' +
                '<a class="btn btn-primary btn-lg" href="#/report">Report an Issue</a>' +
                '<a class="btn btn-light btn-lg" href="#/dashboard">View Public Dashboard</a>' +
                '<a class="btn btn-outline-light btn-lg" href="#/authority">Launch Authority Demo</a>' +
              '</div>' +
            '</div>' +
            '<a class="hero-card" href="#/map" aria-label="Open the district map">' +
              '<div class="hero-card-head"><span>Live district signal</span>' + AG.scenarioBadge() + '</div>' +
              AG.mapSvg({ an: an, ds: ds, mini: true }) +
              '<div class="hero-card-foot"><div class="mini-score" style="--c:' + AG.LEVELS[an.district.level].color + '"><b>' + an.district.score + '</b><span>' +
                AG.LEVELS[an.district.level].label + '</span></div><p>' + topLine + '</p></div>' +
            '</a>' +
          '</div>' +
          '<div class="wrap stats">' +
            '<div class="stat"><b>' + AG.fmtNum(an.totals.reports) + '</b><span>Community reports</span></div>' +
            '<div class="stat"><b>' + an.totals.sources + '</b><span>Water sources monitored</span></div>' +
            '<div class="stat"><b>' + AG.AREAS.length + '</b><span>Areas under watch</span></div>' +
          '</div>' +
        '</section>' +

        '<section class="section wrap">' +
          '<div class="section-head"><p class="page-label">How it works</p><h2>Community signals in, early action out</h2></div>' +
          '<div class="flow" role="list">' +
            '<div class="flow-inputs" role="listitem"><span>Community Reports</span><i>+</i><span>Water Quality</span><i>+</i><span>Environmental Data</span></div>' +
            '<div class="flow-node" role="listitem">' + AG.icon('chart', 22) + 'Risk Engine</div>' +
            '<div class="flow-node" role="listitem">' + AG.icon('map', 22) + 'Geographic Analysis</div>' +
            '<div class="flow-node" role="listitem">' + AG.icon('bell', 22) + 'Early Warning</div>' +
            '<div class="flow-node is-end" role="listitem">' + AG.icon('check', 22) + 'Recommended Action</div>' +
          '</div>' +
          '<div class="cards-3">' +
            '<a class="feature" href="#/report"><span class="feature-ico">' + AG.icon('clipboard', 24) + '</span><h3>Community Reporting</h3>' +
              '<p>Collect structured reports from citizens and field workers — anonymous, mobile-friendly and free of unnecessary personal data.</p></a>' +
            '<a class="feature" href="#/water-quality"><span class="feature-ico">' + AG.icon('flask', 24) + '</span><h3>Water Quality Intelligence</h3>' +
              '<p>Track pH, turbidity, TDS, residual chlorine and E. coli indicators against configurable demo reference thresholds.</p></a>' +
            '<a class="feature" href="#/warnings"><span class="feature-ico">' + AG.icon('bell', 24) + '</span><h3>Early Warning AI</h3>' +
              '<p>Identify unusual increases, geographic clusters and environmental drivers — with the reasoning always shown.</p></a>' +
          '</div>' +
        '</section>' +

        '<section class="section wrap">' +
          '<div class="tagline">' +
            '<div class="tagline-copy">' +
              '<h2>From community signals to early action.</h2>' +
              '<p>AquaGuard AI helps communities and authorities identify unusual water-related health patterns earlier through transparent, explainable data intelligence.</p>' +
              '<div class="cta-row"><a class="btn btn-primary" href="#/warnings">Early Warning Center</a><a class="btn btn-outline" href="#/map">Geographic heatmap</a></div>' +
            '</div>' +
            '<div class="tagline-model">' +
              AG.weightStrip() +
              '<ul class="weights">' + AG.FACTORS.map(function (f) {
                return '<li><i style="background:' + f.color + '"></i>' + f.label + ' <b>' + Math.round(f.weight * 100) + '% weight</b></li>';
              }).join('') + '</ul>' +
              '<p class="fine">Transparent demo scoring model. Every alert shows exactly how its score was built.</p>' +
            '</div>' +
          '</div>' +
          AG.disclaimer() +
        '</section>';
    }
  };
})();
