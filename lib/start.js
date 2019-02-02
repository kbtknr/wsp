const prepare = require('./prepare');
module.exports = async function(siteConfigPath) {
  const site = await prepare(siteConfigPath);
  console.log(site);
}
