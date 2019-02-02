const prepare = require('./prepare');
module.exports = async function(siteConfigPath) {
  await prepare(siteConfigPath);
}

