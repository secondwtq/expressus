
var express = require('express');
var app = express();

// streams
// ROUTING: app.method(path, handler)
// 	methods: get post put head delete ... all
//	(next())
//	string patterns, regexs
app.get('/hello', function (req, res) {
	res.send('Hellor Worlder!'); });

var server = app.listen(8000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Listening @ http://%s:%s', host, port);
});

app.use('/public', express.static('static'));
