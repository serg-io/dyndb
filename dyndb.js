/**
DynDB 0.0.3 - (c) 2012 Sergio Alcantara
Provides the base DynDB constructor

@module dyndb
@author Sergio Alcantara
 */

var _ = require('underscore'),
	https = require('https'),
	crypto = require('crypto');

/**
DynDB Constructor.
It accepts the AWS access keys and the AWS region. If no arguments are passed,
it gets the keys and region from the following environment variables:

1. `AWS_ACCESS_KEY_ID`
2. `AWS_SECRET_ACCESS_KEY`
3. `AWS_REGION`

@class DynDB
@constructor
@param {String} [accessKeyID] Your AWS access key ID
@param {String} [secretAccessKey] Your AWS secret access key
@param {String} [region='us-east-1'] The AWS region you would like to use
 */
function DynDB() {
	/**
	DynamoDB's service name used in the HTTP headers and to create the signature that authenticates every request
	
	@property SERVICE_NAME
	@type String
	@final
	@private
	 */
	var SERVICE_NAME = 'DynamoDB';

	/**
	DynamoDB's API version used in the HTTP headers of every request

	@property API_VERSION
	@type String
	@final
	@private
	 */
	var API_VERSION = '20111205';

	var accessKey = null,
		secretKey = null,
		region = null;

	/**
	Sets the access keys and region to use for every request. If no arguments are passed,
	it gets the keys and region from the following environment variables:

	1. `AWS_ACCESS_KEY_ID`
	2. `AWS_SECRET_ACCESS_KEY`
	3. `AWS_REGION`

	@method setup
	@chainable
	@param {String} [accessKeyID] Your AWS access key ID
	@param {String} [secretAccessKey] Your AWS secret access key
	@param {String} [region='us-east-1'] The AWS region you would like to use
	 */
	(this.setup = function(accessKeyID, secretAccessKey, awsRegion) {
		accessKey = accessKeyID || process.env.AWS_ACCESS_KEY_ID;
		secretKey = secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
		region = awsRegion || process.env.AWS_REGION || 'us-east-1';
		return this;
	}).apply(this, arguments);

	/**
	Uses [Crypto.Hmac](http://nodejs.org/api/crypto.html#crypto_class_hmac) to calculate the SHA256 HMAC for the given data

	@method hmac
	@private
	@param {String} key The hmac key to be used
	@param {String} data The data for which to calculate the HMAC
	@param {String} [encoding='binary'] The desired output encoding for the HMAC. Can be `'hex'`, `'binary'` or `'base64'`
	@returns {Object} The calculated HMAC value. The type of the return value depends on the given `encoding`
	 */
	function hmac(key, data, encoding) {
		var hmac = crypto.createHmac('sha256', key);
		hmac.update(data);
		return hmac.digest(encoding || 'binary');
	}

	/**
	Uses [Crypto.Hash](http://nodejs.org/api/crypto.html#crypto_class_hash) to calculate the SHA256 hash for the given data

	@method hmac
	@private
	@param {String} data The data from which to calculate the hash
	@param {String} [dataEncoding='binary'] The data's encoding. Can be `'utf8'`, `'ascii'` or `'binary'`
	@param {String} [encoding='hex'] The desired output encoding for the hash. Can be `'hex'`, `'binary'` or `'base64'`
	@returns {Object} The calculated hash value. The type of the return value depends on the given `encoding`
	 */
	function sha256Hash(data, dataEncoding, outputEncoding) {
		var hash = crypto.createHash('sha256');
		hash.update(data, dataEncoding || 'binary');
		return hash.digest(outputEncoding || 'hex');
	}

	/**
	Signs a given request. Follows the [AWS signature v4](http://docs.amazonwebservices.com/general/latest/gr/signature-version-4.html) specs to add the `Authorization` header in `httpOpts`

	@method signRequest
	@private
	@param {Object} httpOpts The http options object that will be used when calling the `https.request()` method
	@param {Buffer} body The `Buffer` instance of the request body
	 */
	function signRequest(httpOpts, body) {
		var headers = _.extend({host: httpOpts.host}, httpOpts.headers),
			headerNames = _.sortBy(_.keys(headers), function(name) { return name.toLowerCase(); }),
			isoDate = headers['x-amz-date'],
			dateStr = isoDate.substr(0, 8),
			credentialScope = dateStr + '/' + region + '/' + SERVICE_NAME.toLowerCase() + '/aws4_request';

		var canonicalRequest = httpOpts.method + '\n' +
			encodeURI(httpOpts.path) + '\n' +
			'\n' + // Query String
			_.map(headerNames, function(name) { return name.toLowerCase() + ':' + ('' + headers[name]).trim() + '\n'; }).join('') + '\n' +
			_.map(headerNames, function(name) { return name.toLowerCase(); }).join(';') + '\n' +
			sha256Hash(body);

		var strToSign = 'AWS4-HMAC-SHA256\n' +
			isoDate + '\n' +
			credentialScope + '\n' +
			sha256Hash(canonicalRequest, 'utf8');

		var derivedKey = hmac(hmac(hmac(hmac('AWS4' + secretKey, dateStr), region), SERVICE_NAME.toLowerCase()), 'aws4_request'),
			signature = hmac(derivedKey, strToSign, 'hex');

		httpOpts.headers.Authorization = 'AWS4-HMAC-SHA256 Credential=' + accessKey + '/' + credentialScope +
			',SignedHeaders=' + _.map(headerNames, function(name) { return name.toLowerCase(); }).join(';') +
			',Signature=' + signature;
	};

	/**
	Generates an ISO8601 basic date string (`YYYYMMDD'T'HHMMSS'Z'`) for the given date instance

	@method basicISODate
	@private
	@param {Date} [date] A date instance. If no date is given, a `new Date()` is used
	@return {String} An ISO8601 basic date string
	 */
	function basicISODate(date) {
		// Can be done with str.replace(/(-|:|\.\d{3}Z$)/g, ''), but substr() performs better
		// http://jsperf.com/iso8601-date-basic-format
		var str = (date || new Date()).toISOString();
		return str.substr(0, 4) + str.substr(5, 2) + str.substr(8, 5) + str.substr(14, 2) + str.substr(17, 2) + 'Z';
	}

	/**
	Sends a request to Amazon DynamoDB

	@method request
	@chainable
	@param {String} operationName Name of the DynamoDB operation to request. Consult
	[DynamoDB documentation](http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/operationlist.html 'DynamoDB Operations')
	for a list of available operations
	@param {Object|String} [body='{}'] Body of the request to send. If it's not a string, it is converted into a string using `JSON.stringify()`.
	Consult [DynamoDB documentation](http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/operationlist.html 'DynamoDB Operations')
	for details about the body for each type of operation
	@param {Function} [callback] Callback function to execute after the response has been received or when an error was triggered during the request.
	The callback function should take the following arguments:
		@param {Object} callback.error This can be:

	1. An object, the parsed DynamoDB's error JSON string response, if the response's status code was not 200
	2. The error object passed by the underlying http request if the 'error' event was triggered
	3. Undefined if there was no error

		@param {Object|String} callback.json The parsed JSON response or a string if the response is not a valid JSON string
	@param {Object} [context] The `context` in which the callback should be executed, meaning that whenever the callback function is called,
	the value of `this`, inside the callback, will be `context`. If no `context` is given, the value of `this` would be the underlying request's
	[http.ClientResponse](http://nodejs.org/api/http.html#http_http_clientresponse) object, which contains data like `statusCode` and `headers`
	 */
	this.request = function(operationName, body, callback, context) {
		if (_.isFunction(body)) {
			context = callback;
			callback = body;
			body = undefined;
		}
		body || (body = '{}');
		body = new Buffer(_.isString(body) ? body : JSON.stringify(body));

		// The `complete` callback should only be called once. The [http docs](http://nodejs.org/api/http.html#http_event_close_1)
		// say that a 'close' event can be fired after the 'end' event has been fired. To ensure that the `complete` callback
		// is called only once it is wrapped by `_.once()`
		var complete = _.once(function(error, json, httpResponse) {
			try {
				if (!_.isEmpty(json)) json = JSON.parse(json);
			} catch (e) {}

			if (httpResponse && httpResponse.statusCode !== 200) error = json;

			if (_.isFunction(callback)) callback.call(context || httpResponse, error, json);
		});

		var httpOpts = {
			host: SERVICE_NAME.toLowerCase() + '.' + region + '.amazonaws.com',
			port: 443,
			path: '/',
			method: 'POST',
			headers: {
				'x-amz-date': basicISODate(),
				'x-amz-target': SERVICE_NAME + '_' + API_VERSION + '.' + operationName,
				'Content-Type': 'application/x-amz-json-1.0'
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

		return this;
	};
}

module.exports = DynDB;