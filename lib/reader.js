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
  this.parseJSON = config.parseJSON;
  this.debug = config.debug;
  if (!this.debug) this.poll();
}

Reader.prototype = Object.create(Emitter.prototype);

Reader.prototype.buildMessage = function(msg) {
  var self = this;
  if (this.parseJSON) {
    try {
      msg.Body = JSON.parse(msg.Body);
    } catch(e) {
      if (this.debug) {
        console.log(e);
      }
    }
  }
  msg.body = msg.Body;
  msg.ack = function(cb) {
    self.sqs.deleteMessage({
      QueueUrl: self.queueUrl, ReceiptHandle: this.ReceiptHandle
    }, cb);
  };
  return msg;
};

Reader.prototype.receiveMessages = function() {
  var self = this;

  var opts = {
    QueueUrl: self.queueUrl,
    MaxNumberOfMessages: 10
  };
  if (self.visibility) opts.VisibilityTimeout = self.visibility;

  self.sqs.receiveMessage(opts, function(err, data) {
    if (err) return self.emit('error', err);
    if (data && data.Messages) {
      var msgs = data.Messages.map(self.buildMessage.bind(self));
      msgs.forEach(function(msg) {
        self.emit('message', msg);
      });
    }
  });
};

Reader.prototype.poll = function() {
  var self = this;

  self.interval = setInterval(self.receiveMessages.bind(self), self.pollInterval);
};

Reader.prototype.close = function() {
  clearInterval(this.interval);
};

module.exports = Reader;
