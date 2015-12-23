var gulp = require('gulp');
var task = gulp.task;
var src = gulp.src, dest = gulp.dest;

var less = require('gulp-less');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify'); 
var minifyCSS = require('gulp-minify-css');
var del = require('del');
var tsb = require('gulp-tsb');

gulp.task('default', function () {
    
});

function buildLess(isDist) {
    var r = src('./src/static/less/*.less')
            .pipe(less());
    if (isDist) {
        r = r.pipe(minifyCSS()); }
    return r.pipe(gulp.dest('./static/css'));
}

function buildJS(isDist) {
    var r = src('./src/static/js/*.js')
    if (isDist) {
        r = r.pipe(uglify())
            .pipe(rename({ 'suffix': '.min' }));
    }
    return r.pipe(gulp.dest('./static/js'));    
}

var tsConfig = tsb.create('src/tsconfig.json');
function buildTS(isDist) {
    var r = src([ 'typings/**/*.ts', 'src/**/*.ts' ])
            .pipe(tsConfig())
            .pipe(gulp.dest('src'));
    return r;
}

gulp.task('clean', () =>
    del([ 'static/css', 'static/js' ]));

gulp.task('build', () =>
    gulp.start('build-css', 'build-js')
);
gulp.task('build-dist', () =>
    gulp.start('build-css:dist', 'build-js:dist')
);

gulp.task('build-less', buildLess.bind(null, false));
gulp.task('build-css', buildLess.bind(null, false));
gulp.task('build-less:dist', buildLess.bind(null, true));
gulp.task('build-css:dist', buildLess.bind(null, true));

gulp.task('build-js', buildJS.bind(null, false));
gulp.task('build-js:dist', buildJS.bind(null, true));

gulp.task('build-ts', buildTS.bind(null, false));

gulp.task('watch-css', () =>
    gulp.watch('./src/static/less/*.less', [ 'build-css' ])
);

gulp.task('watch-js', () =>
    gulp.watch('./src/static/js/*.js', [ 'build-js' ])
);

gulp.task('watch', [
    'watch-css', 'watch-js' ]);
