const fs = require('fs-extra');
const path = require('path');

class Pages {
  constructor(rootdir) {
    this.rootdir = rootdir;
    this.root = null;
  }

  async prepare(exts) {
    const finddir = async dirname => {
      const entries = [];
      const names = await fs.readdir(dirname);
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const pathname = path.join(dirname, name);
        const stats = await fs.stat(pathname);

        const entry = {
          name,
          children: null,
        };
        if (stats.isDirectory()) {
          entry.children = await finddir(pathname);
        } else {
          const ext = path.extname(name);
          if (exts.indexOf(ext) === -1) {
            continue;
          }
        }
        entries.push(entry);
      }
      return entries;
    };

    this.root = finddir(this.rootdir);
  }
}

/**
 * entry = {
 *   name,
 *   children: [
 *     entries...
 *   ],
 * }
 */
async function finddir(dirname, exts) {
  const entries = [];

  const names = await fs.readdir(dirname);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];

    const pathname = path.join(dirname, name);
    const stats = await fs.stat(pathname);

    const entry = {
      name: name,
      children: null,
    };
    if (stats.isDirectory()) {
      entry.children = await finddir(pathname, exts);
    } else {
      const ext = path.extname(name);
      if (exts.indexOf(ext) === -1) {
        continue;
      }
    }
    entries.push(entry);
  }
  return entries;
}

module.exports.finddir = finddir;
