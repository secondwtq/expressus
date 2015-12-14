
var sprintf = require('sprintf-js').sprintf;
var config = require('./config');
var pgplib = require('pg-promise');
var monitor = require('pg-monitor');

var options = { };

monitor.attach(options);
var pgp = pgplib(options);

var pg_cnstr = process.env.DATABASE_URL || 
	sprintf("postgres://%(username)s:%(passwd)s@%(host)s:%(port)s/%(name)s", config['db']);

var connection = undefined;

var db_connect = function () {
	connection = pgp(pg_cnstr);	};

var db_close = function () {
	if (connection !== undefined) {
		connection.end();
		connection = undefined;	
	}
};

var db_get = function () { return connection; };

module.exports = {
	db: db_get,
	connect: db_connect,
	close: db_close,
	error: {
		not_found: function (reason) {
			return (reason.trim() === 'No data returned from the query.'); }
	}
};
