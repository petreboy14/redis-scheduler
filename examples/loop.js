var Scheduler = require('redis-scheduler');
var scheduler = new Scheduler();

// Create a key in Redis to expire in 5000 ms and run 'eventTriggered' handler.
var runLoop = function (task, key) {
  scheduler.schedule({ key: key, expire: 5000, handler: task }, function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log('scheduled succesfully!');
    }
  });
};

var loop = function (err, key) {
  console.log('run callback for keyword: ', key);

  // Remove handler
  scheduler.cancel({ key: key }, function (err) {
    if(err) {
      console.log(err);
      return false;
    }
    // and run function for create new key and handler
    runLoop(loop, key);
  });

  // TODO: Here should be your code
};

// bootstrap
runLoop(loop, 'loop');
