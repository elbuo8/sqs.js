'use strict';

var Reader = require('./lib/reader.js');
var Writer = require('./lib/writer.js');

exports.reader = function(config) {
  return new Reader(config);
};

exports.writer = function(config) {
  return new Writer(config);
};
