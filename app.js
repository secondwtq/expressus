/// <reference path="typings/node/node.d.ts"/>

var path = require('path');

var exus_env = {
	
};

var express = require('express');
var app = express();

// streams
// ROUTING: app.method(path, handler)
// 	methods: get post put head delete ... all
//	(next())
//	string patterns, regexs
app.get('/hello', function (req, res) {
	res.send('Hellor Worlder!'); });

// var basicAuth = require('basic-auth-connect');
// app.use(basicAuth('testUser', 'testPass'));

var logger = require('morgan');
var cookie_parser = require('cookie-parser');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(logger('dev'));
app.use(cookie_parser("I'm a secret."));

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
