var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    crypto = require('crypto'),
    url = require('url'),
    reworkFunction = require('rework-plugin-function');

module.exports = assets;

function assets(options) {
    options = options || {};
    var srcDir = path.resolve(options.src || '.');
    var destDir = options.dest;
    var fnName = options.func || 'url';
    var onError = options.onError || defaultError;
    var prefix = options.prefix || '';
    var processed = {};

    var fn = {};
    fn[fnName] = process;
    return reworkFunction(fn, false);

    function process(asset) {
        var u = url.parse(asset);
        if (u.protocol || !u.pathname) {
            return original(asset);
        }

        asset = u.pathname;

        var source = this.position && this.position.source;
        var baseDir = source
            ? path.resolve(srcDir, path.dirname(source))
            : srcDir;

        var srcFile = path.join(baseDir, asset);
        if (hasOwn(processed, srcFile)) {
            return destUrl(processed[srcFile], u);
        }

        var contents;
        try {
            contents = fs.readFileSync(srcFile);
        } catch (err) {
            onError(err);
            return original(asset);
        }

        var hash = crypto.createHash('sha1')
            .update(contents)
            .digest('hex')
            .substr(0, 16);

        var name = hash + path.extname(asset);
        var destFile = path.join(destDir, name);
        mkdirp.sync(destDir);
        fs.writeFileSync(destFile, contents);

        processed[srcFile] = name;
        return destUrl(name, u);
    }

    function original(asset) {
        return fnName + '(' + asset + ')';
    }

    function destUrl(name, url) {
        if (url.search) name += url.search;
        if (url.hash) name += url.hash;
        return 'url(' + prefix + name + ')';
    }
}

function defaultError(err) {
    throw err;
}

function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
