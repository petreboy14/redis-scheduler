var Scheduler = require('redis-scheduler');
var scheduler = new Scheduler();

var eventTriggered = function (err, key) {
  if (err) {
    console.error(err);
  } else {
    console.log('run callback for keyword: ', key);

    // TODO: Here should be your code

    // Delete all handlers and close connection to Redis
    scheduler.end(); 
  }
};

// Create key 'keyword' in Redis to expire in 3000 ms and run 'eventTriggered' handler.
scheduler.schedule({ key: 'keyword', expire: 3000, handler: eventTriggered }, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log('scheduled successfully!');
  }
});

