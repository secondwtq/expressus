
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

console.log('started!');
fsw.readFileAsync('./t.mdk', { 'encoding': 'utf8' })
.then((data) => mdw.transpile(data, opt))
.then((data) => 
	fsw.writeFileAsync('t.html', data)
	.then(() => console.log('completed!'))
)
.catch((err) => console.log(err));
