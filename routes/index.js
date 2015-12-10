
'use strict';

var router = require('express').Router();
var _ = require('lodash');
var config = require('../exusconfig');
var fs = require('fs');

router.get('/', function (req, res, next) {
	res.render('misc_index', {
		layout: 'lighter',
		'title_': 'too-young.me',
		'forcetitle': true,
		'user': req.user
	});
});

router.get('/project', function (req, res, next) {
	res.render('misc_onconstruct', {
		layout: 'subpage',
		'title_': 'Projects'
	});
});

router.get('/service', function (req, res, next) {
	res.render('misc_onconstruct', {
		layout: 'subpage',
		'title_': 'Services'
	});
});

var _cache_gpgkey = null;

router.get('/about', function (req, res, next) {
	var keyfile = config['misc']['gpgkey_file'];
	(new Promise((resolve, reject) =>
		(_cache_gpgkey !== null) ?
			resolve(_cache_gpgkey) :
			fs.readFile(keyfile, 'utf8', (err, data) =>
				err ? reject(err) :
					resolve(data)))
	).then((data) =>
		res.render('misc_about', {
			layout: 'lighter',
			'title_': 'About',
			'gpgkey_url': config['misc']['gpgkey_url'],
			'gpgkey_content': data
		})
	).catch((err) => console.log(err));
});

module.exports = router;
