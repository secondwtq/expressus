// navigation switch animations
// TODO: finish the effect of blog index

'use strict';
var navigationSwitchTop;

(function () {

var pf = {
	'transition': Modernizr.prefixedCSS('transition'),
	'transform': Modernizr.prefixedCSS('transform')
};

function em2px(elem, input) {
    var emSize = parseFloat($("body").css("font-size"));
    return (emSize * input);
}

// TODO: mobile Chrome
var browser = {
	'firefox': navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
	'chrome': /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)	
};

var option_default = {
	// disabled now for compatibility issue
	'enabled': browser['chrome'],
	'cssTransform': true,
	'debugPreventNav': false
}

navigationSwitchTop = function (navcont, option) {
option = option_default;
if (option['enabled']) {

var $$ = $(navcont);

console.log($('body').children());
$('body').children().css(pf['transition'], 'opacity 0.3s ease-in-out');

$$.css(pf['transition'], 'all 0.2s ease-in-out');

$('.sw').click(function (e) {
	var that = this;
	var has = function (cls) { return $(that).hasClass(cls); };
	var ww = $(window).width();
	var wh = $(window).height();
	
	$$.height($$.height()).width($$.width()).addClass('sw-switched-out');
	$$.children().css('opacity', 0);
	
	// sw-shorter - switch nav to height like blog index
	if (has('sw-shorter')) {
		var h = 3 + 2 * 0.5 + 1 + 0.1;
		
		if (option['cssTransform']) {
			var pxsize = em2px($$, h);
			var ratio_scale = pxsize / $$.height();
			var ratio_transform = (wh / 2 - pxsize / 2) / wh * 100;
			$$.css(pf['transform'], 'translate3d(0, -' + ratio_transform + '%, 0) scale3d(1, ' + ratio_scale + ', 1)');
		} else { $(navcont).height(h+'em'); }
	// sw-allfade - fade all things
	} else if (has('sw-fadeall')) {
		$$.css('opacity', '0');
		$('body').children().css('opacity', 0);
	} else if (has('sw-noheight')) {
	
	// sw-expandall - expand navbar to fullscreen
	} else if (has('sw-expandall')) {
		if (option['cssTransform']) {
			$$.css('z-index', 961208);
			var pos = $$.position();
			var ratiow = ww / $$.width();
			var ratioh = wh / $$.height();
			var offx = ww / 2 - (pos.left + $$.width() / 2);
			var offy = wh / 2 - (pos.top + $$.height() / 2);
			$$.css(pf['transform'], 'translate3d('+ offx + 'px, ' + offy + 'px, 0)' +
					'scale3d(' + ratiow + ', ' + ratioh + ', 1)');
		} else {
			$$.css({
				'position': 'fixed',
				'right': 0,
				'top': 0,
				'z-index': 961208
			});
			$$.height(wh).width(ww);
		}
	}
	if (option['debugPreventNav']) {
		e.preventDefault(); }
});

}
}

}());
