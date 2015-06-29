
var express = require('express');
var router = express.Router();

var _ = require('underscore');
var exusdb = require('../exusdb');
var user = require('./user');

var marked = require('marked');
marked.setOptions({
	gfm: true, tables: true,
	sanitize: true,
});

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
	exusdb.db().any("select * from article_detail")
		.then(function (data) {
			res.render('blog_index', { articles: data });
		}, function (reason) {
			res.status(500).send('Internal Error!');
		});
});

router.get('/article/post', user.authed, user.req_previlege('post_article'),
	function (req, res, next) {
		res.render('blog_post', { });
	});

router.post('/article/post', function (req, res, next) {
	res.status(500).send('');
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
			var comments_paras = _(data).filter(function (post) { return post.comment_type == 'paragraph'; });
			for (var p in args.paragraphs) {
				args.paragraphs[p].comments = _(comments_paras).filter(function (comment) { return comment.paragraph_id === args.paragraphs[p].id; });
				args.paragraphs[p].comment_count = _(args.paragraphs[p].comments).size();
			}
			res.render('blog_article', args);
		}, function (reason) {
			if (exusdb.error.not_found(reason)) {
				res.status(404).send('404: Page not found'); }
			else { res.send(toString(reason), 500); }
		});
});

router.post('/article/:article_id/paragraph/:paragraph_id/comment', user.authed, function (req, res, next) {
	var parid = parseInt(req.params.paragraph_id);
	if (req.body.use_markdown) {
		req.body.content = marked(req.body.content);
	} else {
		
	}
	var params = [ parseInt(req.params.article_id), req.user.id, new Date(), req.body.content, 'paragraph', parid ];
	exusdb.db().none("insert into comment(article_id, commenter_id, comment_date, content, comment_type, paragraph_id) values ($1, $2, $3, $4, $5, $6)",
		params).then(function () {
			res.redirect('/blog/article/' + req.params.article_id + '#paragraph-' + parid);
		}, function (reason) { res.status(500).send(reason); });
});

router.post('/article/:article_id/comment', user.authed, function (req, res, next) {
	if (req.body.use_markdown) {
		req.body.content = marked(req.body.content);
	} else {
		
	}
	var params = [ parseInt(req.params.article_id), req.user.id, new Date(), req.body.content, 'article' ];
	exusdb.db().none("insert into comment(article_id, commenter_id, comment_date, content, comment_type) values ($1, $2, $3, $4, $5)",
		params).then(function () {
			res.redirect('/blog/article/' + req.params.article_id + '#comments');
		}, function (reason) { res.status(500).send(reason); });
});

module.exports = router;
