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

// Create key 'reschedule' in Redis to expire in 3000 ms and run 'eventTriggered' handler.
scheduler.schedule({ key: 'reschedule', expire: 3000, handler: eventTriggered }, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log('the task is scheduled to be run in 3000 ms');
  }
});

// Change expire time to 5000 ms
scheduler.reschedule({ key: 'reschedule', expire: 5000 }, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log('the task is rescheduled to be run in 5000 ms');
  }
});

