
'use strict';

var router = require('express').Router();
var _ = require('lodash');

router.get('/', function (req, res, next) {
	res.render('misc_index', {
		layout: 'lighter',
		'title_': 'too-young.me',
		'forcetitle': true
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

router.get('/about', function (req, res, next) {
	res.render('misc_about', {
		layout: 'lighter',
		'title_': 'About'
	});
});

module.exports = router;
