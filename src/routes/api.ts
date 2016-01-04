
'use strict';

import { Router } from 'express';
import { markAndSplitAsync } from '../misc/markdown';
import { emit500 } from '../misc/error-handler';
import { splitAsyncForFormat } from '../misc/format-ext';

var router = Router();

router.use('/splitpara',
async function (req, res, next) {
    try {
        var content = await splitAsyncForFormat(req.body['format'])(req.body['content'], "article");
        res.json(content);
    } catch (err) { next(emit500(err)); }
});

export = router;
