#!/usr/bin/env node --harmony

'use strict';

var redis = require('redis');
var tools = require('./tools');
var appVar = require('./appVariables');


exports.create = function() {
  global.App.unitDevicesClient = redis.createClient();

  global.App.unitDevicesClient.on("error", function(err) {
    tools.log("UnitDevices Error " + err);
  });

  global.App.unitDevicesClient.select(3, function(err, res) {
    if (!err) {
      global.App.unitDevicesClient.get('ud', function(err, res) {
        if (!err && res) {
          global.App.unitDevices = JSON.parse(res);
        }
      });
    }
  });
};

exports.store = function(ud) {
  global.App.unitDevicesClient.select(3, function(err, res) {
    if (!err) {
      global.App.unitDevicesClient.set('ud', JSON.stringify(ud), function() {});
    }
  });
};
