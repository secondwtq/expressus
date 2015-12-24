
'use strict';

import { Router } from 'express';
import { markAndSplitAsync } from '../misc/markdown';
import { emit500 } from '../misc/error-handler';

var router = Router();

router.use('/splitpara',
async function (req, res, next) {
    try {
        var content = await markAndSplitAsync(req.body['content'], "article");
        res.json(content);
    } catch (err) { next(emit500(err)); }
});

export = router;
