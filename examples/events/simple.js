var redisScheduler = require('redis-scheduler');

var scheduler = new redisScheduler({ host: 'localhost', port: 6379, db: 2 });

var eventTriggered = function (err, key) {
  console.log('run callback for keyword: ', key);
  scheduler.end(); // delete all handlers and close connection to Redis
  // Here should be your code
};

// we create key 'keyword' in Redis, with period of expire equal 3000 ms and create handler with callback 'eventTriggered'
scheduler.schedule({ key: 'keyword', expire: 3000, handler: eventTriggered }, function (err) {
  console.log(err || 'add keyword');
});
// After 3 second, when 'keyword' will remove from Redis, will be call 'eventTriggered' callback