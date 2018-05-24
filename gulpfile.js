//Автоматизация на Gulp + Less
var gulp = require("gulp"); //Подключаем Gulp инструмент автоматизации
var less = require("gulp-less"); //Подключаем Less препроцессор
var plumber = require("gulp-plumber"); //Плагин, отвечающий за мониторинг ошибок, не останавливает сервер
var postcss = require("gulp-postcss"); //Постобработка css, подключает доп. плагины
var autoprefixer = require("autoprefixer"); //Автопрефексы для браузеров (-webkit-, -ms-, -moz- и т.д.)
var posthtml = require("gulp-posthtml"); //Плагин препроцессор HTML
var include = require("posthtml-include"); //Плагин для работы include в posthtml
var minify = require("gulp-csso"); //Плагин минификации css
var imagemin = require("gulp-imagemin"); //Плагин минификации изображения
var webp = require("gulp-webp"); //Плагин конвертации изображения в webp
var svgstore = require("gulp-svgstore"); //Плагин для создания спрайтов
var rename = require("gulp-rename"); //Плагин изменения имени css
var server = require("browser-sync").create(); //Запуск сервера
var del = require("del"); //Плагин удаления
var run = require("run-sequence"); //Плагин для запуска всех задач последовательно

gulp.task("style", function () { //Запускаем задачу под названием style
	gulp.src("less/style.less") //Передаем файл с которым будет работа
		//pipe - передача данных от одного метода к другому
		.pipe(plumber()) //Мониторит ошибки
		.pipe(less()) //Преобразует less в css
		.pipe(postcss([ //Плагин postcss
			autoprefixer() //Передача для postcss плагина автопрефексера
		]))
		.pipe(gulp.dest("build/css")); //Выкидывает готовый файл в папку css
		.pipe(minify()) //После проходки и создания css минифицирует с помощью ccso
		.pipe(rename("style.min.css")) //Переименование минифицированного css
		.pipe(gulp.dest("build/css")); //Выходит уже минифицированный файл
		.pipe(server.stream()); //Сообщает об обновлении
});

gulp.task("images", function () { //Запускаем задачу минификатора изображения
	return gulp.src("img/**/*.{png,jpg,svg}") //С какими файлами работаем
		.pipe(imagemin([ //Запуск плагина
			imagemin.optipng({optimizationLevel: 3}), //Минификатор png, уровень сжатия 3(оптимально безопасный)
			imagemin.jpegtran({progressive: true}), //Минификатор jpg, прогрессивный
			imagemin.svgo() //Минификатор svg 
		]))
		.pipe(gulp.dest("build/img")); //Ложит файлы в папку img
});

gulp.task("webp", function () { //Запускаем задачу для плагина webp
	return gulp.src("img/**/*.{png,jpg}") //Берем изображения в формате png, jpg
		.pipe(webp({quality: 90})) //Степень сжатия 90, безопасная
		.pipe(gulp.dest("build/img")); //Скидыывает готовые файлы в img
});

gulp.task("sprite", function () { //Запускаем задачу для создания спрайтов
	return gulp.src("img/icon-*.svg") //Берет всё файлы из папки img, которые начинаются на icon- с расширением svg
		.pipe(svgstore({ //Плагин запускается
			inlineSvg: true //Удаляет из файла лишние символы
		}))
		.pipe(rename("sprite.svg")) //Переименовывает в sprite.svg
		.pipe(gulp.dest("build/img")); //Ложит в папку img
});

gulp.task("html", function () { //Запускаем задачу для posthtml
	return gulp.src("*.html") //Находим все файлы с расширением html
		.pipe(posthtml([ //Передача файла в плагин
			include()	//Везде где нужно добавить спрайт svg надо добавить строку <div><include src=build/img/sprite.svg></div>	
		])) 
		.pipe(gulp.dest("build")); //Назначаем для сохранение измененного файла ту же папку откуда взяли файл
});

gulp.task("serve", function () { //Задача запускается когда пишем команду npm start
	server.init({ //
		server: "build/" //Указывается где лежит Index.html (там где находимся)
	});
	gulp.watch("less/**/*.less", ["style"]); //Следят за изменением файлов. Путь, где лежат файлы, за которыми следим (** - заходим в папки в папке less)
	gulp.watch("*.html", ["html"]) //Следит за html файлами, для обновления разметки
});

gulp.task("build", function(done) { //Запускаем задачу плагина run-sequence
	run("style", "sprite", "html", done); //В скобках задаем какие задачи надо выполнить последовательно
});

gulp.task("copy", function () { //Перенос готового проекта в нужную папку
	return gulp.src([ //Берем все файлы из папок ниже
		"fonts/**/*.{woff,woff2}",
		"img/**",
		"js/**"
	], {
	base: "." //Создает папки в финальном проекта как в изначальной папки, откуда копируем
	})
	.pipe(gulp.dest("build")); //Ложит все файлы в папку build
});

gulp.task("clean", function() { //Удаление папки 
	return del("build"); //Удаление папки build
});

gulp.task("build", function (done) { //Последовательный запуск всех задач
	run(
		"clean",
		"copy",
		"style",
		"sprite",
		"html",
		done
	);
});