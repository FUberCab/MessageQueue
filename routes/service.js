#!/usr/bin/env node --harmony

'use strict';

var xml2js = require('xml2js');
var async = require('async');
//var moment = require('moment-timezone');

var udpSender = require('../lib/udpSender');
var tools = require('../lib/tools');

// create xml parser
var parser = new xml2js.Parser({
  explicitArray: false
});

// create xml builder
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


exports.create = function(requestMain, responseMain, callbackMain) {
  // tools.log('Create Request Params:');
  // tools.log(requestMain.params);
  // tools.log(requestMain.headers);
  // tools.log(requestMain.body);
  // tools.log(requestMain.rawBody);
  // tools.log(requestMain);
  // tools.log(requestMain.ip);

  udpSender.passToAD_NT(requestMain.rawBody);

  var result = requestMain.body;
  var requestId;
  var deviceId;


  if (result.hasOwnProperty('service-request')) {
    //tools.log('service-request');

    requestId = requestMain.body['service-request']['request-id'];
    deviceId = requestMain.body['service-request'].device['device-id'];

    var checkServiceQueueId = setInterval(function() {
    tools.log("checking Service Queue");
      checkServiceQueue(requestMain, responseMain, requestId, checkServiceQueueId, callbackMain);
      setTimeout(function() {
        clearInterval(checkServiceQueueId);
        if (!responseMain.finished) {
          responseMain.send(200, '<?xml version="1.0" encoding="UTF-8"?>\n<service-updates/>');
        }
      }, 10000);
    }, 1000);

    //udpSender.passToAD_NT(requestMain.rawBody);

  } else if (result.hasOwnProperty('service-progress')) {
    //tools.log('service-progress');
    requestId = requestMain.body['service-progress']['progress-id'];
    deviceId = requestMain.body['service-progress'].device['device-id'];

    responseMain.send(200, '<?xml version="1.0" encoding="UTF-8"?>\n<service-updates/>');
  }


};

exports.retrieve = function(requestMain, responseMain, callbackMain) {
  // tools.log('Retrieve Request Params:');
  // tools.log(requestMain.params);
  // tools.log(requestMain.headers);
  // tools.log(requestMain.body);
  // tools.log(requestMain);
  // tools.log(requestMain.ip);

  var requestId = requestMain.params.id;
  //tools.log('SERVICE retrieve requestId: ' + requestId);

  var checkServiceQueueId = setInterval(function() {
    checkServiceQueue(requestMain, responseMain, requestId, checkServiceQueueId, callbackMain);
    setTimeout(function() {
      clearInterval(checkServiceQueueId);
      if (!responseMain.finished) {
        responseMain.send(200, '<?xml version="1.0" encoding="UTF-8"?>\n<service-updates/>');
      }
    }, 10000);
  }, 1000);

};

var checkServiceQueue = function(requestMain, responseMain, requestId, checkServiceQueueId, callbackMain) {

  async.waterfall([

      function(next) {
        global.App.redisClient.keys('q:jobs:' + requestId + ':inactive', function(err, keys) {
          if (err) {
            return tools.log(err);
          }

          if (keys.length < 1) {
            next('No Messages');
            return;
          } else {
            clearInterval(checkServiceQueueId);
            next(null);
            return;
          }
        });
      },
      function(next) {
        var nextMsg = global.App.outboundQueue.process(requestId, 1, function(queuedMsg, done, worker) {
          var xmlData = queuedMsg.data.xmlData; //.replace(/[\n]/g, '').replace('<?xml version="1.0" encoding="UTF-8"?>', '<?xml version="1.0" encoding="UTF-8"?>\n');
          // tools.log('SERVICE response:');
          // tools.log(xmlData);
          parser.parseString(xmlData, function(err, result) {
            //tools.log(result);
            if (typeof result['service-result'] !== 'undefined') {
              result['service-result']['result-timestamp'] = result['service-result']['result-timestamp'] + '-04:00';
            } else if (typeof result['service-update'] !== 'undefined') {
              result['service-update']['update-timestamp'] = result['service-update']['update-timestamp'] + '-04:00';
            }

            //tools.log(result);
            var xmlMsg = builder.buildObject(result);
            result = null;
            xmlData = xmlMsg.replace(/[\n]/g, '').replace('<?xml version="1.0" encoding="UTF-8"?>', '<?xml version="1.0" encoding="UTF-8"?>\n');
            xmlMsg = null;
            return;

          });

          if (responseMain._header) {
            worker.pause();
            done(null);
            next(null);
            nextMsg = null;
            xmlData = null;
            return
          } else {
            responseMain.send(200, xmlData);
            worker.pause();
            done(null);
            next(null);
            nextMsg = null;
            xmlData = null;
            return;
          }

        });

      },
    ],
    function(err) {
      if (err) {
        if (checkServiceQueueId < 1) {
          responseMain.send(200, '<?xml version="1.0" encoding="UTF-8"?>\n<service-updates/>');
        }
        //callbackMain(new Error(err));
        return;
      }
    }
  );
};
