'use strict';

var assert = require('assert');
var Emitter = require('events');
var utils = require('./utils.js');

// config object options
// sqs
// region
// accessKeyId
// secretAccessKey
// version (default to 'latest')
// queueUrl
// visibility
// pollInterval
// debug
// parseJSON

function Reader(config) {
  this.sqs = config.sqs;
  if (!config.sqs) {
    this.sqs = utils.buildSQS(config);
  }
  assert(config.queueUrl, 'queueUrl required');

  this.visibility = config.visibility;
  this.pollInterval = config.pollInterval || 1000;
  this.queueUrl = config.queueUrl;
  this.parseJSON = config.parseJSON;
  if (config.startPolling) this.poll();
}

Reader.prototype = Object.create(Emitter.prototype);

Reader.prototype.buildMessage = function(msg) {
  var self = this;
  if (this.parseJSON) {
    try {
      msg.Body = JSON.parse(msg.Body);
    } catch(e) {}
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
