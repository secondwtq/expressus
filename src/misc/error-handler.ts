
import { Router, Request, Response } from 'express';

export interface HTTPError {
    status: number;
    message: string;
}

export function pageNotFound(req: Request, res: Response, next: Function) {
	next(emit404("page (just) not found")); }

export function log(err, req: Request, res: Response, next: Function) {
	console.error(err);
	console.error(err.stack);
	next(err);
}

export function page(err, req: Request, res: Response, next: Function) {
    var error = emitStatus(undefined, err);
    var status = error['status'];
	
	switch (status) {
		case 404:
			res.status(404).render('misc_404', { layout: 'subpage',
				'message': error['message'] });
			break;
		case 403:
			res.status(403).render('misc_403', { layout: 'subpage',
				'message': error['message'] });
			break;
		case 500:
		default:
			res.status(500).render('misc_500', { 'layout': 'subpage', 
				'message': error['message'] });
	}
}

function makeError(status, message): HTTPError {
    status = parseInt(status);
    return {
        status,
        message
    };
}

function errorMessage(status: number): string {
    switch (status) {
		case 404:
			return 'page not found';
			break;
		case 403:
			return 'forbidden';
			break;
		case 500:
		default:
			return 'unknown internal error';
	}
}

export function emitStatus(status, src?): HTTPError {
    if (status === undefined || status === null) {
        if (typeof src === 'object') {
            if (typeof src['status'] == 'string' ||
                    typeof src['status'] == 'number') {
                status = parseInt(src['status']);
            }
        }
    }
    status = parseInt(status);
    if (status === undefined || status === NaN) {
        status = 500; }

    if (typeof src === "string") {
        return makeError(status, src);
    } else if (typeof src === "object") {
        if (src['message']) {
            return emitStatus(status, src['message'].toString()); }
        return makeError(status, errorMessage(status));
    } else {
        return makeError(status, errorMessage(status));
    }
}

export function emit404(src?) {
    return emitStatus(404, src); }

export function emit403(src?) {
    return emitStatus(403, src); }

export function emit500(src?) {
    return emitStatus(500, src); }
