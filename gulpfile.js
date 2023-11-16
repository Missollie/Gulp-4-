// Определяем переменную "preprocessor"
let preprocessor = 'sass'; // Выбор препроцессора в проекте - sass или less
//определяем константи gulp
const { src, dest, parallel, series, watch } = require('gulp');
// Подключаем Browsersync
const browserSync = require('browser-sync').create(); 
// Подключаем gulp-concat
const concat = require('gulp-concat');
// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;
// Подключаем модули gulp-sass и gulp-less
const sass = require('gulp-sass')(require('sass'));
const less = require('gulp-less');
// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');
// Подключаем compress-images для работы с изображениями
 const imagecomp = require('compress-images');
// Подключаем модуль gulp-clean (вместо del)
const clean = require('gulp-clean');
// Подключаем модуль gulp-clean-css
const cleancss = require('gulp-clean-css');

// Подключаем Browsersync
function browsersync(){
    browserSync.init({ 	// Подключаем Browsersync
        server: { baseDir: 'app/' }, // Указываем папку сервера
        notify: false, // Отключаем уведомления
        online: true // Режим работы: true или false
    })
}
//Данная функция будет обрабатывать скрипты нашего проекта:
function scripts(){
	return src([
	'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
	'app/js/app.js' // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
]) 
.pipe(concat('app.min.js')) // Конкатенируем в один файл
.pipe(uglify()) // Сжимаем JavaScript
.pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы

}
function startwatch(){
    // Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
    // Мониторим файлы препроцессора на изменения
    watch('app/**/' + preprocessor + '/**/*', styles);
    // Мониторим файлы HTML на изменения
    watch('app/**/*.html').on('change', browserSync.reload);
    
    // Мониторим папку-источник изображений и выполняем images(), если есть изменения
	watch('app/images/src/**/*', images);
}
//функцию styles(), которая будет обрабатывать стили проекта, конкатенировать и сжимать. 
function styles(){
        return src('app/' + preprocessor + '/main.' + preprocessor + '') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
        .pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
        .pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))// Создадим префиксы с помощью Autoprefixer
        .pipe(cleancss( { level: { 1: { specialComments: 0 } } /* , format: 'beautify' */ })) //* , format: 'beautify' Минифицируем стили Также мы видим закомментированный параметр format: 'beautify'. Если мы его раскомментируем, на выходе мы получим не максимально сжатый CSS код, а наоборот, развернутый и читаемый.
        .pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
        .pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}//После выполнения в терминале команды gulp styles будет создан файл стилей проекта «app/css/app.min.css». Если мы поменяем значение переменной preprocessor на less и перезапустим gulp в терминале, то в качестве источника выступит файл «app/less/main.less» и файл будет обработан уже препроцессором Less.

async function images() {
	imagecomp(
		"app/images/src/**/*", // Берём все изображения из папки источника
		"app/images/dest/", // Выгружаем оптимизированные изображения в папку назначения
		{ compress_force: false, statistic: true, autoupdate: true }, false, // Настраиваем основные параметры
		{ jpg: { engine: "mozjpeg", command: ["-quality", "75"] } }, // Сжимаем и оптимизируем изображеня
		{ png: { engine: "pngquant", command: ["--quality=75-100", "-o"] } },
		{ svg: { engine: "svgo", command: "--multipass" } },
		{ gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
		function (err, completed) { // Обновляем страницу по завершению
			if (completed === true) {
				browserSync.reload()
			}
		}
	)
}
//Кроме того при работе с изображениями иногда необходимо очистить всю папку «app/images/dest/» с готовыми картинками. Для этого отлично подойдет модуль gulp-clean. Напишем новую функцию после функции images() с наименованием cleanimg():
function cleanimg() {
	return src('app/images/dest/', {allowEmpty: true}).pipe(clean()) // Удаляем папку "app/images/dest/"
}
//сборка проекта
function buildcopy() {
	return src([ // Выбираем нужные файлы
		'app/css/**/*.min.css',
		'app/js/**/*.min.js',
		'app/images/dest/**/*',
		'app/**/*.html',
		], { base: 'app' }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
}
//Для очистки папки «dist/» можно создать дополнительную функцию cleandist() по аналогии с cleanimg() и добавить ее в таск build для предварительной очистки целевой папки:
function cleandist() {
	return src('dist', {allowEmpty: true}).pipe(clean()) // Удаляем папку "dist/"
}
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
// Экспорт функции images() в таск images
exports.images = images;
exports.cleanimg = cleanimg;
// Создаем новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, buildcopy);
// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(styles, scripts, browsersync, startwatch);



