/* AquaGuard AI — state: active scenario, anonymous reports, water-quality readings, authority actions.
   Persisted in this browser only (localStorage). Nothing is sent anywhere. */
(function () {
  'use strict';
  var AG = window.AG;
  var KEY = 'aquaguard.demo.v1';
  var listeners = [];
  var memo = null;

  var state = { scenario: 'normal', userReports: [], userReadings: [], actions: {} };

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        state.scenario = AG.SCENARIO_BY_ID[s.scenario] ? s.scenario : 'normal';
        state.userReports = Array.isArray(s.userReports) ? s.userReports : [];
        state.userReadings = Array.isArray(s.userReadings) ? s.userReadings : [];
        state.actions = s.actions && typeof s.actions === 'object' ? s.actions : {};
      }
    } catch (e) { /* storage unavailable — keep in memory */ }
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function changed() {
    memo = null;
    save();
    listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
  }

  AG.store = {
    state: state,
    subscribe: function (fn) { listeners.push(fn); },
    get: function () {
      if (!memo) {
        var ds = AG.buildDataset(state.scenario, state.userReports, state.userReadings);
        memo = { ds: ds, an: AG.analyze(ds) };
      }
      return memo;
    },
    scenario: function () { return AG.SCENARIO_BY_ID[state.scenario]; },
    setScenario: function (id) {
      if (!AG.SCENARIO_BY_ID[id]) return;
      state.scenario = id;
      changed();
    },
    addReport: function (r) {
      r.id = 'U' + Date.now().toString(36);
      state.userReports.push(r);
      changed();
      return r;
    },
    addReading: function (r) {
      r.id = 'UQ' + Date.now().toString(36);
      state.userReadings.push(r);
      changed();
      return r;
    },
    /* Authority console: per-scenario, per-area workflow status */
    actionFor: function (areaId) {
      return state.actions[state.scenario + ':' + areaId] || { status: 'new', team: '', note: '' };
    },
    setAction: function (areaId, patch) {
      var k = state.scenario + ':' + areaId;
      state.actions[k] = Object.assign({ status: 'new', team: '', note: '' }, state.actions[k], patch);
      save();
    },
    flag: function (k) { return !!state.actions[state.scenario + ':' + k]; },
    setFlag: function (k, v) {
      if (v) state.actions[state.scenario + ':' + k] = true; else delete state.actions[state.scenario + ':' + k];
      save();
    },
    resetDemo: function () {
      state.scenario = 'normal';
      state.userReports = [];
      state.userReadings = [];
      state.actions = {};
      changed();
    }
  };
  load();
})();
