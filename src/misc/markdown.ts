
import * as marked from 'marked';
import * as $ from 'cheerio';
import * as config from '../config';

const contTags = {
    'p': true,
    'ul': true,
    'ol': true,
    'pre': true
};

export type SplitResult = string[];
export type SplitCallback = (Error, SplitResult) => void;

export function splitCallbackWithCheerio(content: Cheerio): SplitResult {
    var $$ = $.load('<div id="outermost"></div>');
    $$('#outermost').append(content);
    var $$$ = $$('#outermost > *');
    var last_child = $('<div></div>');

    var paragraphs = [ ];
    $$$.each((index, element) => {
		var tag = element.tagName;
		last_child.append(element);
		if (contTags[tag.toLowerCase()]) {
			paragraphs.push(last_child.html());
			last_child = $('<div></div>');
		}
	});
    return paragraphs;
}

export function splitCallbackWithString(content: string): SplitResult {
    return splitCallbackWithCheerio($.load(content).root().children('*')); }

function splitCallback(content: string): SplitResult {
    var $$ = $.load(`<div id="outermost">${content}</div>`)
    var $$$ = $$('#outermost > *');
	var last_child = $('<div></div>');
	var paragraphs = [ ];

	$$$.each((index, element) => {
		var tag = element.tagName;
		last_child.append(element);
		if (contTags[tag.toLowerCase()]) {
            // $.html() would not contain the outer element def.
			paragraphs.push(last_child.html());
			var new_element = $('<div></div>');
			last_child = new_element;
		}
	});
    return paragraphs;
}

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

export function markAndSplitAsync_(source: string,
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
		marked.setOptions(config[mconfig]); }

	if (callback === undefined) {
		return new Promise((resolve, reject) =>
			markAndSplitAsync_(source, mconfig, (err, paragraphs) =>
				err === null ? resolve(paragraphs) : reject(err)
			)
		);
	} else { return markAndSplitAsync_(source, mconfig, callback); }
}
