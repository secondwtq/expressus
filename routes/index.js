
'use strict';

var router = require('express').Router();
var _ = require('lodash');

router.get('/', function (req, res, next) {
	res.render('misc_index', {
		layout: 'lighter'
	});
});

router.get('/project', function (req, res, next) {
	res.render('misc_onconstruct', {
		layout: 'subpage'
	});
});

router.get('/service', function (req, res, next) {
	res.render('misc_onconstruct', {
		layout: 'subpage'
	});
});

router.get('/about', function (req, res, next) {
	res.render('misc_about', {
		layout: 'lighter'
	});
});

module.exports = router;
