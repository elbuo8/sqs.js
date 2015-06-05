'use strict';

var assert = require('assert');
var utils = require('./utils.js');
var Emitter = require('events').EventEmitter;

// config object options
// sqs
// region
// accessKeyId
// secretAccessKey
// version
// queueUrl

function Writer(config) {
  this.sqs = config.sqs;
  if (!config.sqs) {
    this.sqs = utils.buildSQS(config);
  }
  this.queueUrl = config.queueUrl || config.QueueUrl;

  assert(this.queueUrl, 'queueUrl required');

  this.batchMessages = [];
  this.flushSize = Math.min(config.flushSize, 10) || 10;
  this.flushInterval = config.flushInterval || 10000;

  var self = this;

  self.on('enqueue', function(msg) {
    self.batchMessages.push(msg);
    if (self.batchMessages.length >= self.flushSize) {
      if (self.timer) clearTimeout(self.timer);
      self.publishBatch(self.batchMessages.splice(0, self.flushSize));
    } else {
      if (self.timer) clearTimeout(self.timer);
      self.timer = setTimeout(function() {
        self.publishBatch(self.batchMessages.splice(0, self.flushSize));
      }, self.flushInterval);
    }
  });
}

Writer.prototype.__proto__ = Emitter.prototype;

Writer.prototype.publish = function(msg, cb) {
  var self = this;

  if (!msg.QueueUrl) msg.QueueUrl = this.queueUrl;

  self.sqs.sendMessage(msg, function(err, data) {
    if (err) self.emit('error', err);
    if (cb) return cb(err, data);
  });
};

Writer.prototype.publishBatch = function(msgs, cb) {
  var self = this;
  msgs.forEach(function(msg, idx) {
    if (!msg.Id) msg.Id = idx.toString();
  });

  var opts = {
    Entries: msgs,
    QueueUrl: self.queueUrl
  };

  self.sqs.sendMessageBatch(opts, function(err, data) {
    if (err) self.emit('error', err);
    if (cb) return cb(err, data);
  });
};

module.exports = Writer;
