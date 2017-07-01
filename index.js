var R = require('ramda');
var P = require('bluebird-promisell');
var PS = require('path');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var mkdirp = Promise.promisify(require('mkdirp'));
var execAsync = Promise.promisify(require('child_process').exec);
var streamToPromise = require('stream-to-promise');

// Path -> Promise Bool
exports.folderExist = function(folder) {
  console.log('[folderExist]', folder);
  return fs.statAsync(folder).then(R.always(true)).catch(R.always(false));
};

// Path -> Promise void
exports.mkdirpIfNotExist = function(folder) {
  console.log('[mkdirIfNotExist] [exist?]', folder);
  // Promise Bool
  var existP = exports.folderExist(folder);
  return existP.then(function(exist) {
  console.log('[mkdirIfNotExist] [exist?] - ', exist);
    if (!exist) {
      console.log('[mkdirIfNotExist] [mkdir] ', folder);
      return mkdirp(folder);
    }
  });
};

// FilePath -> FilePath -> Promise void
exports.mv = function(oldPath, newPath) {
  console.log('[mv]', oldPath, newPath);
  return fs.renameAsync(oldPath, newPath);
};

// FileName -> Bool
var hiddenFile = R.pipe(R.head, R.equals('.'));

// FilePath -> Promise [FilePath]
exports.listFiles = function(path) {
  console.log('[listFiles]', path);
  var filesP = fs.readdirAsync(path);
  var photosP = P.liftp1(R.reject(hiddenFile))(filesP);
  return P.liftp(P.traversep(function(photo) {
    return PS.join(path, photo);
  }))(photosP);
};

// Path -> Promise void
exports.rmrfdir = function(path) {
  console.log('[rmrfdir]', path);
  return execAsync('rm -rf ' + path);
};

// Path -> Promise void
exports.rmThenMk = function(path) {
  return exports.rmrfdir(path).then(function() {
    return exports.mkdirpIfNotExist(path);
  });
};

// Path -> Promise void
exports.del = function(filepath) {
  console.log('[del]', filepath);
  return fs.unlinkAsync(filepath);
};

// FilePath -> FilePath -> Promise void
exports.cp = function(from, to) {
  console.log('[cp]', from, to);
  return exports.writeStreamTo(fs.createReadStream(PS.resolve(from)), to);
};

// Stream -> FilePath -> Promise void
exports.writeStreamTo = function(stream, to) {
  console.log('[writeStreamTo]', to);
  return streamToPromise(stream.pipe(fs.createWriteStream(PS.resolve(to))));
};

// Date -> FilePath -> Promise void
exports.setLastModDate = function(date, filePath) {
  console.log('[setLastModDate]', date, filePath);
  return fs.utimesAsync(filePath, date, date);
};

// Buffer | String -> FilePath -> Promise void
exports.mkdirpThenWriteFile = function(file, filepath) {
  var dirname = PS.dirname(filepath);
  return exports.mkdirpIfNotExist(dirname)
  .then(function() {
    return fs.writeFileAsync(file, filepath);
  });
};
