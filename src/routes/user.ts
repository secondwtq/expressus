
import { Router, Request, Response, RequestHandler } from 'express';
export var router = Router();
import { authenticate } from 'passport';
import * as _ from 'lodash';
import { compare, genSalt, hash } from 'bcrypt';

import * as config from '../config';
import { emit403, emit404, emit500 } from '../misc/error-handler'; 
import { db, error as dbError } from '../exusdb';

import { Model, Auth } from '../model/model';

function canCurrentUserModifySetting(req: Request, res: Response, next: Function) {
    req.params['id'] = parseInt(req.params['id']);
    if (!Auth.canUserModifySettingOf(req.user, req.params['id'])) {
        next(emit403());
    } else { next(); }
}

router.get('/register',
    Auth.Middleware.notAuthed,
    (req, res, next) =>
        res.render('user_register', {
            layout: 'subpage',
            'title_': 'Register'
        })
);

router.get('/login',
    Auth.Middleware.notAuthed,
    (req, res, next) =>
        res.render('user_login', {
            layout: 'subpage',
            'title_': 'Login',
            redirecturl: req.query['redirecturl']
        })
);

router.post('/login',
    Auth.Middleware.notAuthed,
    (req, res, next) =>
        authenticate('local', function (err, user: Model.User, info) {
            if (err) { return next(err); }
            if (!user) {
                return res.render('user_login', {
                    layout: 'subpage',
                    'title_': 'Login',
                    'failed': true, 'failed_message': info.message,
                    'last_username': req.body['username'],
                    'redirecturl': req.body['redirecturl']
                });
            }
            
            req.login(user, function (err) {
                if (err) { return next(err); }
                return res.redirect(req.body['redirecturl'] || '/blog');
            });
        }) (req, res, next)
);

router.post('/logout',
    Auth.Middleware.authed,
    (req, res, next) => {
        req.logout();
        res.redirect(req.body['redirecturl'] || '/blog');
    }
);

router.post('/register',
    Auth.Middleware.notAuthed, 
    (req, res, next) =>
        genSalt(10, function (err, salt) {
            if (err) { return next(err); }
            hash(req.body['passwd'], salt, (err, hashed) => (err) ? next(err)
                :
                db().none("INSERT INTO stakeholder(username, passwd, email, register_time, avatar) VALUES ($1, $2, $3, $4, $5)",
                    [ req.body['username'], hashed, req.body['email'], new Date(), config['blog']['default_avatar'] ])
                .then(() => res.redirect('/user/login'),
                    (reason) => next(reason))
            );
        })
);

router.get('/:id',
async function (req, res, next) {
    req.params['id'] = parseInt(req.params['id']);
    var user = await db().oneOrNone<Model.User>('SELECT * FROM stakeholder WHERE id=$1',
        [ req.params['id'] ]);
    if (user === null) {
        return next(emit404('user not found')); }
    res.render('user_info', {
        layout: 'subpage',
        user,
        'display_settings': Auth.canUserModifySettingOf(req.user, req.params['id']),
        'title_': `User ${user.username}`
    });
});

router.get('/:id/settings',
    Auth.Middleware.authed,
    canCurrentUserModifySetting,
    async function (req, res, next) {
        var user = await db().oneOrNone<Model.User>(
            'SELECT * FROM stakeholder WHERE id=$1',
            [ req.params['id'] ]);
        if (user === null) {
            return next(emit404('user not found')); }
        res.render('user_settings', {
            layout: 'subpage',
            user,
            'title_': `Settings of ${user.username}`
        });
    }
);

router.post('/:id/settings', 
    Auth.Middleware.authed,
    canCurrentUserModifySetting,
    async function (req, res, next) {
        var id = await db().oneOrNone('UPDATE stakeholder SET displayname=$2, title=$3, showemail=$4 WHERE id=$1 RETURNING id', 
            [ req.params['id'], req.body.displayname,
            req.body.title, req.body['publicemail'] || false ]);
        if (id === null) {
            return next(emit404('user not found')) }
        res.redirect(`/user/${req.params['id']}`);
    }
);

router.get('/:id/reset_passwd',
    Auth.Middleware.authed,
    canCurrentUserModifySetting,
    async function (req, res, next) {
        var user = await db().oneOrNone<Model.User>(
            'SELECT * FROM stakeholder WHERE id=$1',
            [ req.params['id'] ]);
        if (user === null) {
            return next(emit404('user not found')); }
        res.render('user_resetpasswd', {
            layout: 'subpage', user,
            'redirecturl': req.query['redirecturl']
        });
    }
);

router.post('/:id/reset_passwd',
    Auth.Middleware.authed,
    canCurrentUserModifySetting,
    (req, res, next) =>
        db().oneOrNone("SELECT * FROM stakeholder WHERE id=$1", [ req.params['id'] ])
        .then(function (user) {
            const title_ = 'Reset password';
            if (req.body['passwdnew'] != req.body['passwdnewr']) {
                return res.render('user_resetpasswd', {
                    layout: 'subpage', user, title_,
                    'redirecturl': req.body['redirecturl'],
                    'failed_message': 'New password doesnot match'
                });
            }
            if (!user) {
                return next({ 'status': 404, 'message': 'user not found' }); }
            compare(req.body['passwdorg'], user['passwd'], (err, result) =>
                (err || (!result)) ? res.render('user_resetpasswd', {
                    layout: 'subpage', user, title_,
                    'redirecturl': req.body['redirecturl'],
                    'failed_message': 'Original password doesnot match'
                }) :
                genSalt(10, function (err, salt) {
                    if (err) { return next(err); }
                    hash(req.body['passwdnew'], salt, (err, hashed) => (err) ? next(err) :  
                        db().none("UPDATE stakeholder SET passwd = $2 WHERE id = $1",
                            [ req.params['id'], hashed ])
                        .then(() => res.render('user_resetpasswd', {
                            layout: 'subpage', user, title_,
                            'redirecturl': req.body['redirecturl'],
                            'succeeded_message': 'Password modified.'
                        }), (reason) => next(emit500()))
                    );
                })
            );
        }, () => next(emit404('user not found')))
);
