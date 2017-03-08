// config
var port = {
		server : 3000,
		livereload : 35729
	},
	root = {
		dev  : "src",
		dist : "dist"
	},
	folder = {
		app  : "/app",
		css  : "/assets/css",
		font : "/assets/fonts",
		img  : "/assets/img",
		js   : "/assets/js",
		lib  : "/assets/lib",
		less  : "/assets/less",
		bower : "bower_components"
	};


// PLUGIN
var gulp = require("gulp"),
	$ = require("gulp-load-plugins")(gulp),
	del = require('del'),
	express = require("express"),
	livereload = require("connect-livereload"),
	path 	 = require("path"),
	pngquant = require("imagemin-pngquant"),
	tinylr;


// EXPRESS - 서버연결
gulp.task("express", function () {
	var app = express();
	app.use(livereload({ port: port.livereload }));
	app.use(express.static(root.dev));
	app.use("/bower_components", express.static(folder.bower));
	app.listen(port.server);
});

// LIVERELOAD - 라이브로드
gulp.task("livereload", function () {
	tinylr = require("tiny-lr")();
	tinylr.listen(port.livereload);
});

// OPEN - 설정된 브라우저를 창을 띄운다.
gulp.task("open", function () {
	gulp.src(root.dev +"/index.html")
		.pipe($.open("", {
			url: "http://localhost:"+ port.server,
			app: "chrome"
		}));
});

// LESS - LESS 파일을 CSS 파일로 컴파일한다.
gulp.task("less", function () {
	var less = root.dev + folder.less +"/main.less";
	return gulp.src(less)
		.pipe($.plumber())
		.pipe($.less())
		.pipe($.autoprefixer("last 3 version", "safari 5", "ie 8", "ie 9"))
		.pipe($.csscomb(".csscomb.json"))
		.pipe(gulp.dest(root.dev + folder.css));
});

gulp.task("jshint", function () {
	return gulp.src([ root.dev + folder.app +"/**/*.js", root.dev + folder.js +"/**/*.js" ])
		.pipe($.jshint())
		.pipe($.jshint.reporter("jshint-stylish"));
});

// WATCH - 라이브로드를 위한 WATCH
gulp.task("watch", function () {
	var less = [
		root.dev + folder.less +"/**/*.less",
		root.dev + folder.app +"/shared/components/**/*.less"
	];
	gulp.watch(less, [ "less" ]);
	gulp.watch([ root.dev + folder.app +"/**/*.js", root.dev + folder.js +"/**/*.js" ], changedJsHint);
	gulp.watch([ root.dev +"/**/*", "!"+ less[0], "!"+ less[1] ], notifyLiveReload);
});

function changedJsHint (event) {
	var fileName = path.relative("", event.path);
	if (event.type === "changed") {
		gulp.src(fileName)
			.pipe($.plumber())
			.pipe($.jshint())
			.pipe($.jshint.reporter("jshint-stylish"));
	}
}

function notifyLiveReload (event) {
	var fileName = path.relative(root.dev, event.path);
	tinylr.changed({
		body: {
			files: [fileName]
		}
	});
}

// CLEAN
gulp.task("clean", function () {
	return del(root.dist +"/**/*");
});

// APP:DIST - app 폴더 JS, HTML 압축
gulp.task("app:dist", function () {
	return gulp.src([root.dev + folder.app +"/**/*.html"])
		.pipe($.minifyHtml({ empty: true }))
		.pipe(gulp.dest(root.dist + folder.app));
});

// USEMIN - 주석(<!-- build -->)에 포함되는 파일을 병합하고, 압축한다.
gulp.task("usemin", ["less"], function () {
	return gulp.src(root.dev +"/index.html")
		.pipe($.usemin({
			html : [$.minifyHtml({empty: true})],
			vendorCSS : [$.minifyCss(), "concat"],
			modifyCSS : [$.minifyCss(), "concat"],
			mainCSS   : [$.minifyCss(), "concat"],
			vendorJS  : [$.uglify()],
			modifyJS  : [$.uglify()],
			mainJS    : [$.uglify()]
		}))
		.pipe(gulp.dest(root.dist));
});

// COPY
gulp.task("copy", function () {
	gulp.src(root.dev + folder.lib +"/tinymce/**/*")
		.pipe(gulp.dest(root.dist + folder.lib +"/tinymce"));

	gulp.src(root.dev + folder.font +"/*")
		.pipe(gulp.dest(root.dist + folder.font));

	gulp.src([ folder.bower +'/font-awesome/fonts/*', folder.bower +'/bootstrap/dist/fonts/*' ])
		.pipe(gulp.dest(root.dist + folder.font));

	gulp.src(root.dev +'/json/**/*.json')
		.pipe(gulp.dest(root.dist +'/json'));
});

// IMAGE
gulp.task("imgmin", function () {
	return gulp.src(root.dev + folder.img +"/**/*")
		.pipe($.plumber())
		.pipe($.imagemin({
			progressive: true,
			svgoPlugins: [{ removeViewBox: false }],
			use: [pngquant()]
		}))
		.pipe(gulp.dest(root.dist + folder.img));
});

// NGDOCS
gulp.task("ngdocs", function () {
	gulp.src(root.dev + folder.app +"/contents/SV/01svServRec/sv.01svServRec.app.js")
		.pipe($.ngdocs.process())
		.pipe(gulp.dest("docs"));
});

// 개발 TASK
gulp.task("server", [ "less", "express", "livereload", "watch", "open" ]);
gulp.task("build", [ "usemin", "app:dist", "copy", "imgmin" ]);
