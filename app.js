/// <reference path="typings/node/node.d.ts"/>

var path = require('path');
var config = require('./exusconfig');

var exus_env = {
	
};

var express = require('express');
var app = express();

var logger = require('morgan');
var cookie_parser = require('cookie-parser');
var session = require('express-session');
var body_parser = require('body-parser');
var method_override = require('method-override');

// streams
// ROUTING: app.method(path, handler)
// 	methods: get post put head delete ... all
//	(next())
//	string patterns, regexs
app.get('/hello', function (req, res) {
	res.send('Hellor Worlder!'); });

// var basicAuth = require('basic-auth-connect');
// app.use(basicAuth('testUser', 'testPass'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(logger('dev'));
app.use(cookie_parser());
app.use(body_parser.urlencoded({ extended: true }));
app.use(method_override());

app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

var route_blog = require('./routes/blog');
var route_user = require('./routes/user');
app.use('/blog', route_blog);
app.use('/user', route_user);
app.use('/static', express.static('static'));

var exusdb = require('./exusdb');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

app.use(session({ secret: "I'm a secret.", cookie: { maxAge: 60000 } }));
app.use(passport.initialize());
app.use(passport.session());

exusdb.connect();

passport.use('local', new LocalStrategy(function (username, passwd, done) {
	console.log('passport - local: authing user ', username);
	exusdb.db().one(
		"select * from stakeholder where username=$1 and passwd=$2",[username, passwd]).
	then(function (data) {
		console.log('done');
		return done(null, data);
	}, function (reason) {
		if (reason.trim() === 'No data returned from the query.') {
			return done(null, false, { message: 'Username and password doesnot match.' });
		} else {
			return done(null, false, { message: reason }); }
	});
}));

passport.serializeUser(function (user, done) {
	console.log('passport: serializing user ', user);
	done(null, user);
	// var args = [user.username, user.passwd, user.displayname, user.email, user.register_time];
	// exusdb.db().one(
	// 	"insert into stakeholder (username, passwd, displayname, email, register_time) values ($1, $2, $3, $4, $5) returning id",
	// 	args).then(function(data) {
	// 		console.log("User Serialized: ", data.id, data.username);
	// 		done(null, user);
	// 	}, function (reason) {
	// 		console.log("User Serialize Failed: ", reason);
	// 		done(reason, user);
	// 	});
});

passport.deserializeUser(function (user, done) {
	console.log('passport: deserialize user ', user);
	done(null, user);
	// exusdb.db().one(
	// 	"select * from stakeholder where username=$1 and passwd=$2",
	// 	[user.username, user.passwd]).then(function (data) {
			
	// 	}, function (reason) {
			
	// 	});
});

var server = app.listen(process.env.PORT || 8000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Listening @ http://%s:%s', host, port);
});
