
var express = require('express');
var router = express.Router();

var exusdb = require('../exusdb');
var passport = require('passport');

var redirect_def = function (redirect_url) {
	var redirect_to = redirect_url;
	if (!redirect_to) { redirect_to = '/blog'; }
	return redirect_to;
}

router.get('/register', function (req, res, next) {
	if (req.user) {
		return res.redirect('/blog'); }
	
	res.render('user_register', { layout: 'subpage' }); });
	
router.post('/register', function (req, res, next) {
	if (req.user) {
		return res.redirect('/blog'); }
});

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
			last_username: req.body.username
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