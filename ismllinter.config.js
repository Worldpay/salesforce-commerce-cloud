'use strict';

// Please check all available configurations and rules
// at https://www.npmjs.com/package/isml-linter.

var config = {
    enableCache: true,
    rules: {
        'no-space-only-lines': {},
        'no-tabs': {},
        'no-trailing-spaces': {}
    },
    ignore: [
        'int_worldpay',
        'int_worldpay_core',
        'int_worldpay_csc',
        'int_worldpay_sfra',
        'worldpay_sfra_changes'
    ]
};

module.exports = config;
