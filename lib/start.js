const path = require('path');
const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const express = require('express');
const prepare = require('./prepare');
const { createClientConfig, createServerConfig } = require('./webpack');

module.exports = async function({
  siteConfigPath,
  tmpDir,
  isDebug
}) {
  const site = await prepare(siteConfigPath, tmpDir);
  console.log(site);

  const outDir = path.resolve(site.tmpDir, "dev-dist");
  const inlineLimit = site.config.build && site.config.build.inlineLimit;
  const postcss = site.config.build && site.config.build.postcss;
  const internalDir = `${site.internalDir}`;
  const clientConfig = createClientConfig(path.resolve(__dirname, '../app/client-entry.js'), false, false, outDir, internalDir, inlineLimit, postcss);

  clientConfig.plugin('html').use(require('html-webpack-plugin'), [{
    filename: 'index.html',
    template: path.resolve(__dirname, 'index.dev.html')
  }]);

  const config = clientConfig.toConfig()
  const compiler = webpack(config);
  const app = express();
  app.use(middleware(compiler, {
    // webpack-dev-middleware options
    // publicPath: path.resolve(__dirname, 'dist'),
    publicPath: config.output.publicPath,
    logLevel: 'debug',
    index: 'index.html'
  }));
  app.use('*', function (req, res) {
    const filename = path.join(compiler.outputPath, 'index.html');
    compiler.outputFileSystem.readFile(filename, function(err, result){
      if (err) {
        res.status(500);
        res.end();
        return;
      }
      res.set('content-type','text/html');
      res.send(result);
      res.end();
    });
  });
  app.listen(3000, () => console.log('dev server listening on port 3000!'))
}
