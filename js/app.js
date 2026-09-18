/* AquaGuard AI — hash router and site chrome */
(function () {
  'use strict';
  var AG = window.AG;

  var ROUTES = {
    '': 'home', '/': 'home', '/dashboard': 'dashboard', '/map': 'map', '/warnings': 'warnings', '/analytics': 'analytics',
    '/report': 'report', '/water-quality': 'waterquality', '/simulator': 'simulator', '/authority': 'authority', '/privacy': 'privacy'
  };
  var NAV = [
    ['/dashboard', 'Public Dashboard'], ['/map', 'Map'], ['/warnings', 'Early Warnings'], ['/analytics', 'Analytics'],
    ['/report', 'Report'], ['/water-quality', 'Water Quality'], ['/simulator', 'Demo'], ['/authority', 'Authority']
  ];

  AG.pages.notfound = {
    title: 'Page not found — AquaGuard AI',
    render: function (root) {
      root.innerHTML = '<div class="wrap page narrow"><div class="empty card">' + AG.icon('map', 28) + '<h1>That page doesn’t exist</h1>' +
        '<p>Check the address, or head back to the start.</p><a class="btn btn-primary" href="#/">Go to the home page</a></div></div>';
    }
  };

  function parseHash() {
    var raw = (window.location.hash || '').replace(/^#/, '');
    var parts = raw.split('?'), path = parts[0].replace(/\/+$/, '') || '/', params = {};
    (parts[1] || '').split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { path: path, params: params };
  }

  function chrome() {
    var brand = '<a class="brand" href="#/" aria-label="AquaGuard AI — home"><span class="brand-mark">' + AG.icon('droplet', 20) +
      '</span><span class="brand-text"><b>AquaGuard AI</b><small>Early Warning System</small></span></a>';
    document.getElementById('site-header').innerHTML =
      '<a class="skip" href="#app" id="skip">Skip to content</a>' +
      '<div class="wrap hdr-bar">' + brand +
        '<nav id="nav" class="nav" aria-label="Primary">' + NAV.map(function (n) {
          return '<a href="#' + n[0] + '" data-path="' + n[0] + '">' + n[1] + '</a>';
        }).join('') + '</nav>' +
        '<a id="hdr-scn" class="scenario-pill hdr-pill" href="#/simulator" hidden></a>' +
        '<button type="button" class="menu-btn" id="menu" aria-expanded="false" aria-controls="nav" aria-label="Open menu">' + AG.icon('menu', 22) + '</button>' +
      '</div>';
    document.getElementById('site-footer').innerHTML =
      '<div class="wrap foot-grid">' +
        '<div class="foot-brand">' + brand + '<p>From community signals to early action — transparent, explainable water-health intelligence for wards, panchayats and district health teams.</p></div>' +
        '<div><h2>Platform</h2><ul>' + NAV.map(function (n) { return '<li><a href="#' + n[0] + '">' + n[1] + '</a></li>'; }).join('') +
          '<li><a href="#/authority">Authority Demo</a></li><li><a href="#/privacy">Privacy &amp; Safety</a></li></ul></div>' +
        '<div class="foot-note"><h2>Important</h2><p>' + AG.DISCLAIMER + '</p></div>' +
      '</div>' +
      '<div class="wrap foot-base">AquaGuard AI — student hackathon prototype using synthetic demo data.</div>';

    var menu = document.getElementById('menu'), nav = document.getElementById('nav');
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', open);
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); }
    });
  }

  function updateChrome(path) {
    document.querySelectorAll('#nav a').forEach(function (a) {
      var on = a.getAttribute('data-path') === path;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var pill = document.getElementById('hdr-scn'), sc = AG.store.scenario();
    if (sc.id === 'normal') pill.hidden = true;
    else { pill.hidden = false; pill.innerHTML = AG.icon('play', 12) + AG.esc(sc.name); }
    document.body.setAttribute('data-page', ROUTES[path] || 'notfound');
  }

  function render(keepScroll) {
    var r = parseHash(), key = ROUTES[r.path], page = (key && AG.pages[key]) || AG.pages.notfound;
    var root = document.getElementById('app'), y = window.scrollY;
    document.title = page.title;
    try { page.render(root, r.params); }
    catch (err) {
      console.error(err);
      root.innerHTML = '<div class="wrap page narrow"><div class="empty card"><h1>Something went wrong</h1><p>Reload the page. If it keeps happening, reset the demo data from the Demo page.</p></div></div>';
    }
    updateChrome(r.path);
    if (keepScroll) window.scrollTo(0, y);
    else { window.scrollTo(0, 0); root.focus({ preventScroll: true }); }
  }

  AG.rerender = function () { render(true); };
  AG.store.subscribe(function () { updateChrome(parseHash().path); });

  window.addEventListener('hashchange', function () { render(false); });
  document.addEventListener('DOMContentLoaded', function () {
    chrome();
    render(false);
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a#skip');
    if (a) { e.preventDefault(); document.getElementById('app').focus(); }
  });
})();
