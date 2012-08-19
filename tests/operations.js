var _ = require('underscore'),
	dataset = require('./dataset.js'),
	DynDB = require(__dirname + '/../');


function waitForActiveTable(tableName, callback, count) {
	this.dyndb.request('DescribeTable', {TableName: tableName}, function(error, json, httpRes) {
		if (error) callback(error);
		else if (json.Table.TableStatus === 'ACTIVE') callback();
		else if (_.isUndefined(count)) {
			console.log('Waiting, up to one minute, for tables to become "ACTIVE"...');
			setTimeout(_.bind(waitForActiveTable, this), 6000, tableName, callback, 1);
		} else if (count < 10) setTimeout(_.bind(waitForActiveTable, this), 6000, tableName, callback, count + 1);
		else callback({message: 'Table ' + tableName + ' did not become "ACTIVE" within a minute after being created'});
	});
}


var existingTables = [];
exports.tables = {
	setUp: function(done) {
		this.dyndb = new DynDB();
		this.tables = dataset.tables;
		done();
	},
	ListTables: function(test) {
		test.expect(1);
		this.dyndb.request('ListTables', function(error, json, httpRes) {
			if (json) existingTables = json.TableNames;

			test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
			console.log(json);
			test.done();
		}, this);
	},
	CreateTable: function(test) {
		var tables = _.reject(this.tables, function(table) {
			return _.include(existingTables, table.TableName);
		}, this);
		if (_.isEmpty(tables)) {
			test.expect(0);
			test.done();
			return;
		}

		var done = _.after(tables.length, function() { test.done(); });
		test.expect(tables.length);

		_.each(tables, function(table) {
			this.dyndb.request('CreateTable', table, function(error, json, httpRes) {
				test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
				done();
			});
		}, this);
	},
	DescribeTable: function(test) {
		var done = _.after(this.tables.length, function() { test.done(); });
		test.expect(this.tables.length);

		_.each(this.tables, function(table) {
			waitForActiveTable.call(this, table.TableName, function(error) {
				test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
				done();
			});
		}, this);
	}
};


exports.items = {
	setUp: function(done) {
		this.dyndb = new DynDB();
		this.books = dataset.books;
		this.comments = dataset.comments;
		this.tables = dataset.tables;
		done();
	},
	PutItem: function(test) {
		test.expect(1);

		var body = {
			TableName: this.tables[0].TableName,
			Item: this.books[0]
		};
		this.dyndb.request('PutItem', body, function(error, json) {
			test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
			console.log(json);
			test.done();
		});
	},
	GetItem: function(test) {
		test.expect(1);

		var body = {
			TableName: this.tables[0].TableName,
			Key: {
				HashKeyElement: this.books[0].isbn
			},
			ConsistentRead: true
		};
		this.dyndb.request('GetItem', body, function(error, json) {
			test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
			test.done();
		});
	},
	BatchWriteItem: function(test) {
		test.expect(1);

		var body = {
			RequestItems: {
				'DynDB-Books': [
					{
						DeleteRequest: {
							Key: {HashKeyElement: this.books[0].isbn}
						}
					},
					{PutRequest: {Item: this.books[1]}},
					{PutRequest: {Item: this.books[2]}},
					{PutRequest: {Item: this.books[3]}}
				],
				'DynDB-BookComments': [
					{PutRequest: {Item: this.comments[0]}},
					{PutRequest: {Item: this.comments[1]}},
					{PutRequest: {Item: this.comments[2]}},
					{PutRequest: {Item: this.comments[3]}},
					{PutRequest: {Item: this.comments[4]}}
				]
			}
		};

		this.dyndb.request('BatchWriteItem', body, function(error, json) {
			test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
			test.done();
		});
	},
	BatchGetItem: function(test) {
		test.expect(1);

		var body = {
			RequestItems: {
				'DynDB-Books': {
					Keys: [
						{HashKeyElement: this.books[1].isbn},
						{HashKeyElement: this.books[2].isbn},
						{HashKeyElement: this.books[3].isbn}
					]
				}
			}
		};

		this.dyndb.request('BatchGetItem', body, function(error, json) {
			test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
			test.done();
		});
	},
	DeleteItem: function(test) {
		test.expect(1);

		var body = {
			TableName: this.tables[1].TableName,
			Key: {
				HashKeyElement: this.comments[4].isbn,
				RangeKeyElement: this.comments[4].date
			}
		};

		this.dyndb.request('DeleteItem', body, function(error, json) {
			test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
			test.done();
		});
	},
	Query: function(test) {
		test.expect(1);

		var body = {
			TableName: 'DynDB-BookComments',
			HashKeyValue: {N: '9781423103349'},
			RangeKeyCondition: {
				AttributeValueList: [
					{S: new Date(2012, 0, 15)},
					{S: new Date(2012, 0, 16)}
				],
				ComparisonOperator: 'BETWEEN'
			}
		};
		this.dyndb.request('Query', body, function(error, json) {
			test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
			test.done();
		});
	},
	Scan: function(test) {
		test.expect(1);

		var body = {
			TableName: 'DynDB-Books',
			ScanFilter: {
				price: {
					AttributeValueList:[{'N': '6.00'}],
					ComparisonOperator: 'GT'
				}
			}
		};
		this.dyndb.request('Scan', body, function(error, json) {
			test.ok(!error, error && _.isString(error.message) ? error.message : JSON.stringify(error));
			test.done();
		});
	}
};
