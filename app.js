#!/usr/bin/env node --harmony

'use strict';

/** Module Dependencies **/
var express = require('express');
var http = require('http');
var path = require('path');
var dgram = require('dgram');
var redis = require('redis');
var kue = require('kue');
var xmlparser = require('express-xml-bodyparser');

var tools = require('./lib/tools');
var appVar = require('./lib/appVariables');

tools.log('process.env.NODE_ENV = ' + process.env.NODE_ENV);

var app = express();

//Set up common namespace for the application
//As this is the global namespace, it will be available across all modules
if (!global['App']) {
  global.App = {};
}
global.App.unitDevices = {};
global.App.redisClient = redis.createClient();
global.App.redisClient.on('error', function (err) {
  tools.log('Global redisClient Error: ' + err);
});
global.App.outboundQueue = kue.createQueue({
  disableSearch: true,
});
global.App.outboundQueue.on('error', function (err) {
  tools.log('Outbound Queue Error: ' + JSON.stringify(err));
});

var ud = require('./lib/unitDevices').create();

var messageRoute = require('./routes/message');
var serviceRoute = require('./routes/service');

var udpSender = require('./lib/udpSender');
var udpListener = require('./lib/udpListener');


// all environments
app.set('port', process.env.PORT || appVar.mqPort);
app.use(function (req, res, next) {
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(xmlparser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/central/message', messageRoute.retrieve);
app.put('/central/message', messageRoute.create);
app.post('/central/message', messageRoute.create);

app.get('/central/message/:id?', messageRoute.retrieve);
app.put('/central/message/:id?', messageRoute.create);
app.post('/central/message/:id?', messageRoute.create);

app.get('/central/service/payment', serviceRoute.retrieve);
app.put('/central/service/payment', serviceRoute.create);
app.post('/central/service/payment', serviceRoute.create);

app.get('/central/service/progress', serviceRoute.retrieve);
app.put('/central/service/progress', serviceRoute.create);
app.post('/central/service/progress', serviceRoute.create);

app.get('/central/service/:id?/updates', serviceRoute.retrieve);
app.put('/central/service/:id?/updates', serviceRoute.create);
app.post('/central/service/:id?/updates', serviceRoute.create);

app.get('/central/service/:id?', serviceRoute.retrieve);
app.put('/central/service/:id?', serviceRoute.create);
app.post('/central/service/:id?', serviceRoute.create);

app.get('/central/service', serviceRoute.retrieve);
app.put('/central/service', serviceRoute.create);
app.post('/central/service', serviceRoute.create);


/**** Remove When Not Debugging ***/
app.all('/testError', function(req, res) {
  setTimeout(function() {
    /*-- DEV Purposefully generating an error to test restart DEV--*/
    flerb.bark();
  });
});

// Define Servers
var udpServer = dgram.createSocket("udp4");
udpListener(udpServer);

kue.app.set('title', 'MQ 2.0.4');
if (appVar.uiPort == appVar.mqPort) {
  app.use(kue.app);
}

http.createServer(app).listen(app.get('port'), function() {
  tools.log('Server listening on port ' + app.get('port'));
});

if (appVar.uiPort !== appVar.mqPort) {
  kue.app.listen(appVar.uiPort);
}

var kueHelp = require('./lib/kueHelpers');
kueHelp.scheduleCleanUp();


process.on('uncaughtException', function(err) {
  console.error('uncaughtException');
  console.error(err);
  tools.log('uncaughtException');
  tools.log(err);
  // setTimeout(function () {
	//    process.exit(1);
  // }, 1500);
  global.App.outboundQueue.shutdown(function(err) {
    console.log( 'outboundQueue is shut down.', err||'' );
    process.exit(1);
  }, 5000);
});
