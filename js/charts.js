/* AquaGuard AI — tiny SVG chart helpers (no libraries, so the site works offline). */
(function () {
  'use strict';
  var AG = window.AG;
  var uid = 0;

  function niceScale(max, ticks) {
    if (!(max > 0)) return { max: 1, step: 0.25 };
    var raw = max / (ticks || 4);
    var pow = Math.pow(10, Math.floor(Math.log10(raw)));
    var f = raw / pow;
    var nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    var step = nf * pow;
    return { max: Math.ceil(max / step) * step, step: step };
  }
  function fmtTick(v) {
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k';
    return (Math.round(v * 100) / 100).toString();
  }
  function linePath(values, x, y) {
    var d = '', pen = false;
    values.forEach(function (v, i) {
      if (v == null) return;
      d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1);
      pen = true;
    });
    return d;
  }

  var charts = (AG.charts = {});

  /* Semi-circular risk gauge with the four risk bands and a marker at the score */
  charts.gauge = function (score, levelKey) {
    var L = AG.LEVELS[levelKey];
    var cx = 110, cy = 108, r = 88;
    var theta = Math.PI * (1 - AG.clamp(score, 0, 100) / 100);
    var mx = cx + r * Math.cos(theta), my = cy - r * Math.sin(theta);
    var arc = 'M ' + (cx - r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy;
    var segs = ['low', 'moderate', 'high', 'critical'].map(function (k, i) {
      return '<path d="' + arc + '" pathLength="100" fill="none" stroke="' + AG.LEVELS[k].color + '" stroke-opacity="' +
        (k === levelKey ? '1' : '.22') + '" stroke-width="14" stroke-dasharray="' + (i === 3 ? 25 : 24) + ' 100" stroke-dashoffset="' + (-i * 25) + '"/>';
    }).join('');
    return '<svg class="gauge" viewBox="0 0 220 132" role="img" aria-label="Risk score ' + score + ' out of 100, ' + L.label + '">' +
      segs +
      '<circle cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="9" fill="#fff" stroke="' + L.color + '" stroke-width="4"/>' +
      '<text x="110" y="100" text-anchor="middle" class="gauge-num">' + score + '</text>' +
      '<text x="110" y="124" text-anchor="middle" class="gauge-lab" fill="' + L.ink + '">' + L.label + ' risk</text>' +
      '</svg>';
  };

  /* Line / area chart. o = {labels, series:[{name,color,values,dashed,area}], band:{min,max}, yMin,yMax,yFmt, ariaLabel} */
  charts.line = function (o) {
    var W = 680, H = o.h || 250, pad = { l: 42, r: 14, t: 14, b: 28 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, n = o.labels.length;
    var vals = [];
    o.series.forEach(function (s) { s.values.forEach(function (v) { if (v != null) vals.push(v); }); });
    if (o.band) vals.push(o.band.max);
    var maxV = vals.length ? Math.max.apply(null, vals) : 1;
    var yMin = o.yMin != null ? o.yMin : 0;
    var sc = niceScale(Math.max(maxV - yMin, 0.0001) * (o.headroom || 1.08), 4);
    var yMax = o.yMax != null ? o.yMax : yMin + sc.max;
    var step = o.yMax != null ? (yMax - yMin) / 4 : sc.step;
    var x = function (i) { return pad.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1)); };
    var y = function (v) { return pad.t + ih - ((v - yMin) / (yMax - yMin)) * ih; };
    var fmt = o.yFmt || fmtTick;
    var out = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + AG.esc(o.ariaLabel || 'Chart') + '">';
    var id = 'g' + ++uid;
    out += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' +
      o.series[0].color + '" stop-opacity=".22"/><stop offset="1" stop-color="' + o.series[0].color + '" stop-opacity="0"/></linearGradient></defs>';
    for (var t = yMin; t <= yMax + step / 1000; t += step) {
      out += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '" class="grid"/>' +
        '<text x="' + (pad.l - 8) + '" y="' + (y(t) + 4).toFixed(1) + '" text-anchor="end" class="axis">' + fmt(t) + '</text>';
    }
    if (o.band) {
      var by1 = y(Math.min(o.band.max, yMax)), by2 = y(Math.max(o.band.min, yMin));
      out += '<rect x="' + pad.l + '" y="' + by1.toFixed(1) + '" width="' + iw + '" height="' + Math.max(0, by2 - by1).toFixed(1) + '" class="band"><title>Reference range</title></rect>';
    }
    var every = Math.max(1, Math.ceil(n / 7));
    o.labels.forEach(function (lb, i) {
      var isLast = i === n - 1 && (n - 1) % every >= Math.ceil(every / 2);
      if (i % every === 0 || isLast) {
        out += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" class="axis">' + AG.esc(lb) + '</text>';
      }
    });
    o.series.forEach(function (s) {
      if (s.area) {
        var pts = [];
        s.values.forEach(function (v, i) { if (v != null) pts.push([x(i), y(v)]); });
        if (pts.length > 1) {
          out += '<path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') +
            'L' + pts[pts.length - 1][0].toFixed(1) + ' ' + y(yMin).toFixed(1) + 'L' + pts[0][0].toFixed(1) + ' ' + y(yMin).toFixed(1) + 'Z" fill="url(#' + id + ')"/>';
        }
      }
      out += '<path d="' + linePath(s.values, x, y) + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.width || 2.4) +
        '" stroke-linejoin="round" stroke-linecap="round"' + (s.dashed ? ' stroke-dasharray="5 5"' : '') + '/>';
      if (n <= 45 || s.dots) {
        s.values.forEach(function (v, i) {
          if (v == null) return;
          out += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (n <= 12 ? 4 : 3) + '" fill="#fff" stroke="' + s.color + '" stroke-width="2"><title>' +
            AG.esc(s.name + ' · ' + o.labels[i] + ': ' + fmt(v)) + '</title></circle>';
        });
      } else {
        s.values.forEach(function (v, i) {
          if (v == null) return;
          out += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="5" fill="transparent"><title>' +
            AG.esc(s.name + ' · ' + o.labels[i] + ': ' + fmt(v)) + '</title></circle>';
        });
      }
    });
    return '<div class="chart-wrap">' + out + '</svg></div>';
  };

  /* Bars (right axis, e.g. rainfall) + line (left axis, e.g. reports) */
  charts.dual = function (o) {
    var W = 680, H = o.h || 260, pad = { l: 42, r: 46, t: 14, b: 28 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, n = o.labels.length;
    var lmax = niceScale(Math.max.apply(null, o.line.values.concat([1])) * 1.1, 4);
    var bmaxRaw = Math.max.apply(null, o.bars.values.concat([1]));
    var bsc = niceScale(bmaxRaw * 1.1, 4);
    var x = function (i) { return pad.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1)); };
    var yl = function (v) { return pad.t + ih - (v / lmax.max) * ih; };
    var yb = function (v) { return pad.t + ih - (v / bsc.max) * ih; };
    var bw = Math.max(2, Math.min(18, (iw / n) * 0.62));
    var out = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + AG.esc(o.ariaLabel || 'Chart') + '">';
    for (var t = 0; t <= lmax.max + lmax.step / 1000; t += lmax.step) {
      out += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + yl(t).toFixed(1) + '" y2="' + yl(t).toFixed(1) + '" class="grid"/>' +
        '<text x="' + (pad.l - 8) + '" y="' + (yl(t) + 4).toFixed(1) + '" text-anchor="end" class="axis">' + fmtTick(t) + '</text>';
    }
    for (var u = 0; u <= bsc.max + bsc.step / 1000; u += bsc.step) {
      out += '<text x="' + (W - pad.r + 8) + '" y="' + (yb(u) + 4).toFixed(1) + '" text-anchor="start" class="axis axis-b">' + fmtTick(u) + '</text>';
    }
    o.bars.values.forEach(function (v, i) {
      if (v <= 0) return;
      out += '<rect x="' + (x(i) - bw / 2).toFixed(1) + '" y="' + yb(v).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (yb(0) - yb(v)).toFixed(1) +
        '" rx="2" fill="' + o.bars.color + '" fill-opacity=".38"><title>' + AG.esc(o.bars.name + ' · ' + o.labels[i] + ': ' + v + ' mm') + '</title></rect>';
    });
    var every = Math.max(1, Math.ceil(n / 7));
    o.labels.forEach(function (lb, i) {
      if (i % every === 0) out += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" class="axis">' + AG.esc(lb) + '</text>';
    });
    out += '<path d="' + linePath(o.line.values, x, yl) + '" fill="none" stroke="' + o.line.color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
    if (n <= 45) {
      o.line.values.forEach(function (v, i) {
        out += '<circle cx="' + x(i).toFixed(1) + '" cy="' + yl(v).toFixed(1) + '" r="3" fill="#fff" stroke="' + o.line.color + '" stroke-width="2"><title>' +
          AG.esc(o.line.name + ' · ' + o.labels[i] + ': ' + v) + '</title></circle>';
      });
    }
    return '<div class="chart-wrap">' + out + '</svg></div>';
  };

  charts.spark = function (values, color, w, h) {
    w = w || 96; h = h || 30;
    var max = Math.max.apply(null, values.concat([1])), n = values.length;
    var d = values.map(function (v, i) {
      return (i ? 'L' : 'M') + ((i * (w - 4)) / Math.max(1, n - 1) + 2).toFixed(1) + ' ' + (h - 3 - (v / max) * (h - 6)).toFixed(1);
    }).join('');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="' + color +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  /* Pearson correlation between two equal-length numeric arrays */
  charts.correlation = function (a, b) {
    var n = a.length;
    if (n < 3) return 0;
    var ma = AG.avg(a), mb = AG.avg(b), num = 0, da = 0, db = 0;
    for (var i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += Math.pow(a[i] - ma, 2); db += Math.pow(b[i] - mb, 2); }
    return da && db ? num / Math.sqrt(da * db) : 0;
  };
})();
