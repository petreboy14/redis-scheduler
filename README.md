redis-scheduler
===============

Use redis keyspace notifications to trigger timed events inspired by [http://blog.codezuki.com/blog/2013/07/07/redis-queue](http://blog.codezuki.com/blog/2013/07/07/redis-queue). 

## Features
* Listen for expiring events by registering handlers to simple redis keys.
* Multiple handlers can be set per key.
* Events can be rescheduled or cancelled with automatic handler cleanup.
* Can listen for patterns with one or many handlers using regular expressions.

## Requirements
* Redis 2.8.0 or higher.
* Enabling keyspace notification by either setting `notify-keyspace-events Ex` in redis configuration file.

## Installation

```
$ npm install redis-scheduler
```

## Usage

### Initialization

Create a new scheduler instance

```
var Scheduler = require('redis-scheduler');
var scheduler = new Scheduler({ host: 'localhost', port: 6379 });
```

**#new Scheduler(options)**
* options - Can be object or null. If null defaults to host: 'localhost', port: 6579 and db: 0
  * host (string) - Redis connection host.
  * port (number) - Redis connection port.
  * db (number) - Redis zero-based numeric database index
  * path (string) - Redis pid file
  * password (string) - Redis password
  * redisOptions (object) - Redis options

### Scheduling event

Add a timed event.

```
var expirationTime = 1000;

function eventTriggered(err, key) {
  console.log(key + ' triggered');
}

scheduler.schedule({ key: 'test-key', expire: expirationTime, handler: eventTriggered }, function (err) {
  // Schedule set
});
```

**#schedule(options, cb)**
* options
  * key (string) - The key of event to store.
  * expire (date/number) - Date/number of milliseconds until expiration.
  * handler (function) - Function to call when scheduled time occurs.
* cb - Function to call after schedule set.

### Adding event handler

You can add multiple handlers per event.

```
scheduler.addHandler({ key: 'test-key', handler: function () {
  console.log('another event');
}});
```

**#addHandler(options, fn)**
* options
  * key (string) - The event key to add the handler for (can be simple string or regex string in case of patterns).
  * handler (function) - The extra handler to add when the event is triggered.
  * pattern (boolean) - Designates whether key is a regular expression. 

###Rescheduling an Event###

Reschedules a scheduled event. Will take either a new date to trigger or explicit milliseconds. 

```
scheduler.reschedule({ key: 'test-key', expire: 3000 }, function () {
  console.log('rescheduled');
});
```

**#reschedule(options, cb)**
* options
  * key (string) - Event to reschedule.
  * expire (number) - Milliseconds/date to reset expiration to.
* cb (function) - Function to call after rescheduling is complete.

###Cancel scheduled item###

Cancels a scheduled event and cleans up handlers

```
scheduler.cancel({ key: 'test-key' }, function () {
  console.log('canceled');
});
```

**#cancel(options)**
* options
  * key (string) - Key to remove event for. If a regular expression will cancel all pattern matching handlers.

###A event pattern matching
###Close scheduler###

Disconnects and closes all connections to redis and cleans up all existing event handlers

***#end()***

## Testing

Clone the repo and run from the project root:

```
$ npm install
$ npm test
```

## Examples

```
$ cd examples/events
$ npm install
$ node simple.js
$ node multi-handlers.js
$ node loop.js
$ node reschedule.js
```
