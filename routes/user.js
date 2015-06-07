
var express = require('express');
var router = express.Router();

var passport = require('passport');

router.get('/register', function (req, res, next) {
	res.render('user_register', { });
});

router.get('/login', function (req, res, next) {
	console.log('user: ', req.user);
	res.render('user_login', { });
});

router.post('/login', function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) { return next(err); }
		if (!user) { return res.render('user_login', { }); }
		req.logIn(user, function (err) {
			if (err) { return next(err); }
			return res.redirect('/blog');
		});
	})(req, res, next);
});

router.post('/login', passport.authenticate('local', function (err, user, info) {
	if (err) { return; }
	
}));

module.exports = router;