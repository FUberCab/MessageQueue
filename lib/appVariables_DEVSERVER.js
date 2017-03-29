#!/usr/bin/env node --harmony

'use strict';

/*-- variables --*/
exports.udpSocketPort = 5157;
exports.udpSocketAddress = '192.168.111.105';

exports.udpSocketPortDestination = {
  'TWIA': 5225,
  'TWIB': 5226,
  'TWIC': 5227,
  'DEV': 5228,
  'DEVS': 5155
};
exports.udpSocketHostDestination = {
  'TWIA': '192.168.111.105', //'72.91.202.98',
  'TWIB': '192.168.111.105', //'72.91.202.98',
  'TWIC': '192.168.111.105', //'72.91.202.98',
  'DEV': '72.91.202.98',
  'DEVS': '192.168.111.101'
};


exports.serverAddress = '192.168.111.105';

exports.uiPort = 8081;
exports.mqPort = 8089;

exports.installDrive = 'C';
