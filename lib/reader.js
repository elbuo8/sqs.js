'use strict';

var Emitter = require('events');
var assert = require('assert');
var AWS = require('aws-sdk');

// config object options
// region
// accessKeyId
// secretAccessKey
// version (default to 'latest')
// queueUrl
// visibility
// pollInterval

function Reader(config) {
  this.sqs = config.sqs;
  if (!config.sqs) {
    assert(config.region, 'region required');
    assert(config.accessKeyId, 'accessKeyId required');
    assert(config.secretAccessKey, 'secretAccessKey required');
    config.version = config.version || 'latest';

    this.sqs = new AWS.SQS({
      apiVersion: config.version,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    });
  }
  assert(config.queueUrl, 'queueUrl required');

  this.visibility = config.visibility;
  this.pollInterval = config.pollInterval || 1000;
  this.queueUrl = config.queueUrl;
  this.poll();
}

Reader.prototype = Object.create(Emitter.prototype);

Reader.prototype.poll = function() {
  var self = this;

  var opts = {
    QueueUrl: self.queueUrl,
  };

  if (self.visibility) opts.VisibilityTimeout = self.visibility;

  self.interval = setInterval(function() {
    self.sqs.receiveMessage(opts, function(err, data) {
      if (err) return self.emit('error', err);
      if (data && data.Messages) {
        data.Messages.forEach(function(msg) {
          msg.ack = function(cb) {
            self.sqs.deleteMessage({
              QueueUrl: opts.QueueUrl, ReceiptHandle: msg.ReceiptHandle
            }, cb);
          };
          self.emit('message', msg);
        });
      }
    });
  }, self.pollInterval);
};

module.exports = Reader;
