
import * as _ from 'lodash';
import { Request, Response, RequestHandler } from 'express';
import { emit403 } from '../misc/error-handler'; 

export module Model {
    
    export interface User {
        id: number;
        username: string,
        passwd: string,
        displayname?: string,
        email: string,
        register_time: Date,
        avatar: string,
        title?: string,
        privilege: string;
        showemail: boolean;
    }
    
}

export namespace Auth {
    
    export enum Privilege {
        ALL_USER_UPDATE,
        POST_ARTICLE
    }
    
    var privileges = {
        [Privilege.ALL_USER_UPDATE]: [ 'admin' ],
        [Privilege.POST_ARTICLE]: [ 'admin', 'foundation' ]
    };
    
    export function hasPrivilege(
            user: Model.User, privilege: Privilege) {
        if (!user) { return false; }
        return (_(privileges[privilege]).contains(user.privilege));
    };
    
    export function canUserModifySettingOf(
            user: Model.User, target_id: number): boolean {
        if (!user) { return false; }
        return user.id === target_id;
    }
    
    export function redirectURLForRequest (req: Request) {
        return req.query['redirecturl'] ||
                req.body['redirecturl'] ||
                req.originalUrl;
    }
    
    export namespace Middleware {
        export function requirePrivilege(privilege: Privilege): RequestHandler {
            return function (req: Request, res: Response, next: Function) {
                var redir = req.query.redirecturl || req.body.redirecturl || req.path;
                if (!req.user) {
                    res.redirect('/user/login?redirecturl=' + redir);
                } else if (hasPrivilege(req.user, privilege)) {
                    return next();
                } else { next(emit403()); }
            };
        }  
        
        export function authed(req: Request, res: Response, next: Function) {
            if (req.user) {
                return next(); }
            res.redirect(`/user/login?redirecturl=${redirectURLForRequest(req)}`);
        }

        export function notAuthed (req: Request, res: Response, next: Function) {
            if (req.user) {
                return res.redirect('/blog');
            } else {
                next();
            }
        } 
            
    }
    
}
