const prepare = require('./prepare');
module.exports = async function({
  siteConfigPath,
  tmpDir,
  isDebug
}) {
  const site = await prepare(siteConfigPath, tmpDir);
  console.log(site);
}
