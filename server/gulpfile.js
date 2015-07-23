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


var conf = {
    app_cwd: '../webapp/',
    commit: "xxx"
};

// function get_id_git() {
//     var fs = require('fs');
//     var path = require('path');
//     var file_path = path.join(__dirname, '../.git/refs/remotes/origin/master');
//     console.log(file_path);
//     try { 
//         var v = fs.readFileSync(file_path, 'utf-8');
//         console.log("ultimo commit: %s", v);
//         conf.commit = v.slice(0,10);
//     } catch (e) {
//         if (e.code !== 'ENOENT') throw e;
//         console.log("no se encontró el el id del ultimo commit");
//         conf.commit = "xxx";
//     }
// };

// Get last commit id and store it in conf
// get_id_git();


// version for statics
var version = "0";
function set_vertsion(){
  conf.commit = Math.floor(Date.now() / 1000);
}
set_vertsion();


var js_all = 'all.v'+conf.commit+'.min.js';
var js_vendor = 'vendor.v'+conf.commit+'.min.js';
var css_file_min = 'all.v.'+conf.commit+'.min.css';


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
	gulp.src(['css/cartodb.css', 'css/fonts.css', 'css/style.css',
                'css/style_850.css', 'css/style_650.css', 'css/style_550.css',
                'css/map.css', 'css/tooltip.css','css/draw_controls.css',
                'css/leaflet.draw.css'], { cwd: conf.app_cwd })
    .pipe(minifyCSS({advanced: false}))
    .pipe(concat(css_file_min))
    .pipe(gulp.dest('../build/css'));
});

// test JS
gulp.task('test_js_prod', function(){
	return gulp.src(['js/app-opt.js'], { cwd: conf.app_cwd })
		.pipe(jshint({multistr: true}))
		.pipe(jshint.reporter('default'))
		.pipe(jshint.reporter(stylish));
});

gulp.task('js', function () {
    var all = gulp.src(['opt/app-opt.js'] , { cwd: conf.app_cwd })
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat(js_all))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('../build/js'));
    
    var vendor = gulp.src(['libs/requirejs/require.js'], { cwd: conf.app_cwd })
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(concat(js_vendor))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('../build/libs'));

    return merge(all,vendor);
    
});

gulp.task('copy', function () {
	var opts = {
		conditionals: true,
		spare:true
	};
	var html = gulp.src('*.html', { cwd: conf.app_cwd })
		.pipe(htmlreplace({
			js: {
                src: [['js/'+js_all, 'libs/'+js_vendor]],
                tpl: '<script data-main="%s" src="%s"></script>'
            },
            css: ['css/'+css_file_min]
		}))
		.pipe(minifyHTML(opts))
		.pipe(gulp.dest('../build'));

    var libs = gulp.src(['libs/cartodb.min.js'], { cwd: conf.app_cwd })
        .pipe(gulp.dest('../build/libs/'));
	
	var fonts = gulp.src('css/fonts/*', { cwd: conf.app_cwd })
		.pipe(gulp.dest('../build/css/fonts'));

	var img = gulp.src('img/*', { cwd: conf.app_cwd })
		.pipe(gulp.dest('../build/img'));

    var css_img = gulp.src(['css/images/*.png'], { cwd: conf.app_cwd })
        .pipe(gulp.dest('../build/css/images'));

	var data = gulp.src('data/*', { cwd: conf.app_cwd })
	    .pipe(gulp.dest('../build/data'));

	return merge(html, fonts, img, data);
});

gulp.task('build', ['roptimize', 'minify-css', 'js', 'copy']);


// SERVER TASKS
gulp.task('connect', function() {
  connect.server({
    root: conf.app_cwd,
    livereload: true,
    port:8000
  });
});

gulp.task('html', function () {
  gulp.src('../webapp/*.html')
    .pipe(connect.reload());
});

gulp.task('test_js', function(){
    return gulp.src(['js/app.js'], { cwd: conf.app_cwd })
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
  console.log("2015_caba_map");
});
