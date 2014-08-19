'use strict';

var Wreck   = require('wreck');
var async   = require('async');

var common  = require('./common');


// copy relevant convienient constants
var config        = require('../config');
var API_ENDPOINT  = config.API_ENDPOINT;

exports.sendBitcoins = function sendBitcoins(address, satoshis, fee, callback) {

  var data = {
    to: address,
    amount: satoshis
  };

  common.authRequest('/payment', data, function(err, response) {
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
