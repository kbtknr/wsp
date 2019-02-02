const path = require('path');
const prepare = require('./prepare');

module.exports = async function({
  siteConfigPath,
  tmpDir,
  outDir,
  isDebug
}) {
  if (outDir == null) {
    outDir = path.resolve(path.dirname(siteConfigPath), '.dist');
  }

  const site = await prepare(siteConfigPath, tmpDir);
  console.log(site);
}
