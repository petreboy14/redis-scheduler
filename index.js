var events = require('events');
var redis = require('redis');
var util = require('util');

var Scheduler = function (options) {
  options = options || {};
  var host = options.host || 'localhost';
  var port = options.port || 6379;

  this.clients = {
    scheduler: redis.createClient(port, host),
    listener: redis.createClient(port, host)
  };
  this.handlers = {};
  this.setRedisEvents();

  events.EventEmitter.call(this);
};

util.inherits(Scheduler, events.EventEmitter);

Scheduler.prototype.setRedisEvents = function () {
  var self = this;
  this.clients.listener.removeAllListeners();
  this.clients.scheduler.removeAllListeners();

  this.clients.listener.on('ready', function () {
    self.emit('ready', 'listener');
  });
  this.clients.listener.on('connect', function () {
    self.emit('connect', 'listener');
  });
  this.clients.listener.on('error', function (err) {
    console.log(err);
    self.emit('error', err, 'listener');
  });
  this.clients.listener.on('end', function () {
    console.log('end');
    self.emit('end', 'listener');
  });
  this.clients.listener.on('drain', function () {
    console.log('drain');
    self.emit('drain', 'listener');
  });
  this.clients.listener.on('idle', function () {
    self.emit('idle', 'listener');
  });

  this.clients.listener.on('message', function (channel, message) {
    if (channel === '__keyevent@0__:expired') {
      self.handleExpireEvent(message);
    }
  });

  this.clients.listener.subscribe('__keyevent@0__:expired');
};

Scheduler.prototype.schedule = function (key, expire, handler, cb) {
  if (handler && !this.handlers.hasOwnProperty(key)) {
    this.handlers[key] = [];
  }
  this.handlers[key].push(handler);

  this.clients.scheduler.set(key, '', 'PX', expire, cb);
};

Scheduler.prototype.reschedule = function (key, expire, cb) {
  this.schedule(key, expire, null, cb);
};

Scheduler.prototype.cancel = function (key, cb) {
  var self = this;
  this.clients.scheduler.del(key, function (err) {
    delete(self.handlers[key]);
    cb(err);
  });
};

Scheduler.prototype.handleExpireEvent = function (key) {
  if (this.handlers.hasOwnProperty(key)) {
    this.handlers[key].forEach(function (handler) {
      handler(key);
    });
  }
};

module.exports = Scheduler;
