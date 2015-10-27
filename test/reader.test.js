'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var sqsjs = require('../index.js');

describe('reader', function() {

  describe('#constructor', function() {
    var config = {};

    it('should throw if region is not provided', function() {
      expect(function () {new sqsjs.reader(config);}).to.throw(/region required/);
    });

    it('should throw if accessKeyId is not provided', function() {
      config.region = 'region';
      expect(function () {new sqsjs.reader(config);}).to.throw(/accessKeyId required/);
    });

    it('should throw if secretAccessKey is not provided', function() {
      config.region = 'region';
      config.accessKeyId = 'id';
      expect(function () {new sqsjs.reader(config);}).to.throw(/secretAccessKey required/);
    });

    it('should throw if queueUrl is not provided', function() {
      config.region = 'region';
      config.accessKeyId = 'id';
      config.secretAccessKey = 'secret';
      expect(function () {new sqsjs.reader(config);}).to.throw(/queueUrl required/);
    });

    it('should not return null', function() {
      config.region = 'region';
      config.accessKeyId = 'id';
      config.secretAccessKey = 'secret';
      config.queueUrl = 'link';
      var reader = new sqsjs.reader(config);
      expect(reader).to.exist;
    });

    it('should accept an sqs object as alternative to AWS info', function () {
      config.region = 'region';
      config.accessKeyId = 'id';
      config.secretAccessKey = 'secret';
      config.queueUrl = 'link';
      config.sqs = {};
      var reader = new sqsjs.reader(config);
      expect(reader).to.exist;
    });
  });

  describe('#buildMessage', function() {
    var reader, config, msg;

    before(function() {
      config = {
        parseJSON: true,
        queueUrl: 'link',
        sqs: {},
        visibility: 1
      };
      msg = {
        Body: '{}'
      };
      reader = new sqsjs.reader(config);
      msg = reader.buildMessage(msg);
    });

    it('should parse JSON if flag is set', function() {
      expect(msg.Body).to.be.an('object');
    });

    it('should fail silently if JSON is not valid', function() {
      expect(msg.Body).to.be.an('object');
    });

    it('should create a copy of Body into body', function() {
      expect(msg.body).to.equal(msg.Body);
    });

    it('should add a method called ack', function() {
      expect(msg.ack).to.be.a('function');
    });

    it('should add a method called extendTimeout', function() {
      expect(msg.extendTimeout).to.be.a('function');
    });

    it('should set a timeout if visibility is set', function() {
      expect(msg.expirationTimeout).to.exist;
    });

    it('should emit "expiring" when a message is to be expired', function(done) {
      reader.on('expiring', function(msg) {
        expect(msg).to.exist;
        done();
      });

      msg = reader.buildMessage(msg);
    });
  });

  describe('#receiveMessages', function() {
    var config, reader;

    before(function() {
      config = {
        sqs: {},
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
      before(function() {
        config = {
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

    describe('#extendTimeout', function() {
      var reader, config, msg;

      before(function() {
        config = {
          queueUrl: 'link',
          sqs: {}
        };
        reader = new sqsjs.reader(config);
        msg = {
          Body: '1',
          ReceiptHandle: 'test'
        };
      });

      it('should call sqs.changeMessageVisibility with the proper params', function() {
        var amount = 5;
        reader.sqs.changeMessageVisibility = function(opts, cb) {
          expect(opts.QueueUrl).to.equal(reader.queueUrl);
          expect(opts.ReceiptHandle).to.equal(msg.ReceiptHandle);
          expect(opts.VisibilityTimeout).to.equal(amount);
          return cb();
        };
        var spy = sinon.spy();
        msg = reader.buildMessage(msg);
        msg.extendTimeout(amount, spy);
        expect(spy.calledOnce);
      });

      it('should update expirationTimeout to the new VT', function(done) {
        reader.on('expiring', function(msg) {
          expect(msg).to.exist;
          done();
        });

        var amount = 1;
        reader.sqs.changeMessageVisibility = function(opts, cb) {
          expect(opts.QueueUrl).to.equal(reader.queueUrl);
          expect(opts.ReceiptHandle).to.equal(msg.ReceiptHandle);
          expect(opts.VisibilityTimeout).to.equal(amount);
          return cb();
        };

        var spy = sinon.spy();
        msg = reader.buildMessage(msg);
        msg.extendTimeout(amount, spy);
        expect(spy.calledOnce);
      });
    });
  });
});
