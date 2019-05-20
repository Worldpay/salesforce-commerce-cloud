/* globals cat, cd, cp, echo, exec, exit, find, ls, mkdir, rm, target, test */
'use strict';

require('shelljs/make');
var path = require('path');

var createJSPath = function () {
    var result = {};

    var jsFiles = ls('./tmp/js/*.js');

    jsFiles.forEach(function (filePath) {
        var name = path.basename(filePath, '.js');
        result[name] = filePath;
    });
  // setTimeout(()=> {},100000);
    return result;
};

module.exports = [{
    name: 'js',
    entry: createJSPath(),
    output: {
        path: path.resolve('./cartridges/int_worldpay_sfra/cartridge/static/default/js/'),
        filename: '[name].js'
    }
}];
