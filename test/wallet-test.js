'use strict';

var http = require('http');
var assert = require('chai').assert;
var hock = require('hock');
var blockchain = require('../');
var mock = hock();

var GUID = 'f5b55aa8-480e-43c7-a626-3dd500fa7856';
var ADDRESS = '1La3Ekh2VVeXw3iDC8XhYKA7DwgQSiTQk8';
var PASSWORD = 'pass';

describe('blockchain/wallet', function () {
  var wallet;

  before(function (done) {
    var mockServer = http.createServer(mock.handler);
    mockServer.listen(function () {
      wallet = new blockchain.wallet({
        host: 'localhost',
        port: mockServer.address().port,
        protocol: 'http',
        guid: GUID,
        password: PASSWORD,
        fromAddress: ADDRESS
      });
      done();
    });
  });

  it('should check balance', function (done) {
    mock
      .get('/merchant/' + GUID + '/address_balance?address=' + ADDRESS + '&confirmations=0&password=' + PASSWORD)
      .reply(200, {
        total_received: 3.5,
        balance: 4
      })
      .get('/merchant/' + GUID + '/address_balance?address=' + ADDRESS + '&confirmations=1&password=' + PASSWORD)
      .reply(200, {
        total_received: 2.5,
        balance: 4
      });

    wallet.balance(function (err, balance) {
      assert.ok(!err);
      assert.equal(balance, 3);
      done();
    });
  });
});
