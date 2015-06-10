
var express = require('express');
var router = express.Router();

var _ = require('underscore');
var exusdb = require('../exusdb');

router.use(function (req, res, next) {
	var logged_in_class = function () {
		if (req.user === undefined) { return 'has-not-logged-in'; }
		else { return 'has-logged-in'; }
	};
	
	var args = {
		logged_in: !(req.user === undefined),
		logged_in_class: logged_in_class
	};
	if (args.logged_in) {
		args.user = req.user; }
	
	_.extend(res.locals, args);
	next();
});

router.get('/', function (req, res, next) {
	exusdb.db().any("select * from article_username")
		.then(function (data) {
			res.render('blog_index', { articles: data });
		}, function (reason) {
			res.status(500).send('Internal Error!');
		});
});

router.get('/article/:id', function (req, res, next) {
	var args = { };
	args.has_comment = function () { return !(args.comments === undefined); }
	exusdb.db().one("select * from article_detail where id=$1", [ parseInt(req.params.id) ])
		.then(function (data) {
			_.extend(args, data);
			return exusdb.db().many("select * from paragraph where article_id=$1 order by id", [ data.id ]);
		}).then(function (data) {
			args.paragraphs = data;
			return exusdb.db().many("select * from comment_detail where article_id=$1 order by comment_date desc", [ args.id ]);
		}).then(function (data) {
			args.comments = _.filter(data, function (post) { return post.comment_type == 'article'; });
			res.render('blog_article', args);
		}, function (reason) {
			if (exusdb.error.not_found(reason)) {
				res.status(404).send('404: Page not found'); }
			else { res.send(toString(reason), 500); }
		});
});

router.post('/article/:article_id/comment', function (req, res, next) {
	if (req.user) {
		var params = [ parseInt(req.params.article_id), req.user.id, new Date(), req.body.content, 'article' ];
		exusdb.db().none("insert into comment(article_id, commenter_id, comment_date, content, comment_type) values ($1, $2, $3, $4, $5)",
			params).then(function () {
				res.redirect('/blog/article/' + req.params.article_id + '#comments');
			}, function (reason) {
				res.status(500).send(reason);
			});
	} else {
		res.status(403).send('403: Forbidden');
	}
});

module.exports = router;
