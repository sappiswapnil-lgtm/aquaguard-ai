/* AquaGuard AI — core utilities (no dependencies, works from file:// and GitHub Pages) */
(function () {
  'use strict';
  var AG = (window.AG = window.AG || {});
  AG.pages = AG.pages || {};

  AG.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* Deterministic random numbers so the demo data is stable between visits */
  AG.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  AG.hash = function (str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  AG.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  AG.sum = function (arr, fn) { return arr.reduce(function (s, x) { return s + (fn ? fn(x) : x); }, 0); };
  AG.avg = function (arr) { return arr.length ? AG.sum(arr) / arr.length : 0; };
  AG.pick = function (rand, arr) { return arr[Math.floor(rand() * arr.length)]; };
  AG.weighted = function (rand, items) {
    var total = AG.sum(items, function (i) { return i[1]; });
    var r = rand() * total;
    for (var i = 0; i < items.length; i++) {
      r -= items[i][1];
      if (r <= 0) return items[i][0];
    }
    return items[items.length - 1][0];
  };
  AG.normal = function (rand, mean, sd) {
    var u = 1 - rand(), v = rand();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  AG.round = function (v, d) { var m = Math.pow(10, d || 0); return Math.round(v * m) / m; };

  /* Dates — all local, keyed as YYYY-MM-DD */
  AG.dayKey = function (d) {
    var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  };
  AG.parseKey = function (k) {
    var p = k.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  };
  AG.addDays = function (d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
  AG.today = function () { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  AG.fmtShort = function (key) { var d = AG.parseKey(key); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  AG.fmtLong = function (key) { var d = AG.parseKey(key); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
  AG.fmtNum = function (n) { return Number(n).toLocaleString('en-IN'); };
  AG.relDay = function (di) {
    var ago = 89 - di;
    if (ago === 0) return 'Today';
    if (ago === 1) return 'Yesterday';
    return ago + ' days ago';
  };
})();
