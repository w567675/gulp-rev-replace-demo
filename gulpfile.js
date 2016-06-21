var gulp = require('gulp');
var revReplace = require('gulp-rev-replace');
var http = require('http');
var fs = require('fs');
var packageJson = require('./package.json');


/* 写入文件 */
function writeFile(content, callback) {

    // // 把中文转换成字节数组  
    // var arr = iconv.encode(str, 'gbk');  
    // console.log(arr);  

    // 删除旧文件，直接写新文件  
    fs.writeFile('./md5-map.json', content, function(err) {
        if (err)
            console.log("fail " + err);
        else {
            console.log("写入临时文件ok...");
            if (callback && Object.prototype.toString.call(callback) === '[object Function]') {
                callback();
            }

        }
    });
}

/* 读取md5 */
gulp.task('default', function() {

    /* 请求线上地址 */
    http.get(packageJson.md5, function(res) {

        /* 接受数据流 */
        var data = '';
        res.on('data', function(chuck) {
            data += chuck;
        });
        res.on('end', function() {

            /* 写入临时文件 */
            writeFile(data, function() {

                /* 文件源 */
                var manifest = gulp.src('./md5-map.json');

                /* 替换任务 */
                return gulp.src('**/*.php')
                    .pipe(revReplace({
                        manifest: manifest,
                        replaceInExtensions: ['.php', '.jsp']
                    }))
                    .pipe(gulp.dest('./'));
            });
        });
    });

});
