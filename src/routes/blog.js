
'use strict';

var express = require('express');
var router = express.Router();

var _ = require('lodash');
var exusdb = require('../exusdb');
var user = require('./user');
var config = require('../config');

var xss = require('xss-filters');

var marked = require('marked');
var markdown = require('../misc/markdown');
var model = require('../model/model');
var format = require('../misc/format-ext');

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

router.get('/', (req, res, next) =>
	res.redirect('/blog/article'));

router.get('/article', (req, res, next) =>
	exusdb.db().any('SELECT * FROM "article_detail" \
					WHERE NOT trashed AND NOT indraft \
					ORDER BY post_date DESC')
	.then((data) =>
		res.render('blog_index', {
			'title_': 'Articles',
			'articles': data,
			'show_license': true
		}),
	(reason) => next(_.status(reason, 500))
	)
);

router.get('/article/post',
    model.Auth.Middleware.authed,
    model.Auth.Middleware.requirePrivilege(model.Auth.Privilege.POST_ARTICLE),
	(req, res, next) => res.render('blog_post',
		_.extend(convertUserDescToIndexUserDesc(req.user),
			{
                'title_': 'Post Article',
                'format': 'madoko'
            }
        )
    )
);
	
router.get('/article/draft',
    model.Auth.Middleware.authed,
    model.Auth.Middleware.requirePrivilege(model.Auth.Privilege.POST_ARTICLE),
	function (req, res, next) {
		Promise.all([
			exusdb.db().oneOrNone('SELECT * FROM "stakeholder" WHERE id = $1', [ req.user.id ]),
			exusdb.db().manyOrNone('SELECT * FROM "article_draft" WHERE NOT trashed \
				AND author_id = $1 ORDER BY post_date DESC', [ req.user.id ])
		])
		.then((data) =>
			res.render('blog_index_draft', _.extend(
				convertUserDescToIndexUserDesc(data[0]), { 'title': 'Drafts', 'articles': data[1] })
			)
		)
		.catch((err) => next(_.statusopt(err)));
	});

router.get('/article/:id/delete',
    model.Auth.Middleware.authed,
    function (req, res, next) {
	var id = parseInt(req.params['id']);
	res.render('blog_confirm_delete', {
		'layout': 'subpage', 'id': id,
		'title_': 'Delete Article',
		'title': 'Delete Article',
		'message': 'Really Delete?',
		'action': `/blog/article/${id}/delete`,
		'redirecturl': req.query['redirecturl'],
		'backurl': req.query['backurl']
	});
});

router.post('/article/:id/delete', model.Auth.Middleware.authed,
    function (req, res, next) {
	var id = parseInt(req.params['id']);
	if (req.body['confirmed'] != 'on') {
		res.render('blog_confirm_delete', {
			'layout': 'subpage', 'id': id,
			'title_': 'Delete Article',
			'title': 'Delete Article',
			'message': 'Really Delete?',
			'action': `/blog/article/${id}/delete`,
			'redirecturl': req.body['redirecturl'],
			'backurl': req.body['backurl']
		});
	} else {
		exusdb.db().oneOrNone('UPDATE "article" SET trashed = TRUE WHERE id = $1 AND author_id = $2 RETURNING id',
			[ id, req.user.id ])
		.then((id) => (id !== null) ? res.redirect(req.body['redirecturl']) : 
			next(_.throw(404, 'no such entry or invalid user')));
	}
});

router.get('/article/:id/draft', model.Auth.Middleware.authed,
    function (req, res, next) {
	var id = parseInt(req.params['id']);
	exusdb.db().oneOrNone('SELECT * from "article_draft" WHERE id = $1 AND author_id = $2', [ id, req.user['id'] ])
	.then((data) => (data === null) ? 
		next(_.throw(404, 'no such entry or invalid user'))
		:
		res.render('blog_post', 
			// TODO: get the correct user?
			_.extend(convertUserDescToIndexUserDesc(req.user), {
				'indraft': true,
				'title_': 'Edit Draft',
				'id': data['id'],
				'title': data['title'],
				'subtitle': data['subtitle'],
				'summary': data['summary'],
				'content': data['content'],
                'format': data['format'],
                'create_date': data['create_date']
			})
		)
	).catch((err) => console.log(err));
});

// UPDATE A DRAFT
router.post('/article/:id/draft', model.Auth.Middleware.authed,
    function (req, res, next) {
	var id = parseInt(req.params['id']);
	exusdb.db().tx(function (t) {
		return t.oneOrNone('UPDATE "article" SET title = $3, subtitle = $4, summary = $5 WHERE id = $1 AND author_id = $2 \
			AND indraft = TRUE RETURNING id', [ id, req.user['id'], req.body['title'], req.body['subtitle'], req.body['summary'] ])
		.then(function (id) {
			if (id === null) {
				return next(_.throw(404, 'no such entry or invalid user')); }
			return t.none('UPDATE "draft" SET content = $2, format = $3 WHERE article_id = $1',
                [ parseInt(id['id']), req.body['content'], req.body['format'] ]);
		});
	})
	.then(() => res.redirect('/blog/article/draft'))
	.catch((err) => next(_.statusopt(err)));
});

// post a draft to article
router.post('/article/:id/postdraft', 
    model.Auth.Middleware.authed,
    model.Auth.Middleware.requirePrivilege(model.Auth.Privilege.POST_ARTICLE),
	function (req, res, next) {
		var id = parseInt(req.params['id']);
		exusdb.db().tx(function (t) {
			return t.oneOrNone('SELECT * FROM "article_draft" WHERE id = $1 AND author_id = $2', [ id, req.user['id'] ])
				.then((article) => (article === null) ? 
					next(_.throw(404, 'no such entry or invalid user'))
					:
					format.splitAsyncForFormat(req.body['format'])(req.body['content'], 'article')
					.then((paras) =>
						t.batch(_.map(paras, (para) =>
							t.none('INSERT INTO "paragraph" (article_id, content) VALUES ($1, $2)', [ id, para ])
						))
					).catch((err) => _.throw(400, err.toString()))
				)
				// update the draft too so we can recover
				//	 the Markdown (or sth.) content later
				.then(() => 
					t.none('UPDATE "draft" SET content = $2, format = $3 WHERE article_id = $1',
						[ id, req.body['content'], req.body['format'] ]))
				.then(() =>
					t.oneOrNone('UPDATE "article" SET title = $3, subtitle = $4, summary = $5, indraft = FALSE, post_date = $6 \
								WHERE id = $1 AND author_id = $2 RETURNING id',
					[ id, req.user['id'], req.body['title'], req.body['subtitle'], req.body['summary'], new Date() ])
				).catch((err) => console.log(err));
		}).then((id) => res.redirect(`/blog/article/${id['id']}`))
		.catch((err) => console.log(err));
	});

// create draft
router.post('/article/draft',
    model.Auth.Middleware.authed,
    model.Auth.Middleware.requirePrivilege(model.Auth.Privilege.POST_ARTICLE),
	function (req, res, next) {
		exusdb.db().tx((t) =>
			t.oneOrNone('INSERT INTO "article" (author_id, post_date, title, subtitle,\
				summary, indraft) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id',
				[ req.user['id'], new Date(), req.body['title'], req.body['subtitle'], req.body['summary'] ]
			)
			.then((id) => t.oneOrNone('INSERT INTO "draft" (article_id, content, format, create_date) \
				VALUES ($1, $2, $3, $4) RETURNING article_id',
                [ id['id'], req.body['content'], req.body['format'], new Date() ])
			)
		).then((id) => res.redirect(`/blog/article/draft`))
		.catch((err) => console.log(err));
	});

// post article - direct
router.post('/article/post',
    model.Auth.Middleware.authed,
    model.Auth.Middleware.requirePrivilege(model.Auth.Privilege.POST_ARTICLE),
    function (req, res, next) {
	exusdb.db().tx((t) =>
		t.one('INSERT INTO "article" (author_id, post_date, title, subtitle, summary) \
			VALUES ($1, $2, $3, $4, $5) RETURNING id', 
			[ req.user['id'], new Date(), req.body['title'], req.body['subtitle'], req.body['summary'] ])
		.then((id_) => {
			var id = parseInt(id_['id']);
            format.splitAsyncForFormat(req.body['format'])(req.body['content'], 'article')
			.then((paras) => {
                if (!paras.length) { throw new Error('no content in this post'); }
				t.batch(_.map(paras, (para) =>
					t.none('INSERT INTO "paragraph" (article_id, content) VALUES ($1, $2)', [ id, para ])
				))
            }
			).catch((err) => _.throw(400, err.toString()));
			return Promise.resolve(id);
		})
	)
	.then((id) => res.redirect(`/blog/article/${id}`))
	.catch((err) => console.log(err));
});

router.get('/article/:id', function (req, res, next) {
	var args = { 'show_license': true };
	args.has_comment = () => !(args.comments === undefined);
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
			args.comments = _.filter(data, (post) => (post.comment_type == 'article'));
			var comments_paras = _.filter(data, (post) => (post.comment_type == 'paragraph'));
			for (var p in args.paragraphs) {
				args.paragraphs[p].comments = _.filter(comments_paras, 
					(comment) => (comment.paragraph_id === args.paragraphs[p].id));
				args.paragraphs[p].comment_count = _(args.paragraphs[p].comments).size();
			}
			res.render('blog_article', _.extend(args, { 'title_': args['title'] }));
		})
		.catch((err) => next(_.statusopt(err)));
});

// POST paragraph comment
router.post('/article/:article_id/paragraph/:paragraph_id/comment', model.Auth.Middleware.authed, function (req, res, next) {
	marked.setOptions(config['comment']);
	var parid = parseInt(req.params.paragraph_id);
	var content = req.body['use_markdown'] ? 
		marked(req.body['content']) : 
		xss.inHTMLData(req.body['content']);
	var params = [ parseInt(req.params.article_id), req.user.id, new Date(), content, 'paragraph', parid ];
	exusdb.db().none("insert into comment(article_id, commenter_id, comment_date, content, comment_type, paragraph_id) values ($1, $2, $3, $4, $5, $6)",
		params).then(() => res.redirect('/blog/article/' + req.params.article_id + '#paragraph-' + parid),
		(reason) => next(_.statusopt(reason)));
});

// POST article comment
router.post('/article/:article_id/comment', model.Auth.Middleware.authed, function (req, res, next) {
	marked.setOptions(config['comment']);
	var content = req.body['use_markdown'] ? 
		marked(req.body['content']) : 
		xss.inHTMLData(req.body['content']);
	var params = [ parseInt(req.params.article_id), req.user.id, new Date(), content, 'article' ];
	exusdb.db().none("insert into comment(article_id, commenter_id, comment_date, content, comment_type) values ($1, $2, $3, $4, $5)",
		params).then(() => res.redirect('/blog/article/' + req.params.article_id + '#comments'),
		(reason) => next(_.statusopt(reason)));
});

module.exports = router;
