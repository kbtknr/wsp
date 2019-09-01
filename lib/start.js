const http = require('http');
const express = require('express');
const Site = require('./site');

module.exports = async function({ siteConfigPath, isDebug }) {
  const site = new Site(siteConfigPath);
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
    console.log('dev server listening on port 3000!');
  });
};
