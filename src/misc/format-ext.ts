
// we must create this extra script
//  cuz ES5 CommonJS is not good at dealing
//  with cyclic dependencies
//
// well now you know how CommonJS handles cyclic dependencies :)
'use strict'

import * as config from '../config';
import { SplitResult } from './format';
import { markAndSplitAsync as markAndSplitAsync_Madoko } from './madoko';
import { markAndSplitAsync as markAndSplitAsync_Markdown } from './markdown';

var _splitAsyncForFormat = {
    'madoko': markAndSplitAsync_Madoko,
    'markdown': markAndSplitAsync_Markdown,
    'plaintext': (content, mconfig) => {
        if (mconfig === undefined || mconfig === null) {
            mconfig = 'comment'; }
        if (typeof mconfig === 'string') {
            mconfig = config['marked'][mconfig]; }
        if (mconfig['sanitize']) {
            content = xss.inHTMLData(content); }
        return Promise.resolve([ content ]);
    },
};

export function splitAsyncForFormat(format: string):
        (string, ...any) => Promise<SplitResult> {
    format = format.toLowerCase().trim();
    if (_splitAsyncForFormat[format]) {
        return _splitAsyncForFormat[format]; }
    // TODO: 400 Bad Request when handler not found
    return _splitAsyncForFormat['default'];
}
