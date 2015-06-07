
var sprintf = require('sprintf-js').sprintf;
var config = require('./exusconfig');

var pgplib = require('pg-promise');
var pgp = pgplib({ });

var pg_cnstr = process.env.DATABASE_URL || 
	sprintf("posrgres://%(db_username)s:%(db_passwd)s@%(db_host)s:%(db_port)s/tooyoung", config);

var connection = undefined;

var db_connect = function () {
	connection = pgp(pg_cnstr);	};

var db_close = function () {
	if (connection !== undefined) {
		connection.end();
		connection = undefined;	
	}
};

var db_get = function () { return connection; }

module.exports = {
	db: db_get,
	connect: db_connect,
	close: db_close	
};
