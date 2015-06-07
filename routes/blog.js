
var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
	var logged_in_class = function () {
		if (req.user === undefined) return 'has-not-logged-in';
		else return 'has-logged-in';
	};
	res.render('blog_index', { logged_in_class: logged_in_class });
});

module.exports = router;