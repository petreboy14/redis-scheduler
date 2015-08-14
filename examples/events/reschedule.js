var redisScheduler = require('redis-scheduler');

var scheduler = new redisScheduler({ host: 'localhost', port: 6379, db: 2 });

var eventTriggered = function (err, key) {
  console.log('run callback for keyword: ', key);
  scheduler.end(); // delete all handlers and close connection to Redis
  // Here should be your code
};

// we create key 'reschedule' with period of expire equal 3000 ms and create handler with callback 'eventTriggered'
scheduler.schedule({ key: 'reschedule', expire: 3000, handler: eventTriggered }, function (err) {
  console.log(err || 'add keyword after 3000 ms');
});
// we change period of expire to 5000 ms
scheduler.reschedule({ key: 'reschedule', expire: 5000 }, function () {
  console.log('reschedule to 5000 ms');
});
// After 5 second, when 'reschedule' will remove from Redis, will be call 'eventTriggered' callback