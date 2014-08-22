'use strict';

var querystring = require('querystring');
var Wreck       = require('wreck');
var async       = require('async');
var _           = require('lodash');


exports.NAME = 'Blockchain';
exports.SUPPORTED_MODULES = ['wallet'];
var API_ENDPOINT    = 'https://blockchain.info/merchant/';

var SATOSHI_FACTOR  = 1e8;

var pluginConfig = {};

exports.config = function config(localConfig) {
  if (localConfig) _.merge(pluginConfig, localConfig);
};


function authRequest(path, data, callback) {
  if (!pluginConfig.guid || !pluginConfig.fromAddress || !pluginConfig.password)
    return callback(new Error('Must provide guid, password and source address to make this API request'));

  data = data || {};

  _.merge(data, {
    password: pluginConfig.password
  });

  var options = {
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; Lamassu ' + exports.NAME + ' node.js client)',
      'Content-Type': 'application/json'
    },
    json: true
  };

  var uri = API_ENDPOINT + pluginConfig.guid + path + '?' + querystring.stringify(data);

  Wreck.post(uri, options, function(err, res, payload) {
    callback(err, payload);
  });
};


exports.sendBitcoins = function sendBitcoins(address, satoshis, fee, callback) {
  var data = {
    to: address,
    amount: satoshis,
    from: pluginConfig.fromAddress
  };

  if (fee !== null)
    data.fee = fee;

  authRequest('/payment', data, function(err, response) {
    if (err) return callback(err);

    if (response.error) {
      var insufficientFundsRegex = /(^Insufficient Funds Available)|(^No free outputs to spend)/;
      if (response.error.match(insufficientFundsRegex)) {
        var e = new Error('Insufficient funds');
        e.name = 'InsufficientFunds';
        return callback(e);
      }

      return callback(new Error(response.error));
    }

    callback(null, response.tx_hash);
  });
};


function checkBalance(minConfirmations, callback) {
  var data = {
    address: pluginConfig.fromAddress
  };

  if(minConfirmations > 0) {
    data.confirmations = minConfirmations;
  }

  authRequest('/address_balance', data, callback);
};

exports.balance = function balance(callback) {

  async.parallel([
    function(cb) { checkBalance(0, cb); },
    function(cb) { checkBalance(1, cb); }

  ], function(err, results) {
    if (err) return callback(err);

    if (results.error)
      return callback(new Error(results.error));

    var unconfirmedDeposits = results[0].total_received - results[1].total_received;
    callback(null, {
      BTC: Math.round(parseFloat(results[0].balance - unconfirmedDeposits))
    });
  });
};
