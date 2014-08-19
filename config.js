'use strict';

var _ = require('lodash');


exports.NAME = 'Blockchain';
exports.SUPPORTED_MODULES = ['wallet'];

exports.SUPPORTED_CURRENCIES = [];

exports.API_ENDPOINT = 'https://blockchain.info/merchant/';


exports.SATOSHI_FACTOR = 1e8;
exports.FUDGE_FACTOR = NaN;

exports.config = function config(config) {
  if (config) _.merge(exports, config, true);
};

exports.supports = function supports(moduleName) {
  return exports.SUPPORTED_MODULES.indexOf(moduleName) !== -1;
};
