
'use strict';

var router = require('express').Router();
var RSS = require('rss');
var exusdb = require('../exusdb');
var config = require('../config');
var _ = require('lodash');
var sprintf = require('sprintf-js').sprintf;

router.get('/', function (req, res, next) {
	var feed = new RSS(config['rss']['meta']);
	exusdb.db().manyOrNone('SELECT * FROM "article_detail" \
					WHERE NOT trashed AND NOT indraft \
					ORDER BY post_date DESC LIMIT $1',
					[ config['rss']['numItem'] ])
	.then((data) => _.forEach(data, function (item) {
			var url = sprintf(config['rss']['urlfmt'], { 'id': item['id'] });
			feed.item({
				'title': item['title'],
				'description': item['summary'],
				'url': url, 'guid': url,
				'author': item['username'],
				'date': item['post_date']
			});
		})
	).then(() =>
		// application/xml or text/xml?
		res.contentType('application/xml').send(feed.xml())
	);
});

module.exports = router;
