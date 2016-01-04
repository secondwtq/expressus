
import * as markdown from '../src/misc/markdown';
import * as fsw from '../src/misc/fs-wrap';
import { join } from 'path';

async function test() {
    try {
        var data = await fsw.readFileAsync(
            join(__dirname, './test-markdown-data.md'),
            { 'encoding': 'utf-8' });
        var marked_data = await markdown.markAndSplitAsync(data, { });
        console.log(JSON.stringify(marked_data, null, 4));
    } catch (e) {  console.error((e as Error)); }
}

test();
