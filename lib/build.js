const path = require('path');
const prepare = require('./prepare');
const { createClientConfig, createServerConfig } = require('./webpack');

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

  const inlineLimit = site.config.build && site.config.build.inlineLimit;
  const postcss = site.config.build && site.config.build.postcss;
  const internalDir = site.internalDir;
  const clientConfig = createClientConfig(path.resolve(__dirname, '../app/client-entry.js'), true, false, outDir, internalDir, inlineLimit, postcss);
  const serverConfig = createServerConfig(path.resolve(__dirname, '../app/server-entry.js'), true, false, outDir, internalDir, inlineLimit, postcss);

  const stats = await compile([clientConfig.toConfig(), serverConfig.toConfig()]);

  const serverBundle = require(path.join(outDir, 'manifest/server.json'));
  const clientManifest = require(path.join(outDir, 'manifest/client.json'));

function compile(configs, isDebug) {
  const webpack = require('webpack');
  return new Promise((resolve, reject) => {
    webpack(configs, (err, stats) => {
      if (err) {
        return reject(err);
      }
      if (stats.hasErrors()) {
        stats.toJson().errors.forEach(err => {
          console.error(err)
        });
        reject(new Error(`Failed to compile with errors.`));
        return;
      }
      if (isDebug && stats.hasWarnings()) {
        stats.toJson().warnings.forEach(warning => {
          console.warn(warning)
        })
      }
      resolve(stats.toJson({ modules: false }))
    });
  });
}

