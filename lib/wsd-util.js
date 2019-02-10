const fs = require('fs');

module.exports.fsReaddir = async function(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        reject(err);
      }
      resolve(files);
    });
  });
}

module.exports.fsStat = async function(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err);
      }
      resolve(stats);
    });
  });
}

module.exports.fsMkdir = async function(path, options) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, options, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

module.exports.fsWriteFile = async function(file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

module.exports.ensureDir = async function(path) {
  return Promise.resolve()
    .then(() => module.exports.fsStat(path))
    .then((stat) => {
      if (stat.isDirectory()) {
        return Promise.resolve()
      }
      return Promise.reject(new Error(`path '${path} is not directory`));
    }, (err) => {
      if (err.code === 'ENOENT') {
        return module.exports.fsMkdir(path, {
          recursive: true
        });
      }
      return Promise.reject(err);
    });
}
