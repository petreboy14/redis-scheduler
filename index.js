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
  this.cleanup();

  this.clients.listener.on('ready', function () {
    self.emit('ready', 'listener');
  });
  this.clients.listener.on('connect', function () {
    self.emit('connect', 'listener');
  });
  this.clients.listener.on('drain', function () {
    self.emit('drain', 'listener');
  });
  this.clients.listener.on('idle', function () {
    self.emit('idle', 'listener');
  });
  this.clients.scheduler.on('ready', function () {
    self.emit('ready', 'scheduler');
  });
  this.clients.scheduler.on('connect', function () {
    self.emit('connect', 'scheduler');
  });
  this.clients.scheduler.on('drain', function () {
    self.emit('drain', 'scheduler');
  });
  this.clients.scheduler.on('idle', function () {
    self.emit('idle', 'scheduler');
  });

  this.clients.listener.on('message', function (channel, message) {
    self.handleExpireEvent(message);
  });

  this.clients.listener.subscribe('__keyevent@0__:expired');
};

Scheduler.prototype.schedule = function (key, expire, handler, cb) {
  if (handler) {
    if (!this.handlers.hasOwnProperty(key)) {
      this.handlers[key] = [];
    }
    this.handlers[key].push(handler);
  }

  if (expire) {
    this.clients.scheduler.set(key, '', 'PX', expire, cb);
  }
};

Scheduler.prototype.reschedule = function (key, expire, cb) {
  this.schedule(key, expire, null, cb);
};

Scheduler.prototype.addHandler = function (key, handler) {
  this.schedule(key, null, handler);
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
      handler(null, key);
    });
  }
};

Scheduler.prototype.end = function () {
  this.cleanup();
  this.clients.listener.end();
  this.clients.scheduler.end();
};

Scheduler.prototype.cleanup = function () {
  this.clients.listener.removeAllListeners();
  this.clients.scheduler.removeAllListeners();

  this.clients.listener.unsubscribe('__keyevent@0__:expired');
  this.handlers = [];
};

module.exports = Scheduler;
