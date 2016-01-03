
'use strict';

import * as fsw from './fs-wrap';

import { join } from 'path';
var path_prefix = join(__dirname, '../../node_modules/madoko');
function mdFile(path: string): string {
    return join(path_prefix, path); }

var monarch = require(mdFile('lib/monarch'));
var registered_cache = new Set<string>();

function registerLanguage(name: string, def: string|Object): void {
    if (!registered_cache.has(name)) {
        monarch.register(def, name);
        registered_cache.add(name);
    }
}

function extractLanguagesFromSource(src: string): Set<string> {
	var ret = new Set<string>();
	// JS regex, global, multiline, matchall
	var re = /(?:^ *```+ *|\blanguage\s*[:=])([\w\-\/]+)\b/mg;
	while (true) {
		var m = re.exec(src);
		if (m === null) {
			break; }
		ret.add(m[1].toLowerCase());
	}
	return ret;
}

// from Madoko drivers.kk registerColorizers()
function registerColorizers(src: string, paths: string[], extralangs: string[]) {
	extralangs = extralangs || [ ];
	var langs = new Set<string>([
			... extractLanguagesFromSource(src),
			... extralangs.map((s) => s.toLowerCase().trim())
		]);
	var rets = [ ];
	langs.forEach((lang) => {
        if (!registered_cache.has(lang)) {
            rets.push(fsw.searchAndReadFile(`${lang}.json`, { 'encoding': 'utf-8' }, paths)
                .then(
                    function (def) {
                        try {
                            registerLanguage(lang, def);
                        } catch (err) {
                            return Promise.resolve([ lang, false, err ]); }
                        return Promise.resolve([ lang, true ]);
                    },
                    (err) => Promise.resolve([ lang, false, err ])
                )
            );
        }
    });
	return Promise.all(rets);
}

var prelude_cache = undefined;
function getPreludeContent(): Promise<string> {
	if (prelude_cache === undefined) {
		return fsw.readFileAsync(
            mdFile('styles/prelude.mdk'),
			{ 'encoding': 'utf-8' })
		.then((data) => Promise.resolve(prelude_cache = data));
	} else { return Promise.resolve(prelude_cache); }
}

var madoko = require('madoko');

export interface TranspileOptions {
    extraLanguage?: string[];
    madokoOption?: Object;
}

import * as _ from 'lodash';
export function transpile(src: string, options: TranspileOptions) {
    var mopt = _.merge(madoko.initialOptions(), options.madokoOption || { });
	return getPreludeContent()
	.then((prelude) => {
		src = `${prelude}\n${src}`;
		return Promise.all<any>([
			Promise.resolve(src),
			registerColorizers(src,
                [ mdFile('styles/lang') ],
                options.extraLanguage || [ ]
            )
		])
	})
	.then((results) => Promise.resolve(madoko.markdown(results[0], mopt)));
}
