
var express = require('express');
var router = express.Router();

var exusdb = require('../exusdb');
var passport = require('passport');

var redirect_def = function (redirect_url) {
	var redirect_to = redirect_url;
	if (!redirect_to) { redirect_to = '/blog'; }
	return redirect_to;
};

router.get('/register', function (req, res, next) {
	if (req.user) {
		return res.redirect('/blog'); }
	
	res.render('user_register', { layout: 'subpage' }); });

router.get('/login', function (req, res, next) {
	res.render('user_login', {
		layout: 'subpage', redirecturl: req.query.redirecturl }); });

router.post('/login', function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) { return next(err); }
		
		if (!user) { return res.render('user_login', {
			layout: 'subpage',
			failed: true,
			failed_message: info.message,
			last_username: req.body.username,
			redirecturl: req.body.redirecturl
		}); }
		
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
		return res.status(403).send('403: Forbidden');
	} else {
		exusdb.db().none("insert into stakeholder(username, passwd, email, register_time) values ($1, $2, $3, $4)",
			[req.body.username, req.body.passwd, req.body.email, new Date()]).
		then(function () {
			return res.redirect('/user/login');
		}, function (reason) { return res.status(500).send(reason); });
	}
});

router.get('/:id', function (req, res, next) {
	var user_id = parseInt(req.params.id);
	exusdb.db().one('select * from stakeholder where id=$1', [ user_id ])
		.then(function (data) {
			res.render('user_info',
				{ layout: 'subpage', user: data });
		}, function (reason) {
			if (exusdb.error.not_found(reason)) {
				res.status(404).send('404: Page not found'); }
			else { res.send(toString(reason), 500); }
		});
});

module.exports = router;
