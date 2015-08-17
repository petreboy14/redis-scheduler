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

// Add a handler for 'multi-handlers'
scheduler.addHandler({
  key: 'multi-handlers',
  handler: function () {
    console.log('run another callback');
  }
});

// Create key 'reschedule' in Redis to expire in 4000 ms and run 'eventTriggered' handler.
scheduler.schedule({ key: 'multi-handlers', expire: 4000, handler: eventTriggered }, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log('scheduled successfully!');
  }
});
