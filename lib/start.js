const path = require('path');
const http = require('http');

const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const express = require('express');
const api = require('../api');

module.exports = async function({ siteConfigPath, tmpDir, isDebug }) {
  const site = new api.Site(siteConfigPath);
  site.load();
  await site.readyBuild();

  const app = express();
  site.serve(app);
  const server = http.createServer(app);

  ['SIGINT', 'SIGTERM'].forEach(function(sig) {
    process.on(sig, function() {
      server.close(() => {
        site.unreadyBuild();
        process.exit();
      });
    });
  });

  server.listen(3000, () => {
    console.log('dev server listening on port 3000!')
  });
};
