#!/usr/bin/env node --harmony

'use strict';

/*-- variables --*/
exports.udpSocketPort = 5156;  **** port # in AD White Window at startup(listening on)
exports.udpSocketAddress = '192.168.0.1';  **** server Ip Address where MQ is - Ip In AD .INI

exports.udpSocketPortDestination = {
  'SAAS': 5155  **** company code plus AD HostPort - HostPort of AD in .ini for each fleet - just add lines
};

exports.udpSocketHostDestination = {
  'SAAS': '192.168.0.1'  ****Company code plus AD Ip address - multiple fleets - just add lines
};

exports.serverAddress = '192.168.0.1';  **** where MQ files are located

exports.uiPort = 8080;  **** user interface port - * open in firewall
exports.mqPort = 8080;  **** Traffic from client app's tranair, nextaxi etc... - *** open in firewall

exports.installDrive = 'C'; **** drive where MQ files are installed

#===================================================================

#To Add multiple fleets add comma after each line  in both sections, except last one see examples
#exports.udpSocketPortDestination = { 
#  'SAAS': 5155,
#  'ATAX'; 5156
#};
#exports.udpSocketHostDestination = {
#  'SAAS': '192.168.0.1',
#  'ATAX'; '192.168.0.1  
#};