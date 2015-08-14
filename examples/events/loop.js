var redisScheduler = require('redis-scheduler');

var scheduler = new redisScheduler({ host: 'localhost', port: 6379, db: 2 });

// we create key 'loop' in Redis, with period of expire equal 5000 ms and create handler with callback 'loop'
var runLoop = function (task, key) {
  scheduler.schedule({ key: key, expire: 5000, handler: task }, function (err) {
    console.log(err || 'add loop');
  });
};
// After 5 second, when 'loop' will remove from Redis, will be call 'loop' callback


var loop = function (err, key) {
  console.log('run callback for keyword: ', key);
  // we remove handler
  scheduler.cancel(
    { key: key },
    function (err) {
      if(err) {
        console.log(err);
        return false;
      }
      // and run function for create new key and handler
      runLoop(loop, key);
    }
  );
  // Here should be your code
};

// run loop
runLoop(loop, 'loop');
