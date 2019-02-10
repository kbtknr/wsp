const path = require('path');
const wsdutil = require('./wsd-util');

async function finddir(path) {
  const entries = [];

  const names = await wsdutil.fsReaddir(path)
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const pathname = `${path}/${name}`
    const stats = await wsdutil.fsStat(pathname);

    const entry = {
      name: name,
      children: null
    };
    if (stats.isDirectory()) {
      entry.children = await finddir(pathname)
    }
    entries.push(entry);
  }
  return entries;
}

module.exports.finddir = finddir;
