const path = require('path');
const webpack = require('webpack');
const fs = require('fs-extra');
const Site = require('./site');

module.exports = async function({ siteConfigPath, tmpDir, outDir, isDebug }) {
  if (outDir == null) {
    outDir = path.join(path.dirname(siteConfigPath), '.dist');
  }
  outDir = path.resolve(outDir);

  const site = new Site(siteConfigPath);
  site.load();
  await site.readyBuild();

  site.on('webpack-errors', (stats) => {
    stats.toJson().errors.forEach(err => {
      console.error(err);
    });
  });
  site.on('webpack-warnings', (stats) => {
    stats.toJson().warnings.forEach(warning => {
      console.warn(warning);
    });
  });

  site.on('rendering-error', (pathname, e) => {
    console.error(`Error rendering page '${pathname}'`, e);
  });
  site.on('rendering-page', (pathname, outFile) => {
    console.log(`renderPage(${pathname}) => ${outFile}`);
  });

  await site.build(outDir, isDebug);
  await site.unreadyBuild();
};
