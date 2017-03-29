#!/usr/bin/env node --harmony

'use strict';

var fs = require('fs');
var util = require('util');
var moment = require('moment');
var appVar = require('./appVariables');


//// var log_file = fs.createWriteStream(process.cwd() + '/log/debug-' + moment().format('YYYY-MM-DD HHmm ss SSS') + '.log', {
////   flags: 'w'
//// });

// var log_file = fs.createWriteStream(appVar.installDrive + ':/tranware/MQ/log/debug-' + moment().format('YYYY-MM-DD HHmm ss SSS') + '.log', {
//   flags: 'w'
// });

exports.getDateTime = function() {
  return moment().format('YYYY-MM-DD HH:mm:ss');
};

exports.getDateTimeUTC = function(minutesAhead) {
  var UTCTime = moment().utc();
  UTCTime.add('m', 15);
  return UTCTime.format('YYYY-MM-DD HH:mm:ss');
};

exports.log = function(logItem) {
  var stdoutLogOpts = {
    colors: true,
    showHidden: false,
    depth: null,
    customInspect: true
  };

  var fileLogOpts = {
    colors: false,
    showHidden: false,
    depth: null,
    customInspect: true
  };

  util.log(util.inspect(logItem, stdoutLogOpts));
  //log_file.write(util.format(moment().format() + ' ' + util.inspect(logItem, fileLogOpts)) + '\n\r');
  //console.log(moment().format('YYYY-MM-DD HHmm ss SSS'));
  //console.log(logItem);
};
