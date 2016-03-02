// grab our gulp packages
var gulp  = require('gulp');
var htmlreplace = require('gulp-html-replace');
var minifyInline = require('gulp-minify-inline');
var fs = require('fs');


gulp.task('buildHtml', function() {
  gulp.src('index.html')
  .pipe(minifyInline({
    jsSelector: 'pleasedontminifyscripts'
  }))
  .pipe(htmlreplace({
        'trackjs': fs.readFileSync('src/snippets/trackjs.html', 'utf8'),
        'rollbar': fs.readFileSync('src/snippets/rollbar.html', 'utf8'),
    }))
  .pipe(gulp.dest('dist/'));
});


gulp.task('default', ['buildHtml']);
