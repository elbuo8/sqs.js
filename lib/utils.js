'use strict';

var assert = require('assert');
var AWS = require('aws-sdk');

exports.buildSQS = function(config) {
  assert(config.region, 'region required');
  assert(config.accessKeyId, 'accessKeyId required');
  assert(config.secretAccessKey, 'secretAccessKey required');
  config.version = config.version || 'latest';

  return new AWS.SQS({
    apiVersion: config.version,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region
  });
};
