'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var sqsjs = require('../index.js');

describe('sqs.js', function() {
  describe('#constructor', function() {
    var config = {};
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
  });

  describe('#poll', function() {
    var config, reader;
    beforeEach(function() {
      config = {
        region: 'region',
        accessKeyId: 'id',
        secretAccessKey: 'secret',
        queueUrl: 'localhost'
      };
      reader = new sqsjs.reader(config);
    });

    afterEach(function() {
      clearInterval(reader.interval);
    });

    it('should emit error if sqs receiveMessage sends error', function(done) {
      var stub = sinon.stub(reader.sqs, 'receiveMessage', function(opts, cb) {
        return cb(true);
      });
      reader.on('error', function(err) {
        expect(err).to.exist;
        expect(stub.calledOnce).to.be.true;
        done();
      });
    });

    it('should emit messages found');
  });
});
