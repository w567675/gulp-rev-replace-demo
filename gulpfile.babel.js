'use stirct';
import gulp from 'gulp';
import revReplace from 'gulp-rev-replace';
import runSequence from 'run-sequence';
import http from 'http';
import fs from 'fs';
import packageJson from './package.json';

const md5Map = './md5-map.json';
const md5MapRecover = './md5-map-recover.json';

/* 是否有还原的MD5文件 */
let hasRecover = fs.existsSync(md5MapRecover);

let data = '';

/**
 * [writeFile 写入文件]
 * @param  {[string]}   filename [文件路径/文件名]
 * @param  {[string]}   content  [文件内容]
 * @param  {Function} callback [回调]
 */
function writeFile(filename, content, callback) {

    // // 把中文转换成字节数组  
    // let arr = iconv.encode(str, 'gbk');  
    // console.log(arr);  

    // 删除旧文件，直接写新文件  
    fs.writeFile(filename, content, err => {
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


/**
 * [convertKeyValue key，value对换]
 * @param  {[Object]} object [需要转换的对象]
 * @return {[type]}        [转换后的对象]
 */
function convertKeyValue(object) {
    let newObject = {};
    for(let i in object) {
        let key = i;
        let value = object[i];
        let temp;

        // temp = key;
        // key = value;
        // value = temp;
        // /* 结构赋值 */
        [key, value] = [value, key];

        newObject[key] = value;
    }

    return newObject;
}



gulp.task('nomd5', callback => {
    if(!hasRecover) {
        callback();
        return;
    }
    /* 文件源 */
    let manifest = gulp.src(md5MapRecover);

    /* 替换任务 */
    return gulp.src('**/*.php')
        .pipe(revReplace({
            manifest: manifest,
            replaceInExtensions: ['.php', '.jsp']
        }))
        .pipe(gulp.dest('./'));
});


gulp.task('md5', callback => {
    /* 请求线上地址 */
    http.get(packageJson.md5, res => {

        /* 接受数据流 */
        res.on('data', chuck => {
            data += chuck;
        });
        res.on('end', () => {

            /* 写入临时文件 */
            writeFile(md5Map, data, () => {

                /* 文件源 */
                let manifest = gulp.src(md5Map);

                /* 替换任务 */
                gulp.src('**/*.php')
                    .pipe(revReplace({
                        manifest: manifest,
                        replaceInExtensions: ['.php', '.jsp']
                    }))
                    .pipe(gulp.dest('./'));
                callback();
            });
        });
    });
});


/* 修改历史版本的md5文件 */
gulp.task('writeMd5', callback => {
    writeFile(md5MapRecover, JSON.stringify(convertKeyValue(JSON.parse(data))));
    callback();
});




/* 替换md5 */
gulp.task('default', callback => {
    runSequence('nomd5', 'md5', 'writeMd5', callback);
});
