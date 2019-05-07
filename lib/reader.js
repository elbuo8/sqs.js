'use strict';

var assert = require('assert');
var utils = require('./utils.js');
var Emitter = require('events').EventEmitter;

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
 
  this.visibility = config.visibility || config.VisibilityTimeout;
  this.pollInterval = config.pollInterval || 1000;
  this.queueUrl = config.queueUrl || config.QueueUrl;
  this.parseJSON = config.parseJSON;
  this.pollingSize = config.pollingSize || config.MaxNumberOfMessages || 10;
  this.attributes = config.attributes;
  this.waitTimeSeconds = config.waitTimeSeconds || 0;
  if (config.startPolling) this.poll();
}

Reader.prototype.__proto__ = Emitter.prototype;

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
    }, function(err, data) {
      if (err) self.emit('error', err);
      if (msg.expirationTimeout) clearTimeout(msg.expirationTimeout);
      if (cb) return cb(err, data);
    });
  };
  msg.extendTimeout = function(amount, cb) {
    self.sqs.changeMessageVisibility({
      QueueUrl: self.queueUrl, ReceiptHandle: this.ReceiptHandle, VisibilityTimeout: amount
    }, function(err, data) {
      if (err) self.emit('error', err);
      else {
        msg.expirationTimeout = setTimeout(function() {
          self.emit('expiring', msg);
        }, (amount * 1000) - 60000);
      }

      if (cb) return cb(err, data);
    });
  };
  if (self.visibility) {
    msg.expirationTimeout = setTimeout(function() {
      self.emit('expiring', msg);
    }, (self.visibility * 1000) - 60000);
  }
  return msg;
};

Reader.prototype.receiveMessages = function() {
  var self = this;

  var opts = {
    QueueUrl: self.queueUrl,
    MaxNumberOfMessages: self.pollingSize,
    WaitTimeSeconds: self.waitTimeSeconds
  };

  if (self.visibility) opts.VisibilityTimeout = self.visibility;
  if (self.attributes) opts.AttributeNames = self.attributes;

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
  self.receiveMessages();
  self.interval = setInterval(self.receiveMessages.bind(self), self.pollInterval);
};

Reader.prototype.purge = function(cb) {
  var self = this;
  var opts = {
    QueueUrl: this.queueUrl
  };
  self.sqs.purgeQueue(opts, function(err, data) {
    if (err) self.emit('error', err);
    if (cb) return cb(err, data);
  });
};

Reader.prototype.close = function() {
  clearInterval(this.interval);
};

module.exports = Reader;
