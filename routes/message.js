#!/usr/bin/env node --harmony
'use strict';

var xml2js = require('xml2js');
var moment = require('moment');
var async = require('async');

var defObj = require('../lib/defineObjects');
var udpSender = require('../lib/udpSender');
var ud = require('../lib/unitDevices');
var tools = require('../lib/tools');
var kue = require('kue');

// Instantiate xml parser
var parser = new xml2js.Parser({
  explicitArray: false
});

// Instantiate xml builder
var builder = new xml2js.Builder({
  rootName: 'message',
  renderOpts: {
    'pretty': false,
    'indent': ' ',
    'newline': '\n'
  },
  xmldec: {
    'version': '1.0',
    'encoding': 'UTF-8'
  }
});

exports.create = function (requestMain, responseMain, callbackMain) {
  // tools.log('Create Request Params:');
  // tools.log(requestMain.params);
  // tools.log(requestMain.headers);
  // tools.log(requestMain.body);
  // tools.log(requestMain.rawBody);
  // tools.log(requestMain);
  // tools.log(requestMain.ip);

  var xmlData;

  if (!requestMain.rawBody && !requestMain.body) {
    tools.log("-----------------No Body-------------------");
    responseMain.send(200, "No Body");
    return;
  } else {
    if (!requestMain.rawBody) {
      var objBody = requestMain.body;
      xmlData = objBody[Object.keys(objBody)[0]].replace('"1.0" encoding="UTF-8"?>', '');
    } else {
      xmlData = requestMain.rawBody.replace('<?xml version="1.0" encoding="UTF-8"?>', '').replace('"1.0" encoding="UTF-8"?>', '');
    }

    parser.parseString(xmlData, function (err, result) {
      if (!result.hasOwnProperty('message')) {
        responseMain.send(422);
      } else {
        var deviceId = result.message.device['device-id'];
        var unitId = result.message.vehicle['vehicle-no'];
        var msgData = result.message['message-data'];

        if (msgData.substring(0, 3) === 'ACK') {
          //ackMsg(unitId, deviceId, msgData);
        }

        if (!global.App.unitDevices.hasOwnProperty(deviceId) || global.App.unitDevices[deviceId] != unitId) {
          global.App.unitDevices[deviceId] = unitId;
          ud.store(global.App.unitDevices);
        }

        udpSender.passToAD(result);

        responseMain.send("Message Received");
      }
    });
  }
};

exports.retrieve = function (requestMain, responseMain, callbackMain) {
  // tools.log('Retrieve Request Params:');
  // tools.log(requestMain.params);
  // tools.log(requestMain.headers);
  // tools.log(requestMain.body);
  // tools.log(requestMain);
  // tools.log(requestMain.ip);

  var deviceId = requestMain.params.id;

  if (global.App.unitDevices.hasOwnProperty(deviceId)) {
    var unitId = global.App.unitDevices[deviceId];
    var checkQueueId = setInterval(function () {
      checkQueue(requestMain, responseMain, unitId, deviceId, checkQueueId, callbackMain);
      setTimeout(function () {
        clearInterval(checkQueueId);
        if (!responseMain.finished) {
          responseMain.send(204, 'No Messages');
        }
      }, 30000);
    }, 250);
  } else {
    var queuedMsg = { data: { title: '1|START|0'}};
    buildResponseXML(queuedMsg, '', '', 1, responseMain, function (){
      //tools.log('Warning: No unitId-to-deviceId mapping found');
    });
  }
};

var checkQueue = function (requestMain, responseMain, unitId, deviceId, checkQueueId, callbackMain) {

  async.waterfall([
      function (next) {
        global.App.redisClient.keys('q:jobs:' + unitId + ':inactive', function (err, keys) {
          if (err) {
            return tools.log(err);
          }
          if (keys.length < 1) {
            next('No Messages');
            return;
          } else {
            clearInterval(checkQueueId);
            next(null);
            return;
          }
        });
      },
      function (next) {
        var nextMsg = global.App.outboundQueue.process(unitId, 1, function (queuedMsg, done, worker) {
          buildResponseXML(queuedMsg, deviceId, unitId, checkQueueId, responseMain, function (xmlMsg) {
            worker.pause();
            done(null);
            responseMain.send(200, xmlMsg);
            next(null);
            nextMsg = null;
            return;
          });
        });
      },
    ],
    function (err) {
      if (err) {
        if (checkQueueId < 1) {
          responseMain.send(204, 'No Messages');
        } else {
          //tools.log('No Messages');
        }
        //callbackMain(new Error(err));
        return;
      }
    }
  );
};


var buildResponseXML = function (queuedMsg, deviceId, unitId, checkQueueId, responseMain, callback) {

  var msg = new defObj.message();
  msg['message-data'] = queuedMsg.data.title;
  msg['message-timestamp'] = moment().toISOString();
  msg.device['device-id'] = deviceId;
  msg.vehicle['vehicle-no'] = unitId;

  var xmlMsg = builder.buildObject(msg);
  msg = null;

  var checkId = setInterval(function () {
    if (xmlMsg) {
      if (!responseMain.finished) {
        clearInterval(checkId);
        // tools.log('MESSAGE response:');
        // tools.log(xmlMsg);
        callback(xmlMsg);
        xmlMsg = null;
        return;
      }
    }
  }, 200);
};


var ackMsg = function (unitId, deviceId, msgData) {
  var msgId = 'msgId:' + msgData.split('|')[1];
  global.App.outboundQueue.complete(function (err, ids) {
    if (!ids) {
      return;
    }
    ids.forEach(function (id) {
      kue.Job.get(id, function (err, job) {
        if (err || !job) {
          tools.log(err);
          return;
        }
        if (job.data.msgId === msgId) {
          job.remove(function () {
            //tools.log(msgId + ' ACK Completed');
          });
        }
      });
    });
  });
};
