const http = require('http');
const express = require('express');
const Site = require('./site');
const middleware = require('./api-server');

module.exports = async function({
  siteConfigPath,
  servePort,
  webapiPort
}) {
  const site = new Site(siteConfigPath);
  site.load();
  await site.readyBuild();

  const siteApp = express();
  site.serve(siteApp);
  const siteServer = http.createServer(siteApp);

  const apiApp = express();
  apiApp.use(middleware(site));
  const apiServer = http.createServer(apiApp);

  siteServer.listen(servePort, () => {
    console.log(`siteServer listening at ${servePort}.`);
  });
  apiServer.listen(webapiPort, () => {
    console.log(`apiServer listening at ${webapiPort}.`);
  });
};
