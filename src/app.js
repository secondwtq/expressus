/// <reference path="typings/node/node.d.ts"/>

'use strict';

var path = require('path');
var config = require('./config');

var exus_env = { };

var express = require('express');
var app = express();

var exphbs = require('express-handlebars');
var moment = require('moment');
var _ = require('lodash');
// moment().utcOffset(8);

var util = require('util');

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

app.set('views', path.join(__dirname, 'views'));
var hbs = exphbs.create({
	layoutsDir: path.join(__dirname, 'views/layouts'),
	partialsDir: path.join(__dirname, 'views/partials'),
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
			return moment(d).format('L'); },
		strcat: function () {
			return String.prototype.concat.apply('', 
				Array.prototype.slice.call(arguments, 0, -1)); },
		ifeq: function (lhs, rhs, opts) {
			if (lhs == rhs) {
				return opts.fn(this);
			} else { return opts.inverse(this); }
		},
		has_privilege: function (user, privilege, options) {
			if (require('./routes/user')['has_privilege'](user, privilege)) {
				return options.fn(this); }
		}
	}
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(logger('dev'));
app.use(cookie_parser());
app.use(body_parser.urlencoded({ extended: true }));
app.use(method_override());

// app.use(function (err, req, res, next) {
// 	console.error(err.stack);
// 	res.status(500).send('Something broke!');
// });

var exusdb = require('./exusdb');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var SessionStore = require('./misc/session-store')(session);

exusdb.connect();

app.use(session({
	secret: "I'm a secret.",
	rolling: true,
	resave: true,
	maxAge: new Date(Date.now() + 3600000),
	'store': new SessionStore()
}));

var bcrypt = require('bcrypt');
passport.use(new LocalStrategy(
	{ usernameField: 'username', passwordField: 'passwd' },
	function (username, passwd, done) {
		exusdb.db().one(
			"SELECT * FROM stakeholder WHERE username=$1", [ username ]
		).then((data) => bcrypt.compare(passwd, data['passwd'], (err, result) =>
			(err || (!result)) ? done(null, false, { message: 'Username and password doesn\'t match.' }) : done(null, data)
		), (reason) =>
			(reason['message'].trim() === 'No data returned from the query.') ?
					done(null, false, { message: 'Username and password doesnot match.' })
					: done(null, false, { message: 'Unknown error' })
		);
	}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
	res.locals['NODE_ENV'] = process.env['NODE_ENV'];
	res.locals['node_env_production'] = (process.env['NODE_ENV'] == 'production');
	next();
});

app.use('/blog', require('./routes/blog'));
app.use('/user', require('./routes/user').router);
app.use('/', require('./routes/index'));

app.use('/feed', require('./routes/feed'));

app.use('/static', express.static('static'));

var errorHandler = require('./error_handler');
app.use(errorHandler.pageNotFound);
app.use(errorHandler.log);
app.use(errorHandler.page);

var server = app.listen(process.env['PORT'] || 8000, process.env['HOST'] || '0.0.0.0',
	function () {
		console.log(`Listening @ http://${server.address().address}:${server.address().port}`);
		var env_str = process.env['NODE_ENV'];
		if (env_str === undefined) {
			env_str = 'development'; }
		process.env['NODE_ENV'] = env_str;
		console.log(`Running under '${env_str}' (${app.get('env')}).`);
	}
);
