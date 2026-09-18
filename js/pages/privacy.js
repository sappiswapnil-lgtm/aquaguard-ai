/* Privacy & Safety */
(function () {
  'use strict';
  var AG = window.AG;

  AG.pages.privacy = {
    title: 'Privacy & Safety — AquaGuard AI',
    render: function (root) {
      root.innerHTML = '<div class="wrap page narrow prose">' +
        AG.pageHead('Privacy & Safety', 'What this platform does and does not do', '') +
        '<p class="callout">' + AG.DISCLAIMER + '</p>' +
        '<section class="card"><h2>We never collect</h2><ul class="ticks">' +
          '<li>Aadhaar or any government identity number</li>' +
          '<li>Phone numbers, unless a user explicitly chooses to provide a contact for follow-up</li>' +
          '<li>Medical records or clinical history</li>' +
          '<li>Names or any unnecessary personally identifiable information</li></ul></section>' +
        '<section class="card"><h2>Anonymous by default</h2><p>Community reports are submitted anonymously. Reports are stored at area level only and are used to detect patterns, never to identify individuals.</p></section>' +
        '<section class="card"><h2>Not a diagnosis</h2><p>Risk scores and alerts are indicators for further investigation. They do not diagnose any individual and do not officially declare an outbreak. Any confirmation requires professional public-health investigation and laboratory testing.</p></section>' +
        '<section class="card"><h2>Reference thresholds</h2><p>Water-quality thresholds used in this prototype are configurable demo/reference values chosen for demonstration. They are not universal medical or regulatory standards.</p></section>' +
        '<section class="card"><h2>Where your demo data lives</h2><p>This build runs entirely in your browser. Reports and readings you add are kept in this browser’s local storage so the demo can react to them, and are never uploaded. Use “Reset demo data” in the simulator to clear them.</p></section>' +
      '</div>';
    }
  };
})();
