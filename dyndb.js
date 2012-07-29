/*
 *  DynDB 0.0.1
 *  (c) 2012 Sergio Alcantara
 */

var _ = require('underscore'),
	https = require('https'),
	crypto = require('crypto');

function DynDB() {
	var SERVICE_NAME = 'DynamoDB';
	var API_VERSION = '20111205';

	var accessKey = null,
		secretKey = null,
		region = null;

	(this.setup = function(accessKeyID, secretAccessKey, awsRegion) {
		accessKey = accessKeyID;
		secretKey = secretAccessKey;
		region = awsRegion || 'us-east-1';
	}).apply(this, arguments);

	function hmac(key, data, encoding) {
		var hmac = crypto.createHmac('sha256', key);
		hmac.update(data);
		return hmac.digest(encoding || 'binary');
	}

	function basicISODate(date) {
		// Can be done with RegExp, but substr performs a lot better: http://jsperf.com/iso8601-date-basic-format
		var str = date.toISOString();
		return str.substr(0, 4) + str.substr(5, 2) + str.substr(8, 5) + str.substr(14, 2) + str.substr(17, 2) + 'Z';
	}

	function signRequest(httpOpts, body) {
		var headers = _.extend({host: httpOpts.host}, httpOpts.headers),
			headerNames = _.sortBy(_.keys(headers), function(name) { return name.toLowerCase(); }),
			isoDate = headers['x-amz-date'],
			dateStr = isoDate.substr(0, 8),
			credentialScope = dateStr + '/' + region + '/' + SERVICE_NAME.toLowerCase() + '/aws4_request',
			hash = crypto.createHash('sha256');
		hash.update(body, 'utf8');

		var canonicalRequest = httpOpts.method + '\n' +
			encodeURI(httpOpts.path) + '\n' +
			'\n' + // Query String
			_.map(headerNames, function(name) { return name.toLowerCase() + ':' + ('' + headers[name]).trim() + '\n'; }).join('') + '\n' +
			_.map(headerNames, function(name) { return name.toLowerCase(); }).join(';') + '\n' +
			hash.digest('hex');

		hash = crypto.createHash('sha256');
		hash.update(canonicalRequest, 'utf8');

		var strToSign = 'AWS4-HMAC-SHA256\n' +
			isoDate + '\n' +
			credentialScope + '\n' +
			hash.digest('hex');

		var derivedKey = hmac(hmac(hmac(hmac('AWS4' + secretKey, dateStr), region), SERVICE_NAME.toLowerCase()), 'aws4_request'),
			signature = hmac(derivedKey, strToSign, 'hex');

		httpOpts.headers.Authorization = 'AWS4-HMAC-SHA256 Credential=' + accessKey + '/' + credentialScope +
			',SignedHeaders=' + _.map(headerNames, function(name) { return name.toLowerCase(); }).join(';') +
			',Signature=' + signature;
	};

	this.request = function(operationName, body, callback) {
		if (_.isFunction(body)) {
			callback = body;
			body = '{}';
		}
		body || (body = '{}');
		if (!_.isString(body)) body = JSON.stringify(body);
		var complete = _.once(function(e, jsonStr, httpResponse) {
			var jsonResponse = !_.isEmpty(jsonStr) ? JSON.parse(jsonStr) : jsonStr;
			if (httpResponse && httpResponse.statusCode !== 200) e = jsonResponse;
			if (_.isFunction(callback)) callback(e, jsonResponse, httpResponse);
		});

		var httpOpts = {
			host: SERVICE_NAME.toLowerCase() + '.' + region + '.amazonaws.com',
			port: 443,
			path: '/',
			method: 'POST',
			headers: {
				'x-amz-date': basicISODate(new Date()),
				'x-amz-target': SERVICE_NAME + '_' + API_VERSION + '.' + operationName,
				'Content-Type': 'application/x-amz-json-1.0',
				'Content-Length': body.length
			}
		};
		signRequest(httpOpts, body);

		var request = https.request(httpOpts, function(httpResponse) {
			var jsonStr = '';
			httpResponse.on('data', function(data) {
				jsonStr += data.toString(); // 'data' can be a String or a Buffer object
			});
			httpResponse.on('close', function(e) { complete(e, jsonStr, httpResponse); });
			httpResponse.on('end', function() { complete(undefined, jsonStr, httpResponse); });
		});
		request.on('error', complete);
		request.write(body);
		request.end();
	};
}

module.exports = DynDB;