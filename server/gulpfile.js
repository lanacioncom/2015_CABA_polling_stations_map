var gulp = require('gulp'),
    connect = require('gulp-connect');
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    del = require('del'),
    minifyCSS = require('gulp-minify-css'),
    sourcemaps = require('gulp-sourcemaps'),
    htmlreplace = require('gulp-html-replace'),
    stylish = require('jshint-stylish'),
    merge = require('merge-stream');
    rjs = require('gulp-requirejs');
    minifyHTML = require('gulp-minify-html');


function get_id_git() {
	var fs = require('fs');
	var path = require('path');
	var file_path = path.join(__dirname, '../.git/refs/remotes/origin/master');
	v = fs.readFileSync(file_path, 'utf-8');
	return v.slice(0,10);
};

var js_all = 'js/all.v.'+get_id_git()+'.min.js';
var css_file_min = 'all.v.'+get_id_git()+'.min.css';


gulp.task('clear_build', function() {
    del(['../build/**/*'],{force: true});
});

// build tasks
gulp.task('roptimize', function() {
    rjs({
        mainConfigFile : "../webapp/js/app.js",
        baseUrl: "../webapp/js",
        name: "app",
        optimizeAllPluginResources: true,
        removeCombined: true,
        out: 'app-opt.js',
    })
    .pipe(gulp.dest('../webapp/opt'));
});

gulp.task('minify-css', function () {
	gulp.src(['css/cartodb.css', 'css/fonts.css', 
              'css/style.css', 'css/leaflet.draw.css'], { cwd: '../webapp' })
    .pipe(minifyCSS())
    .pipe(concat(css_file_min))
    .pipe(gulp.dest('../build/css'));
});

// test JS
gulp.task('test_js_prod', function(){
	return gulp.src(['js/app-opt.js'], { cwd: '../webapp' })
		.pipe(jshint({multistr: true}))
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter(stylish));
});

gulp.task('js', ['test_js_prod'], function () {
	return gulp.src(['js/app-opt.js'] , { cwd: '../webapp' })
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(concat(js_all))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('../build'));
});

gulp.task('copy', function () {
	var opts = {
		conditionals: true,
		spare:true
	};
	var html = gulp.src('*.html', { cwd: '../webapp' })
		.pipe(htmlreplace({
			js: {
                src: [[js_all, 'libs/require.min.js']],
                tpl: '<script data-main="%s" src="%s"></script>'
            },
            css: ['css/'+css_file_min]
		}))
		.pipe(minifyHTML(opts))
		.pipe(gulp.dest('../build'));

    var libs = gulp.src(['libs/require.min.js', 'libs/cartodb.min.js'], { cwd: '../webapp' })
        .pipe(gulp.dest('../build/libs/'));
	
	var fonts = gulp.src('css/fonts/*', { cwd: '../webapp' })
		.pipe(gulp.dest('../build/css/fonts'));

	var img = gulp.src('img/*', { cwd: '../webapp' })
		.pipe(gulp.dest('../build/img'));

    var css_img = gulp.src(['css/images/*.png'], { cwd: '../webapp' })
        .pipe(gulp.dest('../build/css/images'));

	var data = gulp.src('data/*', { cwd: '../webapp' })
	    .pipe(gulp.dest('../build/data'));

	return merge(html, fonts, img, data);
});

gulp.task('build', ['roptimize', 'minify-css', 'js', 'copy']);


// SERVER TASKS
gulp.task('connect', function() {
  connect.server({
    root: '../webapp',
    livereload: true
    // port:8000
  });
});

gulp.task('html', function () {
  gulp.src('../webapp/*.html')
    .pipe(connect.reload());
});

gulp.task('test_js', function(){
    return gulp.src(['js/app.js'], { cwd: '../webapp' })
        .pipe(jshint({multistr: true}))
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter(stylish));
});
 
gulp.task('watch', function () {
  gulp.watch(['../webapp/*.html', '../webapp/**/*.css', '../webapp/**/*.js'], ['html', 'test_js']);
});

// development server
gulp.task('server', ['connect', 'watch']);

// production server
gulp.task('server_pro', function() {
  connect.server({
    root: '../build'
  });
});

// default task
gulp.task('default', function() {
  console.log("2015_paso_caba_mapa_candidatos");
});
