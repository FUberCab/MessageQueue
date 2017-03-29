#!/usr/bin/env node --harmony

'use strict';

var dgram = require('dgram');
var moment = require('moment');
var xml2js = require('xml2js');

var appVar = require('./appVariables');
var tools = require('./tools');
var udpSender = require('./udpSender');

// create xml parser
var parser = new xml2js.Parser({
  explicitArray: false
});

module.exports = function (udpServer) {
  // logs errors to the console
  udpServer.on("error", function (err) {
    tools.log("UDP Server error:\n" + err.stack);
    //udpServer.close();
  });

  udpServer.on("message", function (msg, rinfo) {

    tools.log("UDP Server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);

    var deviceId;
    var unitId;
    var msgData;

    if (msg.toString().indexOf('<?xml version=') > -1) {
      var xmlData = msg;
      var requestId;
      var dispCode;

      parser.parseString(xmlData, function (err, result) {
        if (typeof result.message !== 'undefined') {
          deviceId = result.message.device['device-id'];
          unitId = result.message.vehicle['vehicle-no'];
          msgData = result.message['message-data'];

          global.App.unitDevices[deviceId] = unitId;

        } else if (typeof result['service-result'] !== 'undefined') {
          requestId = result['service-result']['request-id'];
          dispCode = result['service-result']['result-disposition'].$.code;

          var newMsg = global.App.outboundQueue.create(requestId, {
              title: dispCode,
              xmlData: xmlData.toString()
            }).priority('high')
            .searchKeys(['title'])
            .removeOnComplete(true)
            .save(function (err) {
              if (err) {
                tools.log('Error - Message ID: ' + newMsg.id);
              }
            });
          newMsg = null;
        } else if (typeof result['service-update'] !== 'undefined') {
          requestId = result['service-update']['request-id'];
          dispCode = result['service-update']['update-disposition'].$.code;

          var newMsg = global.App.outboundQueue.create(requestId, {
              title: dispCode,
              xmlData: xmlData.toString()
            }).priority('high')
            .searchKeys(['title'])
            .removeOnComplete(true)
            .save(function (err) {
              if (err) {
                tools.log('Error - Message ID: ' + newMsg.id);
              }
            });
          newMsg = null;
        }
      });

    } else {
      var msgString = msg.toString()
        .replace('~', '')
        .replace('@', '');

      var delimterPos = msgString.indexOf(":");
      if(delimterPos >= 1) {
        unitId = msgString.substring(0, delimterPos);
        msgData = msgString.substring(delimterPos + 1);
      }
    }

    if (msgData) {
      var msgDataArray = msgData.split('|');
      // for (var x = 0; x < msgDataArray.length; x += 1) {
      //   tools.log('msgDataArray[' + x + '] = ' + msgDataArray[x]);
      // }

      var newMsg = global.App.outboundQueue.create(unitId, {
          title: msgData,
          msgId: 'msgId:' + msgDataArray[0],
          msgCmd: msgDataArray[1],
          msgParm: msgDataArray[2]
        }).priority('high')
        .searchKeys(['msgId'])
        .removeOnComplete(true)
        .save(function (err) {
          if (err) {
            tools.log('Error - Message ID: ' + newMsg.id);
          } else if (!err) {
            //tools.log('No Error - Message ID: ' + queuedMsg.id);
          }
        });
      newMsg = null;
    }

  });

  // just for information so we know where we are listening
  udpServer.on("listening", function () {
    var address = udpServer.address();
    tools.log("UDP Server listening on " + address.address + ":" + address.port);
  });

  // this actually starts the server listening
  udpServer.bind(appVar.udpSocketPort, appVar.udpSocketAddress);
};
