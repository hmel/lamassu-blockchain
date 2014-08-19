'use strict';

var querystring = require('querystring');
var Wreck       = require('wreck');
var async       = require('async');
var _           = require('lodash');


// copy relevant convienient constants
var config          = require('../config');
var API_ENDPOINT    = config.API_ENDPOINT;
var NAME            = config.NAME;
var SATOSHI_FACTOR  = config.SATOSHI_FACTOR;


exports.authRequest = function authRequest(path, data, callback) {

  if (!config.guid || !config.fromAddress || !config.password)
    return callback(new Error('Must provide guid, password and source address to make this API request'));

  data = data || {};

  _.merge(data, {
    password: config.password,
    from: config.fromAddress
  });

  var options = {
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; Lamassu ' + NAME + ' node.js client)',
      'Content-Length': data.length
    },
    json: true,
    payload: querystring.stringify(data)
  };

  var uri = API_ENDPOINT + config.guid + path;

  Wreck.post(uri, options, function(err, res, payload) {
    callback(err, payload);
  });
};

function checkBalance(minConfirmations, callback) {
  var data = null;

  if(minConfirmations > 0) {
    data = {
      confirmations:minConfirmations
    };
  }

  authRequest('/address_balance', data, callback);
};


// required by either Wallet or Trader
exports.balance = function balance(callback) {

  async.parallel([
    function(cb) { checkBalance(0, cb); },
    function(cb) { checkBalance(1, cb); }

  ], function(err, results) {
    if (err) return callback(err);

    var unconfirmedDeposits = results[0].total_received - results[1].total_received;
    callback(null, {
      BTC: Math.round(SATOSHI_FACTOR * parseFloat(results[0].balance - unconfirmedDeposits))
    });
  });
};
