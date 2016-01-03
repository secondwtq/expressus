
import * as fsw from '../src/misc/fs-wrap';
import * as mdw from '../src/misc/madoko-wrap';

var opt = {
    'madokoOption': {
        'math': {
            'mode': 2
        },
        'logo': false,
        'full': false
    }
};

async function test() {
    try {
        console.log('started!');
        var mdksrc = await fsw.readFileAsync('./t.mdk', { 'encoding': 'utf8' });
        var html = await mdw.transpile(mdksrc, opt);
        await fsw.writeFileAsync('t.html', html);
        console.log('completed!');
    } catch (e) {
        console.log(e);
    }
}

test();
