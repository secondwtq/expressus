
import * as fs from 'fs';
import { join } from 'path';

export function readFileAsync(path: string, options: { encoding: string; flag?: string; }): Promise<string> {
	return new Promise((resolve, reject) =>
			fs.readFile(path, options,
				function (err, data) {
					if (err) { return reject(err); }
					resolve(data);
				}
			)
		);
}

export function writeFileAsync(path: string,
        data: any, options?): Promise<any> {
	return new Promise((resolve, reject) =>
			fs.writeFile(path, data, options,
				function (err) {
					if (err) { return reject(err); }
					resolve();
				}
			)
		);
}

export function searchFileAsync(filename: string,
        paths: string[]): Promise<string> {
	return new Promise(function (resolve, reject) {
		var found = false, nChecked = 0;
		paths.forEach(function (path_) {
			var filenameInPath = join(path_, filename);
			fs.stat(filenameInPath, function (err, stat) {
				nChecked++;
				if (!found && !err && stat.isFile()) {
					found = true;
					return resolve(filenameInPath);
				}
				if (nChecked == paths.length) {
					reject(new Error('NOENT')); }
			});
		});
	});
}

export async function searchAndReadFile(filename: string,
        options, paths: string[]): Promise<string> {
    var filename_ = await searchFileAsync(filename, paths);
    return readFileAsync(filename_, options);
}
