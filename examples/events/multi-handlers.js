var redisScheduler = require('redis-scheduler');

var scheduler = new redisScheduler({ host: 'localhost', port: 6379, db: 2 });

var eventTriggered = function (err, key) {
  console.log('run callback for keyword: ', key);
  scheduler.end(); // delete all handlers and close connection to Redis
  // Here should be your code
};

// we add handler for 'test-key'
scheduler.addHandler({
  key: 'test-key',
  handler: function () {
    console.log('run another callback');
  }
});
// we create key 'test-key' with period of expire equal 5000 ms and create handler with callback 'eventTriggered'
scheduler.schedule({ key: 'test-key', expire: 5000, handler: eventTriggered }, function (err) {
  console.log(err || 'add test-key');
});
// After 5 second, when 'test-key' will remove from Redis, will be call both callbacks