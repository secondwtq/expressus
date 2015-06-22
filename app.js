/// <reference path="typings/node/node.d.ts"/>

'use strict';

var path = require('path');
var config = require('./exusconfig');

var exus_env = {
	
};

var express = require('express');
var app = express();

var exphbs = require('express-handlebars');
var moment = require('moment');
// moment().utcOffset(8);

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

// app.set('views', path.join(__dirname, 'views'));

var hbs = exphbs.create({
	defaultLayout: 'main',
	helpers: {
		plural_auto: function (org, count) {
			if (count > 1) { return org + 's'; }
			return org;
		},
		datefmt: function (fmt, d) {
			return moment(d).format(fmt); },
		daterel: function (d) {
			return moment(d).fromNow(); },
		article_datefmt: function (d) {
			return moment(d).format('L'); },
		comment_datefmt: function (d) {
			return moment(d).format('L'); }
	}
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(logger('dev'));
app.use(cookie_parser());
app.use(body_parser.urlencoded({ extended: true }));
app.use(method_override());

app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

var exusdb = require('./exusdb');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

app.use(session({
	secret: "I'm a secret.",
	rolling: true,
	resave: true,
	maxAge: new Date(Date.now() + 3600000)
}));

exusdb.connect();

passport.use(new LocalStrategy(
	{ usernameField: 'username', passwordField: 'passwd' },
	function (username, passwd, done) {
		exusdb.db().one(
			"select * from stakeholder where username=$1 and passwd=$2", [ username, passwd ]).
		then(function (data) {
			return done(null, data);
		}, function (reason) {
			if (reason.trim() === 'No data returned from the query.') {
				return done(null, false, { message: 'Username and password doesnot match.' });
			} else {
				return done(null, false, { message: reason }); }
		});
	}));

passport.serializeUser(function (user, done) {
	console.log('passport: serializing user ', user.username);
	done(null, user); });
passport.deserializeUser(function (user, done) {
	console.log('passport: deserialize user ', user.username);
	done(null, user); });

app.use(passport.initialize());
app.use(passport.session());

var route_blog = require('./routes/blog');
var route_user = require('./routes/user');
app.use('/blog', route_blog);
app.use('/user', route_user);
app.use('/static', express.static('static'));

var server = app.listen(process.env.PORT || 8000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Listening @ http://%s:%s', host, port);
});
