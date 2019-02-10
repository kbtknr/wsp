const path = require('path');
const wsdutil = require('./wsd-util');

async function finddir(dirname, exts) {
  const entries = [];

  const names = await wsdutil.fsReaddir(dirname)
  for (let i = 0; i < names.length; i++) {
    const name = names[i];

    const pathname = `${dirname}/${name}`
    const stats = await wsdutil.fsStat(pathname);

    const entry = {
      name: name,
      children: null
    };
    if (stats.isDirectory()) {
      entry.children = await finddir(pathname, exts)
    } else {
      const ext = path.extname(name);
      if (exts.indexOf(ext) === -1) {
        continue
      }
    }
    entries.push(entry);
  }
  return entries;
}

module.exports.finddir = finddir;
