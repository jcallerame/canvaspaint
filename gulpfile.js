var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var browserSync = require("browser-sync").create();
var reload = browserSync.reload;

gulp.task("default", function () {
  return gulp.src("src/**/*.js")
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat("all.js"))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('watch', ['browser-sync'], function() {
  gulp.watch('src/**/*.js', ['default']);
});

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./",
            injectChanges: true
        }
    });
    gulp.watch('*.html').on('change', reload);
    gulp.watch('*.css').on('change', reload);
});
