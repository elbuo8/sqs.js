'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var sqsjs = require('../index.js');

describe('sqs.js', function() {
  describe('#constructor', function() {
    var config = {debug: true};
    var reader;
    it('should throw if region is not provided', function() {
      expect(function () {new sqsjs.reader(config);}).to.throw(/region required/);
    });
    it('should throw if accessKeyId is not provided', function() {
      config.region = 'region';
      expect(function () {new sqsjs.reader(config);}).to.throw(/accessKeyId required/);
    });
    it('should throw if secretAccessKey is not provided', function() {
      config.accessKeyId = 'id';
      expect(function () {new sqsjs.reader(config);}).to.throw(/secretAccessKey required/);
    });
    it('should throw if queueUrl is not provided', function() {
      config.secretAccessKey = 'secret';
      expect(function () {new sqsjs.reader(config);}).to.throw(/queueUrl required/);
    });
    it('should not return null', function() {
      config.queueUrl = 'link';
      reader = new sqsjs.reader(config);
      expect(reader).to.exist;
    });
    it('should accept an sqs object as alternative to AWS info', function () {
      config = {sqs: {}, debug: true, queueUrl: 'link'};
      reader = new sqsjs.reader(config);
      expect(reader).to.exist;
    });
  });

  describe('#buildMessage', function() {
    var reader, config, msg;
    beforeEach(function() {
      config = {
        debug: true,
        parseJSON: true,
        queueUrl: 'link',
        sqs: {
          deleteMessage: function(opts, cb) {
            return cb();
          }
        }
      };
      reader = new sqsjs.reader(config);
    });
    it('should parse JSON if flag is set', function() {
      msg = {
        Body: '{}'
      };
      var transformedMsg = reader.buildMessage(msg);
      expect(msg).to.exist;
      expect(msg.Body).to.be.an('object');
    });
    it('should fail silently if JSON is not valid', function() {
      msg = {
        Body: {}
      };
      var transformedMsg = reader.buildMessage(msg);
      expect(msg).to.exist;
      expect(msg.Body).to.be.an('object');
    });
    it('should create a copy of Body into body', function() {
      msg = {
        Body: '{}'
      };
      var transformedMsg = reader.buildMessage(msg);
      expect(msg).to.exist;
      expect(msg.body).to.exist;
      expect(msg.body).to.equal(msg.Body);
    });
    it('should add a method called ack', function() {
      msg = {
        Body: '{}'
      };
      var transformedMsg = reader.buildMessage(msg);
      expect(msg).to.exist;
      expect(msg.ack).to.exist;
      typeof msg.ack;
      expect(msg.ack).to.be.a('function');
    });
  });

  describe('#receiveMessages', function() {
    var config, reader;
    beforeEach(function() {
      config = {
        sqs: {},
        debug: true,
        queueUrl: 'link'
      };
      reader = new sqsjs.reader(config);
    });

    it('should emit error if sqs receiveMessage sends error', function(done) {
      reader.sqs.receiveMessage = function(opts, cb) {
        return cb(true);
      };
      reader.on('error', function(err) {
        expect(err).to.exist;
        done();
      });
      reader.receiveMessages();
    });

    it('should emit messages found', function(done) {
      reader.sqs.receiveMessage = function(opts, cb) {
        return cb(null, {Messages: [{Body: 1}, {Body: 2}, {Body: 3}]});
      };
      var spy = sinon.spy();
      reader.on('message', spy);
      reader.receiveMessages();
      setTimeout(function() {
        expect(spy.calledThrice).to.be.true;
        done();
      }, 1500);
    });
  });

  describe('Message', function() {
    describe('#ack', function() {
      var reader, config, msg;
      beforeEach(function() {
        config = {
          debug: true,
          parseJSON: true,
          queueUrl: 'link',
          sqs: {}
        };
        reader = new sqsjs.reader(config);
      });
      it('should call sqs.deleteMessage with the proper params', function() {
        msg = {
          Body: '1',
          ReceiptHandle: 'test'
        };
        reader.sqs.deleteMessage = function(opts, cb) {
          expect(opts.QueueUrl).to.equal(reader.queueUrl);
          expect(opts.ReceiptHandle).to.equal(msg.ReceiptHandle);
          return cb();
        };
        var spy = sinon.spy();
        msg = reader.buildMessage(msg);
        msg.ack(spy);
        expect(spy.calledOnce);
      });
    });
  });
});
