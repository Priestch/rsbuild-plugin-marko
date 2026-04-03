"use strict";

exports.__esModule = true;
exports.default = void 0;
var _ = _interopRequireWildcard(require("@marko/runtime-tags/debug/html"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
var _default = exports.default = _._template("src/templates/button.marko", input => {
  _._scope_reason();
  const $scope0_id = _._scope_id();
  _._html(`<button id=first>Click me!</button>${_._el_resume($scope0_id, "#button/0")}`);
  _._script($scope0_id, "src/templates/button.marko_0");
  _._scope($scope0_id, {}, "src/templates/button.marko", 0);
});