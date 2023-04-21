(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.metaidjs = factory());
})(this, (function () { 'use strict';

    var main = {
        aa: 456,
    };

    return main;

}));
//# sourceMappingURL=metaid.js.map
