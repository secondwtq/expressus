
import * as msw from './madoko-wrap';
import * as $ from 'cheerio';
import { SplitResult, splitCallbackWithCheerio } from './format';
import * as config from '../config';
import * as _ from 'lodash';

export function markAndSplitAsync(source: string,
        mconfig: string | msw.TranspileOptions): Promise<SplitResult> {
    // TODO: since Madoko is for articles only currently
    //  ignore string for config here.
    mconfig = mconfig || { };
    if (typeof mconfig == 'string') {
        mconfig = { }; }
    var config_ = _.merge({ }, config['madokow'], mconfig);
	return msw.transpile(source, config_)
        .then((content) => Promise.resolve(
            splitCallbackWithCheerio(
                $.load(content)('.body.madoko > *')
            )
        ));
}
