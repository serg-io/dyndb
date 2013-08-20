DynDB
=====

Small DynamoDB Node.js module

Installation
------------

Execute the following command at the root of your project:

	npm install dyndb

AWS Credentials
---------------

You can set the credentials using any of the following methods:

1.	Manually passing the credentials to the constructor:
	
		var dyndb = new DynDB('accessKeyID', 'secretAccessKey', 'awsRegion');
		// -- OR -- 
		var dyndb = new DynDB({
			accessKeyID: 'accessKeyID', 
			secretAccessKey: 'secretAccessKey',
			awsRegion: 'awsRegion'	
		});

2.	Using the following environment variables and calling the constructor without any arguments:
	* `AWS_ACCESS_KEY_ID`
	* `AWS_SECRET_ACCESS_KEY`
	* `AWS_REGION`

3.	DynDB supports IAM Roles. To use IAM Role credentials [assign a role to the EC2](http://docs.amazonwebservices.com/AWSEC2/latest/UserGuide/UsingIAM.html#UsingIAMrolesWithAmazonEC2Instances) instance when you launch it.
	DynDB will automatically get the credentials from the [EC2 metadata service](http://docs.amazonwebservices.com/AWSEC2/latest/UserGuide/AESDG-chapter-instancedata.html).
	Do not pass the `accessKeyID` and `secretAccessKey` to the constructor when using IAM Roles.

		var dyndb = new DynDB(); // Default region: us-east-1

		// You can specify whatever region and API version you need
		var dyndb = new DynDB({ awsRegion: 'us-west-1', API_VERSION: '20120810' });

Usage
-----

	var DynDB = require('dyndb');

	// Pass your AWS access keys and AWS region to the constructor or
	// make sure they're set in your environment variables
	var dyndb = new DynDB('accessKeyID', 'secretAccessKey', 'awsRegion');

	// List tables
	dyndb.request('ListTables', function(error, json) {
		if (error) {
			console.error(error.message ? error.message : error);
		} else {
			// json: {TableNames: ['TableName1', 'TableName2', 'TableName3']}
			console.log(json);
		}
	});

	// Put Item
	var body = {
		TableName: 'Books',
		Item: {
			isbn: {N: '9780641723445'},
			cat: {SS: ['book','hardcover']},
			name: {S: 'The Lightning Thief'},
			author: {S: 'Rick Riordan'},
			series_t: {S: 'Percy Jackson and the Olympians'},
			sequence_i: {N: '1'},
			genre_s: {S: 'fantasy'},
			inStock: {S: 'true'},
			price: {N: '12.50'},
			pages_i: {N: '384'}
		}
	};
	dyndb.request('PutItem', body, function(error, json) {
		if (error) {
			console.error(error.message ? error.message : error);
		} else {
			// json: {ConsumedCapacityUnits: 1}
			console.log(json);
		}
	});

Additional Examples
-------------------

More examples can be found in `tests/operations.js`

API Docs
--------

Consult the [API Docs](http://serg-io.github.com/dyndb/) for detailed documentation about how to use DynDB

DynamoDB Docs
-------------

Consult the [DynamoDB documentation](http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/operationlist.html) for details about all the available operations and the structure
of their request bodies.

Released under the BSD License
----------------------------------

	Copyright (c) 2012, Sergio Alcantara
	All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted
	provided that the following conditions are met:

		* Redistributions of source code must retain the above copyright notice, this list of
		  conditions and the following disclaimer.
		* Redistributions in binary form must reproduce the above copyright notice, this list of
		  conditions and the following disclaimer in the documentation and/or other materials
		  provided with the distribution.
		* Neither the name of Sergio Alcantara nor the names of its contributors may be used to
		  endorse or promote products derived from this software without specific prior written
		  permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
	IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
	CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
	CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
	SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
	OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
	POSSIBILITY OF SUCH DAMAGE.
