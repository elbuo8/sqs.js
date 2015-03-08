'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var sqsjs = require('../index.js');

describe('writer', function() {
  describe('#constructor', function() {
    var config = {};
    var writer;
    it('should throw if region is not provided', function() {
      expect(function () {new sqsjs.writer(config);}).to.throw(/region required/);
    });
    it('should throw if accessKeyId is not provided', function() {
      config.region = 'region';
      expect(function () {new sqsjs.writer(config);}).to.throw(/accessKeyId required/);
    });
    it('should throw if secretAccessKey is not provided', function() {
      config.accessKeyId = 'id';
      expect(function () {new sqsjs.writer(config);}).to.throw(/secretAccessKey required/);
    });
    it('should not return null', function() {
      config.secretAccessKey = 'secret';
      config.queueUrl = 'link';
      writer = new sqsjs.writer(config);
      expect(writer).to.exist;
    });
    it('should accept an sqs object as alternative to AWS info', function () {
      config = {sqs: {}, queueUrl: 'link'};
      writer = new sqsjs.writer(config);
      expect(writer).to.exist;
    });
  });

  describe('#publish', function() {
    var writer, config, sendMessageSpy, errEmitSpy, callbackSpy;
    before(function() {
      config = {
        sqs: {
          sendMessage: function(opts, cb) {
            expect(opts).to.exist;
            return cb(new Error());
          }
        },
        queueUrl: 'link'
      };
      writer = new sqsjs.writer(config);
      sendMessageSpy = sinon.spy(writer.sqs, 'sendMessage');
      errEmitSpy = sinon.spy();
      callbackSpy = sinon.spy();
      writer.on('error', errEmitSpy);
      writer.publish({}, callbackSpy);
    });
    it('should call sqs.sendMessage once', function() {
      expect(sendMessageSpy.calledOnce).to.be.true;
    });
    it('should emit error if AWS failed', function() {
      expect(errEmitSpy.calledOnce).to.be.true;
    });
    it('should return a callback with an error if AWS failed', function() {
      expect(callbackSpy.calledOnce).to.be.true;
    });
  });
  describe('#publishBatch', function() {
    var writer, config, sendMessageBatchSpy, errEmitSpy, callbackSpy;
    before(function() {
      config = {
        sqs: {
          sendMessageBatch: function(payload, cb) {
            payload.Entries.forEach(function(msg) {
              expect(msg.Id).to.exist;
            });
            return cb(new Error());
          }
        }
      };
      writer = new sqsjs.writer(config);
      sendMessageBatchSpy = sinon.spy(writer.sqs, 'sendMessageBatch');
      errEmitSpy = sinon.spy();
      callbackSpy = sinon.spy();
      writer.on('error', errEmitSpy);
      writer.publishBatch([{}, {}], callbackSpy);
    });

    it('should call sqs.sendMessageBatch once', function() {
      expect(sendMessageBatchSpy.calledOnce).to.be.true;
    });
    it('should emit an error if AWS failed', function() {
      expect(errEmitSpy.calledOnce).to.be.true;
    });
    it('should return a callback with an error if AWS failed', function() {
      expect(callbackSpy.calledOnce).to.be.true;
    });
  });

  describe('#on(\'enqueue\')', function() {
    var writer, config;
    before(function() {
      config = {
        sqs: {
          sendMessageBatch: function(payload, cb) {
            expect(payload.Entries.length).to.equal(10);
            payload.Entries.forEach(function(msg) {
              expect(msg.Id).to.exist;
            });
            return cb();
          }
        },
        queueUrl: 'link'
      };
      writer = new sqsjs.writer(config);
    });

    it('should call #publishBatch when 10 messages are in queue', function() {
      var spy = sinon.spy(writer.sqs, 'sendMessageBatch');
      for (var i = 0; i < 20; i++) {
        writer.emit('enqueue', {Body: i});
      }
      expect(spy.calledTwice).to.be.true;
    });
  });
});
