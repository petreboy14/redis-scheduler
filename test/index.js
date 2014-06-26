var Lab = require('lab');
var should = require('should');
var redis = require('redis');

var describe = Lab.experiment;
var it = Lab.test;

var Scheduler = require('../index');

describe('Scheduler tests', function () {
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

  it('should be able to schedule an event and receive notification of it', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    scheduler.schedule('test-job', 1000, function (err, message) {
      should.not.exist(err);
      message.should.equal('test-job');
      scheduler.end();
      done();
    });
  });

  it('should be able to schedule an event with a date receive notification of it', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    var d = new Date();
    d.setSeconds(d.getSeconds() + 1);
    scheduler.schedule('test-job', d, function (err, message) {
      should.not.exist(err);
      message.should.equal('test-job');
      scheduler.end();
      done();
    });
  });

  it('should be able to handle a reschedule of an event', function (done) {
    var client = redis.createClient();
    var timeout = setTimeout(function () {
      throw new Error('shouldnt be here');
    }, 1200);
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    scheduler.schedule('test-job', 1000, function (err, message) {
      clearTimeout(timeout);
      should.not.exist(err);
      message.should.equal('test-job');
      scheduler.end();
      client.del('test-job');
      done();
    });
    scheduler.reschedule('test-job', 500);
  });

  it('should be able to cancel an event', function (done) {
    var scheduler = new Scheduler({ host: 'localhost', port: 6379});
    scheduler.schedule('test-job', 1000, function () {
      throw new Error('shouldnt be here');
    });
    scheduler.cancel('test-job', function (err) {
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
    scheduler.schedule('test-job', 1000, function (err, message) {
      should.not.exist(err);
      message.should.equal('test-job');
      handler1 = true;
    });
    scheduler.addHandler('test-job', function (err, message) {
      should.not.exist(err);
      message.should.equal('test-job');
      handler2 = true;
    });
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
});
