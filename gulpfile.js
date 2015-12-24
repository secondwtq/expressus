var gulp = require('gulp');
var task = gulp.task;
var src = gulp.src, dest = gulp.dest;

var less = require('gulp-less');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify'); 
var minifyCSS = require('gulp-minify-css');
var del = require('del');
var tsb = require('gulp-tsb');

function buildLess(isDist) {
    var r = src('./src/static/less/*.less')
            .pipe(less());
    if (isDist) {
        r = r.pipe(minifyCSS()); }
    return r.pipe(gulp.dest('./static/css'));
}

var tsConfig = tsb.create('src/tsconfig.json');
function buildServerTS(isDist) {
    var r = src([ 'typings/**/*.ts', 'src/**/*.ts' ])
            .pipe(tsConfig())
            .pipe(gulp.dest('src'));
    return r;
}

function buildJS(isDist) {
    var r = src('./src/static/js/*.js')
    if (isDist) {
        r = r.pipe(uglify())
            .pipe(rename({ 'suffix': '.min' }));
    }
    return r.pipe(gulp.dest('./static/js'));    
}

gulp.task('clean', () =>
    del([ 'static/css', 'static/js' ]));

gulp.task('build-css', buildLess.bind(null, false));
gulp.task('build-css:dist', buildLess.bind(null, true));

gulp.task('build-js', buildJS.bind(null, false));
gulp.task('build-js:dist', buildJS.bind(null, true));

gulp.task('build-ts-server', buildServerTS.bind(null, false));

gulp.task('build',
    [ 'build-js', 'build-css', 'build-ts-server' ]);
gulp.task('build-dist', 
    [ 'build-js:dist', 'build-css:dist', 'build-ts-server' ]);

gulp.task('watch', function () {
    gulp.watch('./src/static/less/*.less', [ 'build-css' ]);
    gulp.watch('./src/static/js/*.js', [ 'build-js' ]);
    gulp.watch('./src/**/*.ts', [ 'build-ts-server' ]);
});

gulp.task('default', [ 'build' ]);
