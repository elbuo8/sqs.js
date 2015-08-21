# sqs.js
[![Build Status](https://travis-ci.org/elbuo8/sqs.js.svg)](https://travis-ci.org/elbuo8/sqs.js)

Yet Another SQS Client for Nodejs.

## Features

* Message Acknowledgement
* Event Interface
* Configurable Polling Interval
* Async Message Delivery

## Installation

```bash
npm install sqs.js --save
```

## Example

```js
var sqs = require('sqs.js');

var reader = sqs.reader({
  accessKeyId: 'somekey',
  secretAccessKey: 'secretKey',
  region: 'us-east-1',
  queueUrl: 'someQueueUrl',
  startPolling: true
});

reader.on('error', function(err) {
  console.error(err);
});

reader.on('message', function(msg) {
  console.log(Received %s, msg.Body);
  msg.ack();
});

var writer = sqs.writer({
  accessKeyId: 'somekey',
  secretAccessKey: 'secretKey',
  region: 'us-east-1',
  queueUrl: 'someQueueUrl'
});

writer.publish({MessageBody: '{"id": 1}'});

```

## API

### `sqs.reader(config)`

Required fields:
* `accessKeyId` AWS AccessKeyId credential
* `secretAccessKey` AWS secretAccessKey credential
* `region` AWS region
* `queueUrl` AWS SQS URL

Optional fields:
* `version` apiVersion (latest)
* `visibility` VisibilityTimeout
* `pollInterval` How often SQS is polled (1000)
* `pollingSize` How many messages should each request receive (10)
* `startPolling` Automatically start polling

Emits the following events:
* `message` (msg) received message
* `error` (err) error received by polling AWS

### `reader.receiveMessage()`

Fetches messages from the queue.

### `reader.poll()`

Calls `.receiveMessages()` continuously.

### `reader.close()`

Stops polling messages.

### `msg.ack([fn])`

Messages default properties are described [here](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#receiveMessage-property).

Messages which shouldn't be delivered anymore should be removed from SQS. Invoke #ack to delete the message. An optional callback can be provided which receives `(err, data)` as parameters.

### `sqs.writer(config)`

Required fields:
* `accessKeyId` AWS accessKeyId credential
* `secretAccessKey` AWS secretAccessKey credential
* `region` AWS region
* `queueUrl` AWS SQS URL
* `flushSize` Internal queue size (defaults to 10)
* `flushInterval` How often the internal queue is purged (defaults to 10s)

Emits the following events:
* `error` (err) error received by submitting to AWS

### `writer.publish(msg, [fn])`

Required fields in msg:
* `MessageBody` (String)

Optional parameter:
* `fn` will be called with `(err, data)`

### `writer.publishBatch(msgs, [fn])`

* `msgs` is an array of messages (can't bigger than 10)

Required fields in msg:
* `MessageBody` (String)

Optional parameter:
* `fn` will be called with `(err, data)`

### `writer.emit('enqueue', msg)`

Async Delivery method. Every 10th emit, `publishBatch` will be invoked with the first 10 messages stored.

Required fields in msg:
* `MessageBody` (String)

## TODO

- [ ] Make publish interface simpler (less AWSish)
- [ ] Return callbacks and Promises

## License

MIT
