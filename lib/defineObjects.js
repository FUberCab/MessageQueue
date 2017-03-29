#!/usr/bin/env node --harmony

'use strict';

exports.message = function() {
  this['message-timestamp'] = '';
  this['message-data'] = '';
  this.vehicle = {
    'vehicle-no': ''
  };
  this.device = {
    'device-id': ''
  };
};

