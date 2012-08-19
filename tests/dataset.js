exports.books = [
	{
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
	},{
		isbn: {N: '9781423103349'},
		cat: {SS: ['book','paperback']},
		name: {S: 'The Sea of Monsters'},
		author: {S: 'Rick Riordan'},
		series_t: {S: 'Percy Jackson and the Olympians'},
		sequence_i: {N: '2'},
		genre_s: {S: 'fantasy'},
		inStock: {S: 'true'},
		price: {N: '6.49'},
		pages_i: {N: '304'}
	},{
		isbn: {N: '9781857995879'},
		cat: {SS: ['book','paperback']},
		name: {S: 'Sophie\'s World : The Greek Philosophers'},
		author: {S: 'Jostein Gaarder'},
		sequence_i: {N: '1'},
		genre_s: {S: 'fantasy'},
		inStock: {S: 'true'},
		price: {N: '3.07'},
		pages_i: {N: '64'}
	},{
		isbn: {N: '9781933988177'},
		cat: {SS: ['book', 'paperback']},
		name: {S: 'Lucene in Action, Second Edition'},
		author: {S: 'Michael McCandless'},
		sequence_i: {N: '1'},
		genre_s: {S: 'IT'},
		inStock: {S: 'true'},
		price: {N: '30.50'},
		pages_i: {N: '475'}
	}
];

exports.comments = [
	{
		isbn: {N: '9781423103349'},
		date: {S: new Date(2012, 0, 1)},
		comment: {S: 'Comment number 1'}
	}, {
		isbn: {N: '9781423103349'},
		date: {S: new Date(2012, 0, 15)},
		comment: {S: 'Comment number 2'}
	}, {
		isbn: {N: '9781423103349'},
		date: {S: new Date(2012, 0, 16)},
		comment: {S: 'Comment number 3'}
	}, {
		isbn: {N: '9781423103349'},
		date: {S: new Date(2012, 1, 1)},
		comment: {S: 'Comment number 4'}
	}, {
		isbn: {N: '9781857995879'},
		date: {S: new Date(2012, 0, 1)},
		comment: {S: 'Comment number 1'}
	}
];

exports.tables = [{
	TableName: 'DynDB-Books',
	KeySchema: {
		HashKeyElement: {
			AttributeName: 'isbn',
			AttributeType: 'N'
		}
	},
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 10
	}
}, {
	TableName: 'DynDB-BookComments',
	KeySchema: {
		HashKeyElement: {
			AttributeName: 'isbn',
			AttributeType: 'N'
		},
		RangeKeyElement: {
			AttributeName: 'date',
			AttributeType: 'S'
		}
	},
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 10
	}
}];