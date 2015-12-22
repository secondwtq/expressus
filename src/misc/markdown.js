
var config = require('../config');
var marked = require('marked');
var cheerio = require('cheerio');

function markAndSplit(source, mconfig) {
	if (mconfig === undefined) {
		mconfig = 'comment'; }
	if (typeof mconfig === 'object') {
		marked.setOptions(mconfig);
	} else if (typeof mconfig === 'string') {
		marked.setOptions(config[mconfig]); }

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

function markAndSplitAsync_(source, mconfig, callback) {
	marked(source, function (err, content) {
		if (err) {
			callback(err, null); }
		var $ = cheerio;
		var $$ = $.load(`<div id="outermost">${marked(source)}</div>`)('#outermost > *');
		var last_child = $('<div></div>');
		var paragraphs = [ ];
		$$.each(function (index, element) {
			var tag = element.tagName;
			last_child.append(element);
			if (tag == 'p' || tag == 'ul' || tag == 'ol' || tag == 'pre') {
				paragraphs.push(last_child.html());
				var new_element = $('<div></div>');
				last_child = new_element;
			}
		});
		callback(null, paragraphs);
	});
}

function markAndSplitAsync(source, mconfig, callback) {
	if (typeof mconfig === 'function') {
		callback = mconfig;
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

module.exports = {
	markAndSplit,
	markAndSplitAsync
};
