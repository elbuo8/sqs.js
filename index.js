'use strict';

var Reader = require('./lib/reader.js');

exports.reader = function(config) {
  return new Reader(config);
};
