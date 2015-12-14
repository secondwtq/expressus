
function pageNotFound(req, res, next) {
	next({ 'status': 404, 'message': 'page (just) not found' }); }

function log(err, req, res, next) {
	console.error(err);
	console.error(err.stack);
	next(err);
}

function page(err, req, res, next) {
	if (err['status'] && parseInt(err['status']) == 404) {
		err['message'] = err['message'] || 'page not found';
		res.status(404).render('misc_404', { layout: 'subpage',
			'message': err['message'] });
	} else {
		err['message'] = err['message'] || 'unknown internal error';
		res.status(500).render('misc_500', { 'layout': 'subpage', 
			'message': err['message'] });
	}
}

module.exports = {
	pageNotFound,
	log,
	page
};
