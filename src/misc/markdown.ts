
import * as marked from 'marked';
import * as config from '../config';

import { SplitResult, SplitCallback, splitCallback, splitCallbackWithString } from './format';

export function markAndSplit(source: string, 
        mconfig: string | MarkedOptions): SplitResult {
	if (mconfig === undefined) {
		mconfig = 'comment'; }
	if (typeof mconfig === 'object') {
		marked.setOptions(mconfig);
	} else if (typeof mconfig === 'string') {
		marked.setOptions(config[mconfig]); }

	return splitCallback(marked(source));
}

function markAndSplitAsync_(source: string,
        mconfig: string | MarkedOptions | SplitCallback,
        callback: SplitCallback): void {
	marked(source, function (err: Error, content: string) {
		if (err) { callback(err, null); }
		callback(null, splitCallbackWithString(content));
	});
}

export function markAndSplitAsync(source: string,
        mconfig: string | MarkedOptions | SplitCallback,
        callback?: SplitCallback): Promise<SplitResult> | void {
	if (typeof mconfig === 'function') {
        callback = <SplitCallback>mconfig;
        mconfig = undefined;
	}
	if (mconfig === undefined || mconfig === null) {
		mconfig = 'comment'; }
	if (typeof mconfig === 'object') {
		marked.setOptions(mconfig);
	} else if (typeof mconfig === 'string') {
		marked.setOptions(config['marked'][mconfig]); }

	if (callback === undefined) {
		return new Promise((resolve, reject) =>
			markAndSplitAsync_(source, mconfig, (err, paragraphs) =>
				err === null ? resolve(paragraphs) : reject(err)
			)
		);
	} else { return markAndSplitAsync_(source, mconfig, callback); }
}
