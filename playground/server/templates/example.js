"use strict";

exports.__esModule = true;
exports.default = void 0;
var _button = _interopRequireDefault(require('./button.js'));
var _counter = _interopRequireDefault(require('./counter.js'));
var _ = _interopRequireWildcard(require("@marko/runtime-tags/debug/html"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var _default = exports.default = _._template("src/templates/example.marko", input => {
  _._scope_reason();
  const $scope0_id = _._scope_id();
  _._html("<html><head><title>Marko Example</title></head><body><h1 id=content>Hello, Marko!</h1><div>The test was successful and the Marko pages loaded! Click the buttons below:</div>");
  (0, _button.default)({});
  (0, _counter.default)({});
  _._trailers("</body></html>");
});