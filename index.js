var events = require('events');
var Joi = require('joi');
var redis = require('redis');
var util = require('util');

var functionValidations = {
  constructor: Joi.object({
    host: Joi.string().default('localhost'),
    port: Joi.number().integer().default(6379),
    db: Joi.number().integer().default(0),
    password: Joi.string().optional(),
    path: Joi.string().optional()
  }).default({
    host: 'localhost',
    port: 6379,
    db: 0
  }),
  schedule: Joi.object({
    key: Joi.string().required(),
    handler: Joi.func().optional(),
    expire: Joi.date().optional(),
    pattern: Joi.boolean().default(false)
  }),
  reschedule: Joi.object({
    key: Joi.string().required(),
    expire: Joi.date().required()
  }),
  addHandler: Joi.object({
    key: Joi.string().required(),
    handler: Joi.func().required(),
    pattern: Joi.boolean().default(false)
  }),
  cancel: Joi.object({
    key: Joi.string().required()
  })
};

var createRedisClient = function (options) {
  var redisClient;
  var host = options.host || 'localhost';
  var port = options.port || 6379;
  var path = options.path;
  var redisOptions = options.redisOptions;
  var db = options.db;
  var password = options.password;

  if (path) {
    redisClient = redis.createClient(path, redisOptions);
  } else {
    redisClient = redis.createClient(port, host, redisOptions);
  }
  
  if (password) {
    redisClient.auth(password);
  }

  if (db) {
    redisClient.select(db);
  }

  return redisClient;
};

var Scheduler = function (options) {
  options = options || {};

  this.db = options.db || 0;
  this.clients = {
    scheduler: createRedisClient(options),
    listener: createRedisClient(options)
  };
  this.handlers = {};
  this.patterns = {};
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

  this.clients.listener.subscribe('__keyevent@' + this.db + '__:expired');
};

Scheduler.prototype.schedule = function (options, cb) {
  var validations = functionValidations.schedule.validate(options);
  if (validations.error) {
    cb(validations.error);
  } else {
    if (options.handler) {
      if (options.pattern) {
        if (!this.patterns.hasOwnProperty(options.key)) {
          this.patterns[options.key] = {
            key: new RegExp(options.key),
            handlers: []
          };
        }
        this.patterns[options.key].handlers.push(options.handler);
      } else {
        if (!this.handlers.hasOwnProperty(options.key)) {
          this.handlers[options.key] = [];
        }
        this.handlers[options.key].push(options.handler);
      }
    }

    if (options.expire) {
      var self = this;
      this.clients.scheduler.exists(options.key, function (err, exists) {
        if (exists) {
          self.clients.scheduler.pexpire(options.key, options.expire, cb);
        } else {
          self.clients.scheduler.set(options.key, '', 'PX', self.getMillis(options.expire), cb);
        }
      });
    }
  }
};

Scheduler.prototype.reschedule = function (options, cb) {
  var validations = functionValidations.reschedule.validate(options);
  if (validations.error) {
    cb(validations.error);
  } else {
    this.schedule(options, cb);
  }
};

Scheduler.prototype.addHandler = function (options) {
  var validations = functionValidations.addHandler.validate(options);
  if (validations.error) {
    throw validations.error;
  } else {
    this.schedule(options);
  }
};

Scheduler.prototype.cancel = function (options, cb) {
  var validations = functionValidations.cancel.validate(options);
  if (validations.error) {
    cb(validations.error);
  } else {
    var self = this;
    this.clients.scheduler.del(options.key, function (err) {
      delete(self.handlers[options.key]);
      delete(self.patterns[options.key]);
      cb(err);
    });
  }

};

Scheduler.prototype.handleExpireEvent = function (key) {
  this.checkForPatternMatches(key);
  if (this.handlers.hasOwnProperty(key)) {
    this.handlers[key].forEach(function (handler) {
      handler(null, key);
    });
  }
};

Scheduler.prototype.checkForPatternMatches = function (key) {
  var handlersToSend = [];
  for (var pattern in this.patterns) {
    if (this.patterns[pattern].key.test(key)) {
      handlersToSend = handlersToSend.concat(this.patterns[pattern].handlers);
    }
  }

  handlersToSend.forEach(function (handler) {
    handler(null, key);
  });
};

Scheduler.prototype.end = function () {
  this.cleanup();
  this.clients.listener.end();
  this.clients.scheduler.end();
};

Scheduler.prototype.getMillis = function (expiration) {
  if (expiration instanceof Date) {
    var now = new Date().getTime();
    expiration = expiration.getTime() - now;
  }

  return expiration;
};

Scheduler.prototype.cleanup = function () {
  this.clients.listener.removeAllListeners();
  this.clients.scheduler.removeAllListeners();

  this.clients.listener.unsubscribe('__keyevent@' + this.db + '__:expired');
  this.handlers = [];
};

module.exports = Scheduler;
