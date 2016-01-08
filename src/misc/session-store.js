
'use strict';

var util = require('util');
var exusdb = require('../exusdb');

module.exports = function (session) {

var SessionStore = function () { };
util.inherits(SessionStore, session.Store);

SessionStore.prototype.get = function (sid, callback) {
	exusdb.db().oneOrNone("SELECT * FROM stakeholder_seri WHERE sid=$1", [ sid ])
		.then((data) => data ? 
            callback(null, data['session'])
                :
            callback())
		.catch((err) => callback(err));
};

SessionStore.prototype.set = function (sid, session, callback) {
	var param = [ sid, session, new Date(Date.now() + 1000 * 86400) ];
	exusdb.db().tx((t) =>
		t.batch([
			t.oneOrNone("UPDATE stakeholder_seri SET session=$2, expire=$3 WHERE sid=$1", param),
			t.oneOrNone("INSERT INTO stakeholder_seri (sid, session, expire) SELECT $1, $2, $3 \
						WHERE NOT EXISTS (SELECT 1 FROM stakeholder_seri WHERE sid=$1)", param)
		])
	)
	.then((data) => callback(null))
	.catch((err) => callback(err));
};

SessionStore.prototype.destroy = function (sid, callback) {
	exusdb.db().oneOrNone("DELETE FROM stakeholder_seri WHERE sid=$1 RETURNING sid", [ sid ])
		.then((data) => callback(null))
		.catch((err) => callback(err));
};

// TODO: finish these optional callbacks
//	ref: github.com/expressjs/session
SessionStore.prototype.all = undefined;
SessionStore.prototype.clear = undefined;
SessionStore.prototype.length = undefined;
SessionStore.prototype.touch = undefined;

return SessionStore;

};
