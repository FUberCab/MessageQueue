#!/usr/bin/env node --harmony

'use strict';

var dgram = require('dgram');
var xml2js = require('xml2js');

var appVar = require('./appVariables');
var tools = require('./tools');

var client = dgram.createSocket('udp4');
//var writer = require('.././lib/writers');


global.App.NextOutboundMsgNo = 0;

// create xml parser
var parser = new xml2js.Parser({
  explicitArray: false
});

var NextOutboundMsgNo = function () {
  var hexNo = global.App.NextOutboundMsgNo.toString(16);
  global.App.NextOutboundMsgNo += 1;
  return (hexNo);
};

exports.passToAD_NT = function (msg) {

  var fleetId;
  var PORT;
  var HOST;

  parser.parseString(msg, function (err, result) {
    if (result.hasOwnProperty('service-progress')) {
      fleetId = result['service-progress']['cab-info']['fleet-name'];
      PORT = appVar.udpSocketPortDestination[fleetId];
      HOST = appVar.udpSocketHostDestination[fleetId];
    } else if (result.hasOwnProperty('service-request')) {
      fleetId = result['service-request']['cab-info']['fleet-name'];
      PORT = appVar.udpSocketPortDestination[fleetId];
      HOST = appVar.udpSocketHostDestination[fleetId];
    }
  });

  if (!fleetId || !PORT || !HOST) {
    tools.log('ERROR: Unable to determine AD address.');
    tools.log(msg);
    tools.log('FleetId: ' + fleetId);
    tools.log('Host: ' + HOST);
    tools.log('Port: ' + PORT);
    return;
  }

  //msg = msg.replace('<?xml version="1.0"?>', '');
  var msgId = NextOutboundMsgNo();
  var msgPacket = new Buffer(msgId + '|' + msg + '~');

  client.send(msgPacket, 0, msgPacket.length, PORT, HOST, function (err, bytes) {
    if (err) {
      throw err;
    }
    tools.log('UDP msgPacket sent to ' + HOST + ':' + PORT + ' | ' + msgPacket + ' | ' + tools.getDateTime());
  });
};

exports.passToAD = function (msg) {
  var unitId = msg.message.vehicle['vehicle-no'].toUpperCase();

  var msgData = msg.message['message-data']
    .replace('~', '')
    .replace('@', '');

  var msgPacket = new Buffer('@' + unitId + ':' + msgData + '~');

  var fleetId = unitId.replace(/[0-9]/g, '');
  var PORT = appVar.udpSocketPortDestination[fleetId];
  var HOST = appVar.udpSocketHostDestination[fleetId];

  if (!fleetId || !PORT || !HOST) {
    tools.log('ERROR: Unable to determine AD address.');
    tools.log('FleetId: ' + fleetId);
    tools.log('Host: ' + HOST);
    tools.log('Port: ' + PORT);
    return;
  }

  client.send(msgPacket, 0, msgPacket.length, PORT, HOST, function (err, bytes) {
    if (err) {
      throw err;
    }
    tools.log('UDP msgPacket sent to ' + HOST + ':' + PORT + ' | ' + msgPacket + ' | ' + tools.getDateTime());
    //client.close();
  });

};
