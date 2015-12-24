
'use strict';

import { Router } from 'express';
import { markAndSplitAsync } from '../misc/markdown';
import { emit500 } from '../misc/error-handler';
import * as RSS from 'rss';
import * as config from '../config';
import { db } from '../exusdb';
import { Model } from '../model/model';
import { sprintf } from 'sprintf-js';

var router = Router();

router.use('/',
async function (req, res, next) {
    var feed = new RSS(config['rss']['meta']);
    var articles = await db().manyOrNone<Model.Article>(
        'SELECT * FROM "article_detail" WHERE NOT trashed AND NOT indraft ORDER BY post_date DESC LIMIT $1',
		[ config['rss']['numItem'] ]);
    articles.forEach((item) => {
        var url = sprintf(config['rss']['urlfmt'], { 'id': item['id'] });
        feed.item({
            'title': item['title'],
            'description': item['summary'],
            'url': url, 'guid': url,
            'author': item['username'],
            'date': item['post_date']
        });
    });
    console.log('res');
    // application/xml or text/xml?
    res.contentType('application/xml').send(feed.xml());
});

export = router;
