
'use strict';

var express = require('express');
var router = express.Router();

var _ = require('lodash');
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

_.mixin({
	'status': function (err, status) {
		return _.extend(err, { 'status': status || 500 }); },
	'statusopt': function (err, status) {
		return (err['status'] !== undefined) ? err : _.status(err, status);	},
	'throw': function (status, message, obj) {
		obj = obj || { };
		return _.extend({ message, status }, obj); }
});

function convertUserDescToIndexUserDesc(src) {
	return {
		'author_id': src['id'],
		'username': src['username'],
		'avatar': src['avatar'],
		'user_title': src['title'],
		'user_displayname': src['displayname']
	};
}

var cheerio = require('cheerio');

function markAndSplit(source) {
	var $ = cheerio;
	var $$ = $.load(`<div id="outermost">${marked(source)}</div>`)('#outermost > *');
	var last_child = $('<div></div>');
	var paragraphs = [ ];
	$$.each((index, element) => {
		var tag = element.tagName;
		last_child.append(element);
		if (tag == 'p' || tag == 'ul' || tag == 'ol' || tag == 'pre') {
			paragraphs.push(last_child.html());
			var new_element = $('<div></div>');
			last_child = new_element;
		}
	});
	return paragraphs;
}

router.get('/', (req, res, next) =>
	exusdb.db().any('SELECT * FROM "article_detail" WHERE NOT trashed AND NOT indraft ORDER BY post_date DESC')
		.then((data) => res.render('blog_index', { articles: data }),
			(reason) => next(_.status(reason, 500)))
);

router.get('/article/post', user.authed, user.req_previlege('post_article'),
	(req, res, next) => res.render('blog_post', { }));
	
router.get('/article/draft', user.authed, user.req_previlege('post_article'),
	function (req, res, next) {
		Promise.all([
			exusdb.db().oneOrNone('SELECT * FROM "stakeholder" WHERE id = $1', [ req.user.id ]),
			exusdb.db().manyOrNone('SELECT * FROM "article_draft" WHERE NOT trashed \
				AND author_id = $1 ORDER BY post_date DESC', [ req.user.id ])
		])
		.then((data) =>
			res.render('blog_index_draft', _.extend(
				convertUserDescToIndexUserDesc(data[0]), { 'articles': data[1] })
			)
		)
		.catch((err) => next(_.statusopt(err)));
	});

router.get('/article/:id/delete', user.authed, function (req, res, next) {
	var id = parseInt(req.params['id']);
	res.render('blog_confirm_delete', { 'layout': 'subpage', 'id': id });
});

router.post('/article/:id/delete', user.authed, function (req, res, next) {
	var id = parseInt(req.params['id']);
	if (req.body['confirmed'] != 'on') {
		res.render('blog_confirm_delete', { 'layout': 'subpage', 'id': id });
	} else {
		exusdb.db().oneOrNone('UPDATE "article" SET trashed = TRUE WHERE id = $1 AND author_id = $2 RETURNING id',
			[ id, req.user.id ])
		.then((id) => (id !== null) ? res.redirect('/blog') : 
			next(_.throw(404, 'no such entry or invalid user')));
	}
});

router.get('/article/:id/draft', user.authed, function (req, res, next) {
	var id = parseInt(req.params['id']);
	exusdb.db().oneOrNone('SELECT * from "article_draft" WHERE id = $1 AND author_id = $2', [ id, req.user['id'] ])
	.then((data) => (data === null) ? 
		next(_.throw(404, 'no such entry or invalid user'))
		:
		res.render('blog_post', {
			'indraft': true,
			'id': data['id'],
			'title': data['title'],
			'subtitle': data['subtitle'],
			'summary': data['summary'],
			'content': data['content']
		})
	).catch((err) => console.log(err));
});

router.post('/article/:id/draft', user.authed, function (req, res, next) {
	var id = parseInt(req.params['id']);
	exusdb.db().tx(function (t) {
		return t.oneOrNone('UPDATE "article" SET title = $3, subtitle = $4, summary = $5 WHERE id = $1 AND author_id = $2 \
			AND indraft = TRUE RETURNING id', [ id, req.user['id'], req.body['title'], req.body['subtitle'], req.body['summary'] ])
		.then(function (id) {
			if (id === null) {
				return next(_.throw(404, 'no such entry or invalid user')); }
			return t.none('UPDATE "draft" SET content = $2 WHERE article_id = $1', [ parseInt(id['id']), req.body['content'] ]);
		});
	})
	.then(() => res.redirect('/blog/article/draft'))
	.catch((err) => next(_.statusopt(err)));
});

router.post('/article/:id/post', user.authed, function (req, res, next) {
	
});

router.post('/article/draft', user.authed, user.req_previlege('post_article'),
	function (req, res, next) {
		exusdb.db().tx((t) =>
			t.oneOrNone('INSERT INTO "article" (author_id, post_date, title, subtitle,\
				summary, indraft) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id',
				[ req.user['id'], new Date(), req.body['title'], req.body['subtitle'], req.body['summary'] ]
			)
			.then((id) => t.oneOrNone('INSERT INTO "draft" (article_id, content) \
				VALUES ($1, $2) RETURNING article_id', [ id['id'], req.body['content'] ])
			)
		).then((id) => res.redirect(`/blog/article/draft`))
		.catch((err) => console.log(err));
	});

// post article - direct
router.post('/article/post', user.authed, user.req_previlege('post_article'), function (req, res, next) {
	var id;
	exusdb.db().tx((t) =>
		t.one('INSERT INTO "article" (author_id, post_date, title, subtitle, summary) \
			VALUES ($1, $2, $3, $4, $5) RETURNING id', 
			[ req.user['id'], new Date(), req.body['title'], req.body['subtitle'], req.body['summary'] ])
		.then((id_) =>
			t.batch(_.map(markAndSplit(req.body['content']), (para) => t.none('INSERT INTO "paragraph" \
				(article_id, content) VALUES ($1, $2)', [ (id = parseInt(id_['id'])), para ])))
		)
	)
	.then(() => res.redirect(`/blog/article/${id}`))
	.catch((err) => console.log(err));
});

router.get('/article/:id', function (req, res, next) {
	var args = { };
	args.has_comment = function () { return !(args.comments === undefined); }
	exusdb.db().oneOrNone("SELECT * FROM article_detail WHERE id=$1 AND NOT trashed", [ parseInt(req.params.id) ])
		.then(function (data) {
			if (data === null) { throw _.throw(404, 'article not found or removed'); }
			_.extend(args, data);
			return exusdb.db().manyOrNone("select * from paragraph where article_id=$1 order by id", [ data.id ]);
		}).then(function (data) {
			if (!data.length) { throw _.throw(404, 'article not found or in draft'); }
			args.paragraphs = data;
			return exusdb.db().manyOrNone('SELECT * FROM "comment_detail" WHERE article_id=$1 ORDER BY comment_date DESC', [ args.id ]);
		}).then(function (data) {
			args.comments = _.filter(data, function (post) { return post.comment_type == 'article'; });
			var comments_paras = _(data).filter(function (post) { return post.comment_type == 'paragraph'; });
			for (var p in args.paragraphs) {
				args.paragraphs[p].comments = _(comments_paras).filter(function (comment) { return comment.paragraph_id === args.paragraphs[p].id; });
				args.paragraphs[p].comment_count = _(args.paragraphs[p].comments).size();
			}
			res.render('blog_article', args);
		})
		.catch((err) => next(_.statusopt(err)));
});

router.post('/article/:article_id/paragraph/:paragraph_id/comment', user.authed, function (req, res, next) {
	var parid = parseInt(req.params.paragraph_id);
	if (req.body.use_markdown) {
		req.body.content = marked(req.body.content);
	} else {
		// TODO: sanitize text content
	}
	var params = [ parseInt(req.params.article_id), req.user.id, new Date(), req.body.content, 'paragraph', parid ];
	exusdb.db().none("insert into comment(article_id, commenter_id, comment_date, content, comment_type, paragraph_id) values ($1, $2, $3, $4, $5, $6)",
		params).then(() => res.redirect('/blog/article/' + req.params.article_id + '#paragraph-' + parid),
		(reason) => next(_.statusopt(reason)));
});

router.post('/article/:article_id/comment', user.authed, function (req, res, next) {
	if (req.body.use_markdown) {
		req.body.content = marked(req.body.content);
	} else {
		// TODO: sanitize text content
	}
	var params = [ parseInt(req.params.article_id), req.user.id, new Date(), req.body.content, 'article' ];
	exusdb.db().none("insert into comment(article_id, commenter_id, comment_date, content, comment_type) values ($1, $2, $3, $4, $5)",
		params).then(() => res.redirect('/blog/article/' + req.params.article_id + '#comments'),
		(reason) => next(_.statusopt(reason)));
});

module.exports = router;
