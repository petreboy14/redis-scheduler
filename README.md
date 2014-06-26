redis-scheduler
===============

Use redis keyspace notifications to trigger timed events.

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
* options - Can be object or null. If null defaults to host: 'localhost' and port: 6579
  * host - Redis connection host
  * port - Redis connection port

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
* key - The key (or name) of event to store
* expiration - Number of milliseconds until expiration
* triggerFn - Function to call when scheduled time occurs
* cb - Function to call after schedule set

## Testing

Clone the repo and run from the project root:

```
$ npm install
$ npm test
```
