'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('base/search/search'));
    processInclude(require('./product/quickView'));
});
