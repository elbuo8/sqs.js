# sqs.js

Yet Another SQS Client for Nodejs.

## Features

* Message Acknowledgement
* Event Interface
* Configurable Polling Interval

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
  queueUrl: 'someQueueUrl'
});

reader.on('error', function(err) {
  console.error(err);
});

reader.on('message', function(msg) {
  console.log(Received %s, msg.Body);
  msg.ack();
});

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

Emits the following events:
* `message` (msg) received message
* `error` (err) error received by polling AWS

### `msg.ack([fn])`

Messages default properties are described [here](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html#receiveMessage-property).

Messages which shouldn't be delivered anymore should be removed from SQS. Invoke #ack to delete the message. An optional callback can be provided which receives `(err, data)` as parameters.


## TODO

- [ ] Writer interface

## License

MIT
