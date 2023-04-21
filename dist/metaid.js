
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    class Transation {
        constructor() { }
        build_tx_data(params) {
            console.log(params);
        }
        build_meta_data(params) {
            console.log(params);
        }
    }

    const tx = new Transation();
    tx.build_tx_data({
        payTos: [
            {
                amount: 1000,
                address: "12313",
            },
        ],
        opData: "",
    });

}));
//# sourceMappingURL=metaid.js.map
