'use strict';

var Emitter = require('events');
var utils = require('./utils.js');

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
  this.batchMessages = [];

  var self = this;

  self.on('enqueue', function(msg) {
    self.batchMessages.push(msg);
    if (self.batchMessages.length >= 10) {
      self.publishBatch(self.batchMessages.splice(0, 10));
    }
  });
}

Writer.prototype = Object.create(Emitter.prototype);

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
    if (!msg.Id) msg.Id = idx;
  });

  var opts = {
    Entries: msgs,
    QueueUrl: this.queueUrl
  };

  self.sqs.sendMessageBatch(opts, function(err, data) {
    if (err) self.emit('error', err);
    if (cb) return cb(err, data);
  });
};

module.exports = Writer;
