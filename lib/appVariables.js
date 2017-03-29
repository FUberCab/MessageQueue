#!/usr/bin/env node --harmony
//Message Queue
'use strict';

/*-- variables --*/
exports.udpSocketPort = 5156;
exports.udpSocketAddress = '192.168.111.105';

exports.udpSocketPortDestination = {
  'TWIA': 5225,
  'TWIB': 5226,
  'TWIC': 5227,
  'DEV': 5228,
  'DEVP': 5229,
  'DEVH': 5155,
  'DEVS': 5155,
  'DEVF': 5255,
  'SAST': 5255,
  'BILL': 5155
};
exports.udpSocketHostDestination = {
  'TWIA': '192.168.111.105',
  'TWIB': '192.168.111.105',
  'TWIC': '192.168.111.105',
  'DEV': '192.168.111.105',
  'DEVP': '192.168.111.105',
  'DEVH': '192.168.111.55',
  'DEVS': '192.168.111.101',
  'DEVF': '192.168.111.101',
  'DEVF': '192.168.111.60',
  'BILL': '192.168.111.200'
};

exports.serverAddress = '192.168.111.105';

exports.uiPort = 8083;
exports.mqPort = 8089;

exports.installDrive = 'C';
