const prepare = require('./prepare');
const { createClientConfig, createServerConfig } = require('./webpack');

module.exports = async function({
  siteConfigPath,
  tmpDir,
  isDebug
}) {
  const site = await prepare(siteConfigPath, tmpDir);
  console.log(site);

  const outDir = 'outdir';
  const inlineLimit = site.config.build && site.config.build.inlineLimit;
  const postcss = site.config.build && site.config.build.postcss;
  const internalDir = `${site.internalDir}`;
  const clientConfig = createClientConfig(path.resolve(__dirname, '../app/client-entry.js'), false, false, outDir, internalDir, inlineLimit, postcss);
}
