
import * as $ from 'cheerio';
import * as config from '../config';

export type SplitResult = string[];
export type SplitCallback = (Error, SplitResult) => void;

const contTags = {
    'p': true,
    'ul': true,
    'ol': true,
    'pre': true
};

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

export function splitCallback(content: string): SplitResult {
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
