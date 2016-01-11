// grab our gulp packages
var gulp  = require('gulp');
var htmlreplace = require('gulp-html-replace');
var fs = require('fs');


gulp.task('buildHtml', function() {
  gulp.src('index.html')
  .pipe(htmlreplace({
        'trackjs': fs.readFileSync('src/snippets/trackjs.html', 'utf8'),
    }))
  .pipe(gulp.dest('dist/'));
});


gulp.task('default', ['buildHtml']);
