'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var should = require('should');
var redis = require('redis');
var sinon = require('sinon');

var describe = lab.experiment;
var it = lab.test;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;

var Scheduler = require('../index');

var redisClientStub = {
  on: function () {},
  auth: function () {},
  select: function () {},
  removeAllListeners: function () {},
  subscribe: function () {},
  unsubscribe: function () {},
  end: function () {}
};

describe('Scheduler tests', function () {
  var sandbox;

  beforeEach(function (done) {
    sandbox = sinon.sandbox.create();
    done();
  });

  afterEach(function (done) {
    sandbox.restore();
    done();
  });

  it('should be a valid constructor', function (done) {
    should.exist(Scheduler);
    Scheduler.should.be.an.instanceOf(Function);
    done();
  });

  it('should be able to create a scheduler with no settings', function (done) {
    var scheduler = new Scheduler();
    should.exist(scheduler.clients);
    should.exist(scheduler.clients.listener);
    should.exist(scheduler.clients.scheduler);
    scheduler.end();
    done();
  });

  it('should be able to create a scheduler with a host and port', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    should.exist(scheduler.clients);
    should.exist(scheduler.clients.listener);
    should.exist(scheduler.clients.scheduler);
    scheduler.end();
    done();
  });

  it('should be able to create a scheduler with a path', function (done) {
    var scheduler = new Scheduler({ path: '/var/run/redis.pid'});
    should.exist(scheduler.clients);
    should.exist(scheduler.clients.listener);
    should.exist(scheduler.clients.scheduler);
    scheduler.end();
    done();
  });

  it('should be able to create a scheduler with a password', function (done) {
    sandbox.spy(redisClientStub, 'auth');
    sandbox.stub(redis, 'createClient').returns(redisClientStub);
    var scheduler = new Scheduler({ host: 'localhost', port: 6379, password: 'secret'});
    redisClientStub.auth.calledTwice.should.be.true();
    redisClientStub.auth.alwaysCalledWith('secret').should.be.true();
    scheduler.end();
    done();
  });

  it('should be able to create a scheduler with a db', function (done) {
    sandbox.spy(redisClientStub, 'select');
    sandbox.stub(redis, 'createClient').returns(redisClientStub);
    var scheduler = new Scheduler({ host: 'localhost', port: 6379, db: 2});
    scheduler.db.should.be.equal(2);
    redisClientStub.select.calledTwice.should.be.true();
    redisClientStub.select.alwaysCalledWith(2).should.be.true();
    scheduler.end();
    done();
  });

  it('should be able to create a scheduler with a redisOptions', function (done) {
    sandbox.spy(redis, 'createClient');
    var redisOptions = { detect_buffers: true};
    var scheduler = new Scheduler({ host: 'localhost', port: 6379, redisOptions: redisOptions});
    redis.createClient.alwaysCalledWith(6379, 'localhost', redisOptions).should.be.true();
    scheduler.end();
    done();
  });

  it('should be able to schedule an event and receive notification of it', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    scheduler.schedule({ key: 'test-job', expire: 1000, handler: function (err, message) {
      should.not.exist(err);
      message.should.equal('test-job');
      scheduler.end();
      done();
    }});
  });

  it('should be able to schedule an event with a date receive notification of it', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    var d = new Date();
    d.setSeconds(d.getSeconds() + 1);
    scheduler.schedule({ key: 'test-job', expire: d, handler: function (err, message) {
      should.not.exist(err);
      message.should.equal('test-job');
      scheduler.end();
      done();
    }});
  });

  it('should be able to handle a reschedule of an event', function (done) {
    var client = redis.createClient();
    var timeout = setTimeout(function () {
      throw new Error('shouldnt be here');
    }, 1200);
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    scheduler.schedule({ key: 'test-job', expire: 1000, handler: function (err, message) {
      clearTimeout(timeout);
      should.not.exist(err);
      message.should.equal('test-job');
      scheduler.end();
      client.del('test-job');
      done();
    }});
    scheduler.reschedule({ key: 'test-job', expire: 500 });
  });

  it('should be able to cancel an event', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    scheduler.schedule({ key: 'test-job', expire: 1000, handler: function () {
      throw new Error('shouldnt be here');
    }});
    scheduler.cancel({ key: 'test-job' }, function (err) {
      should.not.exist(err);
      setTimeout(function () {
        done();
      }, 1500);
    });
  });

  it('should be able to add on multiple listeners to a job', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    var handler1 = false;
    var handler2 = false;
    scheduler.schedule({ key: 'test-job', expire: 1000, handler: function (err, message) {
      should.not.exist(err);
      message.should.equal('test-job');
      handler1 = true;
    }});
    scheduler.addHandler({ key: 'test-job', handler: function (err, message) {
      should.not.exist(err);
      message.should.equal('test-job');
      handler2 = true;
    }});
    setTimeout(function () {
      handler1.should.equal(true);
      handler2.should.equal(true);
      done();
    }, 1500);
  });

  it('should be able to end a connection', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    scheduler.end();
    done();
  });

  it('should be able to register a handler for a pattern and receive all events for it', function (done) {
    var scheduler = new Scheduler();
    var test1 = false;
    var test2 = false;
    scheduler.addHandler({ key: 'test-*', pattern: true, handler: function (err, message) {
      should.not.exist(err);
      if (message === 'test-1') {
        test1 = true;
      } else if (message === 'test-2') {
        test2 = true;
      }
    }});
    scheduler.schedule({ key: 'test-1', expire: 500 });
    scheduler.schedule({ key: 'test-2', expire: 500 });
    setTimeout(function () {
      test1.should.equal(true);
      test2.should.equal(true);
      scheduler.end();
      done();
    }, 1500);
  });

  it('pattern matching handlers should only report events that match a pattern', function (done) {
    var scheduler = new Scheduler();
    var test1 = false;
    var test2 = false;
    scheduler.addHandler({ key: 'test-*', pattern: true, handler: function (err, message) {
      should.not.exist(err);
      if (message === 'test-1') {
        test1 = true;
      }
    }});
    scheduler.addHandler({ key: 'foo-*', pattern: true, handler: function (err, message) {
      should.not.exist(err);
      if (message === 'test-1') {
        test2 = true;
      }
    }});
    scheduler.schedule({ key: 'test-1', expire: 500 });
    scheduler.schedule({ key: 'test-2', expire: 500 });
    setTimeout(function () {
      test1.should.equal(true);
      test2.should.equal(false);
      scheduler.end();
      done();
    }, 1500);
  });

  it('should be able to add multiple handlers to a pattern', function (done) {
    var scheduler = new Scheduler();
    var test1 = false;
    var test2 = false;
    scheduler.addHandler({ key: 'test-*', pattern: true, handler: function (err, message) {
      should.not.exist(err);
      if (message === 'test-1') {
        test1 = true;
      }
    }});
    scheduler.addHandler({ key: 'test-*', pattern: true, handler: function (err, message) {
      should.not.exist(err);
      if (message === 'test-2') {
        test2 = true;
      }
    }});
    scheduler.schedule({ key: 'test-1', expire: 500 });
    scheduler.schedule({ key: 'test-2', expire: 500 });
    setTimeout(function () {
      test1.should.equal(true);
      test2.should.equal(true);
      scheduler.end();
      done();
    }, 1500);
  });

  it('should receive a validation error on bad schedule options', function (done) {
    var scheduler = new Scheduler();
    scheduler.schedule({}, function (err) {
      should.exist(err);
      done();
    });
  });

  it('should receive a validation error on bad reschedule options', function (done) {
    var scheduler = new Scheduler();
    scheduler.reschedule({}, function (err) {
      should.exist(err);
      done();
    });
  });

  it('should receive a validation error on bad addHandler options', function (done) {
    var scheduler = new Scheduler();
    try {
      scheduler.addHandler({});
    } catch (err) {
      should.exist(err);
      done();
    }
  });

  it('should receive a validation error on bad addHandler options', function (done) {
    var scheduler = new Scheduler();
    scheduler.cancel({}, function (err) {
      should.exist(err);
      done();
    });
  });
});
