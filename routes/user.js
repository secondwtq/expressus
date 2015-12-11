
'use strict';

var express = require('express');
var router = express.Router();

var _ = require('lodash');
var passport = require('passport');

var bcrypt = require('bcrypt');

var exusdb = require('../exusdb');
var config = require('../exusconfig');

var allowed_setting_field = [ 'title', 'displayname' ];
var privilege_user_update = [ 'admin' ];

var privilieges = {
	all_user_update: [ 'admin' ],
	post_article: [ 'admin', 'foundation' ]	
};

var redirect_def = function (redirect_url) {
	var redirect_to = redirect_url;
	if (!redirect_to) { redirect_to = '/blog'; }
	return redirect_to;
};

var authed = function (req, res, next) {
	if (req.user) {
		return next(); }
	var redir = req.query.redirecturl || req.body.redirecturl || req.originalUrl;
	res.redirect('/user/login?redirecturl=' + redir);
};

var has_privilege = function (user, privilege) {
	if (!user) { return false; }
	return (_(privilieges[privilege]).contains(user.privilege));
};

var req_privilege = function (privilege) {
	return function (req, res, next) {
		var redir = req.query.redirecturl || req.body.redirecturl || req.path;
		if (!req.user) {
			return res.redirect('/user/login?redirecturl=' + redir); }
		if (has_privilege(req.user, privilege)) { return next(); }
		return res.status(403).send('403: Forbidden');
	};
};

router.get('/register', function (req, res, next) {
	if (req.user) {
		return res.redirect('/blog'); }
	
	res.render('user_register', {
		layout: 'subpage',
		'title_': 'Register'
	});
});

router.get('/login', function (req, res, next) {
	res.render('user_login', {
		layout: 'subpage',
		'title_': 'Login',
		redirecturl: req.query.redirecturl
	});
});

router.post('/login', function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) { return next(err); }
		
		if (!user) {
			return res.render('user_login', {
				layout: 'subpage',
				'title_': 'Login',
				failed: true,
				failed_message: info.message,
				last_username: req.body.username,
				redirecturl: req.body.redirecturl
			});
		}
		
		req.login(user, function (err) {
			if (err) { return next(err); }
			return res.redirect(redirect_def(req.body.redirecturl));
		});
	})(req, res, next);
});

router.post('/logout', function (req, res, next) {
	if (req.user) {
		req.logout();
		return res.redirect(redirect_def(req.body.redirecturl));
	} else {
		
	}
});

router.post('/register', function (req, res, next) {
	if (req.user) {
		return res.status(403).send('403: Forbidden'); }
	bcrypt.genSalt(10, function (err, salt) {
		if (err) { return next(err); }
		bcrypt.hash(req.body.passwd, salt, (err, hashed) => (err) ? next(err) :  
			exusdb.db().none("INSERT INTO stakeholder(username, passwd, email, register_time, avatar) VALUES ($1, $2, $3, $4, $5)",
				[req.body.username, hashed, req.body.email, new Date(), config['blog']['default_avatar']])
			.then(() => res.redirect('/user/login'),
				(reason) => res.status(500).send(reason))
		);
	});
});

var can_modify_settings = function (user, target_id) {
	if (user === undefined) { return false; }
	return user.id == target_id || _(privilege_user_update).contains(user.privilege); };

router.get('/:id', function (req, res, next) {
	var user_id = parseInt(req.params.id);
	exusdb.db().one('select * from stakeholder where id=$1', [ user_id ])
		.then(function (data) {
			res.render('user_info', {
				layout: 'subpage', user: data,
				display_settings: can_modify_settings(req.user, user_id),
				'title_': `User ${data['username']}`
			});
		}, function (reason) {
			if (exusdb.error.not_found(reason)) {
				res.status(404).send('404: Page not found'); }
			else { res.send(toString(reason), 500); }
		});
});

router.get('/:id/settings', authed, function (req, res, next) {
	var user_id = parseInt(req.params.id);
	if (!can_modify_settings(req.user, user_id)) {
		return res.status(403).send('403:Forbidden'); }
	exusdb.db().one('select * from stakeholder where id=$1', [ user_id ])
		.then(function (data) {
			res.render('user_settings', {
				layout: 'subpage',
				user: data,
				'title_': `Settings of ${data['username']}`
			});
		}, function (reason) {
			if (exusdb.error.not_found(reason)) {
				res.status(404).send('404: Page not found'); }
			else { res.send(toString(reason), 500); }
		});
});

router.post('/:id/settings', authed, function (req, res, next) {
	var user_id = parseInt(req.params.id);
	if (!can_modify_settings(req.user, user_id)) {
		return res.status(403).send('403:Forbidden'); }
	exusdb.db().none('update stakeholder set displayname=$2, title=$3, showemail=$4 where id=$1', 
		[ user_id, req.body.displayname, req.body.title, req.body['publicemail'] || false ]).then(function (data) {
			res.redirect('/user/' + user_id + '/settings');
		}, function (reason) {
			if (exusdb.error.not_found(reason)) {
				res.status(404).send('404: Page not found'); }
			else { res.send(toString(reason), 500); }
		});
});

module.exports = {
	router,
	authed,
	has_privilege,
	req_privilege
};
