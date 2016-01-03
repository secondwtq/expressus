
import * as fsw from '../src/misc/fs-wrap';

async function testSucceed() {
    var r = await fsw.searchAndReadFile('./test-fs-wrap.js',
        { 'encoding': 'utf-8' }, [ '.', __dirname ]);
    console.log('testSucceed: ', r);
}

async function testFailed() {
    var r = await fsw.searchAndReadFile('./test-no-such-file.js', { }, [ '.' ]);
    console.log('testFailed: ', r);
}

async function test() {
    try {
        await testSucceed();
        await testFailed();
    } catch (e) {
        console.log(e);
    }
}

test();
