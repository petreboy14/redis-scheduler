redis-scheduler
===============

Use redis keyspace notifications to trigger timed events. Multiple handlers can be set up per events and events can be rescheduled and cancelled. 

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
* options - Can be object or null. If null defaults to host: 'localhost' and port: 6579.
  * host - Redis connection host.
  * port - Redis connection port.

### Scheduling event

Add a timed event.

```
var expirationTime = 1000;

function eventTriggered(key) {
  console.log(key + ' triggered');
}

scheduler.schedule('test-key', expirationTime, eventTriggered, function (err) {
  // Schedule set
});
```

**#schedule(key, expiration, triggerFn, cb)**
* key - The key of event to store.
* expiration - Date/number of milliseconds until expiration.
* triggerFn - Function to call when scheduled time occurs.
* cb - Function to call after schedule set.

### Adding event handler

You can add multiple handlers per event.

```
scheduler.addHandler('test-key', function () {
  console.log('another event');
});
```

**#addHandler(key, fn)**
* key - The event key to add the handler for.
* fn - The extra handler to add when the event is triggered.

###Rescheduling an Event###

Reschedules a scheduled event. Will take either a new date to trigger or explicit milliseconds. 

```
scheduler.reschedule('test-key', 3000, function () {
  console.log('rescheduled');
});
```

**#reschedule(key, expiration, cb)**
* key - Event to reschedule.
* expiration - Milliseconds/date to reset expiration to.
* cb - Function to call after rescheduling is complete.

###Cancel scheduled item###

Cancels a scheduled event and cleans up handlers

```
scheduler.cancel('test-key');
```

**#cancel(key)**
* key - Key to remove event for

###Close scheduler###

Disconnects and closes all connections to redis and cleans up all existing event handlers

***#end()***

## Testing

Clone the repo and run from the project root:

```
$ npm install
$ npm test
```
