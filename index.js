var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var config = require('./config');

var httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function() {
    console.log('The http server is listening on port ' + config.httpPort);
});

var unifiedServer = function(req, res) {
    var parsedUrl = url.parse(req.url, true);    
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    var queryStringObject = parsedUrl.query;
    var method = req.method.toLowerCase();
    var headers = req.headers;
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function() {
        buffer += decoder.end();

        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method' : method,
            'headers': headers,
            'payload' : buffer
        };

        chosenHandler(data, function(statusCode, payload) {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            if (method === 'post') {
                res.end(payloadString);
            } else {
                res.end();
            }

            console.log('Returning this response: ', statusCode, payloadString);
        });        
    });
};

// Define the handlers
var handlers = {};

handlers.hello = function(data, callback) {
    callback(200, { 'message' : 'Welcome to my server! :-)' });
};

handlers.notFound = function(data, callback) {
    callback(404);
};

// Define a request router
var router = {
    'hello': handlers.hello
};