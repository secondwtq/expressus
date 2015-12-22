
'use strict';

var router = require('express').Router();
var markdown = require('../misc/markdown');

router.use('/splitpara', function (req, res, next) {
	markdown.markAndSplitAsync(req.body['content'], "article")
	.then((content) => res.json(content))
	.catch((err) =>
		res.status(500).json({
			'status': 500,
			'error': err
		})
	);
});

module.exports = router;
