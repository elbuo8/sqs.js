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
    var writer, config;
    beforeEach(function() {
      config = {
        sqs: {
          sendMessage: function(opts, cb) {
            return (new Error('error'));
          }
        },
        queueUrl: 'link'
      };
      writer = new sqsjs.writer(config);
    });

    it('should call sqs.sendMessage once', function() {
      var spy = sinon.spy(writer.sqs.sendMessage);
      writer.publish({}, function(err) {
        expect(err).to.exist;
        expect(spy.calledOnce);
      });
    });
    it('should emit an error if AWS failed', function() {
      writer.on('error', function(err) {
        expect(err).to.exist;
      });
      writer.publish({});
    });
    it('should return a callback with an error if AWS failed', function() {
      writer.publish({}, function(err) {
        expect(err).to.exist;
      });
    });
  });
});
