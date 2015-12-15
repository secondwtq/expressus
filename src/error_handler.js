
function pageNotFound(req, res, next) {
	next({ 'status': 404, 'message': 'page (just) not found' }); }

function log(err, req, res, next) {
	console.error(err);
	console.error(err.stack);
	next(err);
}

function page(err, req, res, next) {
	var status = undefined;
	if (typeof err['status'] == 'string' || typeof err['status'] == 'number') {
		status = parseInt(err['status']); }
	if (status === undefined || status === NaN) {
		status = 500; }
	
	switch (status) {
		case 404:
			err['message'] = err['message'] || 'page not found';
			res.status(404).render('misc_404', { layout: 'subpage',
				'message': err['message'] });
			break;
		case 403:
			err['message'] = err['message'] || 'forbidden';
			res.status(403).render('misc_403', { layout: 'subpage',
				'message': err['message'] });
			break;
		case 500:
		default:
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
